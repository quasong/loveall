import { MatchCardSkeleton, Skeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div>
      {/* hero */}
      <section className="relative -mx-4 mb-8 overflow-hidden border-b border-line bg-gradient-to-b from-court-50 to-canvas px-4 pb-10 pt-8 sm:mb-10 sm:rounded-3xl sm:border sm:px-10 sm:pb-14 sm:pt-12">
        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-12">
          <div className="order-2 flex-1 md:order-none">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="mt-4 h-10 w-full max-w-md" />
            <Skeleton className="mt-2 h-10 w-2/3 max-w-sm" />
            <Skeleton className="mt-4 h-16 w-full max-w-md" />
            <div className="mt-6 flex gap-3">
              <Skeleton className="h-11 w-44 rounded-full" />
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </div>
          <div className="order-1 md:order-none">
            <Skeleton className="size-40 rounded-full sm:size-56 md:size-64" />
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-64 rounded-full" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div>
          <div className="card mb-4 space-y-3 p-4">
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-16 min-w-0 flex-1 basis-48" />
              <Skeleton className="h-16 min-w-0 basis-36 sm:basis-40" />
            </div>
            <Skeleton className="h-5 w-full max-w-sm" />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        </div>

        <aside className="card p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-5 h-11 w-full rounded-full" />
          <Skeleton className="mt-3 h-16 w-full" />
          <Skeleton className="mt-3 h-16 w-full" />
        </aside>
      </div>
    </div>
  )
}
