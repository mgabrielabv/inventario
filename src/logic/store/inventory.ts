import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { initialMovements, initialProducts } from '../../data/products'
import type { Movement, Product } from '../types'
import { safeStorage, storageKey } from '../services/storage'

interface InventoryStore {
  products: Product[]
  movements: Movement[]
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: number, product: Partial<Product>) => void
  deleteProduct: (id: number) => void
  addMovement: (movement: Omit<Movement, 'id' | 'fecha'>) => void
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set) => ({
      products: initialProducts,
      movements: initialMovements,

      addProduct: (product) => {
        set((state) => ({
          products: [...state.products, { ...product, id: Date.now() }],
        }))
      },

      updateProduct: (id, updatedProduct) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id ? { ...product, ...updatedProduct } : product,
          ),
        }))
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        }))
      },

      addMovement: (movement) => {
        const newMovement: Movement = {
          ...movement,
          id: Date.now(),
          fecha: new Date().toISOString(),
        }

        set((state) => ({
          movements: [newMovement, ...state.movements],
          products: state.products.map((product) => {
            if (product.id !== movement.productoId) return product
            const nextQuantity =
              movement.tipo === 'Entrada'
                ? product.cantidad + movement.cantidad
                : Math.max(0, product.cantidad - movement.cantidad)
            return { ...product, cantidad: nextQuantity }
          }),
        }))
      },
    }),
    {
      name: storageKey('inventory-storage'),
      storage: createJSONStorage(() => safeStorage),
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Partial<InventoryStore> | undefined
        if (!state || version >= 2) return state as InventoryStore

        // Los movimientos semilla de la v1 quedaron anclados a octubre de 2026.
        // Se reemplazan por los relativos a hoy y se conservan los del usuario.
        const isLegacySeed = (movement: Movement) =>
          movement.id >= 1 && movement.id <= 5 && movement.fecha.startsWith('2026-10-26')

        const userMovements = (state.movements ?? []).filter(
          (movement) => !isLegacySeed(movement),
        )

        return {
          ...state,
          movements: [...initialMovements, ...userMovements].sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
          ),
        } as InventoryStore
      },
    },
  ),
)
