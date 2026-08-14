import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getStoredLocation } from '@/lib/location'
import { NewMatchForm } from './form'

export default async function NewMatchPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const place = await getStoredLocation()
  const origin = place?.status === 'allowed' ? { lat: place.lat, lon: place.lon } : null

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Host a match</h1>
      <p className="mb-6 text-sm text-muted">Once you post it, you already count toward the player list.</p>
      <NewMatchForm defaultNtrp={user.ntrp} defaultCourt={user.homeCourt ?? ''} origin={origin} />
    </div>
  )
}
