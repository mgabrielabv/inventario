import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { StoreFooter, StoreNav } from '../../components/store/StoreChrome'
import { dur, ease } from '../../motion/tokens'

const ScrollToTop = () => {
  const { pathname } = useLocation()
  const type = useNavigationType()
  useEffect(() => {
    if (type !== 'POP') window.scrollTo(0, 0)
  }, [pathname, type])
  return null
}

export const StoreLayout = () => {
  const location = useLocation()
  return (
    <div className="store-app">
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <ScrollToTop />
      <StoreNav />
      {/* Sin mode="wait": la ruta nueva se pinta de inmediato y se desvanece en 180 ms. */}
      <motion.main
        id="main"
        key={location.pathname}
        className="store-main"
        initial={{ opacity: 0.85, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur.fast, ease: ease.out }}
      >
        <Outlet />
      </motion.main>
      <StoreFooter />
    </div>
  )
}
