import { useMemo } from 'react'
import type { CategoryFilter } from '../types'
import { useInventoryStore } from '../store/inventory'
import { filterProducts } from '../store/selectors'

export const useProducts = (search: string, category: CategoryFilter) => {
  const products = useInventoryStore((state) => state.products)
  return useMemo(() => filterProducts(products, search, category), [products, search, category])
}
