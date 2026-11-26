import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, BadgeCheck, Boxes, ChevronRight, Compass, Headphones, Heart,
  MapPin, PackageCheck, ShieldCheck, Sparkles, Tag, type LucideIcon,
} from 'lucide-react'
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type PointerEvent, type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { BRAND, brandInitial } from '../../config/brand'
import { LivingBackground } from '../../components/landing/LivingBackground'
import { ProductImage } from '../../components/store/ProductImage'
import { Reveal } from '../../motion/components/Reveal'
import {
  cinematicCopy, cinematicTitle, cinematicVariants,
} from '../../motion/variants'
import { pluralize } from '../../logic/services/formatters'
import { localImageFor } from '../../logic/services/local-images'
import { formatMoney } from '../../logic/services/pricing'
import { realProducts } from '../../logic/services/real-products'
import { DEFAULT_CATEGORIES, type Escenario, type Product } from '../../logic/types'
import { HeroScene } from './HeroScene'

type Benefit = {
  icon: LucideIcon
  titulo: string
  texto: string
  area: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'
  micro: 'viaje' | 'caja' | 'linea' | 'corazon' | 'oferta' | 'escudo' | 'brillo'
}

const BENEFICIOS: Benefit[] = [
  {
    icon: BadgeCheck, titulo: 'Compra con confianza', area: 'a', micro: 'escudo',
    texto: 'Precios claros y existencias reales. Lo que ves es lo que hay.',
  },
  {
    icon: PackageCheck, titulo: 'Tu pedido, siempre a la vista', area: 'b', micro: 'viaje',
    texto: 'Sigue cada avance desde cualquier dispositivo.',
  },
  {
    icon: Sparkles, titulo: 'Selección que inspira', area: 'c', micro: 'brillo',
    texto: 'Novedades cada semana, sin perder lo que ya te gusta.',
  },
  {
    icon: Boxes, titulo: 'Todo en un solo lugar', area: 'd', micro: 'caja',
    texto: 'Seis departamentos reales para casa y día a día.',
  },
  {
    icon: Tag, titulo: 'Precios que se entienden', area: 'e', micro: 'oferta',
    texto: 'Sin letra pequeña: sabes cuánto pagas desde el principio.',
  },
  {
    icon: Heart, titulo: 'Guarda lo que te gusta', area: 'f', micro: 'corazon',
    texto: 'Tus favoritos te esperan en tu cuenta.',
  },
  {
    icon: ShieldCheck, titulo: 'Tus datos bien guardados', area: 'g', micro: 'linea',
    texto: 'Direcciones y compras listas para la próxima vez.',
  },
]

type Paso = { titulo: string; texto: string; demo: 'cuenta' | 'buscar' | 'pedido' }

const PASOS: Paso[] = [
  {
    titulo: 'Crea tu cuenta', demo: 'cuenta',
    texto: 'Con tu correo y una contraseña guardarás tus datos para la próxima vez.',
  },
  {
    titulo: 'Elige y confirma', demo: 'buscar',
    texto: 'Explora el catálogo, elige entrega o retiro y confirma; el pago es simulado.',
  },
  {
    titulo: 'Recibe y sigue', demo: 'pedido',
    texto: 'Te avisamos del avance y puedes consultar tu pedido en todo momento.',
  },
]

type Chapter = {
  categoria: string
  titulo: string
  texto: string
  escenario: Escenario
  id: string
}

const CAPITULOS: Chapter[] = [
  {
    categoria: 'Tecnología', titulo: 'Tecnología que acompaña', escenario: 'estudio',
    texto: 'Equipos para trabajar, crear y desconectar, elegidos con calma.', id: 'dj-123',
  },
  {
    categoria: 'Accesorios', titulo: 'El detalle que lo cambia', escenario: 'noche',
    texto: 'Audio, relojes y pequeños esenciales que se notan cada día.', id: 'dj-101',
  },
  {
    categoria: 'Hogar y cocina', titulo: 'Una casa más tuya', escenario: 'arena',
    texto: 'Espacios cálidos y útiles pensados para vivirlos a diario.', id: 'dj-12',
  },
  {
    categoria: 'Alimentos y bebidas', titulo: 'La despensa, resuelta', escenario: 'natural',
    texto: 'Lo de siempre y lo nuevo, sin darle más vueltas.', id: 'off-8000500426494',
  },
]

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Tecnología': Boxes,
  'Accesorios': Headphones,
  'Alimentos y bebidas': Sparkles,
  'Hogar y cocina': MapPin,
  'Deportes y aire libre': Compass,
  'Cuidado personal': ShieldCheck,
}

const PRODUCT_BY_ID = new Map(realProducts.map((product) => [product.id, product]))
const chapterProducts = CAPITULOS.map((capitulo) => ({
  ...capitulo,
  product: PRODUCT_BY_ID.get(capitulo.id),
})).filter((capitulo): capitulo is Chapter & { product: Product } => Boolean(capitulo.product))

/**
 * Capítulos del escaparate. El estado del capítulo vive aquí para que el
 * scroll no vuelva a renderizar toda la portada (incluido el fondo y el hero).
 */
const Showcase = ({ reduce }: { reduce: boolean | null }) => {
  const [capitulo, setCapitulo] = useState(0)
  const capitulosRef = useRef<Array<HTMLLIElement | null>>([])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const activo = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (activo) setCapitulo(Number((activo.target as HTMLElement).dataset.index ?? 0))
    }, { threshold: [0.35, 0.6], rootMargin: '-18% 0px -18% 0px' })
    for (const item of capitulosRef.current) if (item) observer.observe(item)
    return () => observer.disconnect()
  }, [])

  const activo = chapterProducts[capitulo] ?? chapterProducts[0]
  return (
    <section className="landing-showcase" id="escaparate" aria-labelledby="landing-showcase-title">
      <div className="landing__wrap landing-showcase__head">
        <div>
          <p className="landing-eyebrow">Escaparate</p>
          <h2 className="landing-section__title" id="landing-showcase-title">
            Una muestra real de lo que te espera
          </h2>
        </div>
        <Link className="landing-section__link" to="/cuenta/registro">
          Ver todo al crear tu cuenta <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className="landing__wrap landing-showcase__layout">
        <div className="landing-showcase__sticky">
          <AnimatePresence mode="wait">
            {activo && (
              <motion.article
                key={activo.id}
                className="landing-showcase__stage"
                data-escenario={activo.escenario}
                initial={reduce ? undefined : { opacity: 0, rotateY: -6, scale: 0.98 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, rotateY: 6, scale: 0.98 }}
                transition={{ duration: reduce ? 0.12 : 0.42, ease: easeOut }}
              >
                <div className="landing-showcase__art">
                  <ProductImage product={activo.product} />
                </div>
                <div className="landing-showcase__stage-copy">
                  <p className="landing-eyebrow">{activo.categoria}</p>
                  <h3>{activo.titulo}</h3>
                  <p>{activo.texto}</p>
                  <p className="landing-showcase__price">{formatMoney(activo.product.precio ?? 0)}</p>
                </div>
              </motion.article>
            )}
          </AnimatePresence>
        </div>
        <ol className="landing-showcase__chapters">
          {chapterProducts.map((item, index) => (
            <li
              key={item.id}
              ref={(node) => { capitulosRef.current[index] = node }}
              data-index={index}
              className={index === capitulo ? 'is-active' : ''}
            >
              <span className="landing-showcase__index">0{index + 1}</span>
              <h3>{item.titulo}</h3>
              <p>{item.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const demoMarkup: Record<Paso['demo'], ReactNode> = {
  cuenta: (
    <div className="landing-demo landing-demo--form">
      <span className="landing-demo__field" />
      <span className="landing-demo__field landing-demo__field--short" />
      <span className="landing-demo__check" aria-hidden="true">✓</span>
    </div>
  ),
  buscar: (
    <div className="landing-demo landing-demo--search">
      <span className="landing-demo__typing"><i /></span>
      <span className="landing-demo__chip" />
      <span className="landing-demo__chip" />
    </div>
  ),
  pedido: (
    <div className="landing-demo landing-demo--order">
      <span className="landing-demo__bag" />
      <span className="landing-demo__counter">1</span>
      <span className="landing-demo__track"><i /></span>
    </div>
  ),
}

/**
 * Portada pública. Vive siempre en tema oscuro: el contenedor
 * aplica el propio token `.dark`, sin depender de la preferencia guardada ni
 * del tema del resto de la aplicación.
 */
export const LandingPage = () => {
  const reduce = useReducedMotion()
  const landingRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const bentoRef = useRef<HTMLUListElement | null>(null)
  const pasosRef = useRef<HTMLDivElement | null>(null)
  const pasosListaRef = useRef<HTMLOListElement | null>(null)

  // El tono se aplica al nodo raíz sin provocar un render de la portada.
  const onToneChange = useCallback((next: string) => {
    if (landingRef.current) landingRef.current.dataset.tone = next
  }, [])

  const irASeccion = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth', block: 'start',
    })
  }

  const departamentos = useMemo(() => {
    const publicados = realProducts.filter((product) =>
      product.publicado !== false && !product.archivado)
    const conteo = new Map<string, number>()
    const estrella = new Map<string, Product>()
    for (const product of publicados) {
      conteo.set(product.categoria, (conteo.get(product.categoria) ?? 0) + 1)
      if (localImageFor(product.id) && !estrella.has(product.categoria)) {
        estrella.set(product.categoria, product)
      }
    }
    const visibles = DEFAULT_CATEGORIES
      .map((nombre) => ({
        nombre, total: conteo.get(nombre) ?? 0,
        icon: CATEGORY_ICONS[nombre] ?? Boxes,
        estrella: estrella.get(nombre),
      }))
      .filter((item) => item.total >= 4)
    const otros = [...conteo.entries()]
      .filter(([nombre, total]) => total >= 4 && !DEFAULT_CATEGORIES.includes(nombre))
      .map(([nombre, total]) => ({
        nombre, total, icon: Sparkles, estrella: undefined as Product | undefined,
      }))
    return [...visibles, ...otros]
  }, [])

  const cierre = useMemo(() => {
    const producto = PRODUCT_BY_ID.get('dj-106')
    return producto && localImageFor(producto.id) ? producto : undefined
  }, [])

  useEffect(() => {
    const ids = ['escaparate', 'como-funciona', 'departamentos']
    const observer = new IntersectionObserver((entries) => {
      const activo = entries.find((entry) => entry.isIntersecting)
      if (!activo) return
      for (const button of navRef.current?.querySelectorAll('button') ?? []) {
        const current = button.dataset.section === activo.target.id
        button.classList.toggle('is-active', current)
        if (current) button.setAttribute('aria-current', 'true')
        else button.removeAttribute('aria-current')
      }
    }, { rootMargin: '-28% 0px -62% 0px' })
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = pasosRef.current
    if (!element) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        pasosListaRef.current?.classList.add('is-inview')
        observer.disconnect()
      }
    }, { threshold: 0.15 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const onBentoMove = (event: PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== 'mouse' || !bentoRef.current) return
    const rect = bentoRef.current.getBoundingClientRect()
    bentoRef.current.style.setProperty('--bento-x', `${event.clientX - rect.left}px`)
    bentoRef.current.style.setProperty('--bento-y', `${event.clientY - rect.top}px`)
  }

  const navIds: Array<{ id: string; label: string }> = [
    { id: 'escaparate', label: 'Escaparate' },
    { id: 'como-funciona', label: 'Cómo funciona' },
    { id: 'departamentos', label: 'Departamentos' },
  ]

  return (
    <div ref={landingRef} className="landing dark" data-tone="accesorios">
      <LivingBackground />
      <header className="landing-nav">
        <div className="landing__wrap landing-nav__inner">
          <Link className="landing-brand" to="/" aria-label={`${BRAND.name}, inicio`}>
            <span className="landing-brand__mark" aria-hidden="true">{brandInitial()}</span>
            {BRAND.name}
          </Link>
          <nav ref={navRef} className="landing-nav__links" aria-label="Navegación de la portada">
            {navIds.map(({ id, label }, index) => (
              <button
                key={id}
                type="button"
                data-section={id}
                className={index === 0 ? 'is-active' : undefined}
                aria-current={index === 0 ? 'true' : undefined}
                onClick={() => irASeccion(id)}
              >
                {label}
              </button>
            ))}
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
          <HeroScene onToneChange={onToneChange} />
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
          </div>
          <div className="landing__wrap landing-hero__scroll" aria-hidden="true">
            <span>Desliza para explorar</span>
          </div>
        </motion.section>

        <Showcase reduce={reduce} />

        <section className="landing-bento landing__wrap" aria-labelledby="landing-bento-title">
          <Reveal className="landing-section__head">
            <p className="landing-eyebrow">Por qué {BRAND.name}</p>
            <h2 className="landing-section__title" id="landing-bento-title">
              Pequeños detalles, gran diferencia
            </h2>
          </Reveal>
          <motion.ul
            ref={bentoRef}
            className="landing-bento__surface"
            onPointerMove={onBentoMove}
            initial={reduce ? undefined : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: reduce ? 0.12 : 0.42, ease: easeOut }}
          >
            {BENEFICIOS.map(({ icon: Icon, titulo, texto, area, micro }) => (
              <li
                key={titulo}
                className={`landing-bento__card landing-bento__card--${area}`}
                data-micro={micro}
              >
                <span className="landing-bento__icon">
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span className="landing-bento__micro" aria-hidden="true"><i /><i /><i /></span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </motion.ul>
        </section>

        <section className="landing-steps" id="como-funciona" aria-labelledby="landing-steps-title">
          <div className="landing__wrap" ref={pasosRef}>
            <Reveal className="landing-section__head">
              <p className="landing-eyebrow">Cómo funciona</p>
              <h2 className="landing-section__title" id="landing-steps-title">
                Tres pasos y ya está
              </h2>
            </Reveal>
            <ol ref={pasosListaRef} className="landing-steps__grid">
              {PASOS.map((paso, index) => (
                <li
                  className={`landing-step${reduce ? ' is-inview' : ''}`}
                  key={paso.titulo}
                  style={reduce ? undefined : { transitionDelay: `${index * 80}ms` }}
                >
                  <span className="landing-step__ghost" aria-hidden="true">0{index + 1}</span>
                  <div className="landing-step__demo" aria-hidden="true">{demoMarkup[paso.demo]}</div>
                  <span className="landing-step__number">0{index + 1} · Paso</span>
                  <h3>{paso.titulo}</h3>
                  <p>{paso.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-departments landing__wrap" id="departamentos" aria-labelledby="landing-departments-title">
          <Reveal className="landing-section__head">
            <p className="landing-eyebrow">Departamentos</p>
            <h2 className="landing-section__title" id="landing-departments-title">
              Explora a tu manera
            </h2>
          </Reveal>
          <Reveal className="landing-departments__track" as="ul">
            {departamentos.map(({ nombre, total, icon: Icon, estrella }) => (
              <li key={nombre}>
                <Link className="landing-department" to="/cuenta/registro">
                  <span className="landing-department__stage">
                    {estrella
                      ? <ProductImage product={estrella} />
                      : <Icon size={44} strokeWidth={1.4} aria-hidden="true" />}
                  </span>
                  <span className="landing-department__name">{nombre}</span>
                  <span className="landing-department__count">
                    {total} {pluralize(total, 'producto', 'productos')}
                  </span>
                </Link>
              </li>
            ))}
          </Reveal>
        </section>

        <section className="landing-close" aria-labelledby="landing-close-title">
          {cierre && (
            <span className="landing-close__float" aria-hidden="true">
              <img
                src={localImageFor(cierre.id)?.src}
                alt=""
                loading="eager"
                decoding="sync"
              />
            </span>
          )}
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

const easeOut = [0.22, 1, 0.36, 1] as const
