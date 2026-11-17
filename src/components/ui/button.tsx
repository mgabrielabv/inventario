import { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-[var(--accent)] text-[#FBFAF6] hover:bg-[var(--accent-hover)]',
      ghost: 'hover:bg-[var(--line)]',
      outline: 'border border-[var(--line-strong)] hover:bg-[var(--line)]',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase',
      md: 'px-4 py-2 text-xs tracking-[0.15em] uppercase',
      lg: 'px-6 py-3 text-xs tracking-[0.2em] uppercase',
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'relative overflow-hidden transition-colors duration-300',
          variants[variant],
          sizes[size],
          className
        )}
        {...(props as any)}
      >
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
