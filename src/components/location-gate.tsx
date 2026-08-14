'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { declineLocation, saveLocation } from '@/lib/actions/location'

type Props = {
  /** Null until the visitor has answered one way or the other. */
  decided: boolean
}

/**
 * Asks in the page before asking the browser. A cold native permission prompt
 * with no explanation is the fastest way to get a permanent "block", which
 * there is no way back from without digging through site settings.
 */
export function LocationGate({ decided }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  if (decided || dismissed) return null

  const ask = () => {
    setError(null)

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('This browser has no location support — search by city instead.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startTransition(async () => {
          const res = await saveLocation(pos.coords.latitude, pos.coords.longitude)
          if (res?.error) setError(res.error)
          else router.refresh()
        })
      },
      (err) => {
        // A denial is an answer: remember it so this doesn't ask again on every visit.
        if (err.code === err.PERMISSION_DENIED) {
          startTransition(async () => {
            await declineLocation()
            router.refresh()
          })
          return
        }
        setError("Couldn't get a fix on your position — search by city instead.")
      },
      { timeout: 10_000, maximumAge: 600_000 },
    )
  }

  const decline = () => {
    startTransition(async () => {
      await declineLocation()
      router.refresh()
    })
  }

  return (
    <div className="card mb-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-court-200 bg-court-50 p-4">
      <div className="min-w-56 flex-1">
        <p className="text-sm font-medium">Show matches near you?</p>
        <p className="mt-0.5 text-sm text-muted">
          {error ?? 'Your position is used to find courts in your city and never leaves this server.'}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={decline} disabled={pending} className="btn-ghost">
          Not now
        </button>
        <button onClick={ask} disabled={pending} className="btn-primary">
          {pending ? 'Locating…' : 'Use my location'}
        </button>
      </div>
    </div>
  )
}
