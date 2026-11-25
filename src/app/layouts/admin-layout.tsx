import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight, Boxes, ChevronDown, ClipboardList, Command, LayoutDashboard,
  LogOut, Menu, PackageSearch, PanelLeftClose, PanelLeftOpen, Search, Settings,
  TrendingUp, Truck, Users, X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { BRAND } from '../../config/brand'
import { useAuth } from '../providers/auth-provider'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { needsReplenishment } from '../../logic/services/stock'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { routeVariants, popover } from '../../motion/variants'
import { overlayUI, spring } from '../../motion/tokens'
import type { PermissionAction } from '../../logic/types'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  admin?: boolean
  permission?: PermissionAction
}
const TAB_NAV = [
  { to: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { to: '/admin/inventario', label: 'Stock', icon: Boxes },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/reportes', label: 'Reportes', icon: TrendingUp },
  { to: '/admin/configuracion', label: 'Ajustes', icon: Settings },
] as const

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

const NAV: NavItem[] = [
  { to: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { to: '/admin/inventario', label: 'Inventario', icon: Boxes },
  { to: '/admin/movimientos', label: 'Movimientos', icon: Truck },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/clientes', label: 'Clientes', icon: Users, permission: 'ver:clientes' },
  { to: '/admin/reposicion', label: 'Reposición', icon: PackageSearch },
  { to: '/admin/reportes', label: 'Reportes', icon: TrendingUp },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings, admin: true },
]

const ScrollToTop = () => {
  const { pathname } = useLocation()
  const type = useNavigationType()
  useEffect(() => { if (type !== 'POP') window.scrollTo(0, 0) }, [pathname, type])
  return null
}

export const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const sidebar = useRef<HTMLElement | null>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const skipBack = useRef(false)
  const { user, logout, can } = useAuth()
  const orders = useOrdersStore((state) => state.orders)
  const products = useInventoryStore((state) => state.products)
  const navigate = useNavigate()
  const location = useLocation()

  const pendientes = orders.filter((order) => order.estado === 'Pendiente').length
  const reposicion = products.filter((p) => !p.archivado && needsReplenishment(p, orders)).length
  const visibleNav = useMemo(() => NAV.filter((item) =>
    (!item.admin || user?.role === 'Administrador')
    && (!item.permission || can(item.permission))), [can, user])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setPaletteOpen(true)
      }
      const target = event.target as HTMLElement | null
      if (event.key.toLowerCase() === 'c' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        // Igual que «/» en la tienda: solo con puntero fino y fuera de campos.
        if (!window.matchMedia('(pointer: fine)').matches) return
        if (target?.closest?.('input, textarea, select, [contenteditable]')) return
        if (target?.closest?.('[role="dialog"]')) return
        event.preventDefault(); setPaletteOpen(true)
      }
      if (event.key === 'Escape') { setPaletteOpen(false); setUserOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // El cajón del panel se comporta como una hoja: foco atrapado, Escape,
  // cierre con «atrás» y devolución del foco al botón que lo abrió.
  useEffect(() => {
    if (!drawerOpen) return
    previousFocus.current = document.activeElement as HTMLElement | null
    window.history.pushState({ adminDrawer: true }, '')
    const onPop = () => setDrawerOpen(false)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); setDrawerOpen(false); return }
      if (event.key !== 'Tab' || !sidebar.current) return
      const nodes = Array.from(sidebar.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((node) => node.getClientRects().length > 0)
      if (nodes.length === 0) return
      const first = nodes[0]!
      const last = nodes[nodes.length - 1]!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('popstate', onPop)
    sidebar.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => {
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('popstate', onPop)
      if (window.history.state?.adminDrawer && !skipBack.current) window.history.back()
      skipBack.current = false
      previousFocus.current?.focus?.()
    }
  }, [drawerOpen])

  return (
    <div className={`admin-app${collapsed ? ' is-collapsed' : ''}${drawerOpen ? ' is-drawer-open' : ''}`}>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <ScrollToTop />
      {drawerOpen && (
        <button type="button" className="admin-backdrop" aria-label="Cerrar menú"
          onClick={() => setDrawerOpen(false)} />
      )}
      <aside ref={sidebar} id="admin-sidebar" className="admin-sidebar"
        role={drawerOpen ? 'dialog' : undefined} aria-modal={drawerOpen || undefined}
        aria-label={drawerOpen ? 'Menú del panel' : undefined}>
        <div className="admin-sidebar__top">
          <Link to="/" className="brand" aria-label="Ver tienda">
            <span className="brand__mark">I</span>
            {!collapsed && <span className="brand__name">{BRAND.shortName}</span>}
          </Link>
          <button type="button" className="icon-btn"
            aria-label={drawerOpen ? 'Cerrar menú' : collapsed ? 'Expandir barra' : 'Colapsar barra'}
            onClick={() => drawerOpen ? setDrawerOpen(false) : setCollapsed((value) => !value)}>
            {drawerOpen ? <X size={18} strokeWidth={1.5} />
              : collapsed ? <PanelLeftOpen size={18} strokeWidth={1.5} />
                : <PanelLeftClose size={18} strokeWidth={1.5} />}
          </button>
        </div>
        <nav className="admin-nav" aria-label="Panel de administración">
          {visibleNav.map((item) => {
            const Icon = item.icon
            const active = item.to === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.to)
            const badge = item.to === '/admin/pedidos' ? pendientes
              : item.to === '/admin/reposicion' ? reposicion : 0
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/admin'}
                className={`admin-nav__item${active ? ' is-active' : ''}`} title={collapsed ? item.label : undefined}
                onClick={() => { if (drawerOpen) { skipBack.current = true; setDrawerOpen(false) } }}>
                {active && <motion.span layoutId="admin-nav-active" className="admin-nav__active" transition={spring.ui} />}
                <Icon size={20} strokeWidth={1.5} />
                {!collapsed && <motion.span className="admin-nav__label">{item.label}</motion.span>}
                {badge > 0 && (!collapsed ? <span className="admin-nav__badge">{badge}</span> : <span className="admin-nav__dot" />)}
              </NavLink>
            )
          })}
        </nav>
        <div className="admin-sidebar__bottom">
          <Link to="/" className="admin-nav__item" title="Ver tienda"
            onClick={() => { if (drawerOpen) { skipBack.current = true; setDrawerOpen(false) } }}>
            <ArrowUpRight size={20} strokeWidth={1.5} />
            {!collapsed && <span>Ver tienda</span>}
          </Link>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar glass">
          <button type="button" className="icon-btn admin-topbar__menu" aria-label="Menú"
            aria-expanded={drawerOpen} aria-controls="admin-sidebar"
            onClick={() => window.matchMedia('(max-width: 1024px)').matches
              ? setDrawerOpen((v) => !v)
              : setCollapsed((v) => !v)}>
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <button type="button" className="admin-search" onClick={() => setPaletteOpen(true)}>
            <Search size={18} strokeWidth={1.5} />
            <span>Buscar o ir a…</span>
            <kbd><Command size={12} /> K</kbd>
          </button>
          <div className="row">
            <ThemeToggle />
            <div className="admin-user">
              <button type="button" className="admin-user__button" aria-expanded={userOpen}
                aria-label="Menú de usuario" onClick={() => setUserOpen((v) => !v)}>
                <span className="avatar">{user?.name.slice(0, 1)}</span>
                {!collapsed && <ChevronDown size={16} strokeWidth={1.5} />}
              </button>
              <AnimatePresence>
                {userOpen && (
                  <motion.div className="admin-user__menu glass" {...popover}>
                    <p className="t-min t-muted">Sesión activa</p>
                    <p className="t-mid">{user?.name}</p>
                    <p className="t-caption">{user?.role}</p>
                    <div className="hairline-top" />
                    <button type="button" className="admin-user__logout"
                      onClick={() => { logout(); navigate('/ingresar') }}>
                      <LogOut size={16} strokeWidth={1.5} /> Cerrar sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <AnimatePresence mode="wait" initial={false}>
          <motion.main id="main" key={location.pathname} className="admin-main"
            variants={routeVariants} initial="initial" animate="animate" exit="exit">
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      <nav className="admin-tabbar" aria-label="Navegación rápida del panel">
        {TAB_NAV.filter((item) => item.to === '/admin' || visibleNav.some((nav) => nav.to === item.to))
          .map((item) => {
            const Icon = item.icon
            const active = item.to === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.to)
            const badge = item.to === '/admin/pedidos' ? pendientes : 0
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/admin'}
                className={`admin-tabbar__item${active ? ' is-active' : ''}`}>
                {active && (
                  <motion.span
                    layoutId="admin-tabbar-pill"
                    className="admin-tabbar__pill"
                    aria-hidden="true"
                    transition={spring.ui}
                  />
                )}
                <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
                <span>{item.label}</span>
                {badge > 0 && <span className="admin-tabbar__badge">{badge}</span>}
              </NavLink>
            )
          })}
      </nav>

      <CommandPalette items={visibleNav} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}

const CommandPalette = ({ open, onClose, items }: {
  open: boolean; onClose: () => void; items: NavItem[]
}) => {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const products = useInventoryStore((state) => state.products)

  const commands = useMemo(() => {
    const nav = items.map((item) => ({ id: item.to, label: item.label, hint: 'Ir a', action: () => navigate(item.to) }))
    const prods = products.filter((p) => `${p.nombre} ${p.codigo}`.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5).map((p) => ({
        id: `p-${p.id}`, label: p.nombre, hint: p.codigo,
        action: () => navigate(`/admin/inventario?q=${encodeURIComponent(p.codigo)}`),
      }))
    return [...nav, ...prods].filter((item) =>
      !query || `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase())).slice(0, 9)
  }, [items, navigate, products, query])

  useEffect(() => {
    if (open) {
      setQuery(''); setActive(0)
      window.setTimeout(() => input.current?.focus(), overlayUI.focusDelay)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="command-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} role="dialog" aria-modal="true" aria-label="Paleta de comandos">
          <motion.div className="command-panel glass" onClick={(event) => event.stopPropagation()}
            initial={{
              opacity: 0, scale: overlayUI.panelScale, y: -overlayUI.commandOffsetY,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: overlayUI.panelScale }} transition={spring.ui}>
            <div className="command-panel__field">
              <Search size={20} strokeWidth={1.5} />
              <input ref={input} value={query} placeholder="Buscar sección o producto…" aria-label="Comando"
                autoComplete="off" inputMode="search" enterKeyHint="search"
                onChange={(event) => { setQuery(event.target.value); setActive(0) }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(i + 1, commands.length - 1)) }
                  if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
                  if (event.key === 'Enter' && commands[active]) { commands[active]!.action(); onClose() }
                  if (event.key === 'Escape') onClose()
                }} />
            </div>
            <div className="command-panel__results">
              {commands.map((command, index) => (
                <button key={command.id} type="button"
                  className={`command-row${index === active ? ' is-active' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => { command.action(); onClose() }}>
                  {index === active && <motion.span layoutId="command-highlight" className="command-row__highlight" />}
                  <span className="t-mid">{command.label}</span>
                  <span className="t-caption">{command.hint}</span>
                </button>
              ))}
              {commands.length === 0 && <p className="t-caption command-panel__empty">Sin resultados</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
