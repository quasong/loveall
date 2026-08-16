import { Skeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-xl">
      <Skeleton className="mb-2 h-8 w-44" />
      <Skeleton className="mb-6 h-4 w-80" />

      <div className="card space-y-4 p-5">
        <Skeleton className="h-11 w-full rounded-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-1.5 h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  )
}
