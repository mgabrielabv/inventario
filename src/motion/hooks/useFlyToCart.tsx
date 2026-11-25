import {
  createContext, useCallback, useContext, useMemo, useRef, useState, startTransition, type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ProductArt } from '../../components/art/ProductArt'
import type { Product } from '../../logic/types'
import { ease, flyCart, reduced, spring } from '../tokens'
import { enqueueFlight } from '../helpers'

export type CartTarget = 'header' | 'mobile' | 'tabbar'

interface Flight {
  id: number
  product: Product
  x: number
  y: number
  dx: number
  dy: number
}

interface FlyContextValue {
  fly: (origin: DOMRect, product: Product) => void
  /** Registra hasta tres iconos de carrito; se elige el visible en ese momento. */
  setCartTarget: (slot: CartTarget, element: HTMLElement | null) => void
}

const FlyContext = createContext<FlyContextValue | null>(null)
/** El pulso se separa: si viviera en FlyContext, repintaría las 59 tarjetas. */
const BumpContext = createContext(0)

const visibleRect = (element: HTMLElement | null | undefined): DOMRect | null => {
  if (!element) return null
  const style = getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return null
  const rect = element.getBoundingClientRect()
  if (rect.width < 8 || rect.height < 8) return null
  if (rect.bottom < 0 || rect.top > window.innerHeight) return null
  return rect
}

/** Vuelo del producto al carrito visible: arco, cola acotada y sin timeouts. */
export const FlyToCartProvider = ({ children }: { children: ReactNode }) => {
  const [flights, setFlights] = useState<Flight[]>([])
  const [bump, setBump] = useState(0)
  const targets = useRef<Partial<Record<CartTarget, HTMLElement | null>>>({})
  const reduce = useReducedMotion()

  const setCartTarget = useCallback((slot: CartTarget, element: HTMLElement | null) => {
    targets.current[slot] = element
  }, [])

  const fly = useCallback((origin: DOMRect, product: Product) => {
    const destination = (['mobile', 'tabbar', 'header'] as CartTarget[])
      .map((slot) => visibleRect(targets.current[slot]))
      .find((rect): rect is DOMRect => rect !== null)
    // Sin destino visible: el contador avisa igual, no hay vuelo huérfano.
    if (!destination || reduce) {
      startTransition(() => setBump((value) => value + 1))
      return
    }
    const x = origin.left + origin.width / 2
    const y = origin.top + origin.height / 2
    const flight: Flight = {
      id: performance.now() + Math.random(),
      product,
      x, y,
      dx: destination.left + destination.width / 2 - x,
      dy: destination.top + destination.height / 2 - y,
    }
    setFlights((current) => enqueueFlight(current, flight, flyCart.maxTokens))
  }, [reduce])

  const settle = useCallback((id: number) => {
    setFlights((current) => current.filter((item) => item.id !== id))
    // El pulso de la chrome no es urgente: va en una transición separada.
    startTransition(() => setBump((value) => value + 1))
  }, [])

  const value = useMemo(() => ({ fly, setCartTarget }), [fly, setCartTarget])

  return (
    <BumpContext.Provider value={bump}>
      <FlyContext.Provider value={value}>
        {children}
        <div className="fly-layer" aria-hidden="true">
          <AnimatePresence>
            {flights.map((flight) => (
              <motion.div
                key={flight.id}
                className="fly-token"
                style={{ left: flight.x, top: flight.y }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
                animate={{
                  x: [0, flight.dx * 0.55, flight.dx],
                  y: [0, flight.dy * 0.5 - flyCart.arcLift, flight.dy],
                  scale: [1, 0.8, flyCart.endScale],
                  opacity: [1, 1, flyCart.endOpacity],
                  rotate: [0, flight.dx > 0 ? -flyCart.endRotate / 2 : flyCart.endRotate / 2, flyCart.endRotate],
                }}
                transition={{
                  duration: flyCart.duration,
                  times: [0, 0.5, 1],
                  ease: ease.easeOutQuint,
                }}
                onAnimationComplete={() => settle(flight.id)}
              >
                <span className="fly-token__thumb">
                  <ProductArt
                    arquetipo={flight.product.arquetipo}
                    categoria={flight.product.categoria}
                    nombre={flight.product.nombre}
                    size="100%"
                    view="hero"
                  />
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </FlyContext.Provider>
    </BumpContext.Provider>
  )
}

export const useFlyToCart = (): FlyContextValue => {
  const context = useContext(FlyContext)
  if (!context) throw new Error('useFlyToCart debe usarse dentro de FlyToCartProvider')
  return context
}

/** Solo la chrome del carrito necesita el pulso; las tarjetas no se enteran. */
export const useCartBumpValue = (): number => useContext(BumpContext)

/** Pulso del icono y anillo expansivo al recibir el vuelo. */
export const useCartBump = (bump: number) => {
  const reduce = useReducedMotion()
  return {
    animate: bump > 0 && !reduce
      ? { scale: [1, flyCart.bumpScale, 1], transition: spring.settle }
      : bump > 0
        ? { opacity: [1, 0.65, 1], transition: { duration: reduced.duration, ease: reduced.ease } }
        : { scale: 1 },
    key: bump,
  }
}
