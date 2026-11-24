import { motion } from 'framer-motion'
import { RotateCcw, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductArt } from '../art/ProductArt'
import { StatusDot } from '../ui/StatusDot'
import { Stepper } from '../ui/Stepper'
import { useToast } from '../ui/Toast'
import { formatMoney } from '../../logic/services/pricing'
import { getStoreStatus } from '../../logic/services/stock'
import { useCartStore } from '../../logic/store/cart'
import { dur } from '../../motion/tokens'
import type { CartIssue } from '../../logic/services/cart'
import type { CartLine, Product } from '../../logic/types'

interface Props {
  line: CartLine
  product: Product
  available: number
  issue?: CartIssue
  saved?: boolean
  onNavigate?: () => void
}

/** Línea compartida por la hoja y la página: arte, avisos y acciones reversibles. */
export const CartLineItem = ({ line, product, available, issue, saved = false, onNavigate }: Props) => {
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const restore = useCartStore((state) => state.restore)
  const saveForLater = useCartStore((state) => state.saveForLater)
  const { toast } = useToast()
  const { status, label } = getStoreStatus(available)
  const max = Math.max(1, available)

  const onRemove = () => {
    remove(line.productoId)
    toast(`Se quitó ${product.nombre}`, {
      action: { label: 'Deshacer', onClick: () => restore(line) },
    })
  }

  return (
    <motion.li
      layout
      className={`cart-line-item${saved ? ' is-saved' : ''}${issue ? ' has-issue' : ''}`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: dur.base }}
    >
      <Link
        className="cart-line-item__art"
        to={`/tienda/${product.slug}`}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductArt product={product} size={92} view="solo" />
      </Link>

      <div className="cart-line-item__info">
        <Link className="cart-line-item__name t-mid t-strong" to={`/tienda/${product.slug}`} onClick={onNavigate}>
          {product.nombre}
        </Link>
        <span className="cart-line-item__meta t-min t-muted">
          {product.marca || product.categoria} · {formatMoney(product.precio ?? 0)} c/u · {label}
        </span>
        <StatusDot status={status} label={label} compact />

        {issue && (
          <p className="cart-line-item__warning t-min" role="status">
            {issue.mensaje}
            {issue.tipo === 'stock' && (
              <button
                type="button"
                className="link-button t-min"
                onClick={() => setQuantity(line.productoId, Math.max(1, available))}
              >
                Ajustar a {Math.max(1, available)}
              </button>
            )}
          </p>
        )}

        {!saved && (
          <div className="cart-line-item__controls">
            <Stepper
              value={line.cantidad}
              min={1}
              max={max}
              onChange={(value) => setQuantity(line.productoId, value)}
              label={`Cantidad de ${product.nombre}`}
            />
            <button type="button" className="cart-line-item__action t-caption" onClick={onRemove}>
              <Trash2 size={15} strokeWidth={1.6} aria-hidden="true" /> Quitar
            </button>
            <button
              type="button"
              className="cart-line-item__action t-caption"
              onClick={() => { saveForLater(line.productoId); toast('Guardado para después') }}
            >
              <RotateCcw size={15} strokeWidth={1.6} aria-hidden="true" /> Guardar para después
            </button>
          </div>
        )}
        {saved && (
          <div className="cart-line-item__controls">
            <button
              type="button"
              className="cart-line-item__action t-caption"
              onClick={() => { restore(line); toast('Devuelto al carrito') }}
            >
              <RotateCcw size={15} strokeWidth={1.6} aria-hidden="true" /> Volver al carrito
            </button>
            <button type="button" className="cart-line-item__action t-caption" onClick={onRemove}>
              <Trash2 size={15} strokeWidth={1.6} aria-hidden="true" /> Quitar
            </button>
          </div>
        )}
      </div>

      <span className="cart-line-item__total price t-mid">
        {formatMoney((product.precio ?? 0) * line.cantidad)}
      </span>
    </motion.li>
  )
}
