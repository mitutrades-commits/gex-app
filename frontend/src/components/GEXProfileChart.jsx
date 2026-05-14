import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Cell, ResponsiveContainer,
} from "recharts"
import { fmtGex, fmtStrike } from "@/lib/format"

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-mono text-[10px] space-y-0.5">
      <p className="text-text-2 mb-1">Strike {label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill ?? p.color }}>
          {p.name}: {fmtGex(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function GEXProfileChart({ instrument }) {
  if (!instrument) return null
  const { symbol, strikes, spot } = instrument

  const data = [...strikes]
    .sort((a, b) => a.strike - b.strike)
    .map(s => ({
      strike: fmtStrike(symbol, s.strike),
      call_gex: s.call_gex,
      put_gex: s.put_gex,
      net_gex: s.net_gex,
      isSpot: s.is_spot,
    }))

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="font-mono text-[9px] uppercase tracking-widest text-text-3 mb-3">
        GEX Profile — Call vs Put by Strike
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barGap={1} barSize={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2736" vertical={false} />
          <XAxis
            dataKey="strike"
            tick={{ fontFamily: "IBM Plex Mono", fontSize: 8, fill: "#7a8aa8" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={v => fmtGex(v)}
            tick={{ fontFamily: "IBM Plex Mono", fontSize: 8, fill: "#7a8aa8" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#1e2736" />
          <Bar dataKey="call_gex" name="Call GEX" fill="#2dc88a" opacity={0.7} radius={[2,2,0,0]} />
          <Bar dataKey="put_gex" name="Put GEX" fill="#e05252" opacity={0.7} radius={[0,0,2,2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
