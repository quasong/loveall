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
            <Link href="/matches" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-8 place-items-center rounded-full bg-ball text-base">🎾</span>
              Love All
            </Link>

            <div className="ml-auto flex items-center gap-2 text-sm">
              {user ? (
                <>
                  <Link href="/matches/new" className="btn-primary">
                    Host a match
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 transition hover:bg-court-50"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-court-50">{user.avatar}</span>
                    <span className="max-w-24 truncate">{user.name}</span>
                  </Link>
                  <form action={logout}>
                    <button className="px-2 py-1 text-muted transition hover:text-ink">Sign out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost">
                    Sign in
                  </Link>
                  <Link href="/register" className="btn-primary">
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
