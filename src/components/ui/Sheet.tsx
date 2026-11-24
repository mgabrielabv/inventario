import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { sheetUI } from '../../motion/tokens'
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

/** En móvil toda hoja es inferior: evita paneles estrechos y gestos raros. */
const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return isMobile
}

/** A10/A16 · hoja con resorte, arrastre para cerrar, foco atrapado y devuelto. */
export const Sheet = ({ open, onClose, title, children, side = 'right', className = '' }: Props) => {
  const panel = useRef<HTMLDivElement | null>(null)
  const previous = useRef<HTMLElement | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const smallScreen = useIsMobile()
  const isMobile = side === 'bottom' || smallScreen

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

    // El fondo deja de desplazarse sin saltar: se compensa el ancho de la barra.
    const body = document.body
    const prior = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const gap = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${gap}px`

    const id = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }, sheetUI.focusDelay)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(id)
      body.style.overflow = prior.overflow
      body.style.paddingRight = prior.paddingRight
      previous.current?.focus()
    }
  }, [open, onKey])

  // El botón «atrás» del navegador cierra la hoja en vez de salir de la página.
  useEffect(() => {
    if (!open) return
    const state = { sheetTitle: title }
    window.history.pushState(state, '')
    const onPop = () => closeRef.current()
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (window.history.state?.sheetTitle === title) window.history.back()
    }
  }, [open, title])

  return (
    <AnimatePresence>
      {open && (
        <div className="sheet-root">
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0, backdropFilter: `blur(0px)` }}
            animate={{ opacity: 1, backdropFilter: `blur(${sheetUI.backdropBlur}px)` }}
            exit={{ opacity: 0, backdropFilter: `blur(0px)` }}
            transition={{ duration: sheetUI.backdropDuration }}
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
            dragElastic={sheetUI.dragElastic}
            onDragEnd={(_, info) => {
              const distance = isMobile ? info.offset.y : info.offset.x
              const velocity = isMobile ? info.velocity.y : info.velocity.x
              if (distance > sheetUI.dragDistance || velocity > sheetUI.dragVelocity) onClose()
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
