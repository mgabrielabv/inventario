import { motion } from 'framer-motion'
import { reveal, type IllustrationProps } from './motion'

export const BoxStack = ({ reducedMotion = false }: IllustrationProps) => (
  <svg
    className="illustration"
    viewBox="0 0 420 320"
    role="img"
    aria-label="Pila de cajas de cartón etiquetadas en perspectiva isométrica"
  >
    <motion.g {...reveal(reducedMotion, 0)}>
      <path
        d="M56 292H364"
        stroke="var(--illus-line)"
        strokeWidth="1.2"
        strokeDasharray="1 7"
        opacity="0.55"
      />
      <path
        d="M56 54H84M56 54V82M364 54H336M364 54V82"
        stroke="var(--illus-line)"
        strokeWidth="1"
        opacity="0.4"
      />
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.08)}
      stroke="var(--illus-line)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <path d="M198 196L278 156L360 196L280 236Z" fill="var(--illus-box-alt)" />
      <path d="M198 196L280 236V282L198 242Z" fill="var(--illus-box)" />
      <path d="M280 236L360 196V242L280 282Z" fill="var(--illus-box-deep)" />
      <path d="M218 198L280 229" stroke="var(--illus-line)" opacity="0.35" />
      <path d="M300 176L300 262" stroke="var(--illus-line)" opacity="0.2" />
      <path d="M318 186L318 252" stroke="var(--illus-line)" opacity="0.2" />
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.18)}
      stroke="var(--illus-line)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <path d="M88 206L158 171L228 206L158 241Z" fill="var(--illus-box-alt)" />
      <path d="M88 206L158 241V286L88 251Z" fill="var(--illus-box)" />
      <path d="M158 241L228 206V251L158 286Z" fill="var(--illus-box-deep)" />
      <path d="M101 211L158 239" stroke="var(--illus-line)" opacity="0.35" />
      <path d="M188 216L188 266" stroke="var(--illus-line)" opacity="0.22" />
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.28)}
      stroke="var(--illus-line)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <path d="M108 152L172 119L238 152L174 185Z" fill="var(--illus-box-alt)" />
      <path d="M108 152L174 185V225L108 192Z" fill="var(--illus-box)" />
      <path d="M174 185L238 152V192L174 225Z" fill="var(--illus-box-deep)" />
      <path d="M120 158L174 184" stroke="var(--illus-line)" opacity="0.3" />
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.4)}
      stroke="var(--illus-line)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <path d="M130 104L180 78L232 104L182 130Z" fill="var(--illus-accent)" />
      <path d="M130 104L182 130V162L130 136Z" fill="var(--illus-accent)" />
      <path d="M182 130L232 104V136L182 162Z" fill="var(--illus-accent)" opacity="0.82" />
      <path
        d="M155 91L207 117"
        stroke="var(--illus-paper)"
        strokeWidth="7"
        strokeLinecap="butt"
        opacity="0.72"
      />
      <path
        d="M207 117V141"
        stroke="var(--illus-paper)"
        strokeWidth="7"
        strokeLinecap="butt"
        opacity="0.6"
      />
      <path
        d="M143 116L166 127V141L143 130Z"
        fill="var(--illus-paper)"
        stroke="var(--illus-line)"
        opacity="0.92"
      />
      <path d="M147 122L161 129M147 127L161 134" stroke="var(--illus-ink)" strokeWidth="1" opacity="0.5" />
    </motion.g>

    <motion.g {...reveal(reducedMotion, 0.55)}>
      <text
        x="88"
        y="306"
        fill="var(--illus-line)"
        fontFamily="var(--font-display)"
        fontSize="8"
        letterSpacing="1.6"
      >
        RECEPCIÓN / CAJA
      </text>
      <text
        x="330"
        y="306"
        fill="var(--illus-line)"
        fontFamily="var(--font-display)"
        fontSize="8"
        letterSpacing="1.6"
        textAnchor="end"
      >
        40 × 30 × 28
      </text>
    </motion.g>
  </svg>
)
