import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { wallClockToInstant } from '../src/lib/time'
import { assertLocalDatabase } from './local-only'

/**
 * Bulk test data, for looking at the app with a realistic amount in it —
 * long lists, busy cities, matches in every time zone, a spread of levels.
 *
 * Unlike `seed.ts` this never empties the database. Every account it creates
 * lives under `@loveall.test`, and a re-run removes only those accounts before
 * writing fresh ones — the curated demo accounts, and any real account signed
 * in through Google, are left alone. Deleting a test host cascades to their
 * matches, signups and comments, so a re-run leaves no orphans behind.
 *
 *   npm run db:seed:bulk
 */

assertLocalDatabase('the bulk test seed')

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

/** Everything this script owns is addressed by this suffix. */
const TEST_DOMAIN = '@loveall.test'

const USER_COUNT = 240
const MATCH_COUNT = 600

/** Deterministic PRNG, so a re-run reproduces the same world. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = rng(20260816)
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
/** NTRP moves in half steps, the way the ratings are actually quoted. */
const halfStep = (min: number, max: number) => min + Math.round(rand() * (max - min) * 2) / 2

/**
 * A match starts at a wall-clock time at the court, so these are written the
 * way a host would enter them: "19:00, three days from now, in Tokyo".
 */
function at(dayOffset: number, hour: number, minute: number, tz: string) {
  const target = new Date(Date.now() + dayOffset * 86_400_000)
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(target)

  const pad = (n: number) => String(n).padStart(2, '0')
  const instant = wallClockToInstant(`${ymd}T${pad(hour)}:${pad(minute)}`, tz)
  if (!instant) throw new Error(`Could not build a start time for ${tz}`)
  return instant
}

type City = {
  city: string
  country: string
  lat: number
  lon: number
  tz: string
  currency: string
  /** Roughly what an hour on a court costs here, in minor units. */
  fee: number
  courts: string[]
}

const CITIES: City[] = [
  { city: 'Lisbon', country: 'Portugal', lat: 38.7276, lon: -9.1533, tz: 'Europe/Lisbon', currency: 'EUR', fee: 1200, courts: ['Clube VII', 'Estádio Nacional', 'Monsanto Ténis'] },
  { city: 'Tokyo', country: 'Japan', lat: 35.6432, lon: 139.7936, tz: 'Asia/Tokyo', currency: 'JPY', fee: 2200, courts: ['Ariake Tennis Forest Park', 'Meiji Jingu Gaien', 'Komazawa Olympic Park'] },
  { city: 'Melbourne', country: 'Australia', lat: -37.8218, lon: 144.9787, tz: 'Australia/Melbourne', currency: 'AUD', fee: 3000, courts: ['Melbourne Park', 'Albert Reserve', 'Fawkner Park'] },
  { city: 'Lagos', country: 'Nigeria', lat: 6.4515, lon: 3.429, tz: 'Africa/Lagos', currency: 'NGN', fee: 500000, courts: ['Ikoyi Club 1938', 'Lagos Lawn Tennis Club'] },
  { city: 'New York', country: 'United States', lat: 40.6552, lon: -73.9698, tz: 'America/New_York', currency: 'USD', fee: 2000, courts: ['Prospect Park Tennis Center', 'USTA Billie Jean King Center', 'Central Park Tennis Center'] },
  { city: 'Stockholm', country: 'Sweden', lat: 59.3455, lon: 18.0894, tz: 'Europe/Stockholm', currency: 'SEK', fee: 22000, courts: ['Kungliga Tennishallen', 'Tennisstadion', 'Djursholms TK'] },
  { city: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', currency: 'GBP', fee: 1800, courts: ['Islington Tennis Centre', 'Regents Park', 'Hyde Park Tennis'] },
  { city: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris', currency: 'EUR', fee: 1600, courts: ['Tennis Club de Paris', 'Jardin du Luxembourg', 'Halle Carpentier'] },
  { city: 'Barcelona', country: 'Spain', lat: 41.3874, lon: 2.1686, tz: 'Europe/Madrid', currency: 'EUR', fee: 1400, courts: ['Real Club de Tenis', 'Complex Esportiu Can Caralleu'] },
  { city: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin', currency: 'EUR', fee: 1500, courts: ['LTTC Rot-Weiß', 'Tennisclub Grün-Gold', 'SCC Berlin'] },
  { city: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome', currency: 'EUR', fee: 1600, courts: ['Foro Italico', 'Circolo Tennis Roma'] },
  { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041, tz: 'Europe/Amsterdam', currency: 'EUR', fee: 1700, courts: ['Amstelpark', 'Tennisclub IJburg'] },
  { city: 'Vienna', country: 'Austria', lat: 48.2082, lon: 16.3738, tz: 'Europe/Vienna', currency: 'EUR', fee: 1600, courts: ['Wiener Tennisclub', 'Sportclub Donaustadt'] },
  { city: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417, tz: 'Europe/Zurich', currency: 'CHF', fee: 3500, courts: ['Grasshopper Club', 'TC Seefeld'] },
  { city: 'Prague', country: 'Czechia', lat: 50.0755, lon: 14.4378, tz: 'Europe/Prague', currency: 'CZK', fee: 45000, courts: ['I. ČLTK Praha', 'Tennis Club Strahov'] },
  { city: 'Warsaw', country: 'Poland', lat: 52.2297, lon: 21.0122, tz: 'Europe/Warsaw', currency: 'PLN', fee: 8000, courts: ['Legia Tenis', 'Warszawianka'] },
  { city: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7275, tz: 'Europe/Athens', currency: 'EUR', fee: 1200, courts: ['Athens Tennis Club', 'Glyfada Tennis'] },
  { city: 'Istanbul', country: 'Türkiye', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul', currency: 'TRY', fee: 40000, courts: ['Enka Spor Kulübü', 'İstanbul Tenis Kulübü'] },
  { city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai', currency: 'AED', fee: 12000, courts: ['Dubai Tennis Stadium', 'Emirates Golf Club Courts'] },
  { city: 'Mumbai', country: 'India', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata', currency: 'INR', fee: 80000, courts: ['CCI Tennis', 'MSLTA Courts', 'Khar Gymkhana'] },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore', currency: 'SGD', fee: 2400, courts: ['Kallang Tennis Centre', 'Farrer Park Tennis'] },
  { city: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong', currency: 'HKD', fee: 14000, courts: ['Victoria Park Tennis', 'Kowloon Tsai Park'] },
  { city: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai', currency: 'CNY', fee: 12000, courts: ['Qizhong Forest Stadium', 'Xianxia Tennis Center'] },
  { city: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.978, tz: 'Asia/Seoul', currency: 'KRW', fee: 2500000, courts: ['Olympic Park Tennis', 'Jamsil Tennis Courts'] },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney', currency: 'AUD', fee: 3200, courts: ['Sydney Olympic Park', 'Rushcutters Bay Tennis'] },
  { city: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland', currency: 'NZD', fee: 2800, courts: ['ASB Tennis Arena', 'Stanley Street Courts'] },
  { city: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto', currency: 'CAD', fee: 2600, courts: ['Sobeys Stadium', 'Toronto Lawn Tennis Club'] },
  { city: 'Vancouver', country: 'Canada', lat: 49.2827, lon: -123.1207, tz: 'America/Vancouver', currency: 'CAD', fee: 2400, courts: ['Stanley Park Courts', 'Hollyburn Country Club'] },
  { city: 'Los Angeles', country: 'United States', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles', currency: 'USD', fee: 2400, courts: ['UCLA Tennis Center', 'Griffith Park Courts', 'Riviera Tennis Club'] },
  { city: 'Chicago', country: 'United States', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago', currency: 'USD', fee: 2200, courts: ['XS Tennis Village', 'Waveland Courts'] },
  { city: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City', currency: 'MXN', fee: 30000, courts: ['Club Reforma', 'Deportivo Chapultepec'] },
  { city: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires', currency: 'ARS', fee: 400000, courts: ['Buenos Aires Lawn Tennis Club', 'Racket Club'] },
  { city: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo', currency: 'BRL', fee: 9000, courts: ['Clube Paineiras', 'Esporte Clube Pinheiros'] },
  { city: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693, tz: 'America/Santiago', currency: 'CLP', fee: 1500000, courts: ['Club de Tenis Santiago', 'Estadio Nacional Courts'] },
  { city: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg', currency: 'ZAR', fee: 20000, courts: ['Kelvin Grove Club', 'Western Province Cricket Club Courts'] },
  { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219, tz: 'Africa/Nairobi', currency: 'KES', fee: 150000, courts: ['Nairobi Club', 'Karen Country Club'] },
  { city: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo', currency: 'EGP', fee: 40000, courts: ['Gezira Sporting Club', 'Heliopolis Club'] },
  { city: 'Casablanca', country: 'Morocco', lat: 33.5731, lon: -7.5898, tz: 'Africa/Casablanca', currency: 'MAD', fee: 15000, courts: ['Complexe Al Amal', 'TC Casablanca'] },
]

const FIRST_NAMES = [
  'Amara', 'Sofia', 'Liam', 'Yuki', 'Hana', 'Mateo', 'Chloe', 'Omar', 'Nils', 'Priya',
  'Diego', 'Elif', 'Kwame', 'Ingrid', 'Rafael', 'Mei', 'Tomás', 'Aisha', 'Lukas', 'Nadia',
  'Kenji', 'Isabel', 'Sven', 'Fatima', 'Andrés', 'Lucia', 'Hiro', 'Zara', 'Pieter', 'Anouk',
  'Marco', 'Leila', 'Bjorn', 'Camila', 'Ravi', 'Astrid', 'Joon', 'Noor', 'Felipe', 'Sanne',
  'Emeka', 'Clara', 'Dmitri', 'Thandi', 'Jonas', 'Rania', 'Santiago', 'Wei', 'Freya', 'Idris',
  'Marta', 'Tariq', 'Linnea', 'Pablo', 'Sakura', 'Ahmet', 'Grace', 'Nikolai', 'Valentina', 'Seo-yun',
]

const LAST_NAMES = [
  'Okonkwo', 'Silva', 'Nakamura', 'Lindqvist', 'Fernandes', 'Ali', 'Kowalski', 'Rossi', 'Chen', 'Patel',
  'García', 'Yılmaz', 'Andersen', 'Mensah', 'Nowak', 'Tanaka', 'Moreau', 'Haddad', 'Novak', 'Ferreira',
  'Bergström', 'Kimani', 'Weber', 'Oyelaran', 'Dubois', 'Kaur', 'Lombardi', 'Eriksen', 'Achebe', 'Vargas',
  'Hoffmann', 'Suzuki', 'Petrov', 'Mbeki', 'Whitfield', 'Costa', 'Larsen', 'Rahman', 'Jansen', 'Park',
  'Castillo', 'Bakker', 'Ndlovu', 'Marchetti', 'Sørensen', 'Farah', 'Delgado', 'Wong', 'Virtanen', 'Bianchi',
]

const AVATARS = ['🎾', '🦊', '🐯', '🐼', '⚡️', '🍀', '🐨', '🦅', '🐬', '🔥', '🌊', '🦁', '🐺', '🌟', '🍋', '🦜', '🐝', '🌵', '🎯', '🥎']

const PLAY_STYLES = ['SINGLES', 'DOUBLES', 'BOTH'] as const

const BIOS = [
  'Weekend player, mostly baseline. Happy to hit with anyone.',
  'Coming back after a long break — rusty but keen.',
  'Serve and volley, badly. Working on it.',
  'Play three times a week, always looking for a hitting partner.',
  'League player in winter, social hitter in summer.',
  'New in town and looking for a regular game.',
  'Left-handed, heavy topspin forehand.',
  'Prefer doubles but will play anything.',
  'Early mornings only — I work nights.',
  'Coach by trade, still love a competitive set.',
  null,
  null,
]

const TITLES = {
  SINGLES: [
    'Early singles before work',
    'Competitive singles, two sets',
    'Looking for a singles hit',
    'Singles — bring your A game',
    'Sunday morning singles',
    'Practice sets, no pressure',
  ],
  // Titles stay clear of spot counts — the card already shows how full a match
  // is, and a generated "need 2" on a full court just reads as a bug.
  DOUBLES: [
    'Midweek evening doubles',
    'Social doubles, all welcome',
    'Saturday doubles at the club',
    'Doubles night, court booked',
    'Friendly doubles, beginners fine',
    'Morning doubles before it gets hot',
    'After-work doubles',
  ],
  DRILL: [
    'Drill session: forehand and backhand',
    'Serve practice, coach-led',
    'Footwork and volleys clinic',
    'Cardio tennis hour',
    'Group drills, all levels',
  ],
} as const

const NOTES = [
  'I bring the balls — just bring water.',
  'Court is booked and paid for. Just show up.',
  'We split the booking fee on the day.',
  'Lit court, so the evening light is fine.',
  'Clay — bring shoes that will take it.',
  'Indoor, so weather is not a problem.',
  'Warm up for 15 minutes, then straight into sets.',
  'Parking is tight, allow ten extra minutes.',
  'Happy to lend a racquet if you need one.',
  'This one is for fun, not for the ladder.',
  null,
  null,
  null,
]

const COMMENTS = [
  'I might be 10 minutes late — start without me.',
  "No problem, we'll warm up first.",
  'Is there parking nearby?',
  'Yes, street parking on the north side is usually free.',
  'What level is everyone playing at?',
  'Around 3.5, but nobody is counting.',
  'Can I bring a friend? Similar level.',
  'Sure, there is room for one more.',
  'Weather looks iffy — do we have a backup?',
  'Indoor court is available if it rains.',
  'Just joined, looking forward to it!',
  'See you all there.',
  'Sorry, something came up — I have to drop out.',
  'Does anyone have a spare can of balls?',
  'I can pick some up on the way.',
]

async function main() {
  const before = {
    users: await prisma.user.count(),
    matches: await prisma.match.count(),
  }

  // Clear only what a previous run of *this* script created. Cascades take the
  // matches, signups and comments belonging to those hosts with them.
  const removed = await prisma.user.deleteMany({
    where: { email: { endsWith: TEST_DOMAIN } },
  })
  if (removed.count > 0) console.log(`Cleared ${removed.count} test accounts from a previous run.`)

  // One hash for everyone: bcrypt is deliberately slow, and hashing 240 times
  // would dominate the runtime of this script for no benefit.
  const passwordHash = await bcrypt.hash('tennis123', 10)

  const usedNames = new Set<string>()
  const people = Array.from({ length: USER_COUNT }, (_, i) => {
    let name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    while (usedNames.has(name)) name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    usedNames.add(name)

    const home = pick(CITIES)
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]+/g, '.')

    return {
      // The index keeps these unique no matter what the name pool produces.
      email: `${slug}.${i}${TEST_DOMAIN}`,
      username: `${slug}.${i}`.slice(0, 30),
      name,
      passwordHash,
      avatar: pick(AVATARS),
      ntrp: halfStep(1.5, 6.0),
      homeCourt: `${pick(home.courts)}, ${home.city}`,
      playStyle: pick(PLAY_STYLES),
      bio: pick(BIOS),
    }
  })

  await prisma.user.createMany({ data: people })
  const testUsers = await prisma.user.findMany({
    where: { email: { endsWith: TEST_DOMAIN } },
    select: { id: true, ntrp: true },
  })

  // Existing accounts join in too, so the demo login and your own account have
  // something in "I'm playing" rather than an empty tab.
  const existing = await prisma.user.findMany({
    where: { email: { not: { endsWith: TEST_DOMAIN } } },
    select: { id: true, ntrp: true },
  })
  const everyone = [...testUsers, ...existing]

  const matches = Array.from({ length: MATCH_COUNT }, () => {
    const place = pick(CITIES)
    const host = pick(testUsers)
    const format = pick(['SINGLES', 'DOUBLES', 'DRILL'] as const)

    const capacity = format === 'SINGLES' ? 2 : format === 'DOUBLES' ? 4 : int(4, 8)
    const minNtrp = halfStep(1.5, 4.5)
    const maxNtrp = Math.min(7.0, minNtrp + halfStep(0.5, 2.0))

    // A quarter of them sit in the past so the "finished" state is easy to find.
    const dayOffset = rand() < 0.25 ? int(-30, -1) : int(0, 45)
    const hour = pick([7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 21])
    const minute = pick([0, 0, 0, 30])

    // Most hosts pick the court on the map; the rest type the name in by hand
    // and so have no position at all. Both paths need to render.
    const mapped = rand() > 0.15
    const jitter = () => (rand() - 0.5) * 0.09 // ≈ 5 km around the city centre

    const feeBase = place.fee
    const fee = pick([0, 0, feeBase, Math.round(feeBase * 0.5), Math.round(feeBase * 1.5)])

    return {
      hostId: host.id,
      title: pick(TITLES[format]),
      courtName: `${pick(place.courts)}, court ${int(1, 14)}`,
      city: place.city,
      country: place.country,
      lat: mapped ? +(place.lat + jitter()).toFixed(4) : null,
      lon: mapped ? +(place.lon + jitter()).toFixed(4) : null,
      timezone: place.tz,
      startsAt: at(dayOffset, hour, minute, place.tz),
      durationMin: pick([60, 90, 90, 120, 120, 150]),
      capacity,
      minNtrp,
      maxNtrp,
      format,
      feeCents: fee,
      currency: place.currency,
      note: pick(NOTES),
      // A handful are called off, which is its own badge on the card.
      cancelled: rand() < 0.06,
    }
  })

  await prisma.match.createMany({ data: matches })
  const created = await prisma.match.findMany({
    where: { host: { email: { endsWith: TEST_DOMAIN } } },
    select: { id: true, hostId: true, capacity: true, minNtrp: true, maxNtrp: true },
  })

  // The host always holds a spot; the rest fill to a varying degree so the list
  // shows a mix of wide open, nearly full, and full.
  const signups: { matchId: string; userId: string }[] = []
  for (const match of created) {
    signups.push({ matchId: match.id, userId: match.hostId })

    const others = new Set<string>()
    const wanted = int(0, match.capacity - 1)
    // Players who fit the advertised level, since that is what the app filters on.
    const eligible = everyone.filter(
      (u) => u.id !== match.hostId && u.ntrp >= match.minNtrp && u.ntrp <= match.maxNtrp,
    )
    const pool = eligible.length > 0 ? eligible : everyone

    for (let i = 0; i < wanted * 3 && others.size < wanted; i++) {
      const candidate = pick(pool)
      if (candidate.id !== match.hostId) others.add(candidate.id)
    }
    for (const userId of others) signups.push({ matchId: match.id, userId })
  }
  await prisma.signup.createMany({ data: signups, skipDuplicates: true })

  // Conversations on about a quarter of them.
  const comments: { matchId: string; userId: string; body: string }[] = []
  for (const match of created) {
    if (rand() > 0.25) continue
    const participants = signups.filter((s) => s.matchId === match.id)
    for (let i = 0; i < int(1, 4); i++) {
      comments.push({
        matchId: match.id,
        userId: pick(participants).userId,
        body: pick(COMMENTS),
      })
    }
  }
  await prisma.comment.createMany({ data: comments })

  const after = {
    users: await prisma.user.count(),
    matches: await prisma.match.count(),
    signups: await prisma.signup.count(),
    comments: await prisma.comment.count(),
  }

  console.log(
    `Added ${USER_COUNT} test players and ${MATCH_COUNT} matches across ${CITIES.length} cities.`,
  )
  console.log(`Users:   ${before.users} → ${after.users}`)
  console.log(`Matches: ${before.matches} → ${after.matches}`)
  console.log(`Signups: ${after.signups}, comments: ${after.comments}`)
  console.log(`Every test account signs in with the password tennis123.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
