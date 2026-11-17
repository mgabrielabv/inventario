import { motion } from 'framer-motion'
import { EASE_OUT, reveal, type IllustrationProps } from './motion'

const arrowTransition = (reducedMotion: boolean, delay: number) => ({
  pathLength: {
    duration: reducedMotion ? 0 : 1,
    delay: reducedMotion ? 0 : delay,
    ease: EASE_OUT,
  },
  opacity: { duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : delay },
})

export const PalletArrows = ({ reducedMotion = false }: IllustrationProps) => (
  <svg
    className="illustration"
    viewBox="0 0 420 320"
    role="img"
    aria-label="Palé con flechas de entrada y salida de mercancía"
  >
    <motion.g {...reveal(reducedMotion, 0)}>
      <path
        d="M48 294H372"
        stroke="var(--illus-line)"
        strokeWidth="1.2"
        strokeDasharray="1 7"
        opacity="0.55"
      />
      <path
        d="M48 48H76M48 48V76M372 48H344M372 48V76"
        stroke="var(--illus-line)"
        strokeWidth="1"
        opacity="0.4"
      />
      <text
        x="210"
        y="52"
        fill="var(--illus-line)"
        fontFamily="var(--font-display)"
        fontSize="8"
        letterSpacing="2"
        textAnchor="middle"
      >
        MUELLE / PALÉ
      </text>
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.12)}
      stroke="var(--illus-line)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <path d="M118 244L314 244L338 258L94 258Z" fill="var(--illus-box-alt)" />
      <path d="M94 258H338V270H94Z" fill="var(--illus-box-deep)" />
      <rect x="104" y="270" width="34" height="14" fill="var(--illus-box)" />
      <rect x="192" y="270" width="34" height="14" fill="var(--illus-box)" />
      <rect x="286" y="270" width="34" height="14" fill="var(--illus-box)" />
      <path d="M94 258L104 264M338 258L328 264" opacity="0.45" />
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.24)}
      stroke="var(--illus-line)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <rect x="180" y="120" width="88" height="124" fill="var(--illus-box-alt)" />
      <path d="M180 120L268 120L278 112L190 112Z" fill="var(--illus-box)" />
      <path d="M194 134H248M194 142H228" stroke="var(--illus-line)" opacity="0.38" />
      <path d="M180 174H268" stroke="var(--illus-line)" opacity="0.28" />
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.34)}
      stroke="var(--illus-line)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <rect x="126" y="178" width="82" height="66" fill="var(--illus-box)" />
      <path d="M126 178L208 178L216 171L134 171Z" fill="var(--illus-box-alt)" />
      <path d="M140 190H180M140 198H164" stroke="var(--illus-line)" opacity="0.38" />
      <rect x="218" y="178" width="88" height="66" fill="var(--illus-box-deep)" />
      <path d="M218 178L306 178L315 171L227 171Z" fill="var(--illus-box-alt)" />
      <path d="M232 190H278" stroke="var(--illus-line)" opacity="0.38" />
      <rect x="192" y="86" width="66" height="34" fill="var(--illus-accent)" />
      <path d="M192 86L258 86L265 80L199 80Z" fill="var(--illus-box-alt)" />
      <path
        d="M225 94V110"
        stroke="var(--illus-paper)"
        strokeWidth="5"
        opacity="0.7"
      />
    </motion.g>

    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.5 }}
    >
      <motion.path
        d="M62 86V196"
        stroke="var(--illus-in)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: reducedMotion ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={arrowTransition(reducedMotion, 0.45)}
      />
      <motion.path
        d="M51 184L62 198L73 184"
        stroke="var(--illus-in)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 1.2 }}
      />
      <text
        x="62"
        y="222"
        fill="var(--illus-in)"
        fontFamily="var(--font-display)"
        fontSize="8"
        letterSpacing="1.8"
        textAnchor="middle"
      >
        ENTRADA
      </text>

      <motion.path
        d="M358 198V88"
        stroke="var(--illus-out)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: reducedMotion ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={arrowTransition(reducedMotion, 0.65)}
      />
      <motion.path
        d="M347 100L358 86L369 100"
        stroke="var(--illus-out)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 1.4 }}
      />
      <text
        x="358"
        y="222"
        fill="var(--illus-out)"
        fontFamily="var(--font-display)"
        fontSize="8"
        letterSpacing="1.8"
        textAnchor="middle"
      >
        SALIDA
      </text>
    </motion.g>

    <motion.g {...reveal(reducedMotion, 0.6)}>
      <text
        x="94"
        y="306"
        fill="var(--illus-line)"
        fontFamily="var(--font-display)"
        fontSize="8"
        letterSpacing="1.6"
      >
        CONTADO / ANOTADO
      </text>
      <text
        x="338"
        y="306"
        fill="var(--illus-line)"
        fontFamily="var(--font-display)"
        fontSize="8"
        letterSpacing="1.6"
        textAnchor="end"
      >
        CON NOMBRE
      </text>
    </motion.g>
  </svg>
)
