import Link from 'next/link'
import { GoogleButton } from '@/components/google-button'

/**
 * Accounts start with Google and nothing else. A username and a password are
 * offered straight afterwards, both optional, both changeable later — so there
 * is no form to fill in here.
 */
export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Join Love All</h1>
      <p className="mb-6 text-sm text-muted">
        One tap to start. You'll pick a username next, and a password only if you want one.
      </p>

      <div className="card space-y-4 p-6">
        <GoogleButton label="Sign up with Google" />

        <ul className="space-y-2 text-sm text-muted">
          {[
            ['🎾', 'Rate your level, then find matches you can actually play'],
            ['🌍', 'Courts anywhere — times always shown in the court’s own zone'],
            ['🔒', 'We only ever see your name and email address'],
          ].map(([icon, text]) => (
            <li key={text} className="flex gap-2">
              <span aria-hidden="true">{icon}</span>
              {text}
            </li>
          ))}
        </ul>

        <p className="border-t border-line pt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-court-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
