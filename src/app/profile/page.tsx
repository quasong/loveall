import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from './form'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [hosted, joined] = await Promise.all([
    prisma.match.count({ where: { hostId: user.id } }),
    prisma.signup.count({ where: { userId: user.id } }),
  ])

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Your profile</h1>
      <p className="mb-6 text-sm text-muted">
        Hosted {hosted} {hosted === 1 ? 'match' : 'matches'}, joined {joined}.
      </p>
      <ProfileForm
        user={{
          name: user.name,
          avatar: user.avatar,
          ntrp: user.ntrp,
          homeCourt: user.homeCourt ?? '',
          playStyle: user.playStyle,
          bio: user.bio ?? '',
        }}
      />
    </div>
  )
}
