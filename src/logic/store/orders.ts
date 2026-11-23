import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { initialOrders } from '../../data/products'
import { KEYS, safeStorage } from '../services/storage'
import { AppError } from '../errors'
import { deliveryMovements, transitionOrder } from '../services/orders'
import { useInventoryStore } from './inventory'
import type { Order, OrderStatus } from '../types'

interface OrdersStore {
  orders: Order[]
  add: (order: Order) => void
  replace: (orders: Order[]) => void
  setStatus: (id: string, estado: OrderStatus, usuario?: string, nota?: string) => Order
  verifyPayment: (id: string, usuario?: string) => void
  findByCode: (codigo: string, telefonoOrEmail: string) => Order | null
}

const last4 = (phone: string): string => phone.replace(/\D/g, '').slice(-4)

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set, get) => ({
      orders: initialOrders,
      add: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      replace: (orders) => set({ orders }),

      setStatus: (id, estado, usuario, nota) => {
        const order = get().orders.find((item) => item.id === id)
        if (!order) throw new AppError('NOT_FOUND', 'No existe ese pedido')
        const updated = transitionOrder(order, estado, usuario, nota)
        set((state) => ({ orders: state.orders.map((item) => (item.id === id ? updated : item)) }))

        // Entregar genera salidas por Venta y baja el stock real.
        if (estado === 'Entregado') {
          const inventory = useInventoryStore.getState()
          for (const movement of deliveryMovements(updated)) {
            inventory.addMovement({ ...movement, usuario: usuario ?? 'sistema' })
          }
        }
        // Cancelar no crea movimiento: solo libera la reserva al salir de estados activos.
        return updated
      },

      verifyPayment: (id, usuario) => set((state) => ({
        orders: state.orders.map((order) => order.id === id
          ? {
            ...order,
            pago: { ...order.pago, verificado: true },
            historial: [...order.historial, {
              estado: order.estado, fecha: new Date().toISOString(), usuario,
              nota: 'Pago verificado',
            }],
          }
          : order),
      })),

      findByCode: (codigo, dato) => {
        const needle = dato.trim().toLowerCase()
        return get().orders.find((order) =>
          order.codigo.toLowerCase() === codigo.trim().toLowerCase()
          && (last4(order.cliente.telefono) === needle.replace(/\D/g, '')
            || (order.cliente.email ?? '').toLowerCase() === needle)) ?? null
      },
    }),
    {
      name: KEYS.orders,
      storage: createJSONStorage(() => safeStorage),
      version: 1,
      partialize: (state) => ({ orders: state.orders }) as OrdersStore,
    },
  ),
)
