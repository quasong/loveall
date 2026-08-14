import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { cache } from 'react'
import { prisma } from './prisma'

const COOKIE = 'loveall_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function secret() {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('Missing AUTH_SECRET environment variable')
  return new TextEncoder().encode(s)
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())

  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(COOKIE)
}

/** The signed-in user, or null. Hits the database at most once per request. */
export const getCurrentUser = cache(async () => {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    const id = payload.sub
    if (!id) return null
    return await prisma.user.findUnique({ where: { id } })
  } catch {
    return null
  }
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Please sign in first')
  return user
}
