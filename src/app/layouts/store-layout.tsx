import { motion, useReducedMotion } from 'framer-motion'
import { flushSync } from 'react-dom'
import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { StoreFooter, StoreNav } from '../../components/store/StoreChrome'
import { routeVariants } from '../../motion/variants'
import { PRODUCT_TRANSITION_NAME } from '../../motion/shared-transition'

/** Posición por ruta: la vuelta con "atrás" restaura el scroll del catálogo. */
const scrollPositions = new Map<string, number>()

const ScrollToTop = () => {
  const { pathname } = useLocation()
  const type = useNavigationType()
  useEffect(() => {
    if (type === 'POP') {
      window.scrollTo({ top: scrollPositions.get(pathname) ?? 0, behavior: 'instant' })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname, type])
  return null
}

type VTDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> }
}

export const StoreLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  useEffect(() => {
    // Transición compartida tarjeta → ficha. La cabecera y la barra inferior
    // viven fuera de este main, así que permanecen estables durante el cambio.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href^="#/tienda/"]')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      const to = href.slice(1)
      if (to === `${location.pathname}${location.search}`) return
      event.preventDefault()
      scrollPositions.set(location.pathname, window.scrollY)

      const card = anchor.closest('.product-card, .eshop-card')
      const photo = card?.querySelector<HTMLElement>('.eshop-photo') ?? null
      if (photo) photo.style.viewTransitionName = PRODUCT_TRANSITION_NAME
      const clear = () => { if (photo) photo.style.viewTransitionName = '' }
      const doc = document as VTDocument

      if (doc.startViewTransition && !reduce) {
        doc.startViewTransition(() => flushSync(() => navigate(to))).finished.then(clear, clear)
      } else {
        navigate(to)
        clear()
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [navigate, location.pathname, location.search, reduce])

  return (
    <div className="store-app">
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <ScrollToTop />
      <StoreNav />
      {/* Fallback con Framer cuando View Transitions no está disponible.
          La clave es solo la ruta: cambiar filtros (query) no remonta la hoja. */}
      <motion.main
        id="main"
        key={location.pathname}
        className="store-main"
        variants={routeVariants}
        initial="initial"
        animate="animate"
      >
        <Outlet />
      </motion.main>
      <StoreFooter />
    </div>
  )
}
