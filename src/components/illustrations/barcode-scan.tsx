import { motion } from 'framer-motion'
import { EASE_OUT, reveal, type IllustrationProps } from './motion'

const BARCODE_WIDTHS = [
  2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 1, 2, 2, 1, 4, 2, 3, 1,
  2, 3, 1, 4, 1, 2,
]

const BARS = (() => {
  let x = 124
  return BARCODE_WIDTHS.map((width, index) => {
    const bar = { x, width, index }
    x += width + 3
    return bar
  })
})()

export const BarcodeScan = ({ reducedMotion = false }: IllustrationProps) => (
  <svg
    className="illustration"
    viewBox="0 0 420 320"
    role="img"
    aria-label="Etiqueta con código de barras siendo escaneada por un lector"
  >
    <motion.g {...reveal(reducedMotion, 0)}>
      <path
        d="M44 288H376"
        stroke="var(--illus-line)"
        strokeWidth="1.2"
        strokeDasharray="1 7"
        opacity="0.5"
      />
      <path
        d="M44 44H72M44 44V72M376 44H348M376 44V72"
        stroke="var(--illus-line)"
        strokeWidth="1"
        opacity="0.4"
      />
    </motion.g>

    <motion.g
      initial={{ opacity: 0, x: reducedMotion ? 0 : -22 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : 0.08, ease: EASE_OUT }}
    >
      <g transform="rotate(-4 210 150)">
        <rect
          x="92"
          y="56"
          width="248"
          height="184"
          rx="6"
          fill="var(--illus-paper)"
          stroke="var(--illus-line)"
          strokeWidth="1.2"
        />
        <rect
          x="92"
          y="56"
          width="248"
          height="20"
          rx="6"
          fill="var(--illus-box-alt)"
          opacity="0.55"
        />
        <circle
          cx="110"
          cy="66"
          r="5"
          fill="var(--illus-hole)"
          stroke="var(--illus-line)"
          strokeWidth="1"
        />
        <text
          x="124"
          y="70"
          fill="var(--illus-ink)"
          fontFamily="var(--font-mono)"
          fontSize="7.5"
          letterSpacing="1.8"
          opacity="0.7"
        >
          ATELIER / ALM-01
        </text>

        <rect
          x="112"
          y="98"
          width="208"
          height="92"
          fill="none"
          stroke="var(--illus-line)"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.35"
        />

        {BARS.map((bar) => (
          <motion.rect
            key={bar.index}
            x={bar.x}
            y="108"
            width={bar.width}
            height="70"
            fill="var(--illus-ink)"
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: reducedMotion ? 0 : 0.25,
              delay: reducedMotion ? 0 : 0.32 + bar.index * 0.012,
            }}
          />
        ))}

        <motion.rect
          x="112"
          y="112"
          width="208"
          height="3"
          fill="var(--illus-accent)"
          initial={{ opacity: 0 }}
          animate={
            reducedMotion
              ? { opacity: 0.75 }
              : { opacity: [0.25, 0.95, 0.25], y: [108, 176, 108] }
          }
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }
          }
        />

        <text
          x="124"
          y="200"
          fill="var(--illus-ink)"
          fontFamily="var(--font-mono)"
          fontSize="12"
          letterSpacing="3.2"
        >
          8 412 009 015
        </text>
        <text
          x="124"
          y="220"
          fill="var(--illus-line)"
          fontFamily="var(--font-mono)"
          fontSize="7.5"
          letterSpacing="2"
        >
          STOCK / TRAZABILIDAD
        </text>

        <path
          d="M220 98H232M220 98V110M300 98H312M300 98V110M220 190H232M220 190V178M300 190H312M300 190V178"
          stroke="var(--illus-accent)"
          strokeWidth="1.4"
          opacity="0.8"
        />
      </g>
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.28)}
      stroke="var(--illus-line)"
      strokeWidth="1.2"
      strokeLinejoin="round"
      transform="rotate(8 352 140)"
    >
      <path d="M338 74L360 68L372 158L350 164Z" fill="var(--illus-box-alt)" />
      <path d="M350 164L372 158L380 180L358 186Z" fill="var(--illus-box-deep)" />
      <path d="M344 92L362 87" stroke="var(--illus-line)" opacity="0.5" />
      <path d="M346 102L360 98" stroke="var(--illus-line)" opacity="0.4" />
      <path d="M356 80L366 77" stroke="var(--illus-accent)" strokeWidth="2.4" />
      <path
        d="M350 174L300 150L296 160L348 186Z"
        fill="var(--illus-accent)"
        opacity="0.22"
        stroke="none"
      />
    </motion.g>

    <motion.g {...reveal(reducedMotion, 0.5)}>
      <text
        x="76"
        y="272"
        fill="var(--illus-line)"
        fontFamily="var(--font-mono)"
        fontSize="8"
        letterSpacing="1.6"
      >
        LECTURA 2048 / OK
      </text>
      <text
        x="366"
        y="272"
        fill="var(--illus-line)"
        fontFamily="var(--font-mono)"
        fontSize="8"
        letterSpacing="1.6"
        textAnchor="end"
      >
        09:41:06
      </text>
    </motion.g>
  </svg>
)
