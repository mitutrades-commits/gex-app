import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

const TabsCtx = createContext(null)

export function Tabs({ defaultValue, value, onValueChange, className, children }) {
  const [internal, setInternal] = useState(defaultValue)
  const active = value ?? internal
  const setActive = onValueChange ?? setInternal
  return (
    <TabsCtx.Provider value={{ active, setActive }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-[var(--surface-2)] p-1",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ value, className, ...props }) {
  const { active, setActive } = useContext(TabsCtx)
  const isActive = active === value
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium font-mono transition-colors",
        isActive
          ? "bg-[var(--surface-3)] text-text-1 shadow-sm"
          : "text-text-2 hover:text-text-1",
        className
      )}
      {...props}
    />
  )
}

export function TabsContent({ value, className, children }) {
  const { active } = useContext(TabsCtx)
  if (active !== value) return null
  return <div className={cn("mt-3", className)}>{children}</div>
}
