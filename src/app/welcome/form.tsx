'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { completeSetup } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/submit-button'
import { USERNAME_MAX } from '@/lib/username'

export function WelcomeForm({
  currentUsername,
  suggestion,
}: {
  currentUsername: string
  suggestion: string
}) {
  const [state, formAction] = useActionState(completeSetup, null)
  const [username, setUsername] = useState(suggestion)
  const [password, setPassword] = useState('')

  return (
    <form action={formAction} className="card space-y-5 p-6">
      <div>
        <label className="label" htmlFor="username">
          Username
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted">@</span>
          <input
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={USERNAME_MAX}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="field"
            placeholder="yourname"
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          Letters, numbers, periods and underscores. This is how other players find you, and it is
          different from the display name shown on your matches.
        </p>
      </div>

      <div className="space-y-3 border-t border-line pt-5">
        <div>
          <label className="label" htmlFor="password">
            Password <span className="font-normal text-muted">— optional</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            className="field"
            placeholder="At least 8 characters"
          />
          <p className="mt-1 text-xs text-muted">
            Only needed if you want a way in besides Google. Google sign-in keeps working either
            way.
          </p>
        </div>

        {/* Asking twice only earns its place once something has been typed. */}
        {password && (
          <div>
            <label className="label" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              minLength={8}
              autoComplete="new-password"
              className="field"
            />
          </div>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <SubmitButton className="btn-primary flex-1" pendingText="Saving…">
          {username || password ? 'Save and continue' : 'Continue'}
        </SubmitButton>
        <Link href="/matches" className="btn-ghost">
          Skip
        </Link>
      </div>

      {currentUsername && (
        <p className="text-center text-xs text-muted">
          You are currently @{currentUsername}.
        </p>
      )}
    </form>
  )
}
