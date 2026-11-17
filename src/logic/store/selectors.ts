import { CATEGORIES } from '../types'
import type {
  AlertSummary,
  Category,
  CategoryFilter,
  CategoryStock,
  InventoryStats,
  Movement,
  MovementGroup,
  Product,
  StatusInfo,
} from '../types'
import { formatGroupDate, normalizeText } from '../services/formatters'

const ALERT_THRESHOLD = 10
const CRITICAL_THRESHOLD = 5

export const getProductStatus = (cantidad: number): StatusInfo => {
  if (cantidad < CRITICAL_THRESHOLD) return { status: 'critical', label: 'Crítico' }
  if (cantidad < ALERT_THRESHOLD) return { status: 'low', label: 'Bajo' }
  return { status: 'normal', label: 'Normal' }
}

export const getAlerts = (products: Product[]): AlertSummary => {
  const alerts = products
    .filter((product) => product.cantidad < ALERT_THRESHOLD)
    .sort((a, b) => a.cantidad - b.cantidad)

  return {
    alerts,
    critical: alerts.filter((product) => product.cantidad < CRITICAL_THRESHOLD),
    warning: alerts.filter(
      (product) => product.cantidad >= CRITICAL_THRESHOLD && product.cantidad < ALERT_THRESHOLD,
    ),
  }
}

export const getInventoryStats = (
  products: Product[],
  movements: Movement[],
): InventoryStats => {
  const totalUnits = products.reduce((sum, product) => sum + product.cantidad, 0)
  const { alerts, critical, warning } = getAlerts(products)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  return {
    totalProducts: products.length,
    totalUnits,
    alertsCount: alerts.length,
    criticalCount: critical.length,
    warningCount: warning.length,
    movementsLast7Days: movements.filter(
      (movement) => new Date(movement.fecha).getTime() >= sevenDaysAgo,
    ).length,
  }
}

export const getCategoryStock = (products: Product[]): CategoryStock[] => {
  const totalUnits = products.reduce((sum, product) => sum + product.cantidad, 0)
  const totals = new Map<Category, number>(CATEGORIES.map((category) => [category, 0]))

  for (const product of products) {
    totals.set(product.categoria, (totals.get(product.categoria) ?? 0) + product.cantidad)
  }

  return CATEGORIES.map((category) => {
    const units = totals.get(category) ?? 0
    return {
      category,
      units,
      percentage: totalUnits > 0 ? Math.round((units / totalUnits) * 100) : 0,
    }
  }).sort((a, b) => b.units - a.units)
}

export const filterProducts = (
  products: Product[],
  search: string,
  category: CategoryFilter,
): Product[] => {
  const query = normalizeText(search.trim())

  return products.filter((product) => {
    const matchesCategory = category === 'Todas' || product.categoria === category
    if (!matchesCategory) return false
    if (!query) return true

    return (
      normalizeText(product.producto).includes(query) ||
      normalizeText(product.codigo).includes(query) ||
      normalizeText(product.categoria).includes(query)
    )
  })
}

export const groupMovementsByDate = (movements: Movement[]): MovementGroup[] => {
  const groups = new Map<string, Movement[]>()

  for (const movement of movements) {
    const date = formatGroupDate(movement.fecha)
    const bucket = groups.get(date)
    if (bucket) bucket.push(movement)
    else groups.set(date, [movement])
  }

  return Array.from(groups, ([date, items]) => ({ date, movements: items }))
}

export const getRecentMovements = (movements: Movement[], limit = 5): Movement[] =>
  movements.slice(0, limit)

export const getMostMovedProduct = (
  movements: Movement[],
): { producto: string; units: number } | null => {
  if (movements.length === 0) return null

  const totals = new Map<string, number>()
  for (const movement of movements) {
    totals.set(movement.producto, (totals.get(movement.producto) ?? 0) + movement.cantidad)
  }

  const [producto, units] = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0] ?? []
  return producto ? { producto, units } : null
}

export const filterReportProducts = (
  products: Product[],
  category: CategoryFilter,
  statusLabel: string,
): Product[] =>
  products.filter((product) => {
    const matchesCategory = category === 'Todas' || product.categoria === category
    const matchesStatus =
      statusLabel === 'Todos' || getProductStatus(product.cantidad).label === statusLabel
    return matchesCategory && matchesStatus
  })
