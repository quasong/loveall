'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession, getCurrentUser } from '@/lib/auth'

export type FormState = { error?: string; ok?: boolean } | null

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const ntrp = Number(formData.get('ntrp') ?? 3)

  if (!EMAIL_RE.test(email)) return { error: 'Enter a valid email address' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters' }
  if (name.length < 1 || name.length > 20) return { error: 'Display name must be 1–20 characters' }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'That email is already registered' }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      ntrp,
      passwordHash: await bcrypt.hash(password, 10),
    },
  })

  await createSession(user.id)
  redirect('/matches')
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  const user = await prisma.user.findUnique({ where: { email } })
  // Always run one comparison, so response time doesn't reveal whether the account exists
  const ok = await bcrypt.compare(password, user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi')
  if (!user || !ok) return { error: 'Email or password is incorrect' }

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
