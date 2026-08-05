/**
 * Brand glyphs drawn in-house — lucide dropped third-party logos in v1, and
 * these match its stroke language so they sit correctly beside the other icons.
 */

export function InstagramIcon({ size = 20, strokeWidth = 1.7, className = '', ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WhatsAppIcon({ size = 20, className = '', ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M12.02 2C6.6 2 2.2 6.4 2.2 11.82c0 1.9.53 3.68 1.46 5.2L2 22.5l5.6-1.6a9.77 9.77 0 0 0 4.42 1.06h.01c5.42 0 9.82-4.4 9.82-9.82S17.44 2 12.02 2Zm0 17.98h-.01a8.1 8.1 0 0 1-4.1-1.13l-.3-.17-3.32.95.9-3.24-.2-.33a8.13 8.13 0 0 1-1.25-4.34 8.16 8.16 0 1 1 8.28 8.26Zm4.48-6.1c-.24-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.13-.16.24-.63.8-.77.96-.14.17-.28.19-.53.06-.24-.12-1.04-.38-1.97-1.22-.73-.65-1.22-1.45-1.36-1.7-.14-.24-.02-.37.11-.5.11-.11.24-.28.36-.42.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.44-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.83-.84 2.02s.86 2.34.98 2.5c.12.17 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.19 1.1.16 1.52.1.46-.07 1.45-.6 1.65-1.17.2-.58.2-1.07.14-1.17-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  )
}
