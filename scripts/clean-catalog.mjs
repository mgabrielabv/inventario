/**
 * Limpia src/data/productos-reales.json: elimina fichas que no vengan de
 * DummyJSON/Open Food Facts y aquellas sin ninguna foto verificada (404,
 * timeout, HTML o tipo MIME no imagen).
 *
 * Uso: npm run clean:catalogo [-- --dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { cleanProducts } from './lib/catalog-clean.mjs'

const ROOT = new URL('../', import.meta.url)
const DATA = new URL('src/data/productos-reales.json', ROOT)
const REPORT = new URL('docs/limpieza-catalogo.json', ROOT)
const dryRun = process.argv.includes('--dry-run')

const productos = JSON.parse(readFileSync(DATA, 'utf8'))
if (!Array.isArray(productos)) throw new Error('El JSON de productos no es un array.')

console.log(`Revisando ${productos.length} fichas y sus fotos (esto puede tardar unos segundos)…`)
const { products, report } = await cleanProducts(productos, {
  onProgress: (done, total) => {
    if (done % 100 === 0 || done === total) console.log(`  ${done}/${total} URLs verificadas`)
  },
})

if (products.length === 0) throw new Error('La limpieza no dejó productos; no se sobrescribió el archivo.')

const publico = {
  fecha: new Date().toISOString(),
  entrada: report.entrada,
  importados: report.importados,
  eliminadosNoImportados: report.eliminadosNoImportados,
  fotosRevisadas: report.fotosRevisadas,
  fotosDescartadas: report.fotosDescartadas,
  productosSinFotoValida: report.productosSinFotoValida,
  resultado: report.resultado,
}
console.log(`\nResultado: ${report.resultado} productos limpios`)
console.log(`  no importados eliminados: ${report.eliminadosNoImportados}`)
console.log(`  fotos descartadas: ${report.fotosDescartadas.length}`)
console.log(`  productos sin foto válida eliminados: ${report.productosSinFotoValida.length}`)

if (dryRun) {
  console.log('Modo --dry-run: no se escribió ningún archivo.')
} else {
  writeFileSync(DATA, `${JSON.stringify(products, null, 2)}\n`, 'utf8')
  writeFileSync(REPORT, `${JSON.stringify(publico, null, 2)}\n`, 'utf8')
  console.log(`Escrito: ${DATA.pathname}`)
  console.log(`Informe: ${REPORT.pathname}`)
}
