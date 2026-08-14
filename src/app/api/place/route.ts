import { NextResponse } from 'next/server'
import { geocodePlace, reverseGeocode } from '@/lib/geo'

/**
 * `?lat=&lon=` names the place at a point; `?q=` finds a point for a place.
 * The map picker needs the first when a court is chosen and the second when
 * someone would rather look at another city.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (q) {
    const point = await geocodePlace(q, '')
    if (!point) return NextResponse.json({ error: 'Nothing found' }, { status: 404 })
    const place = await reverseGeocode(point.lat, point.lon)
    return NextResponse.json({ ...point, ...place })
  }

  const lat = Number(searchParams.get('lat'))
  const lon = Number(searchParams.get('lon'))
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'lat and lon, or q, are required' }, { status: 400 })
  }

  const place = await reverseGeocode(lat, lon)
  return NextResponse.json({ lat, lon, city: place?.city ?? '', country: place?.country ?? '' })
}
