import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { toastAnimate } from '../../motion/variants'
import { dur } from '../../motion/tokens'

interface ToastOptions {
  action?: { label: string; onClick: () => void }
  duration?: number
  tone?: 'default' | 'critical'
}
interface ToastItem extends ToastOptions { id: number; message: string }
interface ToastContextValue { toast: (message: string, options?: ToastOptions) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

/** A14 · isla dinámica: pastilla centrada arriba, nunca sobre la barra. */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([])
  const reduce = useReducedMotion()

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = Date.now() + Math.random()
    setItems((current) => [...current, { id, message, ...options }].slice(-3))
    window.setTimeout(() => dismiss(id), options.duration ?? (options.action ? 6000 : 3800))
  }, [dismiss])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-island" role="region" aria-label="Notificaciones">
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {items.map((item) => item.message).join('. ')}
        </div>
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              className={`toast${item.tone === 'critical' ? ' toast--critical' : ''}`}
              variants={reduce ? undefined : toastAnimate}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              transition={reduce ? { duration: dur.fast } : undefined}
            >
              <span className="toast__mark"><Check size={15} strokeWidth={2} /></span>
              <span className="toast__message">{item.message}</span>
              {item.action && (
                <button
                  type="button" className="toast__action"
                  onClick={() => { item.action?.onClick(); dismiss(item.id) }}
                >
                  {item.action.label}
                </button>
              )}
              <button type="button" className="toast__close" aria-label="Cerrar notificación"
                onClick={() => dismiss(item.id)}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}
