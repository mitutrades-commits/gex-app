import { useState } from "react"
import { cn } from "@/lib/utils"

const LEFT_BORDER = {
  call:   "border-l-green",
  flip:   "border-l-blue",
  put:    "border-l-red",
  pin:    "border-l-amber",
  dealer: "border-l-purple-400",
}

const TEXT_COLOR = {
  call:   "text-green",
  flip:   "text-blue",
  put:    "text-red",
  pin:    "text-amber",
  dealer: "text-purple-400",
}

// Compact chip — used for the 4-up row
export function StatChip({ type, label, value, sub1, sub2 }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn(
      "relative flex flex-col gap-0.5 rounded-md border border-[var(--border)] border-l-2 bg-[var(--surface-2)] px-2.5 py-2",
      LEFT_BORDER[type]
    )}>
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-text-2 truncate">{label}</span>
        {(sub1 || sub2) && (
          <div className="relative flex-none">
            <button
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              className="text-text-2 hover:text-text-1 transition-colors"
              aria-label="More info"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-40 hover:opacity-80">
                <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.25" />
                <text x="6" y="9" textAnchor="middle" fontSize="7.5" fill="currentColor" fontFamily="monospace">?</text>
              </svg>
            </button>
            {open && (
              <div className="absolute bottom-full right-0 mb-1.5 z-50 w-44 rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg px-2.5 py-2 font-mono text-[10px] text-text-2 leading-relaxed whitespace-normal">
                <span dangerouslySetInnerHTML={{ __html: sub1 }} />
                {sub2 && <><br /><span>{sub2}</span></>}
              </div>
            )}
          </div>
        )}
      </div>
      <span className={cn("font-mono text-xs font-semibold leading-none tabular-nums", TEXT_COLOR[type])}>
        {value}
      </span>
    </div>
  )
}

// Wide bar — used for dealer risk
export function StatBar({ type, label, value, sub1, sub2 }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn(
      "relative flex items-center gap-3 rounded-md border border-[var(--border)] border-l-2 bg-[var(--surface-2)] px-3 py-2",
      LEFT_BORDER[type]
    )}>
      <span className="font-mono text-[9px] uppercase tracking-widest text-text-2 flex-none">{label}</span>
      <span className={cn("font-mono text-xs font-semibold tabular-nums flex-none", TEXT_COLOR[type])}>
        {value}
      </span>
      {sub1 && (
        <span className="font-mono text-[9px] text-text-2 truncate flex-1">{sub1}</span>
      )}
      {(sub1 || sub2) && (
        <div className="relative flex-none">
          <button
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="text-text-2 hover:text-text-1 transition-colors"
            aria-label="More info"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-40 hover:opacity-80">
              <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.25" />
              <text x="6" y="9" textAnchor="middle" fontSize="7.5" fill="currentColor" fontFamily="monospace">?</text>
            </svg>
          </button>
          {open && (
            <div className="absolute bottom-full right-0 mb-1.5 z-50 w-52 rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg px-2.5 py-2 font-mono text-[10px] text-text-2 leading-relaxed whitespace-normal">
              <span dangerouslySetInnerHTML={{ __html: sub1 }} />
              {sub2 && <><br /><span>{sub2}</span></>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Default export keeps backward compat (uses chip style)
export default function StatCard(props) {
  return <StatChip {...props} />
}
