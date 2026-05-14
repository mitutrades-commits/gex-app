import { Skeleton } from "@/components/ui/skeleton"

function ColumnSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <Skeleton className="h-5 w-24" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <div className="flex flex-col gap-1.5 mt-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-7 rounded" />
        ))}
      </div>
    </div>
  )
}

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ColumnSkeleton key={i} />
      ))}
    </div>
  )
}
