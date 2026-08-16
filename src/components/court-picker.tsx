'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import type { PickedCourt } from './court-map-dialog'

export type { PickedCourt }

/**
 * Leaflet and its stylesheet are ~150 kB that only matter once someone opens the
 * map. The match list renders this button next to every host form, so the dialog
 * is pulled in on first open rather than shipped with the page.
 */
const CourtMapDialog = dynamic(() => import('./court-map-dialog'), { ssr: false })

type Props = {
  /** Where to open the map, when the visitor has already shared a position. */
  origin: { lat: number; lon: number } | null
  onPick: (court: PickedCourt) => void
}

export function CourtPicker({ origin, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost w-full">
        🗺️ Pick a court on the map
      </button>
      {/* The picker is used from inside the host form, and its own search box is
          a form too — so the dialog is portalled out rather than nested, which
          would make the search button submit the match instead. */}
      {open &&
        mounted &&
        createPortal(
          <CourtMapDialog origin={origin} onPick={onPick} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  )
}
