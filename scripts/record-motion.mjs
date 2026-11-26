#!/usr/bin/env node
/**
 * Grabaciones de evidencia de la ronda 4 (8–12 s, una por flujo).
 * Usa el mismo HTML único que verify:motion y el grabador de vídeo de
 * Playwright, que produce WebM sin dependencias nuevas. Las pausas finales
 * ajustan cada clip a ~10 s para que la comparación sea uniforme.
 *
 * Uso: npm run record:motion   (requiere npm run build primero)
 */
import { chromium } from 'playwright-core'
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'docs', 'capturas', 'ronda4')
const base = pathToFileURL(join(root, 'dist', 'index.html')).href
const chrome = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'

const brandSource = await readFile(join(root, 'src', 'config', 'brand.ts'), 'utf8')
const slug = /slug:\s*'([^']+)'/.exec(brandSource)?.[1] ?? 'tienda'
const key = (suffix) => `${slug}-${suffix}`
const STORE = {
  theme: key('theme'),
  user: key('user'),
  cart: key('cart-v2'),
}

const session = ({ store, admin }) => {
  try {
    localStorage.setItem(store.cart, JSON.stringify({
      state: { lines: [{ productoId: 'dj-1', cantidad: 1, agregadoEn: new Date().toISOString() }] },
      version: 2,
    }))
    if (admin) {
      localStorage.setItem(store.user, JSON.stringify({
        id: 'u-admin', username: 'admin', name: 'Administrador', role: 'Administrador',
      }))
    }
  } catch { /* file:// sin almacenamiento: la app usa memoria */ }
}

const CLIPS = [
  {
    name: 'anadir-carrito', width: 390, height: 844, admin: false,
    run: async (page) => {
      await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
      await page.locator('.product-card .eshop-card__add').first().waitFor()
      await page.waitForTimeout(500)
      // El botón se convierte en stepper: se vuelve a consultar en cada pasada.
      for (let index = 0; index < 3; index += 1) {
        const adds = page.locator('.product-card .eshop-card__add')
        if (await adds.count() === 0) break
        await adds.first().click()
        await page.waitForTimeout(700)
      }
      await page.locator('.eshop-nav__cart, .mobile-nav__cart, .mobile-tabbar__cart').first().click()
      await page.waitForTimeout(600)
    },
  },
  {
    name: 'abrir-ficha', width: 390, height: 844, admin: false,
    run: async (page) => {
      await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
      await page.locator('.eshop-card__title').first().waitFor()
      await page.waitForTimeout(600)
      await page.locator('.eshop-card__title').first().click()
      await page.waitForTimeout(1200)
      await page.locator('.pdp-view').nth(1).click()
      await page.waitForTimeout(700)
      await page.locator('.pdp-page').evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'smooth' }))
      await page.mouse.wheel(0, 520)
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'hoja-filtros', width: 390, height: 844, admin: false,
    run: async (page) => {
      await page.goto(`${base}#/tienda`, { waitUntil: 'load' })
      await page.locator('.eshop-toolbar__filters').waitFor()
      await page.waitForTimeout(600)
      await page.locator('.eshop-toolbar__filters').click()
      await page.waitForTimeout(900)
      await page.locator('.sheet.eshop-filter-sheet input').first().fill('laptop')
      await page.waitForTimeout(900)
      await page.locator('.sheet.eshop-filter-sheet').getByRole('button', { name: 'Cerrar' }).click()
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'confirmar-pedido', width: 390, height: 844, admin: false,
    run: async (page) => {
      await page.goto(`${base}#/pagar`, { waitUntil: 'load' })
      const guest = page.getByRole('button', { name: 'Continuar como invitado' })
      if (await guest.count()) await guest.click()
      await page.locator('[data-field="nombre"]').waitFor({ state: 'visible' })
      await page.locator('[data-field="nombre"]').fill('Ana Pérez')
      await page.locator('[data-field="telefono"]').fill('0414-1234567')
      await page.locator('[data-field="email"]').fill('ana@example.com')
      const next = () => page.locator('.checkout-nav button', { hasText: 'Continuar' }).click()
      await next()
      await page.waitForTimeout(900)
      await next()
      await page.waitForTimeout(900)
      await next()
      await page.waitForTimeout(900)
      await page.locator('[data-field="acepta"]').check()
      await page.getByRole('button', { name: /Confirmar pedido/ }).click()
      await page.locator('.order-celebration').waitFor()
      await page.waitForTimeout(1500)
    },
  },
  {
    name: 'estado-pedido', width: 1280, height: 800, admin: true,
    run: async (page) => {
      await page.goto(`${base}#/admin/pedidos`, { waitUntil: 'load' })
      await page.locator('.admin-order-card').first().waitFor()
      await page.waitForTimeout(700)
      await page.locator('.admin-order-card').first().click()
      await page.waitForTimeout(900)
      const advance = page.locator('.admin-sheet-actions button').first()
      if (await advance.count()) {
        await advance.click()
        await page.waitForTimeout(1200)
        const second = page.locator('.admin-sheet-actions button').first()
        if (await second.count()) await second.click()
      }
      await page.waitForTimeout(900)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(700)
    },
  },
]

const TARGET_MS = 10000
const MIN_MS = 8000
const MAX_MS = 12000

const run = async () => {
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-lcd-text', '--force-color-profile=srgb'],
  })
  const summary = []
  const only = process.env.CLIP
  for (const clip of CLIPS.filter((item) => !only || item.name === only)) {
    const context = await browser.newContext({
      viewport: { width: clip.width, height: clip.height },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      recordVideo: { dir: out, size: { width: clip.width, height: clip.height } },
    })
    await context.addInitScript(session, { store: STORE, admin: clip.admin })
    const page = await context.newPage()
    page.setDefaultTimeout(60000)
    const started = Date.now()
    try {
      await clip.run(page)
      const elapsed = Date.now() - started
      if (elapsed < TARGET_MS) await page.waitForTimeout(TARGET_MS - elapsed)
      const final = Date.now() - started
      await context.close()
      const video = page.video()
      await video.saveAs(join(out, `${clip.name}.webm`))
      await video.delete()
      summary.push({ name: clip.name, seconds: Math.round(final / 100) / 10, ok: final >= MIN_MS && final <= MAX_MS })
    } catch (error) {
      summary.push({ name: clip.name, error: error.message, ok: false })
      await context.close().catch(() => {})
    }
  }
  await browser.close()
  for (const item of summary) {
    console.log(item.ok
      ? `${item.name}.webm · ${item.seconds} s`
      : `${item.name}: ${item.error ?? `duración ${item.seconds} s fuera de 8–12 s`}`)
  }
  if (summary.some((item) => !item.ok)) process.exitCode = 1
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
