import { motion, useReducedMotion } from 'framer-motion'
import { spring } from '../../motion/tokens'

/** Marca pequeña: la caja abierta original del login. */
export const BoxMark = ({ className = '', size = 26 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M5 12L16 17L27 12V25L16 30L5 25V12Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M5 12L3 7L14 2L16 7.5M27 12L29 7L18 2L16 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M16 17V30" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
)

/** A20 · caja abierta que se dibuja y se asienta, para estados vacíos. */
export const OpenBox = ({ size = 180, className = '' }: { size?: number; className?: string }) => {
  const reduce = useReducedMotion()
  const stroke = {
    initial: reduce ? false : { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: reduce ? 0 : 0.8, ease: 'easeOut' as const },
  }
  return (
    <motion.div
      className={`open-box ${className}`}
      style={{ width: size, height: size }}
      initial={reduce ? false : { y: 16, scale: 0.92 }}
      animate={{ y: 0, scale: 1 }}
      transition={spring.soft}
    >
      <svg viewBox="0 0 200 180" width="100%" height="100%" role="img" aria-label="Caja abierta vacía">
        <motion.path {...stroke} d="M38 92h124v62l-62 20-62-20V92Z" fill="var(--box-left)" stroke="var(--box-edge)" />
        <motion.path {...stroke} d="M38 92l30-26h64l30 26-62 18-62-18Z" fill="var(--box-top)" stroke="var(--box-edge)" />
        <motion.path {...stroke} d="M68 66V44l32-16v52M132 66V44l-32-16v52" fill="var(--box-top)" stroke="var(--box-edge)" />
        <motion.path {...stroke} d="M100 110v64" stroke="var(--box-edge)" />
        <motion.path {...stroke} d="M62 126l38 12 38-12" stroke="var(--box-tape)" strokeWidth="2" fill="none" opacity="0.7" />
      </svg>
    </motion.div>
  )
}
