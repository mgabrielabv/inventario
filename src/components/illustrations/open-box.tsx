export const OpenBox = ({ className = '' }: { className?: string }) => (
  <svg
    className={['logo-mark', className].filter(Boolean).join(' ')}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5 12L16 17L27 12V25L16 30L5 25V12Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path d="M5 12L3 7L14 2L16 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M27 12L29 7L18 2L16 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M16 17V30" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
)
