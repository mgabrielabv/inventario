import type { PermissionAction, User, UserRole } from '../types'

const MATRIX: Record<UserRole, PermissionAction[]> = {
  Administrador: [
    'ver:panel', 'ver:reportes', 'exportar:reportes', 'configurar',
    'ver:clientes', 'gestionar:clientes',
    'crear:producto', 'editar:producto', 'editar:precio', 'archivar:producto',
    'eliminar:producto', 'registrar:movimiento', 'anular:movimiento',
    'avanzar:pedido', 'cancelar:pedido', 'verificar:pago', 'gestionar:usuarios',
  ],
  Operador: [
    'ver:panel', 'ver:reportes', 'ver:clientes', 'crear:producto', 'editar:producto',
    'registrar:movimiento', 'avanzar:pedido', 'verificar:pago',
  ],
}

/** La capa de lógica valida; la UI solo oculta lo que no aplica. */
export const can = (user: User | null, action: PermissionAction): boolean =>
  user !== null && MATRIX[user.role].includes(action)

export const denyReason = (action: PermissionAction): string => {
  const reasons: Partial<Record<PermissionAction, string>> = {
    'anular:movimiento': 'Solo el administrador puede anular',
    'cancelar:pedido': 'Solo el administrador puede cancelar pedidos',
    'editar:precio': 'Solo el administrador puede editar precios',
    'archivar:producto': 'Solo el administrador puede archivar productos',
    'eliminar:producto': 'Solo el administrador puede eliminar productos',
    'exportar:reportes': 'El operador solo puede ver reportes',
    configurar: 'Solo el administrador puede acceder a Configuración',
    'gestionar:usuarios': 'Solo el administrador puede gestionar usuarios',
  }
  return reasons[action] ?? 'No tienes permiso para esta acción'
}
