import type { User, UserRole } from '../types'

const USERS: Array<{ username: string; password: string; user: User }> = [
  {
    username: 'admin',
    password: 'admin123',
    user: { id: 1, username: 'admin', name: 'Administrador', role: 'Administrador' },
  },
  {
    username: 'operador',
    password: 'operador123',
    user: { id: 2, username: 'operador', name: 'Operador', role: 'Operador' },
  },
]

const ROLES: UserRole[] = ['Administrador', 'Operador']

export const authenticate = (username: string, password: string): User | null => {
  const match = USERS.find(
    (candidate) => candidate.username === username.trim() && candidate.password === password,
  )
  return match ? { ...match.user } : null
}

export const isUser = (value: unknown): value is User => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.username === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.role === 'string' &&
    ROLES.includes(candidate.role as UserRole)
  )
}
