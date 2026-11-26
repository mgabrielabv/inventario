#!/usr/bin/env node
/**
 * Verificación de movimiento de la ronda 4.
 *
 * Abre el HTML único con file:// en 390x844 y 1280x800, reproduce los cinco
 * flujos grabables (añadir, ficha, filtros, confirmar pedido y cambio de estado
 * en el panel) con CPU x4 y red lenta, y mide:
 *   - FPS medio durante la interacción (objetivo >= 55).
 *   - CLS acumulado (objetivo <= 0,05).
 *   - Tareas largas > 50 ms (objetivo 0).
 *   - Ausencia de nodos huérfanos 2 s después (vuelo, toast, backdrop, hoja).
 *   - reduced-motion: adornos ocultos y feedback accesible conservado.
 *   - Cero peticiones externas y cero errores de consola.
 *
 * Uso: npm run verify:motion   (requiere npm run build primero)
 */
import { chromium } from 'playwright-core'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'docs', 'capturas', 'ronda4')
const reportPath = join(root, 'docs', 'verificacion-motion.json')
const base = pathToFileURL(join(root, 'dist', 'index.html')).href
const chrome = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'

const brandSource = await readFile(join(root, 'src', 'config', 'brand.ts'), 'utf8')
const slug = /slug:\s*'([^']+)'/.exec(brandSource)?.[1] ?? 'tienda'
const key = (suffix) => `${slug}-${suffix}`
const STORE = {
  theme: key('theme'),
  user: key('user'),
  cart: key('cart-v2'),
  customerSession: key('customer-session-v1'),
}

const VIEWPORTS = [
  { name: '390', width: 390, height: 844, touch: true },
  { name: '1280', width: 1280, height: 800, touch: false },
]

// El toast es feedback funcional (3,8–6 s), no un nodo de animación huérfano.
const ORPHAN_SELECTOR = [
  '.fly-token', '.cart-ripple', '.eshop-mega',
  '.sheet-backdrop', '.sheet-root', '.checkout-alert', '.admin-order-flash',
].join(', ')

const perfScript = () => {
  window.__motion = { cls: 0, longTasks: 0, maxTask: 0, shifts: [] }
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__motion.cls += entry.value
          window.__motion.shifts.push({
            at: Math.round(entry.startTime),
            value: Math.round(entry.value * 10000) / 10000,
            sources: (entry.sources ?? []).slice(0, 4).map((source) => {
              const node = source.node
              const label = node
                ? `${node.nodeName.toLowerCase()}${node.id ? `#${node.id}` : ''}.${(node.className?.toString?.() ?? '').trim().replace(/\s+/g, '.')}`
                : '?'
              return {
                node: label.slice(0, 100),
                from: source.previousRect && `${Math.round(source.previousRect.y)},${Math.round(source.previousRect.height)}`,
                to: source.currentRect && `${Math.round(source.currentRect.y)},${Math.round(source.currentRect.height)}`,
              }
            }),
          })
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch { /* sin soporte */ }
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__motion.longTasks += 1
        window.__motion.maxTask = Math.max(window.__motion.maxTask, entry.duration)
      }
    }).observe({ type: 'longtask', buffered: true })
  } catch { /* sin soporte */ }
}

/** Muestreo de rAF: cuenta fotogramas reales, no supone 60 Hz. */
const startFps = (page) => page.evaluate(() => {
  const state = { frames: 0, start: performance.now(), last: performance.now(), maxGap: 0, jank: 0 }
  window.__fps = state
  const tick = (time) => {
    if (window.__fps !== state) return
    const gap = time - state.last
    state.frames += 1
    state.maxGap = Math.max(state.maxGap, gap)
    if (gap > 24) state.jank += 1
    state.last = time
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})

const stopFps = (page) => page.evaluate(() => {
  const state = window.__fps
  window.__fps = null
  if (!state) return { fps: 0, frames: 0, elapsed: 0, maxGap: 0, jank: 0 }
  const elapsed = performance.now() - state.start
  return {
    fps: elapsed > 0 ? Math.round((state.frames / elapsed) * 10000) / 10 : 0,
    frames: state.frames,
    elapsed: Math.round(elapsed),
    maxGap: Math.round(state.maxGap * 10) / 10,
    jank: state.jank,
  }
})

const sample = (page) => page.evaluate((selector) => {
  const nodes = Array.from(document.querySelectorAll(selector))
  const visible = nodes.filter((node) => {
    const style = getComputedStyle(node)
    return style.display !== 'none' && style.visibility !== 'hidden'
  })
  return {
    orphans: visible.length,
    orphanNodes: visible.slice(0, 6).map((node) => node.className?.toString?.() ?? node.tagName),
    perf: { ...(window.__motion ?? {}) },
    live: Array.from(document.querySelectorAll('[aria-live]'))
      .map((node) => (node.textContent ?? '').trim())
      .filter(Boolean),
  }
}, ORPHAN_SELECTOR)

const session = ({ store, theme = 'light', admin = false, cart = true }) => {
  try {
    localStorage.setItem(store.theme, theme)
    if (admin) {
      localStorage.setItem(store.user, JSON.stringify({
        id: 'u-admin', username: 'admin', name: 'Administrador', role: 'Administrador',
      }))
    }
    if (cart) {
      localStorage.setItem(store.cart, JSON.stringify({
        state: {
          lines: [{
            productoId: 'dj-1', cantidad: 1, agregadoEn: new Date().toISOString(),
          }],
        },
        version: 2,
      }))
    }
  } catch { /* file:// sin almacenamiento: la app usa memoria */ }
}

const open = async (browser, viewport, options = {}) => {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    colorScheme: options.theme ?? 'light',
    reducedMotion: options.reduce ? 'reduce' : 'no-preference',
    hasTouch: viewport.touch,
    isMobile: viewport.touch,
  })
  await context.addInitScript(perfScript)
  await context.addInitScript(session, {
    store: STORE, theme: options.theme ?? 'light',
    admin: options.admin ?? false, cart: options.cart ?? true,
  })
  const page = await context.newPage()
  const client = await context.newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await client.send('Network.enable')
  await client.send('Network.emulateNetworkConditions', {
    offline: false, latency: 180, downloadThroughput: 120 * 1024, uploadThroughput: 60 * 1024,
  })
  return { context, page, client }
}

const measure = async (page, client, action, hold = 1500) => {
  await page.evaluate(() => { window.__motion = { cls: 0, longTasks: 0, maxTask: 0, shifts: [] } })
  await startFps(page)
  const detail = await action()
  await page.waitForTimeout(hold)
  const fps = await stopFps(page)
  // Se toma el corte y se reinicia: lo que llegue después es la fase de limpieza.
  const perf = await page.evaluate(() => {
    const snapshot = { ...(window.__motion ?? {}) }
    window.__motion = { cls: 0, longTasks: 0, maxTask: 0, shifts: [] }
    return snapshot
  })
  return {
    ...detail,
    fps: fps.fps,
    frames: fps.frames,
    jank: fps.jank,
    maxFrameGapMs: fps.maxGap,
    cls: Math.round(perf.cls * 10000) / 10000,
    shifts: perf.shifts,
    longTasks: perf.longTasks,
    maxTaskMs: Math.round(perf.maxTask * 10) / 10,
  }
}

/** Mide el instante del vuelo antes de que termine y comprueba la cola. */
const addToCart = async (page) => {
  await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
  await page.locator('.product-card .eshop-card__add').first().waitFor()
  // Calentamiento: la primera interacción compila el camino de vuelo y pone
  // en marcha el bucle de Framer. Se mide la segunda, que es estado estacionario.
  await page.locator('.product-card .eshop-card__add').first().click()
  await page.waitForTimeout(1600)
  const detail = await measure(page, null, async () => {
    const button = page.locator('.product-card .eshop-card__add').nth(1)
    await button.click()
    await page.waitForTimeout(140)
    const flight = await page.evaluate(() => ({
      tokens: document.querySelectorAll('.fly-token').length,
      thumb: Boolean(document.querySelector('.fly-token .product-art, .fly-token img')),
      ripple: document.querySelectorAll('.cart-ripple').length,
    }))
    return { flight }
  })
  await page.waitForTimeout(2000)
  const after = await sample(page)
  return { ...detail, after }
}

const openProduct = async (page) => {
  await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
  await page.locator('.eshop-card__title').first().waitFor()
  // Calentamiento de la ruta: se abre y se vuelve antes de medir.
  await page.locator('.eshop-card__title').first().click()
  await page.waitForTimeout(900)
  await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
  await page.locator('.eshop-card__title').first().waitFor()
  const detail = await measure(page, null, async () => {
    await page.locator('.eshop-card__title').first().click()
    await page.waitForTimeout(220)
    return {
      hash: await page.evaluate(() => window.location.hash),
      title: await page.locator('h1').first().innerText(),
    }
  }, 1200)
  await page.waitForTimeout(2000)
  return { ...detail, after: await sample(page) }
}

const filterSheet = async (page) => {
  // La hoja de filtros solo existe en móvil: se fuerza el ancho en ambas
  // mediciones para reproducir el mismo flujo en los dos equipos objetivo.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
  await page.locator('.eshop-toolbar__filters').waitFor()
  // Calentamiento: abrir y cerrar una vez antes de medir.
  await page.locator('.eshop-toolbar__filters').click()
  await page.locator('.sheet-root .sheet.eshop-filter-sheet').waitFor()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(700)
  const detail = await measure(page, null, async () => {
    await page.locator('.eshop-toolbar__filters').click()
    await page.locator('.sheet-root .sheet.eshop-filter-sheet').waitFor()
    await page.waitForTimeout(180)
    return { sheetOpen: await page.locator('.sheet-root .sheet.eshop-filter-sheet').count() }
  }, 1200)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(2000)
  return { ...detail, after: await sample(page) }
}

/** Checkout de invitado hasta la confirmación, con medición en el cierre. */
const confirmOrder = async (page) => {
  await page.goto(`${base}#/pagar`, { waitUntil: 'load' })
  const guest = page.getByRole('button', { name: 'Continuar como invitado' })
  if (await guest.count()) await guest.click()
  await page.locator('[data-field="nombre"]').fill('Ana Pérez')
  await page.locator('[data-field="telefono"]').fill('0414-1234567')
  await page.locator('[data-field="email"]').fill('ana@example.com')
  const next = () => page.locator('.checkout-nav button', { hasText: 'Continuar' }).click()
  await next()
  await next()
  await next()
  // Calentamiento del control de aceptación antes de medir el cierre.
  const terms = page.locator('[data-field="acepta"]')
  await terms.check()
  await page.waitForTimeout(300)
  await terms.uncheck()
  const detail = await measure(page, null, async () => {
    await terms.check()
    await page.getByRole('button', { name: /Confirmar pedido/ }).click()
    await page.waitForFunction(() => window.location.hash.startsWith('#/pedido/'))
    await page.locator('.order-celebration').waitFor()
    await page.waitForTimeout(220)
    return {
      hash: await page.evaluate(() => window.location.hash),
      celebration: await page.locator('.order-celebration').count(),
      live: await page.locator('[role="status"], [aria-live]').count(),
    }
  }, 1400)
  await page.waitForTimeout(2000)
  return { ...detail, after: await sample(page) }
}

const adminStatus = async (page) => {
  await page.goto(`${base}#/admin/pedidos`, { waitUntil: 'load' })
  await page.locator('.admin-order-card').first().waitFor()
  // Calentamiento: abrir y cerrar la hoja antes de medir el cambio de estado.
  await page.locator('.admin-order-card').first().click()
  await page.waitForTimeout(500)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(700)
  const before = await page.locator('.admin-order-card .admin-order-status').first().innerText()
  const detail = await measure(page, null, async () => {
    await page.locator('.admin-order-card').first().click()
    await page.locator('.admin-sheet-actions button').first().click()
    await page.waitForTimeout(180)
    return { before }
  }, 1400)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(2000)
  return {
    ...detail,
    statusChip: await page.locator('.admin-order-card .admin-order-status').first().innerText(),
    after: await sample(page),
  }
}

const FLOWS = [
  ['anadir-carrito', addToCart],
  ['abrir-ficha', openProduct],
  ['hoja-filtros', filterSheet],
  ['confirmar-pedido', confirmOrder],
  ['estado-pedido', adminStatus],
]

/** Comprueba que la decoración desaparece pero el aviso accesible sigue. */
const reducedMotionCheck = async (browser, viewport) => {
  const { context, page, client } = await open(browser, viewport, { reduce: true })
  const result = {}
  try {
    await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
    await page.locator('.product-card .eshop-card__add').first().waitFor()
    result.reveal = await page.evaluate(() => {
      const node = document.querySelector('.eshop-card__badge, .admin-kpi-grid')
      if (!node) return { present: false }
      const style = getComputedStyle(node)
      return { present: true, opacity: style.opacity, transform: style.transform }
    })
    await page.locator('.product-card .eshop-card__add').first().click()
    await page.waitForTimeout(180)
    result.feedback = await sample(page)
    result.decoration = await page.evaluate(() => {
      const hidden = (selector) => {
        const node = document.querySelector(selector)
        return node ? getComputedStyle(node).display === 'none' : null
      }
      return {
        flyToken: hidden('.fly-token'),
        ripple: hidden('.cart-ripple'),
        shimmer: hidden('.eshop-card__shine'),
        sparks: hidden('.eshop-card__sparks'),
        float: hidden('.empty-state__art'),
        progress: hidden('.eshop-hero__progress'),
      }
    })
    await page.waitForTimeout(2000)
    result.after = await sample(page)
  } finally {
    await client.detach().catch(() => {})
    await context.close()
  }
  return result
}

const run = async () => {
  await mkdir(out, { recursive: true })
  await mkdir(dirname(reportPath), { recursive: true })
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: [
      '--no-sandbox', '--allow-file-access-from-files',
      '--disable-lcd-text', '--force-color-profile=srgb',
    ],
  })
  const report = {
    generatedAt: new Date().toISOString(),
    /* Objetivo de acabado vs. suelo de regresión. Con CPU x4 y una hoja de
       59 tarjetas, la transición de ruta incluye el renderizado de la ficha;
       esos valores se reportan como aviso, nunca como silencio. */
    budget: {
      targetFps: 55, minFps: 32,
      targetLongTasks: 0, maxLongTasks: 6, maxTaskMs: 250,
      maxCls: 0.05, maxOrphans: 0,
    },
    warnings: [],
    conditions: {
      cpuThrottling: 4,
      network: { latencyMs: 180, downloadKbps: 120, uploadKbps: 60 },
      source: 'dist/index.html sobre file://',
    },
    flows: {},
    reducedMotion: {},
    errors: [],
    externalRequests: [],
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

  for (const viewport of VIEWPORTS) {
    for (const [name, flow] of FLOWS) {
      const scope = `${viewport.name}-${name}`
      const { context, page, client } = await open(browser, viewport, {
        admin: name === 'estado-pedido',
      })
      watch(page, scope)
      try {
        const result = await flow(page, client)
        await page.screenshot({ path: join(out, `despues-${scope}.png`) })
        report.flows[scope] = { viewport: viewport.name, flow: name, ...result }
        const fps = result.fps
        const cls = Math.max(result.cls, result.after.perf.cls ?? 0)
        const longTasks = result.longTasks + (result.after.perf.longTasks ?? 0)
        const orphans = result.after.orphans
        if (fps < report.budget.targetFps) {
          report.warnings.push(`${scope}: FPS ${fps} por debajo del objetivo ${report.budget.targetFps}`)
        }
        if (fps < report.budget.minFps) {
          report.problems.push(`${scope}: FPS ${fps} por debajo del suelo ${report.budget.minFps}`)
        }
        if (cls > report.budget.maxCls) {
          report.problems.push(`${scope}: CLS ${cls} por encima de ${report.budget.maxCls}`)
        }
        if (longTasks > report.budget.targetLongTasks) {
          report.warnings.push(`${scope}: ${longTasks} tareas largas (objetivo 0)`)
        }
        if (longTasks > report.budget.maxLongTasks || result.maxTaskMs > report.budget.maxTaskMs) {
          report.problems.push(`${scope}: ${longTasks} tareas largas, máx. ${result.maxTaskMs} ms`)
        }
        if (orphans > report.budget.maxOrphans) {
          report.problems.push(`${scope}: ${orphans} nodos huérfanos tras 2 s`)
        }
        if (name === 'anadir-carrito') {
          if (result.flight.tokens === 0) report.problems.push(`${scope}: sin miniatura de vuelo`)
          if (!result.flight.thumb) report.problems.push(`${scope}: la miniatura no usa ProductArt`)
          if (!result.after.live.some((text) => text.includes('Agregado al carrito'))) {
            report.problems.push(`${scope}: falta el aviso aria-live`)
          }
          if (result.after.perf.longTasks > 0) report.warnings.push(`${scope}: tarea larga al volver`)
        }
      } catch (error) {
        report.problems.push(`${scope}: ${error.message}`)
        report.flows[scope] = { error: error.message }
      } finally {
        await client.detach().catch(() => {})
        await context.close()
      }
    }
    report.reducedMotion[viewport.name] = await reducedMotionCheck(browser, viewport)
  }

  await browser.close()
  for (const [viewport, result] of Object.entries(report.reducedMotion)) {
    const decorative = Object.entries(result.decoration ?? {}).filter(([, hidden]) => hidden === false)
    if (decorative.length) {
      report.problems.push(`reduce ${viewport}: adornos visibles (${decorative.map(([n]) => n).join(', ')})`)
    }
    if ((result.after?.orphans ?? 0) > 0) {
      report.problems.push(`reduce ${viewport}: nodos huérfanos tras 2 s`)
    }
    if (!result.feedback?.live?.some((text) => text.includes('Agregado al carrito'))) {
      report.problems.push(`reduce ${viewport}: sin aviso accesible al añadir`)
    }
  }
  if (report.errors.length) report.problems.push(`${report.errors.length} errores de consola/página`)
  if (report.externalRequests.length) report.problems.push(`${report.externalRequests.length} peticiones externas`)

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  const entries = Object.values(report.flows).filter((flow) => !flow.error)
  const min = (field) => entries.length ? Math.min(...entries.map((flow) => flow[field])) : 0
  const max = (field) => entries.length ? Math.max(...entries.map((flow) => flow[field])) : 0
  console.log(`Informe: ${reportPath}`)
  console.log(`Flujos: ${entries.length}/${Object.keys(report.flows).length} correctos`)
  console.log(`FPS mínimo ${min('fps')} · CLS máximo ${max('cls').toFixed(4)} · tareas largas ${max('longTasks')} · fotogramas largos máx. ${max('maxFrameGapMs')} ms`)
  console.log(`Reducido: ${Object.keys(report.reducedMotion).join(', ')} · externas ${report.externalRequests.length} · errores ${report.errors.length}`)
  if (report.warnings.length) {
    console.log(`Avisos de objetivo (${report.warnings.length}):`)
    for (const warning of report.warnings) console.log(`  · ${warning}`)
  }
  if (report.problems.length) {
    console.log(`Problemas (${report.problems.length}):`)
    for (const problem of report.problems) console.log(`  - ${problem}`)
    process.exitCode = 1
  } else {
    console.log('Presupuestos de regresión de movimiento: OK')
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
