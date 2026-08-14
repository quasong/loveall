'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/submit-button'

export default function LoginPage() {
  const [state, formAction] = useActionState(login, null)

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mb-6 text-sm text-muted">Sign in to join matches and host your own.</p>

      <form action={formAction} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
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

        <p className="text-center text-sm text-muted">
          No account yet?{' '}
          <Link href="/register" className="text-court-600 hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}
