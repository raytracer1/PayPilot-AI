"""Simulation engine — generates step-by-step transaction timeline.

No real funds are moved. All hashes and timestamps are deterministic mock data.
"""

import hashlib
import uuid
from datetime import datetime, timezone


def _mock_tx_hash(path_id: str, step_num: int, salt: str = "") -> str:
    """Generate deterministic mock transaction hash."""
    raw = f"{path_id}:{step_num}:{salt}"
    return "0x" + hashlib.sha256(raw.encode()).hexdigest()[:16]


def simulate(path: dict, amount_usd: float) -> dict:
    """Generate a simulated transaction with step-by-step timeline.

    Args:
        path: The selected path dict (on_ramp + network + off_ramp).
        amount_usd: Original USD amount.

    Returns:
        Dict with simulation_id, transaction_id, status, steps, and summary.
    """
    sim_id = f"sim_{uuid.uuid4().hex[:8]}"
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    path_id = path["id"]

    on = path["on_ramp"]
    net = path["network"]
    off = path["off_ramp"]

    steps = []
    offset = 0  # cumulative minutes

    # Step 1: USD deposit to on-ramp
    steps.append({
        "step_number": 1,
        "phase": "on_ramp",
        "name": f"USD Deposit to {on['provider']}",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": on["time_minutes"],
        "details": {
            "from": "User Bank Account",
            "to": f"{on['provider']} USD Wallet",
            "amount_usd": amount_usd,
            "fee_usd": on["fee_usd"],
            "tx_hash": _mock_tx_hash(path_id, 1, "deposit"),
        },
    })
    offset += on["time_minutes"]

    # Step 2: USD → USDC conversion
    usdc_received = round(amount_usd - on["fee_usd"] - on["spread_usd"], 2)
    steps.append({
        "step_number": 2,
        "phase": "on_ramp",
        "name": f"Convert USD to USDC on {on['provider']}",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": 1,
        "details": {
            "from": f"{on['provider']} USD Wallet",
            "to": f"{on['provider']} USDC Wallet",
            "amount_usd": round(amount_usd - on["fee_usd"], 2),
            "usdc_received": usdc_received,
            "spread_usd": on["spread_usd"],
            "spread_pct": on["spread_pct"],
            "exchange_rate": 1.0,
            "tx_hash": _mock_tx_hash(path_id, 2, "convert"),
        },
    })
    offset += 1

    # Step 3: Network transfer / bridge
    steps.append({
        "step_number": 3,
        "phase": "network",
        "name": f"Transfer USDC via {net['name']} Network",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": net["time_minutes"],
        "details": {
            "from": f"{on['provider']} USDC Wallet",
            "to": f"Self-Custody {net['name']} USDC",
            "network": net["name"],
            "layer": net["layer"],
            "gas_fee_usd": net["gas_fee_usd"],
            "confirmations": 12 if net["layer"] == "L2" else 32,
            "tx_hash": _mock_tx_hash(path_id, 3, "bridge"),
        },
    })
    offset += net["time_minutes"]

    # Step 4: Transfer USDC to off-ramp
    steps.append({
        "step_number": 4,
        "phase": "off_ramp",
        "name": f"Transfer USDC to {off['provider']}",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": 1,
        "details": {
            "from": f"Self-Custody {net['name']} USDC",
            "to": f"{off['provider']} USDC Wallet",
            "amount": round(usdc_received - net["gas_fee_usd"], 2),
            "fee_usd": off["fee_usd"],
            "tx_hash": _mock_tx_hash(path_id, 4, "offramp"),
        },
    })
    offset += 1

    # Step 5: USDC → local currency conversion
    steps.append({
        "step_number": 5,
        "phase": "off_ramp",
        "name": f"Convert USDC to {off['currency']} on {off['provider']}",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": off["time_minutes"],
        "details": {
            "from": f"{off['provider']} USDC Wallet",
            "to": f"{off['provider']} {off['currency']} Wallet",
            "usdc_amount": round(usdc_received - net["gas_fee_usd"] - off["fee_usd"], 2),
            "local_received": off["received_local"],
            "exchange_rate": off["exchange_rate"],
            "spread_pct": off["spread_pct"],
            "spread_usd": off["spread_usd"],
            "tx_hash": _mock_tx_hash(path_id, 5, "convert"),
        },
    })
    offset += off["time_minutes"]

    # Step 6: Settlement to bank
    steps.append({
        "step_number": 6,
        "phase": "off_ramp",
        "name": f"Settle {off['currency']} to Destination Bank",
        "status": "completed",
        "timestamp_offset_minutes": offset,
        "duration_minutes": 2,
        "details": {
            "from": f"{off['provider']} {off['currency']} Wallet",
            "to": "Recipient Bank Account",
            "amount": off["received_local"],
            "method": off["method"],
            "tx_hash": _mock_tx_hash(path_id, 6, "settle"),
        },
    })
    offset += 2

    total_fee = round(
        on["fee_usd"] + on["spread_usd"]
        + net["gas_fee_usd"]
        + off["fee_usd"] + off["spread_usd"],
        2,
    )

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
            "value_loss_pct": round((total_fee / amount_usd) * 100, 2),
        },
    }
