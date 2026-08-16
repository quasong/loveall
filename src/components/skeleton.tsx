/**
 * Placeholder blocks for `loading.tsx` fallbacks.
 *
 * Every route in this app is dynamic (the header reads the session cookie), so
 * Next.js skips prefetching a route's content until a `loading.tsx` exists.
 * These shapes are what gets prefetched and shown the instant a link is
 * clicked, instead of the browser sitting on the old page waiting for the
 * server. Keep them roughly the size of the real thing so the swap doesn't
 * jump the layout.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line/70 ${className}`} />
}

/** A stand-in for one row in the match list. */
export function MatchCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="mt-1.5 h-4 w-48" />
          <div className="mt-3 flex items-center gap-1.5">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-6 w-10 shrink-0" />
      </div>
    </div>
  )
}
