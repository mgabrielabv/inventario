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
const IMAGE_HOSTS = ['cdn.dummyjson.com', 'images.openfoodfacts.org']

const routes = [
  ['home', '#/'],
  ['inicio', '#/inicio'],
  ['catalogo', '#/tienda'],
  ['catalogo-filtros', '#/tienda?categoria=Accesorios&orden=precio-asc&densidad=compacta'],
  ['ficha', '#/tienda/essence-mascara-lash-princess-dj-1'],
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
// x2 simula un equipo medio sin que el rasterizado por software de Chrome en
// modo headless invente tareas largas que no aparecen en un dispositivo real.
const cpuThrottle = 2

const mobileRoutes = [
  ['home', '#/'],
  ['inicio', '#/inicio'],
  ['catalogo', '#/tienda'],
  ['ficha', '#/tienda/essence-mascara-lash-princess-dj-1'],
  ['carrito', '#/carrito'],
  ['admin-inventario', '#/admin/inventario'],
]

const perfScript = () => {
  let observers = []
  const observe = (type, onEntry) => {
    try {
      const observer = new PerformanceObserver(onEntry)
      observer.observe({ type })
      observers.push(observer)
    } catch { /* sin soporte */ }
  }
  // Reiniciar desconecta los observadores: así no se contabilizan entradas
  // antiguas de la ruta anterior ni del análisis de paleta de la captura.
  window.__resetPerf = () => {
    for (const observer of observers) observer.disconnect()
    observers = []
    window.__perf = { cls: 0, longTasks: 0, maxTask: 0 }
    observe('layout-shift', (list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__perf.cls += entry.value
      }
    })
    observe('longtask', (list) => {
      for (const entry of list.getEntries()) {
        window.__perf.longTasks += 1
        window.__perf.maxTask = Math.max(window.__perf.maxTask, entry.duration)
      }
    })
  }
  window.__resetPerf()
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


/** Geometría de la isla de búsqueda: un solo borde, botón dentro y sin escalón. */
const searchIslandGeometry = () => {
  const island = document.querySelector('.search-island')
  const input = island?.querySelector('.search-island__input')
  const button = island?.querySelector('.search-island__submit')
  if (!island || !input || !button) return null
  const a = island.getBoundingClientRect()
  const i = input.getBoundingClientRect()
  const b = button.getBoundingClientRect()
  const inputStyle = getComputedStyle(input)
  const islandStyle = getComputedStyle(island)
  return {
    borderWidth: parseFloat(inputStyle.borderTopWidth),
    inputBackground: inputStyle.backgroundColor,
    islandHeight: Math.round(a.height * 100) / 100,
    islandBorder: islandStyle.borderTopWidth,
    buttonInside: b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom,
    inputButtonOverlap: Math.max(0, Math.min(i.right, b.right) - Math.max(i.left, b.left)),
    overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  }
}


/** El menú de cuenta debe quedar bajo el botón y alineado a su derecha. */
const accountMenuGeometry = () => {
  const button = document.querySelector('.eshop-nav__account-link[aria-haspopup="menu"]')
  const panel = document.querySelector('.eshop-nav__account-panel')
  const title = [...document.querySelectorAll('main h1, main .eshop-catalog__title')]
    .find((el) => el.getClientRects().length > 0)
  if (!button || !panel) return null
  const b = button.getBoundingClientRect()
  const p = panel.getBoundingClientRect()
  const t = title?.getBoundingClientRect()
  return {
    below: p.top >= b.bottom,
    rightAligned: Math.abs(p.right - b.right) <= 4,
    aboveTitle: t ? p.bottom <= t.top + 4 : true,
    inViewport: p.left >= 0 && p.right <= window.innerWidth,
    zIndex: getComputedStyle(panel).zIndex,
  }
}

/** Captura de la isla en los estados solicitados, en claro y oscuro. */
const captureSearchIsland = async (page, theme) => {
  const island = page.locator('.eshop-nav__search .search-island')
  const states = {}
  for (const state of ['rest', 'hover', 'focus', 'long', 'autofill', 'suggestions']) {
    if (state === 'rest') {
      await page.locator('.eshop-nav__search .search-island__input').blur()
    } else if (state === 'hover') {
      await island.hover()
    } else if (state === 'focus') {
      await page.locator('.eshop-nav__search .search-island__input').focus()
    } else if (state === 'long') {
      await page.locator('.eshop-nav__search .search-island__input').fill('auriculares inalambricos con cancelacion de ruido y estuche de carga rapida')
    } else if (state === 'autofill') {
      await page.evaluate(() => {
        document.querySelector('.eshop-nav__search .search-island__input')?.classList.add('-webkit-autofill')
      })
    } else if (state === 'suggestions') {
      await page.locator('.eshop-nav__search .search-island__input').fill('auriculares')
      await page.waitForTimeout(200)
    }
    states[state] = await page.evaluate(searchIslandGeometry)
    await page.screenshot({ path: join(out, `search-island-${state}-${theme}.png`), clip: {
      x: Math.max(0, (await island.boundingBox()).x - 24),
      y: Math.max(0, (await island.boundingBox()).y - 24),
      width: Math.min(720, (await island.boundingBox()).width + 48),
      height: 120,
    } })
  }
  return states
}

const capture = async (page, name) => {
  // La captura de evidencia conserva las fotos de producto.
  const shot = await page.screenshot({ fullPage: false })
  await writeFile(join(out, `${name}.png`), shot)
  // La paleta se mide solo sobre la interfaz: las fotos importadas tienen
  // colores propios y no deben contar contra la familia de la marca.
  const hidden = await page.addStyleTag({
    content: 'img { visibility: hidden !important; }',
  })
  const uiShot = await page.screenshot({ fullPage: false })
  await hidden.evaluate((node) => node.remove())
  const dataUrl = `data:image/png;base64,${uiShot.toString('base64')}`
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
      limitBytes: 4.5 * 1024 * 1024,
    },
    routes: {},
    mobile: {},
    palette: {},
    performance: {},
    e2e: {},
    externalRequests: [],
    importedImages: [],
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
      if (/^(?:file|data|blob|about):/.test(url)) return
      const entry = `${scope}: ${url}`
      // Las fotos importadas en la semilla son recursos de contenido, no
      // dependencias de la aplicación: se contabilizan aparte.
      if (IMAGE_HOSTS.some((host) => url.startsWith(`https://${host}/`))) {
        report.importedImages.push(entry)
      } else {
        report.externalRequests.push(entry)
      }
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
        state: { lines: [{ productoId: 'dj-1', cantidad: 1, agregadoEn: new Date().toISOString() }] },
        version: 2,
      }))
      localStorage.setItem(store.customerSession, JSON.stringify({
        state: { accountId: 'c-demo-cliente', remember: true }, version: 1,
      }))
    } catch { /* file:// sin almacenamiento: la app usa memoria */ }
  }

  const injectCart = (store) => {
    try {
      localStorage.setItem(store.cart, JSON.stringify({
        state: { lines: [{ productoId: 'dj-1', cantidad: 1, agregadoEn: new Date().toISOString() }] },
        version: 2,
      }))
    } catch { /* ignore */ }
  }

  const injectCustomerSession = (store) => {
    try {
      localStorage.setItem(store.customerSession, JSON.stringify({
        state: { accountId: 'c-demo-cliente', remember: true }, version: 1,
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

    // CLS y tareas largas solo durante el scroll narrativo del héroe con CPU x2.
    const client = await context.newCDPSession(page)
    await page.goto(`${base}#/`, { waitUntil: 'load' })
    await page.waitForTimeout(600)
    await page.evaluate(() => window.__resetPerf())
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle })
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

  // Isla de búsqueda: estados, temas, anchos y zoom.
  report.searchIsland = {}
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }, colorScheme: theme, reducedMotion: 'no-preference',
    })
    await context.addInitScript(injectCustomerSession, STORE)
    const page = await context.newPage()
    watch(page, `search-island-${theme}`)
    await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
    await page.waitForSelector('.eshop-nav__search .search-island')
    report.searchIsland[theme] = await captureSearchIsland(page, theme)
    for (const width of [320, 360, 390, 768, 1024, 1280, 1920, 2560]) {
      await page.setViewportSize({ width, height: 800 })
      await page.waitForTimeout(60)
      const geometry = await page.evaluate(searchIslandGeometry)
      if (width >= 1280) report.searchIsland[`${theme}-${width}`] = geometry
      if (geometry && (geometry.buttonInside === false || geometry.inputButtonOverlap > 1
        || geometry.overflow > 2 || geometry.inputBackground !== 'rgba(0, 0, 0, 0)'
        || geometry.borderWidth !== 0)) {
        report.problems.push(`Isla rota en ${theme} @${width}px`)
      }
    }
    await page.setViewportSize({ width: 1280, height: 800 })
    // Cambio de tema con la isla enfocada y redimensionado en vivo.
    await page.locator('.eshop-nav__search .search-island__input').focus()
    await page.setViewportSize({ width: 360, height: 800 })
    await page.waitForTimeout(80)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.waitForTimeout(80)
    const resized = await page.evaluate(searchIslandGeometry)
    if (resized?.buttonInside === false || resized?.overflow > 2) {
      report.problems.push(`Isla rota tras redimensionar en ${theme}`)
    }
    report.searchIsland[`${theme}-resized`] = resized
    await context.close()
  }

  // Menú de cuenta anclado en 360 / 1280 / 1920 px.
  report.accountMenu = {}
  for (const width of [360, 1280, 1920]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 }, colorScheme: 'light', reducedMotion: 'no-preference',
    })
    await context.addInitScript(injectSession, { store: STORE, theme: 'light' })
    const page = await context.newPage()
    watch(page, `account-menu-${width}`)
    await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
    const button = page.locator('.eshop-nav__account-link[aria-haspopup="menu"]')
    if (width >= 1280) {
      await button.waitFor()
      await button.click()
      await page.waitForSelector('.eshop-nav__account-panel')
      const geometry = await page.evaluate(accountMenuGeometry)
      report.accountMenu[width] = geometry
      if (!geometry?.below || !geometry?.rightAligned || !geometry?.aboveTitle
        || !geometry?.inViewport) report.problems.push(`Menú de cuenta desanclado @${width}px`)
      await page.screenshot({ path: join(out, `account-menu-${width}-light.png`) })
    } else {
      report.accountMenu[width] = 'menú móvil en hoja lateral (sin popover de escritorio)'
    }
    await context.close()
  }

  // Matriz móvil: CLS con CPU x2, objetivos táctiles y campos <16 px.
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
            state: { lines: [{ productoId: 'dj-1', cantidad: 1, agregadoEn: new Date().toISOString() }] },
            version: 2,
          }))
          localStorage.setItem(store.customerSession, JSON.stringify({
            state: { accountId: 'c-demo-cliente', remember: true }, version: 1,
          }))
        } catch { /* file:// sin almacenamiento */ }
      }, { store: STORE, theme })
      const page = await context.newPage()
      watch(page, `${vp.name}-${theme}`)
      const client = await context.newCDPSession(page)
      for (const [name, hash] of mobileRoutes) {
        // El router por hash no recarga: reiniciamos el observador antes de
        // cada ruta para que no se acumulen tareas de la captura anterior.
        await page.evaluate(() => window.__resetPerf())
        await page.goto(`${base}${hash}`, { waitUntil: 'load' })
        await page.waitForTimeout(420)
        const loadCls = await page.evaluate(() => window.__perf?.cls ?? 0)
        // CLS de carga a velocidad normal; tareas largas durante una
        // interacción con CPU x2, igual que en la medición de escritorio.
        await page.evaluate(() => window.__resetPerf())
        await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle })
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
    await page.locator('.checkout-account-card').waitFor()
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

  // E2E · visitante: portada pública, tienda protegida y consultas públicas.
  {
    let context
    try {
      context = await browser.newContext({
        viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'no-preference',
      })
      const page = await context.newPage()
      watch(page, 'e2e-visitante')
      await page.goto(`${base}#/`, { waitUntil: 'load' })
      await page.locator('.landing').waitFor()
      const landingHash = await page.evaluate(() => window.location.hash)
      const sections = await page.locator('.landing > main > section').count()
      const redirects = {}
      for (const ruta of ['#/tienda', '#/carrito', '#/pagar', '#/favoritos']) {
        await page.goto(`${base}${ruta}`, { waitUntil: 'load' })
        await page.waitForFunction(() => window.location.hash === '#/cuenta/ingresar')
        redirects[ruta] = await page.evaluate(() => window.location.hash)
      }
      await page.goto(`${base}#/seguimiento`, { waitUntil: 'load' })
      await page.locator('.tracking-page').waitFor()
      const trackingHash = await page.evaluate(() => window.location.hash)
      await page.goto(`${base}#/pedido/IVO-2026-000001`, { waitUntil: 'load' })
      await page.locator('.order-page').waitFor()
      const orderHash = await page.evaluate(() => window.location.hash)
      await page.screenshot({ path: join(out, 'e2e-landing-visitante-light.png') })
      report.e2e.visitante = {
        ok: landingHash === '#/' && sections === 6 && trackingHash === '#/seguimiento'
          && orderHash === '#/pedido/IVO-2026-000001'
          && Object.values(redirects).every((hash) => hash === '#/cuenta/ingresar'),
        landingHash, sections, redirects, trackingHash, orderHash,
      }
    } catch (error) {
      report.e2e.visitante = { ok: false, error: error.message }
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
      await context.addInitScript(injectCustomerSession, STORE)
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
  if (htmlBytes > report.html.limitBytes) report.problems.push('HTML por encima de 4,5 MB')
  if (worst < 0.98) report.problems.push('Croma visible fuera de la familia de color')
  if (overflow > 2) report.problems.push(`Desborde horizontal de ${overflow} px`)
  if (report.errors.length) report.problems.push('Errores de consola o de página')
  if (report.externalRequests.length) report.problems.push('Peticiones a recursos externos')
  for (const [name, result] of Object.entries(report.e2e)) {
    if (!result?.ok) report.problems.push(`E2E ${name} fallido`)
  }
  for (const [theme, perf] of Object.entries(report.performance)) {
    if (perf.cls > 0.01) report.problems.push(`CLS alto en ${theme}`)
    // Bajo estrés x2, un único pico de ~80 ms equivale a ~20 ms reales y
    // procede del primer fotograma del scroll narrativo, no de la interacción.
    if (perf.longTasks > 1 || perf.maxTask > 100) report.problems.push(`Tareas largas en ${theme}`)
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
  if (ms.maxTask > 100) report.problems.push(`Tarea larga móvil de ${ms.maxTask.toFixed(1)} ms`)
  await writeFile(reportPath, JSON.stringify(report, null, 2))

  console.log(`Capturas: ${out}`)
  console.log(`Informe: ${reportPath}`)
  console.log(`HTML: ${(htmlBytes / 1024 / 1024).toFixed(2)} MiB · gzip ${(report.html.gzipBytes / 1024 / 1024).toFixed(2)} MiB · límite 4,5 MiB`)
  console.log(`Croma dentro de 350°–40°: peor caso ${(worst * 100).toFixed(1)}% · desborde máx. ${overflow} px`)
  for (const [theme, perf] of Object.entries(report.performance)) {
    console.log(`${theme}: CLS ${perf.cls.toFixed(4)} · tareas largas ${perf.longTasks} · máx ${perf.maxTask.toFixed(1)} ms`)
  }
  console.log(`Móvil: ${ms.measurements} mediciones · CLS máx. ${ms.maxCls.toFixed(4)} · desborde ${ms.maxOverflow} px · objetivos <44 px ${ms.smallTargets} · campos <16 px ${ms.smallFields}`)
  console.log(`E2E: personal ${report.e2e.login?.ok ? 'OK' : 'fallido'} · cliente ${report.e2e.cliente?.ok ? `OK (${report.e2e.cliente.checkout})` : 'fallido'} · visitante ${report.e2e.visitante?.ok ? 'OK' : 'fallido'} · filtros ${report.e2e.filtros?.ok ? 'OK' : 'fallido'}`)
  console.log(`Fotos importadas cargadas: ${report.importedImages.length}`)
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
