import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/store/ProductCard'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input, Select } from '../../components/ui/Field'
import { Segmented } from '../../components/ui/Segmented'
import { Switch } from '../../components/ui/Switch'
import { Reveal } from '../../motion/components/Reveal'
import {
  activeFilterChips, filterCatalog, parseFilters, serializeFilters,
  SORT_KEYS, SORT_LABELS,
} from '../../logic/services/catalog'
import type { CatalogFilters, SortKey } from '../../logic/services/catalog'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import { getAvailable } from '../../logic/services/stock'

const numeric = (raw: string): number | null => {
  if (raw.trim() === '') return null
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : null
}

export const CatalogPage = () => {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params.toString()), [params])
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const configuredCategories = useSettingsStore((state) => state.settings.catalogo.categorias)

  const results = useMemo(() => filterCatalog(products, filters, orders), [products, filters, orders])

  const categories = useMemo(() => [...new Set([
    'Todas', ...configuredCategories, ...products.map((product) => product.categoria), filters.cat,
  ])], [configuredCategories, products, filters.cat])

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

  return (
    <div className="catalog-page container-store">
      <header className="catalog-page__head">
        <p className="catalog-page__eyebrow t-min t-clay">Tienda</p>
        <h1 className="t-catalog">Catálogo</h1>
        <p className="t-subtitle">Filtra por nombre, categoría o precio.</p>
      </header>

      <section className="catalog-filters card" aria-label="Filtros del catálogo">
        <div className="catalog-filters__top">
          <Field label="Buscar" className="catalog-filters__search">
            {(id, describedBy) => (
              <Input
                id={id}
                type="search"
                value={filters.q}
                placeholder="Nombre, código o etiqueta"
                aria-describedby={describedBy || undefined}
                onChange={(event) => update({ q: event.target.value })}
              />
            )}
          </Field>

          <Field label="Ordenar por" className="catalog-filters__sort">
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
        </div>

        <div className="catalog-filters__categories">
          <span className="catalog-filters__label t-caption">Categoría</span>
          <Segmented
            size="sm"
            label="Categoría"
            value={filters.cat}
            options={categories.map((category) => ({ value: category, label: category }))}
            onChange={(cat) => update({ cat })}
          />
        </div>

        <div className="catalog-filters__bottom">
          <div className="catalog-filters__switch">
            <Switch
              checked={filters.solo}
              onChange={(solo) => update({ solo })}
              label="Solo disponibles"
            />
            <span className="t-caption">Solo disponibles</span>
          </div>

          <div className="catalog-filters__prices">
            <Field label="Desde">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder="0"
                  value={filters.min ?? ''}
                  onChange={(event) => update({ min: numeric(event.target.value) })}
                />
              )}
            </Field>
            <Field label="Hasta">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder="Sin límite"
                  value={filters.max ?? ''}
                  onChange={(event) => update({ max: numeric(event.target.value) })}
                />
              )}
            </Field>
          </div>
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
      </section>

      <div className="catalog-results">
        <p className="catalog-results__count t-caption">
          {results.length} {results.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {results.length > 0 ? (
        <Reveal className="catalog-grid" as="div">
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
    </div>
  )
}
