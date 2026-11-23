import { motion, useReducedMotion } from 'framer-motion'
import { House, Laptop, Mouse, Package, PenLine } from 'lucide-react'
import type { CSSProperties } from 'react'
import { boxInteractive, spring } from '../../motion/tokens'

const ICONS = { Electrónica: Laptop, Accesorios: Mouse, Papelería: PenLine, Hogar: House, Otras: Package }
const BASES: Record<string, string> = {
  Electrónica: 'var(--primary)',
  Accesorios: 'var(--clay)',
  Papelería: 'var(--tan)',
  Hogar: 'var(--clay)',
  Otras: 'var(--tan)',
}

const hash = (value: string): number => {
  let result = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    result ^= value.charCodeAt(i)
    result = Math.imul(result, 16777619)
  }
  return Math.abs(result)
}

interface Props {
  categoria: string
  codigo: string
  nombre?: string
  size?: number
  interactive?: boolean
  layoutId?: string
  className?: string
  style?: CSSProperties
}

/** Caja isométrica determinista por categoría + código. No gira libremente. */
export const ProductBox = ({
  categoria, codigo, nombre, size = 160, interactive = false, layoutId, className = '', style,
}: Props) => {
  const reduce = useReducedMotion()
  const seed = hash(`${categoria}:${codigo}`)
  const base = BASES[categoria] ?? 'var(--clay)'
  const w = 74 + (seed % 3) * 6
  const h = 34 + ((seed >> 3) % 3) * 5
  const ribbon = seed % 4 !== 0
  const Icon = ICONS[categoria as keyof typeof ICONS] ?? Package
  const short = (nombre ?? '').split(' ').slice(0, 2).join(' ').slice(0, 14)

  const vars = {
    '--pb-base': base,
    '--pb-top': `color-mix(in oklab, ${base} 52%, var(--cream))`,
    '--pb-left': `color-mix(in oklab, ${base} 88%, var(--burgundy))`,
    '--pb-right': `color-mix(in oklab, ${base} 70%, var(--burgundy))`,
  } as CSSProperties

  return (
    <motion.div
      className={`product-box ${interactive ? 'product-box--interactive' : ''} ${className}`}
      style={{ width: size, height: size, ...vars, ...style }}
      layoutId={layoutId}
      whileHover={interactive && !reduce ? { y: boxInteractive.hoverY } : undefined}
      whileTap={interactive && !reduce ? { scale: boxInteractive.tapScale } : undefined}
      transition={spring.ui}
    >
      <svg viewBox="0 0 200 160" role="img" aria-label={`Caja de ${nombre ?? categoria}`} width="100%" height="100%">
        <ellipse cx="100" cy="142" rx={w * 0.82} ry="9" fill="var(--box-shadow)" opacity="0.45" />
        <g stroke="var(--box-edge)" strokeWidth="1" strokeLinejoin="round">
          <path d={`M${100 - w} ${86}h${w}l${w} ${-h}h${-w}Z`} fill="var(--pb-top)" />
          <path d={`M${100 - w} 86h${w}v46h${-w}Z`} fill="var(--pb-left)" />
          <path d={`M100 86l${w} ${-h}v46L100 132Z`} fill="var(--pb-right)" />
        </g>
        {ribbon && (
          <g fill="var(--box-tape)" opacity="0.85">
            <path d={`M${100 - 12} ${86 - (h * 12) / w}h24l${(h * 24) / w} ${h}v46l${-(h * 24) / w} ${-h}L${100 - 12} 132Z`} opacity="0.55" />
            <path d={`M${100 - 12} ${86 - (h * 12) / w}h24l${(h * 24) / w} ${h}l-24 12Z`} />
          </g>
        )}
        <g transform={`translate(${100 - w + 16} 98)`}>
          <rect width="46" height="24" rx="4" fill="var(--box-label)" opacity="0.92" />
          <Icon x={6} y={4} width={16} height={16} stroke="var(--text)" strokeWidth={1.5} />
          {short && (
            <text x="26" y="16" fontSize="6.5" fill="var(--text)" fontFamily="var(--font-ui)">
              {short}
            </text>
          )}
        </g>
      </svg>
    </motion.div>
  )
}
