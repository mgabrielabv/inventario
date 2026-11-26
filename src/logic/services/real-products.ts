/* Productos reales descargados por scripts/seed-products.mjs.
   El JSON es la "tabla" local: se importa en el bundle y se fusiona con el
   catálogo persistido una sola vez, sin duplicar fichas ya existentes. */

import productosReales from '../../data/productos-reales.json'
import type { Product } from '../types'

export const realProducts = productosReales as unknown as Product[]

const PHOTO_HOSTS = /^https?:\/\/(cdn\.dummyjson\.com|images\.openfoodfacts\.org)\//i
const isImportedId = (product: Product): boolean =>
  product.id.startsWith('dj-') || product.id.startsWith('off-')

/** Solo fotos reales de las dos APIs; descarta SVGs, data URLs e ids locales. */
export const hasRealPhoto = (product: Product): boolean =>
  product.imagenes.some((image) => PHOTO_HOSTS.test(image.trim()))

export const isRealPhotoProduct = (product: Product): boolean =>
  isImportedId(product) && hasRealPhoto(product)

/**
 * Elimina fichas de relleno y cualquier producto sin foto real, y añade las
 * fichas importadas que falten. Compara por id y código para no duplicar.
 */
export const cleanImportedProducts = (products: Product[]): Product[] =>
  mergeRealProducts(products.filter(isRealPhotoProduct))

/**
 * Añade las fichas semilla reales que aún no estén en el catálogo.
 * Se compara por id y por código (SKU/código de barras) para no duplicar
 * registros aunque el usuario ya haya editado o borrado alguna ficha.
 */
export const mergeRealProducts = (products: Product[]): Product[] => {
  const ids = new Set<string>()
  const codigos = new Set<string>()
  for (const product of products) {
    ids.add(product.id)
    codigos.add(product.codigo)
  }
  const faltan = realProducts.filter(
    (product) => !ids.has(product.id) && !codigos.has(product.codigo),
  )
  return faltan.length ? [...products, ...faltan] : products
}
