export interface SafeStorage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

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

const persistent = canUseLocalStorage()

export const storageKey = (suffix: 'theme' | 'user' | 'inventory-storage'): string =>
  `inventario-${suffix}`

const PERSISTED_SUFFIXES = ['theme', 'user', 'inventory-storage'] as const

/**
 * Renombra las claves de la versión anterior a `inventario-*` sin tocar su
 * contenido, de modo que la sesión, el tema y los movimientos sobrevivan.
 * Se localiza la clave antigua por su sufijo para no volver a nombrarla.
 */
export const migrateLegacyStorage = (): void => {
  if (!persistent) return

  for (const suffix of PERSISTED_SUFFIXES) {
    const target = storageKey(suffix)
    try {
      if (window.localStorage.getItem(target) !== null) continue
      const legacy = Object.keys(window.localStorage).find(
        (key) => key !== target && key.endsWith(`-${suffix}`),
      )
      if (!legacy) continue
      const value = window.localStorage.getItem(legacy)
      if (value === null) continue
      window.localStorage.setItem(target, value)
      window.localStorage.removeItem(legacy)
    } catch {
      // Sin persistencia disponible: no hay nada que migrar.
    }
  }
}

migrateLegacyStorage()

/**
 * localStorage puede no estar disponible al abrir el HTML con file:// en
 * algunos navegadores. En ese caso la app sigue funcionando en memoria.
 */
export const safeStorage: SafeStorage = {
  getItem: (name) => {
    if (!persistent) return memory.get(name) ?? null
    try {
      return window.localStorage.getItem(name)
    } catch {
      return memory.get(name) ?? null
    }
  },
  setItem: (name, value) => {
    if (!persistent) {
      memory.set(name, value)
      return
    }
    try {
      window.localStorage.setItem(name, value)
    } catch {
      memory.set(name, value)
    }
  },
  removeItem: (name) => {
    memory.delete(name)
    if (!persistent) return
    try {
      window.localStorage.removeItem(name)
    } catch {
      // Sin persistencia disponible: la copia en memoria ya fue eliminada.
    }
  },
}
