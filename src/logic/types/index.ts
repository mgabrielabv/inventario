export const CATEGORIES = [
  'Electrónica',
  'Accesorios',
  'Papelería',
  'Hogar',
  'Otras',
] as const

export type Category = (typeof CATEGORIES)[number]

export const ALL_CATEGORIES = 'Todas' as const
export type CategoryFilter = typeof ALL_CATEGORIES | Category

export type ProductStatus = 'normal' | 'low' | 'critical'

export interface StatusInfo {
  status: ProductStatus
  label: string
}

export interface Product {
  id: number
  codigo: string
  producto: string
  categoria: Category
  cantidad: number
}

export interface ProductDraft {
  codigo: string
  producto: string
  categoria: Category
  cantidad: number
}

export type MovementType = 'Entrada' | 'Salida'

export interface Movement {
  id: number
  fecha: string
  productoId: number
  producto: string
  tipo: MovementType
  cantidad: number
  usuario: string
}

export type UserRole = 'Administrador' | 'Operador'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
}

export interface InventoryStats {
  totalProducts: number
  totalUnits: number
  alertsCount: number
  criticalCount: number
  warningCount: number
  movementsLast7Days: number
}

export interface CategoryStock {
  category: Category
  units: number
  percentage: number
}

export interface MovementGroup {
  date: string
  movements: Movement[]
}

export interface AlertSummary {
  alerts: Product[]
  critical: Product[]
  warning: Product[]
}

export type SlideId = 'boxes' | 'shelf' | 'scanner' | 'pallet'

export interface Slide {
  id: SlideId
  label: string
  kicker: string
  title: string
  support: string
}

export interface ReportDefinition {
  id: 'stock' | 'movimientos' | 'fecha' | 'top'
  label: string
}
