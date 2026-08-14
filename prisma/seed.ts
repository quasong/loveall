import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' }),
})

function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d
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
      homeCourt: 'Olympic Forest Park Tennis Center',
      playStyle: 'BOTH',
    },
    {
      email: 'lin@loveall.dev',
      name: 'Lin Zhiyao',
      avatar: '🦊',
      ntrp: 4.0,
      homeCourt: 'Chaoyang Park Tennis Courts',
      playStyle: 'SINGLES',
    },
    {
      email: 'zhou@loveall.dev',
      name: 'Zhou Ye',
      avatar: '🐯',
      ntrp: 3.5,
      homeCourt: 'Olympic Forest Park Tennis Center',
      playStyle: 'DOUBLES',
    },
    {
      email: 'qi@loveall.dev',
      name: 'Qi Xiaoman',
      avatar: '🐼',
      ntrp: 3.0,
      homeCourt: 'Haidian Gymnasium',
      playStyle: 'DOUBLES',
    },
    {
      email: 'ye@loveall.dev',
      name: 'Ye Chuan',
      avatar: '⚡️',
      ntrp: 4.5,
      homeCourt: 'National Tennis Center',
      playStyle: 'SINGLES',
    },
    {
      email: 'an@loveall.dev',
      name: 'An Yinuo',
      avatar: '🍀',
      ntrp: 2.5,
      homeCourt: 'Xidan Tennis Club',
      playStyle: 'BOTH',
    },
  ]

  const users = await Promise.all(
    people.map((p) => prisma.user.create({ data: { ...p, passwordHash } })),
  )
  const [demo, lin, zhou, qi, ye, an] = users

  const matches = [
    {
      hostId: zhou.id,
      title: 'Midweek evening doubles, need 2',
      courtName: 'Olympic Forest Park Tennis Center, court 3',
      courtArea: 'Chaoyang',
      startsAt: at(1, 19),
      durationMin: 120,
      capacity: 4,
      minNtrp: 3.0,
      maxNtrp: 4.0,
      format: 'DOUBLES',
      feeCents: 6000,
      note: 'Lit court, we split the fee. I bring the balls — just bring water.',
      members: [qi.id],
    },
    {
      hostId: lin.id,
      title: 'Weekend singles, come ready to run',
      courtName: 'Chaoyang Park Tennis Courts, court 1',
      courtArea: 'Chaoyang',
      startsAt: at(3, 9),
      durationMin: 90,
      capacity: 2,
      minNtrp: 3.5,
      maxNtrp: 4.5,
      format: 'SINGLES',
      feeCents: 5000,
      note: 'Warm up for 15 minutes, then play two sets.',
      members: [],
    },
    {
      hostId: ye.id,
      title: 'Drill session: forehand and backhand',
      courtName: 'National Tennis Center, court 7',
      courtArea: 'Chaoyang',
      startsAt: at(2, 18, 30),
      durationMin: 90,
      capacity: 6,
      minNtrp: 2.5,
      maxNtrp: 4.0,
      format: 'DRILL',
      feeCents: 12000,
      note: 'Coach-led. Price covers the court and the balls. Closes once it fills up.',
      members: [qi.id, an.id, demo.id],
    },
    {
      hostId: qi.id,
      title: 'Morning doubles, beginners welcome',
      courtName: 'Haidian Gymnasium indoor courts',
      courtArea: 'Haidian',
      startsAt: at(4, 8),
      durationMin: 120,
      capacity: 4,
      minNtrp: 2.0,
      maxNtrp: 3.5,
      format: 'DOUBLES',
      feeCents: 4000,
      note: "Indoor, so rain isn't a problem. New players welcome — this one is for fun.",
      members: [an.id],
    },
    {
      hostId: an.id,
      title: 'Friday night hit, nothing serious',
      courtName: 'Xidan Tennis Club',
      courtArea: 'Xicheng',
      startsAt: at(5, 20),
      durationMin: 120,
      capacity: 4,
      minNtrp: 1.5,
      maxNtrp: 3.0,
      format: 'DOUBLES',
      feeCents: 0,
      note: 'Court is already booked. Just show up.',
      members: [],
    },
    {
      hostId: lin.id,
      title: '(Finished) Singles last week',
      courtName: 'Chaoyang Park Tennis Courts, court 2',
      courtArea: 'Chaoyang',
      startsAt: at(-5, 10),
      durationMin: 90,
      capacity: 2,
      minNtrp: 3.5,
      maxNtrp: 4.5,
      format: 'SINGLES',
      feeCents: 5000,
      note: null,
      members: [ye.id],
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

  const first = await prisma.match.findFirst({ where: { hostId: zhou.id } })
  if (first) {
    await prisma.comment.createMany({
      data: [
        { matchId: first.id, userId: qi.id, body: "I might be 10 minutes late — start without me." },
        { matchId: first.id, userId: zhou.id, body: "No problem, we'll warm up first." },
        {
          matchId: first.id,
          userId: an.id,
          body: 'If you still need someone, I can bring a friend who plays around 3.0.',
        },
      ],
    })
  }

  console.log(`Seeded ${users.length} users and ${matches.length} matches.`)
  console.log('Demo account: demo@loveall.dev / tennis123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
