import {
  useEffect, useMemo, useRef, useState,
  type CSSProperties, type FocusEvent, type PointerEvent as ReactPointerEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { usePerformanceTier } from '../../motion/hooks/usePerformanceTier'
import { heroSceneMotion } from '../../motion/tokens'
import { localImageFor } from '../../logic/services/local-images'
import { realProducts } from '../../logic/services/real-products'
import type { Product } from '../../logic/types'

type SceneProduct = { product: Product; src: string }

type Placement = {
  id: string
  x: number
  y: number
  mx: number
  my: number
  size: string
  depth: number
  tilt: number
  duration: number
  delay: number
  dx: number
  dy: number
}

const HERO_IDS = ['dj-101', 'dj-123', 'dj-106', 'dj-114']
const SATELLITES: Placement[] = [
  { id: 'dj-100', x: 57, y: 6, mx: 8, my: 4, size: 'clamp(72px, 8vw, 116px)', depth: 0.2, tilt: -4, duration: 8.4, delay: -1.2, dx: -90, dy: -70 },
  { id: 'dj-103', x: 79, y: 12, mx: 66, my: 2, size: 'clamp(84px, 10vw, 148px)', depth: 0.5, tilt: 5, duration: 9.6, delay: -3.4, dx: 120, dy: -90 },
  { id: 'dj-105', x: 49, y: 59, mx: 2, my: 44, size: 'clamp(68px, 7vw, 104px)', depth: 0.3, tilt: 3, duration: 7.8, delay: -2.1, dx: -130, dy: 60 },
  { id: 'dj-107', x: 84, y: 66, mx: 76, my: 56, size: 'clamp(80px, 9vw, 132px)', depth: 0.6, tilt: -3, duration: 10.2, delay: -4.6, dx: 150, dy: 90 },
  { id: 'dj-10', x: 65, y: 83, mx: 22, my: 76, size: 'clamp(70px, 8vw, 112px)', depth: 0.4, tilt: 6, duration: 8.8, delay: -0.7, dx: -60, dy: 130 },
  { id: 'dj-102', x: 91, y: 38, mx: 80, my: 26, size: 'clamp(90px, 11vw, 168px)', depth: 0.8, tilt: -5, duration: 11, delay: -5.2, dx: 190, dy: -20 },
  { id: 'dj-104', x: 45, y: 27, mx: 4, my: 20, size: 'clamp(64px, 7vw, 100px)', depth: 0.2, tilt: 4, duration: 7.2, delay: -1.9, dx: -160, dy: -40 },
  { id: 'dj-108', x: 73, y: 52, mx: 62, my: 66, size: 'clamp(76px, 8vw, 124px)', depth: 0.5, tilt: -6, duration: 9.1, delay: -3.8, dx: 70, dy: 120 },
  { id: 'dj-124', x: 54, y: 88, mx: 34, my: 84, size: 'clamp(88px, 10vw, 152px)', depth: 0.9, tilt: 3, duration: 10.6, delay: -2.8, dx: -110, dy: 170 },
]

const PRODUCT_BY_ID = new Map(realProducts.map((product) => [product.id, product]))
const resolve = (id: string): SceneProduct | null => {
  const product = PRODUCT_BY_ID.get(id)
  const src = localImageFor(id)?.src
  return product && src ? { product, src } : null
}
const HEROES = HERO_IDS.map(resolve).filter((item): item is SceneProduct => Boolean(item))
const ORBIT_ITEMS = SATELLITES
  .slice(0, 5)
  .map((item) => ({ ...item, scene: resolve(item.id) }))
  .filter((item): item is Placement & { scene: SceneProduct } => Boolean(item.scene))

const toneFor = (categoria: string): string => {
  if (categoria === 'Tecnología') return 'tecnologia'
  if (categoria === 'Accesorios') return 'accesorios'
  if (categoria === 'Hogar y cocina') return 'hogar'
  if (categoria === 'Deportes y aire libre') return 'deportes'
  if (categoria === 'Alimentos y bebidas') return 'alimentos'
  return 'cuidado'
}

interface FloatingProps {
  product: SceneProduct
  placement: Placement
  hero: boolean
  index: number
  tier: 'full' | 'lite' | 'static'
}

/** Una capa: parallax de puntero, entrada, flotación y foco/hover propios. */
const FloatingProduct = ({
  product, placement, hero, index, tier,
}: FloatingProps) => {
  const style = {
    '--hero-x': `${placement.x}%`,
    '--hero-y': `${placement.y}%`,
    '--hero-x-m': `${placement.mx}%`,
    '--hero-y-m': `${placement.my}%`,
    '--hero-size': placement.size,
    '--hero-size-m': hero ? 'clamp(210px, 58vw, 330px)' : placement.size,
    '--hero-depth': placement.depth,
    '--hero-fade': hero ? '1' : (0.62 + placement.depth * 0.38).toFixed(2),
    '--hero-enter-x': `${placement.dx * -0.5}px`,
    '--hero-enter-y': `${placement.dy * -0.5}px`,
    '--hero-enter-delay': `${index * 80}ms`,
    '--hero-float-duration': `${placement.duration}s`,
    '--hero-float-delay': `${placement.delay}s`,
    '--hero-float-travel': `${heroSceneMotion.travel * (0.5 + placement.depth)}px`,
    '--hero-tilt': `${placement.tilt}deg`,
  } as CSSProperties

  const setTilt = (element: HTMLElement, x: string, y: string) => {
    element.style.setProperty('--hero-tilt-x', x)
    element.style.setProperty('--hero-tilt-y', y)
  }
  const onTilt = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (tier !== 'full' || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    setTilt(
      event.currentTarget,
      `${((event.clientY - rect.top) / rect.height - 0.5) * -6}deg`,
      `${((event.clientX - rect.left) / rect.width - 0.5) * 6}deg`,
    )
  }
  const resetTilt = (
    event: ReactPointerEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>,
  ) => setTilt(event.currentTarget, '0deg', '0deg')

  return (
    <div className="hero-item__scroll">
      <div className={`hero-item${hero ? ' hero-item--hero' : ''}`} style={style}>
        <div className="hero-item__enter">
          <div className="hero-item__float">
            <Link
              className="hero-item__card"
              to="/cuenta/registro"
              aria-label={`${product.product.nombre} · créa tu cuenta para verlo`}
              onPointerMove={onTilt}
              onPointerLeave={resetTilt}
              onBlur={resetTilt}
            >
              <span className="hero-item__glow" aria-hidden="true" />
              <img
                className="hero-item__img"
                src={product.src}
                alt=""
                loading="eager"
                decoding="sync"
              />
              <span className="hero-item__shadow" aria-hidden="true" />
              <span className="hero-item__label" aria-hidden="true">
                <strong>{product.product.nombre}</strong>
                <small>{product.product.marca ?? product.product.categoria} · Crea tu cuenta para verlo</small>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  onToneChange?: (tone: string) => void
}

/**
 * Escena flotante de la portada: un producto héroe rotativo, satélites en
 * órbita y anillos finos. Todo decorativo salvo los enlaces a registro.
 */
export const HeroScene = ({ onToneChange }: Props) => {
  const tier = usePerformanceTier()
  const scene = useRef<HTMLDivElement | null>(null)
  const [heroIndex, setHeroIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const hero = HEROES[heroIndex % Math.max(1, HEROES.length)] ?? HEROES[0]
  const satellites = useMemo(
    () => tier === 'lite' ? ORBIT_ITEMS.slice(0, 3) : ORBIT_ITEMS,
    [tier],
  )

  useEffect(() => {
    if (hero) onToneChange?.(toneFor(hero.product.categoria))
  }, [hero, onToneChange])

  useEffect(() => {
    if (tier === 'static' || paused || HEROES.length < 2) return
    const timer = window.setInterval(
      () => setHeroIndex((index) => (index + 1) % HEROES.length),
      heroSceneMotion.rotateMs,
    )
    return () => window.clearInterval(timer)
  }, [tier, paused])

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const element = scene.current
    if (!element || tier !== 'full') return
    let frame = 0
    const target = { x: 0, y: 0 }
    const paint = () => {
      frame = 0
      element.style.setProperty('--hero-px', target.x.toFixed(3))
      element.style.setProperty('--hero-py', target.y.toFixed(3))
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const rect = element.getBoundingClientRect()
      target.x = (event.clientX - rect.left) / rect.width - 0.5
      target.y = (event.clientY - rect.top) / rect.height - 0.5
      if (!frame) frame = window.requestAnimationFrame(paint)
    }
    element.addEventListener('pointermove', onMove)
    return () => {
      element.removeEventListener('pointermove', onMove)
      window.cancelAnimationFrame(frame)
    }
  }, [tier])

  return (
    <div
      ref={scene}
      className={`hero-scene hero-scene--${tier}`}
      role="group"
      aria-label="Productos destacados"
      data-paused={paused || undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <svg className="hero-scene__orbits" viewBox="0 0 100 100" aria-hidden="true">
        <ellipse cx="68" cy="48" rx="42" ry="30" />
        <ellipse cx="68" cy="48" rx="30" ry="21" />
        <circle cx="68" cy="48" r="4.5" />
      </svg>
      {hero && (
        <FloatingProduct
          key={`hero-${hero.product.id}`}
          product={hero}
          placement={{
            id: hero.product.id,
            x: 61,
            y: 36,
            mx: 24,
            my: 22,
            size: 'clamp(260px, 39vw, 620px)',
            depth: 1,
            tilt: 3,
            duration: heroSceneMotion.floatMin + heroSceneMotion.floatJitter,
            delay: -1.4,
            dx: 40,
            dy: -60,
          }}
          hero
          index={0}
          tier={tier}
        />
      )}
      {satellites.map((item, index) => (
        <FloatingProduct
          key={item.id}
          product={item.scene}
          placement={item}
          hero={false}
          index={index + 1}
          tier={tier}
        />
      ))}
      {HEROES.length > 1 && tier !== 'static' && (
        <div className="hero-scene__dots" role="group" aria-label="Elegir producto destacado">
          {HEROES.map((item, index) => (
            <button
              key={item.product.id}
              type="button"
              className={`hero-scene__dot${index === heroIndex ? ' is-active' : ''}`}
              aria-label={`Ver ${item.product.nombre}`}
              aria-pressed={index === heroIndex}
              onClick={() => setHeroIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
