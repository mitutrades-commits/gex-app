import { BarChart2, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "levels", label: "Levels", Icon: BarChart2 },
  { id: "heatmap", label: "Heatmap", Icon: Flame },
]

export default function LayoutToggle({ layout, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-md transition-all duration-150",
            layout === id
              ? "bg-blue text-white shadow-md"
              : "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface)]"
          )}
        >
          <Icon size={12} strokeWidth={2.5} />
          {label}
        </button>
      ))}
    </div>
  )
}
