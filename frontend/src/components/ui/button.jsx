import { cn } from "@/lib/utils"

const variants = {
  default: "bg-blue/20 text-blue border border-blue/30 hover:bg-blue/30",
  ghost: "text-text-2 hover:text-text-1 hover:bg-surface-2",
  destructive: "bg-red/20 text-red border border-red/30 hover:bg-red/30",
}

const sizes = {
  default: "h-8 px-3 py-1.5 text-xs",
  sm: "h-7 px-2.5 py-1 text-xs",
  lg: "h-10 px-4 py-2 text-sm",
  icon: "h-8 w-8",
}

export function Button({ className, variant = "default", size = "default", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium font-mono transition-colors disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
