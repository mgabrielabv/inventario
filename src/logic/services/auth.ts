import { KEYS, readJson, writeJson } from './storage'
import type { StoredUser, User, UserRole } from '../types'

/** Contraseñas con SHA-256 + sal vía Web Crypto. App local: no hay servidor. */
const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const bytes = new TextEncoder().encode(`${salt}${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return toHex(new Uint8Array(digest))
}

export const makeSalt = (): string => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

const demoUsers: StoredUser[] = [
  {
    id: 'u-admin', username: 'admin', name: 'Administrador', role: 'Administrador',
    salt: 'inv-admin-2026',
    passwordHash: '55a6c758f93e02d2d236a1252c0b41819e7a65f9e57863e4a79b1a0b827b7c3e',
    active: true, creadoEn: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u-operador', username: 'operador', name: 'Operador', role: 'Operador',
    salt: 'inv-operador-2026',
    passwordHash: '04f102745831d6142633e63d90c704f5825b6102af8fb44b37d9383febb0cf3d',
    active: true, creadoEn: '2026-01-01T00:00:00.000Z',
  },
]

export const getUsers = (): StoredUser[] => {
  const stored = readJson<StoredUser[] | null>(KEYS.users, null)
  if (Array.isArray(stored) && stored.length > 0) return stored
  writeJson(KEYS.users, demoUsers)
  return demoUsers
}

export const saveUsers = (users: StoredUser[]): void => writeJson(KEYS.users, users)

export const createUser = async (
  username: string, name: string, role: UserRole, password: string,
): Promise<StoredUser> => {
  const salt = makeSalt()
  return {
    id: `u-${Date.now().toString(36)}`,
    username: username.trim().toLowerCase(),
    name: name.trim(), role, salt,
    passwordHash: await hashPassword(password, salt),
    active: true, creadoEn: new Date().toISOString(),
  }
}

export const resetPassword = async (userId: string, password: string): Promise<void> => {
  const users = await Promise.all(getUsers().map(async (user) => {
    if (user.id !== userId) return user
    const salt = makeSalt()
    return { ...user, salt, passwordHash: await hashPassword(password, salt) }
  }))
  saveUsers(users)
}

export const authenticate = async (username: string, password: string): Promise<User | null> => {
  const user = getUsers().find(
    (candidate) => candidate.username === username.trim().toLowerCase() && candidate.active,
  )
  if (!user) return null
  const hash = await hashPassword(password, user.salt)
  if (hash !== user.passwordHash) return null
  return { id: user.id, username: user.username, name: user.name, role: user.role }
}

const ROLES: UserRole[] = ['Administrador', 'Operador']

export const isUser = (value: unknown): value is User => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.role === 'string' &&
    ROLES.includes(candidate.role as UserRole)
  )
}
