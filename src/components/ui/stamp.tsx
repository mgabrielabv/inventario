import type { CSSProperties, ReactNode } from 'react'

interface StampProps {
  children: ReactNode
  size?: 'sm'
  tilt?: 'left' | 'right'
  animate?: boolean
  className?: string
  style?: CSSProperties
}

export const Stamp = ({ children, size, tilt, animate, className = '', style }: StampProps) => (
  <span
    className={[
      'stamp',
      size === 'sm' ? 'stamp--sm' : '',
      tilt === 'left' ? 'stamp--left' : '',
      tilt === 'right' ? 'stamp--right' : '',
      animate ? 'stamp--animate' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    style={style}
  >
    {children}
  </span>
)
