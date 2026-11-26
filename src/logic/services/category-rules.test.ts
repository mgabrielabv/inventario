import { describe, expect, it } from 'vitest'
import { clasificarImportado } from './category-rules'
import { reclasificarImportados } from './product-migrate'
import { realProducts } from './real-products'
import { DEFAULT_CATEGORIES, type Product } from '../types'

describe('reglas de departamento para productos importados', () => {
  it('reconoce alimentos de mascotas sin tocar otras fichas', () => {
    expect(clasificarImportado({
      id: 'dj-gato', nombre: 'Cat Food', categoria: 'Hogar y cocina',
      subcategoria: 'Despensa',
    })).toMatchObject({ categoria: 'Alimentos y bebidas', subcategoria: 'Alimentos para mascotas' })
    expect(clasificarImportado({
      id: 'dj-apple', nombre: 'Apple MacBook', categoria: 'Tecnología',
      especificaciones: [{ clave: 'Marca', valor: 'Apple' }],
    })).toBeNull()
  })

  it('no reclasifica dos veces el catálogo ya sembrado', () => {
    expect(reclasificarImportados(realProducts)).toEqual(realProducts)
  })

  it('deja los seis departamentos con al menos cuatro fichas reales', () => {
    const conteo = new Map<string, number>()
    for (const product of realProducts) {
      conteo.set(product.categoria, (conteo.get(product.categoria) ?? 0) + 1)
    }
    for (const categoria of DEFAULT_CATEGORIES) {
      expect(conteo.get(categoria) ?? 0).toBeGreaterThanOrEqual(4)
    }
  })

  it('respeta fichas creadas en el panel', () => {
    const propia: Product = {
      ...realProducts[0]!, id: 'prod-local', nombre: 'Cuaderno propio',
      categoria: 'Papelería y oficina', subcategoria: 'Papelería',
    }
    expect(reclasificarImportados([propia])[0]).toEqual(propia)
  })
})
