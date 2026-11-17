import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialProducts, initialMovements } from '../data/products'
import type { Product, Movement } from '../data/products'

interface InventoryStore {
  products: Product[]
  movements: Movement[]
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: number, product: Partial<Product>) => void
  deleteProduct: (id: number) => void
  addMovement: (movement: Omit<Movement, 'id' | 'fecha'>) => void
  getProductStatus: (cantidad: number) => { status: 'normal' | 'low' | 'critical', label: string }
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      movements: initialMovements,

      addProduct: (product) => {
        set((state) => ({
          products: [
            ...state.products,
            {
              ...product,
              id: Date.now(),
            },
          ],
        }))
      },

      updateProduct: (id, updatedProduct) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updatedProduct } : p
          ),
        }))
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }))
      },

      addMovement: (movement) => {
        const newMovement: Movement = {
          ...movement,
          id: Date.now(),
          fecha: new Date().toISOString(),
        }

        set((state) => {
          const updatedProducts = state.products.map((p) => {
            if (p.id === movement.productoId) {
              if (movement.tipo === 'Entrada') {
                return { ...p, cantidad: p.cantidad + movement.cantidad }
              } else {
                return { ...p, cantidad: Math.max(0, p.cantidad - movement.cantidad) }
              }
            }
            return p
          })

          return {
            movements: [newMovement, ...state.movements],
            products: updatedProducts,
          }
        })
      },

      getProductStatus: (cantidad: number) => {
        if (cantidad < 5) return { status: 'critical', label: 'Crítico' }
        if (cantidad < 10) return { status: 'low', label: 'Bajo stock' }
        return { status: 'normal', label: 'Normal' }
      },
    }),
    {
      name: 'atelier-inventory-storage',
    }
  )
)
