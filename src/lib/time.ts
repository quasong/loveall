/**
 * Matches happen at a physical court somewhere in the world, so every match
 * carries the court's IANA time zone. `startsAt` is stored as an absolute
 * instant; the wall-clock time the host typed is only meaningful together with
 * that zone, and everyone sees the match in the court's local time.
 */

export function isValidTimeZone(tz: string) {
  if (!tz) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** All zones the runtime knows about, for the picker. */
export function allTimeZones(): string[] {
  const supported = (
    Intl as typeof Intl & { supportedValuesOf?: (k: string) => string[] }
  ).supportedValuesOf
  try {
    return supported ? supported('timeZone') : ['UTC']
  } catch {
    return ['UTC']
  }
}

/** How far `tz` is ahead of UTC at the given instant, in milliseconds. */
function zoneOffsetMs(instant: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0')
  const asIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  )
  return asIfUtc - instant.getTime()
}

/**
 * Turn the wall-clock string from a `datetime-local` input ("2026-08-15T19:00")
 * into the instant it refers to at the court, rather than on whatever machine
 * happens to run this code.
 */
export function wallClockToInstant(wallClock: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(wallClock)
  if (!m) return null

  const [, y, mo, d, h, mi] = m
  const naive = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi))

  // Subtracting the offset lands us near the right instant; re-measuring at that
  // instant settles the cases where the guess fell on the other side of a DST shift.
  const guess = new Date(naive - zoneOffsetMs(new Date(naive), tz))
  const settled = new Date(naive - zoneOffsetMs(guess, tz))
  return Number.isNaN(settled.getTime()) ? null : settled
}

/** The same instant as a `datetime-local` value in the court's zone. */
export function instantToWallClock(instant: Date, tz: string) {
  const shifted = new Date(instant.getTime() + zoneOffsetMs(instant, tz))
  return shifted.toISOString().slice(0, 16)
}

/** "Sat, Aug 15 · 19:00–21:00 CEST" — always in the court's local time. */
export function fmtDateTimeInZone(instant: Date, tz: string, durationMin?: number) {
  const zone = isValidTimeZone(tz) ? tz : 'UTC'

  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(instant)

  const clock = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)

  const label = zoneAbbreviation(instant, zone)
  const start = clock(instant)
  if (!durationMin) return `${day} · ${start} ${label}`

  const end = clock(new Date(instant.getTime() + durationMin * 60_000))
  return `${day} · ${start}–${end} ${label}`
}

/** "CEST", or "GMT+8" for zones without a common abbreviation. */
export function zoneAbbreviation(instant: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'short',
  }).formatToParts(instant)
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? tz
}
