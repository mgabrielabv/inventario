import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { StoreFooter, StoreNav } from '../../components/store/StoreChrome'
import { routeVariants } from '../../motion/variants'

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
      <AnimatePresence mode="wait" initial={false}>
        <motion.main id="main" key={location.pathname} className="store-main"
          variants={routeVariants} initial="initial" animate="animate" exit="exit">
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <StoreFooter />
    </div>
  )
}
