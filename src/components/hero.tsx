import Link from 'next/link'

/**
 * A tennis ball whose seams double as a globe: the same two curves read as
 * meridians once the latitude lines are behind them.
 */
function BallGlobe() {
  return (
    <svg
      viewBox="0 0 260 260"
      role="img"
      aria-label="A tennis ball drawn as a globe"
      className="h-40 w-40 shrink-0 sm:h-56 sm:w-56 md:h-64 md:w-64"
    >
      <defs>
        <radialGradient id="ball" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#eaff7a" />
          <stop offset="60%" stopColor="#d8f24b" />
          <stop offset="100%" stopColor="#a8c62f" />
        </radialGradient>
        <clipPath id="ballClip">
          <circle cx="130" cy="130" r="98" />
        </clipPath>
      </defs>

      <circle cx="130" cy="130" r="98" fill="url(#ball)" />

      <g clipPath="url(#ballClip)" stroke="#17643f" fill="none" opacity="0.28">
        {/* latitudes */}
        <ellipse cx="130" cy="130" rx="98" ry="30" strokeWidth="1.5" />
        <ellipse cx="130" cy="130" rx="90" ry="66" strokeWidth="1.5" />
        <path d="M42 82 H218" strokeWidth="1.5" />
        <path d="M42 178 H218" strokeWidth="1.5" />
        {/* meridians */}
        <ellipse cx="130" cy="130" rx="34" ry="98" strokeWidth="1.5" />
        <ellipse cx="130" cy="130" rx="70" ry="98" strokeWidth="1.5" />
        <path d="M130 32 V228" strokeWidth="1.5" />
      </g>

      {/* the seams */}
      <g fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round">
        <path d="M46 62 C 84 104, 84 156, 46 198" />
        <path d="M214 62 C 176 104, 176 156, 214 198" />
      </g>

      <circle cx="130" cy="130" r="98" fill="none" stroke="#17643f" strokeWidth="2" opacity="0.35" />

      {/* players, dropped wherever */}
      <g fill="#17643f">
        <circle cx="92" cy="96" r="6" />
        <circle cx="168" cy="148" r="6" />
        <circle cx="118" cy="184" r="6" />
      </g>
    </svg>
  )
}

/** Faint court lines running under the hero. */
function CourtLines() {
  return (
    <svg
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
    >
      <g stroke="#0f3d28" strokeWidth="2" fill="none">
        <rect x="60" y="40" width="680" height="320" />
        <rect x="100" y="40" width="600" height="320" />
        <path d="M100 120 H700 M100 280 H700 M400 120 V280 M400 40 V60 M400 340 V360" />
        <path d="M400 40 V360" strokeWidth="3" />
      </g>
    </svg>
  )
}

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative -mx-4 mb-8 overflow-hidden border-b border-line bg-gradient-to-b from-court-50 to-canvas px-4 pb-10 pt-8 sm:mb-10 sm:rounded-3xl sm:border sm:px-10 sm:pb-14 sm:pt-12">
      <CourtLines />

      <div className="relative flex flex-col items-center gap-6 md:flex-row md:gap-12">
        <div className="order-2 flex-1 text-center md:order-none md:text-left">
          <span className="chip border-court-200 bg-white text-court-700">
            🌍 Courts on every continent
          </span>

          <h1 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            A hitting partner
            <br />
            wherever you land.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base md:mx-0">
            Post a match at your home court, or find a game the week you arrive somewhere new.
            Every match lists its level, its cost and its local start time — so you know what
            you're walking onto before you pack a racquet.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <a href="#open-matches" className="btn-primary">
              Browse open matches
            </a>
            <Link href={signedIn ? '/matches/new' : '/register'} className="btn-ghost">
              {signedIn ? 'Host a match' : 'Create an account'}
            </Link>
          </div>

          <dl className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm md:justify-start">
            {[
              ['NTRP 1.5 – 6.0', 'Matched by level, not luck'],
              ['Any time zone', 'Shown in the court’s local time'],
              ['Singles, doubles, drills', 'However you like to play'],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="font-medium">{term}</dt>
                <dd className="text-muted">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="order-1 md:order-none">
          <BallGlobe />
        </div>
      </div>

      <a
        href="#open-matches"
        className="relative mx-auto mt-8 flex w-fit flex-col items-center gap-1 text-xs text-muted transition hover:text-ink sm:mt-12"
      >
        Open matches below
        <span aria-hidden="true" className="animate-bounce text-base leading-none">
          ↓
        </span>
      </a>
    </section>
  )
}
