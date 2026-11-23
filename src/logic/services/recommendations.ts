/* Recomendaciones deterministas a partir del propio catálogo y pedidos. */

import type { CartLine, Order, Product } from '../types'

const visible = (products: Product[]): Product[] =>
  products.filter((product) => !product.archivado && product.publicado && product.precio !== null)

/** Similares por categoría y, después, por precio cercano. */
export const relatedProducts = (
  product: Product, products: Product[], limit = 4,
): Product[] => {
  const pool = visible(products).filter((item) => item.id !== product.id)
  const precio = product.precio ?? 0
  return [...pool].sort((a, b) => {
    const sameCategory = Number(b.categoria === product.categoria) - Number(a.categoria === product.categoria)
    if (sameCategory !== 0) return sameCategory
    const range = (item: Product): number => Math.abs((item.precio ?? 0) - precio) / Math.max(1, precio)
    return range(a) - range(b) || a.nombre.localeCompare(b.nombre, 'es')
  }).slice(0, limit)
}

/** Productos que aparecieron en los mismos pedidos (sin contar cancelados). */
export const boughtTogether = (
  product: Product, orders: Order[], products: Product[], limit = 3,
): Product[] => {
  const counts = new Map<string, number>()
  for (const order of orders) {
    if (order.estado === 'Cancelado') continue
    if (!order.lineas.some((line) => line.productoId === product.id)) continue
    for (const line of order.lineas) {
      if (line.productoId !== product.id) {
        counts.set(line.productoId, (counts.get(line.productoId) ?? 0) + 1)
      }
    }
  }
  const pool = visible(products).filter((item) => item.id !== product.id)
  const found = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .flatMap(([id]) => pool.filter((item) => item.id === id))
    .slice(0, limit)
  if (found.length >= limit) return found
  const fallback = relatedProducts(product, products, limit - found.length)
    .filter((item) => !found.some((added) => added.id === item.id))
  return [...found, ...fallback].slice(0, limit)
}

/** Sugerencias del carrito: categorías ya elegidas, sin repetir lo que lleva. */
export const cartRecommendations = (
  lines: CartLine[], products: Product[], limit = 4,
): Product[] => {
  const inCart = new Set(lines.filter((line) => !line.guardado).map((line) => line.productoId))
  const categories = new Set(
    products.filter((product) => inCart.has(product.id)).map((product) => product.categoria),
  )
  return visible(products)
    .filter((product) => !inCart.has(product.id))
    .sort((a, b) => {
      const match = Number(categories.has(b.categoria)) - Number(categories.has(a.categoria))
      return match || Number(b.destacado) - Number(a.destacado)
        || a.nombre.localeCompare(b.nombre, 'es')
    })
    .slice(0, limit)
}

/** Vistos recientemente, tal como los guardó la sesión (más reciente primero). */
export const recentlyViewed = (
  ids: string[], products: Product[], limit = 4,
): Product[] => {
  const seen = new Set<string>()
  return ids.flatMap((id) => {
    if (seen.has(id)) return []
    seen.add(id)
    const product = visible(products).find((item) => item.id === id)
    return product ? [product] : []
  }).slice(0, limit)
}
