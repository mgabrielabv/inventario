import { facetsFor, LEGACY_CATEGORIES } from '../../data/facets'
import type { Product } from '../types'

export { FACET_FALLBACKS } from '../../data/facets'

/** Actualiza departamentos antiguos y completa facetas vacías sin tocar el original. */
export const migrateProductFacets = (products: Product[]): Product[] =>
  products.map((product) => {
    const categoria = LEGACY_CATEGORIES[product.categoria] ?? product.categoria
    const fallback = facetsFor(categoria)
    const subcategoria = product.subcategoria?.trim()
    const marca = product.marca?.trim()
    return {
      ...product,
      categoria,
      subcategoria: subcategoria || fallback.subcategoria,
      marca: marca || fallback.marca,
    }
  })
