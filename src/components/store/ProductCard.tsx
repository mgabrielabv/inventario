import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
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
import { RollingNumber } from '../../motion/components/RollingNumber'
import { useFlyToCart } from '../../motion/hooks/useFlyToCart'
import { cardMotion, dur, ease, haptics, spring } from '../../motion/tokens'
import { isLightDevice, motionSafe, staggerDelay } from '../../motion/helpers'
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

/** Botón → stepper: el texto sale arriba y el stepper entra desde abajo. */
const swap: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: dur.step, ease: ease.easeOutQuint } },
  exit: { opacity: 0, y: -12, transition: { duration: dur.fast, ease: ease.ios } },
}

const discountPercent = (product: Product): number => {
  const before = product.precioAnterior
  const price = product.precio ?? 0
  if (before === null || before <= price || before <= 0) return 0
  return Math.round((1 - price / before) * 100)
}

/** Tono decorativo derivado de la categoría; nunca un color literal nuevo. */
const categoryTone = (categoria: string): string => {
  const value = categoria.toLocaleLowerCase('es')
  if (value.includes('cuidado')) return 'cuidado'
  if (value.includes('tecnolog')) return 'tecnologia'
  if (value.includes('deport')) return 'deportes'
  if (value.includes('aliment')) return 'alimentos'
  if (value.includes('hogar')) return 'hogar'
  if (value.includes('accesor')) return 'accesorios'
  return 'natural'
}

/** Vibración opcional: desactivada hasta confirmar la decisión (docs/motion.md). */
const haptic = (reduce: boolean) => {
  if (haptics.enabled && !reduce && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.(haptics.duration)
  }
}

/** Tarjeta densa de tienda: foto real, identificación clara y alta directa. */
export const ProductCard = ({ product, available, compact = false }: Props) => {
  // Suscripción por producto: añadir una línea no repinta las 59 tarjetas.
  const line = useCartStore((state) => state.lines.find(
    (item) => item.productoId === product.id && !item.guardado,
  ))
  const add = useCartStore((state) => state.add)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const favorite = useFavoritesStore((state) => state.ids.includes(product.id))
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const settings = useSettingsStore((state) => state.settings)
  const { fly } = useFlyToCart()
  const { toast } = useToast()
  const reduce = useReducedMotion()
  const light = isLightDevice()
  const [quick, setQuick] = useState(false)
  const [status, setStatus] = useState('')
  const [checked, setChecked] = useState(false)
  const [spark, setSpark] = useState(0)

  const soldOut = available <= 0
  const price = product.precio ?? 0
  const percent = discountPercent(product)
  const secondary = settings.moneda.mostrarSecundario ? formatSecondary(price, settings) : null
  const limit = Math.max(1, settings.maxPorPedido || available)
  const max = Math.max(1, Math.min(available, limit))
  const quantity = line ? Math.max(1, Math.min(line.cantidad, max)) : 1
  const href = `/tienda/${product.slug}`
  const variants = reduce ? motionSafe(swap) : swap

  const withMeta = product as Product & { marca?: unknown }
  const brand = typeof withMeta.marca === 'string' ? withMeta.marca.trim() : ''
  const tone = categoryTone(product.categoria)

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

  const onAdd = (event: MouseEvent<HTMLButtonElement>) => {
    if (soldOut) return
    add(product.id, 1, product.precio ?? undefined)
    // El provider decide: vuelo hacia el carrito visible o solo pulso del contador.
    fly(event.currentTarget.getBoundingClientRect(), product)
    setStatus(`Agregado al carrito: ${product.nombre}`)
    setChecked(true)
    haptic(!!reduce)
  }

  const onRemove = () => {
    const previous = quantity
    remove(product.id)
    setStatus(`Quitado del carrito: ${product.nombre}`)
    // El toast queda reservado para acciones deshechables.
    toast('Quitado del carrito', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          add(product.id, previous, product.precio ?? undefined)
          setStatus(`Restaurado: ${product.nombre}`)
        },
      },
    })
  }

  const onFavorite = () => {
    if (!favorite && !reduce && !light) setSpark((value) => value + 1)
    toggleFavorite(product.id)
  }

  const prices = (
    <div className="eshop-card__prices">
      <span className="eshop-card__price"><RollingNumber value={formatMoney(price)} ariaLabel={formatMoney(price)} /></span>
      {product.precioAnterior !== null && product.precioAnterior > price && (
        <s className="eshop-card__old">{formatMoney(product.precioAnterior)}</s>
      )}
      {secondary && <span className="eshop-card__secondary">{secondary}</span>}
    </div>
  )

  const stepper: ReactNode = (
    <div className="eshop-card__stepper" role="group" aria-label={`Cantidad de ${product.nombre}`}>
      <motion.button
        type="button"
        className="eshop-card__step"
        aria-label={`Quitar una unidad de ${product.nombre}`}
        disabled={quantity <= 1}
        whileTap={reduce ? undefined : { scale: 0.9 }}
        transition={spring.press}
        onClick={() => { setQuantity(product.id, quantity - 1); setStatus(`Cantidad: ${quantity - 1}`) }}
      >
        <Minus size={16} strokeWidth={1.8} aria-hidden="true" />
      </motion.button>
      <span className="eshop-card__qty" aria-live="polite">
        <RollingNumber value={quantity} ariaLabel={`${quantity} unidades`} />
      </span>
      <motion.button
        type="button"
        className="eshop-card__step"
        aria-label={`Agregar una unidad de ${product.nombre}`}
        disabled={quantity >= max}
        whileTap={reduce ? undefined : { scale: 0.9 }}
        transition={spring.press}
        onClick={() => {
          setQuantity(product.id, quantity + 1)
          setStatus(`Cantidad: ${quantity + 1}`)
          haptic(!!reduce)
        }}
      >
        <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
      </motion.button>
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
      {/* Feedback funcional: siempre presente, con o sin movimiento. */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{status}</span>
      <div className="eshop-card__media" data-categoria={tone}>
        <div className="eshop-card__float">
          <ProductImage product={product} />
        </div>
        <Link className="eshop-card__cover" to={href} tabIndex={-1} aria-hidden="true" />
        {badge && (
          <motion.span
            className={`eshop-card__badge eshop-card__badge--${badge.kind}`}
            initial={reduce ? undefined : { opacity: 0, scale: cardMotion.badgeFrom }}
            whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: dur.fast, ease: ease.easeOutQuint, delay: staggerDelay(1) }}
          >
            <badge.icon size={13} strokeWidth={2} aria-hidden="true" />
            {badge.label}
            {badge.kind === 'oferta' && !reduce && !light && (
              <motion.span
                className="eshop-card__shine"
                aria-hidden="true"
                initial={{ x: `${cardMotion.shimmerFrom}%` }}
                whileInView={{ x: `${cardMotion.shimmerTo}%` }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: dur.slow, ease: ease.easeOutExpo, delay: dur.fast }}
              />
            )}
          </motion.span>
        )}
        <motion.button
          type="button"
          className={`eshop-card__fav${favorite ? ' is-active' : ''}`}
          aria-label={favorite
            ? `Quitar ${product.nombre} de favoritos`
            : `Guardar ${product.nombre} en favoritos`}
          aria-pressed={favorite}
          animate={reduce || !favorite ? undefined : { scale: [1, cardMotion.favoritePop, 1] }}
          transition={spring.settle}
          onClick={onFavorite}
        >
          <span className="eshop-card__fav-base"><Heart size={17} strokeWidth={1.7} aria-hidden="true" /></span>
          <motion.span
            className="eshop-card__fav-fill"
            aria-hidden="true"
            initial={false}
            animate={reduce
              ? { opacity: favorite ? 1 : 0 }
              : { clipPath: favorite ? 'inset(0% 0% 0% 0%)' : 'inset(50% 50% 50% 50%)' }}
            transition={reduce
              ? { duration: dur.micro }
              : { duration: dur.fast, ease: ease.easeOutQuint }}
          >
            <Heart size={17} strokeWidth={1.7} fill="currentColor" />
          </motion.span>
          {spark > 0 && (
            <span key={spark} className="eshop-card__sparks" aria-hidden="true">
              {Array.from({ length: cardMotion.sparkCount }, (_, index) => (
                <motion.i
                  key={index}
                  style={{ rotate: index * cardMotion.sparkAngle }}
                  initial={{ opacity: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: [0, -cardMotion.sparkDistance, -cardMotion.sparkDistance * 1.2],
                    scale: [0, 1, 0],
                  }}
                  transition={{ duration: cardMotion.sparkDuration, delay: staggerDelay(index), ease: ease.easeOutExpo }}
                />
              ))}
            </span>
          )}
        </motion.button>
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
          <span>{product.categoria}</span>
        </p>
        <Link className="eshop-card__title" to={href}>{product.nombre}</Link>
        {prices}
        {!soldOut && available <= 5 && badge?.kind !== 'ultimas' && (
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
        {/* Sin `layout`: la proyección de Framer en 59 tarjetas costaba más
            que el salto de altura, que ya absorbe el contenedor. */}
        <div className="eshop-card__action-switch">
          <AnimatePresence mode="wait" initial={false}>
            {line ? (
              <motion.div key="stepper" variants={variants} initial="hidden" animate="show" exit="exit">
                {stepper}
              </motion.div>
            ) : (
              <motion.div key="add" variants={variants} initial="hidden" animate="show" exit="exit">
                <Button
                  size="sm"
                  full
                  className="eshop-card__add"
                  disabled={soldOut}
                  whileTap={reduce ? undefined : { scale: cardMotion.tapScale }}
                  transition={{ duration: cardMotion.tapDuration }}
                  onClick={onAdd}
                >
                  <ShoppingBag size={16} strokeWidth={1.7} aria-hidden="true" />
                  {soldOut ? 'Agotado' : 'Agregar'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {checked && (
            <motion.span
              className="eshop-card__check"
              aria-hidden="true"
              initial={{ opacity: 0, scale: cardMotion.badgeFrom }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur.fast, ease: ease.easeOutQuint }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <motion.path
                  d="M5 12.5 10 17 19 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduce ? dur.micro : dur.check, ease: ease.easeOutQuint }}
                  onAnimationComplete={() => setChecked(false)}
                />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
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
