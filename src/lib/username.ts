/**
 * Handles follow Instagram's shape: letters, digits, periods and underscores,
 * up to 30 characters, case-insensitive. Stored lowercase so that @Ace and @ace
 * cannot both exist.
 */
export const USERNAME_MAX = 30

/**
 * Words a handle cannot take. Handles are the kind of thing that ends up in a
 * URL — /@ace, or /ace — so anything that already names a route, or that reads
 * as official, is kept back.
 */
const RESERVED = new Set([
  'about',
  'admin',
  'administrator',
  'api',
  'auth',
  'contact',
  'explore',
  'faq',
  'help',
  'home',
  'legal',
  'login',
  'logout',
  'loveall',
  'match',
  'matches',
  'me',
  'new',
  'privacy',
  'profile',
  'register',
  'root',
  'search',
  'settings',
  'signin',
  'signout',
  'signup',
  'staff',
  'support',
  'team',
  'terms',
  'user',
  'users',
  'welcome',
])

export type UsernameCheck = { ok: true; username: string } | { ok: false; error: string }

/** Normalises and validates a handle. Returns the form that should be stored. */
export function checkUsername(raw: string): UsernameCheck {
  const username = raw.trim().replace(/^@+/, '').toLowerCase()

  if (!username) return { ok: false, error: 'Pick a username' }
  if (username.length > USERNAME_MAX) {
    return { ok: false, error: `Usernames are at most ${USERNAME_MAX} characters` }
  }
  if (!/^[a-z0-9._]+$/.test(username)) {
    return { ok: false, error: 'Only letters, numbers, periods and underscores' }
  }
  if (!/[a-z0-9]/.test(username)) {
    return { ok: false, error: 'Usernames need at least one letter or number' }
  }
  if (username.startsWith('.') || username.endsWith('.')) {
    return { ok: false, error: 'Usernames cannot start or end with a period' }
  }
  if (username.includes('..')) {
    return { ok: false, error: 'Usernames cannot contain two periods in a row' }
  }
  if (RESERVED.has(username)) return { ok: false, error: 'That username is taken' }

  return { ok: true, username }
}

/** A starting point derived from the email Google gave us. */
export function suggestUsername(email: string) {
  const base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, USERNAME_MAX)

  return checkUsername(base).ok ? base : ''
}
