import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { popover } from '../../motion/variants'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  label: string
  className?: string
}

/** Popover que crece desde su punto de origen. */
export const Popover = ({ open, onClose, children, label, className = '' }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div ref={ref} className={`popover glass ${className}`} role="dialog" aria-label={label} {...popover}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
