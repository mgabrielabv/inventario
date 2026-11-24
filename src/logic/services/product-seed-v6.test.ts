import { describe, expect, it } from 'vitest'
import { initialMovements, initialOrders, initialProducts } from '../../data/products'
import { migrateProductFacets } from './product-migrate'
import { DEFAULT_CATEGORIES, type Product } from '../types'

const DEPARTAMENTOS = new Set(DEFAULT_CATEGORIES)
const TERMINOS_FARMACIA = /farmacia|medicamento|receta|pastilla|jarabe|antibiotico/i

describe('catálogo semilla departamental', () => {
  it('mantiene las 25 fichas originales y llega a 60', () => {
    expect(initialProducts).toHaveLength(60)
    expect(initialProducts.slice(0, 25).map((item) => item.id))
      .toEqual(Array.from({ length: 25 }, (_, i) => `p${String(i + 1).padStart(3, '0')}`))
    expect(initialProducts.slice(0, 25).map((item) => item.codigo))
      .toEqual(Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(3, '0')))
    expect(initialProducts.slice(25).map((item) => item.id))
      .toEqual(Array.from({ length: 35 }, (_, i) => `p${String(i + 26).padStart(3, '0')}`))
    expect(new Set(initialProducts.map((item) => item.codigo)).size).toBe(60)
  })

  it('cubre los 9 departamentos con facetas y sin términos de farmacia', () => {
    const categorias = new Set(initialProducts.map((item) => item.categoria))
    expect([...categorias].sort()).toEqual([...DEPARTAMENTOS].sort())
    expect(initialProducts.filter((item) => item.publicado !== false).length).toBeGreaterThanOrEqual(59)
    for (const product of initialProducts) {
      expect(DEPARTAMENTOS.has(product.categoria)).toBe(true)
      expect(product.subcategoria?.trim()).toBeTruthy()
      expect(product.marca?.trim()).toBeTruthy()
      expect(product.archivado).toBe(false)
      expect(`${product.nombre} ${product.descripcionCorta}`).not.toMatch(TERMINOS_FARMACIA)
      expect(product.imagenes.join(' ')).not.toMatch(/#[0-9a-f]{3,8}|rgb\(/i)
    }
  })

  it('no rompe pedidos ni movimientos semilla', () => {
    expect(initialOrders.length).toBeGreaterThan(0)
    expect(initialMovements.length).toBeGreaterThan(0)
    const ids = new Set(initialProducts.map((item) => item.id))
    for (const order of initialOrders) {
      for (const line of order.lineas) expect(ids.has(line.productoId)).toBe(true)
    }
    for (const movement of initialMovements) expect(ids.has(movement.productoId)).toBe(true)
  })
})

describe('migración de facetas', () => {
  const legacy = (overrides: Partial<Product> = {}): Product => ({
    ...initialProducts[0]!,
    id: 'p-legacy', codigo: '900', slug: 'p-legacy',
    categoria: 'Electrónica', subcategoria: undefined, marca: undefined,
    ...overrides,
  })

  it('mapea departamentos antiguos y completa campos vacíos sin mutar', () => {
    const original = [
      legacy(),
      legacy({ id: 'p-old-2', categoria: 'Papelería' }),
      legacy({ id: 'p-old-3', categoria: 'Otras' }),
      legacy({ id: 'p-new', categoria: 'Mascotas', subcategoria: 'Accesorios', marca: 'Patalia' }),
    ]
    const migrated = migrateProductFacets(original)
    expect(migrated.map((item) => item.categoria))
      .toEqual(['Tecnología', 'Papelería y oficina', 'Hogar y cocina', 'Mascotas'])
    expect(migrated[0]?.subcategoria).toBeTruthy()
    expect(migrated[0]?.marca).toBeTruthy()
    expect(migrated[3]).toMatchObject({ subcategoria: 'Accesorios', marca: 'Patalia' })
    expect(original[0]).toMatchObject({ categoria: 'Electrónica', subcategoria: undefined })
    expect(migrated[0]).not.toBe(original[0])
  })
})
