import { AnimatePresence } from 'framer-motion'
import { ArrowRight, PackageCheck, ShieldCheck, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../../components/store/ProductCard'
import { CartLineItem } from '../../components/store/CartLineItem'
import { CartSummary } from '../../components/store/CartSummary'
import { EmptyState } from '../../components/ui/EmptyState'
import { validateCart } from '../../logic/services/cart'
import { cartRecommendations } from '../../logic/services/recommendations'
import { getAvailable } from '../../logic/services/stock'
import { useCartStore } from '../../logic/store/cart'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'

const HIGHLIGHTS = [
  { icon: Wallet, title: 'Sin cobros reales', text: 'La compra es una demostración: no se procesa ningún pago.' },
  { icon: PackageCheck, title: 'Disponibilidad al momento', text: 'Mostramos el stock calculado con los pedidos activos.' },
  { icon: ShieldCheck, title: 'Puedes volver atrás', text: 'Quita un producto y deshaz la acción, o guárdalo para después.' },
]

export const CartPage = () => {
  const lines = useCartStore((state) => state.lines)
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const settings = useSettingsStore((state) => state.settings)
  const active = lines.filter((line) => !line.guardado)
  const saved = lines.filter((line) => line.guardado)
  const issues = useMemo(() => validateCart(active, products, orders), [active, products, orders])
  const suggestions = useMemo(
    () => cartRecommendations(lines, products, 4), [lines, products],
  )
  const featured = useMemo(
    () => products.filter((product) => product.publicado && !product.archivado
      && product.destacado && product.precio !== null).slice(0, 4), [products],
  )

  const rows = (list: typeof lines) => list.flatMap((line) => {
    const product = products.find((item) => item.id === line.productoId)
    if (!product) return []
    return [{ line, product, available: getAvailable(product, orders) }]
  })

  return (
    <div className="cart-page container-store">
      <header className="cart-page__head">
        <p className="cart-page__eyebrow t-min t-clay">Tu selección</p>
        <h1 className="t-catalog">Tu carrito</h1>
        <p className="t-subtitle">
          Revisa los productos, guarda lo que no necesitas ahora y continúa cuando quieras.
        </p>
      </header>

      {active.length === 0 && saved.length === 0 ? (
        <div className="cart-page__empty">
          <EmptyState
            title="Tu carrito está vacío"
            description="Cuando elijas productos, aparecerán aquí junto a su disponibilidad."
            action={<Link className="btn btn--primary" to="/tienda">Explorar el catálogo</Link>}
          />
          <div className="cart-highlights" aria-label="Qué esperar de tu compra">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="cart-highlight card">
                <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                <h2 className="t-mid t-strong">{title}</h2>
                <p className="t-caption t-muted">{text}</p>
              </div>
            ))}
          </div>
          {featured.length > 0 && (
            <section className="cart-page__featured" aria-label="Productos destacados">
              <h2 className="t-section">Para empezar</h2>
              <div className="cart-page__featured-grid">
                {featured.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    available={getAvailable(product, orders)}
                    compact
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="cart-page__layout">
          <div className="cart-main">
            <section className="card cart-main__panel" aria-label="Productos en el carrito">
              <header className="cart-main__head">
                <h2 className="t-ui t-strong">Productos</h2>
                <span className="t-caption t-muted">{active.length} {active.length === 1 ? 'línea' : 'líneas'}</span>
              </header>
              {active.length > 0 ? (
                <ul className="cart-lines">
                  <AnimatePresence initial={false} mode="popLayout">
                    {rows(active).map(({ line, product, available }) => (
                      <CartLineItem
                        key={line.productoId}
                        line={line}
                        product={product}
                        available={available}
                        issue={issues.find((item) => item.productoId === line.productoId)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              ) : (
                <p className="t-caption t-muted">Tu carrito está vacío. Guardamos estos productos para después.</p>
              )}
            </section>

            {saved.length > 0 && (
              <section className="card cart-main__panel" aria-label="Guardados para después">
                <header className="cart-main__head">
                  <h2 className="t-ui t-strong">Guardados para después</h2>
                  <span className="t-caption t-muted">{saved.length} {saved.length === 1 ? 'producto' : 'productos'}</span>
                </header>
                <ul className="cart-lines">
                  {rows(saved).map(({ line, product, available }) => (
                    <CartLineItem
                      key={line.productoId}
                      line={line}
                      product={product}
                      available={available}
                      saved
                    />
                  ))}
                </ul>
              </section>
            )}

            {suggestions.length > 0 && (
              <section className="cart-main__suggestions" aria-label="Sugerencias para tu carrito">
                <header className="cart-main__head">
                  <h2 className="t-ui t-strong">También puede interesarte</h2>
                  <Link className="t-caption cart-main__all" to="/tienda">
                    Ver catálogo <ArrowRight size={15} strokeWidth={1.6} aria-hidden="true" />
                  </Link>
                </header>
                <div className="cart-page__featured-grid">
                  {suggestions.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      available={getAvailable(product, orders)}
                      compact
                    />
                  ))}
                </div>
              </section>
            )}

            <p className="cart-page__note t-caption">
              Las unidades se apartan al confirmar el pedido. Hasta entonces la disponibilidad puede cambiar.
              Entrega: {settings.tienda.direccion}.
            </p>
          </div>

          <CartSummary />
        </div>
      )}
    </div>
  )
}
