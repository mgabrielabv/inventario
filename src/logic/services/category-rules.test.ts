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
    })).toMatchObject({ categoria: 'Mascotas', subcategoria: 'Alimentos' })
    expect(clasificarImportado({
      id: 'dj-apple', nombre: 'Apple MacBook', categoria: 'Tecnología',
      especificaciones: [{ clave: 'Marca', valor: 'Apple' }],
    })).toBeNull()
  })

  it('no reclasifica dos veces el catálogo ya sembrado', () => {
    expect(reclasificarImportados(realProducts)).toEqual(realProducts)
  })

  it('deja los nueve departamentos con al menos una ficha real', () => {
    const presentes = new Set(realProducts.map((product) => product.categoria))
    for (const categoria of DEFAULT_CATEGORIES) expect(presentes.has(categoria)).toBe(true)
  })

  it('respeta fichas creadas en el panel', () => {
    const propia: Product = {
      ...realProducts[0]!, id: 'prod-local', nombre: 'Cuaderno propio',
      categoria: 'Papelería y oficina', subcategoria: 'Papelería',
    }
    expect(reclasificarImportados([propia])[0]).toEqual(propia)
  })
})
