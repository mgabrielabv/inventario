/* Almacenamiento versionado. El HTML puede abrirse con file://; si localStorage
   no está disponible, se usa un mapa en memoria sin romper la app. */

export interface SafeStorage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

export const KEYS = {
  inventory: 'inventario-storage',
  theme: 'inventario-theme',
  user: 'inventario-user',
  users: 'inventario-users',
  orders: 'inventario-orders',
  cart: 'inventario-cart-v2',
  favorites: 'inventario-favorites-v2',
  settings: 'inventario-settings-v2',
  customer: 'inventario-customer-v2',
  recent: 'inventario-recent-v2',
  activity: 'inventario-activity',
} as const

export type StorageKey = (typeof KEYS)[keyof typeof KEYS]

/** Claves de la versión anterior (prefijo atelier / inventario-inventory-storage). */
const LEGACY: Array<[StorageKey, string[]]> = [
  [KEYS.inventory, ['atelier-inventory-storage', 'inventario-inventory-storage']],
  [KEYS.theme, ['atelier-theme']],
  [KEYS.user, ['atelier-user']],
  [KEYS.orders, ['atelier-orders']],
]

const memory = new Map<string, string>()

const canUseLocalStorage = (): boolean => {
  try {
    const probe = '__inventario_probe__'
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
  for (const [target, legacyKeys] of LEGACY) {
    try {
      if (window.localStorage.getItem(target) !== null) continue
      const source = legacyKeys.find((key) => window.localStorage.getItem(key) !== null)
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
