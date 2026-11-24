import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KEYS } from './storage'
import { LEGACY_SLUGS } from '../../config/legacy'

/** localStorage falso, suficiente para ejecutar migrateLegacyStorage en Node. */
const createStorage = (seed: Record<string, string>) => {
  const data = new Map(Object.entries(seed))
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, String(value)) },
    removeItem: (key: string) => { data.delete(key) },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() { return data.size },
  }
}

describe('migración de almacenamiento a la marca Ivoria', () => {
  let store: ReturnType<typeof createStorage>

  beforeEach(() => {
    store = createStorage({})
    vi.stubGlobal('window', { localStorage: store })
    vi.resetModules()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('traslada las claves tienda-* a ivoria-* sin perder el contenido', async () => {
    const orders = JSON.stringify([{ codigo: 'PED-2025-000012', total: 42.5 }])
    const cart = JSON.stringify({ state: { lines: [{ productoId: 'p002', cantidad: 3 }] }, version: 2 })
    // Se siembra con las claves reales del slug histórico.
    store.setItem('tienda-orders', orders)
    store.setItem('tienda-cart-v2', cart)
    store.setItem('tienda-theme', 'dark')

    const { migrateLegacyStorage } = await import('./storage')
    migrateLegacyStorage()

    expect(LEGACY_SLUGS).toContain('tienda')
    expect(store.getItem(KEYS.orders)).toBe(orders)
    expect(store.getItem(KEYS.cart)).toBe(cart)
    expect(store.getItem(KEYS.theme)).toBe('dark')
    expect(store.getItem('tienda-orders')).toBeNull()
    expect(store.getItem('tienda-cart-v2')).toBeNull()
    expect(store.getItem('tienda-theme')).toBeNull()
  })

  it('respeta una clave actual ya existente y no la sobrescribe', async () => {
    store.setItem('tienda-theme', 'dark')
    store.setItem(KEYS.theme, 'light')
    const { migrateLegacyStorage } = await import('./storage')
    migrateLegacyStorage()
    expect(store.getItem(KEYS.theme)).toBe('light')
    expect(store.getItem('tienda-theme')).toBe('dark')
  })

  it('recupera claves aún más antiguas y la sesión de usuario', async () => {
    store.setItem('atelier-orders', '["atelier"]')
    store.setItem('inventario-user', JSON.stringify({ username: 'admin' }))
    const { migrateLegacyStorage } = await import('./storage')
    migrateLegacyStorage()
    expect(store.getItem(KEYS.orders)).toBe('["atelier"]')
    expect(store.getItem(KEYS.user)).toBe(JSON.stringify({ username: 'admin' }))
  })
})
