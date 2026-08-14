import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { wallClockToInstant } from '../src/lib/time'

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' }),
})

/**
 * A match starts at a wall-clock time at the court, so the demo data is written
 * the same way a host would enter it: "19:00, three days from now, in Tokyo".
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

async function main() {
  await prisma.comment.deleteMany()
  await prisma.signup.deleteMany()
  await prisma.match.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('tennis123', 10)

  const people = [
    {
      email: 'demo@loveall.dev',
      name: 'Demo User',
      avatar: '🎾',
      ntrp: 3.5,
      homeCourt: 'Prospect Park Tennis Center',
      playStyle: 'BOTH',
    },
    {
      email: 'yuki@loveall.dev',
      name: 'Yuki Nakamura',
      avatar: '🦊',
      ntrp: 4.0,
      homeCourt: 'Ariake Tennis Forest Park',
      playStyle: 'SINGLES',
    },
    {
      email: 'tomas@loveall.dev',
      name: 'Tomás Ferreira',
      avatar: '🐯',
      ntrp: 3.5,
      homeCourt: 'Clube VII, Lisbon',
      playStyle: 'DOUBLES',
    },
    {
      email: 'mara@loveall.dev',
      name: 'Mara Oyelaran',
      avatar: '🐼',
      ntrp: 3.0,
      homeCourt: 'Ikoyi Club 1938',
      playStyle: 'DOUBLES',
    },
    {
      email: 'zoe@loveall.dev',
      name: 'Zoe Whitfield',
      avatar: '⚡️',
      ntrp: 4.5,
      homeCourt: 'Melbourne Park',
      playStyle: 'SINGLES',
    },
    {
      email: 'anders@loveall.dev',
      name: 'Anders Lindqvist',
      avatar: '🍀',
      ntrp: 2.5,
      homeCourt: 'Kungliga Tennishallen',
      playStyle: 'BOTH',
    },
  ]

  const users = await Promise.all(
    people.map((p) => prisma.user.create({ data: { ...p, passwordHash } })),
  )
  const [demo, yuki, tomas, mara, zoe, anders] = users

  const matches = [
    {
      hostId: tomas.id,
      title: 'Midweek evening doubles, need 2',
      courtName: 'Clube VII, court 3',
      city: 'Lisbon',
      country: 'Portugal',
      timezone: 'Europe/Lisbon',
      startsAt: at(1, 19, 0, 'Europe/Lisbon'),
      durationMin: 120,
      capacity: 4,
      minNtrp: 3.0,
      maxNtrp: 4.0,
      format: 'DOUBLES',
      currency: 'EUR',
      feeCents: 1200,
      note: 'Lit court, we split the booking. I bring the balls — just bring water.',
      members: [mara.id],
    },
    {
      hostId: yuki.id,
      title: 'Early singles before work',
      courtName: 'Ariake Tennis Forest Park, court 5',
      city: 'Tokyo',
      country: 'Japan',
      timezone: 'Asia/Tokyo',
      startsAt: at(2, 7, 0, 'Asia/Tokyo'),
      durationMin: 90,
      capacity: 2,
      minNtrp: 3.5,
      maxNtrp: 4.5,
      format: 'SINGLES',
      currency: 'JPY',
      feeCents: 2200,
      note: 'Warm up for 15 minutes, then two sets. Out by 08:45 sharp.',
      members: [],
    },
    {
      hostId: zoe.id,
      title: 'Drill session: forehand and backhand',
      courtName: 'Melbourne Park, court 12',
      city: 'Melbourne',
      country: 'Australia',
      timezone: 'Australia/Melbourne',
      startsAt: at(2, 18, 30, 'Australia/Melbourne'),
      durationMin: 90,
      capacity: 6,
      minNtrp: 2.5,
      maxNtrp: 4.0,
      format: 'DRILL',
      currency: 'AUD',
      feeCents: 3000,
      note: 'Coach-led. Price covers the court and the balls. Closes once it fills up.',
      members: [demo.id],
    },
    {
      hostId: mara.id,
      title: 'Morning doubles, beginners welcome',
      courtName: 'Ikoyi Club 1938, court 2',
      city: 'Lagos',
      country: 'Nigeria',
      timezone: 'Africa/Lagos',
      startsAt: at(4, 8, 0, 'Africa/Lagos'),
      durationMin: 120,
      capacity: 4,
      minNtrp: 2.0,
      maxNtrp: 3.5,
      format: 'DOUBLES',
      currency: 'USD',
      feeCents: 800,
      note: 'Shaded between sets. New players welcome — this one is for fun.',
      members: [anders.id],
    },
    {
      hostId: demo.id,
      title: 'Saturday hit in Brooklyn',
      courtName: 'Prospect Park Tennis Center, court 4',
      city: 'New York',
      country: 'United States',
      timezone: 'America/New_York',
      startsAt: at(3, 10, 0, 'America/New_York'),
      durationMin: 120,
      capacity: 4,
      minNtrp: 3.0,
      maxNtrp: 4.0,
      format: 'DOUBLES',
      currency: 'USD',
      feeCents: 2000,
      note: 'Booked for two hours. Bring a spare can if you have one.',
      members: [],
    },
    {
      hostId: anders.id,
      title: 'Friday night hit, nothing serious',
      courtName: 'Kungliga Tennishallen',
      city: 'Stockholm',
      country: 'Sweden',
      timezone: 'Europe/Stockholm',
      startsAt: at(5, 20, 0, 'Europe/Stockholm'),
      durationMin: 120,
      capacity: 4,
      minNtrp: 1.5,
      maxNtrp: 3.0,
      format: 'DOUBLES',
      currency: 'SEK',
      feeCents: 0,
      note: 'Court is already booked and paid for. Just show up.',
      members: [],
    },
    {
      hostId: yuki.id,
      title: '(Finished) Singles last week',
      courtName: 'Ariake Tennis Forest Park, court 2',
      city: 'Tokyo',
      country: 'Japan',
      timezone: 'Asia/Tokyo',
      startsAt: at(-5, 10, 0, 'Asia/Tokyo'),
      durationMin: 90,
      capacity: 2,
      minNtrp: 3.5,
      maxNtrp: 4.5,
      format: 'SINGLES',
      currency: 'JPY',
      feeCents: 2200,
      note: null,
      members: [zoe.id],
    },
  ]

  for (const { members, ...data } of matches) {
    await prisma.match.create({
      data: {
        ...data,
        signups: { create: [{ userId: data.hostId }, ...members.map((userId) => ({ userId }))] },
      },
    })
  }

  const first = await prisma.match.findFirst({ where: { hostId: tomas.id } })
  if (first) {
    await prisma.comment.createMany({
      data: [
        { matchId: first.id, userId: mara.id, body: 'I might be 10 minutes late — start without me.' },
        { matchId: first.id, userId: tomas.id, body: "No problem, we'll warm up first." },
        {
          matchId: first.id,
          userId: anders.id,
          body: 'If you still need someone, I can bring a friend who plays around 3.0.',
        },
      ],
    })
  }

  console.log(`Seeded ${users.length} users and ${matches.length} matches across 6 countries.`)
  console.log('Demo account: demo@loveall.dev / tennis123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
