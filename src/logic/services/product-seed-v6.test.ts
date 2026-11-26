import { describe, expect, it } from 'vitest'
import { initialMovements, initialOrders, initialProducts } from '../../data/products'
import { migrateProductFacets } from './product-migrate'
import { isRealPhotoProduct, realProducts } from './real-products'
import { DEFAULT_CATEGORIES, type Product } from '../types'

const DEPARTAMENTOS = new Set(DEFAULT_CATEGORIES)
const FILLER = /^p\d{3}$/
const MARCAS_FICTICIAS = /velmar|nordisa|andaria|ferrival|papelux|hogaria|ludania|cuidalia|patalia/i
const TERMINOS_FARMACIA = /farmacia|medicamento|receta|pastilla|jarabe|antibiotico/i

describe('catálogo real (sin fichas de relleno)', () => {
  it('publica solo productos importados de las APIs', () => {
    expect(initialProducts).toBe(realProducts)
    expect(initialProducts.length).toBeGreaterThan(400)
    expect(new Set(initialProducts.map((p) => p.codigo)).size).toBe(initialProducts.length)
    for (const product of initialProducts) {
      expect(product.id).toMatch(/^(dj-|off-)/)
      expect(product.id).not.toMatch(FILLER)
      expect(isRealPhotoProduct(product)).toBe(true)
    }
  })

  it('no conserva marcas ficticias ni imágenes inventadas', () => {
    for (const product of initialProducts) {
      expect(DEPARTAMENTOS.has(product.categoria)).toBe(true)
      expect(product.subcategoria?.trim()).toBeTruthy()
      expect(product.marca?.trim()).toBeTruthy()
      expect(product.archivado).toBe(false)
      expect(product.publicado).toBe(true)
      expect(`${product.nombre} ${product.descripcionCorta}`).not.toMatch(TERMINOS_FARMACIA)
      expect(`${product.marca} ${product.proveedor}`).not.toMatch(MARCAS_FICTICIAS)
      expect(product.imagenes.join(' ')).not.toMatch(/^data:|\.svg|#[0-9a-f]{3,8}|rgb\(/i)
    }
  })

  it('mantiene movimientos y pedidos de muestra coherentes', () => {
    expect(initialOrders).toHaveLength(6)
    expect(initialMovements).toHaveLength(25)
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
      legacy({ id: 'p-new', categoria: 'Mascotas', subcategoria: 'Accesorios', marca: 'Nivea' }),
    ]
    const migrated = migrateProductFacets(original)
    expect(migrated.map((item) => item.categoria))
      .toEqual(['Tecnología', 'Papelería y oficina', 'Hogar y cocina', 'Mascotas'])
    expect(migrated[0]?.subcategoria).toBeTruthy()
    expect(migrated[0]?.marca).toBeTruthy()
    expect(migrated[3]).toMatchObject({ subcategoria: 'Accesorios', marca: 'Nivea' })
    expect(original[0]).toMatchObject({ categoria: 'Electrónica', subcategoria: undefined })
    expect(migrated[0]).not.toBe(original[0])
  })
})
