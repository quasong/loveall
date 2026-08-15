import Link from 'next/link'
import { FORMATS, fmtMoney, fmtNtrpRange, fmtRelative } from '@/lib/format'
import { fmtDateTimeInZone } from '@/lib/time'

export type MatchCardData = {
  id: string
  title: string
  courtName: string
  city: string
  country: string
  timezone: string
  currency: string
  startsAt: Date
  durationMin: number
  capacity: number
  minNtrp: number
  maxNtrp: number
  format: string
  feeCents: number
  cancelled: boolean
  host: { name: string; avatar: string }
  _count: { signups: number }
}

export function MatchCard({
  match,
  joined,
  km,
}: {
  match: MatchCardData
  joined?: boolean
  /** Distance from the visitor, when both positions are known. */
  km?: number | null
}) {
  const taken = match._count.signups
  const left = match.capacity - taken
  const past = match.startsAt.getTime() < Date.now()
  const dimmed = match.cancelled || past

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`card block p-5 transition hover:border-court-200 hover:shadow-sm ${dimmed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{match.title}</h3>
            {match.cancelled ? (
              <span className="chip border-red-200 text-red-600">Cancelled</span>
            ) : past ? (
              <span className="chip">Finished</span>
            ) : left <= 0 ? (
              <span className="chip border-amber-200 bg-amber-50 text-amber-700">Full</span>
            ) : (
              <span className="chip border-court-200 bg-court-50 text-court-700">
                {left} spot{left === 1 ? '' : 's'} left
              </span>
            )}
            {joined && <span className="chip border-court-200 bg-court-600 text-white">Joined</span>}
          </div>

          <p className="text-sm text-ink">
            {fmtDateTimeInZone(match.startsAt, match.timezone, match.durationMin)}
            <span className="text-muted"> · {fmtRelative(match.startsAt)}</span>
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {match.city}, {match.country} · {match.courtName}
            {km != null && (
              <span className="text-court-600"> · {km < 1 ? '<1' : Math.round(km)} km away</span>
            )}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="chip">{FORMATS[match.format as keyof typeof FORMATS] ?? match.format}</span>
            <span className="chip">{fmtNtrpRange(match.minNtrp, match.maxNtrp)}</span>
            <span className="chip">{fmtMoney(match.feeCents, match.currency)}</span>

            {/* The host rides along with the chips: on a narrow card it would
                otherwise squeeze the title into an ellipsis. */}
            <span className="ml-auto flex min-w-0 items-center gap-1.5 text-xs text-muted">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-court-50">
                {match.host.avatar}
              </span>
              <span className="max-w-28 truncate">{match.host.name}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-lg font-semibold tabular-nums">
            {taken}
            <span className="text-sm font-normal text-muted">/{match.capacity}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
