/* NOMBRES ANTIGUOS — solo para migración, nunca se muestran al usuario.
   Esta lista está en la lista blanca de la prueba de lint de marca. */
export const LEGACY_PREFIX = 'inventario-'
/** Nombre histórico de la marca, reemplazado al migrar ajustes guardados. */
export const LEGACY_BRAND_NAME = 'Inventario'

/** Departamentos anteriores, migrados a los seis actuales. */
export const LEGACY_CATEGORIES: Record<string, string> = {
  Electrónica: 'Tecnología',
  Hogar: 'Hogar y cocina',
  Otras: 'Hogar y cocina',
  Papelería: 'Accesorios',
  'Papelería y oficina': 'Accesorios',
  'Juguetes y juegos': 'Accesorios',
  Mascotas: 'Alimentos y bebidas',
  'Ferretería básica': 'Tecnología',
}
export const LEGACY_IMAGE_DB = `${LEGACY_PREFIX}imagenes`
/** Prefijos históricos de pedidos: se conservan y cuentan en la secuencia. */
export const LEGACY_ORDER_PREFIX = 'INV'
export const LEGACY_ORDER_PREFIXES = ['PED', LEGACY_ORDER_PREFIX]
/** Slugs usados antes de cambiar BRAND.slug; se migran sin pérdida. */
export const LEGACY_SLUGS: string[] = ['tienda']

/** Sufijo de la clave actual -> claves históricas en orden de preferencia. */
export const LEGACY_KEYS: Record<string, string[]> = {
  inventory: ['atelier-inventory-storage', 'inventario-inventory-storage', 'inventario-storage'],
  theme: ['atelier-theme', 'inventario-theme'],
  user: ['atelier-user', 'inventario-user'],
  users: ['atelier-users', 'inventario-users'],
  orders: ['atelier-orders', 'inventario-orders'],
  cart: ['atelier-cart-v2', 'inventario-cart-v2'],
  favorites: ['atelier-favorites-v2', 'inventario-favorites-v2'],
  settings: ['atelier-settings-v2', 'inventario-settings-v2'],
  customer: ['atelier-customer-v2', 'inventario-customer-v2'],
  recent: ['atelier-recent-v2', 'inventario-recent-v2'],
  cartDraft: ['atelier-cart-draft-v1', 'inventario-cart-draft-v1'],
  checkoutDraft: ['atelier-checkout-draft-v1', 'inventario-checkout-draft-v1'],
  activity: ['atelier-activity', 'inventario-activity'],
  customers: [],
  customerSession: [],
}
