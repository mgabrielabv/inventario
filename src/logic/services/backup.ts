import type { BackupPayload } from '../types'
import { getCustomers } from './customer-auth'
import { realProducts } from './real-products'

const VERSION = 4
const wasFillerId = (id: unknown): boolean =>
  typeof id === 'string' && /^p\d{3}$/.test(id)

export const buildBackup = (payload: Omit<BackupPayload, 'version' | 'exportedAt'>): BackupPayload => ({
  ...payload,
  version: VERSION,
  exportedAt: new Date().toISOString(),
  customers: payload.customers ?? getCustomers(),
})

/** Validación mínima de esquema antes de sobrescribir datos. */
export const validateBackup = (value: unknown): { ok: true; data: BackupPayload } | { ok: false; error: string } => {
  if (typeof value !== 'object' || value === null) return { ok: false, error: 'El archivo no contiene un objeto' }
  const data = value as Partial<BackupPayload>
  if (typeof data.version !== 'number') return { ok: false, error: 'Falta la versión del respaldo' }
  for (const key of ['products', 'movements', 'orders', 'users', 'activity'] as const) {
    if (!Array.isArray(data[key])) return { ok: false, error: `Falta la lista ${key}` }
  }
  // v2 no incluye customers; v3 sí. Si aparece, debe ser una lista.
  if (data.customers !== undefined && !Array.isArray(data.customers)) {
    return { ok: false, error: 'La lista de clientes no es válida' }
  }
  if (!data.settings || typeof data.settings !== 'object') return { ok: false, error: 'Falta la configuración' }
  const payload = data as BackupPayload
  const productos = payload.products.filter((product) => !wasFillerId(product?.id))
  return {
    ok: true,
    data: {
      ...payload,
      products: productos.length ? productos : realProducts,
      movements: payload.movements.filter((movement) => !wasFillerId(movement?.productoId)),
      orders: payload.orders.filter((order) =>
        !order?.lineas?.some((linea) => wasFillerId(linea.productoId))),
    },
  }
}

export const backupSummary = (data: BackupPayload): string => {
  const base = `${data.products.length} productos · ${data.movements.length} movimientos · ${data.orders.length} pedidos`
  return data.customers ? `${base} · ${data.customers.length} clientes` : base
}
