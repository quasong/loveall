import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { suggestUsername } from '@/lib/username'
import { WelcomeForm } from './form'

export default async function WelcomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">You're in, {user.name}</h1>
      <p className="mb-6 text-sm text-muted">
        Two optional things. You can skip both and set them later from your profile.
      </p>

      <WelcomeForm
        currentUsername={user.username ?? ''}
        suggestion={user.username ?? suggestUsername(user.email)}
      />
    </div>
  )
}
