from fastapi import APIRouter, Query
from backend.models import IntradaySeries
from backend.services import snapshots

router = APIRouter(prefix="/api", tags=["Intraday"])


@router.get("/gex/{symbol}/intraday", response_model=IntradaySeries)
def get_intraday(
    symbol: str,
    lookback: float = Query(default=6.0, ge=0.5, le=24.0, description="Lookback window in hours"),
):
    return snapshots.get_series(symbol.upper(), lookback_hours=lookback)
