'use client'

import { useActionState, useState } from 'react'
import { createMatch } from '@/lib/actions/matches'
import { SubmitButton } from '@/components/submit-button'
import { AREAS, FORMATS, NTRP_STEPS, toLocalInputValue } from '@/lib/format'

function defaultStart() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(19, 0, 0, 0)
  return toLocalInputValue(d)
}

export function NewMatchForm({ defaultNtrp, defaultCourt }: { defaultNtrp: number; defaultCourt: string }) {
  const [state, formAction] = useActionState(createMatch, null)
  const [minNtrp, setMinNtrp] = useState(Math.max(1.5, defaultNtrp - 0.5))
  const [maxNtrp, setMaxNtrp] = useState(Math.min(6.0, defaultNtrp + 0.5))
  const [format, setFormat] = useState('DOUBLES')

  return (
    <form action={formAction} className="card space-y-5 p-6">
      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={40}
          className="field"
          placeholder="Wednesday evening doubles, need 2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="courtName">
            Court
          </label>
          <input
            id="courtName"
            name="courtName"
            required
            defaultValue={defaultCourt}
            className="field"
            placeholder="e.g. Olympic Forest Park, court 3"
          />
        </div>
        <div>
          <label className="label" htmlFor="courtArea">
            Area
          </label>
          <select id="courtArea" name="courtArea" required className="field" defaultValue="">
            <option value="" disabled>
              Pick an area
            </option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="startsAt">
            Start time
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={defaultStart()}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="durationMin">
            Duration
          </label>
          <select id="durationMin" name="durationMin" defaultValue="120" className="field">
            {[60, 90, 120, 150, 180].map((m) => (
              <option key={m} value={m}>
                {m / 60} {m === 60 ? 'hour' : 'hours'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="label">Format</span>
        <div className="flex gap-2">
          {Object.entries(FORMATS).map(([k, v]) => (
            <label
              key={k}
              className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition ${
                format === k ? 'border-court-600 bg-court-50 text-court-700' : 'border-line bg-white text-muted'
              }`}
            >
              <input
                type="radio"
                name="format"
                value={k}
                checked={format === k}
                onChange={() => {
                  setFormat(k)
                }}
                className="sr-only"
              />
              {v}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="capacity">
            Players (including you)
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={2}
            max={12}
            required
            defaultValue={format === 'SINGLES' ? 2 : 4}
            key={format}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="feeYuan">
            Cost per person (¥)
          </label>
          <input id="feeYuan" name="feeYuan" type="number" min={0} step={1} defaultValue={0} className="field" />
        </div>
      </div>

      <div>
        <span className="label">
          Level range ·{' '}
          <span className="text-court-600">
            NTRP {minNtrp.toFixed(1)} – {maxNtrp.toFixed(1)}
          </span>
        </span>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-xs text-muted">
            Minimum
            <input
              name="minNtrp"
              type="range"
              min={NTRP_STEPS[0]}
              max={NTRP_STEPS[NTRP_STEPS.length - 1]}
              step={0.5}
              value={minNtrp}
              onChange={(e) => {
                const v = Number(e.target.value)
                setMinNtrp(v)
                if (v > maxNtrp) setMaxNtrp(v)
              }}
              className="w-full accent-court-600"
            />
          </label>
          <label className="text-xs text-muted">
            Maximum
            <input
              name="maxNtrp"
              type="range"
              min={NTRP_STEPS[0]}
              max={NTRP_STEPS[NTRP_STEPS.length - 1]}
              step={0.5}
              value={maxNtrp}
              onChange={(e) => {
                const v = Number(e.target.value)
                setMaxNtrp(v)
                if (v < minNtrp) setMinNtrp(v)
              }}
              className="w-full accent-court-600"
            />
          </label>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="note">
          Notes (optional)
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          className="field resize-none"
          placeholder="How to find the court, who brings balls, what happens if it rains…"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton className="btn-primary w-full" pendingText="Posting…">
        Post match
      </SubmitButton>
    </form>
  )
}
