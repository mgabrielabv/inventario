import { motion } from 'framer-motion'
import { spring } from '../../motion/tokens'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  className?: string
}

/** Switch estilo iOS con muelle. */
export const Switch = ({ checked, onChange, label, disabled, className = '' }: Props) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className={`switch${checked ? ' is-on' : ''} ${className}`}
    onClick={() => onChange(!checked)}
  >
    <motion.span className="switch__thumb" layout transition={spring.snappy} />
  </button>
)
