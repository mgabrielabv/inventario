export const OpenBox = ({ className = '' }: { className?: string }) => (
  <svg
    className={['logo-mark', className].filter(Boolean).join(' ')}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5 13.5L16 8L27 13.5V25L16 30L5 25V13.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M5 13.5L16 18.5L27 13.5M16 18.5V30"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M5 13.5L2 9.5L13 4L16 8M27 13.5L30 9.5L19 4L16 8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M10 15.75L21 20.75" stroke="currentColor" strokeWidth="1.1" opacity="0.45" />
  </svg>
)
