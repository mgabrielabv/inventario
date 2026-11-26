import { AnimatePresence, motion, useReducedMotion, useScroll } from 'framer-motion'
import {
  ArrowRight, Banknote, ChevronDown, CreditCard, Heart, House, Laptop, LayoutGrid,
  MapPin, Menu, MessageCircle, Mouse, Package, PenLine, Phone, Search, ShoppingBag,
  LogOut, Smartphone, Sparkles, Tag, TrendingUp, UserRound, Wallet, X, type LucideIcon,
} from 'lucide-react'
import {
  useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CartLineItem } from './CartLineItem'
import { CartSummary } from './CartSummary'
import { BRAND, storageKey } from '../../config/brand'
import { useCartStore } from '../../logic/store/cart'
import { useCartDraftStore } from '../../logic/store/cartDraft'
import { useCustomer } from '../../app/providers/customer-provider'
import { useFavoritesStore } from '../../logic/store/favorites'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import { cartCount, validateCart } from '../../logic/services/cart'
import { formatPhoneDisplay, normalizeText, storeName } from '../../logic/services/formatters'
import { formatMoney } from '../../logic/services/pricing'
import { getAvailable } from '../../logic/services/stock'
import { BrandMark } from '../brand/BrandMark'
import { Sheet } from '../ui/Sheet'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useCartBump, useCartBumpValue, useFlyToCart } from '../../motion/hooks/useFlyToCart'
import { RollingNumber } from '../../motion/components/RollingNumber'
import { chromeMotion, dur, ease, reduced, spring } from '../../motion/tokens'
import type { Product } from '../../logic/types'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Electrónica: Laptop, Accesorios: Mouse, Papelería: PenLine, Hogar: House, Otras: Package,
}
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

const iconFor = (category: string): LucideIcon => CATEGORY_ICONS[category] ?? Package

const extraText = (product: Product): string => {
  let value = ''
  if ('subcategoria' in product && typeof product.subcategoria === 'string') {
    value += ` ${product.subcategoria}`
  }
  if ('marca' in product && typeof product.marca === 'string') {
    value += ` ${product.marca}`
  }
  return value.trim()
}

const searchText = (product: Product): string => normalizeText([
  product.nombre, product.categoria, ...product.etiquetas, extraText(product),
].join(' '))

const subcategoriesFor = (categoria: string, products: Product[]): string[] => {
  const found = new Set<string>()
  for (const product of products) {
    if (product.categoria !== categoria || !product.publicado || product.archivado) continue
    if ('subcategoria' in product && typeof product.subcategoria === 'string'
      && product.subcategoria.trim()) found.add(product.subcategoria.trim())
    for (const tag of product.etiquetas) if (tag.trim()) found.add(tag.trim())
  }
  return [...found].slice(0, 4)
}

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 820px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 820px)')
    const sync = () => setMobile(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  return mobile
}

/* ------------------------------- Buscador -------------------------------- */
type Match = {
  id: string
  label: string
  detail: string
  to: string
  group: 'Categorías' | 'Productos'
  price?: string
  status?: string
}

interface SearchBoxProps {
  overlay?: boolean
  onClose?: () => void
}

export const SearchBox = ({ overlay = false, onClose }: SearchBoxProps) => {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey('recent-searches')) ?? '[]') as string[] }
    catch { return [] }
  })
  const root = useRef<HTMLDivElement | null>(null)
  const input = useRef<HTMLInputElement | null>(null)
  const panelId = useId()
  const navigate = useNavigate()
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const categories = useSettingsStore((state) => state.settings.catalogo.categorias)
  const reduce = useReducedMotion()
  const visible = overlay || open

  const matches = useMemo<Match[]>(() => {
    const q = normalizeText(query.trim())
    const categoryMatches: Match[] = categories
      .filter((category) => !q || normalizeText(category).includes(q))
      .slice(0, q ? 3 : 4)
      .map((category) => ({
        id: `cat-${category}`,
        label: category,
        detail: 'Ver productos',
        to: `/tienda?categoria=${encodeURIComponent(category)}`,
        group: 'Categorías' as const,
      }))
    const pool = products.filter((product) => product.publicado && !product.archivado
      && product.precio !== null && (!q || searchText(product).includes(q)))
    const chosen = (q ? pool : pool.filter((product) => product.destacado))
    const productMatches: Match[] = (chosen.length ? chosen : pool).slice(0, 6).map((product) => ({
      id: product.id,
      label: product.nombre,
      detail: [product.categoria, ...product.etiquetas.slice(0, 2), extraText(product)]
        .filter(Boolean).join(' · '),
      to: `/tienda/${product.slug}`,
      group: 'Productos' as const,
      price: formatMoney(product.precio ?? 0),
      status: getAvailable(product, orders) > 0 ? 'Disponible' : 'Agotado',
    }))
    return [...categoryMatches, ...productMatches]
  }, [query, products, categories, orders])

  useEffect(() => setActive(0), [query])
  useEffect(() => {
    if (overlay) input.current?.focus()
  }, [overlay])
  useEffect(() => {
    if (overlay) return
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [overlay])

  const go = (match: Match) => {
    setOpen(false)
    onClose?.()
    navigate(match.to)
  }

  const submit = () => {
    const term = query.trim()
    if (term) {
      const next = [term, ...recent.filter((item) => item !== term)].slice(0, 6)
      setRecent(next)
      try { localStorage.setItem(storageKey('recent-searches'), JSON.stringify(next)) } catch { /* sin almacenamiento */ }
    }
    const match = matches[active]
    if (visible && match) go(match)
    else {
      setOpen(false)
      onClose?.()
      navigate(term ? `/tienda?q=${encodeURIComponent(term)}` : '/tienda')
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      onClose?.()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((value) => Math.min(value + 1, Math.max(0, matches.length - 1)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((value) => Math.max(0, value - 1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div ref={root} className={`eshop-search${overlay ? ' eshop-search--overlay' : ''}`}>
      <form className="eshop-search__form" role="search" onSubmit={onSubmit}>
        <Search size={19} strokeWidth={1.8} className="eshop-search__icon" aria-hidden="true" />
        <input
          ref={input}
          className="eshop-search__input"
          type="search"
          value={query}
          placeholder="Busca por nombre, categoría o etiqueta"
          aria-label="Buscar productos"
          aria-expanded={visible}
          aria-controls={panelId}
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
          onFocus={() => setOpen(true)}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button
            type="button"
            className="eshop-search__clear"
            aria-label="Limpiar búsqueda"
            onClick={() => { setQuery(''); setActive(0); input.current?.focus() }}
          >
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
        {!overlay && <button type="submit" className="eshop-search__submit">Buscar</button>}
      </form>
      <AnimatePresence>
        {visible && (
          <motion.div
            id={panelId}
            className="eshop-search__panel"
            role="region"
            aria-label="Sugerencias de búsqueda"
            initial={{ opacity: 0, y: reduce ? 0 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -4 }}
            transition={{ duration: reduce ? 0 : 0.14 }}
          >
            {overlay && !query.trim() && recent.length > 0 && (
              <div className="eshop-search__recent">
                <p className="eshop-search__label">Búsquedas recientes</p>
                <div className="eshop-search__recent-list">
                  {recent.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="chip"
                      onClick={() => { setQuery(term); input.current?.focus() }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {matches.length === 0 ? (
              <p className="eshop-search__empty">No hay sugerencias para “{query}”.</p>
            ) : matches.map((match, index) => (
              <div key={match.id}>
                {(index === 0 || matches[index - 1]!.group !== match.group) && (
                  <p className="eshop-search__label">{match.group}</p>
                )}
                <button
                  type="button"
                  className={`eshop-search__item${index === active ? ' eshop-search__item--active' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(match)}
                >
                  <span className="eshop-search__thumb" aria-hidden="true">
                    {match.group === 'Categorías' ? <LayoutGrid size={17} /> : <Package size={17} />}
                  </span>
                  <span className="eshop-search__text">
                    <span className="eshop-search__title">{match.label}</span>
                    <span className="eshop-search__meta">{match.detail}</span>
                  </span>
                  {match.price && <span className="eshop-search__price">{match.price}</span>}
                  {match.status && <span className="eshop-search__status">{match.status}</span>}
                </button>
              </div>
            ))}
            {!overlay && (
              <button type="button" className="eshop-search__all" onClick={submit}>
                Ver todos los resultados <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SearchDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const panel = useRef<HTMLDivElement | null>(null)
  const previous = useRef<HTMLElement | null>(null)
  const close = useRef(onClose)
  close.current = onClose
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    previous.current = document.activeElement as HTMLElement | null
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); close.current(); return }
      if (event.key !== 'Tab' || !panel.current) return
      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (nodes.length === 0) return
      const first = nodes[0]!
      const last = nodes[nodes.length - 1]!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous.current?.focus()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="eshop-search-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Buscar productos"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.14 }}
          onClick={onClose}
        >
          <motion.div
            ref={panel}
            className="eshop-search-dialog__panel"
            initial={{ y: reduce ? 0 : 12 }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : 12 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="eshop-search-dialog__head">
              <span className="eshop-search-dialog__title">Buscar productos</span>
              <button
                type="button"
                className="eshop-search-dialog__close"
                aria-label="Cerrar búsqueda"
                onClick={onClose}
              >
                <X size={19} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
            <SearchBox overlay onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------- Navegación ------------------------------ */
export const StoreNav = () => {
  const [scrolled, setScrolled] = useState(() => window.scrollY > chromeMotion.scrollDelta)
  const [headerHidden, setHeaderHidden] = useState(false)
  const [mobileViewport, setMobileViewport] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [zoneOpen, setZoneOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [ripple, setRipple] = useState(0)
  const { scrollY } = useScroll()
  const { setCartTarget } = useFlyToCart()
  const bump = useCartBumpValue()
  const cartRef = useRef<HTMLButtonElement | null>(null)
  const mobileCartRef = useRef<HTMLButtonElement | null>(null)
  const tabbarCartRef = useRef<HTMLButtonElement | null>(null)
  const lastScrollY = useRef(0)
  const megaRef = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()
  const location = useLocation()

  const lines = useCartStore((state) => state.lines)
  const prune = useCartStore((state) => state.prune)
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const favoriteCount = useFavoritesStore((state) => state.ids.length)
  const settings = useSettingsStore((state) => state.settings)
  const zona = useCartDraftStore((state) => state.zona)
  const entrega = useCartDraftStore((state) => state.entrega)
  const patchDraft = useCartDraftStore((state) => state.patch)
  const { account, signOut } = useCustomer()
  const cartBump = useCartBump(bump)

  useEffect(() => { if (bump > 0) setRipple(bump) }, [bump])

  const units = cartCount(lines)
  const active = useMemo(() => lines.filter((line) => !line.guardado), [lines])
  const total = useMemo(() => {
    const invalid = new Set(validateCart(active, products, orders)
      .filter((issue) => issue.tipo !== 'precio').map((issue) => issue.productoId))
    return active.reduce((sum, line) => {
      if (invalid.has(line.productoId)) return sum
      const product = products.find((item) => item.id === line.productoId)
      return sum + (product?.precio ?? 0) * line.cantidad
    }, 0)
  }, [active, products, orders])

  const zonas = settings.entrega.zonas
  const selectedZona = zonas.find((item) => item.nombre === zona)?.nombre
    ?? zonas[0]?.nombre ?? BRAND.city
  const selectedTarifa = zonas.find((item) => item.nombre === selectedZona)?.tarifa ?? 0
  const deliveryMessage = entrega === 'delivery' && settings.entrega.delivery
    ? `Delivery a ${selectedZona} · ${formatMoney(selectedTarifa)}`
    : settings.entrega.retiro
      ? `Retiro sin costo en ${settings.tienda.direccion}`
      : 'Acordamos la entrega al pagar'
  const whatsapp = settings.tienda.whatsapp.replace(/\D/g, '')
  const name = storeName(settings)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)')
    const update = () => setMobileViewport(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => scrollY.on('change', (value) => {
    setScrolled(value > chromeMotion.scrollDelta)
    const delta = value - lastScrollY.current
    if (Math.abs(delta) >= chromeMotion.scrollDelta) {
      setHeaderHidden(mobileViewport && value > chromeMotion.hideAfter && delta > 0)
      lastScrollY.current = value
    }
  }), [scrollY, mobileViewport])
  useEffect(() => {
    setCartTarget('header', cartRef.current)
    setCartTarget('mobile', mobileCartRef.current)
    setCartTarget('tabbar', tabbarCartRef.current)
    return () => {
      setCartTarget('header', null)
      setCartTarget('mobile', null)
      setCartTarget('tabbar', null)
    }
  }, [setCartTarget])
  useEffect(() => { prune(products) }, [products, prune])
  useEffect(() => {
    setMegaOpen(false)
    setAccountMenuOpen(false)
    setHeaderHidden(false)
  }, [location.pathname, location.search])
  useEffect(() => {
    if (!megaOpen) return
    const onPointer = (event: PointerEvent) => {
      if (megaRef.current && !megaRef.current.contains(event.target as Node)) setMegaOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMegaOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [megaOpen])
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      // El atajo solo existe con puntero fino y nunca dentro de campos o diálogos.
      if (!window.matchMedia('(pointer: fine)').matches) return
      if (target?.closest?.('input, textarea, select, [contenteditable]')) return
      if (target?.closest?.('[role="dialog"]')) return
      event.preventDefault()
      setSearchOpen(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const tab = location.pathname === '/inicio' ? 'inicio'
    : location.pathname.startsWith('/tienda') ? 'categorias'
      : location.pathname.startsWith('/carrito') ? 'carrito'
        : location.pathname.startsWith('/cuenta') ? 'cuenta' : ''
  const hideTabBar = /^\/pagar(?:\/|$)|^\/tienda\/[^/]+/.test(location.pathname)
  const pill = (active: boolean) => active ? (
    <motion.span
      layoutId="store-tabbar-pill"
      className="mobile-tabbar__pill"
      aria-hidden="true"
      transition={reduce ? { duration: reduced.duration } : spring.ui}
    />
  ) : null

  return (
    <>
      <motion.header
        className="mobile-nav"
        animate={{ y: headerHidden ? '-100%' : 0 }}
        transition={reduce ? { duration: reduced.duration } : spring.ui}
      >
        <button
          type="button"
          className="icon-btn mobile-nav__menu"
          aria-label="Abrir categorías y menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={21} strokeWidth={1.7} aria-hidden="true" />
        </button>
        <Link to="/inicio" className="mobile-nav__brand" aria-label={`${name} — inicio`}>
          <BrandMark size={26} />
          <span>{name}</span>
        </Link>
        <div className="mobile-nav__actions">
          <button
            type="button"
            className="icon-btn mobile-nav__search"
            aria-label="Buscar productos"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={20} strokeWidth={1.7} aria-hidden="true" />
          </button>
          <motion.button
            ref={mobileCartRef}
            type="button"
            className="icon-btn mobile-nav__cart"
            aria-label={`Abrir carrito: ${units} unidades, ${formatMoney(total)}`}
            animate={cartBump.animate}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={20} strokeWidth={1.7} aria-hidden="true" />
            <span className="cart-count"><RollingNumber value={units} ariaLabel={`${units} unidades`} /></span>
            {!reduce && ripple > 0 && <span key={`ripple-m-${ripple}`} className="cart-ripple" aria-hidden="true" onAnimationEnd={() => setRipple(0)} />}
          </motion.button>
        </div>
      </motion.header>
      <div className="mobile-zone">
        <button type="button" onClick={() => setZoneOpen(true)}>
          <MapPin size={15} strokeWidth={1.8} aria-hidden="true" />
          <span><strong>Entregar en:</strong> {selectedZona}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </div>

      <header className={`eshop-nav${scrolled ? ' eshop-nav--scrolled' : ''}`}>
        {/* Siempre en flujo: ocultarla al bajar desplazaba toda la página 44 px
            y contaba como CLS al volver arriba. La cabecera móvil sí se oculta
            con transform, que no altera el layout. */}
        <div className="eshop-nav__utility">
          <div className="eshop-nav__utility-inner">
            <div className="eshop-nav__delivery">
              <label htmlFor="eshop-zona">Entregar en:</label>
              <select
                id="eshop-zona"
                className="eshop-nav__select"
                value={selectedZona}
                onChange={(event) => patchDraft({ zona: event.target.value })}
              >
                {zonas.map((item) => <option key={item.nombre} value={item.nombre}>{item.nombre}</option>)}
              </select>
              <span className="eshop-nav__delivery-msg">{deliveryMessage}</span>
            </div>
            <div className="eshop-nav__utility-links">
              <Link className="eshop-nav__utility-link" to="/seguimiento">Sigue tu pedido</Link>
              {whatsapp && (
                <a
                  className="eshop-nav__utility-link"
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={14} strokeWidth={1.8} aria-hidden="true" /> WhatsApp
                </a>
              )}
              <ThemeToggle className="eshop-nav__theme" />
            </div>
          </div>
        </div>

        <div className="eshop-nav__main">
          <div className="eshop-nav__main-inner">
            <Link to="/inicio" className="eshop-brand" aria-label={`${name} — inicio`}>
              <BrandMark size={30} />
              <span className="eshop-brand__name">{name}</span>
            </Link>

            <div className="eshop-nav__search"><SearchBox /></div>

            <div className="eshop-nav__actions">
              <div className="eshop-nav__account">
                {account ? (
                  <div className="eshop-nav__account-menu">
                    <button
                      type="button"
                      className="eshop-nav__account-link"
                      aria-expanded={accountMenuOpen}
                      aria-haspopup="menu"
                      onClick={() => setAccountMenuOpen((open) => !open)}
                    >
                      <UserRound size={15} aria-hidden="true" /> Hola, {account.nombre}
                      <ChevronDown size={14} aria-hidden="true" />
                    </button>
                    {accountMenuOpen && (
                      <div className="eshop-nav__account-panel" role="menu">
                        <Link role="menuitem" to="/cuenta">Mi cuenta</Link>
                        <Link role="menuitem" to="/cuenta/pedidos">Mis pedidos</Link>
                        <Link role="menuitem" to="/cuenta/direcciones">Direcciones</Link>
                        <Link role="menuitem" to="/favoritos">Favoritos</Link>
                        <button role="menuitem" type="button" onClick={() => { signOut(); setAccountMenuOpen(false) }}>
                          <LogOut size={14} aria-hidden="true" /> Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link className="eshop-nav__account-link" to="/cuenta/ingresar">Ingresar</Link>
                    <Link className="eshop-nav__account-link" to="/cuenta/registro">Regístrate</Link>
                  </>
                )}
              </div>
              <button
                type="button"
                className="eshop-nav__icon-btn eshop-nav__search-trigger"
                aria-label="Buscar productos"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={20} strokeWidth={1.7} />
              </button>
              <Link className="eshop-nav__icon-btn" to="/favoritos" aria-label={`Favoritos: ${favoriteCount}`}>
                <Heart size={20} strokeWidth={1.7} />
                <span className="eshop-nav__badge">{favoriteCount}</span>
              </Link>
              <motion.button
                ref={cartRef}
                type="button"
                className="eshop-nav__icon-btn eshop-nav__cart"
                aria-label={`Abrir carrito: ${units} unidades, ${formatMoney(total)}`}
                animate={cartBump.animate}
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag size={20} strokeWidth={1.7} />
                <span className="eshop-nav__badge"><RollingNumber value={units} ariaLabel={`${units} unidades`} /></span>
                <span className="eshop-nav__cart-total">{formatMoney(total)}</span>
                {!reduce && ripple > 0 && <span key={`ripple-h-${ripple}`} className="cart-ripple" aria-hidden="true" onAnimationEnd={() => setRipple(0)} />}
              </motion.button>
              <button
                type="button"
                className="eshop-nav__icon-btn eshop-nav__menu-btn"
                aria-label="Abrir categorías"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={21} strokeWidth={1.7} />
              </button>
            </div>
          </div>
        </div>

        <nav className="eshop-nav__cats" aria-label="Categorías de la tienda">
          <div className="eshop-nav__cats-inner" ref={megaRef}>
            <button
              type="button"
              className="eshop-nav__all-btn"
              aria-expanded={megaOpen}
              aria-controls="eshop-mega"
              onClick={() => setMegaOpen((value) => !value)}
            >
              <LayoutGrid size={17} strokeWidth={1.8} aria-hidden="true" />
              Todas las categorías
              <ChevronDown size={15} strokeWidth={1.8} className={megaOpen ? 'eshop-nav__chevron--open' : 'eshop-nav__chevron'} aria-hidden="true" />
            </button>
            <div className="eshop-nav__cat-links">
              <Link className="eshop-nav__cat-link" to="/tienda?enOferta=1">
                <Tag size={15} strokeWidth={1.8} aria-hidden="true" /> Ofertas
              </Link>
              <Link className="eshop-nav__cat-link" to="/tienda?orden=destacados">
                <TrendingUp size={15} strokeWidth={1.8} aria-hidden="true" /> Más vendidos
              </Link>
              <Link className="eshop-nav__cat-link" to="/tienda?orden=recientes">
                <Sparkles size={15} strokeWidth={1.8} aria-hidden="true" /> Novedades
              </Link>
            </div>
            <AnimatePresence>
              {megaOpen && (
                <motion.div
                  id="eshop-mega"
                  className="eshop-mega"
                  initial={reduce ? { opacity: 0 } : {
                    opacity: 0, y: -chromeMotion.megaOffset,
                    clipPath: 'inset(0 0 100% 0)',
                  }}
                  animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
                  exit={reduce ? { opacity: 0 } : {
                    opacity: 0, y: -chromeMotion.megaOffset,
                    clipPath: 'inset(0 0 100% 0)',
                  }}
                  transition={reduce
                    ? { duration: reduced.duration }
                    : { duration: dur.fast, ease: ease.easeOutQuint }}
                >
                  <div className="eshop-mega__grid">
                    {settings.catalogo.categorias.map((category) => {
                      const Icon = iconFor(category)
                      const to = `/tienda?categoria=${encodeURIComponent(category)}`
                      const subs = subcategoriesFor(category, products)
                      return (
                        <section className="eshop-mega__col" key={category}>
                          <Link className="eshop-mega__head" to={to} onClick={() => setMegaOpen(false)}>
                            <Icon size={16} strokeWidth={1.8} aria-hidden="true" /> {category}
                          </Link>
                          <ul className="eshop-mega__list">
                            {subs.length > 0 ? subs.map((sub) => (
                              <li key={sub}>
                                <Link
                                  className="eshop-mega__link"
                                  to={`${to}&q=${encodeURIComponent(sub)}`}
                                  onClick={() => setMegaOpen(false)}
                                >
                                  {sub}
                                </Link>
                              </li>
                            )) : (
                              <li>
                                <Link className="eshop-mega__link" to={to} onClick={() => setMegaOpen(false)}>
                                  Ver todo en {category}
                                </Link>
                              </li>
                            )}
                          </ul>
                        </section>
                      )
                    })}
                  </div>
                  <div className="eshop-mega__promo">
                    <span>Retiro sin costo en tienda · envío a domicilio según tu zona</span>
                    <Link to="/tienda?enOferta=1" onClick={() => setMegaOpen(false)}>
                      Ver ofertas <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </header>

      <nav className={`mobile-tabbar${hideTabBar ? ' mobile-tabbar--hidden' : ''}`} aria-label="Navegación principal">
        <Link to="/inicio" className={tab === 'inicio' ? 'is-active' : ''} aria-current={tab === 'inicio' ? 'page' : undefined}>
          {pill(tab === 'inicio')}
          <motion.span animate={{ scale: tab === 'inicio' && !reduce ? chromeMotion.tabIconScale : 1 }} transition={spring.settle}>
            <House size={21} strokeWidth={1.7} aria-hidden="true" />
          </motion.span><span>Inicio</span>
        </Link>
        <button type="button" className={tab === 'categorias' ? 'is-active' : ''} onClick={() => setMenuOpen(true)}>
          {pill(tab === 'categorias')}
          <motion.span animate={{ scale: tab === 'categorias' && !reduce ? chromeMotion.tabIconScale : 1 }} transition={spring.settle}>
            <LayoutGrid size={21} strokeWidth={1.7} aria-hidden="true" />
          </motion.span><span>Categorías</span>
        </button>
        <button type="button" onClick={() => setSearchOpen(true)}>
          <Search size={21} strokeWidth={1.7} aria-hidden="true" /><span>Buscar</span>
        </button>
        <motion.button
          ref={tabbarCartRef}
          type="button"
          className={`mobile-tabbar__cart${tab === 'carrito' ? ' is-active' : ''}`}
          animate={cartBump.animate}
          onClick={() => setCartOpen(true)}
        >
          {pill(tab === 'carrito')}
          <motion.span animate={{ scale: tab === 'carrito' && !reduce ? chromeMotion.tabIconScale : 1 }} transition={spring.settle}>
            <ShoppingBag size={21} strokeWidth={1.7} aria-hidden="true" />
          </motion.span><span>Carrito</span>
          {units > 0 && <span className="mobile-tabbar__badge"><RollingNumber value={units} ariaLabel={`${units} unidades`} /></span>}
          {!reduce && ripple > 0 && <span key={`ripple-t-${ripple}`} className="cart-ripple" aria-hidden="true" onAnimationEnd={() => setRipple(0)} />}
        </motion.button>
        <Link to={account ? '/cuenta' : '/cuenta/ingresar'} className={tab === 'cuenta' ? 'is-active' : ''} aria-current={tab === 'cuenta' ? 'page' : undefined}>
          {pill(tab === 'cuenta')}
          <motion.span animate={{ scale: tab === 'cuenta' && !reduce ? chromeMotion.tabIconScale : 1 }} transition={spring.settle}>
            <UserRound size={21} strokeWidth={1.7} aria-hidden="true" />
          </motion.span><span>Cuenta</span>
        </Link>
      </nav>

      <Sheet open={zoneOpen} onClose={() => setZoneOpen(false)} title="¿Dónde quieres recibir tu pedido?">
        <p className="t-caption t-muted">Elige tu zona para calcular el delivery.</p>
        <div className="mobile-zone__options">
          {zonas.map((item) => (
            <button
              key={item.nombre}
              type="button"
              className={`mobile-zone__option${item.nombre === selectedZona ? ' is-active' : ''}`}
              onClick={() => { patchDraft({ zona: item.nombre }); setZoneOpen(false) }}
            >
              <span>{item.nombre}</span>
              <small>{item.tarifa > 0 ? `${formatMoney(item.tarifa)} de envío` : 'Sin costo'}</small>
            </button>
          ))}
        </div>
      </Sheet>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Categorías"
        side="right"
        className="eshop-drawer"
      >
        <div className="eshop-drawer__body">
          <div className="eshop-drawer__quick">
            <Link to="/tienda?enOferta=1" onClick={() => setMenuOpen(false)}>Ofertas</Link>
            <Link to="/tienda?orden=destacados" onClick={() => setMenuOpen(false)}>Más vendidos</Link>
            <Link to="/tienda?orden=recientes" onClick={() => setMenuOpen(false)}>Novedades</Link>
          </div>
          <div className="eshop-drawer__groups">
            {settings.catalogo.categorias.map((category, index) => {
              const expanded = openCategory === category
              const subs = subcategoriesFor(category, products)
              const to = `/tienda?categoria=${encodeURIComponent(category)}`
              return (
                <section className="eshop-drawer__group" key={category}>
                  <button
                    type="button"
                    className="eshop-drawer__trigger"
                    aria-expanded={expanded}
                    aria-controls={`eshop-drawer-panel-${index}`}
                    onClick={() => setOpenCategory(expanded ? null : category)}
                  >
                    {category}
                    <ChevronDown size={16} strokeWidth={1.8} className={expanded ? 'eshop-nav__chevron--open' : 'eshop-nav__chevron'} aria-hidden="true" />
                  </button>
                  {expanded && (
                    <div id={`eshop-drawer-panel-${index}`} className="eshop-drawer__panel">
                      <Link to={to} onClick={() => setMenuOpen(false)}>Ver todo en {category}</Link>
                      {subs.map((sub) => (
                        <Link
                          key={sub}
                          to={`${to}&q=${encodeURIComponent(sub)}`}
                          onClick={() => setMenuOpen(false)}
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
          <div className="eshop-drawer__actions">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setSearchOpen(true) }}
            >
              <Search size={17} strokeWidth={1.8} aria-hidden="true" /> Buscar productos
            </button>
            {account ? (
              <>
                <Link to="/cuenta" onClick={() => setMenuOpen(false)}>
                  <UserRound size={17} strokeWidth={1.8} aria-hidden="true" /> Hola, {account.nombre}
                </Link>
                <Link to="/cuenta/pedidos" onClick={() => setMenuOpen(false)}>Mis pedidos</Link>
                <button type="button" onClick={() => { signOut(); setMenuOpen(false) }}>
                  <LogOut size={17} strokeWidth={1.8} aria-hidden="true" /> Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/cuenta/ingresar" onClick={() => setMenuOpen(false)}>
                  <UserRound size={17} strokeWidth={1.8} aria-hidden="true" /> Ingresar
                </Link>
                <Link to="/cuenta/registro" onClick={() => setMenuOpen(false)}>Regístrate</Link>
              </>
            )}
            <Link to="/favoritos" onClick={() => setMenuOpen(false)}>
              <Heart size={17} strokeWidth={1.8} aria-hidden="true" /> Favoritos ({favoriteCount})
            </Link>
            <Link to="/seguimiento" onClick={() => setMenuOpen(false)}>
              <MapPin size={17} strokeWidth={1.8} aria-hidden="true" /> Sigue tu pedido
            </Link>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
                <MessageCircle size={17} strokeWidth={1.8} aria-hidden="true" /> Ayuda por WhatsApp
              </a>
            )}
            <button type="button" onClick={() => { setMenuOpen(false); setCartOpen(true) }}>
              <ShoppingBag size={17} strokeWidth={1.8} aria-hidden="true" /> Carrito ({units}) · {formatMoney(total)}
            </button>
            <div className="eshop-drawer__theme">
              <span>Apariencia</span>
              <ThemeToggle />
            </div>
            <Link to="/ingresar" onClick={() => setMenuOpen(false)}>
              <Laptop size={17} strokeWidth={1.8} aria-hidden="true" /> Acceso del personal
            </Link>
          </div>
        </div>
      </Sheet>
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
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
  const { account } = useCustomer()

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
      <div className="eshop-cart">
        <div className="eshop-cart__empty">
          <p className="eshop-cart__empty-title">Tu carrito está vacío</p>
          <p className="eshop-cart__empty-text">Explora el catálogo y elige lo que necesitas.</p>
          <Link className="eshop-cart__cta" to="/tienda" onClick={onClose}>Ver catálogo</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="eshop-cart">
      {active.length > 0 ? (
        <div className="eshop-cart__lines">
          <ul className="eshop-cart__list">
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
        </div>
      ) : (
        <p className="eshop-cart__hint">Aún no hay productos en el carrito. Revisa tus guardados para después.</p>
      )}

      {saved.length > 0 && (
        <section className="eshop-cart__saved" aria-label="Guardados para después">
          <h3 className="eshop-cart__saved-title">Guardados para después</h3>
          <ul className="eshop-cart__list">
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

      <div className="eshop-cart__checkout">
        <section className="eshop-cart__invite" aria-label="Accede a tu cuenta">
          {account ? (
            <h3 className="eshop-cart__invite-title">
              Comprando como {account.nombre}. Tus datos y direcciones están listos.
            </h3>
          ) : (
            <h3 className="eshop-cart__invite-title">
              Ingresa a tu cuenta para usar tus datos y direcciones guardadas
            </h3>
          )}
        </section>
        <div className="eshop-cart__summary">
          <CartSummary compact onNavigate={onClose} />
        </div>
      </div>
      <button
        type="button"
        className="eshop-cart__follow"
        onClick={() => { onClose?.(); navigate('/seguimiento') }}
      >
        ¿Ya hiciste tu pedido? Sigue su estado
      </button>
    </div>
  )
}

/* --------------------------------- Pie ----------------------------------- */
export const StoreFooter = () => {
  const settings = useSettingsStore((state) => state.settings)
  const whatsapp = settings.tienda.whatsapp.replace(/\D/g, '')
  // En escritorio las columnas van abiertas; en móvil empiezan plegadas.
  // El valor es constante: el navegador gestiona después el estado de cada details.
  const openByDefault = useRef(
    typeof window === 'undefined' || !window.matchMedia('(max-width: 768px)').matches,
  ).current

  return (
    <footer className="eshop-footer">
      <div className="eshop-footer__inner">
        <div className="eshop-footer__grid">
          <section className="eshop-footer__col eshop-footer__brand" aria-label="Nuestra tienda">
            <Link className="eshop-footer__logo" to="/inicio">
              <BrandMark size={30} />
              <span className="eshop-footer__name">{storeName(settings)}</span>
            </Link>
            <p className="eshop-footer__info"><MapPin size={15} strokeWidth={1.7} aria-hidden="true" /> {settings.tienda.direccion}</p>
            <p className="eshop-footer__info">{settings.tienda.horario}</p>
            <p className="eshop-footer__info">
              <Phone size={15} strokeWidth={1.7} aria-hidden="true" />
              {formatPhoneDisplay(settings.tienda.telefono)}
            </p>
            {whatsapp && (
              <a
                className="eshop-footer__info eshop-footer__whatsapp"
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={15} strokeWidth={1.7} aria-hidden="true" /> WhatsApp
              </a>
            )}
          </section>

          <details className="eshop-footer__col eshop-footer__accordion" open={openByDefault}>
            <summary className="eshop-footer__title">Comprar</summary>
            <nav className="eshop-footer__links" aria-label="Comprar">
              <Link className="eshop-footer__link" to="/tienda">Todo el catálogo</Link>
              <Link className="eshop-footer__link" to="/tienda?enOferta=1">Ofertas</Link>
              <Link className="eshop-footer__link" to="/tienda?orden=destacados">Más vendidos</Link>
              <Link className="eshop-footer__link" to="/tienda?orden=recientes">Novedades</Link>
              <Link className="eshop-footer__link" to="/favoritos">Mis favoritos</Link>
            </nav>
          </details>

          <details className="eshop-footer__col eshop-footer__accordion" open={openByDefault}>
            <summary className="eshop-footer__title">Mi cuenta</summary>
            <nav className="eshop-footer__links" aria-label="Mi cuenta">
              <Link className="eshop-footer__link" to="/cuenta/ingresar">Ingresar</Link>
              <Link className="eshop-footer__link" to="/cuenta/registro">Crear cuenta</Link>
              <Link className="eshop-footer__link" to="/cuenta/perfil">Mis datos</Link>
              <Link className="eshop-footer__link" to="/favoritos">Favoritos</Link>
              <Link className="eshop-footer__link" to="/seguimiento">Seguimiento</Link>
              <Link className="eshop-footer__link" to="/cuenta/direcciones">Direcciones guardadas</Link>
              <Link className="eshop-footer__link" to="/cuenta/pedidos">Mis pedidos</Link>
            </nav>
          </details>

          <details className="eshop-footer__col eshop-footer__accordion" open={openByDefault}>
            <summary className="eshop-footer__title">Ayuda</summary>
            <nav className="eshop-footer__links" aria-label="Ayuda">
              <Link className="eshop-footer__link" to="/tienda">Cómo comprar</Link>
              <Link className="eshop-footer__link" to="/carrito">Métodos de pago</Link>
              <Link className="eshop-footer__link" to="/seguimiento">Entregas y retiros</Link>
              <a className="eshop-footer__link" href={`mailto:${BRAND.supportEmail}`}>Contacto</a>
            </nav>
          </details>
        </div>

        <div className="eshop-footer__pay">
          <span className="eshop-footer__pay-label">Formas de pago</span>
          <ul className="eshop-footer__pay-list">
            <li className="eshop-footer__pay-item"><Banknote size={16} strokeWidth={1.7} aria-hidden="true" /> Efectivo</li>
            <li className="eshop-footer__pay-item"><Smartphone size={16} strokeWidth={1.7} aria-hidden="true" /> Pago móvil</li>
            <li className="eshop-footer__pay-item"><CreditCard size={16} strokeWidth={1.7} aria-hidden="true" /> Tarjeta</li>
            <li className="eshop-footer__pay-item"><Wallet size={16} strokeWidth={1.7} aria-hidden="true" /> Transferencia</li>
          </ul>
        </div>

        <div className="eshop-footer__bottom">
          <Link className="eshop-footer__staff" to="/ingresar">Acceso del personal</Link>
          <p className="eshop-footer__rights">© {new Date().getFullYear()} {BRAND.name}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
