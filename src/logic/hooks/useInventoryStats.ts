import { useMemo } from 'react'
import { useInventoryStore } from '../store/inventory'
import { getAlerts, getCategoryStock, getInventoryStats } from '../store/selectors'

export const useInventoryStats = () => {
  const products = useInventoryStore((state) => state.products)
  const movements = useInventoryStore((state) => state.movements)

  return useMemo(() => getInventoryStats(products, movements), [products, movements])
}

export const useAlerts = () => {
  const products = useInventoryStore((state) => state.products)
  return useMemo(() => getAlerts(products), [products])
}

export const useCategoryStock = () => {
  const products = useInventoryStore((state) => state.products)
  return useMemo(() => getCategoryStock(products), [products])
}
