/**
 * The Love All mark: a tennis ball whose seam doubles as a pair of meridians,
 * with the latitudes behind it finishing the globe. It is the hero illustration
 * boiled down to something that still reads at 32 pixels — the same idea the
 * product is built on, that the next court is wherever you happen to land.
 *
 * The tab icon (`src/app/icon.svg`) is this mark with the globe lines dropped,
 * because at 16 pixels they blur into the fill.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Love All" className={className}>
      <defs>
        <radialGradient id="logoBall" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#eaff7a" />
          <stop offset="60%" stopColor="#d8f24b" />
          <stop offset="100%" stopColor="#a8c62f" />
        </radialGradient>
        <clipPath id="logoClip">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>

      <circle cx="32" cy="32" r="30" fill="url(#logoBall)" />

      {/* Latitudes, faint enough to read as shading rather than as lines. */}
      <g clipPath="url(#logoClip)" fill="none" stroke="#17643f" strokeWidth="1.4" opacity="0.26">
        <ellipse cx="32" cy="32" rx="30" ry="9.5" />
        <path d="M8 18 H56" />
        <path d="M8 46 H56" />
      </g>

      {/* The seam — and, read the other way, the meridians. */}
      <g clipPath="url(#logoClip)" fill="none" stroke="#17643f" strokeWidth="4">
        <path d="M5 9 C 18 22, 18 42, 5 55" />
        <path d="M59 9 C 46 22, 46 42, 59 55" />
      </g>

      <circle cx="32" cy="32" r="30" fill="none" stroke="#17643f" strokeWidth="2.5" opacity="0.45" />
    </svg>
  )
}
