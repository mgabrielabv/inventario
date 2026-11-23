import { describe, expect, it } from 'vitest'
import { estimarEntrega } from './delivery'
import {
  buildCheckoutOrder, couponStatus, emptyDraft, revalidateCheckout, validateStep,
} from './checkout'
import { boughtTogether, recentlyViewed, relatedProducts } from './recommendations'
import type { Order, Product, Settings } from '../types'

const NOW = new Date('2026-11-22T12:00:00Z')

const settings: Settings = {
  tienda: { nombre: 'Demo', direccion: 'Av. Principal', horario: 'Lun a Vie', telefono: '0424', whatsapp: '58424' },
  entrega: {
    retiro: true, delivery: true, zonas: [{ nombre: 'Caracas', tarifa: 5 }],
    envioGratisDesde: null, ventanas: ['09:00 – 12:00'],
  },
  pagos: {
    efectivo: true, transferencia: true, datosTransferencia: 'Banco demo',
    movil: true, datosMovil: '0424', tarjetaDemo: true,
  },
  promociones: {
    cupones: [
      { codigo: 'BIENVENIDO10', tipo: 'porcentaje', valor: 10, activo: true },
      { codigo: 'SOLO100', tipo: 'monto', valor: 10, minimo: 100, activo: true },
      { codigo: 'ENVIOGRATIS', tipo: 'envio', valor: 0, activo: true },
    ],
  },
  moneda: { codigo: 'USD', tasaVES: null, fechaTasa: null, mostrarSecundario: false },
  catalogo: { categorias: [], unidades: ['unidad'], ubicaciones: [] },
  maxPorPedido: 20,
}

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1', codigo: '001', slug: 'p1', nombre: 'Producto uno', categoria: 'Electrónica',
  unidad: 'unidad', stock: 10, stockMinimo: 2, stockObjetivo: 12, ubicacion: 'A-01',
  costo: 10, publicado: true, arquetipo: 'laptop', precio: 50, precioAnterior: null,
  descripcionCorta: '', descripcion: '', especificaciones: [], etiquetas: [],
  destacado: false, imagenes: [], proveedor: '', notas: '', archivado: false,
  creadoEn: '2026-01-01T00:00:00Z', actualizadoEn: '2026-01-01T00:00:00Z',
  ...overrides,
})

const products = [
  product(),
  product({ id: 'p2', codigo: '002', slug: 'p2', nombre: 'Producto dos', precio: 60 }),
  product({ id: 'p3', codigo: '003', slug: 'p3', nombre: 'Cuaderno', categoria: 'Papelería', precio: 8 }),
]

const order = (lineas: string[]): Order => ({
  id: 'o1', codigo: 'INV-2026-1', fecha: NOW.toISOString(),
  cliente: { nombre: 'Cliente', telefono: '04241234567' },
  entrega: { tipo: 'retiro' },
  lineas: lineas.map((id, index) => ({
    productoId: id, nombre: id, codigo: String(index), precioUnit: 10, cantidad: 1,
  })),
  subtotal: 10, descuento: 0, envio: 0, total: 10, moneda: 'USD',
  pago: { metodo: 'efectivo', verificado: false }, estado: 'Entregado',
  historial: [{ estado: 'Entregado', fecha: NOW.toISOString() }],
})

describe('entrega', () => {
  it('estima fechas sin depender de la hora actual', () => {
    expect(estimarEntrega({ tipo: 'retiro' }, settings, NOW)).toMatchObject({
      titulo: 'Retiro en 1 día hábil', fecha: '2026-11-23',
    })
    expect(estimarEntrega({ tipo: 'delivery', zona: 'Caracas' }, settings, NOW)).toMatchObject({
      titulo: 'Delivery en 1–2 días hábiles', fecha: '2026-11-24',
      detalle: 'Caracas · USD 5,00',
    })
  })
})

describe('checkout', () => {
  const valid = {
    ...emptyDraft(), nombre: 'Ana Pérez', telefono: '04241234567', acepta: true,
  }

  it('valida solo el paso visible', () => {
    expect(validateStep(emptyDraft(), 0, { tipo: 'retiro' })).toHaveProperty('nombre')
    expect(validateStep(valid, 0, { tipo: 'retiro' })).toEqual({})
    expect(validateStep(valid, 1, { tipo: 'retiro' })).toEqual({})
    expect(validateStep(valid, 1, { tipo: 'delivery' })).toHaveProperty('direccion')
    expect(validateStep({ ...valid, metodo: 'movil' }, 2, { tipo: 'retiro' }))
      .toHaveProperty('pagoReferencia')
    expect(validateStep(valid, 3, { tipo: 'retiro' })).toEqual({})
  })

  it('informa cupones sin bloquear', () => {
    expect(couponStatus('BIENVENIDO10', settings, 100).valido).toBe(true)
    expect(couponStatus('SOLO100', settings, 50).valido).toBe(false)
    expect(couponStatus('NOEXISTE', settings, 50).valido).toBe(false)
    expect(couponStatus('ENVIOGRATIS', settings, 50).mensaje).toContain('Envío')
  })

  it('revalida stock y precios antes de cobrar', () => {
    const cart = [{ productoId: 'p1', cantidad: 1, agregadoEn: NOW.toISOString(), precioAlAgregar: 40 }]
    const result = revalidateCheckout({
      cart, products, orders: [], settings, entrega: { tipo: 'retiro' },
    })
    expect(result.ok).toBe(false)
    expect(result.issues.map((issue) => issue.tipo)).toEqual(['precio'])
    expect(result.totals.total).toBe(50)
  })

  it('arma el pedido con cupón, vuelto y comprobante', () => {
    const draft = {
      ...valid, metodo: 'efectivo' as const, vuelto: 20, cupon: 'BIENVENIDO10',
      notas: 'Dejar en portería', ventana: '09:00 – 12:00', comprobante: 'img-1',
    }
    const created = buildCheckoutOrder(draft, {
      cart: [{ productoId: 'p1', cantidad: 1, agregadoEn: NOW.toISOString() }],
      products, orders: [], settings, entrega: { tipo: 'retiro' },
    }, NOW)
    expect(created).toMatchObject({
      descuento: 5, total: 45, nota: 'Dejar en portería', ventana: '09:00 – 12:00',
    })
    expect(created.pago).toMatchObject({ vuelto: 20, comprobante: 'img-1' })
  })
})

describe('recomendaciones', () => {
  it('prioriza la misma categoría y pedidos compartidos', () => {
    expect(relatedProducts(products[0]!, products, 2).map((item) => item.id)).toEqual(['p2', 'p3'])
    expect(boughtTogether(products[0]!, [order(['p1', 'p3'])], products, 2).map((item) => item.id))
      .toEqual(['p3', 'p2'])
    expect(recentlyViewed(['p1', 'p3', 'p2'], products, 2).map((item) => item.id))
      .toEqual(['p1', 'p3'])
  })
})
