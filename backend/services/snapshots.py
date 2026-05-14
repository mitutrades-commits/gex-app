from collections import deque
from backend.models import GEXSnapshot, IntradaySeries, InstrumentGEX
from backend.config import settings
from datetime import datetime, timezone, timedelta


_store: dict[str, deque[GEXSnapshot]] = {}


def record(instrument: InstrumentGEX) -> None:
    sym = instrument.symbol
    if sym not in _store:
        _store[sym] = deque(maxlen=settings.snapshot_max_per_symbol)
    _store[sym].append(GEXSnapshot(
        timestamp=datetime.now(timezone.utc).isoformat(),
        spot=instrument.spot,
        net_gex=instrument.net_gex,
        flip=instrument.flip,
        call_wall_strike=instrument.call_wall.strike,
        put_wall_strike=instrument.put_wall.strike,
    ))


def get_series(symbol: str, lookback_hours: float = 6.0) -> IntradaySeries:
    sym = symbol.upper()
    snaps = list(_store.get(sym, []))
    if lookback_hours > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
        snaps = [s for s in snaps if datetime.fromisoformat(s.timestamp) >= cutoff]
    return IntradaySeries(symbol=sym, snapshots=snaps)
