import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { sheetDesktop, sheetMobile } from '../../motion/variants'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  side?: 'right' | 'bottom'
  className?: string
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

/** A10/A16 · hoja con resorte, arrastre para cerrar, foco atrapado y devuelto. */
export const Sheet = ({ open, onClose, title, children, side = 'right', className = '' }: Props) => {
  const panel = useRef<HTMLDivElement | null>(null)
  const previous = useRef<HTMLElement | null>(null)
  const isMobile = side === 'bottom'

  const onKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); return }
    if (event.key !== 'Tab' || !panel.current) return
    const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (nodes.length === 0) return
    const first = nodes[0]!
    const last = nodes[nodes.length - 1]!
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }, [onClose])

  useEffect(() => {
    if (!open) return
    previous.current = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', onKey)
    const id = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }, 60)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(id)
      previous.current?.focus()
    }
  }, [open, onKey])

  return (
    <AnimatePresence>
      {open && (
        <div className="sheet-root">
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            className={`sheet sheet--${side} ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={isMobile ? sheetMobile : sheetDesktop}
            initial="initial"
            animate="animate"
            exit="exit"
            drag={isMobile ? 'y' : 'x'}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.22}
            onDragEnd={(_, info) => {
              const distance = isMobile ? info.offset.y : info.offset.x
              const velocity = isMobile ? info.velocity.y : info.velocity.x
              if (distance > 120 || velocity > 700) onClose()
            }}
          >
            <div className="sheet__grip" aria-hidden="true" />
            <header className="sheet__header">
              <h2 className="t-ui t-strong">{title}</h2>
              <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </header>
            <div className="sheet__body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
