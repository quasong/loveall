'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { register } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/submit-button'
import { AuthDivider, GoogleButton } from '@/components/google-button'
import { NTRP_STEPS, NTRP_HINTS } from '@/lib/format'

export default function RegisterPage() {
  const [state, formAction] = useActionState(register, null)
  const [ntrp, setNtrp] = useState(3.0)

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Join Love All</h1>
      <p className="mb-6 text-sm text-muted">
        Rate your own level so you get matched with people you can rally with.
      </p>

      <div className="card space-y-4 p-6">
        <GoogleButton label="Sign up with Google" />
        <AuthDivider />

        <form action={formAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Display name
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={20}
              className="field"
              placeholder="What people call you on court"
            />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="field"
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
              minLength={8}
              autoComplete="new-password"
              className="field"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="label" htmlFor="ntrp">
              Self-rated NTRP · <span className="text-court-600">{ntrp.toFixed(1)}</span>
            </label>
            <input
              id="ntrp"
              name="ntrp"
              type="range"
              min={NTRP_STEPS[0]}
              max={NTRP_STEPS[NTRP_STEPS.length - 1]}
              step={0.5}
              value={ntrp}
              onChange={(e) => setNtrp(Number(e.target.value))}
              className="w-full accent-court-600"
            />
            <p className="mt-1 text-xs text-muted">{NTRP_HINTS[ntrp.toFixed(1)]}</p>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <SubmitButton className="btn-primary w-full">Sign up</SubmitButton>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-court-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
