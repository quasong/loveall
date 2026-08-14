import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getStoredLocation, NEARBY_RADIUS_KM } from '@/lib/location'
import { distanceKm } from '@/lib/geo'
import { MatchCard } from '@/components/match-card'
import { Hero } from '@/components/hero'
import { QuickHost } from '@/components/quick-host'
import { LocationGate } from '@/components/location-gate'
import { FORMATS } from '@/lib/format'
import type { Prisma } from '@prisma/client'

type SearchParams = Promise<{
  q?: string
  format?: string
  fit?: string
  past?: string
  tab?: string
  everywhere?: string
}>

const TABS = [
  { key: 'all', label: 'All matches' },
  { key: 'joined', label: "I'm playing" },
  { key: 'hosted', label: 'Hosting' },
]

export default async function MatchesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const [user, place] = await Promise.all([getCurrentUser(), getStoredLocation()])

  const tab = user && TABS.some((t) => t.key === sp.tab) ? sp.tab! : 'all'
  const showPast = sp.past === '1'
  const q = (sp.q ?? '').trim()
  const here = place?.status === 'allowed' ? place : null
  // A search or an explicit "everywhere" means the visitor is looking past their own city.
  const nearbyOnly = !!here && !q && sp.everywhere !== '1'

  const where: Prisma.MatchWhereInput = {}
  if (q) {
    // SQLite's LIKE is already case-insensitive for ASCII, which is what `contains` compiles to
    where.OR = [
      { city: { contains: q } },
      { country: { contains: q } },
      { courtName: { contains: q } },
      { title: { contains: q } },
    ]
  }
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

  const [found, cities] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { startsAt: showPast ? 'desc' : 'asc' },
      take: 200,
      include: {
        host: { select: { name: true, avatar: true } },
        _count: { select: { signups: true } },
        ...(user ? { signups: { where: { userId: user.id }, select: { id: true } } } : {}),
      },
    }),
    prisma.match.findMany({
      where: { cancelled: false, startsAt: { gte: new Date() } },
      distinct: ['city'],
      select: { city: true },
      orderBy: { city: 'asc' },
      take: 8,
    }),
  ])

  // Courts have positions; matches typed in by hand only have a city name, so
  // fall back to comparing that against wherever the visitor is.
  const withDistance = found.map((m) => ({
    match: m,
    km:
      here && m.lat != null && m.lon != null
        ? distanceKm(here, { lat: m.lat, lon: m.lon })
        : null,
  }))

  const matches = nearbyOnly
    ? withDistance.filter(
        ({ match, km }) =>
          (km != null && km <= NEARBY_RADIUS_KM) ||
          (km == null && match.city.toLowerCase() === here!.city.toLowerCase()),
      )
    : withDistance

  const listed = matches.slice(0, 50)

  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    const merged = {
      q: sp.q,
      format: sp.format,
      fit: sp.fit,
      past: sp.past,
      everywhere: sp.everywhere,
      tab,
      ...patch,
    }
    for (const [k, v] of Object.entries(merged)) if (v && v !== 'all') next.set(k, v)
    const s = next.toString()
    return s ? `/matches?${s}#open-matches` : '/matches#open-matches'
  }

  return (
    <div>
      <Hero signedIn={!!user} />

      <div id="open-matches" className="scroll-mt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {nearbyOnly ? `Matches near ${here!.city}` : 'Open matches'}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {nearbyOnly
                ? `Within ${NEARBY_RADIUS_KM} km of you. `
                : here
                  ? 'Everywhere. '
                  : ''}
              {user
                ? `You rated yourself NTRP ${user.ntrp.toFixed(1)}.`
                : 'Sign in to join matches and host your own.'}
              {here && (
                <>
                  {' '}
                  <Link
                    href={qs({ everywhere: nearbyOnly ? '1' : undefined, q: undefined })}
                    className="text-court-600 hover:underline"
                  >
                    {nearbyOnly ? 'Show everywhere' : `Back to ${here.city}`}
                  </Link>
                </>
              )}
            </p>
          </div>
          {user && (
            <div className="flex gap-1 rounded-full border border-line bg-white p-1 text-sm">
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
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div>
            <LocationGate decided={!!place} />

            <form method="get" action="/matches" className="card mb-4 space-y-3 p-4">
              <input type="hidden" name="tab" value={tab} />
              <div className="flex flex-wrap gap-3">
                <div className="min-w-48 flex-1">
                  <label className="label" htmlFor="q">
                    Where
                  </label>
                  <input
                    id="q"
                    name="q"
                    defaultValue={q}
                    className="field"
                    placeholder="City, country or court — anywhere"
                  />
                </div>
                <div className="min-w-36">
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
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                {user && (
                  <label className="flex items-center gap-2">
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="past"
                    value="1"
                    defaultChecked={showPast}
                    className="size-4 accent-court-600"
                  />
                  Include finished &amp; cancelled
                </label>
                <button className="btn-ghost ml-auto">Search</button>
              </div>
            </form>

            {cities.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">Playing now in</span>
                {cities.map((c) => (
                  <Link
                    key={c.city}
                    href={qs({ q: c.city })}
                    className={`chip transition hover:border-court-200 hover:text-court-700 ${
                      q.toLowerCase() === c.city.toLowerCase() ? 'border-court-200 bg-court-50 text-court-700' : ''
                    }`}
                  >
                    {c.city}
                  </Link>
                ))}
                {q && (
                  <Link href={qs({ q: undefined })} className="text-muted hover:text-ink">
                    Clear
                  </Link>
                )}
              </div>
            )}

            {listed.length === 0 ? (
              <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
                <span className="text-3xl">🎾</span>
                <p className="font-medium">No matches here yet</p>
                <p className="text-sm text-muted">
                  {nearbyOnly
                    ? `Nothing within ${NEARBY_RADIUS_KM} km of ${here!.city} right now.`
                    : q
                      ? `Nothing in “${q}” right now.`
                      : 'Try a different search, or post the first one.'}
                </p>
                {nearbyOnly && (
                  <Link href={qs({ everywhere: '1' })} className="btn-ghost mt-2">
                    Show matches everywhere
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {listed.map(({ match, km }) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    km={km}
                    joined={
                      'signups' in match &&
                      Array.isArray(match.signups) &&
                      match.signups.length > 0
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <QuickHost
            signedIn={!!user}
            defaultCourt={user?.homeCourt ?? ''}
            origin={here ? { lat: here.lat, lon: here.lon } : null}
          />
        </div>
      </div>
    </div>
  )
}
