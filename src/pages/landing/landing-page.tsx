import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, BadgeCheck, Boxes, ChevronRight, Compass, Headphones,
  MapPin, PackageCheck, ShieldCheck, Sparkles, type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BRAND, brandInitial } from '../../config/brand'
import { ProductImage } from '../../components/store/ProductImage'
import { ProductStage } from '../../components/store/ProductStage'
import { Reveal } from '../../motion/components/Reveal'
import {
  cinematicArt, cinematicCopy, cinematicTitle, cinematicVariants,
} from '../../motion/variants'
import { localImageFor } from '../../logic/services/local-images'
import { formatMoney } from '../../logic/services/pricing'
import { realProducts } from '../../logic/services/real-products'
import { DEFAULT_CATEGORIES, type Product } from '../../logic/types'

const BENEFICIOS: Array<{
  icon: LucideIcon; titulo: string; texto: string; tamano?: 'wide' | 'tall'
}> = [
  {
    icon: BadgeCheck, titulo: 'Compra con confianza',
    texto: 'Precios claros y existencias reales. Lo que ves es lo que hay.',
    tamano: 'wide',
  },
  {
    icon: PackageCheck, titulo: 'Tu pedido, siempre a la vista',
    texto: 'Consulta el estado de tu compra cuando quieras, desde cualquier dispositivo.',
    tamano: 'tall',
  },
  {
    icon: ShieldCheck, titulo: 'Datos bien guardados',
    texto: 'Tus direcciones y tus compras quedan en tu cuenta, listas para repetir.',
  },
  {
    icon: Headphones, titulo: 'Atención cercana',
    texto: 'Si algo no sale como esperabas, estamos aquí para ayudarte.',
  },
  {
    icon: Sparkles, titulo: 'Selección que inspira',
    texto: 'Descubre productos nuevos cada semana sin perderte lo que ya te gusta.',
  },
]

const PASOS: Array<{ titulo: string; texto: string }> = [
  {
    titulo: 'Crea tu cuenta',
    texto: 'Solo necesitas un correo. Guardamos tus datos para la próxima vez.',
  },
  {
    titulo: 'Elige y confirma',
    texto: 'Explora el catálogo, agrega lo que quieras y elige cómo recibirlo.',
  },
  {
    titulo: 'Recibe y sigue',
    texto: 'Te avisamos del avance y puedes consultar tu pedido en todo momento.',
  },
]

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Tecnología': Boxes,
  'Accesorios': Headphones,
  'Hogar y cocina': MapPin,
  'Papelería y oficina': Compass,
  'Juguetes y juegos': Sparkles,
  'Deportes y aire libre': Compass,
  'Cuidado personal': ShieldCheck,
  'Mascotas': Sparkles,
  'Ferretería básica': Boxes,
}

/**
 * Portada pública. Vive siempre en tema oscuro: el contenedor
 * aplica el propio token `.dark`, sin depender de la preferencia guardada ni
 * del tema del resto de la aplicación.
 */
export const LandingPage = () => {
  const reduce = useReducedMotion()
  const destacados = useMemo<Product[]>(() => realProducts
    .filter((product) => product.publicado !== false && !product.archivado)
    .filter((product) => localImageFor(product.id))
    .slice(0, 5), [])
  const protagonista = destacados[0]
  const irASeccion = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth', block: 'start',
    })
  }
  const departamentos = useMemo(() => {
    const publicados = realProducts.filter((product) =>
      product.publicado !== false && !product.archivado)
    const conteo = new Map<string, number>()
    for (const product of publicados) {
      conteo.set(product.categoria, (conteo.get(product.categoria) ?? 0) + 1)
    }
    return DEFAULT_CATEGORIES.map((nombre) => ({
      nombre, total: conteo.get(nombre) ?? 0, icon: CATEGORY_ICONS[nombre] ?? Boxes,
    })).filter((item) => item.total > 0)
  }, [])

  return (
    <div className="landing dark">
      <header className="landing-nav">
        <div className="landing__wrap landing-nav__inner">
          <Link className="landing-brand" to="/" aria-label={`${BRAND.name}, inicio`}>
            <span className="landing-brand__mark" aria-hidden="true">{brandInitial()}</span>
            {BRAND.name}
          </Link>
          <nav className="landing-nav__links" aria-label="Navegación de la portada">
            <button type="button" onClick={() => irASeccion('escaparate')}>Escaparate</button>
            <button type="button" onClick={() => irASeccion('como-funciona')}>Cómo funciona</button>
            <button type="button" onClick={() => irASeccion('departamentos')}>Departamentos</button>
          </nav>
          <div className="landing-nav__actions">
            <Link className="landing-nav__tracking" to="/seguimiento">Seguir un pedido</Link>
            <Link className="btn btn--primary landing-cta" to="/cuenta/registro">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <motion.section
          className="landing-hero"
          aria-labelledby="landing-hero-title"
          variants={reduce ? undefined : cinematicVariants}
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
        >
          <div className="landing__wrap landing-hero__inner">
            <div className="landing-hero__copy">
              <motion.p className="landing-eyebrow" variants={cinematicTitle}>
                {BRAND.name} · hecho para ti
              </motion.p>
              <motion.h1
                id="landing-hero-title"
                className="landing-hero__title"
                variants={cinematicTitle}
              >
                Lo que te gusta,<br />más cerca que nunca.
              </motion.h1>
              <motion.p className="landing-hero__lead" variants={cinematicCopy}>
                Encuentra lo que necesitas, compra en unos pasos y sigue tu pedido
                sin perder detalle. Todo en un mismo lugar.
              </motion.p>
              <motion.div className="landing-hero__actions" variants={cinematicCopy}>
                <Link className="btn btn--primary landing-cta landing-cta--large" to="/cuenta/registro">
                  Crear cuenta <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className="landing-hero__secondary"
                  onClick={() => irASeccion('escaparate')}
                >
                  Descubrir la tienda <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </motion.div>
              <motion.p className="landing-hero__hint" variants={cinematicCopy}>
                ¿Ya tienes cuenta? <Link to="/cuenta/ingresar">Ingresa aquí</Link>
              </motion.p>
            </div>
            <motion.div className="landing-hero__stage" variants={cinematicArt}>
              {protagonista && (
                <ProductStage>
                  <div className="landing-hero__photo">
                    <ProductImage product={protagonista} />
                  </div>
                </ProductStage>
              )}
              <p className="landing-hero__stage-note">
                {protagonista ? protagonista.nombre : 'Una selección para cada día'}
              </p>
            </motion.div>
          </div>
          <div className="landing__wrap landing-hero__scroll" aria-hidden="true">
            <span>Desliza para explorar</span>
          </div>
        </motion.section>

        <section className="landing-showcase" id="escaparate" aria-labelledby="landing-showcase-title">
          <div className="landing__wrap landing-showcase__head">
            <div>
              <p className="landing-eyebrow">Escaparate</p>
              <h2 className="landing-section__title" id="landing-showcase-title">
                Una muestra de lo que te espera
              </h2>
            </div>
            <Link className="landing-section__link" to="/cuenta/registro">
              Ver todo al crear tu cuenta <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="landing__wrap landing-showcase__track" role="list" aria-label="Productos destacados">
            {destacados.map((product) => (
              <div className="landing-showcase__card" role="listitem" key={product.id}>
                <div className="landing-showcase__photo"><ProductImage product={product} /></div>
                <p className="landing-showcase__name">{product.nombre}</p>
                <p className="landing-showcase__price">{formatMoney(product.precio ?? 0)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-bento landing__wrap" aria-labelledby="landing-bento-title">
          <Reveal className="landing-section__head">
            <p className="landing-eyebrow">Por qué {BRAND.name}</p>
            <h2 className="landing-section__title" id="landing-bento-title">
              Pequeños detalles, gran diferencia
            </h2>
          </Reveal>
          <Reveal className="landing-bento__grid" as="ul">
            {BENEFICIOS.map(({ icon: Icon, titulo, texto, tamano }) => (
              <li
                className={`landing-bento__card${tamano ? ` landing-bento__card--${tamano}` : ''}`}
                key={titulo}
              >
                <span className="landing-bento__icon"><Icon size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </Reveal>
        </section>

        <section className="landing-steps" id="como-funciona" aria-labelledby="landing-steps-title">
          <div className="landing__wrap">
            <Reveal className="landing-section__head">
              <p className="landing-eyebrow">Cómo funciona</p>
              <h2 className="landing-section__title" id="landing-steps-title">
                Tres pasos y ya está
              </h2>
            </Reveal>
            <Reveal className="landing-steps__grid" as="ol">
              {PASOS.map(({ titulo, texto }, index) => (
                <li className="landing-step" key={titulo}>
                  <span className="landing-step__number">0{index + 1}</span>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="landing-departments landing__wrap" id="departamentos" aria-labelledby="landing-departments-title">
          <Reveal className="landing-section__head">
            <p className="landing-eyebrow">Departamentos</p>
            <h2 className="landing-section__title" id="landing-departments-title">
              Explora a tu manera
            </h2>
          </Reveal>
          <Reveal className="landing-departments__grid" as="ul">
            {departamentos.map(({ nombre, total, icon: Icon }) => (
              <li key={nombre}>
                <Link className="landing-department" to="/cuenta/registro">
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                  <span className="landing-department__name">{nombre}</span>
                  <span className="landing-department__count">{total} productos</span>
                </Link>
              </li>
            ))}
          </Reveal>
        </section>

        <section className="landing-close" aria-labelledby="landing-close-title">
          <Reveal className="landing__wrap landing-close__inner">
            <p className="landing-eyebrow">Empieza hoy</p>
            <h2 className="landing-close__title" id="landing-close-title">
              Tu próxima compra empieza aquí.
            </h2>
            <p className="landing-close__text">
              Crea tu cuenta para acceder a la tienda, guardar tus datos y revisar tus pedidos.
            </p>
            <div className="landing-close__actions">
              <Link className="btn btn--primary landing-cta landing-cta--large" to="/cuenta/registro">
                Crear cuenta <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link className="landing-close__secondary" to="/seguimiento">
                Solo quiero seguir un pedido
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing__wrap landing-footer__inner">
          <span className="landing-brand">
            <span className="landing-brand__mark" aria-hidden="true">{brandInitial()}</span>
            {BRAND.name}
          </span>
          <p>Compra sencilla, pedidos claros.</p>
          <Link to="/seguimiento">Seguir un pedido</Link>
        </div>
      </footer>
    </div>
  )
}
