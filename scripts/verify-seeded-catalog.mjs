/**
 * Verificación visual del catálogo sembrado.
 * Requiere un servidor previo: npm run preview -- --port 4173
 * Opcionalmente CHROME_PATH=/ruta/a/chrome.
 */

import { existsSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)
const executablePath = CANDIDATES.find((path) => existsSync(path))
if (!executablePath) throw new Error('No se encontró Chrome/Edge; define CHROME_PATH.')

const browser = await chromium.launch({ executablePath, headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${BASE}/#/tienda`, { waitUntil: 'domcontentloaded' })
  await page.locator('.eshop-grid__cell').first().waitFor({ timeout: 30_000 })
  await page.waitForFunction(() => document.querySelectorAll('.eshop-grid__cell').length >= 24)

  const first = page.locator('.eshop-grid__cell').first()
  const card = {
    titulo: await first.locator('.eshop-card__title').innerText(),
    meta: await first.locator('.eshop-card__meta').innerText(),
    precio: await first.locator('.eshop-card__price').innerText(),
  }
  const fotoCard = page.locator('.eshop-grid__cell')
    .filter({ has: page.locator('.eshop-photo__img') }).first()
  await fotoCard.waitFor({ timeout: 30_000 })
  card.foto = await fotoCard.locator('.eshop-photo__img').getAttribute('src')
  const cardsIniciales = await page.locator('.eshop-grid__cell').count()
  const contador = await page.locator('.eshop-toolbar__count').innerText()
  await page.waitForFunction(() => [...document.querySelectorAll('.eshop-photo__img')]
    .some((img) => img.complete && img.naturalWidth > 0), null, { timeout: 30_000 })
  const fotosCargadas = await page.evaluate(() => [...document.querySelectorAll('.eshop-photo__img')]
    .filter((img) => img.complete && img.naturalWidth > 0).length)

  await page.getByRole('button', { name: 'Cargar más' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.eshop-grid__cell').length >= 48)
  const cardsTrasCargar = await page.locator('.eshop-grid__cell').count()
  await context.close()

  // Segunda pasada: bloqueamos las imágenes externas y comprobamos el placeholder.
  const fallido = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await fallido.route(/^https?:\/\/(cdn\.dummyjson\.com|images\.openfoodfacts\.org)\//, (route) => route.abort())
  const pageFallido = await fallido.newPage()
  await pageFallido.goto(`${BASE}/#/tienda`, { waitUntil: 'domcontentloaded' })
  await pageFallido.locator('.eshop-photo__art-wrap').first().waitFor({ timeout: 30_000 })
  const placeholders = await pageFallido.locator('.eshop-photo__art-wrap').count()
  await fallido.close()

  // Tercera pasada: un navegador con datos v7 y fichas de relleno debe quedar
  // limpio tras la migración v8 (sin duplicados y sin marcas inventadas).
  const productosReales = JSON.parse(readFileSync(
    new URL('../src/data/productos-reales.json', import.meta.url), 'utf8'))
  const esperados = productosReales.filter((p) => p.publicado !== false).length
  const migracion = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await migracion.addInitScript(() => {
    try {
      localStorage.setItem('ivoria-storage', JSON.stringify({
        state: {
          products: [
            { id: 'p001', codigo: '001', slug: 'laptop-14', nombre: 'Laptop 14 de relleno',
              categoria: 'Tecnología', imagenes: ['/arte/laptop.svg'], publicado: true,
              precio: 1, stock: 1, arquetipo: 'laptop' },
          ],
          movements: [
            { id: 'm-viejo', productoId: 'p001', fecha: new Date().toISOString(),
              tipo: 'Entrada', cantidad: 1, motivo: 'Inventario inicial' },
          ],
        },
        version: 7,
      }))
    } catch { /* about:blank no permite localStorage */ }
  })
  const pageMigracion = await migracion.newPage()
  await pageMigracion.goto(`${BASE}/#/tienda`, { waitUntil: 'domcontentloaded' })
  await pageMigracion.waitForFunction(
    () => document.querySelectorAll('.eshop-grid__cell').length >= 24, null, { timeout: 30_000 })
  const contadorMigrado = await pageMigracion.locator('.eshop-toolbar__count').innerText()
  const migrados = Number(/\d+ de (\d+)/.exec(contadorMigrado)?.[1] ?? 0)
  const textoMigrado = await pageMigracion.locator('.eshop-catalog').innerText()
  await migracion.close()

  const checks = [
    ['24 tarjetas en la primera página', cardsIniciales === 24, cardsIniciales],
    ['más de 400 productos en total', Number(/\d+ de (\d+)/.exec(contador)?.[1] ?? 0) > 400, contador],
    ['foto externa visible', Boolean(card.foto?.startsWith('https://')) && fotosCargadas > 0, { foto: card.foto, fotosCargadas }],
    ['nombre, categoría y precio visibles', Boolean(card.titulo && card.meta && card.precio), card],
    ['Cargar más añade otra página', cardsTrasCargar === 48, cardsTrasCargar],
    ['URL fallida usa ilustración de respaldo', placeholders > 0, placeholders],
    ['la migración v8 elimina el relleno', migrados === esperados, { migrados, esperados, contadorMigrado }],
    ['sin marcas ni fichas inventadas', !/de relleno|Velmar|Nordisa|Laptop 14/.test(textoMigrado),
      textoMigrado.match(/de relleno|Velmar|Nordisa|Laptop 14/g) ?? []],
  ]
  for (const [label, ok, detail] of checks) {
    console.log(`${ok ? 'OK ' : 'FAIL'} ${label}:`, JSON.stringify(detail))
  }
  if (checks.some(([, ok]) => !ok)) process.exitCode = 1
} finally {
  await browser.close()
}
