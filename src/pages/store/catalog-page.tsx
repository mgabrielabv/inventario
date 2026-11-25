import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/store/ProductCard'
import { ProductImage } from '../../components/store/ProductImage'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Field, Input, Select } from '../../components/ui/Field'
import { Segmented } from '../../components/ui/Segmented'
import { Sheet } from '../../components/ui/Sheet'
import { Switch } from '../../components/ui/Switch'
import {
  activeFilterChips, categoryTiles, clampPriceRange, DENSITIES, DENSITY_LABELS,
  filterCatalog, PAGE_SIZE, parseFilters, priceBounds, serializeFilters, SORT_KEYS,
  SORT_LABELS, suggestProducts,
} from '../../logic/services/catalog'
import type {
  CatalogFilters, Density, PriceRange, SortKey,
} from '../../logic/services/catalog'
import { formatMoney } from '../../logic/services/pricing'
import { getAvailable } from '../../logic/services/stock'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import type { Product } from '../../logic/types'
import { distance, dur, ease, reduced } from '../../motion/tokens'

const SORT_OPTIONS = SORT_KEYS.filter((key) => key !== 'recientes')
const META_KEYS = ['marca', 'subcategoria'] as const

const metaValue = (product: Product, key: typeof META_KEYS[number]): string => {
  const value = (product as Product & { marca?: unknown; subcategoria?: unknown })[key]
  return typeof value === 'string' ? value.trim() : ''
}

const metaOptions = (products: Product[], key: typeof META_KEYS[number]): string[] =>
  [...new Set(products.map((product) => metaValue(product, key)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'))

interface FilterPanelProps {
  filters: CatalogFilters
  bounds: PriceRange
  range: { min: number; max: number }
  categories: string[]
  counts: Map<string, number>
  brands: string[]
  subtypes: string[]
  suggestions: Product[]
  searchOpen: boolean
  timer: { current: number | undefined }
  setSearchOpen: (open: boolean) => void
  onProduct: (slug: string) => void
  update: (patch: Partial<CatalogFilters>) => void
  onPrice: (which: 'min' | 'max', value: number) => void
  clear: () => void
}

/** Controles compartidos por la barra lateral y la hoja móvil. */
const FilterPanel = ({
  filters, bounds, range, categories, counts, brands, subtypes, suggestions,
  searchOpen, timer, setSearchOpen, onProduct, update, onPrice, clear,
}: FilterPanelProps) => {
  const span = Math.max(1, bounds.max - bounds.min)
  const fillLeft = ((range.min - bounds.min) / span) * 100
  const fillRight = 100 - ((range.max - bounds.min) / span) * 100

  return (
    <div className="eshop-filters">
      <div className="eshop-filters__search">
        <Field label="Buscar">
          {(id, describedBy) => (
            <Input
              id={id}
              type="search"
              value={filters.q}
              placeholder="Nombre, marca o categoría"
              aria-describedby={describedBy || undefined}
              autoComplete="off"
              inputMode="search"
              enterKeyHint="search"
              onFocus={() => { window.clearTimeout(timer.current); setSearchOpen(true) }}
              onBlur={() => {
                timer.current = window.setTimeout(() => setSearchOpen(false), 140)
              }}
              onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false) }}
              onChange={(event) => { update({ q: event.target.value }); setSearchOpen(true) }}
            />
          )}
        </Field>
        {searchOpen && filters.q.trim() && (
          <div className="eshop-filters__suggestions" role="listbox" aria-label="Sugerencias">
            {suggestions.length > 0 ? suggestions.map((product) => (
              <button
                key={product.id}
                type="button"
                role="option"
                aria-selected="false"
                className="eshop-filters__suggestion"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { setSearchOpen(false); onProduct(product.slug) }}
              >
                <ProductImage product={product} />
                <span className="eshop-filters__suggestion-name">{product.nombre}</span>
                <span className="eshop-filters__suggestion-price">
                  {formatMoney(product.precio ?? 0)}
                </span>
              </button>
            )) : (
              <p className="eshop-filters__no-suggestions">
                Sin coincidencias para «{filters.q}»
              </p>
            )}
          </div>
        )}
      </div>

      <fieldset className="eshop-filters__group">
        <legend>Categoría</legend>
        <div className="eshop-filters__options">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`eshop-filters__option${filters.cat === category ? ' is-active' : ''}`}
              aria-pressed={filters.cat === category}
              onClick={() => update({ cat: category })}
            >
              <span>{category}</span>
              <span className="eshop-filters__count">{counts.get(category) ?? 0}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="eshop-filters__group">
        <legend>Precio</legend>
        <div className="eshop-range">
          <div className="eshop-range__track" aria-hidden="true">
            <span
              className="eshop-range__fill"
              style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
            />
          </div>
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={1}
            value={range.min}
            aria-label="Precio mínimo"
            onChange={(event) => onPrice('min', Number(event.target.value))}
          />
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={1}
            value={range.max}
            aria-label="Precio máximo"
            onChange={(event) => onPrice('max', Number(event.target.value))}
          />
        </div>
        <div className="eshop-range__labels">
          <span>{formatMoney(range.min)}</span>
          <span>{formatMoney(range.max)}</span>
        </div>
      </fieldset>

      {brands.length > 0 && (
        <Field label="Marca">
          {(id) => (
            <Select
              id={id}
              value={filters.marca ?? 'Todas'}
              onChange={(event) => update({ marca: event.target.value })}
            >
              <option value="Todas">Todas las marcas</option>
              {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
            </Select>
          )}
        </Field>
      )}

      {subtypes.length > 0 && (
        <Field label="Tipo de producto">
          {(id) => (
            <Select
              id={id}
              value={filters.subcategoria ?? 'Todas'}
              onChange={(event) => update({ subcategoria: event.target.value })}
            >
              <option value="Todas">Todos los tipos</option>
              {subtypes.map((subtype) => <option key={subtype} value={subtype}>{subtype}</option>)}
            </Select>
          )}
        </Field>
      )}

      <div className="eshop-filters__toggles">
        <div className="eshop-filters__toggle">
          <Switch
            checked={filters.solo}
            onChange={(solo) => update({ solo })}
            label="Solo disponibles"
          />
          <span>Solo disponibles</span>
        </div>
        <div className="eshop-filters__toggle">
          <Switch
            checked={filters.enOferta ?? false}
            onChange={(enOferta) => update({ enOferta })}
            label="En oferta"
          />
          <span>En oferta</span>
        </div>
      </div>

      <button type="button" className="eshop-filters__clear" onClick={clear}>
        Limpiar todo
      </button>
    </div>
  )
}

export const CatalogPage = () => {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const search = params.toString()
  const filters = useMemo(() => parseFilters(search), [search])
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const configuredCategories = useSettingsStore((state) => state.settings.catalogo.categorias)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileFilters, setMobileFilters] = useState(false)
  const blurTimer = useRef<number | undefined>(undefined)

  const results = useMemo(() => filterCatalog(products, filters, orders), [products, filters, orders])
  const bounds = useMemo(() => priceBounds(products), [products])
  const range = clampPriceRange(filters.min, filters.max, bounds)
  const tiles = useMemo(() => categoryTiles(products), [products])
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    const visible = products.filter((p) => !p.archivado && p.publicado && p.precio !== null)
    map.set('Todas', visible.length)
    for (const tile of tiles) map.set(tile.categoria, tile.total)
    return map
  }, [products, tiles])
  const categories = useMemo(() => [...new Set([
    'Todas', ...configuredCategories, ...counts.keys(), filters.cat,
  ])], [configuredCategories, counts, filters.cat])
  const brands = useMemo(() => metaOptions(products, 'marca'), [products])
  const subtypes = useMemo(() => metaOptions(products, 'subcategoria'), [products])
  const suggestions = useMemo(
    () => searchOpen && filters.q.trim() ? suggestProducts(products, filters.q, orders) : [],
    [searchOpen, filters.q, products, orders],
  )
  const chips = activeFilterChips(filters)
  const page = filters.pagina ?? 1
  const shownCount = Math.min(results.length, page * PAGE_SIZE)
  const shown = results.slice(0, shownCount)

  const update = (patch: Partial<CatalogFilters>) => {
    const next: CatalogFilters = { ...filters, ...patch }
    if (patch.pagina === undefined) next.pagina = 1
    setParams(new URLSearchParams(serializeFilters(next)), { replace: true })
  }

  const clear = () => setParams(new URLSearchParams(), { replace: true })

  const removeChip = (key: string) => {
    if (key === 'q') update({ q: '' })
    else if (key === 'cat') update({ cat: 'Todas' })
    else if (key === 'solo') update({ solo: false })
    else if (key === 'enOferta') update({ enOferta: false })
    else if (key === 'marca') update({ marca: 'Todas' })
    else if (key === 'subcategoria') update({ subcategoria: 'Todas' })
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

  const panelProps: FilterPanelProps = {
    filters, bounds, range, categories, counts, brands, subtypes, suggestions,
    searchOpen, timer: blurTimer, setSearchOpen,
    onProduct: (slug) => navigate(`/tienda/${slug}`),
    update, onPrice, clear,
  }

  return (
    <div className="eshop-catalog">
      <div className="eshop-catalog__wrap">
        <nav className="eshop-crumbs" aria-label="Ruta de navegación">
          <ol className="eshop-crumbs__list">
            <li><Link to="/">Inicio</Link></li>
            <li className="eshop-crumbs__sep" aria-hidden="true">›</li>
            <li aria-current="page">{filters.cat === 'Todas' ? 'Catálogo' : filters.cat}</li>
          </ol>
        </nav>

        <header className="eshop-catalog__head">
          <div>
            <h1 className="eshop-catalog__title">Catálogo</h1>
            <p className="eshop-catalog__subtitle">
              Encuentra lo que necesitas y compáralo de un vistazo.
            </p>
          </div>
          <p className="eshop-catalog__total" aria-live="polite">
            {results.length} {results.length === 1 ? 'producto' : 'productos'}
          </p>
        </header>

        <div className="eshop-catalog__layout">
          <aside className="eshop-catalog__sidebar" aria-label="Filtros del catálogo">
            <FilterPanel {...panelProps} />
          </aside>

          <section className="eshop-catalog__results" aria-label="Resultados del catálogo">
            <div className="eshop-toolbar">
              <Button
                size="sm"
                variant="secondary"
                className="eshop-toolbar__filters"
                onClick={() => setMobileFilters(true)}
              >
                <SlidersHorizontal size={16} strokeWidth={1.7} aria-hidden="true" />
                Filtros
                {chips.length > 0 && (
                  <span className="eshop-toolbar__badge">{chips.length}</span>
                )}
              </Button>
              <div className="eshop-toolbar__count" role="status">
                {shownCount} de {results.length} {results.length === 1 ? 'producto' : 'productos'}
                {filters.cat !== 'Todas' ? ` · ${filters.cat}` : ''}
              </div>
              <div className="eshop-toolbar__controls">
                <Field label="Ordenar por">
                  {(id) => (
                    <Select
                      id={id}
                      value={filters.orden}
                      onChange={(event) => update({ orden: event.target.value as SortKey })}
                    >
                      {SORT_OPTIONS.map((key) => (
                        <option key={key} value={key}>{SORT_LABELS[key]}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Segmented
                  size="sm"
                  label="Densidad de la vista"
                  value={filters.densidad}
                  options={DENSITIES.map((value) => ({ value, label: DENSITY_LABELS[value] }))}
                  onChange={(densidad: Density) => update({ densidad })}
                />
              </div>
            </div>

            {chips.length > 0 && (
              <div className="eshop-chips" aria-label="Filtros activos">
                {chips.map((chip) => (
                  <Chip key={chip.key} active onRemove={() => removeChip(chip.key)}>
                    {chip.label}
                  </Chip>
                ))}
                <button type="button" className="eshop-chips__clear" onClick={clear}>
                  Limpiar todo
                </button>
              </div>
            )}

            {shown.length > 0 ? (
              <motion.div className={`eshop-grid eshop-grid--${filters.densidad}`}>
                <AnimatePresence initial={false}>
                  {shown.map((product) => (
                    <motion.div
                      key={product.id}
                      className="eshop-grid__cell"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: distance.rise }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={reduce
                        ? { duration: reduced.duration }
                        : { duration: dur.fast, ease: ease.easeOutQuint }}
                    >
                      <ProductCard product={product} available={getAvailable(product, orders)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="eshop-empty" role="status">
                <h2>No encontramos productos con estos filtros</h2>
                <p>
                  Revisa el término buscado, amplía el rango de precio o quita alguno de los filtros.
                </p>
                {tiles.length > 0 && (
                  <div className="eshop-empty__ideas">
                    <span>También puedes explorar:</span>
                    {tiles.slice(0, 3).map((tile) => (
                      <Link
                        key={tile.categoria}
                        to={`/tienda?categoria=${encodeURIComponent(tile.categoria)}`}
                      >
                        {tile.categoria}
                      </Link>
                    ))}
                  </div>
                )}
                <Link className="eshop-empty__reset" to="/tienda">Limpiar filtros</Link>
              </div>
            )}

            {shownCount < results.length && (
              <div className="eshop-more">
                <p>
                  Mostrando {shownCount} de {results.length} productos
                </p>
                <Button variant="secondary" onClick={() => update({ pagina: page + 1 })}>
                  Cargar más
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      <Sheet
        open={mobileFilters}
        onClose={() => setMobileFilters(false)}
        title="Filtros"
        side="bottom"
        className="eshop-filter-sheet"
      >
        <FilterPanel {...panelProps} />
        <Button full className="eshop-filter-sheet__done" onClick={() => setMobileFilters(false)}>
          Ver {results.length} {results.length === 1 ? 'producto' : 'productos'}
        </Button>
      </Sheet>
    </div>
  )
}
