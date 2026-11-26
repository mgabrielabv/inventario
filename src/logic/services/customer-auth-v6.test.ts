import { beforeEach, describe, expect, it } from 'vitest'
import {
  addAddress, associateGuestOrders, authenticateCustomer, ensureDemoCustomer,
  findByEmail, findByPhone, getCustomers, normalizePhoneVE, ordersForAccount,
  passwordStrength, registerCustomer, removeAddress, saveCustomers, setCustomerActive,
  setDefaultAddress,
} from './customer-auth'
import { useCustomerStore } from '../store/customer'
import { useOrdersStore } from '../store/orders'
import type { Order } from '../types'

const order = (id: string, email: string | undefined, telefono: string, clienteId?: string): Order => ({
  id,
  codigo: `PED-2026-${id}`,
  fecha: '2026-11-20T12:00:00Z',
  cliente: { nombre: 'Ana Pérez', telefono, email },
  clienteId,
  entrega: { tipo: 'retiro' },
  lineas: [],
  subtotal: 10, descuento: 0, envio: 0, total: 10, moneda: 'USD',
  pago: { metodo: 'efectivo', verificado: false },
  estado: 'Confirmado',
  historial: [],
})

const signUp = () => registerCustomer({
  nombre: 'Ana', apellido: 'Pérez', email: 'ANA@Ejemplo.com',
  telefono: '0414-1234567', password: 'Segura2026',
})

describe('cuentas de cliente', () => {
  beforeEach(() => {
    saveCustomers([])
    useOrdersStore.getState().replace([])
    useCustomerStore.getState().clear()
  })

  it('registra, normaliza y autentica por correo o teléfono', async () => {
    const account = await signUp()
    expect(account.email).toBe('ana@ejemplo.com')
    expect(account.telefono).toBe('04141234567')
    expect(account.passwordHash).not.toBe('Segura2026')
    expect(findByEmail(' ana@ejemplo.com ')).toMatchObject({ id: account.id })
    expect(findByPhone('+58 414 1234567')).toMatchObject({ id: account.id })

    await expect(registerCustomer({
      nombre: 'Otra', apellido: 'Persona', email: 'ana@ejemplo.com',
      telefono: '0424-9999999', password: 'Segura2026',
    })).rejects.toThrow('Ya existe')
    await expect(authenticateCustomer('ana@ejemplo.com', 'malacontrasena'))
      .resolves.toMatchObject({ account: null, error: expect.stringContaining('incorrectos') })
    await expect(authenticateCustomer('04141234567', 'Segura2026'))
      .resolves.toMatchObject({ account: { id: account.id } })
  })

  it('respeta la validación venezolana y la fuerza de la contraseña', async () => {
    expect(normalizePhoneVE('+58 424 1234567')).toBe('04241234567')
    expect(normalizePhoneVE('584141234567')).toBe('04141234567')
    expect(normalizePhoneVE('123')).toBeNull()
    expect(passwordStrength('corta')).toBeLessThan(passwordStrength('Larga2026!'))
    await expect(registerCustomer({
      nombre: 'Luis', apellido: 'Díaz', email: 'luis@ejemplo.com',
      telefono: '1234', password: 'Segura2026',
    })).rejects.toThrow('teléfono venezolano')
  })

  it('bloquea intentos repetidos sin filtrar la cuenta', async () => {
    for (let i = 0; i < 5; i += 1) {
      await authenticateCustomer('bloqueo@ejemplo.com', 'Segura2026')
    }
    await expect(authenticateCustomer('bloqueo@ejemplo.com', 'Segura2026'))
      .resolves.toMatchObject({ account: null, retrySeconds: expect.any(Number) })
  })

  it('desactiva cuentas sin borrar sus datos', async () => {
    const account = await signUp()
    setCustomerActive(account.id, false)
    await expect(authenticateCustomer(account.email, 'Segura2026'))
      .resolves.toMatchObject({ account: null })
    expect(getCustomers()).toHaveLength(1)
    setCustomerActive(account.id, true)
    await expect(authenticateCustomer(account.email, 'Segura2026'))
      .resolves.toMatchObject({ account: { id: account.id } })
  })

  it('administra direcciones con una sola principal', async () => {
    const account = await signUp()
    const casa = addAddress(account.id, {
      alias: 'Casa', direccion: 'Calle 1', zona: 'Caracas', referencia: '', esPrincipal: false,
    })
    // La primera dirección siempre queda principal, aunque llegue sin la marca.
    expect(casa.esPrincipal).toBe(true)
    const oficina = addAddress(account.id, {
      alias: 'Oficina', direccion: 'Calle 2', zona: 'Miranda', referencia: '', esPrincipal: true,
    })
    expect(getCustomers()[0]!.direcciones.map((item) => [item.alias, item.esPrincipal]))
      .toEqual([['Casa', false], ['Oficina', true]])
    setDefaultAddress(account.id, casa.id)
    removeAddress(account.id, casa.id)
    expect(getCustomers()[0]!.direcciones[0]).toMatchObject({ id: oficina.id, esPrincipal: true })
  })

  it('asocia pedidos de invitado por correo o teléfono, sin pisar los ya vinculados', async () => {
    const account = await signUp()
    const linked = associateGuestOrders(account, [
      order('1', account.email, '0424-0000000'),
      order('2', undefined, '0414 1234567'),
      order('3', 'otro@ejemplo.com', '0424-1111111'),
      order('4', account.email, '0424-0000000', 'otra-cuenta'),
    ])
    expect(linked.map((item) => item.clienteId))
      .toEqual([account.id, account.id, undefined, 'otra-cuenta'])
    expect(getCustomers()).toHaveLength(1)
  })

  it('selecciona los pedidos de la cuenta sin mezclar los ajenos', async () => {
    const account = await signUp()
    const mine = [
      order('1', account.email, '0424-0000000', account.id),
      order('2', account.email, '0424-0000000'),
    ]
    const dates = ['2026-11-18T12:00:00Z', '2026-11-21T12:00:00Z']
    const sorted = ordersForAccount(account, [...mine, order('3', 'otro@ejemplo.com', '0424-1111111')]
      .map((item, index) => ({ ...item, fecha: dates[index] ?? item.fecha })))
    expect(sorted.map((item) => item.id)).toEqual(['2', '1'])
    expect(ordersForAccount(null, mine)).toEqual([])
  })

  it('siembra una única cuenta de demostración usable', async () => {
    await ensureDemoCustomer()
    await ensureDemoCustomer()
    expect(getCustomers().filter((item) => item.email === 'cliente@ejemplo.com')).toHaveLength(1)
    await expect(authenticateCustomer('cliente@ejemplo.com', 'cliente123'))
      .resolves.toMatchObject({ account: { id: 'c-demo-cliente' } })
  })
})
