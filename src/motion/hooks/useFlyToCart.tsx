import {
  createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { dur, ease, spring } from '../tokens'

interface Flight { id: number; x: number; y: number; dx: number; dy: number }

interface FlyContextValue {
  fly: (origin: DOMRect) => void
  setCartTarget: (element: HTMLElement | null) => void
  bump: number
}

const FlyContext = createContext<FlyContextValue | null>(null)

/** A9 · vuelo en arco hasta el ícono del carrito + rebote del contador. */
export const FlyToCartProvider = ({ children }: { children: ReactNode }) => {
  const [flights, setFlights] = useState<Flight[]>([])
  const [bump, setBump] = useState(0)
  const target = useRef<HTMLElement | null>(null)
  const reduce = useReducedMotion()

  const setCartTarget = useCallback((element: HTMLElement | null) => {
    target.current = element
  }, [])

  const fly = useCallback((origin: DOMRect) => {
    const destination = target.current?.getBoundingClientRect()
    if (!destination) return
    const x = origin.left + origin.width / 2
    const y = origin.top + origin.height / 2
    const dx = destination.left + destination.width / 2 - x
    const dy = destination.top + destination.height / 2 - y
    const id = Date.now() + Math.random()
    setFlights((current) => [...current, { id, x, y, dx, dy }])
    window.setTimeout(() => {
      setFlights((current) => current.filter((item) => item.id !== id))
      setBump((value) => value + 1)
    }, reduce ? 0 : dur.slow + 0.12)
  }, [reduce])

  const value = useMemo(() => ({ fly, setCartTarget, bump }), [fly, bump, setCartTarget])

  return (
    <FlyContext.Provider value={value}>
      {children}
      <div className="fly-layer" aria-hidden="true">
        <AnimatePresence>
          {!reduce && flights.map((flight) => (
            <motion.div
              key={flight.id}
              className="fly-token"
              style={{ left: flight.x, top: flight.y }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
              animate={{ x: flight.dx, y: flight.dy, scale: 0.2, opacity: 0.5, rotate: 12 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: ease.ios }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M3 8l9-4 9 4-9 4-9-4Z" fill="var(--box-top)" />
                <path d="M3 8v9l9 4v-9L3 8Z" fill="var(--box-left)" />
                <path d="M21 8v9l-9 4v-9l9-4Z" fill="var(--box-right)" />
              </svg>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FlyContext.Provider>
  )
}

export const useFlyToCart = (): FlyContextValue => {
  const context = useContext(FlyContext)
  if (!context) throw new Error('useFlyToCart debe usarse dentro de FlyToCartProvider')
  return context
}

/** Rebote del ícono al recibir el vuelo. */
export const useCartBump = (bump: number) => {
  const reduce = useReducedMotion()
  return {
    animate: bump > 0 && !reduce
      ? { scale: [1, 1.28, 1], transition: spring.snappy }
      : { scale: 1 },
    key: bump,
  }
}
