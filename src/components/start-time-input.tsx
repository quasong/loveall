'use client'

import { useEffect, useRef } from 'react'
import { toLocalInputValue } from '@/lib/format'

function defaultStart() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(19, 0, 0, 0)
  return toLocalInputValue(d)
}

/**
 * "Tomorrow at 19:00" depends on the reader's clock, so the server has no
 * business rendering it — it would disagree with the browser whenever the two
 * sit in different zones. The field ships empty and fills in on mount.
 */
export function StartTimeInput({ id = 'startsAt', className = 'field' }: { id?: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current && !ref.current.value) ref.current.value = defaultStart()
  }, [])

  return (
    <input ref={ref} id={id} name="startsAt" type="datetime-local" required className={className} />
  )
}
