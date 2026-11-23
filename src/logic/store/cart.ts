import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { KEYS, safeStorage } from '../services/storage'
import type { CartLine, Product } from '../types'

interface CartStore {
  lines: CartLine[]
  add: (productoId: string, cantidad?: number) => void
  setQuantity: (productoId: string, cantidad: number) => void
  remove: (productoId: string) => void
  restore: (line: CartLine) => void
  clear: () => void
  /** Descarta líneas de productos que ya no existen o no se pueden vender. */
  prune: (products: Product[]) => void
  count: () => number
}

const now = (): string => new Date().toISOString()

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (productoId, cantidad = 1) => set((state) => {
        const existing = state.lines.find((line) => line.productoId === productoId)
        if (existing) {
          return {
            lines: state.lines.map((line) =>
              line.productoId === productoId
                ? { ...line, cantidad: line.cantidad + cantidad, agregadoEn: now() }
                : line),
          }
        }
        return { lines: [...state.lines, { productoId, cantidad, agregadoEn: now() }] }
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
          ? state
          : { lines: [...state.lines, line] }
      )),
      clear: () => set({ lines: [] }),
      prune: (products) => set((state) => ({
        lines: state.lines.filter((line) => {
          const product = products.find((p) => p.id === line.productoId)
          return product && !product.archivado && product.publicado && product.precio !== null
        }),
      })),
      count: () => get().lines.reduce((sum, line) => sum + line.cantidad, 0),
    }),
    {
      name: KEYS.cart,
      storage: createJSONStorage(() => safeStorage),
      version: 2,
      partialize: (state) => ({ lines: state.lines }) as CartStore,
    },
  ),
)
