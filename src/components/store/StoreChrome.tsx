import { AnimatePresence, motion, useReducedMotion, useScroll } from 'framer-motion'
import {
  ArrowRight, Heart, Menu, Search, ShoppingBag, X,
} from 'lucide-react'
import {
  useEffect, useMemo, useRef, useState,
} from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CartLineItem } from './CartLineItem'
import { CartPopover } from './CartPopover'
import { CartSummary } from './CartSummary'
import { useCartStore } from '../../logic/store/cart'
import { useFavoritesStore } from '../../logic/store/favorites'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import { storeName } from '../../logic/services/formatters'
import { cartCount, validateCart } from '../../logic/services/cart'
import { getAvailable } from '../../logic/services/stock'
import { formatMoney } from '../../logic/services/pricing'
import { ProductBox } from '../box/ProductBox'
import { BoxMark } from '../box/OpenBox'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { RollingNumber } from '../../motion/components/RollingNumber'
import { useCartBump, useFlyToCart } from '../../motion/hooks/useFlyToCart'
import { ThemeToggle } from '../ui/ThemeToggle'
import { riseItem } from '../../motion/variants'
import { dur, ease, overlayUI, stagger } from '../../motion/tokens'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/tienda', label: 'Catálogo', end: false },
  { to: '/seguimiento', label: 'Seguimiento', end: false },
]

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)')
    const sync = () => setMobile(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  return mobile
}

/* ----------------------------------- Nav -------------------------------- */
export const StoreNav = () => {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { scrollY } = useScroll()
  const { setCartTarget, bump } = useFlyToCart()
  const cartRef = useRef<HTMLButtonElement | null>(null)
  const units = useCartStore((state) => cartCount(state.lines))
  const prune = useCartStore((state) => state.prune)
  const products = useInventoryStore((state) => state.products)
  const favoriteCount = useFavoritesStore((state) => state.ids.length)
  const cartBump = useCartBump(bump)
  const settings = useSettingsStore((state) => state.settings)

  useEffect(() => {
    return scrollY.on('change', (value) => setScrolled(value > 8))
  }, [scrollY])

  useEffect(() => { setCartTarget(cartRef.current) }, [setCartTarget])
  useEffect(() => { prune(products) }, [products, prune])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'))
      if (event.key === '/' && !typing) {
        event.preventDefault()
        setSearchOpen(true)
      }
      if ((event.key === 'c' || event.key === 'C') && !typing
        && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        setCartOpen(true)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className={`store-nav glass${scrolled ? ' is-scrolled' : ''}`}>
        <div className="store-nav__inner">
          <Link to="/" className="brand" aria-label={`${storeName(settings)} — inicio`}>
            <BoxMark size={22} />
            <span>{storeName(settings)}</span>
          </Link>
          <nav className="store-nav__links" aria-label="Navegación principal">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}
                className={({ isActive }) => `store-nav__link${isActive ? ' is-active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="store-nav__actions">
            <button type="button" className="icon-btn" aria-label="Buscar" onClick={() => setSearchOpen(true)}>
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link to="/favoritos" className="icon-btn" aria-label="Favoritos">
              <Heart size={20} strokeWidth={1.5} />
              {favoriteCount > 0 && <span className="icon-dot" aria-hidden="true" />}
            </Link>
            <motion.button
              ref={cartRef} type="button" className="icon-btn cart-icon"
              aria-label={`Abrir carrito, ${units} unidades`}
              title="Carrito (C)"
              animate={cartBump.animate} key={cartBump.key}
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {units > 0 && <span className="cart-count"><RollingNumber value={units} /></span>}
            </motion.button>
            <ThemeToggle />
            <button type="button" className="icon-btn store-nav__menu" aria-label="Abrir menú"
              onClick={() => setMenuOpen(true)}>
              <Menu size={21} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSearch={() => setSearchOpen(true)} />
      <CartPopover />
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

/* ------------------------------ Mobile menu ------------------------------ */
const MobileMenu = ({ open, onClose, onSearch }: {
  open: boolean; onClose: () => void; onSearch: () => void
}) => {
  const reduce = useReducedMotion()
  const items = [...links, { to: '/favoritos', label: 'Favoritos', end: false }, { to: '/carrito', label: 'Carrito', end: false }]
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="mobile-menu glass"
          initial={{ opacity: 0, y: -overlayUI.offsetY }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -overlayUI.offsetY }} transition={{ duration: dur.base, ease: ease.out }}>
          <div className="mobile-menu__head">
            <span className="brand"><BoxMark size={22} /><span>Inventario</span></span>
            <button type="button" className="icon-btn" aria-label="Cerrar menú" onClick={onClose}><X size={20} /></button>
          </div>
          <motion.nav className="mobile-menu__links" initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: stagger.base } } }}>
            {items.map((item) => (
              <motion.div key={item.to} variants={riseItem}>
                <NavLink to={item.to} end={item.end} onClick={onClose} className="mobile-menu__link">
                  {item.label}<ArrowRight size={18} strokeWidth={1.5} />
                </NavLink>
              </motion.div>
            ))}
          </motion.nav>
          <button type="button" className="btn btn--secondary" onClick={() => { onClose(); onSearch() }} disabled={Boolean(reduce)}>
            Buscar en el catálogo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------------------------- Buscador overlay --------------------------- */
const SearchOverlay = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const reduce = useReducedMotion()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products.filter((p) => p.destacado && p.publicado).slice(0, 6)
    return products.filter((p) => p.publicado && !p.archivado &&
      `${p.nombre} ${p.codigo} ${p.etiquetas.join(' ')}`.toLowerCase().includes(q)).slice(0, 8)
  }, [query, products])

  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), overlayUI.focusDelay)
    else setQuery('')
  }, [open])

  const go = (slug: string) => { onClose(); navigate(`/tienda/${slug}`) }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="search-overlay" role="dialog" aria-modal="true" aria-label="Buscar productos"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: dur.base, ease: ease.out }} onClick={onClose}>
          <motion.div className="search-overlay__panel glass" onClick={(event) => event.stopPropagation()}
            initial={{
              y: reduce ? 0 : -overlayUI.panelOffsetY,
              scale: reduce ? 1 : overlayUI.panelScale,
            }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: dur.base, ease: ease.out }}>
            <div className="search-overlay__field">
              <Search size={22} strokeWidth={1.5} />
              <input ref={input} value={query} placeholder="Busca por nombre, código o etiqueta"
                aria-label="Buscar" onChange={(event) => { setQuery(event.target.value); setActive(0) }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') onClose()
                  if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)) }
                  if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
                  if (event.key === 'Enter' && results[active]) go(results[active]!.slug)
                }} />
              <button type="button" className="icon-btn" aria-label="Cerrar búsqueda" onClick={onClose}><X size={20} /></button>
            </div>
            <p className="t-caption search-overlay__hint">{query ? `${results.length} resultados` : 'Destacados'}</p>
            <motion.div className="search-overlay__results" initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: stagger.tight } } }}>
              {results.map((product, index) => (
                <motion.button key={product.id} type="button" className={`search-row${index === active ? ' is-active' : ''}`}
                  variants={riseItem} onMouseEnter={() => setActive(index)} onClick={() => go(product.slug)}>
                  {index === active && <motion.span layoutId="search-highlight" className="search-row__highlight" />}
                  <ProductBox categoria={product.categoria} codigo={product.codigo} nombre={product.nombre} size={44} />
                  <span className="grow">
                    <span className="t-mid">{product.nombre}</span>
                    <span className="t-caption code">{product.codigo}</span>
                  </span>
                  <span className="t-mid">{formatMoney(product.precio ?? 0)}</span>
                  <span className="t-caption">{getAvailable(product, orders) > 0 ? 'Disponible' : 'Agotado'}</span>
                </motion.button>
              ))}
              {results.length === 0 && <p className="t-caption search-overlay__empty">Sin resultados para “{query}”.</p>}
            </motion.div>
            <button type="button" className="search-overlay__all"
              onClick={() => { onClose(); navigate(`/tienda?q=${encodeURIComponent(query)}`) }}>
              Ver todos los resultados <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* -------------------------------- Carrito -------------------------------- */
export const CartSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const isMobile = useIsMobile()
  return (
    <Sheet open={open} onClose={onClose} title="Tu carrito" side={isMobile ? 'bottom' : 'right'}>
      <CartContent onClose={onClose} />
    </Sheet>
  )
}

export const CartContent = ({ onClose }: { onClose?: () => void }) => {
  const lines = useCartStore((state) => state.lines)
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const navigate = useNavigate()

  const active = lines.filter((line) => !line.guardado)
  const saved = lines.filter((line) => line.guardado)
  const issues = validateCart(active, products, orders)
  const rows = (list: typeof lines) => list.flatMap((line) => {
    const product = products.find((item) => item.id === line.productoId)
    if (!product) return []
    return [{ line, product, available: getAvailable(product, orders) }]
  })

  if (active.length === 0 && saved.length === 0) {
    return (
      <div className="cart-sheet">
        <div className="cart-sheet__empty">
          <p className="t-subtitle">Tu carrito está vacío</p>
          <p className="t-caption">Explora el catálogo y elige lo que necesitas.</p>
          <Button onClick={() => { onClose?.(); navigate('/tienda') }}>Ver catálogo</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-sheet">
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
                onNavigate={onClose}
              />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="t-caption t-muted">No hay productos en el carrito. Revisa los guardados para después.</p>
      )}

      {saved.length > 0 && (
        <section className="cart-sheet__saved" aria-label="Guardados para después">
          <h3 className="t-caption t-strong">Guardados para después</h3>
          <ul className="cart-lines">
            {rows(saved).map(({ line, product, available }) => (
              <CartLineItem
                key={line.productoId}
                line={line}
                product={product}
                available={available}
                saved
                onNavigate={onClose}
              />
            ))}
          </ul>
        </section>
      )}

      <CartSummary compact onNavigate={onClose} />
    </div>
  )
}

export const StoreFooter = () => {
  const settings = useSettingsStore((state) => state.settings)
  return (
    <footer className="store-footer hairline-top">
      <div className="container-store store-footer__grid">
        <div>
          <span className="brand"><BoxMark size={22} /><span>{storeName(settings)}</span></span>
          <p className="t-caption">{settings.tienda.direccion}</p>
          <p className="t-caption">{settings.tienda.horario}</p>
          <p className="t-caption">{settings.tienda.telefono}</p>
        </div>
        <div className="col">
          <Link className="t-caption" to="/tienda">Catálogo</Link>
          <Link className="t-caption" to="/seguimiento">Seguimiento</Link>
          <Link className="t-caption" to="/favoritos">Favoritos</Link>
        </div>
        <div className="col">
          <Link className="t-caption" to="/ingresar">Acceso del personal</Link>
          <p className="t-min">Los pagos de esta demostración son simulados.</p>
        </div>
      </div>
    </footer>
  )
}
