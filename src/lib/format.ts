export const FORMATS = {
  SINGLES: 'Singles',
  DOUBLES: 'Doubles',
  DRILL: 'Drills / hitting',
} as const

export const PLAY_STYLES = {
  SINGLES: 'Prefers singles',
  DOUBLES: 'Prefers doubles',
  BOTH: 'Either is fine',
} as const

export type FormatKey = keyof typeof FORMATS

export const NTRP_STEPS = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0]

export const NTRP_HINTS: Record<string, string> = {
  '1.5': 'Just starting out, still learning the strokes',
  '2.0': 'Can get a few balls back, placement is inconsistent',
  '2.5': 'Can sustain a slow rally',
  '3.0': 'Fairly consistent placement at medium pace',
  '3.5': 'Controls direction, starting to play tactically',
  '4.0': 'Dependable strokes with some offense',
  '4.5': 'Varies pace and direction to take control of points',
  '5.0': 'Well-rounded, tournament experience',
  '5.5': 'Semi-professional level',
  '6.0': 'Professional or top collegiate level',
}

export const AREAS = [
  'Chaoyang',
  'Haidian',
  'Dongcheng',
  'Xicheng',
  'Fengtai',
  'Tongzhou',
  'Shunyi',
  'Changping',
  'Daxing',
  'Other',
]

export function fmtMoney(cents: number) {
  if (cents === 0) return 'Free'
  return `¥${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)} / person`
}

export function fmtNtrpRange(min: number, max: number) {
  if (min <= 1 && max >= 7) return 'Any level'
  return `NTRP ${min.toFixed(1)} – ${max.toFixed(1)}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function fmtDateTime(d: Date, durationMin?: number) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const base = `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (!durationMin) return base
  const end = new Date(d.getTime() + durationMin * 60_000)
  return `${base}–${pad(end.getHours())}:${pad(end.getMinutes())}`
}

export function fmtRelative(d: Date, now = new Date()) {
  const diff = d.getTime() - now.getTime()
  const abs = Math.abs(diff)
  if (abs < 60_000) return 'just now'

  const mins = Math.round(abs / 60_000)
  const hours = Math.round(abs / 3_600_000)
  const days = Math.round(abs / 86_400_000)
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`
  const amount =
    mins < 60 ? plural(mins, 'minute') : hours < 24 ? plural(hours, 'hour') : plural(days, 'day')

  return diff >= 0 ? `in ${amount}` : `${amount} ago`
}

/** Local-time string for a <input type="datetime-local"> value */
export function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
