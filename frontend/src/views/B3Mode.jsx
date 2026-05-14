import { useState } from "react"
import InstrumentColumn from "@/components/InstrumentColumn"
import LoadingSkeleton from "@/components/LoadingSkeleton"
import IntradayChart from "@/components/IntradayChart"
import { StatChip } from "@/components/StatCard"
import { cn } from "@/lib/utils"
import { fmtGex, fmtSpot, fmtStrike } from "@/lib/format"

export default function B3Mode({ gexData }) {
  const { data, loading, error } = gexData ?? {}
  const [activeSymbol, setActiveSymbol] = useState(null)

  const instruments = data?.instruments ?? []
  const effectiveSymbol = activeSymbol ?? instruments[0]?.symbol
  const activeInst = instruments.find(i => i.symbol === effectiveSymbol)

  if (loading && !data) {
    return <div className="h-full overflow-auto p-4"><LoadingSkeleton /></div>
  }

  if (error && !data) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="max-w-md rounded-lg border border-red/25 bg-red/5 p-4">
          <p className="font-mono text-xs font-semibold text-red mb-1">API Error</p>
          <p className="font-mono text-[10px] text-red/80">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Compute stat card values for active instrument
  const computeWalls = (inst) => {
    if (!inst) return {}
    const { symbol, spot, flip, net_gex, strikes = [] } = inst
    const aboveSpot = strikes.filter(s => s.strike > spot)
    const belowSpot = strikes.filter(s => s.strike < spot)
    const callWallS = (aboveSpot.length ? aboveSpot : strikes).reduce((a, b) => b.call_gex > a.call_gex ? b : a, strikes[0] ?? {})
    const putWallS = (belowSpot.length ? belowSpot : strikes).reduce((a, b) => Math.abs(b.put_gex) > Math.abs(a.put_gex) ? b : a, strikes[0] ?? {})
    return { symbol, spot, flip, net_gex, callWallStrike: callWallS?.strike, callWallGex: callWallS?.call_gex, putWallStrike: putWallS?.strike, putWallGex: putWallS?.put_gex }
  }

  const walls = computeWalls(activeInst)

  return (
    <div className="h-full grid grid-cols-12 gap-0 overflow-hidden">
      {/* Left pane — 3 stacked instrument columns */}
      <div className="col-span-7 border-r border-[var(--border)] overflow-y-auto">
        {instruments.map(inst => (
          <div
            key={inst.symbol}
            className={cn(
              "border-b border-[var(--border)] p-3 cursor-pointer transition-colors",
              effectiveSymbol === inst.symbol
                ? "border-l-2 border-l-blue"
                : "border-l-2 border-l-transparent"
            )}
            onClick={() => setActiveSymbol(inst.symbol)}
          >
            <InstrumentColumn inst={inst} compact={true} />
          </div>
        ))}
      </div>

      {/* Right pane */}
      <div className="col-span-5 overflow-y-auto flex flex-col">
        {/* Symbol switcher */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-[var(--border-soft)] flex-none">
          {instruments.map(i => (
            <button
              key={i.symbol}
              onClick={() => setActiveSymbol(i.symbol)}
              className={cn(
                "font-mono text-[10px] px-3 py-1 rounded-full border transition-colors",
                effectiveSymbol === i.symbol
                  ? "bg-blue/10 text-blue border-blue/40"
                  : "border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-2)]"
              )}
            >
              {i.symbol}
            </button>
          ))}
        </div>

        {/* Intraday chart */}
        {activeInst && (
          <div className="px-3 pt-3 flex-none">
            <IntradayChart symbol={activeInst.symbol} instrument={activeInst} height={280} />
          </div>
        )}

        {/* Stat cards row */}
        {activeInst && walls.callWallStrike != null && (
          <div className="px-3 pt-3 grid grid-cols-4 gap-1.5 flex-none">
            <StatChip
              type="call"
              label="Call Wall"
              value={fmtStrike(walls.symbol, walls.callWallStrike)}
              sub1={fmtGex(walls.callWallGex)}
              sub2="Resistance"
            />
            <StatChip
              type="flip"
              label="γ Flip"
              value={fmtStrike(walls.symbol, walls.flip)}
              sub1={walls.net_gex >= walls.flip ? "Above flip" : "Below flip"}
              sub2="Zero gamma"
            />
            <StatChip
              type="put"
              label="Put Wall"
              value={fmtStrike(walls.symbol, walls.putWallStrike)}
              sub1={fmtGex(walls.putWallGex)}
              sub2="Support"
            />
            <StatChip
              type="pin"
              label="Spot"
              value={fmtSpot(walls.symbol, walls.spot)}
              sub1={fmtGex(walls.net_gex)}
              sub2="Current price"
            />
          </div>
        )}
      </div>
    </div>
  )
}
