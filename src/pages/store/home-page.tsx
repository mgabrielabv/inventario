import { motion, useReducedMotion, useTransform } from 'framer-motion'
import { ArrowRight, PackageCheck, Search, ShoppingBag } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BoxStack } from '../../components/box/BoxStack'
import { ProductCard } from '../../components/store/ProductCard'
import { MeshBackground } from '../../motion/components/MeshBackground'
import { Reveal } from '../../motion/components/Reveal'
import { WordReveal } from '../../motion/components/WordReveal'
import { useParallaxTilt } from '../../motion/hooks/useParallaxTilt'
import { useScrollProgress } from '../../motion/hooks/useScrollProgress'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import { getAvailable } from '../../logic/services/stock'

const steps = [
  {
    icon: Search,
    title: 'Explora el catálogo',
    text: 'Compara precios, detalles y disponibilidad de cada producto.',
  },
  {
    icon: ShoppingBag,
    title: 'Confirma tu pedido',
    text: 'Completa tus datos y elige cómo quieres recibirlo.',
  },
  {
    icon: PackageCheck,
    title: 'Sigue cada paso',
    text: 'Consulta el estado con el código que recibes al confirmar.',
  },
]

export const HomePage = () => {
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const categories = useSettingsStore((state) => state.settings.catalogo.categorias)
  const reduce = useReducedMotion()
  const tilt = useParallaxTilt()
  const { ref: statementRef, progress } = useScrollProgress()
  const statementOpacity = useTransform(progress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4])
  const statementScale = useTransform(progress, [0, 0.5, 1], [0.97, 1, 1.02])

  const featured = useMemo(() =>
    products.filter((product) =>
      product.publicado && !product.archivado && product.destacado).slice(0, 4),
  [products])

  const visibleCategories = useMemo(() => {
    const fromProducts = products
      .filter((product) => product.publicado && !product.archivado)
      .map((product) => product.categoria)
    return [...new Set([...categories, ...fromProducts])].slice(0, 8)
  }, [products, categories])

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <MeshBackground />
        <div className="container-store home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-hero__eyebrow t-min t-clay">Tienda de demostración</p>
            <div id="home-hero-title">
              <WordReveal
                text="Todo en su lugar"
                className="t-hero home-hero__title"
                as="h1"
              />
            </div>
            <p className="t-subtitle home-hero__subtitle">
              Productos claros, precios sencillos y un pedido que puedes seguir cuando quieras.
            </p>
            <div className="home-hero__actions">
              <Link className="btn btn--primary" to="/tienda">
                Ver catálogo <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
              </Link>
              <Link className="btn btn--secondary" to="/seguimiento">Seguir un pedido</Link>
            </div>
            <p className="home-hero__note t-min">Compra simulada. No se realiza ningún cobro.</p>
          </div>

          <div className="home-hero__visual">
            <div className="home-hero__stage">
              <motion.div
                ref={tilt.ref}
                className="home-hero__tilt"
                style={tilt.style}
                onPointerMove={tilt.onPointerMove}
                onPointerLeave={tilt.onPointerLeave}
              >
                <BoxStack size={340} />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-statement section-store" aria-label="Nuestra propuesta">
        <div ref={statementRef}>
          <motion.div
            className="container-store home-statement__inner"
            style={reduce ? undefined : { opacity: statementOpacity, scale: statementScale }}
          >
            <p className="t-min t-clay">Inventario sin ruido</p>
            <p className="t-statement home-statement__text">
              Cada caja cuenta. Saber qué hay, cuánto cuesta y cuándo llega debería ser simple.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="home-featured section-store" aria-labelledby="home-featured-title">
        <div className="container-store">
          <header className="home-featured__head">
            <div>
              <p className="t-min t-clay">Selección</p>
              <h2 id="home-featured-title" className="t-section">Destacados</h2>
            </div>
            <Link className="home-featured__all t-mid" to="/tienda">
              Ver todo <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </header>

          {featured.length > 0 ? (
            <Reveal className="home-grid" as="div">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  available={getAvailable(product, orders)}
                />
              ))}
            </Reveal>
          ) : (
            <p className="t-caption home-featured__empty">Pronto tendremos novedades aquí.</p>
          )}
        </div>
      </section>

      <section className="home-categories section-store" aria-labelledby="home-categories-title">
        <div className="container-store">
          <header className="home-categories__head">
            <h2 id="home-categories-title" className="t-section">Categorías</h2>
            <p className="t-caption">Encuentra lo que necesitas por tipo de producto.</p>
          </header>
          <ul className="home-categories__list">
            <li><Link className="home-category" to="/tienda">Todo</Link></li>
            {visibleCategories.map((category) => (
              <li key={category}>
                <Link
                  className="home-category"
                  to={`/tienda?cat=${encodeURIComponent(category)}`}
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="home-steps section-store" aria-labelledby="home-steps-title">
        <div className="container-store">
          <h2 id="home-steps-title" className="t-section home-steps__title">Cómo funciona</h2>
          <Reveal className="home-steps__grid" as="ol">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li className="home-step" key={title}>
                <span className="home-step__number t-min">{`0${index + 1}`}</span>
                <span className="home-step__icon"><Icon size={24} strokeWidth={1.4} aria-hidden="true" /></span>
                <h3 className="t-ui t-strong">{title}</h3>
                <p className="t-caption">{text}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>
    </div>
  )
}
