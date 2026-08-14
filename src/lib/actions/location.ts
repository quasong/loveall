'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { reverseGeocode } from '@/lib/geo'
import { LOCATION_COOKIE, type StoredLocation } from '@/lib/location'

const MAX_AGE = 60 * 60 * 24 * 30

async function store(value: StoredLocation) {
  const jar = await cookies()
  jar.set(LOCATION_COOKIE, JSON.stringify(value), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

/**
 * The browser hands over coordinates; the city name is resolved here so the
 * position itself only ever travels between the visitor and this server.
 */
export async function saveLocation(lat: number, lon: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { error: 'Invalid position' }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return { error: 'Invalid position' }

  const place = await reverseGeocode(lat, lon)

  await store({
    status: 'allowed',
    lat,
    lon,
    city: place?.city ?? 'your area',
    country: place?.country ?? '',
  })

  revalidatePath('/matches')
  return { ok: true, city: place?.city ?? null }
}

export async function declineLocation() {
  await store({ status: 'declined' })
  revalidatePath('/matches')
  return { ok: true }
}

export async function clearLocation() {
  const jar = await cookies()
  jar.delete(LOCATION_COOKIE)
  revalidatePath('/matches')
  return { ok: true }
}
