from typing import Protocol
from backend.models import InstrumentGEX


class GEXDataAdapter(Protocol):
    async def fetch(self, symbol: str) -> InstrumentGEX: ...

    async def available_symbols(self) -> list[str]: ...
