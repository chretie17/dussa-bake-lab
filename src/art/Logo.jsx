import { BRAND_ASSETS } from '../data/site'

/** Compact version of the supplied D, whisk and mixing-bowl logo. */
export function LogoMark({ className = '', tone: _tone, accent: _accent, ...rest }) {
  return (
    <img
      src={BRAND_ASSETS.mark}
      alt=""
      width="128"
      height="128"
      className={`rounded-xl object-contain ${className}`}
      {...rest}
    />
  )
}

/** The name stays legible beside the compact mark, including on phones. */
export function Wordmark({ className = '', tone = 'currentColor', accent = '#B98A5E' }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`} style={{ color: tone }}>
      <span className="text-[1.9em] tracking-[-0.04em]" style={{ fontFamily: 'Georgia, serif' }}>Dussa</span>
      <span className="mt-[0.3em] flex items-center gap-[0.35em]">
        <span aria-hidden="true" className="h-px w-[0.7em]" style={{ background: accent }} />
        <span className="text-[0.65em] tracking-[0.2em]">
          <span style={{ color: accent }}>Bake</span>Lab
        </span>
        <span aria-hidden="true" className="h-px w-[0.7em]" style={{ background: accent }} />
      </span>
    </span>
  )
}

export function Logo({ className = '', tone = 'currentColor', accent = '#B98A5E', markClass = 'h-11 w-11' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} role="img" aria-label="Dussa BakeLab">
      <LogoMark className={markClass} />
      <span aria-hidden="true"><Wordmark tone={tone} accent={accent} className="text-[0.95rem]" /></span>
    </span>
  )
}

export default Logo
