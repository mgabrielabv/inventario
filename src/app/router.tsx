import { createHashRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '../pages/auth/login-page'
import { AppLayout } from '../components/layout/app-layout'
import { DashboardPage } from '../pages/dashboard/dashboard-page'
import { InventarioPage } from '../pages/inventario/inventario-page'
import { MovimientosPage } from '../pages/movimientos/movimientos-page'
import { AlertasPage } from '../pages/alertas/alertas-page'
import { ReportesPage } from '../pages/reportes/reportes-page'
import { ProtectedRoute } from './protected-route'

export const router = createHashRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'inventario', element: <InventarioPage /> },
      { path: 'movimientos', element: <MovimientosPage /> },
      { path: 'alertas', element: <AlertasPage /> },
      { path: 'reportes', element: <ReportesPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
