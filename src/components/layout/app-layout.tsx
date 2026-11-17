import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Package, 
  ArrowLeftRight, 
  Bell, 
  FileText, 
  LogOut,
  Sun,
  Moon,
  Command,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useInventoryStore } from '../../store/inventory'
import { cn } from '../../utils/cn'

export const AppLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const products = useInventoryStore((state) => state.products)
  const alerts = products.filter(p => p.cantidad < 10).length

  const navItems = [
    { to: '/', icon: Home, label: 'Inicio', num: '01' },
    { to: '/inventario', icon: Package, label: 'Inventario', num: '02' },
    { to: '/movimientos', icon: ArrowLeftRight, label: 'Movimientos', num: '03' },
    { to: '/alertas', icon: Bell, label: 'Alertas', num: '04', badge: alerts },
    { to: '/reportes', icon: FileText, label: 'Reportes', num: '05' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Sidebar Desktop */}
      <motion.aside
        className="hidden lg:flex flex-col relative z-50"
        style={{ 
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--line)',
        }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        animate={{ width: sidebarExpanded ? 240 : 72 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="h-[72px] flex items-center px-[16px] border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4L4 10V22L16 28L28 22V10L16 4Z" stroke="var(--ink)" strokeWidth="1.25" fill="none"/>
              <path d="M16 4V16M16 16L4 10M16 16L28 10M16 28V16" stroke="var(--ink)" strokeWidth="1.25"/>
            </svg>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-[10px] tracking-[0.25em] uppercase whitespace-nowrap"
                  style={{ color: 'var(--ink-subtle)' }}
                >
                  Atelier
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex-1 py-[16px] px-[16px]">
          <div className="space-y-[8px]">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center w-[48px] h-[48px] group transition-colors duration-300',
                    isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-subtle)] hover:text-[var(--ink)]'
                  )
                }
                style={{ justifyContent: 'center' }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-[-16px] w-[2px] h-[24px]"
                        style={{ backgroundColor: 'var(--accent)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <div 
                        className="absolute inset-0"
                        style={{ backgroundColor: 'rgba(20, 19, 15, 0.06)' }}
                      />
                    )}
                    <item.icon size={18} strokeWidth={1.25} className="relative z-10" />
                    <AnimatePresence>
                      {sidebarExpanded && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.3 }}
                          className="absolute left-[56px] flex items-center gap-2 whitespace-nowrap"
                        >
                          <span className="text-sm relative z-10">{item.label}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {item.badge && item.badge > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full z-10"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-[16px] border-t" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={handleLogout}
            className="relative flex items-center w-[48px] h-[48px] text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors duration-300"
            style={{ justifyContent: 'center' }}
          >
            <LogOut size={18} strokeWidth={1.25} />
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute left-[56px] whitespace-nowrap text-sm"
                >
                  Cerrar sesión
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header 
          className="h-[72px] flex items-center justify-between border-b"
          style={{ 
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--line)',
            padding: '0 24px',
          }}
          className="lg:!px-[48px]"
        >
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
              style={{ color: 'var(--ink)' }}
            >
              <Menu size={20} strokeWidth={1.25} />
            </button>
            <div className="flex flex-col">
              <span 
                className="text-[20px]"
                style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1 }}
              >
                {formatDate()}
              </span>
              <span className="text-[11px] tracking-[0.16em] uppercase mt-[4px]" style={{ color: 'var(--ink-subtle)' }}>
                {getGreeting()}, {user?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="hidden md:flex items-center gap-2 px-[16px] py-[8px] border transition-colors duration-300"
              style={{ borderColor: 'var(--line-strong)', color: 'var(--ink-subtle)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--ink)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--ink-subtle)'
              }}
            >
              <Command size={14} strokeWidth={1.25} />
              <span className="text-xs">Buscar</span>
              <span className="text-[10px] px-1.5 py-0.5 border" style={{ borderColor: 'var(--line)' }}>⌘K</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 transition-colors duration-300"
              style={{ color: 'var(--ink-subtle)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--ink)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--ink-subtle)'
              }}
            >
              {theme === 'light' ? <Moon size={18} strokeWidth={1.25} /> : <Sun size={18} strokeWidth={1.25} />}
            </button>

            <div 
              className="w-[40px] h-[40px] flex items-center justify-center text-xs"
              style={{ backgroundColor: 'var(--accent)', color: '#FBFAF6' }}
            >
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden flex flex-col"
              style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--line)' }}
            >
              <div className="h-[72px] flex items-center justify-between px-6 border-b" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-3">
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 4L4 10V22L16 28L28 22V10L16 4Z" stroke="var(--ink)" strokeWidth="1.25" fill="none"/>
                    <path d="M16 4V16M16 16L4 10M16 16L28 10M16 28V16" stroke="var(--ink)" strokeWidth="1.25"/>
                  </svg>
                  <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: 'var(--ink-subtle)' }}>
                    Atelier
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink)' }}>
                  <X size={20} strokeWidth={1.25} />
                </button>
              </div>
              <nav className="flex-1 py-4 px-3">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center h-10 px-3',
                          isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-subtle)]'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <div className="absolute left-0 w-[2px] h-6" style={{ backgroundColor: 'var(--accent)' }} />
                          )}
                          <item.icon size={18} strokeWidth={1.25} />
                          <span className="ml-3 text-sm">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </nav>
              <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
                <button
                  onClick={handleLogout}
                  className="flex items-center h-10 px-3 w-full text-[var(--ink-subtle)]"
                >
                  <LogOut size={18} strokeWidth={1.25} />
                  <span className="ml-3 text-sm">Cerrar sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
