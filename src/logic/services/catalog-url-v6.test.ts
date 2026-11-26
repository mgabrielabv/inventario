import { describe, expect, it } from 'vitest'
import {
  activeFilterChips, defaultFilters, filterCatalog, parseFilters, productBadge,
  serializeFilters, PAGE_SIZE,
} from './catalog'
import { formatSecondary, toBolivares } from './pricing'
import { DEFAULT_SETTINGS } from '../store/settings'
import type { Product, Settings } from '../types'

const NOW = new Date('2026-11-22T12:00:00Z')

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1', codigo: '001', slug: 'p1', nombre: 'Laptop 14', categoria: 'Tecnología',
  unidad: 'unidad', stock: 10, stockMinimo: 2, stockObjetivo: 12, ubicacion: 'A-01',
  costo: 100, publicado: true, arquetipo: 'laptop', precio: 200, precioAnterior: null,
  descripcionCorta: 'Ligera', descripcion: 'Para trabajar', especificaciones: [],
  etiquetas: [], destacado: false, imagenes: [], proveedor: '', notas: '',
  archivado: false, creadoEn: '2026-01-01T00:00:00Z', actualizadoEn: '2026-01-01T00:00:00Z',
  subcategoria: 'Cómputo', marca: 'Essence',
  ...overrides,
})

describe('filtros y URL', () => {
  it('round-trip de todos los filtros visibles', () => {
    const filters = {
      ...defaultFilters(),
      q: 'mochila escolar', cat: 'Accesorios', solo: true, enOferta: true,
      min: 10, max: 90, orden: 'precio-desc' as const, densidad: 'compacta' as const,
      pagina: 3, marca: 'Essence', subcategoria: 'Mochilas',
    }
    const query = serializeFilters(filters)
    expect(query).toContain('categoria=Accesorios')
    expect(query).toContain('pagina=3')
    expect(query).toContain('marca=Essence')
    expect(query).toContain('subcategoria=Mochilas')
    expect(parseFilters(query)).toEqual(filters)
  })

  it('acepta alias cat, descarta valores raros y omite valores por defecto', () => {
    expect(parseFilters('?cat=Accesorios').cat).toBe('Accesorios')
    expect(parseFilters('?pagina=-4&min=-2&max=abc').pagina).toBe(1)
    expect(parseFilters('?pagina=-4&min=-2&max=abc').min).toBeNull()
    expect(parseFilters('?orden=raroydensidad=rara').orden).toBe('destacados')
    expect(serializeFilters(defaultFilters())).toBe('')
    expect(PAGE_SIZE).toBe(24)
  })

  it('filtra por marca, tipo, oferta y texto normalizado', () => {
    const products = [
      product(),
      product({
        id: 'p2', codigo: '002', nombre: 'Mochila escolar', categoria: 'Accesorios',
        precio: 40, precioAnterior: 55, subcategoria: 'Mochilas', marca: 'Alpro',
      }),
      product({ id: 'p3', codigo: '003', nombre: 'Cuaderno A4', archivado: true }),
    ]
    expect(filterCatalog(products, defaultFilters(), []).map((item) => item.id)).toEqual(['p1', 'p2'])
    expect(filterCatalog(products, { ...defaultFilters(), enOferta: true }, []).map((item) => item.id))
      .toEqual(['p2'])
    expect(filterCatalog(products, { ...defaultFilters(), marca: 'Alpro' }, []).map((item) => item.id))
      .toEqual(['p2'])
    expect(filterCatalog(products, { ...defaultFilters(), subcategoria: 'Mochilas' }, []).map((item) => item.id))
      .toEqual(['p2'])
    expect(filterCatalog(products, { ...defaultFilters(), q: 'mochila escolar' }, []).map((item) => item.id))
      .toEqual(['p2'])
  })

  it('muestra chips con etiquetas comprensibles', () => {
    const chips = activeFilterChips({
      ...defaultFilters(), q: 'silla', cat: 'Hogar y cocina', marca: 'Nivea',
      subcategoria: 'Sillas', min: 20, max: 80, enOferta: true,
    })
    expect(chips.map((chip) => chip.label)).toEqual([
      'Búsqueda: silla', 'Hogar y cocina', 'En oferta', 'Marca: Nivea',
      'Tipo: Sillas', 'Precio 20 – 80',
    ])
  })
})

describe('insignias y equivalencia de moneda', () => {
  it('prioriza oferta, luego nuevo, luego últimas unidades', () => {
    expect(productBadge(product({ precioAnterior: 250 }), 1, NOW))
      .toEqual({ kind: 'oferta', label: 'Oferta' })
    expect(productBadge(product({ etiquetas: ['NUEVO'] }), 1, NOW))
      .toEqual({ kind: 'nuevo', label: 'Nuevo' })
    expect(productBadge(product({ creadoEn: '2026-11-10T00:00:00Z' }), 1, NOW)?.kind).toBe('nuevo')
    expect(productBadge(product(), 2, NOW)).toEqual({ kind: 'ultimas', label: 'Últimas 2' })
    expect(productBadge(product(), 0, NOW)).toBeNull()
  })

  it('muestra bolívares solo si hay tasa y se pidió mostrarla', () => {
    const base: Settings = {
      ...DEFAULT_SETTINGS,
      moneda: { codigo: 'USD', tasaVES: 120, fechaTasa: '2026-11-23', mostrarSecundario: true },
    }
    expect(toBolivares(10, base)).toBe(1200)
    expect(formatSecondary(10.5, base)).toBe('Ref. Bs. 1.260,00')
    expect(toBolivares(10, { ...base, moneda: { ...base.moneda, mostrarSecundario: false } })).toBeNull()
    expect(toBolivares(10, { ...base, moneda: { ...base.moneda, tasaVES: 0 } })).toBeNull()
  })
})
