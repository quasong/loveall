'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { wallClockToInstant } from '@/lib/time'
import { geocodePlace, timezoneFor } from '@/lib/geo'
import { minorUnitsPer } from '@/lib/format'
import type { FormState } from './auth'

export async function createMatch(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in first' }

  const title = String(formData.get('title') ?? '').trim()
  const courtName = String(formData.get('courtName') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  const country = String(formData.get('country') ?? '').trim()
  const latRaw = Number(formData.get('lat'))
  const lonRaw = Number(formData.get('lon'))
  const durationMin = Number(formData.get('durationMin') ?? 120)
  const capacity = Number(formData.get('capacity') ?? 4)
  const minNtrp = Number(formData.get('minNtrp') ?? 1)
  const maxNtrp = Number(formData.get('maxNtrp') ?? 7)
  const format = String(formData.get('format') ?? 'DOUBLES')
  const currency = String(formData.get('currency') ?? 'USD').trim().toUpperCase()
  const fee = Number(formData.get('fee') ?? 0)

  if (title.length < 2) return { error: 'Give this match a title' }
  if (!courtName) return { error: 'Enter the court name' }
  if (!city) return { error: 'Enter the city' }
  if (!country) return { error: 'Enter the country' }

  const hasPoint =
    Number.isFinite(latRaw) &&
    Number.isFinite(lonRaw) &&
    latRaw >= -90 &&
    latRaw <= 90 &&
    lonRaw >= -180 &&
    lonRaw <= 180
  const lat = hasPoint ? latRaw : null
  const lon = hasPoint ? lonRaw : null

  // Where the court is decides what time it keeps. A court picked on the map
  // brings its own position; one typed by hand is placed by its city instead.
  let timezone = lat != null && lon != null ? timezoneFor(lat, lon) : null
  if (!timezone) {
    const point = await geocodePlace(city, country)
    if (point) timezone = timezoneFor(point.lat, point.lon)
  }
  if (!timezone) {
    return { error: "Couldn't work out where that court is — pick it on the map, or check the city and country" }
  }

  // The host types wall-clock time at the court, so it only means something in that zone
  const startsAt = wallClockToInstant(String(formData.get('startsAt') ?? ''), timezone)
  if (!startsAt) return { error: 'That start time is not valid' }
  if (startsAt.getTime() < Date.now()) return { error: 'Start time cannot be in the past' }

  if (!Number.isFinite(capacity) || capacity < 2 || capacity > 12) {
    return { error: 'Player count must be between 2 and 12' }
  }
  if (minNtrp > maxNtrp) return { error: 'NTRP minimum cannot be above the maximum' }
  if (!/^[A-Z]{3}$/.test(currency)) return { error: 'That currency code is not valid' }
  if (!Number.isFinite(fee) || fee < 0) return { error: 'That cost is not valid' }

  const match = await prisma.match.create({
    data: {
      hostId: user.id,
      title,
      courtName,
      city,
      country,
      lat,
      lon,
      timezone,
      startsAt,
      durationMin,
      capacity,
      minNtrp,
      maxNtrp,
      format,
      currency,
      feeCents: Math.round(fee * minorUnitsPer(currency)),
      note: String(formData.get('note') ?? '').trim().slice(0, 500) || null,
      // The host takes one of the spots
      signups: { create: { userId: user.id } },
    },
  })

  revalidatePath('/matches')
  redirect(`/matches/${match.id}`)
}

export async function joinMatch(matchId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in first' }

  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { _count: { select: { signups: true } } },
    })
    if (!match) return { error: 'That match no longer exists' }
    if (match.cancelled) return { error: 'This match was cancelled' }
    if (match.startsAt.getTime() < Date.now()) return { error: 'This match has already started' }
    if (match._count.signups >= match.capacity) return { error: 'This match is full' }
    if (user.ntrp < match.minNtrp || user.ntrp > match.maxNtrp) {
      return {
        error: `This match is for NTRP ${match.minNtrp.toFixed(1)}–${match.maxNtrp.toFixed(1)}, and you rated yourself ${user.ntrp.toFixed(1)}`,
      }
    }

    const existing = await tx.signup.findUnique({
      where: { matchId_userId: { matchId, userId: user.id } },
    })
    if (existing) return { ok: true }

    await tx.signup.create({ data: { matchId, userId: user.id } })
    return { ok: true }
  })

  revalidatePath(`/matches/${matchId}`)
  revalidatePath('/matches')
  return result
}

export async function leaveMatch(matchId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in first' }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return { error: 'That match no longer exists' }
  if (match.hostId === user.id) return { error: "You're the host — cancel the match instead" }

  await prisma.signup.deleteMany({ where: { matchId, userId: user.id } })

  revalidatePath(`/matches/${matchId}`)
  revalidatePath('/matches')
  return { ok: true }
}

export async function cancelMatch(matchId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in first' }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return { error: 'That match no longer exists' }
  if (match.hostId !== user.id) return { error: 'Only the host can cancel this match' }

  await prisma.match.update({ where: { id: matchId }, data: { cancelled: true } })

  revalidatePath(`/matches/${matchId}`)
  revalidatePath('/matches')
  return { ok: true }
}

export async function postComment(matchId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in first' }

  const body = String(formData.get('body') ?? '').trim()
  if (!body) return { error: 'Write something first' }
  if (body.length > 500) return { error: 'A message can be at most 500 characters' }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return { error: 'That match no longer exists' }

  await prisma.comment.create({ data: { matchId, userId: user.id, body } })

  revalidatePath(`/matches/${matchId}`)
  return { ok: true }
}
