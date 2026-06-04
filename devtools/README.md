# PayPilot-AI Dev Tools

## Anvil Local Fork

Anvil (part of Foundry) runs a local fork of Base Sepolia for development.

**Why:**
- Default accounts come with 10,000 ETH — no faucet needed
- Instant transaction confirmation, no network dependency
- Identical contracts and state as real Base Sepolia

### Install Foundry (includes Anvil)

```bash
curl -L https://foundry.paradigm.xyz | bash
```

After installation, open a new terminal or run `source ~/.bashrc`, then:

```bash
foundryup
```

### Start Anvil

**Option 1: Use the script**

```bash
# Default: fork Base Sepolia on port 8545
./devtools/start-anvil.sh

# Custom config
ANVIL_PORT=9545 ./devtools/start-anvil.sh
```

**Option 2: Direct command**

```bash
anvil --fork-url https://sepolia.base.org --chain-id 84532
```

Keep the terminal running. Example output:

```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000.000000000000000000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000.000000000000000000 ETH)
...
```

### Configure Frontend

Set in `frontend/.env`:

```
VITE_LOCAL_RPC=http://localhost:8545
```

Comment out this line to switch back to real Base Sepolia.

### Development Workflow

**Terminal 1** — Keep Anvil running:
```bash
./devtools/start-anvil.sh
```

**Terminal 2** — Start the frontend:
```bash
cd frontend && npm run dev
```

Sign & send operations now run on local Anvil. Dev wallet (Account 0) has 10,000 ETH — more than enough for all gas fees.
