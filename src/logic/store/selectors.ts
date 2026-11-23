import {
  compareUrgency,
  getCategoryStock as getStockByCategory,
  getInventorySummary,
  getProductStatus,
  needsReplenishment,
} from '../services/stock'
import { formatGroupDate, normalizeText } from '../services/formatters'
import type {
  AlertSummary,
  CategoryFilter,
  CategoryShare,
  InventoryStats,
  Movement,
  MovementGroup,
  Product,
} from '../types'

export { getProductStatus, getStockStatus } from '../services/stock'

export const getAlerts = (products: Product[]): AlertSummary => {
  const alerts = products
    .filter((product) => !product.archivado && needsReplenishment(product))
    .sort(compareUrgency)

  return {
    alerts,
    critical: alerts.filter((product) =>
      ['agotado', 'critico'].includes(getProductStatus(product).status),
    ),
    warning: alerts.filter((product) => getProductStatus(product).status === 'bajo'),
  }
}

export const getInventoryStats = (
  products: Product[],
  movements: Movement[],
): InventoryStats => {
  const summary = getInventorySummary(products, movements)
  const { alerts, critical, warning } = getAlerts(products)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  return {
    totalProducts: summary.activeProducts,
    totalUnits: summary.units,
    alertsCount: alerts.length,
    criticalCount: critical.length,
    warningCount: warning.length,
    movementsLast7Days: movements.filter(
      (movement) => new Date(movement.fecha).getTime() >= sevenDaysAgo,
    ).length,
  }
}

export const getCategoryStock = (products: Product[]): CategoryShare[] => {
  const byCategory = getStockByCategory(products)
  const totalUnits = byCategory.reduce((sum, entry) => sum + entry.units, 0)

  return byCategory.map((entry) => ({
    category: entry.categoria,
    units: entry.units,
    percentage: totalUnits > 0 ? Math.round((entry.units / totalUnits) * 100) : 0,
  }))
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
      normalizeText(product.nombre).includes(query) ||
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
    totals.set(
      movement.productoNombre,
      (totals.get(movement.productoNombre) ?? 0) + movement.cantidad,
    )
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
      statusLabel === 'Todos' || getProductStatus(product).label === statusLabel
    return matchesCategory && matchesStatus
  })
