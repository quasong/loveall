import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from './form'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const { welcome } = await searchParams
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [hosted, joined] = await Promise.all([
    prisma.match.count({ where: { hostId: user.id } }),
    prisma.signup.count({ where: { userId: user.id } }),
  ])

  return (
    <div className="mx-auto max-w-xl">
      {welcome === '1' && (
        <div className="mb-5 rounded-xl border border-court-200 bg-court-50 px-4 py-3 text-sm">
          <p className="font-medium">You're in, {user.name}.</p>
          <p className="mt-0.5 text-muted">
            One thing worth setting before you look for a match: your NTRP rating. It decides
            which matches you can join, and it currently holds a default guess of 3.0.
          </p>
        </div>
      )}

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
