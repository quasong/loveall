import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { MatchCard } from '@/components/match-card'
import { AREAS, FORMATS } from '@/lib/format'
import type { Prisma } from '@prisma/client'

type SearchParams = Promise<{
  area?: string
  format?: string
  fit?: string
  past?: string
  tab?: string
}>

const TABS = [
  { key: 'all', label: 'All matches' },
  { key: 'joined', label: "I'm playing" },
  { key: 'hosted', label: 'Hosting' },
]

export default async function MatchesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const user = await getCurrentUser()
  const tab = user && TABS.some((t) => t.key === sp.tab) ? sp.tab! : 'all'
  const showPast = sp.past === '1'

  const where: Prisma.MatchWhereInput = {}
  if (sp.area) where.courtArea = sp.area
  if (sp.format) where.format = sp.format
  if (!showPast) {
    where.startsAt = { gte: new Date() }
    where.cancelled = false
  }
  if (sp.fit === '1' && user) {
    where.minNtrp = { lte: user.ntrp }
    where.maxNtrp = { gte: user.ntrp }
  }
  if (tab === 'joined' && user) where.signups = { some: { userId: user.id } }
  if (tab === 'hosted' && user) where.hostId = user.id

  const matches = await prisma.match.findMany({
    where,
    orderBy: { startsAt: showPast ? 'desc' : 'asc' },
    take: 50,
    include: {
      host: { select: { name: true, avatar: true } },
      _count: { select: { signups: true } },
      ...(user ? { signups: { where: { userId: user.id }, select: { id: true } } } : {}),
    },
  })

  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    const merged = { area: sp.area, format: sp.format, fit: sp.fit, past: sp.past, tab, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v && v !== 'all') next.set(k, v)
    const s = next.toString()
    return s ? `/matches?${s}` : '/matches'
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Open matches</h1>
          <p className="mt-1 text-sm text-muted">
            {user
              ? `You rated yourself NTRP ${user.ntrp.toFixed(1)} — find a match you can play.`
              : 'Sign in to join matches and host your own.'}
          </p>
        </div>
        {user && (
          <Link href="/matches/new" className="btn-primary">
            Host a match
          </Link>
        )}
      </div>

      {user && (
        <div className="mb-4 flex gap-1 rounded-full border border-line bg-white p-1 text-sm">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={qs({ tab: t.key })}
              className={`rounded-full px-4 py-1.5 transition ${
                tab === t.key ? 'bg-court-600 text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}

      <form method="get" action="/matches" className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="tab" value={tab} />
        <div className="min-w-32">
          <label className="label" htmlFor="area">
            Area
          </label>
          <select id="area" name="area" defaultValue={sp.area ?? ''} className="field">
            <option value="">All areas</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-32">
          <label className="label" htmlFor="format">
            Format
          </label>
          <select id="format" name="format" defaultValue={sp.format ?? ''} className="field">
            <option value="">All formats</option>
            {Object.entries(FORMATS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <label className="flex items-center gap-2 pb-2.5 text-sm">
            <input
              type="checkbox"
              name="fit"
              value="1"
              defaultChecked={sp.fit === '1'}
              className="size-4 accent-court-600"
            />
            Only my level
          </label>
        )}

        <label className="flex items-center gap-2 pb-2.5 text-sm">
          <input
            type="checkbox"
            name="past"
            value="1"
            defaultChecked={showPast}
            className="size-4 accent-court-600"
          />
          Include finished & cancelled
        </label>

        <button className="btn-ghost ml-auto">Filter</button>
      </form>

      {matches.length === 0 ? (
        <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
          <span className="text-3xl">🎾</span>
          <p className="font-medium">No matches here yet</p>
          <p className="text-sm text-muted">Try different filters, or host one yourself.</p>
          {user && (
            <Link href="/matches/new" className="btn-primary mt-2">
              Host a match
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              joined={'signups' in m && Array.isArray(m.signups) && m.signups.length > 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
