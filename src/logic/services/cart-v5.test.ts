import { describe, expect, it } from 'vitest'
import {
  cartCount, cartSubtotal, migrateCartLines, normalizeCartLine, pruneCartLines, validateCart,
} from './cart'
import type { Product } from '../types'

const NOW = '2026-11-22T12:00:00.000Z'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1', codigo: '001', slug: 'p1', nombre: 'Producto uno', categoria: 'Electrónica',
  unidad: 'unidad', stock: 10, stockMinimo: 2, stockObjetivo: 12, ubicacion: 'A-01',
  costo: 10, publicado: true, arquetipo: 'paquete', precio: 50, precioAnterior: null,
  descripcionCorta: '', descripcion: '', especificaciones: [], etiquetas: [],
  destacado: false, imagenes: [], proveedor: '', notas: '', archivado: false,
  creadoEn: '2026-01-01T00:00:00Z', actualizadoEn: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('carrito v5', () => {
  it('normaliza líneas antiguas y descarta inválidas', () => {
    expect(normalizeCartLine({ id: 'p1', quantity: 2 })).toMatchObject({
      productoId: 'p1', cantidad: 2,
    })
    expect(normalizeCartLine({ productoId: 'p2', cantidad: 0 })).toBeNull()
    expect(migrateCartLines({
      lines: [
        { id: 'p1', quantity: 3 },
        { productoId: 'p1', cantidad: 1 },
        { productoId: 'p2', cantidad: 2, precioAlAgregar: 20.5, guardado: true },
        null,
      ],
    })).toEqual([
      { productoId: 'p1', cantidad: 3, agregadoEn: expect.any(String) },
      { productoId: 'p2', cantidad: 2, agregadoEn: expect.any(String), precioAlAgregar: 20.5, guardado: true },
    ])
  })

  it('excluye guardados del conteo y del subtotal', () => {
    const lines = [
      { productoId: 'p1', cantidad: 2, agregadoEn: NOW },
      { productoId: 'p2', cantidad: 1, agregadoEn: NOW, guardado: true } as const,
    ]
    expect(cartCount(lines)).toBe(2)
    expect(cartSubtotal(lines, [product(), product({ id: 'p2', precio: 30 })])).toBe(100)
  })

  it('avisa de stock, precio y productos retirados', () => {
    const lines = [
      { productoId: 'p1', cantidad: 3, agregadoEn: NOW, precioAlAgregar: 40 },
      { productoId: 'p2', cantidad: 12, agregadoEn: NOW },
      { productoId: 'p3', cantidad: 1, agregadoEn: NOW },
    ]
    const products = [
      product(),
      product({ id: 'p2', codigo: '002', nombre: 'Producto dos', stock: 5 }),
    ]
    expect(validateCart(lines, products, []).map((issue) => issue.tipo))
      .toEqual(['precio', 'stock', 'no-disponible'])
  })

  it('poda líneas huérfanas sin tocar las guardadas', () => {
    const lines = [
      { productoId: 'p1', cantidad: 1, agregadoEn: NOW },
      { productoId: 'p2', cantidad: 1, agregadoEn: NOW, guardado: true },
    ]
    expect(pruneCartLines(lines, [product()]).map((line) => line.productoId)).toEqual(['p1'])
  })
})
