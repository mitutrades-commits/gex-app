import { cn } from "@/lib/utils"
import { useGEXData } from "@/hooks/useGEXData"
import { useTheme } from "@/hooks/useTheme"

const ACCENT = "bg-blue"

function InfoCard({ label, value, accent = ACCENT }) {
  return (
    <div className={cn(
      "relative border border-[var(--border)] bg-[var(--surface-1)] rounded-sm p-3 overflow-hidden"
    )}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-0.5", accent)} />
      <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-3)] mb-1">{label}</div>
      <div className="font-mono tabular-nums text-[13px] font-semibold text-[var(--text-1)]">{value}</div>
    </div>
  )
}

function ThemePicker() {
  const { theme, setTheme, themes } = useTheme()
  return (
    <select
      value={theme}
      onChange={e => setTheme(e.target.value)}
      className="w-full font-mono text-[11px] uppercase tracking-wider bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)] rounded-sm px-3 py-2 focus:outline-none focus:border-[var(--blue)] cursor-pointer"
    >
      {themes.map(t => (
        <option key={t.id} value={t.id}>
          {t.label} — {t.description}
        </option>
      ))}
    </select>
  )
}

export default function Settings() {
  const { data, REFRESH_INTERVAL } = useGEXData()
  const source = data?.source ?? data?.adapter ?? "—"

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-sm space-y-6">
        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-3)] mb-4">
            Theme
          </h2>
          <ThemePicker />
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-3)] mb-4">
            System Info
          </h2>
          <InfoCard label="Data Source" value={source} accent="bg-blue" />
          <InfoCard label="Refresh Interval" value={`${REFRESH_INTERVAL}s`} accent="bg-green" />
          <InfoCard label="Version" value="GEX Dashboard v2.0" accent="bg-amber" />
        </section>
      </div>
    </div>
  )
}
