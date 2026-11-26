import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { popover } from '../../motion/variants'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  label: string
  className?: string
  /** Ancla debajo del disparador, alineada a su borde derecho. */
  placement?: 'bottom-end'
  offset?: number
}

/**
 * Popover anclado al disparador mediante CSS (top:100% + right:0 dentro del
 * contenedor relativo), con shift/flip medidos después del montaje.
 */
export const Popover = ({
  open, onClose, children, label, className = '', placement = 'bottom-end', offset = 8,
}: Props) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const closeRef = useRef(onClose)
  const location = useLocation()
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => { if (open) closeRef.current() }, [location.pathname, location.search, open])

  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement | null
    const panel = ref.current
    const trigger = panel?.previousElementSibling as HTMLElement | null
    const place = () => {
      if (!panel || !trigger) return
      const root = panel.parentElement
      if (!root) return
      const bounds = root.getBoundingClientRect()
      const rect = panel.getBoundingClientRect()
      // Con top:100% ya estamos justo bajo el disparador; solo corregimos
      // desbordes laterales (shift) y falta de sitio vertical (flip).
      const overflowRight = rect.right - (window.innerWidth - 8)
      if (overflowRight > 0) panel.style.right = `${overflowRight}px`
      const overflowLeft = 8 - rect.left
      if (overflowLeft > 0) panel.style.right = `${-overflowLeft}px`
      if (bounds.bottom + offset + rect.height > window.innerHeight - 8
        && bounds.top - offset - rect.height > 8) {
        panel.style.top = 'auto'
        panel.style.bottom = `calc(100% + ${offset}px)`
      }
    }
    place()
    window.addEventListener('resize', place)
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)
        && !trigger?.contains(event.target as Node)) closeRef.current()
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current() }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', place)
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
      returnFocus.current?.focus()
    }
  }, [open, placement, offset])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          className={`popover glass eshop-popover--${placement} ${className}`.trim()}
          role="dialog"
          aria-label={label}
          style={{ top: `calc(100% + ${offset}px)` }}
          {...popover}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
