import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react'
import type { User } from '../../logic/types'
import { authenticate, isUser } from '../../logic/services/auth'
import { KEYS, readJson, safeStorage, writeJson } from '../../logic/services/storage'
import { can } from '../../logic/services/permissions'

interface LoginResult { success: boolean; error?: string }
interface AuthContextValue {
  user: User | null
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => void
  isAuthenticated: boolean
  can: (action: Parameters<typeof can>[1]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)
const readStoredUser = (): User | null => {
  const stored = readJson<unknown>(KEYS.user, null)
  return isUser(stored) ? stored : null
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(readStoredUser)

  useEffect(() => {
    if (user) writeJson(KEYS.user, user)
    else safeStorage.removeItem(KEYS.user)
  }, [user])

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    const authenticated = await authenticate(username, password)
    if (!authenticated) return { success: false, error: 'Usuario o contraseña incorrectos' }
    setUser(authenticated)
    return { success: true }
  }, [])

  const logout = useCallback(() => setUser(null), [])
  const value = useMemo<AuthContextValue>(() => ({
    user, login, logout, isAuthenticated: user !== null, can: (action) => can(user, action),
  }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
