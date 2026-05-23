import httpx
from datetime import datetime, timezone, date, timedelta
from urllib.parse import urlparse, parse_qs
from backend.models import InstrumentGEX, Strike, KeyLevel
from backend.config import settings


class PolygonAdapter:
    def __init__(self):
        self._client = httpx.AsyncClient(
            base_url="https://api.polygon.io",
            headers={
                "Authorization": f"Bearer {settings.polygon_api_key}",
                "Accept": "application/json",
            },
            timeout=20.0,
        )

    async def fetch(self, symbol: str, expiry: str | None = None) -> InstrumentGEX:
        sym = symbol.upper()

        # Step 1: resolve which expiration date to use
        expiry_date = await self._resolve_expiry(sym, expiry)

        # Step 2: fetch all options for that expiration (paginated, max 1000)
        options = await self._fetch_options(sym, expiry_date)
        if not options:
            raise ValueError(f"No options data for {sym} exp={expiry_date}")

        # Step 3: extract spot from the first result's underlying_asset field
        spot = _spot_from_options(options) or await self._fetch_spot(sym)

        # Step 4: build per-strike GEX
        strike_map: dict[float, dict] = {}
        for opt in options:
            details = opt.get("details") or {}
            k = details.get("strike_price")
            ct = (details.get("contract_type") or "").lower()
            if k is None or ct not in ("call", "put"):
                continue
            k = float(k)
            if k not in strike_map:
                strike_map[k] = {"call": None, "put": None}
            strike_map[k][ct] = opt

        strikes_data = _build_strikes(strike_map, spot)
        if not strikes_data:
            raise ValueError(f"No strike data computed for {sym}")

        total_net_gex = sum(s["net_gex"] for s in strikes_data)
        regime = "Positive" if total_net_gex >= 0 else "Negative"
        flip_price = _find_flip(strikes_data, spot)
        flip_k = min(strikes_data, key=lambda x: abs(x["strike"] - flip_price))["strike"]
        spot_k = min(strikes_data, key=lambda x: abs(x["strike"] - spot))["strike"]

        strikes = [
            Strike(
                strike=s["strike"],
                call_gex=s["call_gex"],
                put_gex=s["put_gex"],
                net_gex=s["net_gex"],
                call_oi=s["call_oi"],
                put_oi=s["put_oi"],
                call_volume=s["call_volume"],
                put_volume=s["put_volume"],
                is_flip=s["strike"] == flip_k,
                is_spot=s["strike"] == spot_k,
            )
            for s in strikes_data
        ]

        return InstrumentGEX(
            symbol=sym,
            spot=spot,
            flip=flip_price,
            net_gex=total_net_gex,
            regime=regime,
            call_wall=_find_call_wall(strikes, spot),
            put_wall=_find_put_wall(strikes, spot),
            strikes=strikes,
            updated_at=datetime.now(timezone.utc).isoformat(),
            flow_direction="na",
            net_chex=0.0,
            net_vex=0.0,
        )

    async def _resolve_expiry(self, sym: str, expiry: str | None) -> str:
        today = date.today()

        if expiry == "0dte":
            if today.weekday() >= 5:
                days = 7 - today.weekday()
                return (today + timedelta(days=days)).isoformat()
            return today.isoformat()

        if expiry and expiry != "0dte":
            return expiry

        # No expiry: peek at available expirations via a 1-result options fetch
        resp = await self._client.get(
            f"/v3/snapshot/options/{sym}",
            params={"limit": 1, "sort": "expiration_date", "order": "asc"},
        )
        resp.raise_for_status()
        results = resp.json().get("results") or []
        if results:
            return results[0]["details"]["expiration_date"]
        # Fallback: next Friday
        days_to_fri = (4 - today.weekday()) % 7 or 7
        return (today + timedelta(days=days_to_fri)).isoformat()

    async def _fetch_options(self, sym: str, expiry_date: str) -> list[dict]:
        results: list[dict] = []
        params: dict = {
            "expiration_date": expiry_date,
            "limit": 250,
        }
        url = f"/v3/snapshot/options/{sym}"

        while True:
            resp = await self._client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            results.extend(data.get("results") or [])

            next_url = data.get("next_url")
            if not next_url or len(results) >= 1000:
                break

            # Extract cursor from next_url and continue
            cursor = parse_qs(urlparse(next_url).query).get("cursor", [None])[0]
            if not cursor:
                break
            params = {"cursor": cursor}

        return results

    async def _fetch_spot(self, sym: str) -> float:
        resp = await self._client.get(
            f"/v2/snapshot/locale/us/markets/stocks/tickers/{sym}"
        )
        resp.raise_for_status()
        t = resp.json().get("ticker") or {}
        price = (
            (t.get("lastTrade") or {}).get("p")
            or (t.get("day") or {}).get("c")
            or (t.get("prevDay") or {}).get("c")
        )
        return float(price or 0)

    async def available_symbols(self) -> list[str]:
        return ["SPY", "QQQ", "AAPL", "TSLA", "NVDA"]

    async def aclose(self):
        await self._client.aclose()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _spot_from_options(options: list[dict]) -> float:
    for opt in options:
        ua = opt.get("underlying_asset") or {}
        price = ua.get("price")
        if price:
            return float(price)
    return 0.0


def _build_strikes(strike_map: dict[float, dict], spot: float) -> list[dict]:
    rows = []
    for k in sorted(strike_map):
        call = strike_map[k].get("call")
        put = strike_map[k].get("put")

        call_gamma = _greek(call, "gamma")
        put_gamma = _greek(put, "gamma")
        call_oi = _oint(call)
        put_oi = _oint(put)

        # GEX = gamma × OI × contract_size × spot  (dealers assumed net short to retail)
        call_gex = call_gamma * call_oi * 100 * spot
        put_gex = -(put_gamma * put_oi * 100 * spot)

        rows.append({
            "strike": k,
            "call_gex": call_gex,
            "put_gex": put_gex,
            "net_gex": call_gex + put_gex,
            "call_oi": call_oi,
            "put_oi": put_oi,
            "call_volume": _vol(call),
            "put_volume": _vol(put),
        })
    return rows


def _greek(opt: dict | None, name: str) -> float:
    if not opt:
        return 0.0
    val = (opt.get("greeks") or {}).get(name)
    return float(val) if val is not None else 0.0


def _oint(opt: dict | None) -> int:
    if not opt:
        return 0
    v = opt.get("open_interest")
    return int(v) if v is not None else 0


def _vol(opt: dict | None) -> int:
    if not opt:
        return 0
    v = (opt.get("day") or {}).get("volume")
    return int(v) if v is not None else 0


def _find_flip(strikes_data: list[dict], spot: float) -> float:
    """
    Per-strike net GEX zero crossing nearest to spot.
    Falls back to cumulative crossing when no per-strike crossing exists.
    """
    sorted_s = sorted(strikes_data, key=lambda x: x["strike"])

    crossings: list[float] = []
    for i in range(len(sorted_s) - 1):
        a, b = sorted_s[i], sorted_s[i + 1]
        if (a["net_gex"] < 0 <= b["net_gex"]) or (a["net_gex"] > 0 >= b["net_gex"]):
            span = b["net_gex"] - a["net_gex"]
            frac = (-a["net_gex"] / span) if span else 0.0
            crossings.append(a["strike"] + frac * (b["strike"] - a["strike"]))

    if crossings:
        return min(crossings, key=lambda c: abs(c - spot))

    cum, prev_cum, prev_k = 0.0, 0.0, sorted_s[0]["strike"]
    for row in sorted_s:
        prev_cum = cum
        cum += row["net_gex"]
        if (prev_cum < 0 <= cum) or (prev_cum > 0 >= cum):
            span = cum - prev_cum
            frac = (-prev_cum / span) if span else 0.0
            return prev_k + frac * (row["strike"] - prev_k)
        prev_k = row["strike"]
    return min(sorted_s, key=lambda x: abs(x["net_gex"]))["strike"]


def _find_call_wall(strikes: list[Strike], spot: float) -> KeyLevel:
    candidates = [s for s in strikes if s.strike >= spot] or strikes
    best = max(candidates, key=lambda s: s.call_gex)
    return KeyLevel(strike=best.strike, gex=best.call_gex, oi=best.call_oi)


def _find_put_wall(strikes: list[Strike], spot: float) -> KeyLevel:
    candidates = [s for s in strikes if s.strike <= spot] or strikes
    best = min(candidates, key=lambda s: s.put_gex)
    return KeyLevel(strike=best.strike, gex=best.put_gex, oi=best.put_oi)
