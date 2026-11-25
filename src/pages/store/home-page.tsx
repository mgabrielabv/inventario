import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, Headphones, Home as HomeIcon,
  LayoutGrid, Laptop, NotebookPen, PackageCheck, Pause, Play, RotateCcw, Search,
  ShoppingBag, Sparkles, Store, Tag, Truck, UserPlus, Wallet, type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { Link } from 'react-router-dom'
import { HomeRail, type HomeRailItem } from '../../components/store/HomeRail'
import { banners, type Banner } from '../../data/banners'
import { categoryTiles } from '../../logic/services/catalog'
import { getAvailable } from '../../logic/services/stock'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useRecentStore } from '../../logic/store/recent'
import { useSettingsStore } from '../../logic/store/settings'
import type { Product } from '../../logic/types'
import { bannerMotion, dur, ease } from '../../motion/tokens'

const BANNER_ICONS: Record<Banner['variante'], LucideIcon> = {
  primario: ShoppingBag,
  arcilla: Tag,
  arena: Sparkles,
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Electrónica': Laptop,
  'Accesorios': Headphones,
  'Papelería': NotebookPen,
  'Hogar': HomeIcon,
  'Otras': LayoutGrid,
  'Ofertas': Tag,
  'Novedades': Sparkles,
}

const STEPS: Array<{ icon: LucideIcon; titulo: string; texto: string }> = [
  {
    icon: Search,
    titulo: 'Elige lo que te gusta',
    texto: 'Explora, compara precios y agrega al carrito lo que quieres llevar.',
  },
  {
    icon: ShoppingBag,
    titulo: 'Confirma tus datos',
    texto: 'Dinos cómo quieres recibirlo y cómo prefieres pagar.',
  },
  {
    icon: PackageCheck,
    titulo: 'Recibe y sigue tu pedido',
    texto: 'Te avisamos cuando esté en camino o listo para retirar.',
  },
]

const ACCOUNT_BENEFITS: Array<{ icon: LucideIcon; texto: string }> = [
  { icon: Check, texto: 'Guarda tus direcciones y datos de contacto.' },
  { icon: RotateCcw, texto: 'Repite tus compras favoritas en dos toques.' },
  { icon: Clock3, texto: 'Revisa el avance de tus pedidos cuando quieras.' },
  { icon: Tag, texto: 'Entérate primero de las ofertas para ti.' },
]

const discount = (product: Product): number => {
  const before = product.precioAnterior
  if (before === null || before <= (product.precio ?? 0)) return 0
  return 1 - (product.precio ?? 0) / before
}

const HeroArt = ({ variante }: { variante: Banner['variante'] }) => {
  const Icon = BANNER_ICONS[variante]
  return (
    <div className="eshop-hero__art" aria-hidden="true">
      <svg viewBox="0 0 320 240" focusable="false">
        <circle className="eshop-hero__ring" cx="160" cy="120" r="96" />
        <circle className="eshop-hero__ring eshop-hero__ring--inner" cx="160" cy="120" r="68" />
        <path className="eshop-hero__line" d="M40 198h240M64 42h192" />
        <rect className="eshop-hero__tile" x="76" y="78" width="46" height="46" rx="12" />
        <rect className="eshop-hero__tile eshop-hero__tile--small" x="200" y="132" width="34" height="34" rx="9" />
      </svg>
      <span className="eshop-hero__glyph"><Icon size={92} strokeWidth={1.1} /></span>
      <span className="eshop-hero__chip">Compra fácil</span>
    </div>
  )
}

const PromoCarousel = () => {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion() === true
  const touchX = useRef<number | null>(null)
  const total = banners.length
  const active = banners[index] ?? banners[0]!

  const goTo = useCallback((position: number) => {
    setDirection(position >= index ? 1 : -1)
    setIndex(((position % total) + total) % total)
  }, [total, index])

  const move = useCallback((step: number) => {
    setDirection(step)
    setIndex((current) => ((current + step) % total + total) % total)
  }, [total])

  useEffect(() => {
    if (reduce || paused) return
    const timer = window.setInterval(() => move(1), bannerMotion.autoplay * 1000)
    return () => window.clearInterval(timer)
  }, [reduce, paused, move, index])

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchX.current = event.changedTouches[0]?.clientX ?? null
  }
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchX.current
    const end = event.changedTouches[0]?.clientX
    touchX.current = null
    if (start === null || end === undefined) return
    const delta = end - start
    if (Math.abs(delta) < bannerMotion.swipeDistance) return
    move(delta < 0 ? 1 : -1)
  }

  return (
    <section className="eshop-hero" aria-label="Promociones de la tienda" aria-roledescription="carrusel">
      <div
        className="eshop-hero__frame"
        aria-live="off"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          key={active.id}
          id={`eshop-hero-slide-${active.id}`}
          className={`eshop-hero__slide eshop-hero__slide--${active.variante}`}
          role="group"
          aria-roledescription="diapositiva"
          aria-label={`${index + 1} de ${total}: ${active.titulo}`}
        >
          <motion.div
            className="eshop-hero__copy"
            initial={reduce ? undefined : { x: direction * bannerMotion.textShift, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: dur.slow, ease: ease.easeOutQuint }}
          >
            <p className="eshop-hero__eyebrow">Selección para ti</p>
            <h1 className="eshop-hero__title">{active.titulo}</h1>
            <p className="eshop-hero__subtitle">{active.subtitulo}</p>
            <Link className="eshop-hero__cta" to={active.ruta}>
              {active.cta}
              <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </motion.div>
          <motion.div
            className="eshop-hero__art-layer"
            initial={reduce ? undefined : { x: direction * bannerMotion.artShift, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: dur.slow, ease: ease.easeOutQuint }}
          >
            <HeroArt variante={active.variante} />
          </motion.div>
        </div>

        <div className="eshop-hero__controls">
          <div className="eshop-hero__dots" role="group" aria-label="Elegir promoción">
            {banners.map((banner, position) => (
              <button
                type="button"
                key={banner.id}
                className="eshop-hero__dot"
                aria-label={`Promoción ${position + 1}: ${banner.titulo}`}
                aria-current={position === index ? 'true' : undefined}
                aria-controls={`eshop-hero-slide-${banner.id}`}
                onClick={() => goTo(position)}
              />
            ))}
          </div>
          {!reduce && (
            <div className="eshop-hero__progress" aria-hidden="true">
              <span key={`${active.id}-${paused}`} className={paused ? 'is-paused' : ''} />
            </div>
          )}
          <div className="eshop-hero__controls-right">
            {!reduce && (
              <button
                type="button"
                className="eshop-hero__pause"
                aria-pressed={paused}
                aria-label={paused ? 'Reanudar rotación de promociones' : 'Pausar rotación de promociones'}
                onClick={() => setPaused((value) => !value)}
              >
                {paused
                  ? <Play size={15} strokeWidth={1.8} aria-hidden="true" />
                  : <Pause size={15} strokeWidth={1.8} aria-hidden="true" />}
                <span>{paused ? 'Reanudar' : 'Pausar'}</span>
              </button>
            )}
            <div className="eshop-hero__arrows">
              <button
                type="button"
                className="eshop-hero__arrow"
                aria-label="Promoción anterior"
                aria-controls={`eshop-hero-slide-${active.id}`}
                onClick={() => move(-1)}
              >
                <ChevronLeft size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="eshop-hero__arrow"
                aria-label="Promoción siguiente"
                aria-controls={`eshop-hero-slide-${active.id}`}
                onClick={() => move(1)}
              >
                <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const HomePage = () => {
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const entrega = useSettingsStore((state) => state.settings.entrega)
  const pagos = useSettingsStore((state) => state.settings.pagos)
  const configuredCategories = useSettingsStore((state) => state.settings.catalogo.categorias)
  const recentIds = useRecentStore((state) => state.ids)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 280)
    return () => window.clearTimeout(timer)
  }, [])

  const benefits = useMemo(() => {
    const result: Array<{ id: string; icon: LucideIcon; titulo: string; detalle: string }> = []
    if (entrega.delivery) {
      result.push({
        id: 'delivery', icon: Truck, titulo: 'Delivery a domicilio',
        detalle: 'Recíbelo en la puerta de tu casa.',
      })
    }
    if (entrega.retiro) {
      result.push({
        id: 'retiro', icon: Store, titulo: 'Retiro en tienda',
        detalle: 'Pásalo a buscar cuando te convenga.',
      })
    }
    const methods = [
      pagos.movil && 'móvil',
      pagos.transferencia && 'transferencia',
      pagos.efectivo && 'efectivo',
    ].filter((method): method is string => Boolean(method))
    if (methods.length > 0) {
      result.push({
        id: 'pagos', icon: Wallet, titulo: 'Paga como quieras',
        detalle: methods.join(', '),
      })
    }
    result.push({
      id: 'seguimiento', icon: PackageCheck, titulo: 'Sigue tu pedido',
      detalle: 'Consulta el avance cuando quieras.',
    })
    return result
  }, [entrega, pagos])

  const items = useMemo<HomeRailItem[]>(() => products
    .filter((product) => product.publicado && !product.archivado && product.precio !== null)
    .map((product) => ({ product, available: getAvailable(product, orders) })),
  [products, orders])

  const categories = useMemo(() => {
    const tiles = new Map(categoryTiles(products).map((tile) => [tile.categoria, tile.total]))
    const byCategory = new Map<string, number>()
    for (const item of items) {
      if (item.available > 0) {
        byCategory.set(item.product.categoria, (byCategory.get(item.product.categoria) ?? 0) + 1)
      }
    }
    const names = [...new Set([...configuredCategories, ...tiles.keys()])]
    return names.map((nombre) => ({
      nombre,
      total: tiles.get(nombre) ?? 0,
      disponibles: byCategory.get(nombre) ?? 0,
      icon: CATEGORY_ICONS[nombre] ?? LayoutGrid,
    }))
  }, [configuredCategories, items, products])

  const sales = useMemo(() => {
    const counts = new Map<string, number>()
    for (const order of orders) {
      if (order.estado === 'Cancelado') continue
      for (const line of order.lineas) {
        counts.set(line.productoId, (counts.get(line.productoId) ?? 0) + line.cantidad)
      }
    }
    return counts
  }, [orders])

  const ofertas = useMemo(() => items
    .filter(({ product }) => discount(product) > 0)
    .sort((a, b) => discount(b.product) - discount(a.product))
    .slice(0, 8), [items])

  const masVendidos = useMemo(() => {
    const candidates = [...items].sort((a, b) =>
      (sales.get(b.product.id) ?? 0) - (sales.get(a.product.id) ?? 0)
      || a.product.nombre.localeCompare(b.product.nombre, 'es'))
    const source = sales.size === 0
      ? candidates.filter(({ product }) => product.destacado)
      : candidates
    return source.slice(0, 8)
  }, [items, sales])

  const novedades = useMemo(() => [...items]
    .sort((a, b) => b.product.creadoEn.localeCompare(a.product.creadoEn))
    .slice(0, 8), [items])

  const recientes = useMemo(() => {
    const byId = new Map(items.map((item) => [item.product.id, item]))
    return recentIds
      .map((id) => byId.get(id))
      .filter((item): item is HomeRailItem => item !== undefined)
      .slice(0, 8)
  }, [items, recentIds])

  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of products) {
      if (!product.publicado || product.archivado) continue
      for (const tag of product.etiquetas) {
        const label = tag.trim()
        if (label) counts.set(label, (counts.get(label) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
      .slice(0, 12)
      .map(([label]) => label)
  }, [products])

  return (
    <main className="eshop-home">
      <div className="eshop-wrap">
        <PromoCarousel />

        <section className="eshop-benefits" aria-label="Ventajas de comprar aquí">
          <ul className="eshop-benefits__grid">
            {benefits.map(({ id, icon: Icon, titulo, detalle }) => (
              <li className="eshop-benefit" key={id}>
                <span className="eshop-benefit__icon">
                  <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="eshop-benefit__text">
                  <span className="eshop-benefit__title">{titulo}</span>
                  <span className="eshop-benefit__detail">{detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="eshop-categories" aria-labelledby="eshop-categories-title">
          <header className="eshop-section__head">
            <div>
              <p className="eshop-section__eyebrow">Explora</p>
              <h2 className="eshop-section__title" id="eshop-categories-title">Compra por categoría</h2>
              <p className="eshop-section__subtitle">Encuentra lo que buscas sin dar tantas vueltas.</p>
            </div>
            <Link className="eshop-section__link" to="/tienda">
              Ver todo el catálogo <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </header>
          <ul className="eshop-categories__grid">
            {categories.map(({ nombre, total, disponibles, icon: Icon }) => {
              const query = new URLSearchParams({ categoria: nombre, cat: nombre })
              return (
                <li key={nombre}>
                  <Link className="eshop-category" to={`/tienda?${query.toString()}`}>
                    <span className="eshop-category__icon">
                      <Icon size={24} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <span className="eshop-category__name">{nombre}</span>
                    <span className="eshop-category__count">
                      {disponibles > 0
                        ? `${disponibles} ${disponibles === 1 ? 'disponible' : 'disponibles'}`
                        : `${total} ${total === 1 ? 'producto' : 'productos'}`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="eshop-rails">
          <HomeRail
            id="eshop-ofertas"
            titulo="Ofertas del día"
            descripcion="Precios especiales para decidirte hoy."
            items={ofertas}
            cargando={!ready}
            vacio="Pronto habrá ofertas para ti."
            verTodo={{ label: 'Ver catálogo', to: '/tienda?orden=precio-asc' }}
          />
          <HomeRail
            id="eshop-vendidos"
            titulo="Los más vendidos"
            descripcion="Los favoritos de quienes ya compraron."
            items={masVendidos}
            cargando={!ready}
            verTodo={{ label: 'Ver destacados', to: '/tienda?orden=destacados' }}
          />
          <HomeRail
            id="eshop-novedades"
            titulo="Novedades"
            descripcion="Lo último que llegó a la tienda."
            items={novedades}
            cargando={!ready}
            verTodo={{ label: 'Ver novedades', to: '/tienda?orden=recientes' }}
          />
          <HomeRail
            id="eshop-recientes"
            titulo="Vistos recientemente"
            descripcion="Retoma donde lo dejaste."
            items={recientes}
            cargando={!ready}
            vacio="Cuando explores productos, aparecerán aquí."
          />
        </div>

        <section className="eshop-register" aria-labelledby="eshop-register-title">
          <div className="eshop-register__intro">
            <span className="eshop-register__icon">
              <UserPlus size={24} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="eshop-register__title" id="eshop-register-title">Haz tu cuenta y compra más rápido</h2>
            <p className="eshop-register__text">
              Es gratis y te ahorra pasos en cada compra.
            </p>
            <ul className="eshop-register__list">
              {ACCOUNT_BENEFITS.map(({ icon: Icon, texto }) => (
                <li className="eshop-register__item" key={texto}>
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="eshop-register__actions">
            <Link className="eshop-register__button eshop-register__button--primary" to="/cuenta/registro">
              Crear cuenta <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <Link className="eshop-register__button eshop-register__button--secondary" to="/cuenta/ingresar">
              Ya tengo cuenta
            </Link>
            <p className="eshop-register__note">También puedes seguir tu pedido sin iniciar sesión.</p>
          </div>
        </section>

        <section className="eshop-tags" aria-labelledby="eshop-tags-title">
          <header className="eshop-section__head">
            <div>
              <p className="eshop-section__eyebrow">Populares</p>
              <h2 className="eshop-section__title" id="eshop-tags-title">Etiquetas que te pueden gustar</h2>
            </div>
          </header>
          <ul className="eshop-tags__list">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  className="eshop-tag"
                  to={`/tienda?q=${encodeURIComponent(tag)}`}
                >
                  <span className="eshop-tag__mark" aria-hidden="true">#</span>
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="eshop-steps" aria-labelledby="eshop-steps-title">
          <header className="eshop-section__head">
            <div>
              <p className="eshop-section__eyebrow">Fácil y rápido</p>
              <h2 className="eshop-section__title" id="eshop-steps-title">¿Cómo comprar?</h2>
            </div>
          </header>
          <ol className="eshop-steps__grid">
            {STEPS.map(({ icon: Icon, titulo, texto }, position) => (
              <li className="eshop-step" key={titulo}>
                <span className="eshop-step__number">{`0${position + 1}`}</span>
                <span className="eshop-step__icon">
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <h3 className="eshop-step__title">{titulo}</h3>
                <p className="eshop-step__text">{texto}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}
