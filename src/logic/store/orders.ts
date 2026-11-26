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

const wasFillerId = (id: unknown): boolean =>
  typeof id === 'string' && /^p\d{3}$/.test(id)

/** Los pedidos guardados antes del rediseño no tenían descuento ni comprobante. */
const normalizeOrder = (value: unknown): Order | null => {
  if (!value || typeof value !== 'object') return null
  const order = value as Order
  if (!order.codigo || !Array.isArray(order.lineas)) return null
  const subtotal = typeof order.subtotal === 'number' ? order.subtotal : 0
  const envio = typeof order.envio === 'number' ? order.envio : 0
  const total = typeof order.total === 'number' ? order.total : subtotal + envio
  return {
    ...order,
    descuento: typeof order.descuento === 'number' ? order.descuento : 0,
    envio,
    subtotal,
    total,
    pago: {
      ...order.pago,
      verificado: typeof order.pago?.verificado === 'boolean' ? order.pago.verificado : false,
    },
    historial: Array.isArray(order.historial) ? order.historial : [],
  }
}

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
        const digits = needle.replace(/\D/g, '')
        return get().orders.find((order) => {
          if (order.codigo.toLowerCase() !== codigo.trim().toLowerCase()) return false
          const phone = order.cliente.telefono.replace(/\D/g, '')
          return (digits.length >= 4 && phone.endsWith(digits))
            || (order.cliente.email ?? '').toLowerCase() === needle
        }) ?? null
      },
    }),
    {
      name: KEYS.orders,
      storage: createJSONStorage(() => safeStorage),
      version: 3,
      migrate: (persisted) => {
        const state = persisted as Partial<OrdersStore> | undefined
        const orders = (state?.orders ?? [])
          .map(normalizeOrder)
          .filter((order): order is Order => order !== null)
          .filter((order) => !order.lineas.some((linea) => wasFillerId(linea.productoId)))
        return { orders: orders.length ? orders : initialOrders } as OrdersStore
      },
      partialize: (state) => ({ orders: state.orders }) as OrdersStore,
    },
  ),
)
