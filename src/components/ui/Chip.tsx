import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { spring } from '../../motion/tokens'

export const Chip = ({ children, onRemove, active = false }: {
  children: ReactNode; onRemove?: () => void; active?: boolean
}) => (
  <motion.span layout className={`chip${active ? ' chip--active' : ''}`} transition={spring.ui}>
    {children}
    {onRemove && (
      <button type="button" className="chip__x" aria-label="Quitar filtro" onClick={onRemove}>
        <X size={13} strokeWidth={1.8} />
      </button>
    )}
  </motion.span>
)
