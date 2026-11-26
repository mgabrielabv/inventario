/* Cuentas de cliente. Mismo esquema SHA-256 + sal que el personal, pero en un
   almacén y una sesión totalmente separados.
   TODO backend: sustituir el cuerpo de estas funciones por llamadas a API
   manteniendo las firmas asíncronas. */

import { KEYS, readJson, writeJson } from './storage'
import { hashPassword, makeSalt } from './auth'
import type { Address, CustomerAccount, Order } from '../types'

export interface RegisterCustomerInput {
  nombre: string
  apellido: string
  email: string
  telefono: string
  password: string
  documento?: string
  aceptaOfertas?: boolean
}

export interface CustomerAuthResult {
  account: CustomerAccount | null
  error?: string
  retrySeconds?: number
}

const MAX_ATTEMPTS = 5
const BLOCK_MS = 30_000
const attempts = new Map<string, { count: number; until: number }>()

export const getCustomers = (): CustomerAccount[] => {
  const value = readJson<unknown>(KEYS.customers, [])
  return Array.isArray(value) ? value as CustomerAccount[] : []
}

export const saveCustomers = (customers: CustomerAccount[]): void =>
  writeJson(KEYS.customers, customers)

export const normalizeEmail = (email: string): string => email.trim().toLowerCase()

/** Acepta 04xx-xxxxxxx, 0424xxxxxxx, +58 424… y 58424… */
export const normalizePhoneVE = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('58')) return `0${digits.slice(2)}`
  if (digits.length === 11 && digits.startsWith('0') && /^04\d{2}/.test(digits)) return digits
  return null
}

export const passwordStrength = (password: string): number => {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-ZÁÉÍÓÚÑ]/.test(password) && /[a-záéíóúñ]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^\w\s]/.test(password)) score += 1
  return Math.min(4, score)
}

export const findByEmail = (email: string): CustomerAccount | null => {
  const needle = normalizeEmail(email)
  return getCustomers().find((item) => normalizeEmail(item.email) === needle) ?? null
}

export const findByPhone = (phone: string): CustomerAccount | null => {
  const needle = normalizePhoneVE(phone)
  if (!needle) return null
  return getCustomers().find((item) => normalizePhoneVE(item.telefono) === needle) ?? null
}

export const findByEmailOrPhone = (value: string): CustomerAccount | null =>
  value.includes('@') ? findByEmail(value) : findByPhone(value)

export const registerCustomer = async (input: RegisterCustomerInput): Promise<CustomerAccount> => {
  const email = normalizeEmail(input.email)
  const telefono = normalizePhoneVE(input.telefono)
  if (!email || !email.includes('@')) throw new Error('Escribe un correo válido.')
  if (!telefono) throw new Error('Escribe un teléfono venezolano válido (04xx-xxxxxxx).')
  if (input.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
  if (!input.nombre.trim() || !input.apellido.trim()) throw new Error('Escribe tu nombre y apellido.')
  if (findByEmail(email)) throw new Error('Ya existe una cuenta con ese correo.')
  const salt = makeSalt()
  const account: CustomerAccount = {
    id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    nombre: input.nombre.trim(), apellido: input.apellido.trim(),
    email, telefono, documento: input.documento?.trim() || undefined,
    salt, passwordHash: await hashPassword(input.password, salt),
    direcciones: [], creadoEn: new Date().toISOString(), ultimoIngreso: new Date().toISOString(),
    aceptaOfertas: Boolean(input.aceptaOfertas), activo: true,
  }
  saveCustomers([...getCustomers(), account])
  return account
}

export const authenticateCustomer = async (
  identifier: string, password: string,
): Promise<CustomerAuthResult> => {
  const key = normalizeEmail(identifier.includes('@') ? identifier : normalizePhoneVE(identifier) ?? identifier)
  const now = Date.now()
  const record = attempts.get(key)
  if (record && record.until > now) {
    return { account: null, retrySeconds: Math.ceil((record.until - now) / 1000), error: 'Demasiados intentos. Intenta de nuevo en unos segundos.' }
  }
  const account = findByEmailOrPhone(identifier)
  const valid = account !== null && account.activo && await hashPassword(password, account.salt) === account.passwordHash
  if (!valid) {
    const count = record && record.until <= now ? record.count + 1 : 1
    const until = count >= MAX_ATTEMPTS ? now + BLOCK_MS : 0
    attempts.set(key, { count: until ? 0 : count, until })
    return {
      account: null,
      retrySeconds: until ? BLOCK_MS / 1000 : undefined,
      error: until ? 'Demasiados intentos. Intenta de nuevo en 30 segundos.' : 'Correo, teléfono o contraseña incorrectos.',
    }
  }
  attempts.delete(key)
  const updated: CustomerAccount = { ...account!, ultimoIngreso: new Date().toISOString() }
  saveCustomers(getCustomers().map((item) => item.id === updated.id ? updated : item))
  return { account: updated }
}

export const updateProfile = (
  id: string, patch: Partial<Pick<CustomerAccount,
    'nombre' | 'apellido' | 'email' | 'telefono' | 'documento' | 'aceptaOfertas'>>,
): CustomerAccount => {
  const current = getCustomers().find((item) => item.id === id)
  if (!current) throw new Error('No encontramos tu cuenta.')
  if (patch.email && findByEmail(patch.email)?.id !== id) throw new Error('Ese correo ya está en uso.')
  if (patch.telefono && !normalizePhoneVE(patch.telefono)) throw new Error('Teléfono no válido.')
  const updated: CustomerAccount = {
    ...current,
    ...patch,
    email: patch.email ? normalizeEmail(patch.email) : current.email,
    telefono: patch.telefono ? normalizePhoneVE(patch.telefono)! : current.telefono,
  }
  saveCustomers(getCustomers().map((item) => item.id === id ? updated : item))
  return updated
}

export const changePassword = async (
  id: string, currentPassword: string, newPassword: string,
): Promise<void> => {
  const account = getCustomers().find((item) => item.id === id)
  if (!account) throw new Error('No encontramos tu cuenta.')
  if (await hashPassword(currentPassword, account.salt) !== account.passwordHash) {
    throw new Error('Tu contraseña actual no es correcta.')
  }
  if (newPassword.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.')
  const salt = makeSalt()
  const passwordHash = await hashPassword(newPassword, salt)
  saveCustomers(getCustomers().map((item) => item.id === id
    ? { ...item, salt, passwordHash }
    : item))
}

export const addAddress = (id: string, address: Omit<Address, 'id'>): Address => {
  const account = getCustomers().find((item) => item.id === id)
  if (!account) throw new Error('No encontramos tu cuenta.')
  const created: Address = {
    ...address,
    id: `dir-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    esPrincipal: address.esPrincipal || account.direcciones.length === 0,
  }
  const direcciones = created.esPrincipal
    ? [...account.direcciones.map((item) => ({ ...item, esPrincipal: false })), created]
    : [...account.direcciones, created]
  saveCustomers(getCustomers().map((item) => item.id === id ? { ...item, direcciones } : item))
  return created
}

export const removeAddress = (id: string, addressId: string): void => {
  const account = getCustomers().find((item) => item.id === id)
  if (!account) throw new Error('No encontramos tu cuenta.')
  const direcciones = account.direcciones.filter((item) => item.id !== addressId)
  if (direcciones.length > 0 && !direcciones.some((item) => item.esPrincipal)) {
    direcciones[0] = { ...direcciones[0]!, esPrincipal: true }
  }
  saveCustomers(getCustomers().map((item) => item.id === id ? { ...item, direcciones } : item))
}

export const setDefaultAddress = (id: string, addressId: string): void => {
  const account = getCustomers().find((item) => item.id === id)
  if (!account) throw new Error('No encontramos tu cuenta.')
  const direcciones = account.direcciones.map((item) => ({ ...item, esPrincipal: item.id === addressId }))
  saveCustomers(getCustomers().map((item) => item.id === id ? { ...item, direcciones } : item))
}

export const deleteCustomer = (id: string): void =>
  saveCustomers(getCustomers().filter((item) => item.id !== id))

export const setCustomerActive = (id: string, activo: boolean): void => {
  saveCustomers(getCustomers().map((item) => item.id === id ? { ...item, activo } : item))
}

/** Pedidos de invitado con el mismo correo/teléfono pasan a la cuenta. */
export const associateGuestOrders = (account: CustomerAccount, orders: Order[]): Order[] =>
  orders.map((order) => {
    if (order.clienteId) return order
    const email = order.cliente.email ? normalizeEmail(order.cliente.email) : ''
    const phone = normalizePhoneVE(order.cliente.telefono) ?? ''
    const matches = email === account.email || (phone !== '' && phone === account.telefono)
    return matches ? { ...order, clienteId: account.id } : order
  })

/** Pedidos de la cuenta, incluidos los históricos ya vinculados por datos. */
export const ordersForAccount = (
  account: CustomerAccount | null, orders: Order[],
): Order[] => {
  if (!account) return []
  const email = normalizeEmail(account.email)
  const phone = normalizePhoneVE(account.telefono) ?? ''
  return orders
    .filter((order) => order.clienteId === account.id || (
      !order.clienteId && (
        (order.cliente.email ? normalizeEmail(order.cliente.email) === email : false)
        || (phone !== '' && normalizePhoneVE(order.cliente.telefono) === phone)
      )
    ))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

/** Cuenta de demostración sembrada solo si no hay datos previos. */
export const ensureDemoCustomer = async (): Promise<void> => {
  if (findByEmail('cliente@ejemplo.com')) return
  const demo: CustomerAccount = {
    id: 'c-demo-cliente', nombre: 'Cliente', apellido: 'Demostración',
    email: 'cliente@ejemplo.com', telefono: '04241234567',
    salt: 'demo-cliente-2026',
    passwordHash: 'b3df5e0060102059a560ba711b728c5f60e1e426e05b6fab916115c5c596e8b7',
    direcciones: [{
      id: 'dir-demo', alias: 'Casa', direccion: 'Av. Principal 12,Caracas',
      zona: 'Caracas', referencia: 'Portón azul', esPrincipal: true,
    }],
    creadoEn: new Date().toISOString(), ultimoIngreso: new Date().toISOString(),
    aceptaOfertas: true, activo: true,
  }
  saveCustomers([...getCustomers(), demo])
}
