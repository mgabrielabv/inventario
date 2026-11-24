import { useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from './ProductCard'
import type { Product } from '../../logic/types'

export interface HomeRailItem {
  product: Product
  available: number
}

interface Props {
  id: string
  titulo: string
  descripcion?: string
  items: HomeRailItem[]
  verTodo?: { label: string; to: string }
  cargando?: boolean
  vacio?: string
}

const PLACEHOLDERS = [0, 1, 2, 3, 4]
const RAIL_GAP = 12

/** Riel de productos con scroll-snap y controles accesibles. */
export const HomeRail = ({
  id, titulo, descripcion, items, verTodo, cargando = false,
  vacio = 'Pronto tendremos productos aquí.',
}: Props) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion() === true
  const [edges, setEdges] = useState({ prev: false, next: true })

  const syncEdges = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setEdges({
      prev: track.scrollLeft > 4,
      next: track.scrollLeft + track.clientWidth < track.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    syncEdges()
    window.addEventListener('resize', syncEdges)
    return () => window.removeEventListener('resize', syncEdges)
  }, [syncEdges, items.length, cargando])

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>('.eshop-rail__item')
    const step = card ? card.getBoundingClientRect().width + RAIL_GAP : track.clientWidth * 0.8
    track.scrollBy({ left: direction * step, behavior: reduce ? 'auto' : 'smooth' })
  }

  const headingId = `${id}-titulo`
  const trackId = `${id}-productos`
  const disableArrows = cargando || items.length === 0

  return (
    <section className="eshop-rail" aria-labelledby={headingId}>
      <header className="eshop-rail__head">
        <div className="eshop-rail__headings">
          <h2 className="eshop-rail__title" id={headingId}>{titulo}</h2>
          {descripcion && <p className="eshop-rail__description">{descripcion}</p>}
        </div>
        <div className="eshop-rail__tools">
          {verTodo && (
            <Link className="eshop-rail__all" to={verTodo.to}>{verTodo.label}</Link>
          )}
          <div className="eshop-rail__arrows">
            <button
              type="button"
              className="eshop-rail__arrow"
              aria-label={`Desplazarse hacia atrás en ${titulo}`}
              aria-controls={trackId}
              disabled={disableArrows || !edges.prev}
              onClick={() => scroll(-1)}
            >
              <ChevronLeft size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="eshop-rail__arrow"
              aria-label={`Desplazarse hacia adelante en ${titulo}`}
              aria-controls={trackId}
              disabled={disableArrows || !edges.next}
              onClick={() => scroll(1)}
            >
              <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {cargando && <span className="eshop-sr-only" role="status">Cargando {titulo}</span>}
      <div
        className="eshop-rail__track"
        id={trackId}
        ref={trackRef}
        role="list"
        aria-label={titulo}
        aria-busy={cargando}
        onScroll={syncEdges}
      >
        {cargando ? PLACEHOLDERS.map((key) => (
          <li className="eshop-rail__item eshop-rail__skeleton" key={key} aria-hidden="true">
            <span className="eshop-rail__skeleton-media" />
            <span className="eshop-rail__skeleton-line" />
            <span className="eshop-rail__skeleton-line eshop-rail__skeleton-line--short" />
          </li>
        )) : items.length === 0 ? (
          <li className="eshop-rail__item eshop-rail__empty" role="listitem">{vacio}</li>
        ) : items.map(({ product, available }) => (
          <li className="eshop-rail__item" role="listitem" key={product.id}>
            <ProductCard product={product} available={available} compact />
          </li>
        ))}
      </div>
    </section>
  )
}
