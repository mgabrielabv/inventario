import type { OrderDelivery, OrderLine, Settings } from '../types'

export interface Totals { subtotal: number; envio: number; total: number }

export const calcShipping = (
  entrega: OrderDelivery, settings: Settings, subtotal: number,
): number => {
  if (entrega.tipo !== 'delivery' || !settings.entrega.delivery) return 0
  if (settings.entrega.envioGratisDesde !== null && subtotal >= settings.entrega.envioGratisDesde) {
    return 0
  }
  const zone = settings.entrega.zonas.find((item) => item.nombre === entrega.zona)
  return zone?.tarifa ?? settings.entrega.zonas[0]?.tarifa ?? 0
}

export const calcTotals = (
  lineas: OrderLine[], entrega: OrderDelivery, settings: Settings,
): Totals => {
  const subtotal = lineas.reduce((sum, line) => sum + line.precioUnit * line.cantidad, 0)
  const envio = calcShipping(entrega, settings, subtotal)
  return { subtotal, envio, total: subtotal + envio }
}

export const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

const usd = new Intl.NumberFormat('es-VE', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
})
const plain = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})

export const formatMoney = (value: number): string => usd.format(value)
export const formatPlain = (value: number): string => plain.format(value)

/** Ref. Bs. solo si la configuración activa la tasa manual. */
export const formatSecondary = (value: number, settings: Settings): string | null => {
  const { tasaVES, mostrarSecundario } = settings.moneda
  if (!mostrarSecundario || tasaVES === null || tasaVES <= 0) return null
  const bs = value * tasaVES
  const formatted = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(bs)
  return `Ref. Bs. ${formatted}`
}
