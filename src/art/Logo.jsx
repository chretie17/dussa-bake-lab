
/**
 * The Dussa monogram: a serif "D" whose counter holds a balloon whisk,
 * with the mixing bowl nesting into the letter's base — the mark from the
 * brand flyer, rebuilt as vector so it stays crisp at every size.
 */
export function LogoMark({ className = '', tone = 'currentColor', accent = '#B98A5E', ...rest }) {
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true" {...rest}>
      {/* The letterform: one path, evenodd, so the counter is a true hole */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 12 H60 C93 12 114 32 114 62 C114 92 93 112 60 112 H20 Z
           M45 34 H60 C79 34 88 45 88 62 C88 79 79 90 60 90 H45 Z"
        fill={tone}
      />

      {/* Inside the counter: a balloon whisk resting over the mixing bowl */}
      <g stroke={accent} strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M66 30 L66 44" strokeWidth="4.6" />
        <path d="M66 45 C56 50 54 60 60 67" />
        <path d="M66 45 C62 52 61 60 64 68" />
        <path d="M66 45 C70 52 71 60 68 68" />
        <path d="M66 45 C76 50 78 60 72 67" />
      </g>
      <path d="M50 70 h32 a16 16 0 0 1 -32 0 z" fill={accent} />
      <rect x="47" y="66" width="38" height="6" rx="3" fill={accent} />
    </svg>
  )
}

/** Stacked wordmark: "Dussa" over a ruled "BakeLab" line. */
export function Wordmark({ className = '', tone = 'currentColor', accent = '#B98A5E' }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`} style={{ color: tone }}>
      <span className="font-display text-[1.55em] font-semibold tracking-[-0.03em]">Dussa</span>
      <span className="mt-[0.18em] flex items-center gap-[0.4em]">
        <span aria-hidden="true" className="h-px w-[0.9em]" style={{ background: accent }} />
        <span
          className="text-[0.62em] font-medium uppercase tracking-[0.34em]"
          style={{ color: accent }}
        >
          BakeLab
        </span>
        <span aria-hidden="true" className="h-px w-[0.9em]" style={{ background: accent }} />
      </span>
    </span>
  )
}

export function Logo({ className = '', tone = 'currentColor', accent = '#B98A5E', markClass = 'h-11 w-11' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClass} tone={tone} accent={accent} />
      <Wordmark tone={tone} accent={accent} className="text-[0.95rem]" />
      <span className="sr-only">Dussa BakeLab</span>
    </span>
  )
}

export default Logo
