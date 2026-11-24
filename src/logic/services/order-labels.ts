import type { OrderStatus } from '../types'

/** Estados de siempre para la tienda; el panel conserva su vocabulario técnico. */
const LABELS: Record<OrderStatus, string> = {
  Pendiente: 'Recibido',
  Confirmado: 'Confirmado',
  Preparando: 'Preparando tu pedido',
  Listo: 'Listo para ti',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
}

const DETAILS: Record<OrderStatus, string> = {
  Pendiente: 'Lo recibimos y lo estamos revisando.',
  Confirmado: 'Tu pago o compra quedó confirmada.',
  Preparando: 'Estamos reuniendo tus productos.',
  Listo: 'Ya puedes recogerlo o está por salir a entrega.',
  Entregado: 'Entrega completada. ¡Gracias por comprar con nosotros!',
  Cancelado: 'Este pedido no se llevó a cabo.',
}

export const friendlyStatus = (estado: OrderStatus): string => LABELS[estado] ?? estado
export const friendlyStatusDetail = (estado: OrderStatus): string => DETAILS[estado] ?? ''
