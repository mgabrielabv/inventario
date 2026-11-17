import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { initialMovements, initialProducts } from '../../data/products'
import type { Movement, Product } from '../types'
import { safeStorage } from '../services/storage'

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
      name: 'atelier-inventory-storage',
      storage: createJSONStorage(() => safeStorage),
      version: 1,
    },
  ),
)
