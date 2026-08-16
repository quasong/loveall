import 'server-only'
import tzLookup from 'tz-lookup'

/**
 * Everything here talks to OpenStreetMap services, which are free and need no
 * key but do ask for a descriptive User-Agent and light traffic. All of it runs
 * on the server, so the browser never talks to a third party directly and the
 * usage policy stays ours to honour.
 */
const UA = 'LoveAll/0.1 (tennis matchups; https://github.com/loveall)'

export type Place = { city: string; country: string }

export type Court = {
  id: string
  name: string
  /** False when OSM has no name for the court, only a shape on the map. */
  named: boolean
  lat: number
  lon: number
  /** Anything OSM knows that helps a host recognise the place. */
  detail?: string
  surface?: string
  indoor?: boolean
  access?: string
}

/** A court's position is the only thing needed to know what time it keeps. */
export function timezoneFor(lat: number, lon: number): string | null {
  try {
    return tzLookup(lat, lon)
  } catch {
    return null
  }
}

export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export async function reverseGeocode(lat: number, lon: number): Promise<Place | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  url.searchParams.set('zoom', '10') // city level
  url.searchParams.set('accept-language', 'en')

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 86_400 },
    })
    if (!res.ok) return null

    const data = (await res.json()) as { address?: Record<string, string> }
    const a = data.address ?? {}
    const city =
      a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? a.state ?? ''
    const country = a.country ?? ''
    if (!city && !country) return null
    return { city: city || country, country }
  } catch {
    return null
  }
}

/** Used when a host types a city instead of picking a court on the map. */
export async function geocodePlace(city: string, country: string) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('q', [city, country].filter(Boolean).join(', '))
  url.searchParams.set('limit', '1')
  url.searchParams.set('accept-language', 'en')

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 86_400 },
    })
    if (!res.ok) return null

    const data = (await res.json()) as Array<{ lat: string; lon: string }>
    const hit = data[0]
    if (!hit) return null
    return { lat: Number(hit.lat), lon: Number(hit.lon) }
  } catch {
    return null
  }
}

type OverpassElement = {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

/**
 * The public Overpass instances are free and unauthenticated, which also means
 * they are frequently saturated — a 504 from the busiest one is routine, so try
 * the mirrors before giving up.
 */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

async function askOverpass(query: string) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(20_000),
        next: { revalidate: 3600 },
      })
      if (res.ok) return (await res.json()) as { elements?: OverpassElement[] }
      console.error('[geo] overpass', endpoint, 'returned', res.status)
    } catch (err) {
      console.error('[geo] overpass', endpoint, 'failed', err instanceof Error ? err.message : err)
    }
  }
  return null
}

/**
 * Overpass answers are cached, but the cache is keyed on the request — and the
 * map hands over the centre of the viewport as raw floats, so two people
 * looking at the same city miss each other by a few metres and each pay for a
 * fresh query. Snapping the centre to a grid makes those one lookup.
 *
 * The grid is ~1 km, and the radius grows by the furthest the snap can move the
 * centre (half a cell diagonally), so nothing within the radius asked for is
 * lost by searching from the corner of a cell instead of the middle.
 */
const GRID_DEG = 0.01
const GRID_SLACK_M = Math.ceil(((GRID_DEG * Math.SQRT2) / 2) * 111_000)

function snapToGrid(v: number) {
  return Math.round(v / GRID_DEG) * GRID_DEG
}

/** Tennis courts and clubs from OpenStreetMap, nearest first. */
export async function nearbyCourts(lat: number, lon: number, radiusM = 8000): Promise<Court[]> {
  const asked = Math.min(Math.max(Math.round(radiusM), 500), 40_000)
  const radius = asked + GRID_SLACK_M
  // Snapped for the query only — distances below are still measured from where
  // the caller actually is.
  const originLat = snapToGrid(lat)
  const originLon = snapToGrid(lon)
  // Kept deliberately cheap: `sport=tennis` already covers pitches, sports
  // centres and most clubs, and a heavy union is what makes these time out.
  const query = `[out:json][timeout:25];
(
  nwr["sport"="tennis"](around:${radius},${originLat.toFixed(2)},${originLon.toFixed(2)});
  nwr["club"="tennis"](around:${radius},${originLat.toFixed(2)},${originLon.toFixed(2)});
);
out center tags 100;`

  try {
    const data = await askOverpass(query)
    if (!data) return []

    const seen = new Set<string>()
    const courts: Court[] = []

    for (const el of data.elements ?? []) {
      const point = el.center ?? (el.lat != null && el.lon != null ? { lat: el.lat, lon: el.lon } : null)
      if (!point) continue

      const tags = el.tags ?? {}
      const name = tags.name || tags['name:en'] || tags.operator || ''
      // An unnamed pitch is hard to tell apart from its neighbours, so give it
      // the street it sits on when OSM knows one.
      const label = name || (tags['addr:street'] ? `Tennis court, ${tags['addr:street']}` : 'Unnamed tennis court')

      // A club is usually mapped as one named area plus a pitch per court, so
      // unnamed ones get collapsed onto a coarser grid (~100 m) to keep the list
      // from filling up with a dozen identical entries for the same place.
      const precision = name ? 4 : 3
      const key = `${label}@${point.lat.toFixed(precision)},${point.lon.toFixed(precision)}`
      if (seen.has(key)) continue
      seen.add(key)

      courts.push({
        id: `${el.type}/${el.id}`,
        name: label,
        named: Boolean(name),
        lat: point.lat,
        lon: point.lon,
        detail: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') || undefined,
        surface: tags.surface,
        indoor: tags.indoor === 'yes' || tags.covered === 'yes',
        access: tags.access,
      })
    }

    // Searching from the corner of a grid cell reaches a little further than
    // asked, so the extra is trimmed here against the caller's real position.
    const askedKm = asked / 1000
    return courts
      .map((c) => ({ court: c, d: distanceKm({ lat, lon }, c) }))
      .filter(({ d }) => d <= askedKm)
      .sort((a, b) => a.d - b.d)
      .map(({ court }) => court)
      .slice(0, 60)
  } catch (err) {
    // Overpass is a shared free service: it rate-limits and times out under load.
    console.error('[geo] court lookup failed', err)
    return []
  }
}
