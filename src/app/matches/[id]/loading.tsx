import { Skeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="mb-4 h-4 w-40" />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
        <div className="card p-6 md:col-start-1 md:row-start-1">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-3 h-4 w-72" />
          <Skeleton className="mt-1.5 h-3 w-48" />

          <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-1.5 h-4 w-40" />
              </div>
            ))}
          </dl>
        </div>

        <aside className="card space-y-4 p-5 md:col-start-2 md:row-start-1">
          <div>
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="mt-2 h-2 w-full rounded-full" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>

          <ul className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <Skeleton className="h-4 min-w-0 flex-1" />
              </li>
            ))}
          </ul>

          <Skeleton className="h-11 w-full rounded-full" />
        </aside>

        <section className="card p-6 md:col-start-1 md:row-start-2">
          <Skeleton className="mb-5 h-5 w-32" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1.5 h-4 w-full max-w-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
