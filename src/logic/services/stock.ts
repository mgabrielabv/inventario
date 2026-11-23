import { AppError } from '../errors'
import { ACTIVE_ORDER_STATUSES, type Movement, type MovementInput, type Order,
  type Product, type ProductStatus, type StatusInfo } from '../types'

export const STATUS_LABEL: Record<ProductStatus, StatusInfo['label']> = {
  agotado: 'Agotado', critico: 'Crítico', bajo: 'Bajo', normal: 'Normal',
}

/** Único lugar donde se deriva el estado de stock (recibe existencias disponibles). */
export const getStockStatus = (disponible: number, minimo: number): StatusInfo => {
  const safeStock = Number.isFinite(disponible) ? Math.max(0, disponible) : 0
  const safeMin = Number.isFinite(minimo) ? Math.max(0, minimo) : 0
  let status: ProductStatus = 'normal'
  if (safeStock <= 0) status = 'agotado'
  else if (safeStock <= safeMin / 2) status = 'critico'
  else if (safeStock <= safeMin) status = 'bajo'
  return { status, label: STATUS_LABEL[status] }
}

/** Unidades apartadas por pedidos aún no entregados ni cancelados. */
export const getReserved = (productoId: string, orders: Order[]): number =>
  orders
    .filter((order) => ACTIVE_ORDER_STATUSES.includes(order.estado))
    .flatMap((order) => order.lineas)
    .filter((line) => line.productoId === productoId)
    .reduce((sum, line) => sum + line.cantidad, 0)

export const getAvailable = (product: Product, orders: Order[]): number =>
  Math.max(0, product.stock - getReserved(product.id, orders))

export const getProductStatus = (product: Product, orders: Order[] = []): StatusInfo =>
  getStockStatus(orders.length ? getAvailable(product, orders) : product.stock, product.stockMinimo)

/** Etiqueta que ve el cliente, siempre punto + texto. */
export const getStoreStatus = (available: number): {
  status: 'disponible' | 'pocas' | 'agotado'; label: string
} => {
  if (available <= 0) return { status: 'agotado', label: 'Agotado' }
  if (available <= 5) return { status: 'pocas', label: `Quedan ${available}` }
  return { status: 'disponible', label: 'Disponible' }
}

export const needsReplenishment = (product: Product, orders: Order[] = []): boolean =>
  getProductStatus(product, orders).status !== 'normal'

export const getTargetStock = (product: Product): number =>
  product.stockObjetivo > 0 ? product.stockObjetivo : product.stockMinimo * 2

/** Cantidad sugerida de reposición: objetivo menos existencias disponibles. */
export const getSuggestedQuantity = (product: Product, orders: Order[] = []): number =>
  Math.max(0, getTargetStock(product) - getAvailable(product, orders))

const URGENCY: Record<ProductStatus, number> = { agotado: 0, critico: 1, bajo: 2, normal: 3 }

export const compareUrgency = (a: Product, b: Product, orders: Order[] = []): number => {
  const statusA = getProductStatus(a, orders).status
  const statusB = getProductStatus(b, orders).status
  if (statusA !== statusB) return URGENCY[statusA] - URGENCY[statusB]
  const ratioA = getAvailable(a, orders) / Math.max(1, a.stockMinimo)
  const ratioB = getAvailable(b, orders) / Math.max(1, b.stockMinimo)
  return ratioA - ratioB
}

export const getMovementDelta = (movement: Movement): number =>
  movement.stockDespues - movement.stockAntes

export interface AppliedMovement { product: Product; stockAntes: number; stockDespues: number }

/** Aplica un movimiento a un producto y devuelve las cifras coherentes. */
export const applyMovement = (product: Product, input: MovementInput): AppliedMovement => {
  const cantidad = Number(input.cantidad)
  if (!Number.isFinite(cantidad)) {
    throw new AppError('VALIDATION', 'La cantidad debe ser un número', 'cantidad')
  }
  if (input.tipo === 'Ajuste') {
    if (cantidad < 0) throw new AppError('VALIDATION', 'El conteo real no puede ser negativo', 'cantidad')
  } else if (cantidad <= 0) {
    throw new AppError('VALIDATION', 'La cantidad debe ser mayor que cero', 'cantidad')
  }
  if (product.archivado) {
    throw new AppError('VALIDATION', 'El producto está archivado', 'productoId')
  }

  const stockAntes = product.stock
  const stockDespues =
    input.tipo === 'Entrada' ? stockAntes + cantidad
      : input.tipo === 'Salida' ? stockAntes - cantidad
        : cantidad

  if (stockDespues < 0) {
    throw new AppError('STOCK',
      `No hay stock suficiente: disponible ${stockAntes} y la salida es de ${cantidad}.`, 'cantidad')
  }

  return {
    product: { ...product, stock: stockDespues, actualizadoEn: new Date().toISOString() },
    stockAntes, stockDespues,
  }
}

export const buildVoidMovement = (
  original: Movement, product: Product, usuario: string, nota: string,
  now: string = new Date().toISOString(),
): Movement => {
  if (original.anuladoPor) throw new AppError('CONFLICT', 'Ese movimiento ya fue anulado')
  if (original.motivo === 'Anulación') {
    throw new AppError('CONFLICT', 'Un movimiento de anulación no se puede anular')
  }
  const tipo: Movement['tipo'] =
    original.tipo === 'Entrada' ? 'Salida' : original.tipo === 'Salida' ? 'Entrada' : 'Ajuste'
  const cantidad = original.tipo === 'Ajuste' ? original.stockAntes : Math.abs(original.cantidad)
  const stockDespues =
    tipo === 'Entrada' ? product.stock + cantidad
      : tipo === 'Salida' ? product.stock - cantidad : cantidad

  if (stockDespues < 0) {
    throw new AppError('STOCK',
      'No se puede anular: el stock resultante sería negativo porque hubo movimientos posteriores.')
  }
  return {
    id: '', fecha: now, productoId: product.id, productoNombre: product.nombre,
    tipo, cantidad, stockAntes: product.stock, stockDespues,
    motivo: 'Anulación', referencia: original.referencia, nota, usuario, anulaA: original.id,
  }
}

export interface KardexRow { movement: Movement; saldo: number }

export const buildKardex = (movements: Movement[]): KardexRow[] => {
  const sorted = [...movements].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  )
  if (sorted.length === 0) return []
  let saldo = sorted[0]!.stockAntes
  return sorted.map((movement) => {
    saldo += getMovementDelta(movement)
    return { movement, saldo }
  })
}

const isSameDay = (iso: string, date: Date): boolean => {
  const value = new Date(iso)
  return value.getFullYear() === date.getFullYear()
    && value.getMonth() === date.getMonth()
    && value.getDate() === date.getDate()
}

export interface InventorySummary {
  activeProducts: number
  units: number
  value: number | null
  needsReplenishment: number
  todayEntries: number
  todayExits: number
  pedidosPorAtender: number
  ventasHoy: number
}

export const getInventorySummary = (
  products: Product[], movements: Movement[], orders: Order[] = [], now: Date = new Date(),
): InventorySummary => {
  const active = products.filter((p) => !p.archivado)
  const today = movements.filter((m) => isSameDay(m.fecha, now))
  return {
    activeProducts: active.length,
    units: active.reduce((total, p) => total + p.stock, 0),
    value: active.some((p) => p.costo !== null)
      ? active.reduce((total, p) => total + p.stock * (p.costo ?? 0), 0)
      : null,
    needsReplenishment: active.filter((p) => needsReplenishment(p, orders)).length,
    todayEntries: today.filter((m) => m.tipo === 'Entrada').length,
    todayExits: today.filter((m) => m.tipo === 'Salida').length,
    pedidosPorAtender: orders.filter((order) => order.estado === 'Pendiente').length,
    ventasHoy: orders
      .filter((order) => order.estado === 'Entregado' && isSameDay(order.fecha, now))
      .reduce((total, order) => total + order.total, 0),
  }
}

export interface DailyFlow { date: Date; label: string; entradas: number; salidas: number }

export const getDailyFlow = (movements: Movement[], days = 14, now = new Date()): DailyFlow[] => {
  const result: DailyFlow[] = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    const inRange = movements.filter((m) => {
      const time = new Date(m.fecha).getTime()
      return time >= date.getTime() && time < next.getTime()
    })
    result.push({
      date,
      label: date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
      entradas: inRange.filter((m) => m.tipo === 'Entrada').reduce((s, m) => s + m.cantidad, 0),
      salidas: inRange.filter((m) => m.tipo === 'Salida').reduce((s, m) => s + m.cantidad, 0),
    })
  }
  return result
}

export interface CategoryStock { categoria: string; units: number; value: number; products: number }

export const getCategoryStock = (products: Product[]): CategoryStock[] => {
  const map = new Map<string, CategoryStock>()
  for (const product of products.filter((p) => !p.archivado)) {
    const current = map.get(product.categoria) ?? {
      categoria: product.categoria, units: 0, value: 0, products: 0,
    }
    current.units += product.stock
    current.value += product.stock * (product.costo ?? 0)
    current.products += 1
    map.set(product.categoria, current)
  }
  return [...map.values()].sort((a, b) => b.units - a.units)
}

export const getLastEntry = (productId: string, movements: Movement[]): Movement | null =>
  movements
    .filter((m) => m.productoId === productId && m.tipo === 'Entrada')
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0] ?? null

export const getMovementSummary = (movement: Movement): string =>
  movement.tipo === 'Ajuste'
    ? `Conteo: ${movement.stockAntes} → ${movement.stockDespues}`
    : `${movement.stockAntes} → ${movement.stockDespues}`
