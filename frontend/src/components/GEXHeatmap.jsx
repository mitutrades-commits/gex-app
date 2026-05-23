import { useRef, useEffect, useState, useCallback } from "react"

const DEFAULT_HEIGHT = 420
const MIN_HEIGHT = 120
const MAX_HEIGHT = 700
import { fmtGex, fmtSpot, fmtStrike } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TAG_COLOR = {
  call: "#22c55e",
  flip: "#3b82f6",
  put:  "#ef4444",
}

// Viridis colormap: maps t ∈ [0,1] → rgb
// 0 = deep purple (most negative GEX), 0.5 = teal (zero), 1 = bright yellow (most positive)
const VIRIDIS = [
  [0.00, [68,   1,  84]],
  [0.13, [72,  40, 120]],
  [0.25, [62,  73, 137]],
  [0.38, [49, 104, 142]],
  [0.50, [38, 130, 142]],
  [0.63, [31, 158, 137]],
  [0.75, [53, 183, 121]],
  [0.88, [110, 206,  88]],
  [1.00, [253, 231,  37]],
]

function viridis(t) {
  const clamped = Math.max(0, Math.min(1, t))
  let lo = VIRIDIS[0], hi = VIRIDIS[VIRIDIS.length - 1]
  for (let i = 0; i < VIRIDIS.length - 1; i++) {
    if (clamped >= VIRIDIS[i][0] && clamped <= VIRIDIS[i + 1][0]) {
      lo = VIRIDIS[i]; hi = VIRIDIS[i + 1]; break
    }
  }
  const span = hi[0] - lo[0]
  const f = span === 0 ? 0 : (clamped - lo[0]) / span
  const r = Math.round(lo[1][0] + f * (hi[1][0] - lo[1][0]))
  const g = Math.round(lo[1][1] + f * (hi[1][1] - lo[1][1]))
  const b = Math.round(lo[1][2] + f * (hi[1][2] - lo[1][2]))
  return { color: `rgb(${r},${g},${b})`, t: clamped }
}

// Map net_gex ∈ [-maxAbs, +maxAbs] → viridis [0,1]
function cellStyle(net_gex, maxAbs) {
  const t = maxAbs === 0 ? 0.5 : (net_gex / maxAbs + 1) / 2
  const { color, t: brightness } = viridis(t)
  // Bright cells (yellow/green end) need dark text; dark cells need light text
  const textColor = brightness > 0.72 ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.88)"
  const mutedColor = brightness > 0.72 ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.45)"
  return { background: color, textColor, mutedColor }
}

function HeatStrikeRow({ d, symbol, maxAbs, tags, spotRef, deltaMap }) {
  const { background, textColor, mutedColor } = cellStyle(d.net_gex, maxAbs)
  const isPos = d.net_gex >= 0

  return (
    <div
      ref={d.is_spot ? spotRef : null}
      className="relative flex items-center min-h-[26px] px-3 border-b border-black/10"
      style={{ background }}
    >
      {/* Spot outline */}
      {d.is_spot && (
        <div className="absolute inset-0 border-2 border-amber pointer-events-none z-10" />
      )}

      {/* Strike label */}
      <span
        className="font-mono tabular-nums text-[10px] font-semibold tracking-wide flex-none w-[72px]"
        style={{ color: d.is_spot ? "#f59e0b" : textColor }}
      >
        {fmtStrike(symbol, d.strike)}
      </span>

      {/* Key level tags — solid opaque so they're readable on any heatmap color */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {tags.map(t => (
          <span
            key={t.label}
            className="font-mono text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded whitespace-nowrap shadow-sm"
            style={{ color: "#fff", background: t.color, border: `1px solid ${t.color}` }}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* Net GEX value + delta */}
      <div className="flex items-center justify-end gap-1 flex-none">
        <span
          className="font-mono tabular-nums text-[10px] tracking-wide"
          style={{ color: textColor }}
        >
          {fmtGex(d.net_gex)}
        </span>
        {deltaMap[d.strike] !== undefined && (() => {
          const delta = d.net_gex - deltaMap[d.strike]
          if (delta === 0) return null
          const isUp = delta > 0
          return (
            <span
              className="font-mono tabular-nums text-[8px] tracking-wide"
              style={{ color: isUp ? "#2dc88a" : "#e05252", opacity: 0.9 }}
            >
              ({isUp ? "+" : ""}{fmtGex(delta)})
            </span>
          )
        })()}
      </div>
    </div>
  )
}

function buildDeltaMap(prevInstruments, symbol) {
  const prev = prevInstruments.find(i => i.symbol === symbol)
  if (!prev) return {}
  return Object.fromEntries(prev.strikes.map(s => [s.strike, s.net_gex]))
}

function HeatColumn({ inst, prevInstruments }) {
  const {
    symbol, spot, net_gex, regime, flip,
    call_wall, put_wall, strikes, flow_direction,
  } = inst

  const sorted   = [...strikes].sort((a, b) => b.strike - a.strike)
  const maxAbs   = Math.max(...sorted.map(s => Math.abs(s.net_gex)), 1)
  const isPos    = regime.toLowerCase() === "positive"
  const deltaMap = buildDeltaMap(prevInstruments, symbol)

  const storageKey = `gex:ladder-height:${symbol}`
  const [ladderHeight, setLadderHeight] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    const parsed = parseInt(saved, 10)
    return !isNaN(parsed) && parsed >= MIN_HEIGHT && parsed <= MAX_HEIGHT ? parsed : DEFAULT_HEIGHT
  })
  const ladderHeightRef = useRef(ladderHeight)
  useEffect(() => { ladderHeightRef.current = ladderHeight }, [ladderHeight])

  const spotRef = useRef(null)
  useEffect(() => {
    spotRef.current?.scrollIntoView({ block: "center" })
  }, [inst])

  const dragState = useRef(null)
  const handleDragMouseDown = useCallback((e) => {
    e.preventDefault()
    document.body.style.userSelect = "none"
    dragState.current = { startY: e.clientY, startHeight: ladderHeightRef.current }

    function onMouseMove(ev) {
      const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragState.current.startHeight + ev.clientY - dragState.current.startY))
      setLadderHeight(next)
    }
    function onMouseUp(ev) {
      const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragState.current.startHeight + ev.clientY - dragState.current.startY))
      localStorage.setItem(storageKey, String(next))
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [storageKey])

  useEffect(() => () => {
    if (dragState.current) {
      document.body.style.userSelect = ""
    }
  }, [])

  function tagsForStrike(d) {
    const tags = []
    if (d.strike === call_wall.strike) tags.push({ label: "Call Wall", color: TAG_COLOR.call })
    if (d.is_flip)                     tags.push({ label: "γ Flip",    color: TAG_COLOR.flip })
    if (d.strike === put_wall.strike)  tags.push({ label: "Put Wall",  color: TAG_COLOR.put  })
    return tags
  }

  return (
    <div className="flex flex-col animate-[fadeIn_0.35s_ease_both]">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex-none">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-sm tracking-widest text-[var(--text-1)]">{symbol}</span>
            <Badge variant={isPos ? "positive" : "negative"}>{isPos ? "+GEX" : "−GEX"}</Badge>
          </div>
          <Badge variant="amber">{fmtSpot(symbol, spot)}</Badge>
        </div>

        {/* Sub-header */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex-none">
          <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--text-2)]">
            {strikes.length} strikes
          </span>
          <span className="font-mono text-[9px] text-[var(--text-2)]">
            Net:{" "}
            <span className={cn("font-semibold", isPos ? "text-green" : "text-red")}>
              {fmtGex(net_gex)}
            </span>
          </span>
          <span className="font-semibold uppercase text-[10px] text-pink-600">{flow_direction}</span>
        </div>

        {/* Color scale legend */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex-none">
          <span className="font-mono text-[7px] text-[var(--text-3)] uppercase tracking-widest">−GEX</span>
          <div
            className="flex-1 h-2 rounded-full"
            style={{
              background: `linear-gradient(to right, ${VIRIDIS.map(([t, [r,g,b]]) => `rgb(${r},${g},${b}) ${t*100}%`).join(", ")})`
            }}
          />
          <span className="font-mono text-[7px] text-[var(--text-3)] uppercase tracking-widest">+GEX</span>
        </div>

        {/* Strike rows */}
        <div className="overflow-y-auto" style={{ height: ladderHeight, minHeight: MIN_HEIGHT }}>
          {sorted.map(d => (
            <HeatStrikeRow
              key={d.strike}
              d={d}
              symbol={symbol}
              maxAbs={maxAbs}
              tags={tagsForStrike(d)}
              spotRef={spotRef}
              deltaMap={deltaMap}
            />
          ))}
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={handleDragMouseDown}
          className="flex-none flex items-center justify-center h-3 border-t border-[var(--border)] cursor-ns-resize select-none group"
          style={{ background: "var(--surface-2)" }}
          title="Drag to resize"
        >
          <span
            className="font-mono text-[10px] tracking-widest text-[var(--border)] group-hover:text-[var(--text-3)] transition-colors leading-none"
            style={{ letterSpacing: "0.25em" }}
          >
            ⋯
          </span>
        </div>

      </div>
    </div>
  )
}

// Embeddable version — no outer card or grid, fits inside an existing panel
export function HeatmapRows({ inst, prevInstruments = [], date }) {
  const {
    symbol, spot, net_gex, regime, flip,
    call_wall, put_wall, strikes, flow_direction,
  } = inst

  const sorted   = [...strikes].sort((a, b) => b.strike - a.strike)
  const maxAbs   = Math.max(...sorted.map(s => Math.abs(s.net_gex)), 1)
  const isPos    = regime.toLowerCase() === "positive"
  const deltaMap = buildDeltaMap(prevInstruments, symbol)

  // Share the same height key as InstrumentColumn so resizing one syncs the other
  const ladderHeight = (() => {
    const saved = localStorage.getItem(`gex:ladder-height:${symbol}`)
    const parsed = parseInt(saved, 10)
    return !isNaN(parsed) && parsed >= MIN_HEIGHT && parsed <= MAX_HEIGHT ? parsed : DEFAULT_HEIGHT
  })()

  const spotRef = useRef(null)
  useEffect(() => {
    spotRef.current?.scrollIntoView({ block: "center" })
  }, [inst])

  function tagsForStrike(d) {
    const tags = []
    if (d.strike === call_wall.strike) tags.push({ label: "Call Wall", color: TAG_COLOR.call })
    if (d.is_flip)                     tags.push({ label: "γ Flip",    color: TAG_COLOR.flip })
    if (d.strike === put_wall.strike)  tags.push({ label: "Put Wall",  color: TAG_COLOR.put  })
    return tags
  }

  return (
    <div className="flex flex-col">
      {/* Symbol + date header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border-b border-[var(--border)] flex-none">
        <span className="font-mono font-bold text-sm tracking-widest text-[var(--text-1)]">{symbol}</span>
        {date && <span className="font-mono text-[10px] text-[var(--text-3)]">{date}</span>}
        <div className="flex items-center gap-1.5 ml-auto">
          <Badge variant={isPos ? "positive" : "negative"}>{isPos ? "+GEX" : "−GEX"}</Badge>
          <Badge variant="amber">{fmtSpot(symbol, spot)}</Badge>
        </div>
      </div>

      {/* Net GEX + flow bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex-none">
        <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--text-2)]">
          {strikes.length} strikes
        </span>
        <span className="font-mono text-[9px] text-[var(--text-2)]">
          Net: <span className={cn("font-semibold", isPos ? "text-green" : "text-red")}>{fmtGex(net_gex)}</span>
        </span>
        <span className="font-semibold uppercase text-[10px] text-pink-600">{flow_direction}</span>
      </div>

      {/* Color scale legend */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex-none">
        <span className="font-mono text-[7px] text-[var(--text-3)] uppercase tracking-widest">−GEX</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{ background: `linear-gradient(to right, ${VIRIDIS.map(([t, [r,g,b]]) => `rgb(${r},${g},${b}) ${t*100}%`).join(", ")})` }}
        />
        <span className="font-mono text-[7px] text-[var(--text-3)] uppercase tracking-widest">+GEX</span>
      </div>

      {/* Strike rows */}
      <div className="overflow-y-auto" style={{ height: ladderHeight, minHeight: MIN_HEIGHT }}>
        {sorted.map(d => (
          <HeatStrikeRow
            key={d.strike}
            d={d}
            symbol={symbol}
            maxAbs={maxAbs}
            tags={tagsForStrike(d)}
            spotRef={spotRef}
            deltaMap={deltaMap}
          />
        ))}
      </div>
    </div>
  )
}

export default function GEXHeatmap({ instruments, prevInstruments = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
      {instruments.map(inst => (
        <HeatColumn key={inst.symbol} inst={inst} prevInstruments={prevInstruments} />
      ))}
    </div>
  )
}
