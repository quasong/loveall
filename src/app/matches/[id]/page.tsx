import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { MatchActions } from '@/components/match-actions'
import { CommentForm } from '@/components/comment-form'
import { FORMATS, fmtDateTime, fmtMoney, fmtNtrpRange, fmtRelative } from '@/lib/format'

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      host: true,
      signups: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, avatar: true, ntrp: true, playStyle: true } } },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, avatar: true } } },
      },
    },
  })

  if (!match) notFound()

  const taken = match.signups.length
  const left = match.capacity - taken
  const past = match.startsAt.getTime() < Date.now()
  const isHost = user?.id === match.hostId
  const isJoined = !!user && match.signups.some((s) => s.userId === user.id)

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/matches" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← Back to all matches
      </Link>

      {match.cancelled && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          The host cancelled this match.
        </div>
      )}
      {!match.cancelled && past && (
        <div className="mb-4 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">
          This match is over.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-[1fr_18rem] md:items-start">
        <div className="space-y-5">
          <div className="card p-6">
            <h1 className="text-xl font-semibold tracking-tight">{match.title}</h1>
            <p className="mt-2 text-sm">
              {fmtDateTime(match.startsAt, match.durationMin)}
              <span className="text-muted"> · {fmtRelative(match.startsAt)}</span>
            </p>

            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Court</dt>
                <dd className="mt-0.5">
                  {match.courtName}
                  <span className="text-muted"> ({match.courtArea})</span>
                </dd>
              </div>
              <div>
                <dt className="text-muted">Format</dt>
                <dd className="mt-0.5">{FORMATS[match.format as keyof typeof FORMATS] ?? match.format}</dd>
              </div>
              <div>
                <dt className="text-muted">Level</dt>
                <dd className="mt-0.5">{fmtNtrpRange(match.minNtrp, match.maxNtrp)}</dd>
              </div>
              <div>
                <dt className="text-muted">Cost</dt>
                <dd className="mt-0.5">{fmtMoney(match.feeCents)}</dd>
              </div>
            </dl>

            {match.note && (
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-court-50 px-4 py-3 text-sm">{match.note}</p>
            )}
          </div>

          <section className="card p-6">
            <h2 className="mb-4 font-semibold">
              Messages <span className="text-sm font-normal text-muted">{match.comments.length}</span>
            </h2>

            {match.comments.length === 0 ? (
              <p className="mb-4 text-sm text-muted">No messages yet.</p>
            ) : (
              <ul className="mb-5 space-y-4">
                {match.comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-court-50">
                      {c.user.avatar}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{c.user.name}</span>
                        <span className="ml-2 text-xs text-muted">{fmtRelative(c.createdAt)}</span>
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink/90">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {user ? (
              <CommentForm matchId={match.id} />
            ) : (
              <p className="text-sm text-muted">
                <Link href="/login" className="text-court-600 hover:underline">
                  Sign in
                </Link>{' '}
                to leave a message.
              </p>
            )}
          </section>
        </div>

        <aside className="card space-y-4 p-5 md:sticky md:top-20">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Players</span>
              <span className="text-lg font-semibold tabular-nums">
                {taken}
                <span className="text-sm font-normal text-muted">/{match.capacity}</span>
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-court-50">
              <div
                className="h-full rounded-full bg-court-600 transition-all"
                style={{ width: `${Math.min(100, (taken / match.capacity) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {match.cancelled
                ? 'Cancelled'
                : past
                  ? 'Finished'
                  : left > 0
                    ? `${left} spot${left === 1 ? '' : 's'} left`
                    : 'Full'}
            </p>
          </div>

          <ul className="space-y-2.5">
            {match.signups.map((s) => (
              <li key={s.id} className="flex items-center gap-2.5 text-sm">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-court-50">
                  {s.user.avatar}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.user.name}</span>
                {s.userId === match.hostId && (
                  <span className="chip border-court-200 bg-court-50 text-court-700">Host</span>
                )}
                <span className="shrink-0 text-xs tabular-nums text-muted">{s.user.ntrp.toFixed(1)}</span>
              </li>
            ))}
            {Array.from({ length: Math.max(0, left) }).map((_, i) => (
              <li key={`empty-${i}`} className="flex items-center gap-2.5 text-sm text-muted">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-line">
                  ＋
                </span>
                Open spot
              </li>
            ))}
          </ul>

          {user ? (
            <MatchActions
              matchId={match.id}
              isHost={isHost}
              isJoined={isJoined}
              isFull={left <= 0}
              isClosed={match.cancelled || past}
            />
          ) : (
            <Link href="/login" className="btn-primary w-full">
              Sign in to join
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}
