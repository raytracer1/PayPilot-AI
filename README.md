# PayPilot AI v2

**AI-Powered Cross-Border Payment Routing Engine for LATAM Remittances**

PayPilot AI evaluates on-ramps, L2 networks, and off-ramps to find the optimal path for sending USD to Latin America as USDC-based remittances. It optimizes for cost, speed, and regulatory risk — all in a simulated hackathon demo environment.

> 🧪 **Demo Only.** All data is simulated. No real funds are transferred. Not financial advice.

---

## Features

- **Multi-path Analysis** — Evaluates 4 on-ramps × 3 L2 networks × 2 off-ramps = 24+ routing combinations per destination
- **AI Routing Engine** — Weighted multi-factor scoring (cost, speed, risk, reliability) with user-tunable preferences
- **Risk Scoring** — 1–5 scale covering regulatory compliance, network congestion, and exchange liquidity
- **Interactive Flowchart** — D3.js visualization of the USD → On-Ramp → USDC → Network → Off-Ramp → Local Currency flow
- **Transaction Simulation** — Block-explorer-style step-by-step timeline with mock transaction hashes
- **6 LATAM Destinations** — Mexico, Brazil, Argentina, Colombia, Chile, Peru
- **Dark/Light Mode** — Full theme support with localStorage persistence

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + D3.js |
| Backend | Python FastAPI + SQLAlchemy + SQLite |
| AI Engine | Weighted multi-factor optimization (no external LLM required) |
| Icons | Lucide React |

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

Backend starts at **http://localhost:8000**.

API docs: **http://localhost:8000/docs**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:5173**.

The Vite dev server proxies `/api` requests to the backend.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/quote` | Submit transfer request → returns 5 ranked routing paths |
| `POST` | `/api/simulate` | Run simulated transaction on a chosen path |
| `GET` | `/api/transactions` | List past simulated transactions |
| `GET` | `/api/transactions/{id}` | Full details of a transaction with steps |
| `GET` | `/api/info/onramps` | Available on-ramp providers |
| `GET` | `/api/info/networks` | Available L2 networks |
| `GET` | `/api/info/countries` | Supported destination countries |
| `GET` | `/health` | Health check |

### Example: Get a Quote

```bash
curl -X POST http://localhost:8000/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "amount_usd": 500,
    "destination_country": "MX",
    "speed_preference": "balanced"
  }'
```

### Example: Simulate a Transaction

```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "path_id": "path_coinbase_solana_bitso",
    "amount_usd": 500
  }'
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + TS)                 │
│  QuoteForm → ResultsPanel → PathCard → SimulationPanel  │
│                      ↕ API calls                        │
├─────────────────────────────────────────────────────────┤
│                  Backend (FastAPI)                       │
│  /api/quote  │  /api/simulate  │  /api/transactions     │
│       ↓              ↓                                     │
│  Path Analyzer → AI Router → Simulator                  │
│       ↓              ↓              ↓                    │
│  Mock Data (on-ramps, networks, off-ramps)              │
│                    SQLite DB                             │
└─────────────────────────────────────────────────────────┘
```

---

## AI Routing Algorithm

The routing engine uses a weighted multi-factor scoring model:

| Dimension | Formula |
|---|---|
| **Cost** | `max(0, 100 − (fee_pct / 5) × 100)` |
| **Speed** | `100 × e^(−0.04 × total_minutes)` |
| **Risk** | Inverted 1–5 average of regulatory, congestion, and liquidity sub-scores |
| **Reliability** | Weighted avg of provider ratings and network reliability |

**User-preference weights:**

| | Cost | Speed | Risk | Reliability |
|---|---|---|---|---|
| Fast | 15% | 50% | 20% | 15% |
| Cheapest | 50% | 15% | 20% | 15% |
| Balanced | 25% | 25% | 25% | 25% |

All 24+ path combinations are scored, filtered by time limits, and the top 5 are returned.

---

## Mock Data

All data is simulated with small random jitter for realism:

- **4 On-ramps:** Coinbase (ACH), Binance (Wire), MoonPay (Debit Card), Transak (Credit Card)
- **3 Networks:** Base, Polygon, Solana — with live-feeling gas fee simulation
- **6 Countries:** MX, BR, AR, CO, CL, PE — each with 2 local off-ramp providers and real-time exchange rates

---

## Project Structure

```
PayPilot-AI/
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── run.py
│   └── app/
│       ├── main.py              # FastAPI app factory
│       ├── config.py            # Pydantic Settings
│       ├── database.py          # SQLAlchemy setup
│       ├── models/              # ORM models (Transaction, Quote)
│       ├── schemas/             # Pydantic request/response schemas
│       ├── routers/             # API route handlers
│       ├── services/
│       │   ├── mock_data/       # On-ramp, network, off-ramp mock data
│       │   ├── path_analyzer.py # Combines all possible paths
│       │   ├── risk_scorer.py   # 1-5 risk scoring
│       │   ├── routing_engine.py# AI scoring + ranking
│       │   └── simulator.py     # Transaction simulation engine
│       └── utils/constants.py   # Country data
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx              # Main app with routing/state
        ├── types/api.ts         # All TypeScript interfaces
        ├── api/client.ts        # Fetch wrapper
        ├── hooks/               # useQuote, useSimulate, useHistory
        ├── context/             # ThemeContext
        ├── components/
        │   ├── Layout/          # Header, Footer, Disclaimer
        │   ├── Form/            # QuoteForm + inputs
        │   ├── Results/         # ResultsPanel, PathCard, Flowchart
        │   ├── Simulation/      # SimulationPanel, Timeline, Chart
        │   └── History/         # HistoryPanel, TransactionRow
        └── utils/               # Format helpers, constants
```

---

## Hackathon Notes

- All monetary amounts are simulated
- No external API keys required
- SQLite database is created automatically at startup
- LLM extension point is available (`PAYPILOT_LLM_API_KEY` env var) but disabled by default
- Disclaimers are shown at the top, in the footer, and on simulation results

---

## License

MIT — Hackathon Project
