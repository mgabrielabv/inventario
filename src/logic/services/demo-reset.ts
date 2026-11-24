/* Restablece la demo completa sin tocar las cuentas del personal ni la auditoría.
   Los stores se importan de forma estática, pero se leen con getState() dentro
   de la función para no crear ciclos al inicializar los módulos. */

import { initialMovements, initialOrders, initialProducts } from '../../data/products'
import { useCartDraftStore } from '../store/cartDraft'
import { useCartStore } from '../store/cart'
import { useCheckoutDraftStore } from '../store/checkoutDraft'
import { useCustomerStore } from '../store/customer'
import { useFavoritesStore } from '../store/favorites'
import { useInventoryStore } from '../store/inventory'
import { useOrdersStore } from '../store/orders'
import { useRecentStore } from '../store/recent'
import { DEFAULT_SETTINGS, useSettingsStore } from '../store/settings'
import { logActivity } from './audit'
import { ensureDemoCustomer, saveCustomers } from './customer-auth'

export const resetDemoData = (): void => {
  useInventoryStore.getState().replaceAll(initialProducts, initialMovements)
  useOrdersStore.getState().replace(initialOrders)
  useSettingsStore.getState().replace(DEFAULT_SETTINGS)

  // Solo la cuenta de cliente de muestra; el personal se conserva.
  saveCustomers([])
  void ensureDemoCustomer()

  useCartStore.getState().clear()
  useFavoritesStore.getState().clear()
  useCartDraftStore.getState().reset()
  useCheckoutDraftStore.getState().reset()
  useRecentStore.getState().clear()
  useCustomerStore.getState().clear()

  logActivity('sistema', 'Datos de demostración restablecidos',
    'Productos, movimientos, pedidos, ajustes y cuentas de cliente')
}
