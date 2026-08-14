'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap, Marker } from 'leaflet'

export type PickedCourt = {
  name: string
  lat: number
  lon: number
  city: string
  country: string
}

type Court = {
  id: string
  name: string
  named: boolean
  lat: number
  lon: number
  detail?: string
  surface?: string
  indoor?: boolean
}

type Props = {
  /** Where to open the map, when the visitor has already shared a position. */
  origin: { lat: number; lon: number } | null
  onPick: (court: PickedCourt) => void
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const s =
    Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(s))
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

function CourtMapDialog({ origin, onPick, onClose }: Props & { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const selectedRef = useRef<string | null>(null)

  const [courts, setCourts] = useState<Court[]>([])
  const [selected, setSelected] = useState<Court | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [centre, setCentre] = useState<{ lat: number; lon: number } | null>(origin)
  const [canSearchArea, setCanSearchArea] = useState(false)
  const [picking, setPicking] = useState(false)

  // The drag handler closes over the first render, so the live centre goes
  // through a ref.
  const centreRef = useRef(centre)
  useEffect(() => {
    centreRef.current = centre
  }, [centre])

  const load = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setStatus(null)
    setCanSearchArea(false)
    setCentre({ lat, lon })
    try {
      const res = await fetch(`/api/courts?lat=${lat}&lon=${lon}&radius=10000`)
      const data = (await res.json()) as { courts?: Court[] }
      const found = data.courts ?? []
      setCourts(found)
      if (found.length === 0) {
        setStatus('No courts mapped around here. Move the map, or type the name in by hand.')
      }
    } catch {
      setStatus('Could not reach the court directory. You can still type the name in by hand.')
    } finally {
      setLoading(false)
    }
  }, [])

  const select = useCallback((court: Court) => {
    setSelected(court)

    const previous = selectedRef.current
    if (previous) markersRef.current.get(previous)?.getElement()?.classList.remove('is-selected')
    markersRef.current.get(court.id)?.getElement()?.classList.add('is-selected')
    selectedRef.current = court.id

    mapRef.current?.panTo([court.lat, court.lon])
  }, [])

  // Boot the map once the dialog is on screen. Leaflet touches `window`, so it
  // is only ever imported here, never during server rendering.
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current || mapRef.current) return

      const start = origin ?? { lat: 51.5074, lon: -0.1278 }
      const map = L.map(containerRef.current, { zoomControl: true }).setView(
        [start.lat, start.lon],
        origin ? 14 : 12,
      )

      // A deliberately quiet basemap: streets, water and parks, but no icons for
      // shops, libraries or anything else — the only points on it are courts.
      L.tileLayer('https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap contributors © CARTO',
      }).addTo(map)

      mapRef.current = map
      // The dialog lays out around the map, so the container has its real size
      // only after this frame — without this, tiles come back missing.
      requestAnimationFrame(() => map.invalidateSize())
      setTimeout(() => map.invalidateSize(), 250)

      if (origin) {
        L.circleMarker([origin.lat, origin.lon], {
          radius: 7,
          color: '#ffffff',
          fillColor: '#1f7a4d',
          fillOpacity: 1,
          weight: 3,
        })
          .addTo(map)
          .bindTooltip('You')
        void load(origin.lat, origin.lon)
      } else {
        setStatus('Search for a city to see the courts there.')
      }

      // Overpass is a shared free service, so panning offers a refresh rather
      // than firing a query on every drag. This listens for `dragend` rather
      // than `moveend` because framing results moves the map too, and only a
      // move the visitor made should offer to re-search.
      map.on('dragend', () => {
        const c = map.getCenter()
        const from = centreRef.current
        if (!from || distanceKm(from, { lat: c.lat, lon: c.lng }) > 1.5) setCanSearchArea(true)
      })
    })()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [origin, load])

  // Redraw pins whenever the court list changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !mapRef.current) return

      for (const marker of markersRef.current.values()) marker.remove()
      markersRef.current.clear()

      for (const court of courts) {
        const marker = L.marker([court.lat, court.lon], {
          icon: L.divIcon({
            className: 'court-pin-wrap',
            html: '<span class="court-pin"><i>🎾</i></span>',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          }),
          title: court.name,
          riseOnHover: true,
        }).addTo(map)

        if (court.named) {
          marker.bindTooltip(court.name, {
            permanent: true,
            direction: 'right',
            offset: [12, -14],
            className: 'court-label',
          })
        } else {
          marker.bindTooltip(court.name, { direction: 'top', offset: [0, -28] })
        }

        marker.on('click', () => select(court))
        markersRef.current.set(court.id, marker)
      }

      if (courts.length > 0) {
        map.invalidateSize()
        // Frame the nearest handful rather than every court in the city: fitting
        // all of them zooms out far enough that the map turns into a pale sheet
        // with no streets to orient by. The rest are a pan and a re-search away.
        const nearest = courts.slice(0, 8).map((c) => [c.lat, c.lon] as [number, number])
        map.fitBounds(L.latLngBounds(nearest).pad(0.25), { maxZoom: 15 })
        if (map.getZoom() < 12) map.setZoom(12)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [courts, select])

  const searchCity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return

    setLoading(true)
    setStatus('Looking up that place…')
    try {
      const res = await fetch(`/api/place?q=${encodeURIComponent(search.trim())}`)
      if (!res.ok) {
        setStatus('No place by that name.')
        setLoading(false)
        return
      }
      const place = (await res.json()) as { lat: number; lon: number }
      mapRef.current?.setView([place.lat, place.lon], 15)
      await load(place.lat, place.lon)
    } catch {
      setStatus('Could not look that up.')
      setLoading(false)
    }
  }

  const searchThisArea = () => {
    const c = mapRef.current?.getCenter()
    if (c) void load(c.lat, c.lng)
  }

  const confirm = async () => {
    if (!selected) return
    setPicking(true)

    // OSM rarely tags a court with its city, so resolve it from the position.
    let city = ''
    let country = ''
    try {
      const res = await fetch(`/api/place?lat=${selected.lat}&lon=${selected.lon}`)
      if (res.ok) {
        const place = (await res.json()) as { city?: string; country?: string }
        city = place.city ?? ''
        country = place.country ?? ''
      }
    } catch {
      // The host can fill these in; the court name and position are what matter.
    }

    onPick({ name: selected.name, lat: selected.lat, lon: selected.lon, city, country })
    setPicking(false)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick a court"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="card flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-line p-4">
          <div className="min-w-0">
            <h2 className="font-semibold">Pick a court</h2>
            <p className="truncate text-xs text-muted">Tennis courts only — nothing else is marked</p>
          </div>
          <form onSubmit={searchCity} className="ml-auto flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field w-44"
              placeholder="Search a city"
              aria-label="Search a city"
            />
            <button className="btn-ghost">Go</button>
          </form>
          <button type="button" onClick={onClose} className="btn-ghost" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="relative shrink-0">
          <div ref={containerRef} className="h-[26rem] w-full bg-court-50" />

          {(canSearchArea || loading) && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center">
              <button
                type="button"
                onClick={searchThisArea}
                disabled={loading}
                className="pointer-events-auto rounded-full border border-line bg-white px-4 py-2 text-sm font-medium shadow-md transition hover:bg-court-50 disabled:opacity-70"
              >
                {loading ? 'Finding courts…' : 'Search this area'}
              </button>
            </div>
          )}

          {courts.length > 0 && !loading && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-full bg-white/90 px-3 py-1 text-xs text-muted shadow">
              {courts.length} {courts.length === 1 ? 'court' : 'courts'} here
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {status && <p className="text-sm text-muted">{status}</p>}

          {courts.length > 0 && (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {[...courts]
                .sort((a, b) => Number(b.named) - Number(a.named))
                .slice(0, 12)
                .map((court) => (
                  <li key={court.id}>
                    <button
                      type="button"
                      onClick={() => select(court)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        selected?.id === court.id
                          ? 'border-court-600 bg-court-50'
                          : 'border-line hover:bg-court-50'
                      }`}
                    >
                      <span className="block truncate font-medium">{court.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {[
                          court.detail,
                          court.surface,
                          court.indoor ? 'indoor' : null,
                          centre ? `${distanceKm(centre, court).toFixed(1)} km out` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'OpenStreetMap'}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line p-4">
          <p className="min-w-0 flex-1 truncate text-sm">
            {selected ? (
              <>
                <span className="font-medium">{selected.name}</span>
                <span className="text-muted">
                  {' '}
                  · {selected.lat.toFixed(4)}, {selected.lon.toFixed(4)}
                </span>
              </>
            ) : (
              <span className="text-muted">Tap a court on the map.</span>
            )}
          </p>
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={!selected || picking} className="btn-primary">
            {picking ? 'Filling in…' : 'Use this court'}
          </button>
        </div>
      </div>
    </div>
  )
}
