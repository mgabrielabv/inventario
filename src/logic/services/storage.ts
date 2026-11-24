/* Almacenamiento versionado. El HTML puede abrirse con file://; si localStorage
   no está disponible, se usa un mapa en memoria sin romper la app.
   Las claves derivan de BRAND.slug; los nombres históricos viven en config/legacy. */

import { storageKey } from '../../config/brand'
import { LEGACY_KEYS, LEGACY_PREFIX, LEGACY_SLUGS } from '../../config/legacy'

export interface SafeStorage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

export const KEYS = {
  inventory: storageKey('storage'),
  theme: storageKey('theme'),
  user: storageKey('user'),
  users: storageKey('users'),
  orders: storageKey('orders'),
  cart: storageKey('cart-v2'),
  favorites: storageKey('favorites-v2'),
  settings: storageKey('settings-v2'),
  customer: storageKey('customer-v2'),
  recent: storageKey('recent-v2'),
  cartDraft: storageKey('cart-draft-v1'),
  checkoutDraft: storageKey('checkout-draft-v1'),
  activity: storageKey('activity'),
  customers: storageKey('customers-v1'),
  customerSession: storageKey('customer-session-v1'),
} as const

export type StorageKey = (typeof KEYS)[keyof typeof KEYS]

const SUFFIXES: Record<keyof typeof KEYS, string> = {
  inventory: 'storage',
  theme: 'theme',
  user: 'user',
  users: 'users',
  orders: 'orders',
  cart: 'cart-v2',
  favorites: 'favorites-v2',
  settings: 'settings-v2',
  customer: 'customer-v2',
  recent: 'recent-v2',
  cartDraft: 'cart-draft-v1',
  checkoutDraft: 'checkout-draft-v1',
  activity: 'activity',
  customers: 'customers-v1',
  customerSession: 'customer-session-v1',
}

const memory = new Map<string, string>()

const canUseLocalStorage = (): boolean => {
  try {
    const probe = '__brand_probe__'
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

const persistent = typeof window !== 'undefined' && canUseLocalStorage()

export const migrateLegacyStorage = (): void => {
  if (!persistent) return
  for (const key of Object.keys(KEYS) as Array<keyof typeof KEYS>) {
    const target = KEYS[key]
    try {
      if (window.localStorage.getItem(target) !== null) continue
      const candidates = [
        ...(LEGACY_KEYS[key] ?? []),
        ...LEGACY_SLUGS.map((slug) => `${slug}-${SUFFIXES[key]}`),
        `${LEGACY_PREFIX}${SUFFIXES[key]}`,
      ]
      const source = candidates.find((name) => window.localStorage.getItem(name) !== null)
      if (!source) continue
      const value = window.localStorage.getItem(source)
      if (value === null) continue
      window.localStorage.setItem(target, value)
      window.localStorage.removeItem(source)
    } catch {
      /* Sin persistencia: nada que migrar. */
    }
  }
  // Sesión anterior guardada bajo otra clave.
  try {
    if (window.localStorage.getItem(KEYS.user) === null) {
      for (const key of Object.keys(window.localStorage)) {
        if (key.endsWith('-user') && key !== KEYS.user) {
          const value = window.localStorage.getItem(key)
          if (value) window.localStorage.setItem(KEYS.user, value)
          break
        }
      }
    }
  } catch { /* ignore */ }
}

migrateLegacyStorage()

export const safeStorage: SafeStorage = {
  getItem: (name) => {
    if (!persistent) return memory.get(name) ?? null
    try { return window.localStorage.getItem(name) } catch { return memory.get(name) ?? null }
  },
  setItem: (name, value) => {
    if (!persistent) { memory.set(name, value); return }
    try { window.localStorage.setItem(name, value) } catch { memory.set(name, value) }
  },
  removeItem: (name) => {
    memory.delete(name)
    if (!persistent) return
    try { window.localStorage.removeItem(name) } catch { /* ignore */ }
  },
}

export const readJson = <T>(key: StorageKey, fallback: T): T => {
  const raw = safeStorage.getItem(key)
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

export const writeJson = (key: StorageKey, value: unknown): void => {
  safeStorage.setItem(key, JSON.stringify(value))
}
