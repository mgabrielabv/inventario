/* Estimaciones de entrega: fechas relativas, sin promesas ni datos externos. */

import { formatMoney } from './pricing'
import type { OrderDelivery, Settings } from '../types'

export interface DeliveryEstimate {
  titulo: string
  detalle: string
  fecha: string
}

const addDays = (now: Date, days: number): string => {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Estimación determinista que puede mostrarse antes de confirmar el pedido. */
export const estimarEntrega = (
  entrega: OrderDelivery, settings: Settings, now: Date = new Date(),
): DeliveryEstimate => {
  if (entrega.tipo === 'retiro') {
    return {
      titulo: 'Retiro en 1 día hábil',
      detalle: settings.tienda.direccion,
      fecha: addDays(now, 1),
    }
  }
  const zona = settings.entrega.zonas.find((item) => item.nombre === entrega.zona)
  return {
    titulo: 'Delivery en 1–2 días hábiles',
    detalle: zona
      ? `${zona.nombre} · ${zona.tarifa === 0 ? 'sin costo' : formatMoney(zona.tarifa)}`
      : settings.tienda.direccion,
    fecha: addDays(now, 2),
  }
}

/** Texto corto para la tarjeta de entrega del checkout. */
export const entregaResumen = (entrega: OrderDelivery, settings: Settings): string =>
  entrega.tipo === 'retiro'
    ? settings.tienda.direccion
    : entrega.zona
      ? `Zona ${entrega.zona}${entrega.direccion ? ` · ${entrega.direccion}` : ''}`
      : 'Selecciona una zona'
