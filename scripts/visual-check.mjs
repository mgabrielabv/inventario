#!/usr/bin/env node
/**
 * Verificación visual y de rendimiento con Playwright (Chromium local).
 * Abre el HTML único con file://, recorre las superficies en claro/oscuro,
 * mide CLS y tareas largas durante el scroll del héroe y comprueba que el
 * croma visible pertenezca a la familia burdeos–arcilla–crema–tan.
 *
 * Uso: npm run verify:visual   (requiere npm run build primero)
 */
import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'captures')
const base = pathToFileURL(join(root, 'dist', 'index.html')).href
const chrome = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'

const routes = [
  ['home', '#/'],
  ['catalogo', '#/tienda'],
  ['ficha', '#/tienda/001-laptop-14'],
  ['carrito', '#/carrito'],
  ['checkout', '#/pagar'],
  ['seguimiento', '#/seguimiento'],
  ['favoritos', '#/favoritos'],
  ['login', '#/ingresar'],
  ['admin-inicio', '#/admin'],
  ['admin-inventario', '#/admin/inventario'],
  ['admin-movimientos', '#/admin/movimientos'],
  ['admin-pedidos', '#/admin/pedidos'],
  ['admin-reposicion', '#/admin/reposicion'],
  ['admin-reportes', '#/admin/reportes'],
]

const perfScript = () => {
  window.__perf = { cls: 0, longTasks: 0, maxTask: 0 }
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__perf.cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch { /* sin soporte */ }
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perf.longTasks += 1
        window.__perf.maxTask = Math.max(window.__perf.maxTask, entry.duration)
      }
    }).observe({ type: 'longtask', buffered: true })
  } catch { /* sin soporte */ }
}

const paletteScript = async (dataUrl) => {
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let inside = 0
  let outside = 0
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    const light = (max + min) / 2
    if (delta < 0.08 || light < 0.12 || light > 0.96) continue
    const sat = delta / (1 - Math.abs(2 * light - 1))
    if (sat < 0.12) continue
    let hue
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue = (hue * 60 + 360) % 360
    if (hue <= 40 || hue >= 350) inside += 1
    else outside += 1
  }
  const total = inside + outside
  return { hueOk: total === 0 ? 1 : inside / total, sampled: total }
}

const capture = async (page, name) => {
  const shot = await page.screenshot({ fullPage: false })
  await writeFile(join(out, `${name}.png`), shot)
  const dataUrl = `data:image/png;base64,${shot.toString('base64')}`
  const palette = await page.evaluate(paletteScript, dataUrl)
  return palette
}

const scrollHero = async (page) => {
  await page.mouse.move(720, 450)
  for (let i = 0; i < 12; i += 1) {
    await page.mouse.wheel(0, 180)
    await page.waitForTimeout(70)
  }
  await page.waitForTimeout(400)
}

const run = async () => {
  await mkdir(out, { recursive: true })
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files'],
  })
  const report = { routes: {}, palette: {}, performance: {}, errors: [] }

  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: theme,
      reducedMotion: 'no-preference',
    })
    await context.addInitScript(perfScript)
    await context.addInitScript((value) => {
      try {
        localStorage.setItem('inventario-theme', value)
        localStorage.setItem('inventario-user', JSON.stringify({
          id: 'u-admin', username: 'admin', name: 'Administrador', role: 'Administrador',
        }))
        localStorage.setItem('inventario-cart-v2', JSON.stringify({
          state: { lines: [{ productoId: 'p002', cantidad: 1, agregadoEn: new Date().toISOString() }] },
          version: 2,
        }))
      } catch { /* file:// sin almacenamiento: la app usa memoria */ }
    }, theme)

    const page = await context.newPage()
    page.on('pageerror', (error) => report.errors.push(`${theme}: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error') report.errors.push(`${theme}: ${message.text()}`)
    })

    for (const [name, hash] of routes) {
      await page.goto(`${base}${hash}`, { waitUntil: 'load' })
      await page.waitForTimeout(650)
      report.routes[`${name}-${theme}`] = await capture(page, `${name}-${theme}`)
    }

    // CLS y tareas largas durante el scroll narrativo del héroe con CPU x4.
    const client = await context.newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.goto(`${base}#/`, { waitUntil: 'load' })
    await page.waitForTimeout(500)
    await scrollHero(page)
    report.performance[theme] = await page.evaluate(() => window.__perf)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })

    // A4 · seis fotogramas de la sección fijada.
    const narrative = await page.$('.narrative, .home-narrative, [data-narrative]')
    if (narrative) {
      const bounds = await narrative.boundingBox()
      if (bounds) {
        for (const [index, value] of [0, 0.2, 0.4, 0.6, 0.8, 1].entries()) {
          await page.evaluate(({ top, height, progress }) => {
            window.scrollTo(0, top - window.innerHeight + height * progress)
          }, { top: bounds.y, height: bounds.height, progress: value })
          await page.waitForTimeout(300)
          await page.screenshot({ path: join(out, `narrative-${value}-${theme}.png`) })
        }
      }
    }

    // A9 · secuencia del vuelo al carrito.
    await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
    await page.waitForTimeout(400)
    const add = await page.$('.product-card .btn--primary')
    if (add) {
      await add.click()
      for (let frame = 0; frame < 6; frame += 1) {
        await page.waitForTimeout(100)
        await page.screenshot({ path: join(out, `fly-to-cart-${frame}-${theme}.png`) })
      }
    }
    await context.close()
  }

  // Móvil 375 px en ambos temas.
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 1,
      colorScheme: theme,
      isMobile: true,
      hasTouch: true,
    })
    await context.addInitScript((value) => {
      try { localStorage.setItem('inventario-theme', value) } catch { /* ignore */ }
    }, theme)
    const page = await context.newPage()
    for (const [name, hash] of [['home', '#/'], ['catalogo', '#/tienda'], ['ficha', '#/tienda/002-mouse-inalambrico']]) {
      await page.goto(`${base}${hash}`, { waitUntil: 'load' })
      await page.waitForTimeout(500)
      report.routes[`${name}-mobile-${theme}`] = await capture(page, `${name}-mobile-${theme}`)
    }
    await context.close()
  }

  await browser.close()
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2))
  const paletteValues = Object.values(report.routes).map((item) => item.hueOk)
  const worst = Math.min(...paletteValues)
  console.log(`Capturas: ${out}`)
  console.log(`Croma dentro de 350°–40°: peor caso ${(worst * 100).toFixed(1)}%`)
  for (const [theme, perf] of Object.entries(report.performance)) {
    console.log(`${theme}: CLS ${perf.cls.toFixed(4)} · tareas largas ${perf.longTasks} · máx ${perf.maxTask.toFixed(1)} ms`)
  }
  if (report.errors.length) console.log(`Errores de consola: ${report.errors.length} (ver report.json)`)
  if (worst < 0.98 || report.errors.length) process.exitCode = 1
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
