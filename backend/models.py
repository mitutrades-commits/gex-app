from pydantic import BaseModel
from typing import Optional


class Strike(BaseModel):
    strike: float
    call_gex: float
    put_gex: float
    net_gex: float
    call_oi: int = 0
    put_oi: int = 0
    call_volume: int = 0
    put_volume: int = 0
    call_oi_change: Optional[int] = None
    put_oi_change: Optional[int] = None
    is_flip: bool = False
    is_spot: bool = False


class KeyLevel(BaseModel):
    strike: float
    gex: float
    oi: int


class InstrumentGEX(BaseModel):
    symbol: str
    spot: float
    flip: float
    net_gex: float
    regime: str  # "Positive" | "Negative"
    call_wall: KeyLevel
    put_wall: KeyLevel
    max_pain: Optional[float] = None
    strikes: list[Strike]
    updated_at: str


class GEXResponse(BaseModel):
    instruments: list[InstrumentGEX]
    as_of: str
    source: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


class GEXSnapshot(BaseModel):
    timestamp: str
    spot: float
    net_gex: float
    flip: float
    call_wall_strike: float
    put_wall_strike: float


class IntradaySeries(BaseModel):
    symbol: str
    snapshots: list[GEXSnapshot]
