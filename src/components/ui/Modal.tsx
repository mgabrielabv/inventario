import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { spring } from '../../motion/tokens'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

/** Diálogo centrado y accesible: foco atrapado, Escape y devolución del foco. */
export const Modal = ({ open, onClose, title, children, className = '' }: Props) => {
  const panel = useRef<HTMLDivElement | null>(null)
  const previous = useRef<HTMLElement | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  const onKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.stopPropagation(); closeRef.current(); return }
    if (event.key !== 'Tab' || !panel.current) return
    const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (nodes.length === 0) return
    const first = nodes[0]!
    const last = nodes[nodes.length - 1]!
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }, [])

  useEffect(() => {
    if (!open) return
    previous.current = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', onKey)
    const body = document.body
    const prior = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const gap = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${gap}px`
    const id = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }, 80)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(id)
      body.style.overflow = prior.overflow
      body.style.paddingRight = prior.paddingRight
      previous.current?.focus()
    }
  }, [open, onKey])

  useEffect(() => {
    if (!open) return
    window.history.pushState({ modalTitle: title }, '')
    const onPop = () => closeRef.current()
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (window.history.state?.modalTitle === title) window.history.back()
    }
  }, [open, title])

  return (
    <AnimatePresence>
      {open && (
        <div className="modal-root">
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            className={`modal ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={spring.ui}
          >
            <header className="modal__header">
              <h2 className="t-ui t-strong">{title}</h2>
              <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </header>
            <div className="modal__body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
