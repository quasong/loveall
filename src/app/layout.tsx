import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { getCurrentUser } from '@/lib/auth'
import { logout } from '@/lib/actions/auth'

export const metadata: Metadata = {
  title: 'Love All · Tennis matchups',
  description: 'Find players at your level and get on court.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <Link href="/matches" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-tight">
              <span className="grid size-8 place-items-center rounded-full bg-ball text-base">🎾</span>
              Love All
            </Link>

            <div className="ml-auto flex min-w-0 items-center gap-2 text-sm">
              {user ? (
                <>
                  <Link href="/matches/new" className="btn-primary hidden sm:inline-flex">
                    Host a match
                  </Link>
                  <Link
                    href="/profile"
                    className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-white p-1 transition hover:bg-court-50 sm:pr-3"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-court-50">{user.avatar}</span>
                    <span className="hidden max-w-24 truncate sm:inline">{user.name}</span>
                  </Link>
                  <form action={logout}>
                    <button className="whitespace-nowrap px-2 py-1 text-muted transition hover:text-ink">Sign out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost whitespace-nowrap">
                    Sign in
                  </Link>
                  <Link href="/register" className="btn-primary whitespace-nowrap">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

        <footer className="mx-auto max-w-5xl px-4 pb-10 text-center text-xs text-muted">
          Love All — in tennis, everything starts at 0:0.
        </footer>
      </body>
    </html>
  )
}
