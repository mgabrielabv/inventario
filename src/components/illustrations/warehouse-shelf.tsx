import { motion } from 'framer-motion'
import { reveal, type IllustrationProps } from './motion'

export const WarehouseShelf = ({ reducedMotion = false }: IllustrationProps) => (
  <svg
    className="illustration"
    viewBox="0 0 420 320"
    role="img"
    aria-label="Estantería de almacén con cajas y un hueco vacío señalado"
  >
    <motion.g {...reveal(reducedMotion, 0)} stroke="var(--illus-line)" strokeWidth="1.2">
      <path
        d="M58 292H366"
        strokeDasharray="1 7"
        opacity="0.55"
      />
      <path d="M62 40H358V284H62Z" fill="none" opacity="0.45" />
      <rect x="60" y="38" width="10" height="246" fill="var(--illus-box-deep)" />
      <rect x="350" y="38" width="10" height="246" fill="var(--illus-box-deep)" />
      <rect x="60" y="96" width="300" height="8" fill="var(--illus-box-alt)" />
      <rect x="60" y="180" width="300" height="8" fill="var(--illus-box-alt)" />
      <rect x="60" y="264" width="300" height="8" fill="var(--illus-box-alt)" />
      <path d="M60 96L70 90M60 180L70 174M60 264L70 258" opacity="0.45" />
      <text
        x="76"
        y="106"
        fill="var(--illus-line)"
        fontFamily="var(--font-mono)"
        fontSize="7.5"
        letterSpacing="1.4"
      >
        NIVEL 03
      </text>
      <text
        x="76"
        y="190"
        fill="var(--illus-line)"
        fontFamily="var(--font-mono)"
        fontSize="7.5"
        letterSpacing="1.4"
      >
        NIVEL 02
      </text>
      <text
        x="76"
        y="274"
        fill="var(--illus-line)"
        fontFamily="var(--font-mono)"
        fontSize="7.5"
        letterSpacing="1.4"
      >
        NIVEL 01
      </text>
      <text
        x="342"
        y="32"
        fill="var(--illus-line)"
        fontFamily="var(--font-mono)"
        fontSize="8"
        letterSpacing="1.6"
        textAnchor="end"
      >
        ALM-02 / PASILLO B
      </text>
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.12)}
      stroke="var(--illus-line)"
      strokeWidth="1.1"
      strokeLinejoin="round"
    >
      <rect x="88" y="56" width="68" height="40" fill="var(--illus-box)" />
      <path d="M88 56L156 56L164 50L96 50Z" fill="var(--illus-box-alt)" />
      <rect x="166" y="62" width="56" height="34" fill="var(--illus-box-alt)" />
      <path d="M166 62L222 62L229 56L173 56Z" fill="var(--illus-box)" />
      <path d="M98 64H130" stroke="var(--illus-line)" opacity="0.5" />
      <path d="M98 70H118" stroke="var(--illus-line)" opacity="0.35" />
      <rect x="72" y="72" width="12" height="24" fill="var(--illus-box-deep)" opacity="0.8" />
      <rect x="104" y="80" width="10" height="16" fill="var(--illus-box-deep)" opacity="0.8" />
      <rect x="184" y="82" width="10" height="14" fill="var(--illus-box-deep)" opacity="0.8" />
    </motion.g>

    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 0.35 }}
    >
      <motion.rect
        x="248"
        y="110"
        width="86"
        height="70"
        fill="var(--illus-accent-soft)"
        stroke="var(--illus-accent)"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        animate={reducedMotion ? { opacity: 0.8 } : { opacity: [0.55, 1, 0.55] }}
        transition={
          reducedMotion ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <path
        d="M291 128V148M283 140L291 150L299 140"
        stroke="var(--illus-accent)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="291"
        y="164"
        fill="var(--illus-accent)"
        fontFamily="var(--font-mono)"
        fontSize="8"
        letterSpacing="1.8"
        textAnchor="middle"
      >
        FALTA
      </text>
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.22)}
      stroke="var(--illus-line)"
      strokeWidth="1.1"
      strokeLinejoin="round"
    >
      <rect x="88" y="134" width="54" height="46" fill="var(--illus-box-alt)" />
      <path d="M88 134L142 134L149 128L95 128Z" fill="var(--illus-box)" />
      <path d="M100 142H130" stroke="var(--illus-line)" opacity="0.45" />
      <rect x="150" y="126" width="66" height="54" fill="var(--illus-box)" />
      <path d="M150 126L216 126L223 120L157 120Z" fill="var(--illus-box-alt)" />
      <path d="M162 136H202" stroke="var(--illus-line)" opacity="0.4" />
      <path d="M162 143H190" stroke="var(--illus-line)" opacity="0.3" />
      <rect x="230" y="140" width="80" height="40" fill="var(--illus-box-deep)" />
      <path d="M230 140L310 140L317 134L237 134Z" fill="var(--illus-box-alt)" />
      <rect x="318" y="156" width="12" height="24" fill="var(--illus-box)" opacity="0.85" />
    </motion.g>

    <motion.g
      {...reveal(reducedMotion, 0.34)}
      stroke="var(--illus-line)"
      strokeWidth="1.1"
      strokeLinejoin="round"
    >
      <rect x="88" y="202" width="98" height="62" fill="var(--illus-box-alt)" />
      <path d="M88 202L186 202L193 196L95 196Z" fill="var(--illus-box)" />
      <path d="M102 214H148M102 222H134" stroke="var(--illus-line)" opacity="0.4" />
      <rect x="194" y="212" width="54" height="52" fill="var(--illus-box)" />
      <path d="M194 212L248 212L254 206L200 206Z" fill="var(--illus-box-alt)" />
      <rect x="256" y="220" width="82" height="44" fill="var(--illus-box-deep)" />
      <path d="M256 220L338 220L344 214L262 214Z" fill="var(--illus-box-alt)" />
      <path d="M268 230H318" stroke="var(--illus-line)" opacity="0.4" />
      <rect x="330" y="236" width="10" height="28" fill="var(--illus-box)" opacity="0.9" />
    </motion.g>

    <motion.g {...reveal(reducedMotion, 0.5)}>
      <text
        x="58"
        y="308"
        fill="var(--illus-line)"
        fontFamily="var(--font-mono)"
        fontSize="8"
        letterSpacing="1.6"
      >
        STOCK MÍNIMO / REPOSICIÓN
      </text>
    </motion.g>
  </svg>
)
