import { describe, expect, it } from 'vitest'
import {
  calcTotals, findCoupon, formatMoney, formatPlain, formatSecondary, roundMoney,
} from './pricing'
import type { OrderDelivery, OrderLine, Settings } from '../types'

const settings: Settings = {
  tienda: { nombre: 'Demo', direccion: 'Caracas', horario: 'Lun a Vie', telefono: '0424', whatsapp: '58424' },
  entrega: {
    retiro: true, delivery: true, zonas: [{ nombre: 'Caracas', tarifa: 5 }],
    envioGratisDesde: null, ventanas: ['09:00 – 12:00'],
  },
  pagos: {
    efectivo: true, transferencia: true, datosTransferencia: 'Demo', movil: true,
    datosMovil: '0424', tarjetaDemo: true,
  },
  promociones: {
    cupones: [
      { codigo: 'BIENVENIDO10', tipo: 'porcentaje', valor: 10, activo: true },
      { codigo: 'SOLO50', tipo: 'monto', valor: 5, minimo: 100, activo: true },
      { codigo: 'ENVIOGRATIS', tipo: 'envio', valor: 0, activo: true },
      { codigo: 'INACTIVO', tipo: 'monto', valor: 10, activo: false },
    ],
  },
  moneda: { codigo: 'USD', tasaVES: 40, fechaTasa: null, mostrarSecundario: true },
  catalogo: { categorias: [], unidades: ['unidad'], ubicaciones: [] },
  maxPorPedido: 20,
}

const lineas: OrderLine[] = [
  { productoId: 'p1', nombre: 'Artículo', codigo: '001', precioUnit: 50, cantidad: 2 },
]
const entrega: OrderDelivery = { tipo: 'delivery', zona: 'Caracas' }

describe('moneda y cupones', () => {
  it('formatea con el mismo separador siempre', () => {
    expect(formatMoney(35)).toBe('USD 35,00')
    expect(formatMoney(815)).toBe('USD 815,00')
    expect(formatMoney(1234.5, 'Bs')).toBe('Bs 1.234,50')
    expect(formatPlain(0)).toBe('0,00')
    expect(roundMoney(1.005)).toBe(1.01)
  })

  it('aplica porcentaje, monto mínimo y envío gratis', () => {
    expect(findCoupon(' bienvenido10 ', settings)?.codigo).toBe('BIENVENIDO10')
    expect(findCoupon('INACTIVO', settings)).toBeNull()
    expect(calcTotals(lineas, entrega, settings, findCoupon('BIENVENIDO10', settings)))
      .toMatchObject({ subtotal: 100, descuento: 10, envio: 5, total: 95 })
    expect(calcTotals(lineas, entrega, settings, findCoupon('SOLO50', settings)).descuento).toBe(5)
    const free = calcTotals(lineas, entrega, settings, findCoupon('ENVIOGRATIS', settings))
    expect(free).toMatchObject({ descuento: 0, envio: 0, total: 100 })
  })

  it('calcula la referencia secundaria en bolívares', () => {
    expect(formatSecondary(10, settings)).toBe('Ref. Bs. 400,00')
    expect(formatSecondary(10, { ...settings, moneda: { ...settings.moneda, mostrarSecundario: false } }))
      .toBeNull()
  })
})
