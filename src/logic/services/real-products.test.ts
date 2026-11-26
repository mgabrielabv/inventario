import { describe, expect, it } from 'vitest'
import { defaultFilters, filterCatalog, PAGE_SIZE } from './catalog'
import { isRealPhotoProduct, mergeRealProducts, realProducts } from './real-products'
import { ARQUETIPOS, DEFAULT_CATEGORIES, UNITS, type Product } from '../types'

describe('catálogo real sembrado desde APIs públicas', () => {
  it('trae cientos de productos con identificadores únicos', () => {
    expect(realProducts.length).toBeGreaterThan(400)
    expect(new Set(realProducts.map((p) => p.id)).size).toBe(realProducts.length)
    expect(new Set(realProducts.map((p) => p.codigo)).size).toBe(realProducts.length)
  })

  it('cumple el esquema exacto de Product y guarda solo URLs de imagen', () => {
    const categories = new Set(DEFAULT_CATEGORIES)
    const arquetipos = new Set<string>(ARQUETIPOS)
    const unidades = new Set<string>(UNITS)
    for (const product of realProducts) {
      expect(typeof product.id).toBe('string')
      expect(product.codigo.length).toBeGreaterThan(0)
      expect(product.slug.length).toBeGreaterThan(0)
      expect(product.nombre.length).toBeGreaterThan(0)
      expect(categories.has(product.categoria)).toBe(true)
      expect(product.subcategoria?.trim()).toBeTruthy()
      expect(product.marca?.trim()).toBeTruthy()
      expect(unidades.has(product.unidad)).toBe(true)
      expect(Number.isFinite(product.stock)).toBe(true)
      expect(Number.isFinite(product.stockMinimo)).toBe(true)
      expect(Number.isFinite(product.stockObjetivo)).toBe(true)
      expect(arquetipos.has(product.arquetipo)).toBe(true)
      expect(typeof product.precio).toBe('number')
      expect(typeof product.publicado).toBe('boolean')
      expect(Array.isArray(product.especificaciones)).toBe(true)
      expect(Array.isArray(product.etiquetas)).toBe(true)
      expect(product.archivado).toBe(false)
      expect(product.imagenes.length).toBeGreaterThan(0)
      for (const image of product.imagenes) {
        expect(image).toMatch(/^https?:\/\/\S+$/i)
        expect(image).not.toMatch(/^data:/i)
      }
    }
  })

  it('descarta fichas de relleno y productos sin foto real', () => {
    const relleno = { ...realProducts[0]!, id: 'p001', imagenes: ['/arte/laptop.svg'] }
    const sinFoto = { ...realProducts[0]!, imagenes: [] }
    const local = { ...realProducts[0]!, imagenes: ['img-local-indexeddb'] }
    expect(isRealPhotoProduct(relleno)).toBe(false)
    expect(isRealPhotoProduct(sinFoto)).toBe(false)
    expect(isRealPhotoProduct(local)).toBe(false)
    expect(isRealPhotoProduct(realProducts[0]!)).toBe(true)
  })

  it('fusiona sin duplicar y respeta fichas ya editadas', () => {
    const editada: Product = { ...realProducts[0]!, nombre: 'Nombre editado', precio: 99 }
    const actuales = realProducts.slice(1)
    expect(mergeRealProducts(realProducts)).toHaveLength(realProducts.length)
    const primera = mergeRealProducts([...actuales, editada])
    const segunda = mergeRealProducts(primera)
    expect(primera).toHaveLength(segunda.length)
    expect(new Set(primera.map((p) => p.id)).size).toBe(primera.length)
    expect(new Set(primera.map((p) => p.codigo)).size).toBe(primera.length)
    expect(primera.find((p) => p.id === editada.id)?.nombre).toBe('Nombre editado')
    expect(primera).toHaveLength(realProducts.length)
  })
})

describe('paginación del catálogo con el inventario ampliado', () => {
  it('sirve hasta 24 tarjetas por página', () => {
    expect(PAGE_SIZE).toBe(24)
    const productos = mergeRealProducts(realProducts)
    const resultados = filterCatalog(productos, defaultFilters(), [])
    expect(resultados.length).toBeGreaterThan(400)
    expect(resultados.slice(0, PAGE_SIZE)).toHaveLength(24)
    expect(resultados.slice(PAGE_SIZE, PAGE_SIZE * 2)).toHaveLength(24)
  })
})
