import { BRAND } from '../../config/brand'

interface Props {
  size?: number
  className?: string
  /** Nombre visible; por defecto BRAND.shortName (o BRAND.name si se pide). */
  label?: string
  logoUrl?: string
}

/** Monograma «I» con serifas de bloque: legible desde 16 px en el favicon. */
export const BrandMark = ({ size = 24, className = '', label, logoUrl }: Props) => {
  if (logoUrl || BRAND.logoUrl) {
    return (
      <img
        className={`brand-mark ${className}`}
        src={logoUrl || BRAND.logoUrl}
        alt={label ?? BRAND.shortName}
        width={size}
        height={size}
      />
    )
  }
  return (
    <svg
      className={`brand-mark ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={label ?? `Marca ${BRAND.shortName}`}
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="var(--cream)" />
      <path
        fill="var(--primary)"
        d="M10.5 7.5h11v3.4h-3.7v10.2h3.7v3.4h-11v-3.4h3.7V10.9h-3.7z"
      />
    </svg>
  )
}
