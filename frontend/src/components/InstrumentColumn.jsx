import { Fragment } from "react"
import StatCard from "./StatCard"
import StrikeRow from "./StrikeRow"
import { Badge } from "@/components/ui/badge"
import { fmtGex, fmtSpot, fmtStrike } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function InstrumentColumn({ inst }) {
  const { symbol, spot, flip, net_gex, regime, strikes } = inst

  const isPos = spot >= flip

  const aboveSpot = strikes.filter(s => s.strike > spot)
  const belowSpot = strikes.filter(s => s.strike < spot)

  const callWallS = (aboveSpot.length ? aboveSpot : strikes)
    .reduce((a, b) => b.call_gex > a.call_gex ? b : a)
  const putWallS = (belowSpot.length ? belowSpot : strikes)
    .reduce((a, b) => Math.abs(b.put_gex) > Math.abs(a.put_gex) ? b : a)
  const pinS = strikes.reduce((a, b) => Math.abs(b.net_gex) > Math.abs(a.net_gex) ? b : a)

  const maxNet  = Math.max(...strikes.map(s => Math.abs(s.net_gex)))
  const maxCall = Math.max(...strikes.map(s => s.call_gex))
  const maxPut  = Math.max(...strikes.map(s => Math.abs(s.put_gex)))

  const sortedStrikes = [...strikes].sort((a, b) => b.strike - a.strike)

  return (
    <div className="flex flex-col gap-3 animate-[fadeIn_0.35s_ease_both]">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          type="call"
          label="Call Wall"
          value={fmtStrike(symbol, callWallS.strike)}
          sub1={fmtGex(callWallS.call_gex)}
          sub2="Resistance"
        />
        <StatCard
          type="flip"
          label="γ Flip"
          value={fmtStrike(symbol, flip)}
          sub1={isPos
            ? '<span style="color:var(--green)">+GEX above</span>'
            : '<span style="color:var(--red)">−GEX below</span>'
          }
          sub2="Zero gamma"
        />
        <StatCard
          type="put"
          label="Put Wall"
          value={fmtStrike(symbol, putWallS.strike)}
          sub1={fmtGex(putWallS.put_gex)}
          sub2="Support"
        />
        <StatCard
          type="pin"
          label="Pin Strike"
          value={fmtStrike(symbol, pinS.strike)}
          sub1={fmtGex(pinS.net_gex)}
          sub2="Intraday magnet"
        />
      </div>

      {/* Ladder card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold tracking-widest text-text-1">{symbol}</span>
            <Badge variant={isPos ? "positive" : "negative"}>{isPos ? "+GEX" : "−GEX"}</Badge>
          </div>
          <Badge variant="amber">{fmtSpot(symbol, spot)}</Badge>
        </div>

        {/* Sub-header */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
          <span className="font-mono text-[8px] uppercase tracking-widest text-text-3">
            {strikes.length} strikes · all expirations
          </span>
          <span className="font-mono text-[8px] text-text-2">
            Net:{" "}
            <span className={cn("font-semibold", isPos ? "text-green" : "text-red")}>
              {fmtGex(net_gex)}
            </span>
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[56px_1fr_64px] px-3 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
          {["Strike", "← Put · Net GEX · Call →", "Net GEX"].map((h, i) => (
            <span
              key={h}
              className="font-mono text-[8px] uppercase tracking-widest text-text-3"
              style={{ textAlign: i === 1 ? "center" : i === 2 ? "right" : "left" }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Strike rows */}
        {sortedStrikes.map(d => (
          <Fragment key={d.strike}>
            <StrikeRow d={d} symbol={symbol} maxNet={maxNet} maxCall={maxCall} maxPut={maxPut} />
            {d.is_spot && (
              <div className="relative h-px z-10 overflow-visible">
                <div className="absolute inset-0 bg-amber opacity-60" />
                <div className="absolute right-3 -top-[9px] font-mono text-[8px] text-amber bg-[var(--surface)] border border-amber/50 rounded px-1.5 py-px whitespace-nowrap tracking-wide">
                  SPOT {fmtSpot(symbol, spot)}
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
