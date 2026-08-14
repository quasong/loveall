import 'server-only'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const LOCATION_COOKIE = 'loveall_place'
export const NEARBY_RADIUS_KM = 100

export type StoredLocation =
  | { status: 'allowed'; lat: number; lon: number; city: string; country: string }
  | { status: 'declined' }

/** What the visitor decided about sharing their position, if anything yet. */
export const getStoredLocation = cache(async (): Promise<StoredLocation | null> => {
  const raw = (await cookies()).get(LOCATION_COOKIE)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredLocation
    if (parsed.status === 'declined') return parsed
    if (
      parsed.status === 'allowed' &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lon)
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
})
