'use client'

import { useEffect, useState } from 'react'
import { allTimeZones, detectTimeZone } from '@/lib/time'

/**
 * Defaults to the browser's own zone, which is right when you post a match at
 * your home court, and changeable when you're booking one in another city.
 *
 * The option list is filled in after mount on purpose: Node and the browser ship
 * different ICU builds — 417 zones versus 418 here — so rendering it on the
 * server would hand hydration two lists that disagree.
 */
export function TimeZoneSelect({ id = 'timezone', className = 'field' }: { id?: string; className?: string }) {
  const [zone, setZone] = useState('UTC')
  const [zones, setZones] = useState<string[]>([])

  useEffect(() => {
    // `supportedValuesOf` returns canonical ids only, so keep the detected zone
    // even when it is an alias (America/Argentina/Buenos_Aires and friends).
    const detected = detectTimeZone()
    const list = allTimeZones()
    setZones(list.includes(detected) ? list : [detected, ...list])
    setZone(detected)
  }, [])

  const options = zones.length > 0 ? zones : [zone]

  return (
    <select
      id={id}
      name="timezone"
      className={className}
      value={zone}
      onChange={(e) => setZone(e.target.value)}
    >
      {options.map((z) => (
        <option key={z} value={z}>
          {z.replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  )
}
