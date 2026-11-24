import { useReducedMotion } from 'framer-motion'
import {
  AlertCircle, Eye, Heart, Minus, PackageX, Plus, ShoppingBag, Sparkles, Tag, Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useState, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'
import { useCartStore } from '../../logic/store/cart'
import { useFavoritesStore } from '../../logic/store/favorites'
import { useSettingsStore } from '../../logic/store/settings'
import { productBadge } from '../../logic/services/catalog'
import { formatMoney, formatSecondary } from '../../logic/services/pricing'
import { useFlyToCart } from '../../motion/hooks/useFlyToCart'
import type { Product } from '../../logic/types'
import { ProductImage } from './ProductImage'

interface Props {
  product: Product
  available: number
  compact?: boolean
}

interface Badge {
  kind: string
  label: string
  icon: LucideIcon
}

const discountPercent = (product: Product): number => {
  const before = product.precioAnterior
  const price = product.precio ?? 0
  if (before === null || before <= price || before <= 0) return 0
  return Math.round((1 - price / before) * 100)
}

/** Tarjeta densa de tienda: foto real, identificación clara y alta directa. */
export const ProductCard = ({ product, available, compact = false }: Props) => {
  const lines = useCartStore((state) => state.lines)
  const add = useCartStore((state) => state.add)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const favorite = useFavoritesStore((state) => state.ids.includes(product.id))
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const settings = useSettingsStore((state) => state.settings)
  const { fly } = useFlyToCart()
  const { toast } = useToast()
  const reduce = useReducedMotion()
  const [quick, setQuick] = useState(false)

  const line = lines.find((item) => item.productoId === product.id && !item.guardado)
  const soldOut = available <= 0
  const price = product.precio ?? 0
  const percent = discountPercent(product)
  const secondary = settings.moneda.mostrarSecundario ? formatSecondary(price, settings) : null
  const limit = Math.max(1, settings.maxPorPedido || available)
  const max = Math.max(1, Math.min(available, limit))
  const quantity = line ? Math.max(1, Math.min(line.cantidad, max)) : 1
  const href = `/tienda/${product.slug}`

  const withMeta = product as Product & { marca?: unknown; subcategoria?: unknown }
  const brand = typeof withMeta.marca === 'string' ? withMeta.marca.trim() : ''
  const subtype = typeof withMeta.subcategoria === 'string' ? withMeta.subcategoria.trim() : ''

  const baseBadge = productBadge(product, available)
  let badge: Badge | null = null
  if (soldOut) {
    badge = { kind: 'agotado', label: 'Agotado', icon: PackageX }
  } else if (percent > 0) {
    badge = { kind: 'oferta', label: `-${percent} %`, icon: Tag }
  } else if (baseBadge?.kind === 'nuevo') {
    badge = { kind: 'nuevo', label: 'Nuevo', icon: Sparkles }
  } else if (baseBadge?.kind === 'ultimas') {
    badge = { kind: 'ultimas', label: 'Pocas unidades', icon: AlertCircle }
  }

  const announce = () => {
    if (!reduce) {
      toast('Agregado al carrito')
    }
  }

  const onAdd = (event: MouseEvent<HTMLButtonElement>) => {
    if (soldOut) return
    add(product.id, 1, product.precio ?? undefined)
    if (!reduce) fly(event.currentTarget.getBoundingClientRect(), product.id)
    announce()
  }

  const onRemove = () => {
    remove(product.id)
    if (!reduce) toast('Quitado del carrito')
  }

  const prices = (
    <div className="eshop-card__prices">
      <span className="eshop-card__price">{formatMoney(price)}</span>
      {product.precioAnterior !== null && product.precioAnterior > price && (
        <s className="eshop-card__old">{formatMoney(product.precioAnterior)}</s>
      )}
      {secondary && <span className="eshop-card__secondary">{secondary}</span>}
    </div>
  )

  const stepper: ReactNode = (
    <div className="eshop-card__stepper" role="group" aria-label={`Cantidad de ${product.nombre}`}>
      <button
        type="button"
        className="eshop-card__step"
        aria-label={`Quitar una unidad de ${product.nombre}`}
        disabled={quantity <= 1}
        onClick={() => setQuantity(product.id, quantity - 1)}
      >
        <Minus size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <span className="eshop-card__qty" aria-live="polite">{quantity}</span>
      <button
        type="button"
        className="eshop-card__step"
        aria-label={`Agregar una unidad de ${product.nombre}`}
        disabled={quantity >= max}
        onClick={() => setQuantity(product.id, quantity + 1)}
      >
        <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="eshop-card__drop"
        aria-label={`Quitar ${product.nombre} del carrito`}
        onClick={onRemove}
      >
        <Trash2 size={15} strokeWidth={1.6} aria-hidden="true" />
      </button>
    </div>
  )

  return (
    <article className={`product-card eshop-card${compact ? ' eshop-card--compact' : ''}${soldOut ? ' eshop-card--sold-out' : ''}`}>
      <div className="eshop-card__media">
        <ProductImage product={product} />
        <Link className="eshop-card__cover" to={href} tabIndex={-1} aria-hidden="true" />
        {badge && (
          <span className={`eshop-card__badge eshop-card__badge--${badge.kind}`}>
            <badge.icon size={13} strokeWidth={2} aria-hidden="true" />
            {badge.label}
          </span>
        )}
        <button
          type="button"
          className={`eshop-card__fav${favorite ? ' is-active' : ''}`}
          aria-label={favorite
            ? `Quitar ${product.nombre} de favoritos`
            : `Guardar ${product.nombre} en favoritos`}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(product.id)}
        >
          <Heart size={17} strokeWidth={1.7} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="eshop-card__quick"
          aria-label={`Vista rápida de ${product.nombre}`}
          onClick={() => setQuick(true)}
        >
          <Eye size={16} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>

      <div className="eshop-card__body">
        <p className="eshop-card__meta">
          {brand && <span>{brand}</span>}
          {subtype && <span>{subtype}</span>}
          {!brand && !subtype && <span>{product.categoria}</span>}
        </p>
        <Link className="eshop-card__title" to={href}>{product.nombre}</Link>
        <span className="eshop-card__presentation">Presentación · {product.unidad}</span>
        {prices}
        {!soldOut && available <= 5 && (
          <span className="eshop-card__availability">
            <AlertCircle size={13} strokeWidth={1.8} aria-hidden="true" />
            Pocas unidades
          </span>
        )}
        {soldOut && (
          <span className="eshop-card__availability eshop-card__availability--out">
            <PackageX size={13} strokeWidth={1.8} aria-hidden="true" />
            Agotado
          </span>
        )}
      </div>

      <div className="eshop-card__actions">
        {line ? stepper : (
          <Button size="sm" full className="eshop-card__add" disabled={soldOut} onClick={onAdd}>
            <ShoppingBag size={16} strokeWidth={1.7} aria-hidden="true" />
            {soldOut ? 'Agotado' : 'Agregar'}
          </Button>
        )}
      </div>

      <Modal open={quick} onClose={() => setQuick(false)} title="Vista rápida" className="eshop-quick">
        <div className="eshop-quick__grid">
          <ProductImage product={product} />
          <div className="eshop-quick__info">
            <p className="eshop-quick__meta">{brand || product.categoria}</p>
            <h3 className="eshop-quick__title">{product.nombre}</h3>
            {prices}
            <p className="eshop-quick__description">{product.descripcionCorta}</p>
            <Link className="eshop-quick__link" to={href} onClick={() => setQuick(false)}>
              Ver ficha completa →
            </Link>
          </div>
        </div>
      </Modal>
    </article>
  )
}
