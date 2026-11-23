import { motion } from 'framer-motion'
import { Check, Heart, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArtZoom } from '../../components/art/ArtZoom'
import { ProductArt, type ArtView } from '../../components/art/ProductArt'
import { ProductCard } from '../../components/store/ProductCard'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Stepper } from '../../components/ui/Stepper'
import { StatusDot } from '../../components/ui/StatusDot'
import { useToast } from '../../components/ui/Toast'
import { Reveal } from '../../motion/components/Reveal'
import { useParallaxTilt } from '../../motion/hooks/useParallaxTilt'
import { useFlyToCart } from '../../motion/hooks/useFlyToCart'
import { estimarEntrega } from '../../logic/services/delivery'
import { formatMoney, formatSecondary } from '../../logic/services/pricing'
import { boughtTogether, recentlyViewed, relatedProducts } from '../../logic/services/recommendations'
import { getAvailable, getStoreStatus } from '../../logic/services/stock'
import { useCartStore } from '../../logic/store/cart'
import { useFavoritesStore } from '../../logic/store/favorites'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useRecentStore } from '../../logic/store/recent'
import { useSettingsStore } from '../../logic/store/settings'

const VIEWS: Array<{ value: ArtView; label: string }> = [
  { value: 'hero', label: 'Principal' },
  { value: 'solo', label: 'Producto' },
  { value: 'abierto', label: 'Abierto' },
  { value: 'detalle', label: 'Detalle' },
]

export const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const settings = useSettingsStore((state) => state.settings)
  const add = useCartStore((state) => state.add)
  const lines = useCartStore((state) => state.lines)
  const favorite = useFavoritesStore((state) => state.ids.includes(products.find((p) => p.slug === slug)?.id ?? ''))
  const toggleFavorite = useFavoritesStore((state) => state.toggle)
  const recentIds = useRecentStore((state) => state.ids)
  const visit = useRecentStore((state) => state.visit)
  const { fly } = useFlyToCart()
  const { toast } = useToast()
  const tilt = useParallaxTilt()
  const [quantity, setQuantity] = useState(1)
  const [view, setView] = useState<ArtView>('hero')
  const [excluded, setExcluded] = useState<string[]>([])

  const product = products.find((item) =>
    item.slug === slug && item.publicado && !item.archivado)
  const available = product ? getAvailable(product, orders) : 0
  const { status, label } = getStoreStatus(available)
  const soldOut = available <= 0
  const savings = product && product.precioAnterior !== null
    ? Math.max(0, product.precioAnterior - (product.precio ?? 0))
    : 0
  const estimate = useMemo(
    () => estimarEntrega({ tipo: 'retiro' }, settings), [settings],
  )
  const secondary = product ? formatSecondary(product.precio ?? 0, settings) : null
  const together = useMemo(
    () => product ? boughtTogether(product, orders, products, 3) : [],
    [product, orders, products],
  )
  const selected = together.filter((item) => !excluded.includes(item.id))
  const bundleTotal = (product?.precio ?? 0) * quantity
    + selected.reduce((sum, item) => sum + (item.precio ?? 0), 0)
  const related = useMemo(
    () => product ? relatedProducts(product, products, 4) : [], [product, products],
  )
  const recent = useMemo(
    () => recentlyViewed(recentIds.filter((id) => id !== product?.id), products, 4),
    [recentIds, products, product?.id],
  )
  const line = product ? lines.find((item) => item.productoId === product.id) : undefined

  useEffect(() => {
    setQuantity(1)
    setView('hero')
    setExcluded([])
    if (product) visit(product.id)
  }, [product?.id, visit])

  const onAdd = (event: MouseEvent<HTMLButtonElement>, extra?: typeof together) => {
    if (!product || soldOut) return
    add(product.id, Math.min(quantity, available), product.precio ?? undefined)
    for (const item of extra ?? []) {
      if (item.precio !== null) add(item.id, 1, item.precio)
    }
    fly(event.currentTarget.getBoundingClientRect(), product.id)
    toast(extra?.length ? 'Conjunto agregado al carrito' : 'Agregado al carrito')
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

  const addButton = (className = '') => (
    <Button full disabled={soldOut} className={className} onClick={onAdd}>
      <ShoppingBag size={18} strokeWidth={1.5} aria-hidden="true" />
      {soldOut ? 'Agotado' : 'Agregar al carrito'}
    </Button>
  )

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
              <ArtZoom
                product={product}
                view={view}
                layoutId={`product-art-${product.id}`}
              />
            </motion.div>
          </div>
          <div className="pdp-views" role="tablist" aria-label="Vistas del producto">
            {VIEWS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={view === item.value}
                className={`pdp-view${view === item.value ? ' is-active' : ''}`}
                onClick={() => setView(item.value)}
              >
                <ProductArt product={product} size={72} view={item.value} />
                <span className="t-min">{item.label}</span>
              </button>
            ))}
          </div>
          <p className="pdp-gallery__note t-min">
            Ilustración generada · pasa el cursor para ampliar
          </p>
        </div>

        <div className="pdp-info">
          <div className="pdp-buy-panel card">
            <p className="pdp-info__category t-min t-clay">{product.categoria}</p>
            <h1 className="t-detail-title pdp-info__title">{product.nombre}</h1>
            <div className="pdp-info__meta">
              <span className="code">{product.codigo}</span>
              <span aria-hidden="true">·</span>
              <span>{product.unidad}</span>
            </div>

            <div className="pdp-prices">
              <span className="pdp-prices__main price">{formatMoney(product.precio ?? 0, settings.moneda.codigo)}</span>
              {product.precioAnterior !== null && product.precioAnterior > (product.precio ?? 0) && (
                <s className="pdp-prices__old t-caption">
                  {formatMoney(product.precioAnterior, settings.moneda.codigo)}
                </s>
              )}
              {savings > 0 && (
                <span className="pdp-prices__savings t-min t-primary">Ahorras {formatMoney(savings, settings.moneda.codigo)}</span>
              )}
            </div>
            {secondary && <p className="t-min t-muted">{secondary}</p>}

            <div className="pdp-info__status">
              <StatusDot status={status} label={label} />
              {line && <span className="t-min t-muted">· {line.cantidad} en tu carrito</span>}
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
              {addButton()}
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

            <div className="pdp-delivery">
              <p className="t-mid t-strong">{estimate.titulo}</p>
              <p className="t-caption t-muted">{estimate.detalle}</p>
              <p className="t-min t-muted">Estimación de demostración, no un plazo garantizado.</p>
            </div>

            <p className="pdp-note t-min">
              <ShieldCheck size={16} strokeWidth={1.5} aria-hidden="true" />
              Compra segura de demostración. No se realiza ningún cobro real.
            </p>
          </div>

          <Reveal className="pdp-content" as="div">
            {product.descripcion && (
              <section className="pdp-section" aria-labelledby="pdp-descripcion-title">
                <h2 id="pdp-descripcion-title" className="t-ui t-strong">Descripción</h2>
                <p className="pdp-description t-body">{product.descripcion}</p>
              </section>
            )}

            {product.especificaciones.length > 0 && (
              <section className="pdp-section" aria-labelledby="pdp-specs-title">
                <h2 id="pdp-specs-title" className="t-ui t-strong">Especificaciones</h2>
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

            <section className="pdp-section" aria-labelledby="pdp-info-title">
              <h2 id="pdp-info-title" className="t-ui t-strong">Información del producto</h2>
              <table className="pdp-specs">
                <tbody>
                  <tr><th scope="row">Categoría</th><td>{product.categoria}</td></tr>
                  <tr><th scope="row">Código</th><td>{product.codigo}</td></tr>
                  <tr><th scope="row">Presentación</th><td>{product.unidad}</td></tr>
                  {product.proveedor && <tr><th scope="row">Proveedor</th><td>{product.proveedor}</td></tr>}
                </tbody>
              </table>
            </section>
          </Reveal>
        </div>
      </div>

      {together.length > 0 && !soldOut && (
        <Reveal as="section" className="pdp-bundle" aria-label="Comprados juntos">
          <header className="pdp-related__head">
            <h2 className="t-section">Comprados juntos</h2>
            <span className="t-caption t-muted">Agrega el conjunto en un solo paso</span>
          </header>
          <div className="pdp-bundle__body card">
            <ul className="pdp-bundle__list">
              <li className="pdp-bundle__item is-main">
                <ProductArt product={product} size={72} view="solo" />
                <span className="t-caption t-strong">{product.nombre}</span>
                <span className="t-caption price">{formatMoney(product.precio ?? 0, settings.moneda.codigo)}</span>
              </li>
              {together.map((item) => {
                const active = !excluded.includes(item.id)
                return (
                  <li key={item.id} className={`pdp-bundle__item${active ? '' : ' is-off'}`}>
                    <button
                      type="button"
                      className="pdp-bundle__toggle"
                      aria-pressed={active}
                      aria-label={`${active ? 'Quitar' : 'Incluir'} ${item.nombre} del conjunto`}
                      onClick={() => setExcluded((current) => active
                        ? [...current, item.id] : current.filter((id) => id !== item.id))}
                    >
                      {active ? <Check size={15} strokeWidth={2} aria-hidden="true" /> : null}
                    </button>
                    <Link to={`/tienda/${item.slug}`}>
                      <ProductArt product={item} size={64} view="solo" />
                      <span className="t-caption">{item.nombre}</span>
                    </Link>
                    <span className="t-caption price">{formatMoney(item.precio ?? 0, settings.moneda.codigo)}</span>
                  </li>
                )
              })}
            </ul>
            <div className="pdp-bundle__foot">
              <div>
                <span className="t-min t-muted">Total del conjunto</span>
                <p className="price t-strong">{formatMoney(bundleTotal, settings.moneda.codigo)}</p>
              </div>
              <Button onClick={(event) => onAdd(event, selected)}>
                <ShoppingBag size={17} strokeWidth={1.5} aria-hidden="true" />
                Agregar conjunto
              </Button>
            </div>
          </div>
        </Reveal>
      )}

      {related.length > 0 && (
        <Reveal as="section" className="pdp-related" aria-labelledby="pdp-related-title">
          <header className="pdp-related__head">
            <h2 id="pdp-related-title" className="t-section">También te puede gustar</h2>
            <Link className="pdp-related__all t-mid" to={`/tienda?cat=${encodeURIComponent(product.categoria)}`}>
              Ver categoría
            </Link>
          </header>
          <div className="pdp-related__grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} available={getAvailable(item, orders)} />
            ))}
          </div>
        </Reveal>
      )}

      {recent.length > 0 && (
        <section className="pdp-recent" aria-label="Vistos recientemente">
          <h2 className="t-section">Vistos recientemente</h2>
          <div className="pdp-recent__rail">
            {recent.map((item) => (
              <Link key={item.id} className="pdp-recent__item" to={`/tienda/${item.slug}`}>
                <ProductArt product={item} size={80} view="solo" />
                <span className="t-min">{item.nombre}</span>
                <span className="t-min price">{formatMoney(item.precio ?? 0, settings.moneda.codigo)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="pdp-mobile-bar">
        <div>
          <span className="t-min t-muted">Total</span>
          <p className="price t-strong">{formatMoney((product.precio ?? 0) * quantity, settings.moneda.codigo)}</p>
        </div>
        {addButton('pdp-mobile-bar__button')}
      </div>
    </div>
  )
}
