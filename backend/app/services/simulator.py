"""Simulation engine — with optional on-ramp skip for USDC direct transfers."""

import hashlib
import uuid


def _mock_tx_hash(path_id: str, step_num: int, salt: str = "") -> str:
    raw = f"{path_id}:{step_num}:{salt}"
    return "0x" + hashlib.sha256(raw.encode()).hexdigest()[:16]


def simulate(path: dict, amount: float, skip_on_ramp: bool = False, skip_off_ramp: bool = False) -> dict:
    """Generate simulated transaction steps.

    skip_on_ramp=True  → USDC from wallet, no USD→USDC conversion.
    skip_on_ramp=False → Full flow with on-ramp deposit + conversion.
    """
    sim_id = f"sim_{uuid.uuid4().hex[:8]}"
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    path_id = path["id"]
    on = path["on_ramp"]
    net = path["network"]
    off = path["off_ramp"]

    steps = []
    offset = 0
    step_num = 0

    if skip_on_ramp:
        # USDC already in user wallet — skip on-ramp
        on_fee, on_spread, on_time = 0.0, 0.0, 0
        usdc_amount = amount
    else:
        on_fee, on_spread, on_time = on["fee_usd"], on["spread_usd"], on["time_minutes"]

        # Step: USD Deposit
        step_num += 1
        steps.append({
            "step_number": step_num, "phase": "on_ramp",
            "name": f"USD Deposit to {on['provider']}", "status": "completed",
            "timestamp_offset_minutes": offset, "duration_minutes": on_time,
            "details": {
                "from": "User Bank Account", "to": f"{on['provider']} USD Wallet",
                "amount_usd": amount, "cost_usd": round(on_fee + on_spread, 2),
                "tx_hash": _mock_tx_hash(path_id, step_num, "deposit"),
            },
        })
        offset += on_time

        # Step: USD → USDC (mint or buy, depending on provider)
        step_num += 1
        usdc_amount = round(round(amount, 2) - on_fee - on_spread, 2)
        is_issuer = "Circle" in on["provider"]
        steps.append({
            "step_number": step_num, "phase": "on_ramp",
            "name": (
                f"Circle Mints {usdc_amount} USDC → Your Wallet"
                if is_issuer else
                f"{on['provider']} Buys USDC → Your Wallet"
            ),
            "status": "completed",
            "timestamp_offset_minutes": offset, "duration_minutes": 1,
            "details": {
                "from": f"{on['provider']} USD Balance",
                "to": "Your Wallet",
                "amount_usd": amount,
                "usdc_received": usdc_amount,
                "rate": "1:1",
                "method": "Mint (on-chain)" if is_issuer else "Buy (exchange)",
                "tx_hash": _mock_tx_hash(path_id, step_num, "convert"),
            },
        })
        offset += 1

    # Step: Network transfer
    after_gas = round(round(usdc_amount, 2) - round(net["gas_fee_usd"], 4), 2)
    step_num += 1
    recipient = "Recipient Wallet" if skip_off_ramp else f"{off['provider']} USDC Wallet"
    steps.append({
        "step_number": step_num, "phase": "network",
        "name": f"Transfer USDC via {net['name']} Network", "status": "completed",
        "timestamp_offset_minutes": offset, "duration_minutes": net["time_minutes"],
        "details": {
            "from": "Your Wallet",
            "to": recipient,
            "network": net["name"], "layer": net["layer"],
            "gas_fee_usd": net["gas_fee_usd"],
            "amount_usdc": after_gas,
            "tx_hash": _mock_tx_hash(path_id, step_num, "bridge"),
        },
    })
    offset += net["time_minutes"]

    if skip_off_ramp:
        # Wallet: USDC arrives directly — no conversion, no bank
        total_fee = round(round(on_fee, 2) + round(on_spread, 2) + round(net["gas_fee_usd"], 4), 2)
        off_fee, off_spread, off_time = 0.0, 0.0, 0
    else:
        # Bank: off-ramp conversion + settlement
        # Step: Transfer to off-ramp
        step_num += 1
        steps.append({
            "step_number": step_num, "phase": "off_ramp",
            "name": f"USDC Received by {off['provider']}", "status": "completed",
            "timestamp_offset_minutes": offset, "duration_minutes": 1,
            "details": {
                "from": f"{net['name']} Network", "to": f"{off['provider']} USDC Wallet",
                "amount_usdc": after_gas, "cost_usd": off["fee_usd"],
                "tx_hash": _mock_tx_hash(path_id, step_num, "offramp"),
            },
        })
        offset += 1

        # Step: USDC → local currency
        step_num += 1
        steps.append({
            "step_number": step_num, "phase": "off_ramp",
            "name": f"Convert USDC to {off['currency']} on {off['provider']}", "status": "completed",
            "timestamp_offset_minutes": offset, "duration_minutes": off["time_minutes"],
            "details": {
                "from": f"{off['provider']} USDC Wallet",
                "to": f"{off['provider']} {off['currency']} Wallet",
                "usdc_amount": round(round(after_gas, 2) - round(off["fee_usd"], 2), 2),
                "local_received": off["received_local"],
                "exchange_rate": off["exchange_rate"],
                "cost_usd": round(off["fee_usd"] + off["spread_usd"], 2),
                "tx_hash": _mock_tx_hash(path_id, step_num, "convert"),
            },
        })
        offset += off["time_minutes"]

        # Step: Settlement
        step_num += 1
        steps.append({
            "step_number": step_num, "phase": "off_ramp",
            "name": f"Settle {off['currency']} to Destination Bank", "status": "completed",
            "timestamp_offset_minutes": offset, "duration_minutes": 2,
            "details": {
                "from": f"{off['provider']} {off['currency']} Wallet",
                "to": "Recipient Bank Account",
                "amount": off["received_local"], "method": off["method"],
                "tx_hash": _mock_tx_hash(path_id, step_num, "settle"),
            },
        })
        offset += 2

        total_fee = round(
            round(on_fee, 2) + round(on_spread, 2) + round(net["gas_fee_usd"], 4) +
            round(off["fee_usd"], 2) + round(off["spread_usd"], 2), 2)
        off_fee, off_spread, off_time = off["fee_usd"], off["spread_usd"], off["time_minutes"]

    return {
        "simulation_id": sim_id, "transaction_id": tx_id, "status": "completed",
        "path_snapshot": path, "steps": steps,
        "summary": {
            "total_fee_usd": total_fee, "total_time_minutes": offset,
            "final_amount_local": after_gas if skip_off_ramp else off["received_local"],
            "local_currency": "USDC" if skip_off_ramp else off["currency"],
            "usd_equivalent_received": after_gas if skip_off_ramp else round(off["received_local"] / off["exchange_rate"], 2),
            "effective_exchange_rate": 1.0 if skip_off_ramp else off["exchange_rate"],
            "value_loss_pct": round((total_fee / amount) * 100, 2),
        },
    }
