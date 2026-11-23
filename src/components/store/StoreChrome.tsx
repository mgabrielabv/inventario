import { AnimatePresence, motion, useReducedMotion, useScroll } from 'framer-motion'
import {
  ArrowRight, Heart, Menu, Search, ShoppingBag, X,
} from 'lucide-react'
import {
  useEffect, useMemo, useRef, useState,
} from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../ui/Toast'
import { useCartStore } from '../../logic/store/cart'
import { useFavoritesStore } from '../../logic/store/favorites'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import { storeName } from '../../logic/services/formatters'
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
  const { scrollY } = useScroll()
  const { setCartTarget, bump } = useFlyToCart()
  const cartRef = useRef<HTMLAnchorElement | null>(null)
  const cartCount = useCartStore((state) => state.lines.reduce((sum, line) => sum + line.cantidad, 0))
  const favoriteCount = useFavoritesStore((state) => state.ids.length)
  const cartBump = useCartBump(bump)
  const settings = useSettingsStore((state) => state.settings)

  useEffect(() => {
    return scrollY.on('change', (value) => setScrolled(value > 8))
  }, [scrollY])

  useEffect(() => { setCartTarget(cartRef.current) }, [setCartTarget])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault()
        setSearchOpen(true)
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
            <motion.a
              ref={cartRef} href="#/carrito" className="icon-btn cart-icon" aria-label={`Carrito, ${cartCount} unidades`}
              animate={cartBump.animate} key={cartBump.key}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && <span className="cart-count"><RollingNumber value={cartCount} /></span>}
            </motion.a>
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
  const { lines, setQuantity, remove, restore } = useCartStore()
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const rows = lines.flatMap((line) => {
    const product = products.find((p) => p.id === line.productoId)
    if (!product) return []
    return [{ line, product, available: getAvailable(product, orders) }]
  })
  const subtotal = rows.reduce((sum, row) => sum + (row.product.precio ?? 0) * row.line.cantidad, 0)

  return (
    <div className="cart-sheet">
      {rows.length === 0 ? (
        <div className="cart-sheet__empty">
          <p className="t-subtitle">Tu carrito está vacío</p>
          <p className="t-caption">Explora el catálogo y elige lo que necesitas.</p>
          <Button onClick={() => { onClose?.(); navigate('/tienda') }}>Ver catálogo</Button>
        </div>
      ) : (
        <>
          <ul className="cart-lines">
            <AnimatePresence initial={false} mode="popLayout">
              {rows.map(({ line, product, available }) => (
                <motion.li key={line.productoId} layout className="cart-line"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: dur.base }}>
                  <ProductBox categoria={product.categoria} codigo={product.codigo} nombre={product.nombre} size={64} />
                  <div className="grow">
                    <Link to={`/tienda/${product.slug}`} onClick={onClose} className="t-mid">{product.nombre}</Link>
                    <span className="t-caption">{formatMoney(product.precio ?? 0)} c/u</span>
                    {line.cantidad > available && (
                      <div className="cart-line__conflict">
                        <span>Solo quedan {available}</span>
                        <button type="button" className="link-button"
                          onClick={() => setQuantity(line.productoId, Math.max(1, available))}>Ajustar</button>
                      </div>
                    )}
                    <div className="cart-line__controls">
                      <StepperMini value={line.cantidad} max={Math.max(available, line.cantidad)}
                        onChange={(value) => setQuantity(line.productoId, value)} />
                      <button type="button" className="link-button t-caption"
                        onClick={() => {
                          remove(line.productoId)
                          toast(`Se quitó ${product.nombre}`, {
                            action: { label: 'Deshacer', onClick: () => restore(line) },
                          })
                        }}>Quitar</button>
                    </div>
                  </div>
                  <span className="t-mid num">{formatMoney((product.precio ?? 0) * line.cantidad)}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="cart-summary">
            <div className="row between"><span className="t-caption">Subtotal</span>
              <RollingNumber value={subtotal} decimals={2} prefix="$ " /></div>
            <p className="t-min">El envío se calcula en el checkout.</p>
            <Button full magnetic onClick={() => { onClose?.(); if (location.pathname !== '/pagar') navigate('/pagar') }}>
              Continuar <ArrowRight size={18} strokeWidth={1.5} />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

const StepperMini = ({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) => (
  <div className="stepper stepper--sm" role="group" aria-label="Cantidad">
    <button type="button" className="stepper__btn" aria-label="Disminuir"
      disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
    <RollingNumber value={value} ariaLabel={`Cantidad ${value}`} />
    <button type="button" className="stepper__btn" aria-label="Aumentar"
      disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
  </div>
)

/* --------------------------------- Footer -------------------------------- */
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
