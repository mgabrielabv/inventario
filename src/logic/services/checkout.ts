/* Validación por paso, cupones, revalidación y armado del pedido. */

import { validateCart, type CartIssue } from './cart'
import { buildOrderLines, createOrder } from './orders'
import {
  calcTotals, couponDiscount, findCoupon, formatMoney, type Totals,
} from './pricing'
import { validateCheckout } from './validation'
import type {
  CartLine, Order, OrderDelivery, PaymentMethod, Product, Settings,
} from '../types'

export interface CheckoutDraft {
  nombre: string
  telefono: string
  email: string
  documento: string
  entrega: 'retiro' | 'delivery'
  direccion: string
  zona: string
  referencia: string
  notas: string
  metodo: PaymentMethod
  pagoReferencia: string
  vuelto: number
  comprobante?: string
  cupon: string
  ventana: string
  acepta: boolean
}

export const emptyDraft = (): CheckoutDraft => ({
  nombre: '', telefono: '', email: '', documento: '', entrega: 'retiro',
  direccion: '', zona: '', referencia: '', notas: '', metodo: 'efectivo',
  pagoReferencia: '', vuelto: 0, cupon: '', ventana: '', acepta: false,
})

export const STEP_FIELDS: Array<Array<keyof CheckoutDraft>> = [
  ['nombre', 'telefono', 'email'],
  ['direccion', 'zona'],
  ['pagoReferencia', 'vuelto'],
  ['acepta'],
]

/** Solo valida el paso visible: nunca bloquea campos que aún no se muestran. */
export const validateStep = (
  draft: CheckoutDraft, step: number, entrega: OrderDelivery,
): Record<string, string> => {
  const all = validateCheckout({
    nombre: draft.nombre, telefono: draft.telefono, email: draft.email,
    direccion: entrega.direccion, zona: entrega.zona,
    entrega: entrega.tipo, acepta: draft.acepta,
  })
  if (draft.metodo === 'movil' && !draft.pagoReferencia.trim()) {
    all.pagoReferencia = 'Escribe la referencia del pago móvil'
  }
  if (draft.metodo === 'efectivo' && (!Number.isFinite(draft.vuelto) || draft.vuelto < 0)) {
    all.vuelto = 'El vuelto no puede ser negativo'
  }
  const found: Record<string, string> = {}
  for (const key of STEP_FIELDS[step] ?? []) {
    if (all[key]) found[key] = all[key]
  }
  return found
}

export interface CouponStatus {
  mensaje: string
  valido: boolean
  descuento: number
}

/** Un cupón invitado no bloquea la compra: solo informa por qué no aplica. */
export const couponStatus = (
  code: string, settings: Settings, subtotal: number,
): CouponStatus => {
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) return { mensaje: '', valido: false, descuento: 0 }
  const coupon = findCoupon(trimmed, settings)
  if (!coupon) return { mensaje: 'Ese cupón no existe o está inactivo.', valido: false, descuento: 0 }
  if (coupon.tipo === 'envio') {
    return { mensaje: 'Envío sin costo aplicado.', valido: true, descuento: 0 }
  }
  if (coupon.minimo && subtotal < coupon.minimo) {
    return {
      mensaje: `Requiere un mínimo de ${formatMoney(coupon.minimo)}.`,
      valido: false, descuento: 0,
    }
  }
  const descuento = couponDiscount(subtotal, coupon)
  return { mensaje: `${coupon.codigo}: ${formatMoney(descuento)} de descuento.`, valido: true, descuento }
}

export interface CheckoutContext {
  cart: CartLine[]
  products: Product[]
  orders: Order[]
  settings: Settings
  entrega: OrderDelivery
  cupon?: string
  clienteId?: string
}

/** Revisión final de stock, precio y total justo antes de confirmar. */
export const revalidateCheckout = (context: CheckoutContext): {
  ok: boolean
  issues: CartIssue[]
  totals: Totals
  coupon: CouponStatus
} => {
  const issues = validateCart(context.cart, context.products, context.orders)
  const lineas = buildOrderLines(context.cart, context.products)
  const totals = calcTotals(
    lineas, context.entrega, context.settings, findCoupon(context.cupon ?? '', context.settings),
  )
  return {
    ok: issues.length === 0,
    issues,
    totals,
    coupon: couponStatus(context.cupon ?? '', context.settings, totals.subtotal),
  }
}

/** Traduce el borrador persistido a la entrada del servicio de pedidos. */
export const buildCheckoutOrder = (
  draft: CheckoutDraft, context: Omit<CheckoutContext, 'cupon'>, now?: Date,
): Order => createOrder({
  products: context.products,
  orders: context.orders,
  cart: context.cart,
  cliente: {
    nombre: draft.nombre.trim(),
    telefono: draft.telefono.trim(),
    email: draft.email.trim() || undefined,
    documento: draft.documento.trim() || undefined,
  },
  clienteId: context.clienteId,
  entrega: context.entrega,
  pago: {
    metodo: draft.metodo,
    referencia: draft.pagoReferencia.trim() || undefined,
    comprobante: draft.comprobante,
    vuelto: draft.metodo === 'efectivo' && draft.vuelto > 0 ? draft.vuelto : undefined,
  },
  settings: context.settings,
  cupon: draft.cupon.trim(),
  nota: draft.notas.trim(),
  ventana: draft.ventana || undefined,
  now,
})
