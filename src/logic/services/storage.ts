export interface SafeStorage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

const memory = new Map<string, string>()

const canUseLocalStorage = (): boolean => {
  try {
    const probe = '__atelier_probe__'
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

const persistent = canUseLocalStorage()

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
