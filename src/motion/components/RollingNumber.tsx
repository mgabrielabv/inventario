import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useRollingNumber } from '../hooks/useRollingNumber'
import { dur, ease } from '../tokens'

interface Props {
  value: number | string
  decimals?: number
  className?: string
  prefix?: string
  suffix?: string
  ariaLabel?: string
}

/** Dígitos que deslizan en vertical al cambiar. */
export const RollingNumber = ({
  value, decimals = 0, className = '', prefix, suffix, ariaLabel,
}: Props) => {
  const chars = useRollingNumber(value, decimals)
  const reduce = useReducedMotion()
  const content = chars.map((item) => item.char).join('')

  return (
    <span className={`rolling-number ${className}`} aria-label={ariaLabel ?? content}>
      {prefix}
      <span aria-hidden="true" className="rolling-number__digits">
        {chars.map((item, index) => (
          <span className="rolling-number__slot" key={index}>
            {reduce ? (
              <span>{item.char}</span>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={item.key}
                  initial={{ y: '-100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ duration: dur.base, ease: ease.out }}
                >
                  {item.char}
                </motion.span>
              </AnimatePresence>
            )}
          </span>
        ))}
      </span>
      {suffix}
    </span>
  )
}
