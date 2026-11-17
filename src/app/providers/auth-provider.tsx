import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '../../logic/types'
import { authenticate, isUser } from '../../logic/services/auth'
import { safeStorage, storageKey } from '../../logic/services/storage'

const STORAGE_KEY = storageKey('user')

interface LoginResult {
  success: boolean
  error?: string
}

interface AuthContextValue {
  user: User | null
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => void
  isAuthenticated: boolean
  canAccessReports: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const readStoredUser = (): User | null => {
  const raw = safeStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isUser(parsed) ? parsed : null
  } catch {
    return null
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(readStoredUser)

  useEffect(() => {
    if (user) safeStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else safeStorage.removeItem(STORAGE_KEY)
  }, [user])

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    await delay(450)
    const authenticated = authenticate(username, password)
    if (!authenticated) {
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    }
    setUser(authenticated)
    return { success: true }
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: user !== null,
      canAccessReports: user?.role === 'Administrador',
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
