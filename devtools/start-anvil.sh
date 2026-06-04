#!/usr/bin/env bash
# Start Anvil local fork of Base Sepolia for PayPilot-AI development
set -e

ANVIL_RPC="${ANVIL_RPC:-https://sepolia.base.org}"
ANVIL_PORT="${ANVIL_PORT:-8545}"
ANVIL_CHAIN_ID="${ANVIL_CHAIN_ID:-84532}"

# Locate anvil binary
ANVIL=""
if command -v anvil &>/dev/null; then
    ANVIL="anvil"
elif [ -x "$HOME/.foundry/bin/anvil" ]; then
    ANVIL="$HOME/.foundry/bin/anvil"
else
    echo "Error: anvil not found."
    echo "Install Foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup"
    exit 1
fi

echo "=== PayPilot-AI Dev Anvil ==="
echo "Fork URL:    $ANVIL_RPC"
echo "Chain ID:    $ANVIL_CHAIN_ID"
echo "Port:        $ANVIL_PORT"
echo "Dev Wallet:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10,000 ETH)"
echo ""

$ANVIL \
    --fork-url "$ANVIL_RPC" \
    --chain-id "$ANVIL_CHAIN_ID" \
    --port "$ANVIL_PORT"
