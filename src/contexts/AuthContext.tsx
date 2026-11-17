import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  username: string
  name: string
  role: 'Administrador' | 'Operador'
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
  canAccessReports: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('atelier-user')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('atelier-user', JSON.stringify(user))
    } else {
      localStorage.removeItem('atelier-user')
    }
  }, [user])

  const login = async (username: string, password: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      setTimeout(() => {
        if (username === 'admin' && password === 'admin123') {
          setUser({
            id: 1,
            username: 'admin',
            name: 'Administrador',
            role: 'Administrador',
          })
          resolve({ success: true })
        } else if (username === 'operador' && password === 'operador123') {
          setUser({
            id: 2,
            username: 'operador',
            name: 'Operador',
            role: 'Operador',
          })
          resolve({ success: true })
        } else {
          resolve({ success: false, error: 'Credenciales incorrectas' })
        }
      }, 600)
    })
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        canAccessReports: user?.role === 'Administrador',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
