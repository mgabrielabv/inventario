import { BRAND } from '../../config/brand'
import { LEGACY_ORDER_PREFIXES, LEGACY_PREFIX } from '../../config/legacy'
import { AppError } from '../errors'
import { getAvailable } from './stock'
import { calcTotals, findCoupon, formatMoney, roundMoney } from './pricing'
import {
  type CartLine, type MovementInput, type Order, type OrderCustomer,
  type OrderDelivery, type OrderLine, type OrderStatus, type PaymentMethod,
  type Product, type Settings,
} from '../types'

const FLOW: OrderStatus[] = ['Pendiente', 'Confirmado', 'Preparando', 'Listo', 'Entregado']

export const nextStatus = (status: OrderStatus): OrderStatus | null => {
  const index = FLOW.indexOf(status)
  return index < 0 || index >= FLOW.length - 1 ? null : FLOW[index + 1] ?? null
}

export const nextStatusLabel = (status: OrderStatus): string => {
  const next = nextStatus(status)
  return next === 'Confirmado' ? 'Confirmar'
    : next === 'Preparando' ? 'Preparar'
      : next === 'Listo' ? 'Marcar listo'
        : next === 'Entregado' ? 'Marcar entregado' : ''
}

export const generateOrderCode = (orders: Order[], now: Date = new Date()): string => {
  const year = now.getFullYear()
  const prefix = `${BRAND.orderPrefix}-${year}-`
  // Los pedidos históricos con el prefijo anterior también cuentan para la
  // secuencia del año, de modo que no aparezca un número repetido.
  const prefixes = [
    prefix,
    ...LEGACY_ORDER_PREFIXES.map((item) => `${item}-${year}-`),
    `${LEGACY_PREFIX.toUpperCase()}${year}-`,
  ]
  const last = orders
    .map((order) => order.codigo)
    .filter((code) => prefixes.some((item) => code.startsWith(item)))
    .map((code) => Number(code.slice(code.lastIndexOf('-') + 1)))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0)
  return `${prefix}${String(last + 1).padStart(6, '0')}`
}

export interface StockConflict { productoId: string; nombre: string; solicitado: number; disponible: number }

/** Revalidación usada tanto al comprar como al confirmar el pedido. */
export const findStockConflicts = (
  cart: CartLine[], products: Product[], orders: Order[],
): StockConflict[] =>
  cart.flatMap((line) => {
    const product = products.find((p) => p.id === line.productoId)
    if (!product || product.archivado || !product.publicado) {
      return [{ productoId: line.productoId, nombre: product?.nombre ?? 'Producto', solicitado: line.cantidad, disponible: 0 }]
    }
    const available = getAvailable(product, orders)
    return line.cantidad > available
      ? [{ productoId: product.id, nombre: product.nombre, solicitado: line.cantidad, disponible: available }]
      : []
  })

export const buildOrderLines = (cart: CartLine[], products: Product[]): OrderLine[] =>
  cart.flatMap((line) => {
    const product = products.find((p) => p.id === line.productoId)
    if (!product) return []
    return [{
      productoId: product.id,
      nombre: product.nombre,
      codigo: product.codigo,
      precioUnit: roundMoney(product.precio ?? 0),
      cantidad: line.cantidad,
    }]
  })

export interface CreateOrderInput {
  products: Product[]
  orders: Order[]
  cart: CartLine[]
  cliente: OrderCustomer
  clienteId?: string
  entrega: OrderDelivery
  pago: { metodo: PaymentMethod; referencia?: string; comprobante?: string; vuelto?: number }
  settings: Settings
  cupon?: string
  nota?: string
  ventana?: string
  now?: Date
}

export interface PriceChange {
  productoId: string
  nombre: string
  precioAlAgregar: number
  precioActual: number
}

/** Cambios de precio desde que se agregó la línea. No bloquean: se informan. */
export const findPriceChanges = (cart: CartLine[], products: Product[]): PriceChange[] =>
  cart.flatMap((line) => {
    if (line.precioAlAgregar === undefined) return []
    const product = products.find((item) => item.id === line.productoId)
    if (!product || product.precio === null) return []
    const actual = roundMoney(product.precio)
    return actual === roundMoney(line.precioAlAgregar) ? [] : [{
      productoId: product.id,
      nombre: product.nombre,
      precioAlAgregar: roundMoney(line.precioAlAgregar),
      precioActual: actual,
    }]
  })

export const createOrder = (input: CreateOrderInput): Order => {
  const now = input.now ?? new Date()
  const conflicts = findStockConflicts(input.cart, input.products, input.orders)
  if (conflicts.length > 0) {
    throw new AppError('CONFLICT', 'El stock cambió mientras comprabas. Revisa tu carrito.', 'carrito')
  }
  const lineas = buildOrderLines(input.cart, input.products)
  if (lineas.length === 0) throw new AppError('VALIDATION', 'El carrito está vacío', 'carrito')
  const max = input.settings.maxPorPedido
  if (max > 0 && lineas.reduce((sum, l) => sum + l.cantidad, 0) > max) {
    throw new AppError('VALIDATION', `El máximo por pedido es ${max} unidades`, 'carrito')
  }
  const coupon = findCoupon(input.cupon ?? '', input.settings)
  const { subtotal, descuento, envio, total } = calcTotals(
    lineas, input.entrega, input.settings, coupon,
  )
  return {
    id: `o-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    codigo: generateOrderCode(input.orders, now),
    fecha: now.toISOString(),
    cliente: input.cliente,
    clienteId: input.clienteId,
    entrega: input.entrega,
    lineas,
    subtotal: roundMoney(subtotal),
    descuento: roundMoney(descuento),
    cupon: coupon?.codigo,
    envio: roundMoney(envio),
    total: roundMoney(total),
    moneda: input.settings.moneda.codigo || 'USD',
    nota: input.nota?.trim() || undefined,
    ventana: input.ventana,
    pago: {
      metodo: input.pago.metodo,
      referencia: input.pago.referencia,
      comprobante: input.pago.comprobante,
      vuelto: input.pago.metodo === 'efectivo' && input.pago.vuelto && input.pago.vuelto > 0
        ? roundMoney(input.pago.vuelto) : undefined,
      verificado: false,
    },
    estado: 'Pendiente',
    historial: [{ estado: 'Pendiente', fecha: now.toISOString(), nota: 'Pedido recibido' }],
  }
}

export const transitionOrder = (
  order: Order, estado: OrderStatus, usuario?: string, nota?: string,
  now: Date = new Date(),
): Order => {
  if (order.estado === 'Cancelado' || order.estado === 'Entregado') {
    throw new AppError('CONFLICT', 'Ese pedido ya está cerrado')
  }
  const next = nextStatus(order.estado)
  if (estado !== 'Cancelado' && estado !== next) {
    throw new AppError('CONFLICT', `No se puede pasar de ${order.estado} a ${estado}`)
  }
  return {
    ...order,
    estado,
    historial: [...order.historial, { estado, fecha: now.toISOString(), usuario, nota }],
  }
}

/** Al entregar se generan salidas por Venta con el código como referencia. */
export const deliveryMovements = (order: Order): MovementInput[] =>
  order.lineas.map((line) => ({
    productoId: line.productoId,
    tipo: 'Salida' as const,
    cantidad: line.cantidad,
    motivo: 'Venta' as const,
    referencia: order.codigo,
    nota: `Entrega de pedido ${order.codigo}`,
  }))

/** Comparte el pedido por WhatsApp con un resumen sobrio. */
export const whatsappLink = (order: Order, telefono: string, tienda: string): string => {
  const lineas = order.lineas
    .map((line) => `· ${line.cantidad} × ${line.nombre}`)
    .join('\n')
  const texto = `${tienda}\nPedido ${order.codigo}\n${lineas}\nTotal: ${formatMoney(order.total, order.moneda)}\nEstado: ${order.estado}`
  return `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`
}
