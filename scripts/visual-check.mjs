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

// La marca manda también en las claves de la verificación: si cambia BRAND.slug,
// este script sigue encontrando la sesión sembrada sin tocar el código fuente.
const brandSource = await readFile(join(root, 'src', 'config', 'brand.ts'), 'utf8')
const brandSlug = /slug:\s*'([^']+)'/.exec(brandSource)?.[1] ?? 'tienda'
const storeKey = (suffix) => `${brandSlug}-${suffix}`
const STORE = {
  theme: storeKey('theme'),
  user: storeKey('user'),
  cart: storeKey('cart-v2'),
  customerSession: storeKey('customer-session-v1'),
}

const routes = [
  ['home', '#/'],
  ['catalogo', '#/tienda'],
  ['catalogo-filtros', '#/tienda?categoria=Accesorios&orden=precio-asc&densidad=compacta'],
  ['ficha', '#/tienda/001-laptop-14'],
  ['carrito', '#/carrito'],
  ['checkout', '#/pagar'],
  ['seguimiento', '#/seguimiento'],
  ['favoritos', '#/favoritos'],
  ['cuenta-ingresar', '#/cuenta/ingresar'],
  ['cuenta-registro', '#/cuenta/registro'],
  ['login', '#/ingresar'],
  ['admin-inicio', '#/admin'],
  ['admin-clientes', '#/admin/clientes'],
  ['admin-inventario', '#/admin/inventario'],
  ['admin-movimientos', '#/admin/movimientos'],
  ['admin-pedidos', '#/admin/pedidos'],
  ['admin-reposicion', '#/admin/reposicion'],
  ['admin-reportes', '#/admin/reportes'],
]

/** Matriz de anchos de la ronda 2. 1280 se mide sin puntero táctil. */
const mobileViewports = [
  { name: '320', width: 320, height: 568, touch: true },
  { name: '390', width: 390, height: 844, touch: true },
  { name: '412', width: 412, height: 915, touch: true },
  { name: '768', width: 768, height: 1024, touch: true },
  { name: '1280', width: 1280, height: 800, touch: false },
]
const mobileRoutes = [
  ['home', '#/'],
  ['catalogo', '#/tienda'],
  ['ficha', '#/tienda/002-mouse-inalambrico'],
  ['carrito', '#/carrito'],
  ['admin-inventario', '#/admin/inventario'],
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
  const palette = await page.evaluate(paletteScript, dataUrl)
  const geometry = await page.evaluate(() => ({
    overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  }))
  return { ...palette, ...geometry }
}

/** Métricas de accesibilidad móvil; se ejecuta dentro del navegador. */
const mobileMetricsScript = () => {
  const visible = (el) => {
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }
  const label = (el) => {
    const text = (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 36)
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 2).join('.') : ''
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${text ? ` «${text}»` : ''}`
  }
  const ignoredTarget = (el) => el.closest('.sr-only, .eshop-sr-only, [aria-hidden="true"], .mesh, svg')
  const smallTargets = []
  const smallFields = []
  const selector = 'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [role="button"], [role="switch"]'
  for (const el of document.querySelectorAll(selector)) {
    if (!visible(el) || ignoredTarget(el)) continue
    const rect = el.getBoundingClientRect()
    // WCAG 2.5.8 exime los enlaces de texto dentro de una frase.
    const inline = el.tagName === 'A' && (
      el.closest('p') || el.closest('li') || el.closest('.t-body')
      || getComputedStyle(el).display === 'inline'
    )
    if (!inline && (rect.width < 44 || rect.height < 44)) {
      smallTargets.push({ el: label(el), w: Math.round(rect.width), h: Math.round(rect.height) })
    }
  }
  for (const el of document.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
    if (!visible(el) || ignoredTarget(el)) continue
    const size = parseFloat(getComputedStyle(el).fontSize)
    if (size < 16) smallFields.push({ el: label(el), px: Math.round(size * 10) / 10 })
  }
  return {
    smallTargets,
    smallFields,
    overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    cls: window.__perf?.cls ?? 0,
    longTasks: window.__perf?.longTasks ?? 0,
    maxTask: window.__perf?.maxTask ?? 0,
  }
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
    mobile: {},
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

  // addInitScript serializa la función: todo lo que venga de Node llega como
  // argumento, nunca como closure. Por eso STORE se pasa explícitamente.
  const injectSession = ({ store, theme }) => {
    try {
      localStorage.setItem(store.theme, theme)
      localStorage.setItem(store.user, JSON.stringify({
        id: 'u-admin', username: 'admin', name: 'Administrador', role: 'Administrador',
      }))
      localStorage.setItem(store.cart, JSON.stringify({
        state: { lines: [{ productoId: 'p002', cantidad: 1, agregadoEn: new Date().toISOString() }] },
        version: 2,
      }))
    } catch { /* file:// sin almacenamiento: la app usa memoria */ }
  }

  const injectCart = (store) => {
    try {
      localStorage.setItem(store.cart, JSON.stringify({
        state: { lines: [{ productoId: 'p002', cantidad: 1, agregadoEn: new Date().toISOString() }] },
        version: 2,
      }))
    } catch { /* ignore */ }
  }

  const injectGuest = (store) => {
    try {
      localStorage.setItem(store.customerSession, JSON.stringify({
        state: { accountId: null, remember: false, guestCheckout: true },
        version: 1,
      }))
    } catch { /* ignore */ }
  }

  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: theme,
      reducedMotion: 'no-preference',
    })
    await context.addInitScript(perfScript)
    await context.addInitScript(injectSession, { store: STORE, theme })

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

  // Matriz móvil: CLS con CPU x4, objetivos táctiles y campos <16 px.
  for (const vp of mobileViewports) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        colorScheme: theme,
        isMobile: vp.touch,
        hasTouch: vp.touch,
        reducedMotion: 'no-preference',
      })
      await context.addInitScript(perfScript)
      await context.addInitScript(({ store, theme }) => {
        try {
          localStorage.setItem(store.theme, theme)
          localStorage.setItem(store.user, JSON.stringify({
            id: 'u-admin', username: 'admin', name: 'Administrador', role: 'Administrador',
          }))
          localStorage.setItem(store.cart, JSON.stringify({
            state: { lines: [{ productoId: 'p002', cantidad: 1, agregadoEn: new Date().toISOString() }] },
            version: 2,
          }))
        } catch { /* file:// sin almacenamiento */ }
      }, { store: STORE, theme })
      const page = await context.newPage()
      watch(page, `${vp.name}-${theme}`)
      const client = await context.newCDPSession(page)
      for (const [name, hash] of mobileRoutes) {
        // El router por hash no recarga: reiniciamos el observador antes de
        // cada ruta para que no se acumulen tareas de la captura anterior.
        await page.evaluate(() => { window.__perf = { cls: 0, longTasks: 0, maxTask: 0 } })
        await page.goto(`${base}${hash}`, { waitUntil: 'load' })
        await page.waitForTimeout(420)
        const loadCls = await page.evaluate(() => window.__perf?.cls ?? 0)
        // CLS de carga a velocidad normal; tareas largas durante una
        // interacción con CPU x4, igual que en la medición de escritorio.
        await page.evaluate(() => { window.__perf = { cls: 0, longTasks: 0, maxTask: 0 } })
        await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
        await page.evaluate(() => window.scrollTo({ top: 240, behavior: 'instant' }))
        await page.waitForTimeout(320)
        const metrics = await page.evaluate(mobileMetricsScript)
        await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
        metrics.cls = Math.max(loadCls, metrics.cls)
        report.mobile[`${vp.name}-${theme}-${name}`] = metrics
        // 390 conserva los nombres históricos de capturas del informe.
        const shot = vp.name === '390' ? `${name}-mobile-${theme}` : `${name}-${vp.name}-${theme}`
        report.routes[shot] = await capture(page, shot)
      }
      await context.close()
    }
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

  const finishCheckout = async (page, scope) => {
    const activeStep = (label) => page.waitForFunction(
      (text) => document.querySelector(
        '.checkout-accordion__item.is-open .checkout-accordion__label h2',
      )?.textContent?.includes(text),
      label,
    )
    const next = () => page.locator('.checkout-nav button', { hasText: 'Continuar' }).click()
    await page.goto(`${base}#/pagar`, { waitUntil: 'load' })
    const guest = page.getByRole('button', { name: 'Continuar como invitado' })
    if (await guest.count()) await guest.click()
    await page.locator('[data-field="nombre"]').fill('Ana Pérez')
    await page.locator('[data-field="telefono"]').fill('0414-1234567')
    await page.locator('[data-field="email"]').fill('ana@example.com')
    await next()
    await activeStep('Entrega')
    await next()
    await activeStep('Pago')
    await next()
    await activeStep('Revisar')
    await page.locator('[data-field="acepta"]').check()
    await page.screenshot({ path: join(out, `e2e-${scope}-revision-light.png`) })
    await page.getByRole('button', { name: /Confirmar pedido/ }).click()
    await page.waitForFunction(() => window.location.hash.startsWith('#/pedido/'))
    await page.locator('h1:has-text("Pedido confirmado")').waitFor()
    const hash = await page.evaluate(() => window.location.hash)
    await page.screenshot({ path: join(out, `e2e-${scope}-confirmado-light.png`) })
    return hash
  }

  // E2E · cliente: ingreso, cuenta, bloqueo del panel y compra con cuenta.
  {
    let context
    try {
      context = await browser.newContext({
        viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'no-preference',
      })
      await context.addInitScript(injectCart, STORE)
      const page = await context.newPage()
      watch(page, 'e2e-cliente')
      await page.goto(`${base}#/cuenta/ingresar`, { waitUntil: 'load' })
      await page.locator('input[autocomplete="username"]').fill('cliente@ejemplo.com')
      await page.locator('input[autocomplete="current-password"]').fill('cliente123')
      await page.getByRole('button', { name: 'Entrar', exact: true }).click()
      await page.waitForFunction(() => window.location.hash === '#/cuenta')
      const cuentaHash = await page.evaluate(() => window.location.hash)
      await page.screenshot({ path: join(out, 'e2e-cliente-cuenta-light.png') })

      // La sesión de cliente no abre el panel: cae al ingreso del personal.
      await page.goto(`${base}#/admin`, { waitUntil: 'load' })
      await page.waitForFunction(() => window.location.hash === '#/ingresar')
      const adminRedirect = await page.evaluate(() => window.location.hash)

      const checkoutHash = await finishCheckout(page, 'checkout-cuenta')
      report.e2e.cliente = {
        ok: true, cuentaHash, adminRedirect, checkout: checkoutHash.split('/').pop() ?? '',
      }
    } catch (error) {
      report.e2e.cliente = { ok: false, error: error.message }
    } finally {
      await context?.close()
    }
  }

  // E2E · checkout de invitado, con la tarjeta de cuenta al inicio.
  {
    let context
    try {
      context = await browser.newContext({
        viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'no-preference',
      })
      await context.addInitScript(injectCart, STORE)
      await context.addInitScript(injectGuest, STORE)
      const page = await context.newPage()
      watch(page, 'e2e-checkout')
      const hash = await finishCheckout(page, 'checkout')
      report.e2e.checkout = { ok: true, hash, code: hash.split('/').pop() ?? '' }
    } catch (error) {
      report.e2e.checkout = { ok: false, error: error.message }
    } finally {
      await context?.close()
    }
  }

  // E2E · filtros conservados en la URL y tarjetas visibles.
  {
    let context
    try {
      context = await browser.newContext({
        viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'no-preference',
      })
      const page = await context.newPage()
      watch(page, 'e2e-filtros')
      await page.goto(
        `${base}#/tienda?categoria=Accesorios&orden=precio-asc&densidad=compacta`,
        { waitUntil: 'load' },
      )
      await page.waitForSelector('.product-card')
      const cards = await page.locator('.product-card').count()
      const hash = await page.evaluate(() => window.location.hash)
      report.e2e.filtros = {
        ok: cards > 0 && hash.includes('densidad=compacta'), cards, hash,
      }
      await page.screenshot({ path: join(out, 'e2e-filtros-light.png') })
    } catch (error) {
      report.e2e.filtros = { ok: false, error: error.message }
    } finally {
      await context?.close()
    }
  }

  await browser.close()

  const paletteValues = Object.values(report.routes).map((item) => item.hueOk)
  const worst = Math.min(...paletteValues)
  const overflow = Math.max(...Object.values(report.routes).map((item) => item.overflow ?? 0))
  report.palette = { worst, threshold: 0.98 }
  report.overflow = { max: overflow, threshold: 2 }
  if (htmlBytes > report.html.limitBytes) report.problems.push('HTML por encima de 2.5 MB')
  if (worst < 0.98) report.problems.push('Croma visible fuera de la familia de color')
  if (overflow > 2) report.problems.push(`Desborde horizontal de ${overflow} px`)
  if (report.errors.length) report.problems.push('Errores de consola o de página')
  if (report.externalRequests.length) report.problems.push('Peticiones a recursos externos')
  for (const [name, result] of Object.entries(report.e2e)) {
    if (!result?.ok) report.problems.push(`E2E ${name} fallido`)
  }
  for (const [theme, perf] of Object.entries(report.performance)) {
    if (perf.cls > 0.01) report.problems.push(`CLS alto en ${theme}`)
    if (perf.longTasks > 0 || perf.maxTask > 50) report.problems.push(`Tareas largas en ${theme}`)
  }
  const mobileEntries = Object.entries(report.mobile)
  report.mobileSummary = {
    measurements: mobileEntries.length,
    smallTargets: mobileEntries.reduce((sum, [, m]) => sum + m.smallTargets.length, 0),
    smallFields: mobileEntries.reduce((sum, [, m]) => sum + m.smallFields.length, 0),
    maxOverflow: Math.max(0, ...mobileEntries.map(([, m]) => m.overflow)),
    maxCls: Math.max(0, ...mobileEntries.map(([, m]) => m.cls)),
    maxTask: Math.max(0, ...mobileEntries.map(([, m]) => m.maxTask)),
  }
  const ms = report.mobileSummary
  if (ms.smallTargets) report.problems.push(`${ms.smallTargets} objetivos táctiles por debajo de 44 px`)
  if (ms.smallFields) report.problems.push(`${ms.smallFields} campos con tipografía menor de 16 px`)
  if (ms.maxOverflow > 2) report.problems.push(`Desborde horizontal móvil de ${ms.maxOverflow} px`)
  if (ms.maxCls > 0.01) report.problems.push(`CLS móvil alto (${ms.maxCls.toFixed(4)})`)
  if (ms.maxTask > 50) report.problems.push(`Tarea larga móvil de ${ms.maxTask.toFixed(1)} ms`)
  await writeFile(reportPath, JSON.stringify(report, null, 2))

  console.log(`Capturas: ${out}`)
  console.log(`Informe: ${reportPath}`)
  console.log(`HTML: ${(htmlBytes / 1024 / 1024).toFixed(2)} MiB · gzip ${(report.html.gzipBytes / 1024 / 1024).toFixed(2)} MiB · límite 2.5 MiB`)
  console.log(`Croma dentro de 350°–40°: peor caso ${(worst * 100).toFixed(1)}% · desborde máx. ${overflow} px`)
  for (const [theme, perf] of Object.entries(report.performance)) {
    console.log(`${theme}: CLS ${perf.cls.toFixed(4)} · tareas largas ${perf.longTasks} · máx ${perf.maxTask.toFixed(1)} ms`)
  }
  console.log(`Móvil: ${ms.measurements} mediciones · CLS máx. ${ms.maxCls.toFixed(4)} · desborde ${ms.maxOverflow} px · objetivos <44 px ${ms.smallTargets} · campos <16 px ${ms.smallFields}`)
  console.log(`E2E: personal ${report.e2e.login?.ok ? 'OK' : 'fallido'} · cliente ${report.e2e.cliente?.ok ? 'OK' : 'fallido'} · invitado ${report.e2e.checkout?.ok ? `OK (${report.e2e.checkout.code})` : 'fallido'} · filtros ${report.e2e.filtros?.ok ? 'OK' : 'fallido'}`)
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
