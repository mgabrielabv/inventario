import { normalizeText } from './formatters'
import { getAvailable } from './stock'
import type { Order, Product } from '../types'

export type SortKey = 'destacados' | 'precio-asc' | 'precio-desc' | 'nombre' | 'recientes'
export const SORT_KEYS: SortKey[] = ['destacados', 'precio-asc', 'precio-desc', 'nombre', 'recientes']

export const SORT_LABELS: Record<SortKey, string> = {
  destacados: 'Destacados', 'precio-asc': 'Precio ↑', 'precio-desc': 'Precio ↓',
  nombre: 'Nombre', recientes: 'Más recientes',
}

export interface CatalogFilters {
  q: string
  cat: string
  solo: boolean
  min: number | null
  max: number | null
  orden: SortKey
}

export const defaultFilters = (): CatalogFilters => ({
  q: '', cat: 'Todas', solo: false, min: null, max: null, orden: 'destacados',
})

const finite = (value: string | null): number | null => {
  if (value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export const parseFilters = (search: string): CatalogFilters => {
  const params = new URLSearchParams(search.replace(/^\?/, ''))
  const orden = params.get('orden') as SortKey | null
  return {
    q: params.get('q') ?? '',
    cat: params.get('cat') ?? 'Todas',
    solo: params.get('solo') === '1',
    min: finite(params.get('min')),
    max: finite(params.get('max')),
    orden: orden && SORT_KEYS.includes(orden) ? orden : 'destacados',
  }
}

export const serializeFilters = (filters: CatalogFilters): string => {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.cat !== 'Todas') params.set('cat', filters.cat)
  if (filters.solo) params.set('solo', '1')
  if (filters.min !== null) params.set('min', String(filters.min))
  if (filters.max !== null) params.set('max', String(filters.max))
  if (filters.orden !== 'destacados') params.set('orden', filters.orden)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const activeFilterChips = (f: CatalogFilters): Array<{ key: string; label: string }> => {
  const chips: Array<{ key: string; label: string }> = []
  if (f.q.trim()) chips.push({ key: 'q', label: `Búsqueda: ${f.q.trim()}` })
  if (f.cat !== 'Todas') chips.push({ key: 'cat', label: f.cat })
  if (f.solo) chips.push({ key: 'solo', label: 'Solo disponibles' })
  if (f.min !== null || f.max !== null) {
    chips.push({ key: 'precio', label: `Precio ${f.min ?? 0} – ${f.max ?? '∞'}` })
  }
  return chips
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
    if (filters.min !== null && (p.precio ?? 0) < filters.min) return false
    if (filters.max !== null && (p.precio ?? 0) > filters.max) return false
    if (!q) return true
    const haystack = normalizeText([
      p.nombre, p.descripcionCorta, p.descripcion, p.codigo,
      p.categoria, p.etiquetas.join(' '),
    ].join(' '))
    return haystack.includes(q)
  })

  const byPrice = (a: Product, b: Product): number => (a.precio ?? 0) - (b.precio ?? 0)
  switch (filters.orden) {
    case 'precio-asc': return result.sort(byPrice)
    case 'precio-desc': return result.sort((a, b) => -byPrice(a, b))
    case 'nombre': return result.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    case 'recientes': return result.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    case 'destacados':
    default:
      return result.sort((a, b) =>
        Number(b.destacado) - Number(a.destacado) || a.nombre.localeCompare(b.nombre, 'es'),
      )
  }
}

export const PAGE_SIZE = 24
