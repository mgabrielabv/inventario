import { createHashRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from './layouts/admin-layout'
import { StoreLayout } from './layouts/store-layout'
import { PermissionRoute, ProtectedRoute } from './protected-route'
import { LoginPage } from '../pages/auth/login-page'
import { CartPage } from '../pages/store/cart-page'
import { CatalogPage } from '../pages/store/catalog-page'
import { CheckoutPage } from '../pages/store/checkout-page'
import { FavoritesPage } from '../pages/store/favorites-page'
import { HomePage } from '../pages/store/home-page'
import { OrderPage } from '../pages/store/order-page'
import { ProductPage } from '../pages/store/product-page'
import { TrackingPage } from '../pages/store/tracking-page'
import { AdminDashboardPage } from '../pages/admin/dashboard-page'
import { AdminInventoryPage } from '../pages/admin/inventory-page'
import { AdminMovementsPage } from '../pages/admin/movements-page'
import { AdminOrdersPage } from '../pages/admin/orders-page'
import { AdminReplenishmentPage } from '../pages/admin/replenishment-page'
import { AdminReportsPage } from '../pages/admin/reports-page'
import { AdminSettingsPage } from '../pages/admin/settings-page'

export const router = createHashRouter([
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tienda', element: <CatalogPage /> },
      { path: 'tienda/:slug', element: <ProductPage /> },
      { path: 'carrito', element: <CartPage /> },
      { path: 'pagar', element: <CheckoutPage /> },
      { path: 'pedido/:codigo', element: <OrderPage /> },
      { path: 'seguimiento', element: <TrackingPage /> },
      { path: 'favoritos', element: <FavoritesPage /> },
    ],
  },
  { path: 'ingresar', element: <LoginPage /> },
  {
    path: 'admin',
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'inventario', element: <AdminInventoryPage /> },
      { path: 'movimientos', element: <AdminMovementsPage /> },
      { path: 'pedidos', element: <AdminOrdersPage /> },
      { path: 'reposicion', element: <AdminReplenishmentPage /> },
      { path: 'reportes', element: <AdminReportsPage /> },
      {
        path: 'configuracion',
        element: <PermissionRoute permission="configurar"><AdminSettingsPage /></PermissionRoute>,
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
