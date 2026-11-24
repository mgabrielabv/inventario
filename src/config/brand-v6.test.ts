import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { BRAND, brandInitial, storageKey } from './brand'
import { LEGACY_BRAND_NAME, LEGACY_CATEGORIES, LEGACY_SLUGS } from './legacy'
import { DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, UNITS, type Settings } from '../logic/types'
import { DEFAULT_SETTINGS, useSettingsStore } from '../logic/store/settings'
import { storeName } from '../logic/services/formatters'
import { generateOrderCode } from '../logic/services/orders'
import type { Order } from '../logic/types'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

const legacySettings = (): Settings => ({
  ...DEFAULT_SETTINGS,
  tienda: { ...DEFAULT_SETTINGS.tienda, nombre: LEGACY_BRAND_NAME },
  pagos: {
    ...DEFAULT_SETTINGS.pagos,
    datosTransferencia: `Titular: ${LEGACY_BRAND_NAME}`,
    datosMovil: `Titular: ${LEGACY_BRAND_NAME}`,
  },
  catalogo: {
    ...DEFAULT_SETTINGS.catalogo,
    categorias: ['Electrónica', 'Papelería', 'Hogar', 'Otras'],
  },
})

describe('marca centralizada', () => {
  afterEach(() => useSettingsStore.getState().replace(DEFAULT_SETTINGS))

  it('aplica la marca Ivoria en nombre, monograma, claves y prefijo', () => {
    expect(BRAND.name).toBe('Ivoria')
    expect(BRAND.shortName).toBe('Ivoria')
    expect(BRAND.slug).toBe('ivoria')
    expect(BRAND.orderPrefix).toBe('IVO')
    expect(BRAND.themeKey).toBe('ivoria-theme')
    expect(BRAND.tagline).toBe('Todo para tu casa y tu día, en un solo lugar.')
    expect(brandInitial()).toBe('I')
    expect(storageKey('theme')).toBe('ivoria-theme')
    expect(BRAND.name).not.toContain('[NOMBRE')
    const html = source('index.html')
    expect(html).toContain('__BRAND_NAME__')
    expect(html).toContain('__BRAND_DESCRIPTION__')
    expect(html).toContain('viewport-fit=cover')
    expect(html).toContain('__BRAND_THEME_LIGHT__')
    expect(html).toContain('__BRAND_THEME_DARK__')
    expect(html).toContain('og:description')
    expect(html).toContain("M10.5 7.5h11")
    expect(source('vite.config.ts')).toContain('./src/config/brand.ts')
  })

  it('migra nombre, textos de pago y departamentos guardados', () => {
    useSettingsStore.getState().replace(legacySettings())
    const { settings } = useSettingsStore.getState()
    expect(settings.tienda.nombre).toBe(BRAND.name)
    expect(settings.pagos.datosTransferencia).not.toContain(LEGACY_BRAND_NAME)
    expect(settings.pagos.datosMovil).not.toContain(LEGACY_BRAND_NAME)
    expect(settings.catalogo.categorias).toEqual(DEFAULT_CATEGORIES)
    expect(LEGACY_CATEGORIES.Electrónica).toBe('Tecnología')
    expect(storeName({ ...settings, tienda: { ...settings.tienda, nombre: '' } })).toBe(BRAND.name)
  })

  it('migra las claves tienda-* e imágenes a ivoria-*', () => {
    expect(LEGACY_SLUGS).toContain('tienda')
    expect(source('src/logic/services/storage.ts')).toMatch(/LEGACY_SLUGS\.map/)
    expect(source('src/logic/services/images.ts')).toMatch(/LEGACY_SLUGS\.map/)
    expect(LEGACY_SLUGS.map((slug) => `${slug}-theme`)).toContain('tienda-theme')
  })

  it('conserva la secuencia de pedidos PED- e INV- al generar códigos IVO-', () => {
    const previous = [
      { codigo: 'IVO-2026-000001' },
      { codigo: 'PED-2026-000002' },
      { codigo: 'INV-2026-000003' },
      { codigo: 'INV-2025-000099' },
    ] as Order[]
    expect(generateOrderCode(previous, new Date('2026-11-23T12:00:00Z')))
      .toBe('IVO-2026-000004')
  })

  it('la configuración por defecto usa los catálogos del tipo', () => {
    expect(DEFAULT_SETTINGS.catalogo.categorias).toEqual(DEFAULT_CATEGORIES)
    expect(DEFAULT_SETTINGS.catalogo.unidades).toEqual(UNITS)
    expect(DEFAULT_SETTINGS.catalogo.ubicaciones).toEqual(DEFAULT_LOCATIONS)
    expect(DEFAULT_SETTINGS.catalogo.ubicaciones).toHaveLength(10)
  })
})
