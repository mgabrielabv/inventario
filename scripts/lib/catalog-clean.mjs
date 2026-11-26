/* Limpieza del catálogo: conserva solo fichas importadas de las dos APIs
   públicas y con al menos una fotografía que responda correctamente. */

import { isHttpUrl, verifyImages } from './image-check.mjs'

const SOURCES = [
  { prefix: 'dj-', nota: 'DummyJSON' },
  { prefix: 'off-', nota: 'Open Food Facts' },
]

export const isImportedProduct = (product) =>
  Boolean(product && typeof product.id === 'string' && typeof product.nombre === 'string')
  && SOURCES.some(({ prefix, nota }) =>
    product.id.startsWith(prefix) && String(product.notas ?? '').includes(nota))

const dedupe = (products) => {
  const byId = new Map()
  const codes = new Set()
  for (const product of products) {
    if (byId.has(product.id) || codes.has(product.codigo)) continue
    byId.set(product.id, product)
    codes.add(product.codigo)
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * @returns {{products: Array, report: object}}
 */
export const cleanProducts = async (products, { concurrency = 12, onProgress } = {}) => {
  const candidatos = dedupe(products.filter(isImportedProduct))
  const eliminadosFiller = products.length - candidatos.length
  const urls = candidatos.flatMap((product) =>
    Array.isArray(product.imagenes) ? product.imagenes : [])
  const estados = await verifyImages(urls, {
    concurrency,
    onProgress: (done, total, url, estado) => {
      if (!estado.ok) console.warn(`  URL inválida (${estado.status || estado.contentType}): ${url}`)
      onProgress?.(done, total)
    },
  })

  const validados = []
  const sinFoto = []
  const fotosDescartadas = []
  for (const product of candidatos) {
    const imagenes = (product.imagenes ?? []).filter((url) => {
      const valida = isHttpUrl(url) && estados.get(url.trim())?.ok === true
      if (!valida) fotosDescartadas.push({ productoId: product.id, url })
      return valida
    })
    if (imagenes.length === 0) {
      sinFoto.push({ id: product.id, codigo: product.codigo, nombre: product.nombre })
    } else {
      validados.push({ ...product, imagenes })
    }
  }

  return {
    products: validados,
    report: {
      entrada: products.length,
      importados: candidatos.length,
      eliminadosNoImportados: eliminadosFiller,
      fotosRevisadas: estados.size,
      fotosDescartadas,
      productosSinFotoValida: sinFoto,
      resultado: validados.length,
      urlsVerificadas: [...estados.keys()],
    },
  }
}
