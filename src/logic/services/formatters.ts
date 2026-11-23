import type { Settings } from '../types'

export const normalizeText = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const slugify = (value: string): string =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'producto'

export const pad2 = (value: number): string => value.toString().padStart(2, '0')

export const formatNumber = (value: number): string => value.toLocaleString('es-VE')

export const formatLongDate = (date: Date = new Date()): string =>
  date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })

export const formatGroupDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

export const formatShortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })

export const formatRelativeTime = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (diff < 1) return 'ahora'
  if (diff < 60) return `hace ${diff} min`
  if (diff < 1440) return `hace ${Math.floor(diff / 60)} h`
  return `hace ${Math.floor(diff / 1440)} d`
}

export const formatPhoneDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`
  }
  return phone
}

export const storeName = (settings: Settings): string => settings.tienda.nombre.trim() || 'Inventario'

export const pluralize = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural
