import { describe, expect, it } from 'vitest'
import {
  categoryTiles, clampPriceRange, defaultFilters, parseFilters, priceBounds,
  productBadge, serializeFilters, suggestProducts,
} from './catalog'
import type { Product } from '../types'

const NOW = new Date('2026-11-22T12:00:00Z')

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1', codigo: '001', slug: 'p1', nombre: 'Laptop 14', categoria: 'Electrónica',
  unidad: 'unidad', stock: 10, stockMinimo: 2, stockObjetivo: 12, ubicacion: 'A-01',
  costo: 100, publicado: true, arquetipo: 'laptop', precio: 200, precioAnterior: null,
  descripcionCorta: 'Ligera', descripcion: 'Para trabajar', especificaciones: [],
  etiquetas: [], destacado: false, imagenes: [], proveedor: '', notas: '',
  archivado: false, creadoEn: '2026-01-01T00:00:00Z', actualizadoEn: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('catálogo v5', () => {
  it('elige una sola insignia por prioridad', () => {
    expect(productBadge(product({ precioAnterior: 250 }), 2, NOW)).toEqual({ kind: 'oferta', label: 'Oferta' })
    expect(productBadge(product({ etiquetas: ['nuevo'] }), 2, NOW)).toEqual({ kind: 'nuevo', label: 'Nuevo' })
    expect(productBadge(product({ creadoEn: '2026-11-10T00:00:00Z' }), 9, NOW)?.kind).toBe('nuevo')
    expect(productBadge(product(), 3, NOW)).toEqual({ kind: 'ultimas', label: 'Últimas 3' })
    expect(productBadge(product(), 0, NOW)).toBeNull()
    expect(productBadge(product(), 9, NOW)).toBeNull()
  })

  it('redondea los límites de precio y los ordena', () => {
    const products = [product({ precio: 35 }), product({ id: 'p2', precio: 142 })]
    expect(priceBounds(products)).toEqual({ min: 30, max: 150 })
    expect(priceBounds([])).toEqual({ min: 0, max: 100 })
    expect(clampPriceRange(180, 10, { min: 30, max: 150 })).toEqual({ min: 30, max: 150 })
    expect(clampPriceRange(120, 60, { min: 30, max: 150 })).toEqual({ min: 60, max: 120 })
    expect(clampPriceRange(null, null, { min: 30, max: 150 })).toEqual({ min: 30, max: 150 })
  })

  it('conserva la densidad en la URL', () => {
    expect(defaultFilters().densidad).toBe('comoda')
    const query = serializeFilters({ ...defaultFilters(), densidad: 'compacta', q: 'laptop' })
    expect(query).toContain('densidad=compacta')
    expect(parseFilters(query)).toMatchObject({ q: 'laptop', densidad: 'compacta' })
    expect(parseFilters('?densidad=rara').densidad).toBe('comoda')
  })

  it('agrupa categorías y sugiere coincidencias', () => {
    const products = [
      product(),
      product({ id: 'p2', codigo: '002', nombre: 'Mouse', categoria: 'Accesorios', precio: 25 }),
      product({ id: 'p3', codigo: '003', nombre: 'Teclado', categoria: 'Accesorios', precio: 45 }),
    ]
    expect(categoryTiles(products).map((tile) => [tile.categoria, tile.total]))
      .toEqual([['Accesorios', 2], ['Electrónica', 1]])
    expect(suggestProducts(products, 'laptop', [], 2).map((item) => item.id)).toEqual(['p1'])
    expect(suggestProducts(products, '', [])).toEqual([])
  })
})
