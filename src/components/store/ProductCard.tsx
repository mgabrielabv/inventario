import { motion } from 'framer-motion'
import { Eye, Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ProductArt } from '../art/ProductArt'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { StatusDot } from '../ui/StatusDot'
import { Stepper } from '../ui/Stepper'
import { useToast } from '../ui/Toast'
import { useCartStore } from '../../logic/store/cart'
import { useFavoritesStore } from '../../logic/store/favorites'
import { productBadge } from '../../logic/services/catalog'
import { formatMoney } from '../../logic/services/pricing'
import { getStoreStatus } from '../../logic/services/stock'
import { useFlyToCart } from '../../motion/hooks/useFlyToCart'
import { riseItem } from '../../motion/variants'
import type { Product } from '../../logic/types'

interface Props {
  product: Product
  available: number
  compact?: boolean
}

/** Tarjeta pública: arte 4:3, una insignia, vista rápida y alta en sitio. */
export const ProductCard = ({ product, available, compact = false }: Props) => {
  const lines = useCartStore((state) => state.lines)
  const add = useCartStore((state) => state.add)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const favorite = useFavoritesStore((state) => state.ids.includes(product.id))
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const { fly } = useFlyToCart()
  const { toast } = useToast()
  const [quick, setQuick] = useState(false)
  const line = lines.find((item) => item.productoId === product.id)
  const { status, label } = getStoreStatus(available)
  const soldOut = available <= 0
  const badge = productBadge(product, available)
  const href = `/tienda/${product.slug}`
  const max = Math.max(1, available)

  const onAdd = (event: MouseEvent<HTMLButtonElement>) => {
    if (soldOut) return
    add(product.id, 1, product.precio ?? undefined)
    fly(event.currentTarget.getBoundingClientRect())
    toast('Agregado al carrito')
  }

  const price = (
    <div className="product-card__prices">
      <span className="product-card__price price t-strong">{formatMoney(product.precio ?? 0)}</span>
      {product.precioAnterior !== null && product.precioAnterior > (product.precio ?? 0) && (
        <s className="product-card__old t-caption">{formatMoney(product.precioAnterior)}</s>
      )}
    </div>
  )

  return (
    <motion.article
      className={`product-card${compact ? ' product-card--compact' : ''}${soldOut ? ' is-sold-out' : ''}`}
      variants={riseItem}
    >
      <div className="product-card__media">
        <ProductArt product={product} size="100%" view="hero" interactive />
        <Link className="product-card__cover" to={href} tabIndex={-1} aria-hidden="true" />
        {badge && !soldOut && (
          <span className={`product-card__badge product-card__badge--${badge.kind}`}>{badge.label}</span>
        )}
        {soldOut && <span className="product-card__sold-out">Agotado</span>}
        <button
          type="button"
          className={`product-card__fav${favorite ? ' is-active' : ''}`}
          aria-label={favorite ? `Quitar ${product.nombre} de favoritos` : `Guardar ${product.nombre} en favoritos`}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(product.id)}
        >
          <Heart size={18} strokeWidth={1.6} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="product-card__quick"
          aria-label={`Vista rápida de ${product.nombre}`}
          onClick={() => setQuick(true)}
        >
          <Eye size={17} strokeWidth={1.6} aria-hidden="true" />
          <span>Vista rápida</span>
        </button>
      </div>

      <div className="product-card__body">
        <span className="product-card__code code">{product.codigo}</span>
        <Link className="product-card__title t-mid" to={href}>{product.nombre}</Link>
        <div className="product-card__status">
          <StatusDot status={status} label={label} compact />
        </div>
        {price}
      </div>

      <div className="product-card__actions">
        {!soldOut && line ? (
          <div className="product-card__in-cart">
            <Stepper
              value={line.cantidad}
              min={1}
              max={max}
              onChange={(value) => setQuantity(product.id, value)}
              label={`Cantidad de ${product.nombre}`}
            />
            <button
              type="button"
              className="product-card__remove"
              aria-label={`Quitar ${product.nombre} del carrito`}
              onClick={() => { remove(product.id); toast('Quitado del carrito') }}
            >
              <Trash2 size={16} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Button size="sm" full disabled={soldOut} onClick={onAdd}>
            <ShoppingBag size={16} strokeWidth={1.6} aria-hidden="true" />
            {soldOut ? 'Agotado' : 'Agregar'}
          </Button>
        )}
      </div>

      <Modal open={quick} onClose={() => setQuick(false)} title="Vista rápida" className="quick-view">
        <div className="quick-view__grid">
          <ProductArt product={product} size="100%" view="hero" />
          <div className="quick-view__info">
            <span className="code">{product.codigo} · {product.categoria}</span>
            <h3 className="t-ui t-strong">{product.nombre}</h3>
            <StatusDot status={status} label={label} compact />
            {price}
            <p className="t-caption t-pretty">{product.descripcionCorta}</p>
            <div className="quick-view__actions">
              {!soldOut && line && (
                <Stepper
                  value={line.cantidad}
                  min={1}
                  max={max}
                  onChange={(value) => setQuantity(product.id, value)}
                  label={`Cantidad de ${product.nombre}`}
                />
              )}
              <Button
                size="sm"
                full
                disabled={soldOut}
                onClick={(event) => {
                  if (line) { setQuick(false); return }
                  onAdd(event)
                }}
              >
                <ShoppingBag size={16} strokeWidth={1.6} aria-hidden="true" />
                {soldOut ? 'Agotado' : line ? 'En el carrito' : 'Agregar al carrito'}
              </Button>
            </div>
            <Link className="quick-view__link t-caption" to={href} onClick={() => setQuick(false)}>
              Ver ficha completa →
            </Link>
          </div>
        </div>
      </Modal>
    </motion.article>
  )
}
