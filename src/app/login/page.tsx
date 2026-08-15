'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/submit-button'
import { AuthDivider, GoogleButton } from '@/components/google-button'

/** Reasons the Google round trip can come back without a session. */
const ERRORS: Record<string, string> = {
  google_unconfigured: 'Google sign-in is not set up on this server yet.',
  google_cancelled: 'Google sign-in was cancelled.',
  google_failed: "Google sign-in didn't work. Try again.",
}

function LoginForm() {
  const [state, formAction] = useActionState(login, null)
  const params = useSearchParams()
  const externalError = ERRORS[params.get('error') ?? '']

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mb-6 text-sm text-muted">Sign in to join matches and host your own.</p>

      <div className="card space-y-4 p-6">
        {externalError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {externalError}
          </p>
        )}

        <GoogleButton />
        <AuthDivider />

        <form action={formAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="identifier">
              Username or email
            </label>
            <input
              id="identifier"
              name="identifier"
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="field"
              placeholder="yourname or you@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="field"
            />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <SubmitButton className="btn-primary w-full">Sign in</SubmitButton>
        </form>

        <p className="text-center text-sm text-muted">
          Passwords are optional here — set one from your profile if you want a way in besides{' '}
          <Link href="/register" className="text-court-600 hover:underline">
            Google
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  // useSearchParams needs a boundary so the rest of the page can still prerender.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
