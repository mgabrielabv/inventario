/**
 * Aplica las reglas de departamento al catálogo sembrado ya descargado.
 * No vuelve a llamar a las APIs: solo reubica fichas reales y es idempotente.
 *
 * Uso: npm run reclasificar:catalogo
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { clasificarImportado } from './lib/category-rules.mjs'

const OUTPUT = new URL('../src/data/productos-reales.json', import.meta.url)
const products = JSON.parse(readFileSync(OUTPUT, 'utf8'))
if (!Array.isArray(products)) throw new Error('El catálogo sembrado debe ser un array.')

let cambiados = 0
const resultado = products.map((product) => {
  const clase = clasificarImportado(product)
  if (!clase || (product.categoria === clase.categoria
    && product.subcategoria === clase.subcategoria)) return product
  cambiados += 1
  return {
    ...product,
    categoria: clase.categoria,
    subcategoria: clase.subcategoria,
    arquetipo: clase.arquetipo,
  }
})

writeFileSync(OUTPUT, `${JSON.stringify(resultado, null, 2)}\n`, 'utf8')
const departamentos = Object.entries(resultado.reduce((acc, product) => {
  acc[product.categoria] = (acc[product.categoria] ?? 0) + 1
  return acc
}, {})).sort((a, b) => b[1] - a[1])
console.log(`Reclasificadas ${cambiados} de ${resultado.length} fichas.`)
for (const [categoria, total] of departamentos) console.log(`  ${categoria}: ${total}`)
