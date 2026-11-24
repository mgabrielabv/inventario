import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { PermissionAction } from '../logic/types'
import { useAuth } from './providers/auth-provider'
import { useCustomer } from './providers/customer-provider'

const AccessDenied = () => (
  <main className="admin-access-denied container-admin">
    <div className="card admin-access-denied__card">
      <h1 className="t-section t-strong">Acceso restringido</h1>
      <p className="t-caption">Tu perfil no tiene permiso para abrir esta sección.</p>
      <a className="btn btn--secondary" href="#/admin">Volver al panel</a>
    </div>
  </main>
)

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

/** Rutas privadas de cliente: nunca dependen de la sesión del personal. */
export const CustomerRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useCustomer()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/cuenta/ingresar" replace state={{ from: location.pathname + location.search }} />
  }
  return <>{children}</>
}

export const PermissionRoute = ({
  permission, children,
}: { permission: PermissionAction; children: ReactNode }) => {
  const { can } = useAuth()
  return can(permission) ? <>{children}</> : <AccessDenied />
}
