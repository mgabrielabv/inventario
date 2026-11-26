#!/usr/bin/env node
/**
 * Auditoría móvil de la ronda 2. Recorre todas las superficies en diez
 * viewports (incluido apaisado y tablet), en claro y oscuro, con puntero
 * táctil. Mide desbordes, objetivos táctiles, tipografía de campos, CLS,
 * tareas largas, errores y peticiones externas; guarda capturas de una
 * matriz representativa y escribe docs/verificacion-movil.{json,md}.
 *
 * Uso: npm run audit:mobile   (requiere npm run build primero)
 */
import { chromium } from 'playwright-core'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'docs', 'capturas', 'movil')
const jsonPath = join(root, 'docs', 'verificacion-movil.json')
const mdPath = join(root, 'docs', 'verificacion-movil.md')
const base = pathToFileURL(join(root, 'dist', 'index.html')).href
const chrome = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'

const brandSource = await readFile(join(root, 'src', 'config', 'brand.ts'), 'utf8')
const slug = /slug:\s*'([^']+)'/.exec(brandSource)?.[1] ?? 'tienda'
const key = (suffix) => `${slug}-${suffix}`
const STORE = {
  theme: key('theme'), user: key('user'), cart: key('cart-v2'),
  customerSession: key('customer-session-v1'),
}

const viewports = [
  { name: '320x568', width: 320, height: 568, touch: true, device: 'Teléfono pequeño' },
  { name: '360x740', width: 360, height: 740, touch: true, device: 'Android' },
  { name: '390x844', width: 390, height: 844, touch: true, device: 'iPhone' },
  { name: '412x915', width: 412, height: 915, touch: true, device: 'Android grande' },
  { name: '430x932', width: 430, height: 932, touch: true, device: 'iPhone grande' },
  { name: '844x390', width: 844, height: 390, touch: true, device: 'Apaisado' },
  { name: '768x1024', width: 768, height: 1024, touch: true, device: 'Tablet' },
  { name: '820x1180', width: 820, height: 1180, touch: true, device: 'Tablet grande' },
  { name: '1280x800', width: 1280, height: 800, touch: false, device: 'Escritorio' },
  { name: '1440x900', width: 1440, height: 900, touch: false, device: 'Escritorio grande' },
]

const routes = [
  ['home', '#/'],
  ['catalogo', '#/tienda'],
  ['ficha', '#/tienda/essence-mascara-lash-princess-dj-1'],
  ['carrito', '#/carrito'],
  ['checkout', '#/pagar'],
  ['pedido', '#/pedido/IVO-2026-000001'],
  ['seguimiento', '#/seguimiento'],
  ['cuenta', '#/cuenta'],
  ['login', '#/ingresar'],
  ['admin-inicio', '#/admin'],
  ['admin-inventario', '#/admin/inventario'],
  ['admin-pedidos', '#/admin/pedidos'],
  ['admin-config', '#/admin/configuracion'],
]

// Capturas solo de la matriz representativa; las mediciones cubren todo.
const captureSet = new Set(['320x568', '390x844', '844x390', '768x1024', '1280x800'])
const captureRoutes = new Set(['home', 'catalogo', 'ficha', 'admin-inventario'])

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

/** Se ejecuta dentro del navegador: solo datos serializables, sin closures. */
const measureScript = () => {
  const visible = (el) => {
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }
  const label = (el) => {
    const text = (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 42)
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 2).join('.') : ''
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${text ? ` «${text}»` : ''}`
  }
  const overflowing = []
  const clipped = []
  const smallTargets = []
  const smallFields = []
  const covered = []

  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue
    const rect = el.getBoundingClientRect()
    if (rect.right > window.innerWidth + 1 || rect.left < -1) {
      const style = getComputedStyle(el)
      if (style.position !== 'fixed' && style.overflowX !== 'auto' && style.overflowX !== 'scroll') {
        overflowing.push({ el: label(el), left: Math.round(rect.left), right: Math.round(rect.right) })
      }
    }
    const style = getComputedStyle(el)
    if ((style.overflow === 'hidden' || style.overflowX === 'hidden') && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
      // Solo cuenta texto real del elemento: las capas decorativas (malla,
      // imágenes, marcos de ilustración) recortan a propósito y son aria-hidden.
      const ownText = Array.from(el.childNodes).some(
        (node) => node.nodeType === 3 && node.textContent.trim().length > 0,
      )
      const decorative = el.matches('.mesh, .mesh *, img, picture, svg, [aria-hidden="true"], .eshop-hero__frame, .login-page__visual, .sr-only, .eshop-sr-only')
      const ellipsis = style.textOverflow === 'ellipsis' || el.classList.contains('line-clamp') || el.classList.contains('eshop-card__name')
      if (!ellipsis && ownText && !decorative) clipped.push({ el: label(el), scroll: el.scrollWidth, client: el.clientWidth })
    }
  }

  const fixedAncestor = (node) => {
    while (node && node !== document.body) {
      if (getComputedStyle(node).position === 'fixed') return node
      node = node.parentElement
    }
    return null
  }
  /** Una barra inferior fija tapa el contenido al hacer scroll; eso no es un
      fallo si el control puede centrarse y pulsarse. Solo se informa cuando
      sigue cubierto después de desplazarlo al centro del viewport. */
  const reachable = (el) => {
    // `html` tiene scroll-behavior: smooth; sin `instant` la medición se
    // haría antes de que el desplazamiento termine.
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
    const r = el.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) return false
    const top = document.elementFromPoint(x, y)
    return !top || top === el || el.contains(top) || top.contains(el) || !fixedAncestor(top)
  }

  const selectors = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="switch"], [role="tab"], [tabindex]:not([tabindex="-1"])'
  const coveredCandidates = []
  for (const el of document.querySelectorAll(selectors)) {
    if (!visible(el) || el.closest('[aria-hidden="true"]') || el.closest('.sr-only') || el.classList.contains('sr-only')) continue
    const rect = el.getBoundingClientRect()
    // Los enlaces de texto en una frase (display inline) están exentos del
    // objetivo de 44 px según WCAG 2.5.8; los controles sí deben cumplirlo.
    const inline = el.tagName === 'A' && (
      el.closest('p') || el.closest('li') || el.closest('.t-body')
      || getComputedStyle(el).display === 'inline'
    )
    const w = Math.round(rect.width)
    const h = Math.round(rect.height)
    if (!inline && (w < 44 || h < 44)) {
      smallTargets.push({ el: label(el), w, h })
    }
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
      const size = parseFloat(getComputedStyle(el).fontSize)
      if (size < 16) smallFields.push({ el: label(el), px: size })
    }
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    if (!inline && rect.width >= 8 && rect.height >= 8
      && cx >= 0 && cx <= window.innerWidth && cy >= 0 && cy <= window.innerHeight) {
      const top = document.elementFromPoint(cx, cy)
      if (top && top !== el && !el.contains(top) && !top.contains(el) && fixedAncestor(top)) {
        coveredCandidates.push(el)
      }
    }
  }
  for (const el of coveredCandidates) {
    if (reachable(el)) continue
    const r = el.getBoundingClientRect()
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    covered.push({ el: label(el), by: top ? label(top) : 'fuera del viewport' })
  }
  if (coveredCandidates.length) window.scrollTo({ top: 0, behavior: 'instant' })
  return {
    overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    overflowing: overflowing.slice(0, 6),
    clipped: clipped.slice(0, 6),
    smallTargets: smallTargets.slice(0, 8),
    smallFields: smallFields.slice(0, 8),
    covered: covered.slice(0, 6),
  }
}

const staticAudit = async () => {
  const styles = await readFile(join(root, 'src', 'styles', 'tokens.css'), 'utf8')
  const { readdir } = await import('node:fs/promises')
  const files = (await readdir(join(root, 'src', 'styles'))).filter((name) => name.endsWith('.css'))
  const contents = Object.fromEntries(await Promise.all(files.map(async (name) => [
    name, await readFile(join(root, 'src', 'styles', name), 'utf8'),
  ])))
  const breakpoints = new Set()
  let vh = 0
  let safeArea = 0
  let hoverGuarded = 0
  let hoverTotal = 0
  for (const [name, css] of Object.entries(contents)) {
    for (const match of css.matchAll(/@media[^{]*?(?:max|min)-width:\s*(\d+)px/g)) breakpoints.add(Number(match[1]))
    vh += (css.match(/(?<![\d.])100vh/g) ?? []).length
    safeArea += (css.match(/env\(safe-area-inset-/g) ?? []).length
    const hovers = css.match(/:hover/g) ?? []
    hoverTotal += hovers.length
    if (css.includes('@media (hover: hover)')) hoverGuarded += hovers.length
  }
  return {
    breakpoints: [...breakpoints].sort((a, b) => a - b),
    vh100: vh,
    safeAreaUses: safeArea,
    hoverRules: hoverTotal,
    hoverRulesGuarded: hoverGuarded,
    fsUi: /--fs-ui:\s*(\d+)px/.exec(styles)?.[1] ?? null,
    colorLiteralsOutsideTokens: 'ver check:palette',
  }
}

const markdown = (report) => {
  const lines = [
    '# Verificación móvil — Ivoria (ronda 2, Fase 2)',
    '',
    `Generado: ${report.generatedAt}. Se recorrieron ${viewports.length} viewports × 2 temas × ${routes.length} rutas sobre el HTML único con \`file://\` y Chrome sin cabecera, con \`hasTouch: true\` en teléfono/tablet y puntero fino en escritorio.`,
    '',
    '## Resumen por viewport',
    '',
    '| Viewport | Dispositivo | Claro | Oscuro | Desborde máx. | Objetivos <44 px | Campos <16 px | CLS máx. |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: |',
  ]
  for (const vp of viewports) {
    const cell = (theme) => {
      const rows = routes.map(([name]) => report.routes[`${vp.name}|${theme}|${name}`]).filter(Boolean)
      const bad = rows.filter((r) => r.overflowPx > 0 || r.smallTargets.length || r.smallFields.length || r.covered.length)
      return bad.length === 0 ? 'OK' : `${bad.length}/${rows.length} rutas con hallazgos`
    }
    const rows = ['light', 'dark'].flatMap((theme) => routes.map(([name]) => report.routes[`${vp.name}|${theme}|${name}`]).filter(Boolean))
    const maxOverflow = Math.max(0, ...rows.map((r) => r.overflowPx))
    const small = rows.reduce((sum, r) => sum + r.smallTargets.length, 0)
    const fields = rows.reduce((sum, r) => sum + r.smallFields.length, 0)
    const cls = Math.max(0, ...rows.map((r) => r.cls ?? 0))
    lines.push(`| ${vp.name} | ${vp.device} | ${cell('light')} | ${cell('dark')} | ${maxOverflow} px | ${small} | ${fields} | ${cls.toFixed(4)} |`)
  }
  lines.push('', '## Hallazgos confirmados', '')
  if (report.findings.length === 0) lines.push('Ninguno.')
  else {
    lines.push('| ID | Archivo / selector | Problema | Viewports | Severidad | Estado |', '| --- | --- | --- | --- | --- | --- |')
    for (const f of report.findings) lines.push(`| ${f.id} | ${f.file} | ${f.problem} | ${f.viewports} | ${f.severity} | ${f.status} |`)
  }
  lines.push('', '## Análisis estático de CSS', '', '```json', JSON.stringify(report.staticAudit, null, 2), '```', '')
  lines.push('## Errores, peticiones externas y problemas', '')
  lines.push(`- Errores de consola/página: **${report.errors.length}**`)
  lines.push(`- Peticiones externas: **${report.externalRequests.length}**`)
  lines.push(`- Problemas que hicieron fallar la auditoría: **${report.problems.length}**`)
  if (report.problems.length) lines.push(...report.problems.map((p) => `- ${p}`))
  lines.push('', 'Las capturas de la matriz representativa están en `docs/capturas/movil/`. El detalle por ruta y tema está en `docs/verificacion-movil.json`.', '')
  return lines.join('\n')
}

const run = async () => {
  await mkdir(out, { recursive: true })
  await mkdir(dirname(jsonPath), { recursive: true })
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-lcd-text', '--force-color-profile=srgb'],
  })
  const report = {
    generatedAt: new Date().toISOString(),
    viewports,
    routes: {},
    findings: [],
    staticAudit: await staticAudit(),
    errors: [], externalRequests: [], problems: [],
  }

  const inject = ({ store, theme }) => {
    try {
      localStorage.setItem(store.theme, theme)
      localStorage.setItem(store.user, JSON.stringify({
        id: 'u-admin', username: 'admin', name: 'Administrador', role: 'Administrador',
      }))
      localStorage.setItem(store.customerSession, JSON.stringify({
        state: { accountId: 'c-demo-cliente', remember: true, guestCheckout: false }, version: 1,
      }))
      localStorage.setItem(store.cart, JSON.stringify({
        state: { lines: [{ productoId: 'dj-1', cantidad: 1, agregadoEn: new Date().toISOString() }] }, version: 2,
      }))
    } catch { /* file:// sin almacenamiento: la app usa memoria */ }
  }

  for (const vp of viewports) {
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
      await context.addInitScript(inject, { store: STORE, theme })
      const page = await context.newPage()
      const scope = `${vp.name}|${theme}`
      page.on('pageerror', (error) => report.errors.push(`${scope}: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() === 'error') report.errors.push(`${scope}: ${message.text()}`)
      })
      page.on('request', (request) => {
        const url = request.url()
        if (!/^(?:file|data|blob|about):/.test(url)) report.externalRequests.push(`${scope}: ${url}`)
      })
      for (const [name, hash] of routes) {
        await page.goto(`${base}${hash}`, { waitUntil: 'load' })
        await page.waitForTimeout(320)
        await page.evaluate(() => { window.__perf = { cls: 0, longTasks: 0, maxTask: 0 } })
        await page.waitForTimeout(120)
        const measured = await page.evaluate(measureScript)
        const perf = await page.evaluate(() => window.__perf)
        report.routes[`${scope}|${name}`] = { ...measured, cls: perf.cls, longTasks: perf.longTasks, maxTask: perf.maxTask }
        if (captureSet.has(vp.name) && captureRoutes.has(name)) {
          await page.screenshot({ path: join(out, `${vp.name}-${theme}-${name}.png`) })
        }
      }
      await context.close()
    }
    process.stdout.write(`audit: ${vp.name} OK\n`)
  }
  await browser.close()

  // Agregación de hallazgos por familia, con evidencia concrete de las rutas.
  const families = [
    { id: 'M1', test: (r) => r.overflowPx > 0, file: 'varios', problem: 'Desborde horizontal', severity: 'alta' },
    { id: 'M2', test: (r) => r.smallTargets.length > 0, file: 'interactivos compartidos', problem: 'Objetivos táctiles < 44 px', severity: 'alta' },
    { id: 'M3', test: (r) => r.smallFields.length > 0, file: 'inputs/selects', problem: 'Campos con tipografía < 16 px (zoom iOS)', severity: 'alta' },
    { id: 'M4', test: (r) => r.covered.length > 0, file: 'barras fijas / hojas', problem: 'Contenido tapado por elemento fijo', severity: 'media' },
    { id: 'M5', test: (r) => r.clipped.length > 0, file: 'textos y tablas', problem: 'Texto cortado sin elipsis', severity: 'media' },
    { id: 'M6', test: (r) => (r.cls ?? 0) > 0.05, file: 'layout', problem: 'CLS > 0,05', severity: 'alta' },
  ]
  for (const family of families) {
    const matches = Object.entries(report.routes).filter(([, r]) => family.test(r))
    if (matches.length === 0) continue
    const sizes = [...new Set(matches.map(([name]) => name.split('|')[0]))]
    const samples = matches.slice(0, 3).map(([name, r]) => {
      const detail = r.smallTargets[0] ?? r.smallFields[0] ?? r.covered[0] ?? r.overflowing[0] ?? r.clipped[0]
      return `${name}${detail ? ` (${detail.el ?? ''})` : ''}`
    })
    report.findings.push({
      id: family.id, file: family.file, problem: family.problem,
      viewports: sizes.join(', '), severity: family.severity,
      status: `Confirmado en ${matches.length} combinaciones: ${samples.join('; ')}`,
    })
  }

  if (report.errors.length) report.problems.push(`${report.errors.length} errores de consola/página`)
  if (report.externalRequests.length) report.problems.push(`${report.externalRequests.length} peticiones externas`)
  for (const family of ['M1', 'M2', 'M3', 'M4', 'M6']) {
    if (report.findings.some((f) => f.id === family)) report.problems.push(`Hallazgo ${family} sin corregir`)
  }

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`)
  await writeFile(mdPath, markdown(report))
  console.log(`Auditoría móvil: ${Object.keys(report.routes).length} mediciones, ${report.findings.length} familias de hallazgos`)
  console.log(`Informe: ${mdPath}`)
  console.log(`Problemas: ${report.problems.length}`)
  if (report.problems.length) process.exitCode = 1
}

run().catch((error) => { console.error(error); process.exitCode = 1 })
