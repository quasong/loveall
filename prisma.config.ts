import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

/**
 * Migrations need a direct connection. A pooled endpoint in transaction mode —
 * which is what DATABASE_URL should point at for the app itself, since every
 * serverless instance opens its own pool — cannot carry the session-level work
 * that migrating involves. Hosted Postgres hands out both URLs; DIRECT_URL is
 * the unpooled one.
 */
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!url) {
  throw new Error(
    'Set DATABASE_URL (and DIRECT_URL, if your database has a separate unpooled endpoint) before running Prisma.',
  )
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: { path: path.join('prisma', 'migrations') },
  datasource: { url },
})
