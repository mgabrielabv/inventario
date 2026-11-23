import type { BackupPayload } from '../types'

const VERSION = 2

export const buildBackup = (payload: Omit<BackupPayload, 'version' | 'exportedAt'>): BackupPayload => ({
  version: VERSION,
  exportedAt: new Date().toISOString(),
  ...payload,
})

/** Validación mínima de esquema antes de sobrescribir datos. */
export const validateBackup = (value: unknown): { ok: true; data: BackupPayload } | { ok: false; error: string } => {
  if (typeof value !== 'object' || value === null) return { ok: false, error: 'El archivo no contiene un objeto' }
  const data = value as Partial<BackupPayload>
  if (typeof data.version !== 'number') return { ok: false, error: 'Falta la versión del respaldo' }
  for (const key of ['products', 'movements', 'orders', 'users', 'activity'] as const) {
    if (!Array.isArray(data[key])) return { ok: false, error: `Falta la lista ${key}` }
  }
  if (!data.settings || typeof data.settings !== 'object') return { ok: false, error: 'Falta la configuración' }
  return { ok: true, data: data as BackupPayload }
}

export const backupSummary = (data: BackupPayload): string =>
  `${data.products.length} productos · ${data.movements.length} movimientos · ${data.orders.length} pedidos`
