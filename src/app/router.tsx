import { createHashRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from './layouts/admin-layout'
import { StoreLayout } from './layouts/store-layout'
import { CustomerRoute, PermissionRoute, ProtectedRoute } from './protected-route'
import { LoginPage } from '../pages/auth/login-page'
import { LandingPage } from '../pages/landing/landing-page'
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
import { AdminCustomersPage } from '../pages/admin/customers-page'
import { AdminReplenishmentPage } from '../pages/admin/replenishment-page'
import { AdminReportsPage } from '../pages/admin/reports-page'
import { AdminSettingsPage } from '../pages/admin/settings-page'
import { ArtSheetPage } from '../pages/store/art-sheet-page'
import { CustomerSignInPage } from '../pages/customer/sign-in-page'
import { CustomerSignUpPage } from '../pages/customer/sign-up-page'
import { CustomerRecoverPage } from '../pages/customer/recover-page'
import { AccountPage } from '../pages/customer/account-page'
import { AccountOrdersPage } from '../pages/customer/account-orders-page'
import { AddressesPage } from '../pages/customer/addresses-page'
import { ProfilePage } from '../pages/customer/profile-page'

export const router = createHashRouter([
  { path: '/bienvenida', element: <LandingPage /> },
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
      { path: 'arte', element: <ArtSheetPage /> },
      { path: 'cuenta/ingresar', element: <CustomerSignInPage /> },
      { path: 'cuenta/registro', element: <CustomerSignUpPage /> },
      { path: 'cuenta/registrar', element: <CustomerSignUpPage /> },
      { path: 'cuenta/recuperar', element: <CustomerRecoverPage /> },
      {
        path: 'cuenta',
        element: <CustomerRoute><AccountPage /></CustomerRoute>,
      },
      {
        path: 'cuenta/pedidos',
        element: <CustomerRoute><AccountOrdersPage /></CustomerRoute>,
      },
      {
        path: 'cuenta/pedidos/:codigo',
        element: <CustomerRoute><OrderPage /></CustomerRoute>,
      },
      {
        path: 'cuenta/direcciones',
        element: <CustomerRoute><AddressesPage /></CustomerRoute>,
      },
      {
        path: 'cuenta/perfil',
        element: <CustomerRoute><ProfilePage /></CustomerRoute>,
      },
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
      {
        path: 'clientes',
        element: <PermissionRoute permission="ver:clientes"><AdminCustomersPage /></PermissionRoute>,
      },
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
