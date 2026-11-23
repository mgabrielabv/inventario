import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { KEYS, safeStorage } from '../services/storage'
import { cartCount, migrateCartLines, pruneCartLines } from '../services/cart'
import type { CartLine, Product } from '../types'

interface CartStore {
  lines: CartLine[]
  add: (productoId: string, cantidad?: number, precio?: number) => void
  setQuantity: (productoId: string, cantidad: number) => void
  remove: (productoId: string) => void
  restore: (line: CartLine) => void
  saveForLater: (productoId: string) => void
  clear: () => void
  /** Descarta líneas de productos que ya no existen o no se pueden vender. */
  prune: (products: Product[]) => void
  replace: (lines: CartLine[]) => void
  count: () => number
}

const now = (): string => new Date().toISOString()

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (productoId, cantidad = 1, precio) => set((state) => {
        const existing = state.lines.find((line) => line.productoId === productoId)
        if (existing) {
          return {
            lines: state.lines.map((line) =>
              line.productoId === productoId
                ? {
                  ...line, guardado: false,
                  cantidad: line.cantidad + cantidad,
                  agregadoEn: now(),
                  ...(precio !== undefined ? { precioAlAgregar: precio } : {}),
                }
                : line),
          }
        }
        return {
          lines: [...state.lines, {
            productoId, cantidad, agregadoEn: now(),
            ...(precio !== undefined ? { precioAlAgregar: precio } : {}),
          }],
        }
      }),
      setQuantity: (productoId, cantidad) => set((state) => ({
        lines: cantidad <= 0
          ? state.lines.filter((line) => line.productoId !== productoId)
          : state.lines.map((line) =>
            line.productoId === productoId ? { ...line, cantidad } : line),
      })),
      remove: (productoId) => set((state) => ({
        lines: state.lines.filter((line) => line.productoId !== productoId),
      })),
      restore: (line) => set((state) => (
        state.lines.some((item) => item.productoId === line.productoId)
          ? { lines: state.lines.filter((item) => item.productoId !== line.productoId)
            .concat({ ...line, guardado: false }) }
          : { lines: [...state.lines, { ...line, guardado: false }] }
      )),
      saveForLater: (productoId) => set((state) => ({
        lines: state.lines.map((line) =>
          line.productoId === productoId ? { ...line, guardado: true } : line),
      })),
      clear: () => set({ lines: [] }),
      prune: (products) => set((state) => ({ lines: pruneCartLines(state.lines, products) })),
      replace: (lines) => set({ lines: migrateCartLines({ lines }) }),
      count: () => cartCount(get().lines),
    }),
    {
      name: KEYS.cart,
      storage: createJSONStorage(() => safeStorage),
      version: 3,
      migrate: (persisted) => ({ lines: migrateCartLines(persisted) }) as CartStore,
      partialize: (state) => ({ lines: state.lines }) as CartStore,
    },
  ),
)

/* Sincronización entre pestañas: solo aplica si el contenido cambió, para no
   generar un ciclo de escritura entre documentos. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== KEYS.cart || !event.newValue) return
    try {
      const parsed = JSON.parse(event.newValue) as { state?: { lines?: unknown } }
      const incoming = migrateCartLines(parsed.state)
      const current = useCartStore.getState().lines
      if (JSON.stringify(incoming) !== JSON.stringify(current)) {
        useCartStore.setState({ lines: incoming })
      }
    } catch { /* ignore */ }
  })
}
