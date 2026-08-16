/**
 * Both seed scripts write data no real database should ever hold, and one of
 * them empties every table first. `.env` on a developer's machine is one
 * `vercel env pull` away from pointing at the deployed database, so refuse
 * anything that isn't obviously local unless the caller says otherwise on
 * purpose.
 */
export function assertLocalDatabase(what: string) {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL')

  if (process.env.ALLOW_REMOTE_SEED === '1') {
    console.warn(`ALLOW_REMOTE_SEED=1 — ${what} against a non-local database on purpose.`)
    return
  }

  const host = new URL(url).hostname
  const local =
    host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')

  if (!local) {
    throw new Error(
      `Refusing to run ${what} against "${host}" — this script is for local development.\n` +
        'Point DATABASE_URL at a local database, or set ALLOW_REMOTE_SEED=1 if you really mean it.',
    )
  }
}
