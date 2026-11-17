import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftRight,
  Bell,
  FileText,
  Home,
  LogOut,
  Menu,
  Moon,
  Package,
  Sun,
  X,
} from 'lucide-react'
import { useAuth } from '../../app/providers/auth-provider'
import { useTheme } from '../../app/providers/theme-provider'
import { useInventoryStats } from '../../logic/hooks/useInventoryStats'
import { formatLongDate, getGreeting } from '../../logic/services/formatters'
import { EASE_OUT } from '../illustrations/motion'
import { OpenBox } from '../illustrations/open-box'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Hoy' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/movimientos', icon: ArrowLeftRight, label: 'Movimientos' },
  { to: '/alertas', icon: Bell, label: 'Alertas' },
  { to: '/reportes', icon: FileText, label: 'Cuentas' },
] as const

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { alertsCount } = useInventoryStats()
  const navigate = useNavigate()

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [mobileMenuOpen])

  const handleLogout = () => {
    setMobileMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const badgeFor = (to: string): number | undefined =>
    to === '/alertas' && alertsCount > 0 ? alertsCount : undefined

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="sidebar__brand">
          <OpenBox className="sidebar__mark" />
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-title">INVENTARIO</span>
            <span className="sidebar__brand-sub">Control de bodega</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                ['sidebar__link', isActive ? 'sidebar__link--active' : ''].filter(Boolean).join(' ')
              }
            >
              <item.icon size={18} strokeWidth={1.7} aria-hidden="true" />
              <span className="sidebar__label">{item.label}</span>
              {badgeFor(item.to) && (
                <span
                  className="ship-label ship-label--critical sidebar__badge"
                  aria-label={`${badgeFor(item.to)} alertas`}
                >
                  {badgeFor(item.to)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="sidebar__avatar" aria-hidden="true">
              {user?.name.charAt(0)}
            </span>
            <div className="sidebar__user-text">
              <span className="sidebar__user-name">{user?.name}</span>
              <span className="sidebar__user-role">{user?.role}</span>
            </div>
          </div>
          <button type="button" className="sidebar__action" onClick={handleLogout}>
            <LogOut size={16} strokeWidth={1.7} aria-hidden="true" />
            <span className="sidebar__label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="app-body">
        <header className="app-header">
          <button
            type="button"
            className="app-header__menu"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú de navegación"
          >
            <Menu size={20} strokeWidth={1.7} aria-hidden="true" />
          </button>

          <div className="app-header__meta">
            <p className="app-header__date">{formatLongDate()}</p>
            <p className="app-header__greeting">
              {getGreeting()}, {user?.name}
            </p>
          </div>

          <div className="app-header__actions">
            <span className="app-header__status" aria-hidden="true">
              <span className="app-header__status-dot" />
              En línea
            </span>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
            >
              {theme === 'light' ? (
                <Moon size={17} strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <Sun size={17} strokeWidth={1.7} aria-hidden="true" />
              )}
            </button>
            <div className="app-header__avatar" aria-hidden="true">
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="mobile-menu__overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              <div className="mobile-menu__head">
                <div className="sidebar__brand">
                  <OpenBox className="sidebar__mark" />
                  <div className="sidebar__brand-text">
                    <span className="sidebar__brand-title">INVENTARIO</span>
                    <span className="sidebar__brand-sub">Control de bodega</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <X size={20} strokeWidth={1.7} aria-hidden="true" />
                </button>
              </div>

              <nav className="mobile-menu__nav">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      ['mobile-menu__link', isActive ? 'mobile-menu__link--active' : '']
                        .filter(Boolean)
                        .join(' ')
                    }
                  >
                    <item.icon size={18} strokeWidth={1.7} aria-hidden="true" />
                    <span>{item.label}</span>
                    {badgeFor(item.to) && (
                      <span className="ship-label ship-label--critical sidebar__badge">
                        {badgeFor(item.to)}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="mobile-menu__footer">
                <div className="sidebar__user">
                  <span className="sidebar__avatar" aria-hidden="true">
                    {user?.name.charAt(0)}
                  </span>
                  <div className="sidebar__user-text">
                    <span className="sidebar__user-name">{user?.name}</span>
                    <span className="sidebar__user-role">{user?.role}</span>
                  </div>
                </div>
                <div className="mobile-menu__actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={toggleTheme}>
                    {theme === 'light' ? (
                      <Moon size={15} strokeWidth={1.7} aria-hidden="true" />
                    ) : (
                      <Sun size={15} strokeWidth={1.7} aria-hidden="true" />
                    )}
                    {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                    <LogOut size={15} strokeWidth={1.7} aria-hidden="true" />
                    Salir
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
