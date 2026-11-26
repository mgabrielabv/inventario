import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, LayoutGrid, Package, Search, X } from 'lucide-react'
import {
  useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { storageKey } from '../../config/brand'
import { useInventoryStore } from '../../logic/store/inventory'
import { useSettingsStore } from '../../logic/store/settings'
import { normalizeText } from '../../logic/services/formatters'
import { formatMoney } from '../../logic/services/pricing'
import { dur } from '../../motion/tokens'
import { localImageFor } from '../../logic/services/local-images'
import type { Product } from '../../logic/types'
import '../../styles/search-island.css'

/* Isla de búsqueda: un solo contenedor con borde y fondo. El input es
   transparente y el botón vive dentro de la píldora, sin escalones. */

type Match = {
  id: string
  label: string
  detail: string
  to: string
  group: 'Categorías' | 'Productos'
  price?: string
  image?: string
}

interface Props {
  /** Variante a pantalla completa: reutiliza la misma isla y su CSS. */
  expanded?: boolean
  size?: number
}

const extraText = (product: Product): string => {
  let value = ''
  if ('subcategoria' in product && typeof product.subcategoria === 'string') {
    value += ` ${product.subcategoria}`
  }
  if ('marca' in product && typeof product.marca === 'string') {
    value += ` ${product.marca}`
  }
  return value.trim()
}

const searchText = (product: Product): string => normalizeText([
  product.nombre, product.categoria, ...product.etiquetas, extraText(product),
].join(' '))

const DEBOUNCE_MS = 120

export const SearchIsland = ({ expanded = false, size = 6 }: Props) => {
  const [query, setQuery] = useState('')
  const [term, setTerm] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(expanded)
  const root = useRef<HTMLDivElement | null>(null)
  const input = useRef<HTMLInputElement | null>(null)
  const panelId = useId()
  const navigate = useNavigate()
  const products = useInventoryStore((state) => state.products)
  const categories = useSettingsStore((state) => state.settings.catalogo.categorias)
  const reduce = useReducedMotion()
  const visible = expanded || open

  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(query), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (expanded) input.current?.focus()
  }, [expanded])

  useEffect(() => setActive(0), [term])

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  useEffect(() => {
    if (!expanded) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded])

  const matches = useMemo<Match[]>(() => {
    const q = normalizeText(term.trim())
    const categoryMatches: Match[] = categories
      .filter((category) => !q || normalizeText(category).includes(q))
      .slice(0, q ? 3 : 3)
      .map((category) => ({
        id: `cat-${category}`,
        label: category,
        detail: 'Ver productos',
        to: `/tienda?categoria=${encodeURIComponent(category)}`,
        group: 'Categorías' as const,
      }))
    const pool = products.filter((product) => product.publicado && !product.archivado
      && product.precio !== null && (!q || searchText(product).includes(q)))
    const chosen = (q ? pool : pool.filter((product) => product.destacado))
    const productMatches: Match[] = (chosen.length ? chosen : pool).slice(0, size).map((product) => ({
      id: product.id,
      label: product.nombre,
      detail: [product.categoria, ...product.etiquetas.slice(0, 1)]
        .filter(Boolean).join(' · '),
      to: `/tienda/${product.slug}`,
      group: 'Productos' as const,
      price: formatMoney(product.precio ?? 0),
      image: localImageFor(product.id)?.src,
    }))
    return [...categoryMatches, ...productMatches]
  }, [term, categories, products, size])

  const go = (match: Match) => {
    setOpen(false)
    navigate(match.to)
  }

  const submit = () => {
    const text = query.trim()
    if (text) {
      try {
        const recent = JSON.parse(localStorage.getItem(storageKey('recent-searches')) ?? '[]') as string[]
        localStorage.setItem(storageKey('recent-searches'), JSON.stringify(
          [text, ...recent.filter((item) => item !== text)].slice(0, 6),
        ))
      } catch { /* sin almacenamiento */ }
    }
    const match = visible ? matches[active] : undefined
    if (text && match) go(match)
    else {
      setOpen(false)
      navigate(text ? `/tienda?q=${encodeURIComponent(text)}` : '/tienda')
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((value) => Math.min(value + 1, Math.max(0, matches.length - 1)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((value) => Math.max(0, value - 1))
    }
  }

  const activeId = visible && matches.length ? `${panelId}-item-${active}` : undefined

  return (
    <div ref={root} className={`search-island-root${expanded ? ' search-island-root--expanded' : ''}`}>
      <form
        role="search"
        className="search-island"
        onSubmit={onSubmit}
        data-state={visible ? 'open' : 'rest'}
      >
        <Search size={19} strokeWidth={1.8} className="search-island__icon" aria-hidden="true" />
        <input
          ref={input}
          className="search-island__input"
          type="search"
          role="combobox"
          value={query}
          placeholder="Busca por nombre, categoría o etiqueta"
          aria-label="Buscar productos"
          aria-expanded={visible}
          aria-controls={panelId}
          aria-activedescendant={activeId}
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button
            type="button"
            className="search-island__clear"
            aria-label="Limpiar búsqueda"
            onClick={() => { setQuery(''); setTerm(''); setActive(0); input.current?.focus() }}
          >
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
        <button type="submit" className="search-island__submit">Buscar</button>
      </form>
      <AnimatePresence>
        {visible && (
          <motion.div
            id={panelId}
            className="search-island__panel"
            role="listbox"
            aria-label="Sugerencias de búsqueda"
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 6 }}
            transition={{ duration: reduce ? 0 : dur.fast }}
          >
            {matches.length === 0 ? (
              <p className="search-island__empty">No hay sugerencias para “{query}”.</p>
            ) : matches.map((match, index) => (
              <div key={match.id} role="presentation">
                {(index === 0 || matches[index - 1]!.group !== match.group) && (
                  <p className="search-island__label" role="presentation">{match.group}</p>
                )}
                <button
                  type="button"
                  id={`${panelId}-item-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={`search-island__item${index === active ? ' search-island__item--active' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(match)}
                >
                  <span className="search-island__thumb" aria-hidden="true">
                    {match.image
                      ? <img src={match.image} alt="" />
                      : match.group === 'Categorías'
                        ? <LayoutGrid size={17} />
                        : <Package size={17} />}
                  </span>
                  <span className="search-island__text">
                    <span className="search-island__title">{match.label}</span>
                    <span className="search-island__meta">{match.detail}</span>
                  </span>
                  {match.price && <span className="search-island__price">{match.price}</span>}
                </button>
              </div>
            ))}
            <button type="button" className="search-island__all" onClick={submit}>
              Ver todos los resultados <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
