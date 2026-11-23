import type { Coupon, OrderDelivery, OrderLine, Settings } from '../types'

export interface Totals {
  subtotal: number
  descuento: number
  envio: number
  total: number
  cupon?: string
}

export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

/** Formato determinista: `USD 35,00`. Sin espacios especiales ni símbolos ambiguos. */
const decimal = (value: number, digits = 2): string => {
  const safe = Number.isFinite(value) ? value : 0
  const fixed = Math.abs(safe).toFixed(digits)
  const [integer, fraction] = fixed.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${safe < 0 ? '-' : ''}${grouped}${fraction ? `,${fraction}` : ''}`
}

export const formatMoney = (value: number, moneda = 'USD'): string =>
  `${moneda || 'USD'} ${decimal(value)}`

export const formatPlain = (value: number): string => decimal(value)

export const findCoupon = (code: string, settings: Settings): Coupon | null => {
  const needle = code.trim().toUpperCase()
  if (!needle) return null
  return settings.promociones?.cupones.find(
    (coupon) => coupon.activo && coupon.codigo.toUpperCase() === needle,
  ) ?? null
}

/** Descuento sobre el subtotal. `ENVIOGRATIS` se resuelve en `calcShipping`. */
export const couponDiscount = (subtotal: number, coupon: Coupon | null): number => {
  if (!coupon || coupon.tipo === 'envio') return 0
  if (coupon.minimo && subtotal < coupon.minimo) return 0
  const raw = coupon.tipo === 'porcentaje'
    ? subtotal * coupon.valor / 100
    : coupon.valor
  return roundMoney(Math.min(subtotal, Math.max(0, raw)))
}

export const calcShipping = (
  entrega: OrderDelivery, settings: Settings, subtotal: number, coupon: Coupon | null = null,
): number => {
  if (entrega.tipo !== 'delivery' || !settings.entrega.delivery) return 0
  if (coupon?.tipo === 'envio') return 0
  if (settings.entrega.envioGratisDesde !== null && subtotal >= settings.entrega.envioGratisDesde) {
    return 0
  }
  const zone = settings.entrega.zonas.find((item) => item.nombre === entrega.zona)
  return zone?.tarifa ?? settings.entrega.zonas[0]?.tarifa ?? 0
}

export const calcTotals = (
  lineas: OrderLine[], entrega: OrderDelivery, settings: Settings,
  coupon: Coupon | null = null,
): Totals => {
  const subtotal = roundMoney(lineas.reduce((sum, line) => sum + line.precioUnit * line.cantidad, 0))
  const descuento = couponDiscount(subtotal, coupon)
  const base = subtotal - descuento
  const envio = calcShipping(entrega, settings, base, coupon)
  return {
    subtotal,
    descuento,
    envio: roundMoney(envio),
    total: roundMoney(base + envio),
    cupon: coupon?.codigo,
  }
}

/** Referencia informativa en bolívares, según la tasa manual configurada. */
export const toBolivares = (value: number, settings: Settings): number | null => {
  const { tasaVES, mostrarSecundario } = settings.moneda
  return !mostrarSecundario || tasaVES === null || tasaVES <= 0 ? null : roundMoney(value * tasaVES)
}

export const formatSecondary = (value: number, settings: Settings): string | null => {
  const bs = toBolivares(value, settings)
  return bs === null ? null : `Ref. Bs. ${decimal(bs)}`
}
