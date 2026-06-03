"""Simulation engine — non-custodial: USDC flows directly from user wallet."""

import hashlib
import uuid


def _mock_tx_hash(path_id: str, step_num: int, salt: str = "") -> str:
    raw = f"{path_id}:{step_num}:{salt}"
    return "0x" + hashlib.sha256(raw.encode()).hexdigest()[:16]


def simulate(path: dict, amount_usdc: float) -> dict:
    """Generate simulated transaction steps starting from user wallet USDC.

    Non-custodial flow:
      User Wallet (USDC) → L2 transfer → Off-ramp exchange → Local fiat → Bank
    """
    sim_id = f"sim_{uuid.uuid4().hex[:8]}"
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    path_id = path["id"]

    net = path["network"]
    off = path["off_ramp"]

    steps = []
    offset = 0  # cumulative minutes

    # Step 1: USDC transfer from user wallet via L2
    after_gas = round(amount_usdc - net["gas_fee_usd"], 2)
    steps.append({
        "step_number": 1,
        "phase": "network",
        "name": f"Send USDC via {net['name']}",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": net["time_minutes"],
        "details": {
            "from": "Your Wallet",
            "to": f"{off['provider']} USDC Deposit",
            "amount_usdc": amount_usdc,
            "network": net["name"],
            "layer": net["layer"],
            "gas_fee_usd": net["gas_fee_usd"],
            "tx_hash": _mock_tx_hash(path_id, 1, "transfer"),
        },
    })
    offset += net["time_minutes"]

    # Step 2: USDC arrives at off-ramp exchange
    steps.append({
        "step_number": 2,
        "phase": "off_ramp",
        "name": f"USDC Received by {off['provider']}",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": 1,
        "details": {
            "from": f"{net['name']} Network",
            "to": f"{off['provider']} USDC Wallet",
            "amount_usdc": after_gas,
            "confirmations": 12 if net["layer"] == "L2" else 32,
            "tx_hash": _mock_tx_hash(path_id, 2, "arrive"),
        },
    })
    offset += 1

    # Step 3: USDC → local currency conversion
    after_fee = round(after_gas - off["fee_usd"], 2)
    steps.append({
        "step_number": 3,
        "phase": "off_ramp",
        "name": f"Convert USDC to {off['currency']}",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": off["time_minutes"],
        "details": {
            "from": f"{off['provider']} USDC Wallet",
            "to": f"{off['provider']} {off['currency']} Wallet",
            "usdc_amount": after_fee,
            "local_received": off["received_local"],
            "exchange_rate": off["exchange_rate"],
            "spread_pct": off["spread_pct"],
            "spread_usd": off["spread_usd"],
            "fee_usd": off["fee_usd"],
            "tx_hash": _mock_tx_hash(path_id, 3, "convert"),
        },
    })
    offset += off["time_minutes"]

    # Step 4: Settlement to destination bank
    steps.append({
        "step_number": 4,
        "phase": "off_ramp",
        "name": f"Send {off['currency']} to Recipient",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": 2,
        "details": {
            "from": f"{off['provider']} {off['currency']} Wallet",
            "to": "Recipient Bank Account",
            "amount": off["received_local"],
            "method": off["method"],
            "tx_hash": _mock_tx_hash(path_id, 4, "settle"),
        },
    })
    offset += 2

    total_fee = round(net["gas_fee_usd"] + off["fee_usd"] + off["spread_usd"], 2)

    return {
        "simulation_id": sim_id,
        "transaction_id": tx_id,
        "status": "completed",
        "path_snapshot": path,
        "steps": steps,
        "summary": {
            "total_fee_usd": total_fee,
            "total_time_minutes": offset,
            "final_amount_local": off["received_local"],
            "local_currency": off["currency"],
            "usd_equivalent_received": round(off["received_local"] / off["exchange_rate"], 2),
            "effective_exchange_rate": off["exchange_rate"],
            "value_loss_pct": round((total_fee / amount_usdc) * 100, 2),
        },
    }
