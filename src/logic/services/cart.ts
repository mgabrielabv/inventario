/* Lógica pura del carrito: normalización, migración, validación y totales. */

import { getAvailable } from './stock'
import { roundMoney } from './pricing'
import type { CartLine, Order, Product } from '../types'

const now = (): string => new Date().toISOString()

/** Acepta líneas de versiones anteriores y descarta las que no son utilizables. */
export const normalizeCartLine = (value: unknown): CartLine | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const productoId = typeof raw.productoId === 'string'
    ? raw.productoId
    : typeof raw.id === 'string' ? raw.id : ''
  const cantidad = Number(raw.cantidad ?? raw.quantity)
  if (!productoId || !Number.isFinite(cantidad) || cantidad <= 0) return null
  return {
    productoId,
    cantidad: Math.max(1, Math.floor(cantidad)),
    agregadoEn: typeof raw.agregadoEn === 'string' ? raw.agregadoEn : now(),
    ...(typeof raw.precioAlAgregar === 'number' && Number.isFinite(raw.precioAlAgregar)
      ? { precioAlAgregar: roundMoney(raw.precioAlAgregar) } : {}),
    ...(raw.guardado === true ? { guardado: true } : {}),
  }
}

export const migrateCartLines = (value: unknown): CartLine[] => {
  const raw = value as { lines?: unknown[] } | undefined
  const source = Array.isArray(raw?.lines) ? raw.lines : Array.isArray(value) ? value : []
  const seen = new Set<string>()
  return source.flatMap((item) => {
    const line = normalizeCartLine(item)
    if (!line || seen.has(line.productoId)) return []
    seen.add(line.productoId)
    return [line]
  })
}

export const cartCount = (lines: CartLine[]): number =>
  lines.filter((line) => !line.guardado).reduce((sum, line) => sum + line.cantidad, 0)

export const cartSubtotal = (lines: CartLine[], products: Product[]): number => roundMoney(
  lines.filter((line) => !line.guardado).reduce((sum, line) => {
    const product = products.find((item) => item.id === line.productoId)
    return sum + (product?.precio ?? 0) * line.cantidad
  }, 0),
)

export interface CartIssue {
  productoId: string
  tipo: 'no-disponible' | 'stock' | 'precio'
  mensaje: string
}

/** Revisión final antes del cobro: disponibilidad, stock y cambios de precio. */
export const validateCart = (
  lines: CartLine[], products: Product[], orders: Order[],
): CartIssue[] => lines.filter((line) => !line.guardado).flatMap((line): CartIssue[] => {
  const product = products.find((item) => item.id === line.productoId)
  if (!product || product.archivado || !product.publicado || product.precio === null) {
    return [{
      productoId: line.productoId, tipo: 'no-disponible' as const,
      mensaje: `${product?.nombre ?? 'Producto'} ya no está disponible.`,
    }]
  }
  const available = getAvailable(product, orders)
  if (available < line.cantidad) {
    return [{
      productoId: line.productoId, tipo: 'stock' as const,
      mensaje: `${product.nombre}: quedan ${available} y pidiste ${line.cantidad}.`,
    }]
  }
  if (line.precioAlAgregar !== undefined
    && roundMoney(line.precioAlAgregar) !== roundMoney(product.precio)) {
    return [{
      productoId: line.productoId, tipo: 'precio' as const,
      mensaje: `${product.nombre} cambió de precio. El total se calcula con el precio actual.`,
    }]
  }
  return []
})

/** Quita líneas huérfanas sin perder las guardadas para después. */
export const pruneCartLines = (lines: CartLine[], products: Product[]): CartLine[] =>
  lines.filter((line) => {
    const product = products.find((item) => item.id === line.productoId)
    return Boolean(product && !product.archivado && product.publicado && product.precio !== null)
  })
