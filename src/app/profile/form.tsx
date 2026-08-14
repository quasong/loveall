'use client'

import { useActionState, useState } from 'react'
import { updateProfile } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/submit-button'
import { NTRP_HINTS, NTRP_STEPS, PLAY_STYLES } from '@/lib/format'

const AVATARS = ['🎾', '🏸', '🔥', '🐯', '🐼', '🦊', '🐧', '🦁', '🌊', '⚡️', '🍀', '🎯']

type Props = {
  user: {
    name: string
    avatar: string
    ntrp: number
    homeCourt: string
    playStyle: string
    bio: string
  }
}

export function ProfileForm({ user }: Props) {
  const [state, formAction] = useActionState(updateProfile, null)
  const [avatar, setAvatar] = useState(user.avatar)
  const [ntrp, setNtrp] = useState(user.ntrp)

  return (
    <form action={formAction} className="card space-y-5 p-6">
      <input type="hidden" name="avatar" value={avatar} />

      <div>
        <span className="label">Avatar</span>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              className={`grid size-10 place-items-center rounded-full border text-lg transition ${
                avatar === a ? 'border-court-600 bg-court-50' : 'border-line bg-white hover:bg-court-50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="name">
          Display name
        </label>
        <input id="name" name="name" required maxLength={20} defaultValue={user.name} className="field" />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="homeCourt">
            Home court
          </label>
          <input
            id="homeCourt"
            name="homeCourt"
            defaultValue={user.homeCourt}
            className="field"
            placeholder="e.g. Olympic Forest Park Tennis Center"
          />
        </div>
        <div>
          <label className="label" htmlFor="playStyle">
            Preference
          </label>
          <select id="playStyle" name="playStyle" defaultValue={user.playStyle} className="field">
            {Object.entries(PLAY_STYLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="bio">
          About you
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={200}
          defaultValue={user.bio}
          className="field resize-none"
          placeholder="Heavy topspin forehand, mostly play doubles on weekends…"
        />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton className="btn-primary" pendingText="Saving…">
          Save
        </SubmitButton>
        {state?.ok && <span className="text-sm text-court-600">Saved</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  )
}
