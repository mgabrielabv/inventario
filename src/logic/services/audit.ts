import { KEYS, readJson, writeJson } from './storage'
import type { ActivityEntry } from '../types'

export const getActivity = (): ActivityEntry[] => readJson<ActivityEntry[]>(KEYS.activity, [])

export const logActivity = (usuario: string, accion: string, detalle: string): void => {
  const entry: ActivityEntry = {
    id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    fecha: new Date().toISOString(), usuario, accion, detalle,
  }
  writeJson(KEYS.activity, [entry, ...getActivity()].slice(0, 400))
}
