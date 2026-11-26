/* Datos de demostración sobre el catálogo real importado de las APIs.
   Ya no se generan fichas ilustradas ni marcas ficticias: los movimientos y
   pedidos de muestra apuntan a productos con foto real. */

import { BRAND } from '../config/brand'
import { realProducts } from '../logic/services/real-products'
import type { Movement, Order, Product } from '../logic/types'

const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString()
const daysAgo = (days: number): string => minutesAgo(days * 1440)

export const initialProducts: Product[] = realProducts

/** Productos con existencias para los datos de muestra; índice estable. */
const demoProducts = realProducts.filter((product) => product.stock > 5)
const demoId = (index: number): string =>
  demoProducts[index % demoProducts.length]?.id ?? realProducts[0]!.id

/* --- Movimientos semilla (fechas relativas a hoy) ----------------------- */
interface MovementSeed {
  id: string
  dias: number
  productoIndex: number
  tipo: Movement['tipo']
  cantidad: number
  motivo: Movement['motivo']
  usuario: string
  referencia?: string
  nota?: string
}

const movementSeeds: MovementSeed[] = [
  { id: 'm001', dias: 0, productoIndex: 1, tipo: 'Entrada', cantidad: 10, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2048', nota: 'Reposición de producto' },
  { id: 'm002', dias: 0, productoIndex: 2, tipo: 'Salida', cantidad: 2, motivo: 'Venta', usuario: 'operador', referencia: `${BRAND.orderPrefix}-2026-000004` },
  { id: 'm003', dias: 1, productoIndex: 0, tipo: 'Salida', cantidad: 3, motivo: 'Venta', usuario: 'admin', referencia: 'FAC-119' },
  { id: 'm004', dias: 1, productoIndex: 8, tipo: 'Entrada', cantidad: 15, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2041' },
  { id: 'm005', dias: 2, productoIndex: 4, tipo: 'Salida', cantidad: 1, motivo: 'Consumo interno', usuario: 'operador', nota: 'Unidad para recepción' },
  { id: 'm006', dias: 2, productoIndex: 9, tipo: 'Entrada', cantidad: 5, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2036' },
  { id: 'm007', dias: 3, productoIndex: 3, tipo: 'Salida', cantidad: 2, motivo: 'Venta', usuario: 'admin', referencia: 'FAC-112' },
  { id: 'm008', dias: 3, productoIndex: 5, tipo: 'Entrada', cantidad: 20, motivo: 'Compra', usuario: 'operador', referencia: 'OC-2031' },
  { id: 'm009', dias: 4, productoIndex: 13, tipo: 'Salida', cantidad: 1, motivo: 'Venta', usuario: 'admin', referencia: `${BRAND.orderPrefix}-2026-000003` },
  { id: 'm010', dias: 4, productoIndex: 19, tipo: 'Entrada', cantidad: 30, motivo: 'Compra', usuario: 'operador', referencia: 'OC-2029' },
  { id: 'm011', dias: 5, productoIndex: 7, tipo: 'Salida', cantidad: 2, motivo: 'Merma o daño', usuario: 'admin', nota: 'Unidades con fallo' },
  { id: 'm012', dias: 5, productoIndex: 12, tipo: 'Entrada', cantidad: 12, motivo: 'Devolución de cliente', usuario: 'operador', referencia: 'NC-018' },
  { id: 'm013', dias: 6, productoIndex: 16, tipo: 'Salida', cantidad: 1, motivo: 'Venta', usuario: 'admin' },
  { id: 'm014', dias: 6, productoIndex: 22, tipo: 'Entrada', cantidad: 8, motivo: 'Compra', usuario: 'operador', referencia: 'OC-2020' },
  { id: 'm015', dias: 7, productoIndex: 11, tipo: 'Ajuste', cantidad: 17, motivo: 'Ajuste por conteo', usuario: 'admin', nota: 'Conteo físico semanal' },
  { id: 'm016', dias: 7, productoIndex: 18, tipo: 'Salida', cantidad: 4, motivo: 'Venta', usuario: 'operador' },
  { id: 'm017', dias: 8, productoIndex: 15, tipo: 'Entrada', cantidad: 10, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2018' },
  { id: 'm018', dias: 9, productoIndex: 21, tipo: 'Salida', cantidad: 2, motivo: 'Consumo interno', usuario: 'operador', nota: 'Equipo de grabación' },
  { id: 'm019', dias: 10, productoIndex: 23, tipo: 'Entrada', cantidad: 24, motivo: 'Compra', usuario: 'operador', referencia: 'OC-2012' },
  { id: 'm020', dias: 10, productoIndex: 14, tipo: 'Salida', cantidad: 6, motivo: 'Venta', usuario: 'operador' },
  { id: 'm021', dias: 11, productoIndex: 6, tipo: 'Entrada', cantidad: 50, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2009' },
  { id: 'm022', dias: 12, productoIndex: 20, tipo: 'Salida', cantidad: 1, motivo: 'Merma o daño', usuario: 'operador', nota: 'Daño en transporte' },
  { id: 'm023', dias: 12, productoIndex: 17, tipo: 'Entrada', cantidad: 6, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2004' },
  { id: 'm024', dias: 13, productoIndex: 10, tipo: 'Salida', cantidad: 3, motivo: 'Venta', usuario: 'operador' },
  { id: 'm025', dias: 14, productoIndex: 24, tipo: 'Entrada', cantidad: 13, motivo: 'Inventario inicial', usuario: 'admin' },
]

const saldos = new Map(initialProducts.map((product) => [product.id, product.stock]))
export const initialMovements: Movement[] = movementSeeds.map((seed) => {
  const productoId = demoId(seed.productoIndex)
  const product = initialProducts.find((item) => item.id === productoId)
  const stockDespues = saldos.get(productoId) ?? 0
  const delta = seed.tipo === 'Entrada' ? seed.cantidad : seed.tipo === 'Salida' ? -seed.cantidad : 0
  const stockAntes = Math.max(0, stockDespues - (seed.tipo === 'Ajuste' ? 0 : delta))
  if (seed.tipo === 'Ajuste') saldos.set(productoId, seed.cantidad)
  else saldos.set(productoId, stockAntes)
  return {
    id: seed.id, fecha: daysAgo(seed.dias), productoId,
    productoNombre: product?.nombre ?? '', tipo: seed.tipo, cantidad: seed.cantidad,
    stockAntes, stockDespues, motivo: seed.motivo,
    referencia: seed.referencia ?? '', nota: seed.nota ?? '', usuario: seed.usuario,
  }
})

/* --- Pedidos semilla en distintos estados ------------------------------- */
const sampleOrder = (
  n: number, estado: Order['estado'], dias: number, productoIndices: number[], cantidades: number[],
  nombre: string, telefono: string, entrega: Order['entrega'], metodo: Order['pago']['metodo'],
): Order => {
  const lineas = productoIndices.map((index, i) => {
    const product = initialProducts.find((item) => item.id === demoId(index))!
    return {
      productoId: product.id, nombre: product.nombre, codigo: product.codigo,
      precioUnit: product.precio ?? 0, cantidad: cantidades[i] ?? 1,
    }
  })
  const subtotal = lineas.reduce((sum, linea) => sum + linea.precioUnit * linea.cantidad, 0)
  const envio = entrega.tipo === 'delivery' ? 5 : 0
  const fecha = daysAgo(dias)
  const historial: Order['historial'] = [
    { estado: 'Pendiente', fecha, usuario: 'sistema' },
    ...(estado === 'Pendiente' ? [] : [{ estado: 'Confirmado' as const, fecha: minutesAgo(dias * 1440 - 60), usuario: 'admin' }]),
    ...(['Preparando', 'Listo', 'Entregado'].includes(estado)
      ? [{ estado: 'Preparando' as const, fecha: minutesAgo(Math.max(0, dias * 1440 - 120)), usuario: 'operador' }] : []),
    ...(estado === 'Entregado' ? [{ estado: 'Entregado' as const, fecha: minutesAgo(Math.max(0, dias * 1440 - 240)), usuario: 'operador' }] : []),
    ...(estado === 'Cancelado' ? [{ estado: 'Cancelado' as const, fecha: minutesAgo(Math.max(0, dias * 1440 - 90)), usuario: 'admin', nota: 'Cancelado por el cliente' }] : []),
  ]
  return {
    id: `o-seed-${n}`, codigo: `${BRAND.orderPrefix}-2026-${String(n).padStart(6, '0')}`, fecha,
    cliente: { nombre, telefono, email: 'cliente@example.com' }, entrega, lineas,
    subtotal, descuento: 0, envio, total: subtotal + envio, moneda: 'USD',
    pago: { metodo, verificado: metodo !== 'efectivo' },
    estado, historial,
  }
}

export const initialOrders: Order[] = [
  sampleOrder(1, 'Pendiente', 0, [0, 1], [1, 1], 'María Rodríguez', '0424-1112233', { tipo: 'delivery', direccion: 'Calle 10, Caracas', zona: 'Caracas' }, 'transferencia'),
  sampleOrder(2, 'Confirmado', 0, [2], [1], 'Carlos Pérez', '0412-2223344', { tipo: 'retiro' }, 'efectivo'),
  sampleOrder(3, 'Preparando', 1, [3, 4], [1, 2], 'Ana González', '0426-3334455', { tipo: 'delivery', direccion: 'Los Teques', zona: 'Miranda' }, 'tarjeta-demo'),
  sampleOrder(4, 'Listo', 2, [5, 6], [2, 3], 'Luis Martínez', '0414-4445566', { tipo: 'retiro' }, 'efectivo'),
  sampleOrder(5, 'Entregado', 5, [7], [1], 'Sofía Hernández', '0424-5556677', { tipo: 'delivery', direccion: 'Caracas', zona: 'Caracas' }, 'transferencia'),
  sampleOrder(6, 'Cancelado', 7, [8], [1], 'Pedro Jiménez', '0416-6667788', { tipo: 'retiro' }, 'efectivo'),
]
