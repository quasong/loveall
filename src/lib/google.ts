import 'server-only'
import { createRemoteJWKSet, jwtVerify } from 'jose'

/**
 * Google sign-in, as the plain OAuth 2.0 authorization code flow with PKCE.
 *
 * This is hand-rolled rather than delegated to an auth library because the app
 * already has its own session (a signed cookie, read by `getCurrentUser` in
 * eighteen places). Bringing in Auth.js would mean adopting its session layer
 * too and rewriting all of them; the flow itself is small and every check it
 * relies on is spelled out below.
 */

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com']

/** Google publishes rotating signing keys; jose caches and refreshes them. */
const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export type GoogleIdentity = {
  googleId: string
  email: string
  name: string | null
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

function clientId() {
  const id = process.env.GOOGLE_CLIENT_ID
  if (!id) throw new Error('Missing GOOGLE_CLIENT_ID')
  return id
}

function clientSecret() {
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!secret) throw new Error('Missing GOOGLE_CLIENT_SECRET')
  return secret
}

/**
 * Must match a redirect URI registered in the Google console character for
 * character. Derived from the request when APP_URL is unset so a dev machine
 * works without configuration, but set APP_URL in production — the incoming
 * Host header is attacker-controlled behind a careless proxy.
 */
export function redirectUri(request: Request) {
  const base = process.env.APP_URL ?? new URL(request.url).origin
  return new URL('/api/auth/google/callback', base).toString()
}

export function authorizationUrl(options: {
  request: Request
  state: string
  nonce: string
  codeChallenge: string
}) {
  const url = new URL(AUTH_ENDPOINT)
  url.searchParams.set('client_id', clientId())
  url.searchParams.set('redirect_uri', redirectUri(options.request))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', options.state)
  url.searchParams.set('nonce', options.nonce)
  url.searchParams.set('code_challenge', options.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  // Ask for an account choice rather than silently reusing whichever session
  // the browser happens to hold.
  url.searchParams.set('prompt', 'select_account')
  return url.toString()
}

/** Random URL-safe string for state, nonce and the PKCE verifier. */
export function randomToken(bytes = 32) {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Buffer.from(buf).toString('base64url')
}

export async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return Buffer.from(digest).toString('base64url')
}

/**
 * Trade the one-time code for tokens, then verify the ID token properly:
 * signature against Google's published keys, issuer, audience, expiry, and the
 * nonce this browser started the flow with. An unverified ID token is just a
 * JSON blob anyone could have written.
 */
export async function exchangeCode(options: {
  request: Request
  code: string
  codeVerifier: string
  nonce: string
}): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      code: options.code,
      code_verifier: options.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri(options.request),
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
  }

  const tokens = (await res.json()) as { id_token?: string }
  if (!tokens.id_token) throw new Error('Google returned no id_token')

  const { payload } = await jwtVerify(tokens.id_token, jwks, {
    issuer: ISSUERS,
    audience: clientId(),
  })

  if (payload.nonce !== options.nonce) throw new Error('Nonce mismatch')

  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null
  // Without this an attacker could register an unverified Google address that
  // matches somebody's password account and take it over on first sign-in.
  if (!email || payload.email_verified !== true) {
    throw new Error('Google account has no verified email address')
  }

  const sub = typeof payload.sub === 'string' ? payload.sub : null
  if (!sub) throw new Error('Google returned no subject id')

  return {
    googleId: sub,
    email,
    name: typeof payload.name === 'string' ? payload.name : null,
  }
}
