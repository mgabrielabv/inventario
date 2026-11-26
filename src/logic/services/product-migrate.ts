import { facetsFor, LEGACY_CATEGORIES } from '../../data/facets'
import type { Product } from '../types'
import { clasificarImportado } from './category-rules'

export { FACET_FALLBACKS } from '../../data/facets'

const IMPORTADA = /^(dj|off)-/

/** Reubica las fichas importadas con las reglas compartidas con el sembrador. */
export const reclasificarImportados = (products: Product[]): Product[] =>
  products.map((product) => {
    if (!IMPORTADA.test(product.id)) return product
    const clase = clasificarImportado(product)
    return clase ? { ...product, ...clase } : product
  })

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
