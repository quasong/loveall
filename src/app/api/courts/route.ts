import { NextResponse } from 'next/server'
import { nearbyCourts } from '@/lib/geo'

/**
 * Overpass is slow and this route tries mirrors in turn, which can exceed the
 * ten seconds a serverless function gets by default.
 */
export const maxDuration = 60

/** Courts around a point, for the map picker. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get('lat'))
  const lon = Number(searchParams.get('lon'))
  const radius = Number(searchParams.get('radius') ?? 8000)

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 })
  }

  const courts = await nearbyCourts(lat, lon, Number.isFinite(radius) ? radius : 8000)
  return NextResponse.json({ courts })
}
