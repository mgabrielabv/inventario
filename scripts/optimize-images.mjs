#!/usr/bin/env node
/**
 * Genera miniaturas WebP embebidas para el HTML único (file://).
 *
 * Las fotos se descargan una sola vez en tiempo de build, se redimensionan en
 * Chrome y se guardan como data URL en src/data/imagenes-locales.json. La app
 * nunca hace fetch de archivos locales: las lee del bundle. Se incluye una
 * versión de 24 px para blur-up con CLS 0.
 *
 * Uso: npm run optimizar:imagenes [-- --limit=48] [-- --edge=320]
 * Requiere Chrome/Edge (CHROME_PATH) y el catálogo ya sembrado.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = join(root, 'src/data/productos-reales.json')
const outputPath = join(root, 'src/data/imagenes-locales.json')
const chrome = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'
if (!existsSync(chrome)) throw new Error(`No se encontró Chrome en ${chrome}; define CHROME_PATH.`)

const arg = (name, fallback) => {
  const found = process.argv.find((value) => value.startsWith(`--${name}=`))
  return found ? Number(found.split('=')[1]) : fallback
}
const limit = Math.max(1, arg('limit', 48))
const edge = Math.max(64, Math.min(640, arg('edge', 320)))
const quality = 0.62
const timeoutMs = 15_000

/** Destacados y una muestra de cada departamento, con orden determinista. */
const seleccionar = (products) => {
  const chosen = new Map()
  const add = (product) => {
    if (product && !chosen.has(product.id) && product.imagenes?.length) chosen.set(product.id, product)
  }
  products.filter((product) => product.destacado).forEach(add)
  const porCategoria = new Map()
  for (const product of products) {
    const total = porCategoria.get(product.categoria) ?? 0
    if (total < 3) {
      add(product)
      porCategoria.set(product.categoria, total + 1)
    }
  }
  products.forEach(add)
  return [...chosen.values()].slice(0, limit)
}

const descargar = async (url) => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      return `data:${response.headers.get('content-type') ?? 'image/jpeg'};base64,${buffer.toString('base64')}`
    } catch (error) {
      if (attempt === 2) throw error
    }
  }
  throw new Error('Descarga fallida')
}

/** Canvas dentro de Chrome: convierte a WebP y devuelve ambas versiones. */
const optimizar = (page, dataUrl) => page.evaluate(async ({ source, maxEdge, q }) => {
  const image = new Image()
  image.src = source
  await image.decode()
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
  const draw = (size) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale * size))
    canvas.height = Math.max(1, Math.round(image.height * scale * size))
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/webp', size === 1 ? q : 0.35)
  }
  return { src: draw(1), blur: draw(24 / maxEdge) }
}, { source: dataUrl, maxEdge: edge, q: quality })

const products = JSON.parse(readFileSync(catalogPath, 'utf8'))
if (!Array.isArray(products)) throw new Error('El catálogo sembrado debe ser un array.')

const elegidos = seleccionar(products)
const browser = await chromium.launch({ executablePath: chrome, headless: true })
const page = await browser.newPage()
const images = {}
let descartadas = 0
try {
  for (let index = 0; index < elegidos.length; index += 1) {
    const product = elegidos[index]
    try {
      const dataUrl = await descargar(product.imagenes[0])
      const versiones = await optimizar(page, dataUrl)
      images[product.id] = versiones
      process.stdout.write(`\r  ${index + 1}/${elegidos.length} ${product.id}`)
    } catch (error) {
      descartadas += 1
      console.warn(`\n  Aviso: ${product.id} descartado (${String(error).slice(0, 80)}).`)
    }
  }
} finally {
  await browser.close()
}

writeFileSync(outputPath, `${JSON.stringify({
  version: 1, edge, quality, images,
}, null, 2)}\n`, 'utf8')
console.log(`\n${Object.keys(images).length} imágenes locales (${descartadas} descartadas).`)
console.log(`JSON: ${(readFileSync(outputPath).byteLength / 1024).toFixed(0)} kB.`)
console.log(`Escrito: ${outputPath}`)
