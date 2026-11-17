import { forwardRef, type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={['btn', `btn--${variant}`, `btn--${size}`, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
