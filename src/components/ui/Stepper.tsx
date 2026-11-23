import { Minus, Plus } from 'lucide-react'
import { RollingNumber } from '../../motion/components/RollingNumber'

interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}

/** A18 · stepper con dígitos rodantes y topes. */
export const Stepper = ({ value, onChange, min = 1, max = 99, label = 'Cantidad' }: Props) => (
  <div className="stepper" role="group" aria-label={label}>
    <button
      type="button" className="stepper__btn" aria-label="Disminuir"
      disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}
    >
      <Minus size={16} strokeWidth={1.5} />
    </button>
    <RollingNumber value={value} className="stepper__value" ariaLabel={`${label}: ${value}`} />
    <button
      type="button" className="stepper__btn" aria-label="Aumentar"
      disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}
    >
      <Plus size={16} strokeWidth={1.5} />
    </button>
  </div>
)
