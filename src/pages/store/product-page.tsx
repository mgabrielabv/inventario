import { motion } from 'framer-motion'
import { Heart, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ProductBox } from '../../components/box/ProductBox'
import { ProductCard } from '../../components/store/ProductCard'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Stepper } from '../../components/ui/Stepper'
import { StatusDot } from '../../components/ui/StatusDot'
import { useToast } from '../../components/ui/Toast'
import { Reveal } from '../../motion/components/Reveal'
import { useParallaxTilt } from '../../motion/hooks/useParallaxTilt'
import { useFlyToCart } from '../../motion/hooks/useFlyToCart'
import { formatMoney } from '../../logic/services/pricing'
import { getAvailable, getStoreStatus } from '../../logic/services/stock'
import { useCartStore } from '../../logic/store/cart'
import { useFavoritesStore } from '../../logic/store/favorites'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'

export const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const add = useCartStore((state) => state.add)
  const product = products.find((item) =>
    item.slug === slug && item.publicado && !item.archivado)
  const favorite = useFavoritesStore((state) => state.ids.includes(product?.id ?? ''))
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const { fly } = useFlyToCart()
  const { toast } = useToast()
  const tilt = useParallaxTilt()
  const [quantity, setQuantity] = useState(1)

  const available = product ? getAvailable(product, orders) : 0
  const { status, label } = getStoreStatus(available)
  const soldOut = available <= 0
  const savings = product && product.precioAnterior !== null
    ? Math.max(0, product.precioAnterior - (product.precio ?? 0))
    : 0

  const related = product
    ? products
      .filter((item) =>
        item.id !== product.id && item.categoria === product.categoria &&
        item.publicado && !item.archivado)
      .slice(0, 4)
    : []

  useEffect(() => { setQuantity(1) }, [slug])

  const onAdd = (event: MouseEvent<HTMLButtonElement>) => {
    if (!product || soldOut) return
    add(product.id, Math.min(quantity, available))
    fly(event.currentTarget.getBoundingClientRect())
    toast('Agregado al carrito')
  }

  if (!product) {
    return (
      <div className="pdp-page container-store">
        <EmptyState
          title="No encontramos ese producto"
          description="Puede que ya no esté publicado o que el enlace haya cambiado."
          action={<Link className="btn btn--primary" to="/tienda">Ir al catálogo</Link>}
        />
      </div>
    )
  }

  return (
    <div className="pdp-page container-detail">
      <nav className="pdp-breadcrumb" aria-label="Ruta de navegación">
        <ol>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/tienda">Catálogo</Link></li>
          <li><Link to={`/tienda?cat=${encodeURIComponent(product.categoria)}`}>{product.categoria}</Link></li>
          <li aria-current="page">{product.nombre}</li>
        </ol>
      </nav>

      <div className="pdp-layout">
        <div className="pdp-gallery">
          <div className="pdp-stage">
            <motion.div
              ref={tilt.ref}
              className="pdp-tilt"
              style={tilt.style}
              onPointerMove={tilt.onPointerMove}
              onPointerLeave={tilt.onPointerLeave}
            >
              <ProductBox
                categoria={product.categoria}
                codigo={product.codigo}
                nombre={product.nombre}
                size={340}
                interactive
              />
            </motion.div>
          </div>
          <p className="pdp-gallery__note t-min">Ilustración de demostración</p>
        </div>

        <div className="pdp-info">
          <p className="pdp-info__category t-min t-clay">{product.categoria}</p>
          <h1 className="t-detail-title pdp-info__title">{product.nombre}</h1>
          <div className="pdp-info__meta">
            <span className="code">{product.codigo}</span>
            <span aria-hidden="true">·</span>
            <span>{product.unidad}</span>
          </div>

          <div className="pdp-prices">
            <span className="pdp-prices__main price">{formatMoney(product.precio ?? 0)}</span>
            {product.precioAnterior !== null && product.precioAnterior > (product.precio ?? 0) && (
              <s className="pdp-prices__old t-caption">{formatMoney(product.precioAnterior)}</s>
            )}
            {savings > 0 && (
              <span className="pdp-prices__savings t-min t-primary">Ahorras {formatMoney(savings)}</span>
            )}
          </div>

          <div className="pdp-info__status">
            <StatusDot status={status} label={label} />
          </div>

          {product.descripcionCorta && (
            <p className="pdp-info__short t-lead">{product.descripcionCorta}</p>
          )}

          <div className="pdp-buy">
            <Stepper
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={Math.max(1, available)}
              label="Cantidad"
            />
            <Button full disabled={soldOut} onClick={onAdd}>
              <ShoppingBag size={18} strokeWidth={1.5} aria-hidden="true" />
              Agregar al carrito
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={favorite ? 'pdp-buy__fav is-active' : 'pdp-buy__fav'}
              aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              aria-pressed={favorite}
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart
                size={19}
                strokeWidth={1.6}
                fill={favorite ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
            </Button>
          </div>

          <p className="pdp-note t-min">
            <ShieldCheck size={16} strokeWidth={1.5} aria-hidden="true" />
            Compra segura de demostración. No se realiza ningún cobro real.
          </p>

          {product.descripcion && (
            <section className="pdp-section">
              <h2 className="t-ui t-strong">Descripción</h2>
              <p className="pdp-description t-body">{product.descripcion}</p>
            </section>
          )}

          {product.especificaciones.length > 0 && (
            <section className="pdp-section">
              <h2 className="t-ui t-strong">Especificaciones</h2>
              <table className="pdp-specs">
                <tbody>
                  {product.especificaciones.map((spec) => (
                    <tr key={spec.clave}>
                      <th scope="row">{spec.clave}</th>
                      <td>{spec.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="pdp-related" aria-labelledby="pdp-related-title">
          <header className="pdp-related__head">
            <h2 id="pdp-related-title" className="t-section">También te puede gustar</h2>
            <Link className="pdp-related__all t-mid" to={`/tienda?cat=${encodeURIComponent(product.categoria)}`}>
              Ver categoría
            </Link>
          </header>
          <Reveal className="pdp-related__grid" as="div">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                available={getAvailable(item, orders)}
              />
            ))}
          </Reveal>
        </section>
      )}
    </div>
  )
}
