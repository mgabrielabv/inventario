import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../store/settings'
import { backupSummary, buildBackup, validateBackup } from './backup'
import { dataUrlToBlob } from './images'

const FOTO = 'data:image/webp;base64,aGVsbG8='

const base = {
  products: [], movements: [], orders: [], users: [], activity: [],
  settings: DEFAULT_SETTINGS,
}

describe('respaldo con fotos', () => {
  it('exporta la versión 5 con las data URLs y la fecha', () => {
    const respaldo = buildBackup({ ...base, fotos: { 'img-1': FOTO } })
    expect(respaldo.version).toBe(5)
    expect(respaldo.exportedAt).toMatch(/^\d{4}-\d\d-\d\dT/)
    expect(respaldo.fotos).toEqual({ 'img-1': FOTO })
    expect(Array.isArray(respaldo.customers)).toBe(true)
  })

  it('acepta respaldos v5 con fotos válidas y conserva el escenario', () => {
    const resultado = validateBackup({
      ...base, version: 5,
      products: [{ id: 'p1', escenario: 'noche' }],
      fotos: { 'img-1': FOTO },
    })
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.data.fotos).toEqual({ 'img-1': FOTO })
    expect(resultado.data.products[0]?.escenario).toBe('noche')
  })

  it('sigue aceptando respaldos anteriores sin fotos', () => {
    const resultado = validateBackup({ ...base, version: 4 })
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.data.fotos).toBeUndefined()
  })

  it('rechaza fotos mal formadas antes de sobrescribir datos', () => {
    const casos: unknown[] = [
      [], { 'img-1': 'https://ejemplo.com/foto.webp' }, { 'img-1': 7 },
      { '': FOTO }, { 'img-1': 'data:image/gif;base64,aGVsbG8=' },
    ]
    for (const fotos of casos) {
      const resultado = validateBackup({ ...base, version: 5, fotos })
      expect(resultado.ok, JSON.stringify(fotos)).toBe(false)
    }
  })

  it('resume cuántas fotos viajan en el respaldo', () => {
    const respaldo = buildBackup({ ...base, fotos: { 'img-1': FOTO, 'img-2': FOTO } })
    expect(backupSummary(respaldo)).toContain('2 fotos')
  })
})

describe('data URLs de fotos', () => {
  it('convierte la data URL a un blob con su tipo real', () => {
    const blob = dataUrlToBlob(FOTO)
    expect(blob.type).toBe('image/webp')
    expect(blob.size).toBe(5)
  })

  it('rechaza formatos externos y blobs desproporcionados', () => {
    expect(() => dataUrlToBlob('https://ejemplo.com/foto.webp')).toThrow(/válida/)
    expect(() => dataUrlToBlob('data:image/gif;base64,aGVsbG8=')).toThrow(/válida/)
    expect(() => dataUrlToBlob(
      `data:image/png;base64,${'A'.repeat(1_400_000)}`,
    )).toThrow(/demasiado grande/)
  })
})
