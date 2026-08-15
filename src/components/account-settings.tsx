'use client'

import { useActionState, useState } from 'react'
import { setPassword, setUsername } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/submit-button'
import { USERNAME_MAX } from '@/lib/username'

export function UsernameCard({ current }: { current: string }) {
  const [state, formAction] = useActionState(setUsername, null)
  const [value, setValue] = useState(current)

  return (
    <form action={formAction} className="card space-y-3 p-6">
      <div>
        <h2 className="font-semibold">Username</h2>
        <p className="mt-1 text-sm text-muted">
          Your handle across Love All, separate from the display name on your matches.
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted">@</span>
        <input
          name="username"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={USERNAME_MAX}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="field"
          placeholder="yourname"
          aria-label="Username"
        />
      </div>
      <p className="text-xs text-muted">Letters, numbers, periods and underscores.</p>

      <div className="flex items-center gap-3">
        <SubmitButton className="btn-primary" pendingText="Saving…">
          {current ? 'Change username' : 'Claim username'}
        </SubmitButton>
        {state?.ok && <span className="text-sm text-court-600">Saved</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  )
}

export function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction] = useActionState(setPassword, null)

  return (
    <form action={formAction} className="card space-y-3 p-6">
      <div>
        <h2 className="font-semibold">{hasPassword ? 'Change password' : 'Set a password'}</h2>
        <p className="mt-1 text-sm text-muted">
          {hasPassword
            ? 'Sign in with your username or email, or keep using Google.'
            : 'Optional. Adds a way in besides Google, using your username or email.'}
        </p>
      </div>

      {/* Changing a password proves the current one: a borrowed session should
          not be enough to lock the owner out of their own account. */}
      {hasPassword && (
        <div>
          <label className="label" htmlFor="currentPassword">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="field"
          />
        </div>
      )}

      <div>
        <label className="label" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
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
        <label className="label" htmlFor="confirm">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field"
        />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton className="btn-primary" pendingText="Saving…">
          {hasPassword ? 'Update password' : 'Set password'}
        </SubmitButton>
        {state?.ok && <span className="text-sm text-court-600">Saved</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  )
}
