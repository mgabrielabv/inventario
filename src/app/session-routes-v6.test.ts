import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it } from 'vitest'
import { BRAND } from '../config/brand'
import { KEYS, safeStorage } from '../logic/services/storage'
import { can } from '../logic/services/permissions'
import { useCustomerStore } from '../logic/store/customer'
import type { User } from '../logic/types'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

const admin: User = {
  id: 'u-admin', username: 'admin', name: 'Administrador', role: 'Administrador',
}
const operator: User = {
  id: 'u-op', username: 'operador', name: 'Operador', role: 'Operador',
}

describe('sesiones separadas', () => {
  beforeEach(() => {
    safeStorage.removeItem(KEYS.user)
    safeStorage.removeItem(KEYS.customerSession)
    useCustomerStore.getState().clear()
  })

  it('la sesión de cliente nunca usa la clave del personal', () => {
    expect(KEYS.user).not.toBe(KEYS.customerSession)
    expect(KEYS.customerSession).toContain(BRAND.slug)
    expect(KEYS.customerSession).not.toMatch(/inventario/i)

    useCustomerStore.getState().setSession('c-demo-cliente')
    expect(safeStorage.getItem(KEYS.customerSession)).toContain('c-demo-cliente')
    expect(safeStorage.getItem(KEYS.user)).toBeNull()
  })

  it('cerrar sesión de cliente no toca la sesión del personal', () => {
    safeStorage.setItem(KEYS.user, JSON.stringify(admin))
    useCustomerStore.getState().setSession('c-demo-cliente')
    useCustomerStore.getState().clear()
    expect(useCustomerStore.getState().accountId).toBeNull()
    expect(safeStorage.getItem(KEYS.user)).toContain('u-admin')
  })
})

describe('rutas y permisos', () => {
  it('protege el panel con la sesión del personal y la cuenta con la del cliente', () => {
    const guards = source('src/app/protected-route.tsx')
    const router = source('src/app/router.tsx')
    expect(guards).toMatch(/export const ProtectedRoute[\s\S]{0,240}useAuth\(\)/)
    expect(guards).toMatch(/export const CustomerRoute[\s\S]{0,240}useCustomer\(\)/)
    expect(guards).not.toMatch(/export const CustomerRoute[\s\S]{0,240}useAuth\(\)/)
    expect(router).toMatch(/path: 'admin',[\s\S]{0,120}<ProtectedRoute>/)
    expect(router).toMatch(/path: 'cuenta',[\s\S]{0,160}<CustomerRoute>/)
    expect(router).toMatch(/path: 'clientes'[\s\S]{0,160}ver:clientes/)
  })

  it('limita gestionar clientes al administrador', () => {
    expect(can(admin, 'ver:clientes')).toBe(true)
    expect(can(admin, 'gestionar:clientes')).toBe(true)
    expect(can(operator, 'ver:clientes')).toBe(true)
    expect(can(operator, 'gestionar:clientes')).toBe(false)
    expect(can(operator, 'configurar')).toBe(false)
    expect(can(null, 'ver:clientes')).toBe(false)
  })
})
