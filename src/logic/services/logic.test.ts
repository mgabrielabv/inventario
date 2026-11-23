import { describe, expect, it } from 'vitest'
import { initialOrders, initialProducts } from '../../data/products'
import { defaultFilters, filterCatalog, parseFilters, serializeFilters } from './catalog'
import { formatMoney, calcTotals, calcShipping, roundMoney } from './pricing'
import { can } from './permissions'
import { hashPassword } from './auth'
import { normalizeText, slugify } from './formatters'
import { validateCheckout, validateMovementQuantity, validatePhone, validateProductDraft } from './validation'
import {
  applyMovement, buildVoidMovement, compareUrgency, getAvailable, getInventorySummary,
  getProductStatus, getReserved, getStoreStatus, needsReplenishment,
} from './stock'
import {
  createOrder, deliveryMovements, findStockConflicts, generateOrderCode, nextStatus, transitionOrder,
} from './orders'
import type { Movement, Order, Product } from '../types'

const product = (overrides: Partial<Product> = {}): Product => ({
  ...initialProducts[0]!,
  id: 'p-test', codigo: 'T-001', slug: 'producto-de-prueba', nombre: 'Producto de prueba',
  stock: 10, stockMinimo: 4, stockObjetivo: 12, precio: 20, publicado: true,
  archivado: false, ...overrides,
})

const order = (estado: Order['estado'], cantidad: number): Order => ({
  id: `o-${estado}`, codigo: `INV-2026-${estado}`, fecha: new Date().toISOString(),
  cliente: { nombre: 'Cliente', telefono: '04241234567' },
  entrega: { tipo: 'retiro' },
  lineas: [{ productoId: 'p-test', nombre: 'Producto de prueba', codigo: 'T-001', precioUnit: 20, cantidad }],
  subtotal: 20 * cantidad, envio: 0, total: 20 * cantidad, moneda: 'USD',
  pago: { metodo: 'efectivo', verificado: false }, estado,
  historial: [{ estado, fecha: new Date().toISOString() }],
})

const settings = {
  ...defaults(),
}

function defaults() {
  return {
    tienda: { nombre: 'Inventario', direccion: 'Av. Principal', horario: 'Lun a Vie', telefono: '0424', whatsapp: '58424' },
    entrega: { retiro: true, delivery: true, zonas: [{ nombre: 'Caracas', tarifa: 5 }], envioGratisDesde: 100 },
    pagos: { efectivo: true, transferencia: true, datosTransferencia: 'Banco demo', tarjetaDemo: true },
    moneda: { codigo: 'USD', tasaVES: null, fechaTasa: null, mostrarSecundario: false },
    catalogo: { categorias: ['Electrónica'], unidades: ['unidad' as const], ubicaciones: ['A-01'] },
    maxPorPedido: 20,
  }
}

describe('stock y reservas', () => {
  it('cuenta solo pedidos activos como reservado', () => {
    const orders = [order('Pendiente', 2), order('Listo', 3), order('Entregado', 4), order('Cancelado', 5)]
    expect(getReserved('p-test', orders)).toBe(5)
    expect(getAvailable(product(), orders)).toBe(5)
  })

  it('deriva estados a partir de existencias disponibles', () => {
    expect(getStoreStatus(0)).toEqual({ status: 'agotado', label: 'Agotado' })
    expect(getStoreStatus(3).label).toBe('Quedan 3')
    expect(getStoreStatus(9).label).toBe('Disponible')
    expect(getProductStatus(product({ stock: 2 }), [order('Confirmado', 1)]).status).toBe('critico')
    expect(needsReplenishment(product({ stock: 5 }))).toBe(false)
    expect(compareUrgency(product({ stock: 1 }), product({ stock: 8 }))).toBeLessThan(0)
  })

  it('aplica entradas, salidas y ajustes con validación', () => {
    const item = product()
    expect(applyMovement(item, { productoId: item.id, tipo: 'Entrada', cantidad: 5, motivo: 'Compra' }).product.stock).toBe(15)
    expect(applyMovement(item, { productoId: item.id, tipo: 'Salida', cantidad: 4, motivo: 'Venta' }).product.stock).toBe(6)
    expect(applyMovement(item, { productoId: item.id, tipo: 'Ajuste', cantidad: 7, motivo: 'Ajuste por conteo' }).product.stock).toBe(7)
    expect(() => applyMovement(item, { productoId: item.id, tipo: 'Salida', cantidad: 11, motivo: 'Venta' })).toThrow()
    expect(validateMovementQuantity('Salida', 11, 10)).toContain('insuficiente')
  })

  it('resume pedidos por atender y ventas del día', () => {
    const ahora = new Date('2026-05-10T12:00:00.000Z')
    const ayer = new Date('2026-05-09T12:00:00.000Z')
    const movements: Movement[] = [
      {
        id: 'm-hoy', fecha: ahora.toISOString(), productoId: 'p-test',
        productoNombre: 'Producto de prueba', tipo: 'Entrada', cantidad: 4,
        stockAntes: 10, stockDespues: 14, motivo: 'Compra', referencia: '', nota: '', usuario: 'admin',
      },
      {
        id: 'm-ayer', fecha: ayer.toISOString(), productoId: 'p-test',
        productoNombre: 'Producto de prueba', tipo: 'Salida', cantidad: 2,
        stockAntes: 14, stockDespues: 12, motivo: 'Venta', referencia: '', nota: '', usuario: 'admin',
      },
    ]
    const orders: Order[] = [
      order('Pendiente', 1), order('Pendiente', 2),
      { ...order('Entregado', 3), fecha: ahora.toISOString(), total: 60 },
      { ...order('Entregado', 4), fecha: ayer.toISOString(), total: 80 },
    ]

    const summary = getInventorySummary([product()], movements, orders, ahora)
    expect(summary.pedidosPorAtender).toBe(2)
    expect(summary.ventasHoy).toBe(60)
    expect(summary.todayEntries).toBe(1)
    expect(summary.todayExits).toBe(0)
  })

  it('anula un movimiento invirtiendo el efecto', () => {
    const item = product()
    const original = {
      id: 'mov-1', fecha: new Date().toISOString(), productoId: item.id, productoNombre: item.nombre,
      tipo: 'Entrada' as const, cantidad: 3, stockAntes: 10, stockDespues: 13,
      motivo: 'Compra' as const, referencia: 'F-1', nota: '', usuario: 'admin',
    }
    const reversed = buildVoidMovement(original, item, 'admin', 'Prueba')
    expect(reversed.tipo).toBe('Salida')
    expect(reversed.stockDespues).toBe(7)
  })
})

describe('pedidos', () => {
  it('genera códigos consecutivos por año', () => {
    const ahora = new Date('2026-05-10T12:00:00.000Z')
    expect(generateOrderCode(initialOrders, ahora)).toMatch(/^INV-2026-\d{6}$/)
  })

  it('rechaza un pedido cuando el stock cambió', () => {
    const item = product({ stock: 1 })
    const cart = [{ productoId: item.id, cantidad: 3, agregadoEn: new Date().toISOString() }]
    expect(findStockConflicts(cart, [item], [])).toHaveLength(1)
    expect(() => createOrder({
      products: [item], orders: [], cart, cliente: { nombre: 'Ana', telefono: '04241234567' },
      entrega: { tipo: 'retiro' }, pago: { metodo: 'efectivo' }, settings,
    })).toThrow()
  })

  it('crea un pedido pendiente y respeta el flujo de estados', () => {
    const item = product()
    const cart = [{ productoId: item.id, cantidad: 2, agregadoEn: new Date().toISOString() }]
    const created = createOrder({
      products: [item], orders: [], cart, cliente: { nombre: 'Ana', telefono: '04241234567' },
      entrega: { tipo: 'retiro' }, pago: { metodo: 'efectivo' }, settings,
    })
    expect(created.estado).toBe('Pendiente')
    expect(created.total).toBe(40)
    expect(nextStatus('Pendiente')).toBe('Confirmado')
    const confirmed = transitionOrder(created, 'Confirmado', 'admin')
    expect(confirmed.historial).toHaveLength(2)
    expect(() => transitionOrder(created, 'Listo', 'admin')).toThrow()
    expect(deliveryMovements(confirmed)[0]).toMatchObject({ tipo: 'Salida', motivo: 'Venta', cantidad: 2 })
  })
})

describe('catálogo, precios y permisos', () => {
  const catalog = [product(), product({ id: 'p-2', codigo: 'T-002', slug: 'otro', nombre: 'Otro artículo', precio: 10, stock: 0, destacado: false })]

  it('filtra, ordena y serializa filtros', () => {
    const filters = { ...defaultFilters(), q: 'otro', orden: 'precio-asc' as const }
    expect(filterCatalog(catalog, filters, []).map((item) => item.id)).toEqual(['p-2'])
    expect(filterCatalog(catalog, { ...defaultFilters(), solo: true }, []).map((item) => item.id)).toEqual(['p-test'])
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('calcula envío y totales con umbral de envío gratis', () => {
    const entrega = { tipo: 'delivery' as const, zona: 'Caracas' }
    expect(calcShipping(entrega, settings, 10)).toBe(5)
    expect(calcShipping(entrega, settings, 100)).toBe(0)
    const lineas = [{ productoId: 'x', nombre: 'x', codigo: 'x', precioUnit: 20, cantidad: 2 }]
    expect(calcTotals(lineas, entrega, settings)).toEqual({ subtotal: 40, envio: 5, total: 45 })
    expect(roundMoney(1.005)).toBe(1.01)
    expect(formatMoney(10)).toContain('10')
  })

  it('aplica la matriz de permisos', () => {
    const admin = { id: 'u1', username: 'admin', name: 'Admin', role: 'Administrador' as const }
    const operador = { id: 'u2', username: 'op', name: 'Op', role: 'Operador' as const }
    expect(can(admin, 'configurar')).toBe(true)
    expect(can(operador, 'configurar')).toBe(false)
    expect(can(operador, 'registrar:movimiento')).toBe(true)
    expect(can(null, 'ver:panel')).toBe(false)
  })
})

describe('validación y formato', () => {
  it('valida teléfonos, checkout y fichas de producto', () => {
    expect(validatePhone('0424-1234567')).toBeNull()
    expect(validatePhone('123')).toContain('formato')
    expect(validateCheckout({
      nombre: 'Ana Pérez', telefono: '0424-1234567', email: 'ana@ejemplo.com',
      entrega: 'delivery', direccion: 'Calle 1', zona: 'Caracas', acepta: true,
    })).toEqual({})
    expect(validateProductDraft({
      codigo: '', nombre: '', categoria: 'Otras', unidad: 'unidad', stockInicial: -1,
      stockMinimo: 0, stockObjetivo: 0, ubicacion: '', costo: null, precio: null,
      proveedor: '', notas: '',
    }).codigo).toBeDefined()
  })

  it('normaliza texto y slugs sin acentos', () => {
    expect(normalizeText('Café')).toBe('cafe')
    expect(slugify('Laptop 14" — Nueva')).toBe('laptop-14-nueva')
  })

  it('hasha credenciales demo con sal', async () => {
    const admin = await hashPassword('admin123', 'inv-admin-2026')
    const operador = await hashPassword('operador123', 'inv-operador-2026')
    expect(admin).toBe('55a6c758f93e02d2d236a1252c0b41819e7a65f9e57863e4a79b1a0b827b7c3e')
    expect(operador).toBe('04f102745831d6142633e63d90c704f5825b6102af8fb44b37d9383febb0cf3d')
  })
})
