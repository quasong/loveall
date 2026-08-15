'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession, getCurrentUser } from '@/lib/auth'
import { checkUsername } from '@/lib/username'

export type FormState = { error?: string; ok?: boolean } | null

/** Compared against when no account matched, so a miss costs the same as a hit. */
const DUMMY_HASH = '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi'

const MIN_PASSWORD = 8

/**
 * Accounts are created through Google, so there is no password to check at that
 * point. A password is optional and set later; once set, it works with either
 * the handle or the Google address.
 */
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const identifier = String(formData.get('identifier') ?? '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!identifier || !password) return { error: 'Enter your username or email, and your password' }

  const user = identifier.includes('@')
    ? await prisma.user.findUnique({ where: { email: identifier } })
    : await prisma.user.findUnique({ where: { username: identifier } })

  // Always run one comparison, so response time doesn't reveal whether the
  // account exists. An account with no password falls through to the dummy and
  // can never be entered this way.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)

  if (user && !user.passwordHash) {
    return { error: 'This account signs in with Google — use the Google button above' }
  }
  if (!user || !ok) return { error: 'Those details do not match an account' }

  await createSession(user.id)
  redirect('/matches')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in first' }

  const name = String(formData.get('name') ?? '').trim()
  if (name.length < 1 || name.length > 20) return { error: 'Display name must be 1–20 characters' }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      avatar: String(formData.get('avatar') ?? '🎾').slice(0, 4) || '🎾',
      ntrp: Number(formData.get('ntrp') ?? user.ntrp),
      homeCourt: String(formData.get('homeCourt') ?? '').trim() || null,
      playStyle: String(formData.get('playStyle') ?? 'BOTH'),
      bio: String(formData.get('bio') ?? '').trim().slice(0, 200) || null,
    },
  })

  revalidatePath('/profile')
  return { ok: true }
}

/** Claim or change the public handle. */
export async function setUsername(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in first' }

  const checked = checkUsername(String(formData.get('username') ?? ''))
  if (!checked.ok) return { error: checked.error }
  if (checked.username === user.username) return { ok: true }

  const taken = await prisma.user.findUnique({ where: { username: checked.username } })
  if (taken) return { error: `@${checked.username} is taken` }

  try {
    await prisma.user.update({ where: { id: user.id }, data: { username: checked.username } })
  } catch {
    // Someone claimed it between the check above and the write.
    return { error: `@${checked.username} is taken` }
  }

  revalidatePath('/profile')
  return { ok: true }
}

/**
 * Sets the first password, or changes an existing one. Changing requires the
 * current password: a borrowed session should not be enough to lock the owner
 * out of their own account.
 */
export async function setPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in first' }

  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (password.length < MIN_PASSWORD) {
    return { error: `Password must be at least ${MIN_PASSWORD} characters` }
  }
  if (password !== confirm) return { error: 'Those two passwords do not match' }

  if (user.passwordHash) {
    const current = String(formData.get('currentPassword') ?? '')
    const ok = await bcrypt.compare(current, user.passwordHash)
    if (!ok) return { error: 'Your current password is not right' }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  })

  revalidatePath('/profile')
  return { ok: true }
}

/** Used by the setup step, which sets both at once and can be skipped. */
export async function completeSetup(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in first' }

  const rawUsername = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  // Both halves are optional, but a half-filled password is a mistake worth
  // reporting rather than quietly dropping.
  if (rawUsername) {
    const result = await setUsername(null, formData)
    if (result?.error) return result
  }

  if (password) {
    const result = await setPassword(null, formData)
    if (result?.error) return result
  }

  redirect('/profile?welcome=1')
}
