'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { createMatch } from '@/lib/actions/matches'
import { SubmitButton } from '@/components/submit-button'
import { StartTimeInput } from '@/components/start-time-input'
import { CourtPicker, type PickedCourt } from '@/components/court-picker'
import { COUNTRY_SUGGESTIONS, FORMATS } from '@/lib/format'

/**
 * The short version of the host form, sitting next to the match list. Anything
 * it leaves out (level range, cost, notes) falls back to an open default, and
 * the full form is one link away.
 */
export function QuickHost({
  signedIn,
  defaultCourt,
  origin,
}: {
  signedIn: boolean
  defaultCourt: string
  origin: { lat: number; lon: number } | null
}) {
  const [state, formAction] = useActionState(createMatch, null)
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

  if (!signedIn) {
    return (
      <aside className="card p-5 lg:sticky lg:top-20">
        <h2 className="font-semibold">Got a court booked?</h2>
        <p className="mt-2 text-sm text-muted">
          Post it here and let players in that city fill the empty spots — wherever in the world
          the court happens to be.
        </p>
        <Link href="/register" className="btn-primary mt-4 w-full">
          Create an account
        </Link>
        <p className="mt-3 text-center text-sm text-muted">
          Already have one?{' '}
          <Link href="/login" className="text-court-600 hover:underline">
            Sign in
          </Link>
        </p>
      </aside>
    )
  }

  return (
    <aside className="card p-5 lg:sticky lg:top-20">
      <h2 className="font-semibold">Start a match</h2>
      <p className="mt-1 text-sm text-muted">Anywhere in the world. You take the first spot.</p>

      <form action={formAction} className="mt-4 space-y-3">
        {point && (
          <>
            <input type="hidden" name="lat" value={point.lat} />
            <input type="hidden" name="lon" value={point.lon} />
          </>
        )}

        <CourtPicker origin={origin} onPick={applyCourt} />

        <div>
          <label className="label" htmlFor="qh-title">
            Title
          </label>
          <input
            id="qh-title"
            name="title"
            required
            maxLength={40}
            className="field"
            placeholder="Sunday doubles, need 2"
          />
        </div>

        <div>
          <label className="label" htmlFor="qh-court">
            Court
          </label>
          <input
            id="qh-court"
            name="courtName"
            required
            value={court}
            onChange={(e) => {
              setCourt(e.target.value)
              setPoint(null) // typed by hand: the pin no longer describes this court
            }}
            className="field"
            placeholder="Court name"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="qh-city">
              City
            </label>
            <input
              id="qh-city"
              name="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="field"
              placeholder="Lisbon"
            />
          </div>
          <div>
            <label className="label" htmlFor="qh-country">
              Country
            </label>
            <input
              id="qh-country"
              name="country"
              required
              list="country-suggestions"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="field"
              placeholder="Portugal"
            />
            <datalist id="country-suggestions">
              {COUNTRY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="qh-starts">
            Start (court's local time)
          </label>
          <StartTimeInput id="qh-starts" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="qh-format">
              Format
            </label>
            <select id="qh-format" name="format" defaultValue="DOUBLES" className="field">
              {Object.entries(FORMATS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="qh-capacity">
              Players
            </label>
            <input
              id="qh-capacity"
              name="capacity"
              type="number"
              min={2}
              max={12}
              required
              defaultValue={4}
              className="field"
            />
          </div>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton className="btn-primary w-full" pendingText="Posting…">
          Post match
        </SubmitButton>

        <p className="text-center text-xs text-muted">
          Open to any level and free by default.{' '}
          <Link href="/matches/new" className="text-court-600 hover:underline">
            More options
          </Link>
        </p>
      </form>
    </aside>
  )
}
