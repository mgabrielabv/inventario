import { motion } from 'framer-motion'
import { useId, useRef } from 'react'
import { spring } from '../../motion/tokens'

interface Option<T extends string> { value: T; label: string }
interface Props<T extends string> {
  value: T
  options: Array<Option<T>>
  onChange: (value: T) => void
  label?: string
  size?: 'md' | 'sm'
  className?: string
}

/** A7/A15 · segmented control con indicador deslizante y flechas. */
export const Segmented = <T extends string>({
  value, options, onChange, label, size = 'md', className = '',
}: Props<T>) => {
  const id = useId()
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const delta = event.key === 'ArrowRight' ? 1 : -1
    const next = (index + delta + options.length) % options.length
    onChange(options[next]!.value)
    refs.current[next]?.focus()
  }

  return (
    <div
      className={`segmented segmented--${size} ${className}`}
      role="tablist"
      aria-label={label}
      id={id}
    >
      {options.map((option, index) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => { refs.current[index] = node }}
            role="tab"
            aria-selected={active}
            className={`segmented__item${active ? ' is-active' : ''}`}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            tabIndex={active ? 0 : -1}
          >
            {active && (
              <motion.span
                layoutId={`segment-${id}`}
                className="segmented__indicator"
                transition={spring.ui}
              />
            )}
            <span className="segmented__label">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
