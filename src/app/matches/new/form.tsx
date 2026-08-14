'use client'

import { useActionState, useState } from 'react'
import { createMatch } from '@/lib/actions/matches'
import { SubmitButton } from '@/components/submit-button'
import { COUNTRY_SUGGESTIONS, CURRENCIES, FORMATS, NTRP_STEPS } from '@/lib/format'
import { StartTimeInput } from '@/components/start-time-input'
import { CourtPicker, type PickedCourt } from '@/components/court-picker'

export function NewMatchForm({
  defaultNtrp,
  defaultCourt,
  origin,
}: {
  defaultNtrp: number
  defaultCourt: string
  origin: { lat: number; lon: number } | null
}) {
  const [state, formAction] = useActionState(createMatch, null)
  const [minNtrp, setMinNtrp] = useState(Math.max(1.5, defaultNtrp - 0.5))
  const [maxNtrp, setMaxNtrp] = useState(Math.min(6.0, defaultNtrp + 0.5))
  const [format, setFormat] = useState('DOUBLES')
  const [court, setCourt] = useState(defaultCourt)
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [point, setPoint] = useState<{ lat: number; lon: number } | null>(null)

  const applyCourt = (picked: PickedCourt) => {
    setCourt(picked.name)
    if (picked.city) setCity(picked.city)
    if (picked.country) setCountry(picked.country)
    setPoint({ lat: picked.lat, lon: picked.lon })
  }

  return (
    <form action={formAction} className="card space-y-5 p-6">
      {point && (
        <>
          <input type="hidden" name="lat" value={point.lat} />
          <input type="hidden" name="lon" value={point.lon} />
        </>
      )}

      <CourtPicker origin={origin} onPick={applyCourt} />
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

      <div>
        <label className="label" htmlFor="courtName">
          Court
        </label>
        <input
          id="courtName"
          name="courtName"
          required
          value={court}
          onChange={(e) => {
            setCourt(e.target.value)
            setPoint(null)
          }}
          className="field"
          placeholder="e.g. Roland-Garros, court 7"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="city">
            City
          </label>
          <input
            id="city"
            name="city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="field"
            placeholder="Paris"
          />
        </div>
        <div>
          <label className="label" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            name="country"
            required
            list="country-suggestions"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="field"
            placeholder="France"
          />
          <datalist id="country-suggestions">
            {COUNTRY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="startsAt">
            Start time (court's local time)
          </label>
          <StartTimeInput />
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

      <p className="text-xs text-muted">
        Times are read as the court's own local time — the zone comes from where the court is.
      </p>

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
          <label className="label" htmlFor="fee">
            Cost per person
          </label>
          <div className="flex gap-2">
            <input
              id="fee"
              name="fee"
              type="number"
              min={0}
              step={1}
              defaultValue={0}
              className="field"
            />
            <select name="currency" defaultValue="USD" className="field w-28 shrink-0">
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
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
