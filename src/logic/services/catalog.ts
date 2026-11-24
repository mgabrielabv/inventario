import { normalizeText } from './formatters'
import { getAvailable } from './stock'
import type { Order, Product } from '../types'

export type SortKey =
  | 'destacados' | 'precio-asc' | 'precio-desc' | 'nombre' | 'descuento' | 'recientes'
export const SORT_KEYS: SortKey[] = [
  'destacados', 'precio-asc', 'precio-desc', 'nombre', 'descuento', 'recientes',
]

export const SORT_LABELS: Record<SortKey, string> = {
  destacados: 'Relevancia', 'precio-asc': 'Menor precio', 'precio-desc': 'Mayor precio',
  nombre: 'Nombre A-Z', descuento: 'Mayor descuento', recientes: 'Más recientes',
}

/** Densidad de la rejilla: afecta solo al tamaño de las tarjetas. */
export type Density = 'comoda' | 'compacta'
export const DENSITIES: Density[] = ['comoda', 'compacta']
export const DENSITY_LABELS: Record<Density, string> = {
  comoda: 'Cómoda', compacta: 'Compacta',
}

export interface CatalogFilters {
  q: string
  cat: string
  solo: boolean
  min: number | null
  max: number | null
  orden: SortKey
  densidad: Density
  /** Campos nuevos: opcionales para no romper llamadores existentes. */
  pagina?: number
  enOferta?: boolean
  marca?: string
  subcategoria?: string
}

export const defaultFilters = (): CatalogFilters => ({
  q: '', cat: 'Todas', solo: false, min: null, max: null, orden: 'destacados', densidad: 'comoda',
  pagina: 1, enOferta: false, marca: 'Todas', subcategoria: 'Todas',
})

const finite = (value: string | null): number | null => {
  if (value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const positivePage = (value: string | null): number => {
  const n = Number(value)
  return value !== null && Number.isInteger(n) && n > 0 ? n : 1
}

const selected = (value: string | null): string => (value && value !== 'Todas' ? value : 'Todas')

export const parseFilters = (search: string): CatalogFilters => {
  const params = new URLSearchParams(search.replace(/^\?/, ''))
  const orden = params.get('orden') as SortKey | null
  const densidad = params.get('densidad') as Density | null
  return {
    q: params.get('q') ?? '',
    // `categoria` es la forma canónica; `cat` se admite por enlaces antiguos.
    cat: selected(params.get('categoria') ?? params.get('cat')),
    solo: params.get('solo') === '1',
    enOferta: params.get('enOferta') === '1',
    min: finite(params.get('min')),
    max: finite(params.get('max')),
    orden: orden && SORT_KEYS.includes(orden) ? orden : 'destacados',
    densidad: densidad && DENSITIES.includes(densidad) ? densidad : 'comoda',
    pagina: positivePage(params.get('pagina')),
    marca: selected(params.get('marca')),
    subcategoria: selected(params.get('subcategoria')),
  }
}

export const serializeFilters = (filters: CatalogFilters): string => {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.cat !== 'Todas') params.set('categoria', filters.cat)
  if (filters.solo) params.set('solo', '1')
  if (filters.enOferta) params.set('enOferta', '1')
  if (filters.min !== null) params.set('min', String(filters.min))
  if (filters.max !== null) params.set('max', String(filters.max))
  if (filters.orden !== 'destacados') params.set('orden', filters.orden)
  if (filters.densidad !== 'comoda') params.set('densidad', filters.densidad)
  if ((filters.pagina ?? 1) > 1) params.set('pagina', String(filters.pagina))
  if (filters.marca && filters.marca !== 'Todas') params.set('marca', filters.marca)
  if (filters.subcategoria && filters.subcategoria !== 'Todas') {
    params.set('subcategoria', filters.subcategoria)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const activeFilterChips = (f: CatalogFilters): Array<{ key: string; label: string }> => {
  const chips: Array<{ key: string; label: string }> = []
  if (f.q.trim()) chips.push({ key: 'q', label: `Búsqueda: ${f.q.trim()}` })
  if (f.cat !== 'Todas') chips.push({ key: 'cat', label: f.cat })
  if (f.solo) chips.push({ key: 'solo', label: 'Solo disponibles' })
  if (f.enOferta) chips.push({ key: 'enOferta', label: 'En oferta' })
  if (f.marca && f.marca !== 'Todas') chips.push({ key: 'marca', label: `Marca: ${f.marca}` })
  if (f.subcategoria && f.subcategoria !== 'Todas') {
    chips.push({ key: 'subcategoria', label: `Tipo: ${f.subcategoria}` })
  }
  if (f.min !== null || f.max !== null) {
    chips.push({ key: 'precio', label: `Precio ${f.min ?? 0} – ${f.max ?? '∞'}` })
  }
  return chips
}

/** `marca`/`subcategoria` aún no están en el tipo Product: acceso defensivo. */
const metaValue = (product: Product, key: 'marca' | 'subcategoria'): string => {
  const value = (product as Product & { marca?: unknown; subcategoria?: unknown })[key]
  return typeof value === 'string' ? value.trim() : ''
}

const discountRate = (product: Product): number => {
  const before = product.precioAnterior
  const price = product.precio ?? 0
  return before !== null && before > price && before > 0 ? 1 - price / before : 0
}

export const filterCatalog = (
  products: Product[], filters: CatalogFilters, orders: Order[],
): Product[] => {
  const q = normalizeText(filters.q.trim())
  const visible = products.filter((p) => !p.archivado && p.publicado && p.precio !== null)

  const result = visible.filter((p) => {
    if (filters.cat !== 'Todas' && p.categoria !== filters.cat) return false
    const available = getAvailable(p, orders)
    if (filters.solo && available <= 0) return false
    if (filters.enOferta && discountRate(p) <= 0) return false
    if (filters.marca && filters.marca !== 'Todas' && metaValue(p, 'marca') !== filters.marca) {
      return false
    }
    if (filters.subcategoria && filters.subcategoria !== 'Todas'
      && metaValue(p, 'subcategoria') !== filters.subcategoria) return false
    if (filters.min !== null && (p.precio ?? 0) < filters.min) return false
    if (filters.max !== null && (p.precio ?? 0) > filters.max) return false
    if (!q) return true
    const haystack = normalizeText([
      p.nombre, p.descripcionCorta, p.descripcion, p.codigo,
      p.categoria, p.etiquetas.join(' '), metaValue(p, 'marca'), metaValue(p, 'subcategoria'),
    ].join(' '))
    return haystack.includes(q)
  })

  const byPrice = (a: Product, b: Product): number => (a.precio ?? 0) - (b.precio ?? 0)
  const byName = (a: Product, b: Product): number => a.nombre.localeCompare(b.nombre, 'es')
  switch (filters.orden) {
    case 'precio-asc': return result.sort(byPrice)
    case 'precio-desc': return result.sort((a, b) => -byPrice(a, b))
    case 'nombre': return result.sort(byName)
    case 'descuento': return result.sort((a, b) => discountRate(b) - discountRate(a) || byName(a, b))
    case 'recientes': return result.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    case 'destacados':
    default:
      return result.sort((a, b) => Number(b.destacado) - Number(a.destacado) || byName(a, b))
  }
}

export const PAGE_SIZE = 24

/* --- Ayudas puras del rediseño -------------------------------------------- */

export type BadgeKind = 'oferta' | 'nuevo' | 'ultimas'
export interface ProductBadge { kind: BadgeKind; label: string }

/** Una sola insignia por tarjeta, en orden de prioridad. Sin urgencia inventada. */
export const productBadge = (
  product: Product, available: number, now: Date = new Date(),
): ProductBadge | null => {
  if (product.precioAnterior !== null && product.precioAnterior > (product.precio ?? 0)) {
    return { kind: 'oferta', label: 'Oferta' }
  }
  const dias = (now.getTime() - new Date(product.creadoEn).getTime()) / 86_400_000
  const esNuevo = product.etiquetas.some((tag) => normalizeText(tag) === 'nuevo')
    || (Number.isFinite(dias) && dias >= 0 && dias <= 21)
  if (esNuevo) return { kind: 'nuevo', label: 'Nuevo' }
  if (available > 0 && available <= 5) return { kind: 'ultimas', label: `Últimas ${available}` }
  return null
}

export interface PriceRange { min: number; max: number }

/** Límites redondeados a decenas para el control deslizante doble. */
export const priceBounds = (products: Product[]): PriceRange => {
  const prices = products
    .filter((product) => !product.archivado && product.publicado && product.precio !== null)
    .map((product) => product.precio as number)
  if (prices.length === 0) return { min: 0, max: 100 }
  const min = Math.floor(Math.min(...prices) / 10) * 10
  const max = Math.ceil(Math.max(...prices) / 10) * 10
  return { min, max: Math.max(max, min + 10) }
}

/** Mantiene min <= max y ambos dentro de los límites disponibles. */
export const clampPriceRange = (
  min: number | null, max: number | null, bounds: PriceRange,
): { min: number; max: number } => {
  const low = min === null ? bounds.min : Math.max(bounds.min, Math.min(bounds.max, min))
  const high = max === null ? bounds.max : Math.max(bounds.min, Math.min(bounds.max, max))
  return low <= high ? { min: low, max: high } : { min: high, max: low }
}

export interface CategoryTile {
  categoria: string
  total: number
  sample: Product | null
}

/** Mosaicos de categoría con una muestra real; solo productos visibles. */
export const categoryTiles = (products: Product[]): CategoryTile[] => {
  const visible = products.filter((product) => !product.archivado && product.publicado)
  const map = new Map<string, CategoryTile>()
  for (const product of visible) {
    const current = map.get(product.categoria) ?? {
      categoria: product.categoria, total: 0, sample: product,
    }
    current.total += 1
    map.set(product.categoria, current)
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria, 'es'))
}

/** Coincidencias rápidas para la búsqueda en vivo, reutilizando el filtro. */
export const suggestProducts = (
  products: Product[], query: string, orders: Order[], limit = 6,
): Product[] => {
  if (!query.trim()) return []
  return filterCatalog(products, { ...defaultFilters(), q: query }, orders).slice(0, limit)
}
