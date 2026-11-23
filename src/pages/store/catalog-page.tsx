import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ProductArt } from '../../components/art/ProductArt'
import { ProductCard } from '../../components/store/ProductCard'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input, Select } from '../../components/ui/Field'
import { Segmented } from '../../components/ui/Segmented'
import { Switch } from '../../components/ui/Switch'
import { Reveal } from '../../motion/components/Reveal'
import {
  activeFilterChips, categoryTiles, clampPriceRange, DENSITIES, DENSITY_LABELS,
  filterCatalog, parseFilters, priceBounds, serializeFilters, SORT_KEYS, SORT_LABELS,
  suggestProducts,
} from '../../logic/services/catalog'
import type { CatalogFilters, Density, SortKey } from '../../logic/services/catalog'
import { formatMoney } from '../../logic/services/pricing'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import { getAvailable } from '../../logic/services/stock'

export const CatalogPage = () => {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params.toString()), [params])
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const configuredCategories = useSettingsStore((state) => state.settings.catalogo.categorias)
  const [searchOpen, setSearchOpen] = useState(false)
  const blurTimer = useRef<number | undefined>(undefined)

  const results = useMemo(() => filterCatalog(products, filters, orders), [products, filters, orders])
  const bounds = useMemo(() => priceBounds(products), [products])
  const range = clampPriceRange(filters.min, filters.max, bounds)
  const tiles = useMemo(() => categoryTiles(products), [products])
  const categories = useMemo(() => [...new Set([
    'Todas', ...configuredCategories, ...products.map((product) => product.categoria), filters.cat,
  ])], [configuredCategories, products, filters.cat])
  const suggestions = useMemo(
    () => searchOpen && filters.q.trim() ? suggestProducts(products, filters.q, orders) : [],
    [searchOpen, filters.q, products, orders],
  )
  const chips = activeFilterChips(filters)

  const update = (patch: Partial<CatalogFilters>) => {
    const next = serializeFilters({ ...filters, ...patch })
    setParams(new URLSearchParams(next), { replace: true })
  }

  const clear = () => setParams(new URLSearchParams(), { replace: true })

  const removeChip = (key: string) => {
    if (key === 'q') update({ q: '' })
    else if (key === 'cat') update({ cat: 'Todas' })
    else if (key === 'solo') update({ solo: false })
    else if (key === 'precio') update({ min: null, max: null })
  }

  const onPrice = (which: 'min' | 'max', value: number) => {
    const next = clampPriceRange(
      which === 'min' ? value : range.min,
      which === 'max' ? value : range.max,
      bounds,
    )
    update({ min: next.min, max: next.max })
  }

  return (
    <div className="catalog-page container-store">
      <header className="catalog-page__head">
        <p className="catalog-page__eyebrow t-min t-clay">Tienda</p>
        <h1 className="t-catalog">Catálogo</h1>
        <p className="t-subtitle">Explora por categoría, ajusta tu presupuesto y elige la vista que prefieras.</p>
      </header>

      <section className="catalog-tiles" aria-label="Categorías">
        <button
          type="button"
          className={`catalog-tile${filters.cat === 'Todas' ? ' is-active' : ''}`}
          onClick={() => update({ cat: 'Todas' })}
        >
          <span className="catalog-tile__all" aria-hidden="true">∞</span>
          <span className="t-caption t-strong">Todas</span>
          <span className="t-min">{products.length} productos</span>
        </button>
        {tiles.map((tile) => (
          <button
            key={tile.categoria}
            type="button"
            className={`catalog-tile${filters.cat === tile.categoria ? ' is-active' : ''}`}
            onClick={() => update({ cat: tile.categoria })}
          >
            {tile.sample && <ProductArt product={tile.sample} size={56} view="solo" />}
            <span className="t-caption t-strong">{tile.categoria}</span>
            <span className="t-min">{tile.total} {tile.total === 1 ? 'producto' : 'productos'}</span>
          </button>
        ))}
      </section>

      <div className="catalog-layout">
        <aside className="catalog-sidebar card" aria-label="Filtros del catálogo">
          <div className="catalog-sidebar__head">
            <h2 className="t-ui t-strong">Filtros</h2>
            {chips.length > 0 && (
              <button type="button" className="catalog-sidebar__clear t-caption" onClick={clear}>
                Limpiar todo
              </button>
            )}
          </div>

          <div className="catalog-search">
            <Field label="Buscar">
              {(id, describedBy) => (
                <Input
                  id={id}
                  type="search"
                  value={filters.q}
                  placeholder="Nombre, código o etiqueta"
                  aria-describedby={describedBy || undefined}
                  autoComplete="off"
                  onFocus={() => { window.clearTimeout(blurTimer.current); setSearchOpen(true) }}
                  onBlur={() => { blurTimer.current = window.setTimeout(() => setSearchOpen(false), 140) }}
                  onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false) }}
                  onChange={(event) => { update({ q: event.target.value }); setSearchOpen(true) }}
                />
              )}
            </Field>
            {searchOpen && filters.q.trim() && (
              <div className="catalog-search__overlay" role="listbox" aria-label="Sugerencias">
                {suggestions.length > 0 ? suggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    role="option"
                    aria-selected="false"
                    className="catalog-search__item"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => { setSearchOpen(false); navigate(`/tienda/${product.slug}`) }}
                  >
                    <ProductArt product={product} size={42} view="solo" />
                    <span className="catalog-search__name">
                      <span className="t-caption t-strong">{product.nombre}</span>
                      <span className="t-min">{product.codigo} · {product.categoria}</span>
                    </span>
                    <span className="t-caption price">{formatMoney(product.precio ?? 0)}</span>
                  </button>
                )) : (
                  <p className="catalog-search__empty t-caption">Sin coincidencias para «{filters.q}»</p>
                )}
              </div>
            )}
          </div>

          <fieldset className="catalog-sidebar__group">
            <legend className="t-caption t-strong">Categoría</legend>
            <div className="catalog-sidebar__options">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`catalog-sidebar__option${filters.cat === category ? ' is-active' : ''}`}
                  aria-pressed={filters.cat === category}
                  onClick={() => update({ cat: category })}
                >
                  {category}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="catalog-sidebar__group">
            <legend className="t-caption t-strong">Precio</legend>
            <div className="dual-range">
              <div className="dual-range__track" aria-hidden="true">
                <span
                  className="dual-range__fill"
                  style={{
                    left: `${((range.min - bounds.min) / (bounds.max - bounds.min)) * 100}%`,
                    right: `${100 - ((range.max - bounds.min) / (bounds.max - bounds.min)) * 100}%`,
                  }}
                />
              </div>
              <input
                type="range" min={bounds.min} max={bounds.max} step={1}
                value={range.min} aria-label="Precio mínimo"
                onChange={(event) => onPrice('min', Number(event.target.value))}
              />
              <input
                type="range" min={bounds.min} max={bounds.max} step={1}
                value={range.max} aria-label="Precio máximo"
                onChange={(event) => onPrice('max', Number(event.target.value))}
              />
            </div>
            <div className="dual-range__labels t-min">
              <span>{formatMoney(range.min)}</span>
              <span>{formatMoney(range.max)}</span>
            </div>
          </fieldset>

          <Switch
            checked={filters.solo}
            onChange={(solo) => update({ solo })}
            label="Solo disponibles"
          />

          <Field label="Ordenar por">
            {(id) => (
              <Select
                id={id}
                value={filters.orden}
                onChange={(event) => update({ orden: event.target.value as SortKey })}
              >
                {SORT_KEYS.map((key) => (
                  <option key={key} value={key}>{SORT_LABELS[key]}</option>
                ))}
              </Select>
            )}
          </Field>
        </aside>

        <section className="catalog-results-panel" aria-label="Resultados">
          <div className="catalog-toolbar">
            <p className="t-caption">
              {results.length} {results.length === 1 ? 'producto' : 'productos'}
              {filters.cat !== 'Todas' ? ` en ${filters.cat}` : ''}
            </p>
            <Segmented
              size="sm"
              label="Densidad de la vista"
              value={filters.densidad}
              options={DENSITIES.map((value) => ({ value, label: DENSITY_LABELS[value] }))}
              onChange={(densidad: Density) => update({ densidad })}
            />
          </div>

          {chips.length > 0 && (
            <div className="catalog-filters__chips" aria-label="Filtros activos">
              {chips.map((chip) => (
                <Chip key={chip.key} active onRemove={() => removeChip(chip.key)}>{chip.label}</Chip>
              ))}
              <button type="button" className="catalog-filters__clear t-caption" onClick={clear}>
                Limpiar todo
              </button>
            </div>
          )}

          {results.length > 0 ? (
            <Reveal className={`catalog-grid catalog-grid--${filters.densidad}`} as="div">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  available={getAvailable(product, orders)}
                />
              ))}
            </Reveal>
          ) : (
            <EmptyState
              title="No encontramos productos"
              description="Prueba con otros filtros o vuelve a ver todo el catálogo."
              action={<Button onClick={clear}>Quitar filtros</Button>}
            />
          )}
        </section>
      </div>
    </div>
  )
}
