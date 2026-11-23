import { motion, useReducedMotion } from 'framer-motion'
import { boxReveal, spring } from '../../motion/tokens'

interface Props { size?: number; className?: string; float?: boolean }

const pieces = [
  { d: 'M40 206L110 170L180 206L110 242Z', left: 'M40 206L110 242V282L40 246Z', right: 'M110 242L180 206V246L110 282Z', delay: boxReveal.pieceDelays[0] },
  { d: 'M62 150L118 122L176 150L118 178Z', left: 'M62 150L118 178V216L62 188Z', right: 'M118 178L176 150V188L118 216Z', delay: boxReveal.pieceDelays[1] },
  { d: 'M76 104L124 80L174 104L124 130Z', left: 'M76 104L124 130V164L76 138Z', right: 'M124 130L174 104V138L124 164Z', delay: boxReveal.pieceDelays[2] },
]

/** Caja ensamblada del héroe y del login: cae pieza por pieza y flota. */
export const BoxStack = ({ size = 360, className = '', float = true }: Props) => {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={`box-stack ${className}`}
      style={{ width: size, height: size * 0.8 }}
      animate={float && !reduce ? { y: [0, boxReveal.floatY, 0] } : undefined}
      transition={reduce ? undefined : {
        duration: boxReveal.floatDuration, repeat: Infinity, ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 220 300" width="100%" height="100%" role="img" aria-label="Cajas ensambladas">
        <ellipse cx="110" cy="286" rx="74" ry="9" fill="var(--box-shadow)" opacity="0.5" />
        {pieces.map((piece, index) => (
          <motion.g
            key={index}
            initial={reduce ? false : { y: boxReveal.dropY, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring.soft, delay: reduce ? 0 : piece.delay }}
            stroke="var(--box-edge)"
            strokeWidth="1"
            strokeLinejoin="round"
          >
            <path d={piece.d} fill="var(--box-top)" />
            <path d={piece.left} fill="var(--box-left)" />
            <path d={piece.right} fill="var(--box-right)" />
          </motion.g>
        ))}
        <motion.g
          initial={reduce ? false : { y: boxReveal.tapeY, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring.soft, delay: reduce ? 0 : boxReveal.tapeDelay }}
        >
          <path d="M76 104l48 26 50-26-24-12Z" fill="var(--box-tape)" opacity="0.8" />
          <rect x="92" y="118" width="34" height="18" rx="3" fill="var(--box-label)" />
          <path d="M97 124h24M97 129h18" stroke="var(--text)" strokeWidth="1" opacity="0.6" />
        </motion.g>
      </svg>
    </motion.div>
  )
}
