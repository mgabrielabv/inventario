import { LEGACY_CATEGORIES } from '../config/legacy'

export { LEGACY_CATEGORIES }

/** Facetas por departamento para el catálogo y la migración. */
export interface FacetFallback { subcategoria: string; marca: string }

const GENERIC_BRAND = 'Marca genérica'

/** Facetas por departamento; `General` cubre categorías desconocidas. */
export const FACET_FALLBACKS: Record<string, FacetFallback> = {
  Tecnología: { subcategoria: 'Cómputo', marca: GENERIC_BRAND },
  Accesorios: { subcategoria: 'Accesorios', marca: GENERIC_BRAND },
  'Alimentos y bebidas': { subcategoria: 'Despensa', marca: GENERIC_BRAND },
  'Hogar y cocina': { subcategoria: 'Hogar', marca: GENERIC_BRAND },
  'Deportes y aire libre': { subcategoria: 'Deportes', marca: GENERIC_BRAND },
  'Cuidado personal': { subcategoria: 'Cuidado', marca: GENERIC_BRAND },
  Electrónica: { subcategoria: 'Cómputo', marca: GENERIC_BRAND },
  Papelería: { subcategoria: 'Papelería', marca: GENERIC_BRAND },
  Hogar: { subcategoria: 'Hogar', marca: GENERIC_BRAND },
  Otras: { subcategoria: 'General', marca: GENERIC_BRAND },
  General: { subcategoria: 'General', marca: GENERIC_BRAND },
}

export const facetsFor = (categoria: string): FacetFallback =>
  FACET_FALLBACKS[categoria] ?? FACET_FALLBACKS.General
