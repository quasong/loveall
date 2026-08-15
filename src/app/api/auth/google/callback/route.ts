import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { exchangeCode, googleConfigured } from '@/lib/google'

function fail(request: Request, reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, request.url))
}

export async function GET(request: Request) {
  if (!googleConfigured()) return fail(request, 'google_unconfigured')

  const url = new URL(request.url)

  // Google reports its own refusals here — most often the person pressing cancel.
  if (url.searchParams.get('error')) return fail(request, 'google_cancelled')

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const jar = await cookies()
  const expectedState = jar.get('g_state')?.value
  const nonce = jar.get('g_nonce')?.value
  const codeVerifier = jar.get('g_verifier')?.value

  // Burn the one-time values whatever happens next.
  jar.delete('g_state')
  jar.delete('g_nonce')
  jar.delete('g_verifier')

  if (!code || !state || !expectedState || !nonce || !codeVerifier) {
    return fail(request, 'google_failed')
  }
  if (state !== expectedState) return fail(request, 'google_failed')

  let identity
  try {
    identity = await exchangeCode({ request, code, codeVerifier, nonce })
  } catch (err) {
    console.error('[auth] Google sign-in failed', err)
    return fail(request, 'google_failed')
  }

  // Match on the Google subject id first: it survives the person renaming their
  // Gmail address, which the email does not.
  let user = await prisma.user.findUnique({ where: { googleId: identity.googleId } })
  let isNew = false

  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: identity.email } })

    if (byEmail) {
      // Same verified address as an existing password account, so link them
      // rather than making a second account nobody asked for.
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: identity.googleId },
      })
    } else {
      isNew = true
      user = await prisma.user.create({
        data: {
          email: identity.email,
          googleId: identity.googleId,
          name: (identity.name ?? identity.email.split('@')[0]).slice(0, 20),
          // No passwordHash: this account signs in with Google only.
        },
      })
    }
  }

  await createSession(user.id)

  // A new account carries the default 3.0 rating, which is a guess. Matching is
  // built on that number, so send them somewhere they can correct it.
  return NextResponse.redirect(new URL(isNew ? '/profile?welcome=1' : '/matches', request.url))
}
