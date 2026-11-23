#!/usr/bin/env node
/**
 * Verificación visual y E2E con Playwright (Chrome local).
 * Abre el HTML único con file://, recorre las superficies en claro/oscuro,
 * mide CLS y tareas largas, comprueba el croma visible, ejecuta el acceso del
 * personal y un checkout completo, y detecta peticiones externas o errores.
 *
 * Uso: npm run verify:visual   (requiere npm run build primero)
 */
import { chromium } from 'playwright-core'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'docs', 'capturas', 'verificacion')
const reportPath = join(root, 'docs', 'verificacion-visual.json')
const base = pathToFileURL(join(root, 'dist', 'index.html')).href
const chrome = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'
const htmlBytes = (await readFile(join(root, 'dist', 'index.html'))).byteLength

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
  const median = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
  let inside = 0
  let outside = 0
  const offsets = [-2, 0, 2]
  for (let i = 0; i < data.length; i += 16) {
    const pixel = i / 4
    const x = pixel % canvas.width
    const y = Math.floor(pixel / canvas.width)
    const reds = []
    const greens = []
    const blues = []
    for (const dy of offsets) {
      for (const dx of offsets) {
        const nx = Math.min(canvas.width - 1, Math.max(0, x + dx))
        const ny = Math.min(canvas.height - 1, Math.max(0, y + dy))
        const index = (ny * canvas.width + nx) * 4
        reds.push(data[index])
        greens.push(data[index + 1])
        blues.push(data[index + 2])
      }
    }
    // El valor mediano descarta el franjeado subpíxel del texto antialiased.
    const r = median(reds) / 255
    const g = median(greens) / 255
    const b = median(blues) / 255
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
  return page.evaluate(paletteScript, dataUrl)
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
  await mkdir(dirname(reportPath), { recursive: true })
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    // LCD text produce fringes RGB en el texto; desactivarlo evita falsos
    // positivos al medir el croma de los píxeles capturados.
    args: [
      '--no-sandbox',
      '--allow-file-access-from-files',
      '--disable-lcd-text',
      '--force-color-profile=srgb',
    ],
  })
  const report = {
    generatedAt: new Date().toISOString(),
    html: {
      bytes: htmlBytes,
      gzipBytes: gzipSync(await readFile(join(root, 'dist', 'index.html'))).length,
      limitBytes: 2.5 * 1024 * 1024,
    },
    routes: {},
    palette: {},
    performance: {},
    e2e: {},
    externalRequests: [],
    errors: [],
    problems: [],
  }

  const watch = (page, scope) => {
    page.on('pageerror', (error) => report.errors.push(`${scope}: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error') report.errors.push(`${scope}: ${message.text()}`)
    })
    page.on('request', (request) => {
      const url = request.url()
      if (!/^(?:file|data|blob|about):/.test(url)) report.externalRequests.push(`${scope}: ${url}`)
    })
  }

  const injectSession = (theme) => {
    try {
      localStorage.setItem('inventario-theme', theme)
      localStorage.setItem('inventario-user', JSON.stringify({
        id: 'u-admin', username: 'admin', name: 'Administrador', role: 'Administrador',
      }))
      localStorage.setItem('inventario-cart-v2', JSON.stringify({
        state: { lines: [{ productoId: 'p002', cantidad: 1, agregadoEn: new Date().toISOString() }] },
        version: 2,
      }))
    } catch { /* file:// sin almacenamiento: la app usa memoria */ }
  }

  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: theme,
      reducedMotion: 'no-preference',
    })
    await context.addInitScript(perfScript)
    await context.addInitScript(injectSession, theme)

    const page = await context.newPage()
    watch(page, theme)

    for (const [name, hash] of routes) {
      await page.goto(`${base}${hash}`, { waitUntil: 'load' })
      await page.waitForTimeout(650)
      report.routes[`${name}-${theme}`] = await capture(page, `${name}-${theme}`)
    }

    // CLS y tareas largas solo durante el scroll narrativo del héroe con CPU x4.
    const client = await context.newCDPSession(page)
    await page.goto(`${base}#/`, { waitUntil: 'load' })
    await page.waitForTimeout(600)
    await page.evaluate(() => { window.__perf = { cls: 0, longTasks: 0, maxTask: 0 } })
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await scrollHero(page)
    report.performance[theme] = await page.evaluate(() => window.__perf)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })

    // A4 · seis fotogramas de la sección fijada.
    const narrative = await page.$('.narrative, .home-narrative, [data-narrative]')
    if (narrative) {
      const bounds = await narrative.boundingBox()
      if (bounds) {
        for (const value of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
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
    watch(page, `${theme}-mobile`)
    for (const [name, hash] of [['home', '#/'], ['catalogo', '#/tienda'], ['ficha', '#/tienda/002-mouse-inalambrico']]) {
      await page.goto(`${base}${hash}`, { waitUntil: 'load' })
      await page.waitForTimeout(500)
      report.routes[`${name}-mobile-${theme}`] = await capture(page, `${name}-mobile-${theme}`)
    }
    await context.close()
  }

  // E2E · acceso del personal con credenciales de demostración.
  {
    let context
    try {
      context = await browser.newContext({
        viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'no-preference',
      })
      const page = await context.newPage()
      watch(page, 'e2e-login')
      await page.goto(`${base}#/ingresar`, { waitUntil: 'load' })
      await page.locator('input[autocomplete="username"]').fill('admin')
      await page.locator('input[autocomplete="current-password"]').fill('admin123')
      await page.getByRole('button', { name: 'Entrar', exact: true }).click()
      await page.waitForFunction(() => window.location.hash === '#/admin')
      await page.waitForSelector('.admin-sidebar')
      report.e2e.login = {
        ok: true,
        hash: await page.evaluate(() => window.location.hash),
        user: (await page.locator('.admin-user__button').innerText()).trim(),
      }
      await page.screenshot({ path: join(out, 'e2e-login-admin-light.png') })
    } catch (error) {
      report.e2e.login = { ok: false, error: error.message }
    } finally {
      await context?.close()
    }
  }

  // E2E · checkout completo hasta la confirmación del pedido.
  {
    let context
    try {
      context = await browser.newContext({
        viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'no-preference',
      })
      await context.addInitScript(() => {
        try {
          localStorage.setItem('inventario-cart-v2', JSON.stringify({
            state: { lines: [{ productoId: 'p002', cantidad: 1, agregadoEn: new Date().toISOString() }] },
            version: 2,
          }))
        } catch { /* ignore */ }
      })
      const page = await context.newPage()
      watch(page, 'e2e-checkout')
      const activeStep = (label) => page.waitForFunction(
        (text) => document.querySelector('.checkout-steps__item.is-active')?.textContent?.includes(text),
        label,
      )
      await page.goto(`${base}#/pagar`, { waitUntil: 'load' })
      await page.locator('[data-field="nombre"]').fill('Ana Pérez')
      await page.locator('[data-field="telefono"]').fill('0414-1234567')
      await page.locator('[data-field="email"]').fill('ana@example.com')
      await page.getByRole('button', { name: /Continuar/ }).click()
      await activeStep('Entrega')
      await page.getByRole('button', { name: /Continuar/ }).click()
      await activeStep('Pago')
      await page.locator('[data-field="acepta"]').check()
      await page.getByRole('button', { name: /Continuar/ }).click()
      await activeStep('Revisar')
      await page.screenshot({ path: join(out, 'e2e-checkout-revision-light.png') })
      await page.getByRole('button', { name: /Confirmar pedido/ }).click()
      await page.waitForFunction(() => window.location.hash.startsWith('#/pedido/'))
      await page.locator('h1:has-text("Pedido confirmado")').waitFor()
      const hash = await page.evaluate(() => window.location.hash)
      report.e2e.checkout = { ok: true, hash, code: hash.split('/').pop() ?? '' }
      await page.screenshot({ path: join(out, 'e2e-checkout-confirmado-light.png') })
    } catch (error) {
      report.e2e.checkout = { ok: false, error: error.message }
    } finally {
      await context?.close()
    }
  }

  await browser.close()

  const paletteValues = Object.values(report.routes).map((item) => item.hueOk)
  const worst = Math.min(...paletteValues)
  report.palette = { worst, threshold: 0.98 }
  if (htmlBytes > report.html.limitBytes) report.problems.push('HTML por encima de 2.5 MB')
  if (worst < 0.98) report.problems.push('Croma visible fuera de la familia de color')
  if (report.errors.length) report.problems.push('Errores de consola o de página')
  if (report.externalRequests.length) report.problems.push('Peticiones a recursos externos')
  for (const [name, result] of Object.entries(report.e2e)) {
    if (!result?.ok) report.problems.push(`E2E ${name} fallido`)
  }
  for (const [theme, perf] of Object.entries(report.performance)) {
    if (perf.cls > 0.01) report.problems.push(`CLS alto en ${theme}`)
    if (perf.longTasks > 0 || perf.maxTask > 50) report.problems.push(`Tareas largas en ${theme}`)
  }
  await writeFile(reportPath, JSON.stringify(report, null, 2))

  console.log(`Capturas: ${out}`)
  console.log(`Informe: ${reportPath}`)
  console.log(`HTML: ${(htmlBytes / 1024 / 1024).toFixed(2)} MiB · gzip ${(report.html.gzipBytes / 1024 / 1024).toFixed(2)} MiB · límite 2.5 MiB`)
  console.log(`Croma dentro de 350°–40°: peor caso ${(worst * 100).toFixed(1)}%`)
  for (const [theme, perf] of Object.entries(report.performance)) {
    console.log(`${theme}: CLS ${perf.cls.toFixed(4)} · tareas largas ${perf.longTasks} · máx ${perf.maxTask.toFixed(1)} ms`)
  }
  console.log(`E2E: acceso ${report.e2e.login?.ok ? 'OK' : 'fallido'} · checkout ${report.e2e.checkout?.ok ? `OK (${report.e2e.checkout.code})` : 'fallido'}`)
  if (report.externalRequests.length) console.log(`Peticiones externas: ${report.externalRequests.length}`)
  if (report.errors.length) console.log(`Errores de consola: ${report.errors.length}`)
  if (report.problems.length) {
    console.log(`Problemas: ${report.problems.join('; ')}`)
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
