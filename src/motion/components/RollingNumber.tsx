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

/** Solo los dígitos tienen ancho fijo; signos y separadores quedan estáticos. */
export const RollingNumber = ({
  value, decimals = 0, className = '', prefix, suffix, ariaLabel,
}: Props) => {
  const chars = useRollingNumber(value, decimals)
  const reduce = useReducedMotion()
  const content = `${prefix ?? ''}${chars.map((item) => item.char).join('')}${suffix ?? ''}`

  return (
    <span className={`rolling-number ${className}`} aria-label={ariaLabel ?? content}>
      {prefix && <span className="rolling-number__static" aria-hidden="true">{prefix}</span>}
      <span aria-hidden="true" className="rolling-number__digits">
        {chars.map((item) => item.digit ? (
          <span className="rolling-number__slot" key={item.key}>
            {reduce ? (
              <span>{item.char}</span>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={item.char}
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
        ) : (
          <span className="rolling-number__static" key={item.key}>{item.char}</span>
        ))}
      </span>
      {suffix && <span className="rolling-number__static" aria-hidden="true">{suffix}</span>}
    </span>
  )
}
