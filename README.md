# GEX Dashboard — FastAPI + React

Full-stack Gamma Exposure Ladder dashboard for SPX, SPY, QQQ.

```
gex-app/
├── backend/
│   ├── main.py           ← FastAPI app (REST API)
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx           ← Root component, data fetching, auto-refresh
        ├── api.js            ← Fetch wrappers
        ├── utils.js          ← Formatting helpers
        ├── index.css         ← CSS variables, global styles, animations
        └── components/
            ├── InstrumentColumn.jsx  ← Full GEX ladder for one symbol
            ├── StatCard.jsx          ← Call Wall / Flip / Put Wall / Pin cards
            ├── StrikeRow.jsx         ← Individual strike row with bars
            └── LoadingSkeleton.jsx   ← Shimmer loading state
```

---

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at: http://localhost:3000

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/api/gex` | All instruments (SPX, SPY, QQQ) |
| GET | `/api/gex/{symbol}` | Single instrument |
| GET | `/api/gex/{symbol}?strikes=N` | Filtered to N strikes around spot |
| GET | `/api/symbols` | Available symbols |

### Example responses

```bash
# All GEX data
curl http://localhost:8000/api/gex

# SPX only, 15 strikes around spot
curl http://localhost:8000/api/gex/SPX?strikes=15

# Health check
curl http://localhost:8000/health
```

---

## Connecting Real Data

The backend is structured for easy adapter swaps. In `main.py`, the `SEED_DATA` dict maps symbols to factory functions. Replace them with live feed calls:

```python
# Example: Polygon.io adapter
async def fetch_spx_live() -> InstrumentGEX:
    # Call Polygon options chain
    # Compute gamma per strike: Δgamma × OI × 100 × spot²
    # Return InstrumentGEX(...)
    ...

SEED_DATA = {
    "SPX": fetch_spx_live,
    "SPY": fetch_spy_live,
    "QQQ": fetch_qqq_live,
}
```

Compatible data sources:
- **Polygon.io** — `/v3/snapshot/options/{underlyingAsset}`
- **CBOE LiveVol** — Full options chain with greeks
- **Interactive Brokers TWS API** — via `ib_insync`
- **Tradier** — `/markets/options/chains`
- **Alpaca** — Options data API

### GEX Calculation Reference

```
GEX per strike = Γ × OI × contract_multiplier × spot²
Net GEX        = Σ call_GEX - Σ put_GEX  (per strike, all expirations)
Gamma Flip     = strike where cumulative net GEX crosses zero
Call Wall      = strike with max call GEX above spot  (resistance)
Put Wall       = strike with max |put GEX| below spot (support)
Pin Strike     = strike with max |net GEX| near spot  (intraday magnet)
```

---

## Frontend Features

- **30-second auto-refresh** with visual countdown bar
- **Manual refresh** button
- **API status indicator** (live dot)
- **Shimmer skeleton** loading state
- **Error state** with diagnostic instructions
- **Responsive** stat cards: Call Wall · Gamma Flip · Put Wall · Pin Strike
- **GEX bars**: net (solid) + ghost call/put overlays
- **Spot line** with amber tag at current price
- **Flip badge** marking the gamma flip strike
- **Regime pill**: +GEX (green) / -GEX (red)

---

## Environment Variables

Create `frontend/.env.local` for custom API base:

```
VITE_API_BASE=http://your-api-host:8000
```

For production, configure CORS in `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    ...
)
```
