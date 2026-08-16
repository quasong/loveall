import { Skeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-xl">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-56" />

      <div className="space-y-5">
        <div className="card space-y-4 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-1.5 h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>

        <div className="card space-y-3 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        <div className="card space-y-3 p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
