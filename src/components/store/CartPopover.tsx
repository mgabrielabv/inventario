import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShoppingBag } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProductArt } from '../art/ProductArt'
import { useFlyToCart } from '../../motion/hooks/useFlyToCart'
import { formatMoney } from '../../logic/services/pricing'
import { useInventoryStore } from '../../logic/store/inventory'
import { dur, ease } from '../../motion/tokens'

/** A9 · confirmación anclada al ícono, se cierra sola y no estorba la compra. */
export const CartPopover = () => {
  const { lastAdded, clearAdded } = useFlyToCart()
  const products = useInventoryStore((state) => state.products)
  const navigate = useNavigate()
  const [pos, setPos] = useState({ top: 0, right: 16 })

  const place = () => {
    const icon = document.querySelector<HTMLElement>('.cart-icon')
    if (!icon) return
    const rect = icon.getBoundingClientRect()
    setPos({ top: rect.bottom + 10, right: Math.max(12, window.innerWidth - rect.right) })
  }

  useLayoutEffect(() => { if (lastAdded) place() }, [lastAdded])

  useEffect(() => {
    if (!lastAdded) return
    const timer = window.setTimeout(clearAdded, 4500)
    window.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', place)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
    }
  }, [lastAdded, clearAdded])

  const product = products.find((item) => item.id === lastAdded)

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="cart-popover"
          role="status"
          aria-live="polite"
          style={{ top: pos.top, right: pos.right }}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: dur.base, ease: ease.out }}
        >
          <div className="cart-popover__head">
            <span className="cart-popover__check"><Check size={15} strokeWidth={2.2} aria-hidden="true" /></span>
            <span className="t-caption t-strong">Agregado al carrito</span>
            <button type="button" className="cart-popover__close" aria-label="Cerrar aviso" onClick={clearAdded}>
              ×
            </button>
          </div>
          <div className="cart-popover__body">
            <ProductArt product={product} size={56} view="solo" />
            <div className="cart-popover__text">
              <span className="t-caption">{product.nombre}</span>
              <span className="t-min t-muted price">{formatMoney(product.precio ?? 0)}</span>
            </div>
          </div>
          <div className="cart-popover__actions">
            <button
              type="button"
              className="cart-popover__keep t-caption"
              onClick={clearAdded}
            >
              Seguir comprando
            </button>
            <button
              type="button"
              className="cart-popover__go t-caption"
              onClick={() => { clearAdded(); navigate('/carrito') }}
            >
              <ShoppingBag size={14} strokeWidth={1.7} aria-hidden="true" /> Ver carrito
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
