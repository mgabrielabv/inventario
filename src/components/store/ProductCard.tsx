import { motion } from 'framer-motion'
import { Heart, ShoppingBag } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ProductBox } from '../box/ProductBox'
import { Button } from '../ui/Button'
import { StatusDot } from '../ui/StatusDot'
import { useToast } from '../ui/Toast'
import { useCartStore } from '../../logic/store/cart'
import { useFavoritesStore } from '../../logic/store/favorites'
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

/** Tarjeta pública: el enlace cubre imagen y título; las acciones quedan fuera. */
export const ProductCard = ({ product, available, compact = false }: Props) => {
  const add = useCartStore((state) => state.add)
  const favorite = useFavoritesStore((state) => state.ids.includes(product.id))
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const { fly } = useFlyToCart()
  const { toast } = useToast()
  const { status, label } = getStoreStatus(available)
  const soldOut = available <= 0
  const href = `/tienda/${product.slug}`

  const onAdd = (event: MouseEvent<HTMLButtonElement>) => {
    if (soldOut) return
    add(product.id, 1)
    fly(event.currentTarget.getBoundingClientRect())
    toast('Agregado al carrito')
  }

  return (
    <motion.article
      className={`product-card${compact ? ' product-card--compact' : ''}`}
      variants={riseItem}
    >
      <div className="product-card__media">
        <Link className="product-card__figure" to={href} tabIndex={-1} aria-hidden="true">
          <ProductBox
            categoria={product.categoria}
            codigo={product.codigo}
            nombre={product.nombre}
            size={compact ? 104 : 160}
            interactive
          />
        </Link>
        <button
          type="button"
          className={`product-card__fav${favorite ? ' is-active' : ''}`}
          aria-label={favorite ? `Quitar ${product.nombre} de favoritos` : `Guardar ${product.nombre} en favoritos`}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(product.id)}
        >
          <Heart
            size={18}
            strokeWidth={1.6}
            fill={favorite ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="product-card__body">
        <span className="product-card__code code">{product.codigo}</span>
        <Link className="product-card__title t-mid" to={href}>{product.nombre}</Link>
        <div className="product-card__status">
          <StatusDot status={status} label={label} compact />
        </div>
        <div className="product-card__prices">
          <span className="product-card__price price t-strong">{formatMoney(product.precio ?? 0)}</span>
          {product.precioAnterior !== null && product.precioAnterior > (product.precio ?? 0) && (
            <s className="product-card__old t-caption">{formatMoney(product.precioAnterior)}</s>
          )}
        </div>
      </div>

      <div className="product-card__actions">
        <Button size="sm" full disabled={soldOut} onClick={onAdd}>
          <ShoppingBag size={16} strokeWidth={1.6} aria-hidden="true" />
          Agregar
        </Button>
      </div>
    </motion.article>
  )
}
