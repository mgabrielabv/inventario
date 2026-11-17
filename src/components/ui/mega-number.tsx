import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useAnimatedNumber } from '../../logic/hooks/useAnimatedNumber'
import { useReducedMotion } from '../../logic/hooks/useSlideshow'
import { formatNumber } from '../../logic/services/formatters'

interface MegaNumberProps {
  value: number
  size?: 'sm' | 'md'
  tone?: 'ink' | 'cream' | 'kraft'
  className?: string
  style?: CSSProperties
  label?: string
}

export const MegaNumber = ({
  value,
  size,
  tone = 'ink',
  className = '',
  style,
  label,
}: MegaNumberProps) => {
  const current = useAnimatedNumber(value)
  const reducedMotion = useReducedMotion()
  const [hit, setHit] = useState(false)

  useEffect(() => {
    if (reducedMotion || current !== value) return
    setHit(true)
    const timeout = window.setTimeout(() => setHit(false), 360)
    return () => window.clearTimeout(timeout)
  }, [current, value, reducedMotion])

  return (
    <span
      className={[
        'mega-number',
        size === 'sm' ? 'mega-number--sm' : '',
        size === 'md' ? 'mega-number--md' : '',
        tone === 'cream' ? 'mega-number--cream' : '',
        tone === 'kraft' ? 'mega-number--kraft' : '',
        hit ? 'mega-number--hit' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-label={label}
    >
      {formatNumber(current)}
    </span>
  )
}
