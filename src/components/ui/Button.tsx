import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { pressable } from '../../motion/variants'
import { spring } from '../../motion/tokens'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'
export type ButtonSize = 'md' | 'sm' | 'icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  magnetic?: boolean
  children: ReactNode
  full?: boolean
}

export const Button = ({
  variant = 'primary', size = 'md', magnetic = false, className = '', children, ...rest
}: Props) => {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, spring.snappy)
  const y = useSpring(my, spring.snappy)

  const onMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!magnetic || reduce || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    mx.set(((event.clientX - rect.left) / rect.width - 0.5) * 12)
    my.set(((event.clientY - rect.top) / rect.height - 0.5) * 12)
  }
  const onLeave = () => { mx.set(0); my.set(0) }

  return (
    <motion.button
      type="button"
      className={`btn btn--${variant} btn--${size} ${className}`}
      style={magnetic && !reduce ? { x, y } : undefined}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      {...(reduce ? {} : pressable)}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  )
}

export const TertiaryLink = ({
  children, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
  <button type="button" className={`btn-tertiary ${className}`} {...rest}>
    <span>{children}</span><span aria-hidden="true">›</span>
  </button>
)
