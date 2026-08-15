import { NextResponse } from 'next/server'
import { authorizationUrl, googleConfigured, pkceChallenge, randomToken } from '@/lib/google'

const FLOW_COOKIE_MAX_AGE = 60 * 10 // ten minutes to finish signing in

/** Starts the Google flow: stash the one-time secrets, then hand off. */
export async function GET(request: Request) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL('/login?error=google_unconfigured', request.url))
  }

  const state = randomToken()
  const nonce = randomToken()
  const codeVerifier = randomToken(48)

  const response = NextResponse.redirect(
    authorizationUrl({
      request,
      state,
      nonce,
      codeChallenge: await pkceChallenge(codeVerifier),
    }),
  )

  // These three never reach client-side JavaScript. `state` is what proves the
  // callback belongs to a flow this browser started, so a forged callback URL
  // cannot sign anyone in.
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: FLOW_COOKIE_MAX_AGE,
  }
  response.cookies.set('g_state', state, options)
  response.cookies.set('g_nonce', nonce, options)
  response.cookies.set('g_verifier', codeVerifier, options)

  return response
}
