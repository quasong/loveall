import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL')

  // On serverless the pool is per-instance and instances come and go, so keep it
  // small and point DATABASE_URL at a pooled connection string.
  const adapter = new PrismaPg({ connectionString: url, max: 5 })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
