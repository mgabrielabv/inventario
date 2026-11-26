/**
 * Carga masiva de productos reales desde APIs públicas.
 *
 * Fuentes:
 *  - DummyJSON: https://dummyjson.com/products?limit=0
 *  - Open Food Facts: https://world.openfoodfacts.org/api/v2/search
 *
 * El resultado se guarda en src/data/productos-reales.json con el esquema
 * exacto de `Product` (src/logic/types/index.ts). Solo se guardan URLs de
 * imágenes: no se descarga ni se escribe ningún archivo binario.
 *
 * Uso: npm run seed:productos [-- --dry-run] [-- --force]
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { cleanProducts } from './lib/catalog-clean.mjs'
import { clasificarImportado } from './lib/category-rules.mjs'

const ROOT = new URL('../', import.meta.url)
const OUTPUT = new URL('src/data/productos-reales.json', ROOT)
const DUMMY_URL = 'https://dummyjson.com/products?limit=0'
const OFF_FIELDS = 'code,product_name,brands,categories,image_front_url,ingredients_text'
const OFF_URL = (page) =>
  `https://world.openfoodfacts.org/api/v2/search?page=${page}&page_size=100&fields=${OFF_FIELDS}`
const USER_AGENT = 'IvoriaInventorySeeder/1.0 (educational demo; contact: local)'
const LOCATIONS = [
  'A-01', 'A-02', 'A-03', 'A-04', 'A-05',
  'B-01', 'B-02', 'B-03', 'C-01', 'C-02',
]
const CREATED_AT = '2026-01-01T00:00:00.000Z'

/* Departamentos de la tienda (DEFAULT_CATEGORIES), sin añadir taxonomía nueva. */
const CATEGORY_MAP = {
  'beauty': ['Cuidado personal', 'Maquillaje'],
  'skin-care': ['Cuidado personal', 'Cuidado de la piel'],
  'fragrances': ['Cuidado personal', 'Fragancias'],
  'furniture': ['Hogar y cocina', 'Muebles'],
  'home-decoration': ['Hogar y cocina', 'Decoración'],
  'kitchen-accessories': ['Hogar y cocina', 'Utensilios de cocina'],
  'groceries': ['Hogar y cocina', 'Despensa'],
  'laptops': ['Tecnología', 'Computación'],
  'tablets': ['Tecnología', 'Computación'],
  'smartphones': ['Tecnología', 'Telefonía'],
  'mobile-accessories': ['Accesorios', 'Accesorios móviles'],
  'electronics': ['Tecnología', 'Electrónica'],
  'mens-shirts': ['Accesorios', 'Ropa de hombre'],
  'mens-shoes': ['Accesorios', 'Calzado de hombre'],
  'mens-watches': ['Accesorios', 'Relojes'],
  'tops': ['Accesorios', 'Ropa de mujer'],
  'womens-dresses': ['Accesorios', 'Ropa de mujer'],
  'womens-shoes': ['Accesorios', 'Calzado de mujer'],
  'womens-watches': ['Accesorios', 'Relojes'],
  'womens-bags': ['Accesorios', 'Bolsos'],
  'womens-jewellery': ['Accesorios', 'Joyería'],
  'sunglasses': ['Accesorios', 'Gafas de sol'],
  'sports-accessories': ['Deportes y aire libre', 'Accesorios deportivos'],
  'motorcycle': ['Deportes y aire libre', 'Motociclismo'],
  'vehicle': ['Accesorios', 'Automoción'],
}

const ARCHETYPE_MAP = {
  'Tecnología': 'laptop',
  'Accesorios': 'reloj',
  'Hogar y cocina': 'taza',
  'Papelería y oficina': 'cuaderno',
  'Juguetes y juegos': 'paquete',
  'Deportes y aire libre': 'ventilador',
  'Cuidado personal': 'paquete',
  'Mascotas': 'paquete',
  'Ferretería básica': 'cable',
}

const isUrl = (value) =>
  typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim())

const round = (value, decimals = 2) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

const slugify = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 64) || 'producto'

/** PRNG determinista: el mismo producto obtiene siempre el mismo precio. */
const hash = (text) => {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const randomFor = (seed) => {
  let state = hash(seed)
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Clasifica alimentos por palabras clave y calcula un precio de supermercado. */
const groceryPrice = (categories, random) => {
  const text = categories.toLowerCase()
  let min = 1.2
  let max = 8.5
  if (/water|beverage|juice|soda|tea|coffee/.test(text)) { min = 0.8; max = 3.5 }
  if (/cheese|yogurt|milk|cream|butter|egg/.test(text)) { min = 2; max = 7 }
  if (/chocolate|biscuit|candy|snack|cake|cookie/.test(text)) { min = 1.5; max = 5.5 }
  if (/oil|rice|pasta|flour|sauce|cereal/.test(text)) { min = 1.8; max = 6.5 }
  return round(min + random() * (max - min))
}

const common = ({ id, codigo, nombre, categoria, subcategoria, marca, unidad, stock, precio,
  precioAnterior, imagenes, descripcionCorta, descripcion, especificaciones, etiquetas,
  proveedor, notas, index }) => {
  const destino = clasificarImportado({ nombre, categoria, subcategoria, etiquetas, especificaciones })
    ?? { categoria, subcategoria, arquetipo: ARCHETYPE_MAP[categoria] ?? 'paquete' }
  return {
    id,
    codigo,
    slug: `${slugify(nombre)}-${id}`,
    nombre,
    categoria: destino.categoria,
    subcategoria: destino.subcategoria,
    marca,
    unidad,
    stock,
    stockMinimo: 5,
    stockObjetivo: Math.max(30, stock * 2),
    ubicacion: LOCATIONS[index % LOCATIONS.length],
    costo: round(precio * 0.62),
    publicado: true,
    arquetipo: destino.arquetipo,
    precio,
    precioAnterior,
    descripcionCorta,
    descripcion,
    especificaciones,
    etiquetas,
    destacado: index % 37 === 0,
    imagenes,
    proveedor,
    notas,
    archivado: false,
    creadoEn: CREATED_AT,
    actualizadoEn: CREATED_AT,
  }
}

/** DummyJSON -> Product. */
const fromDummy = (item, index) => {
  const [categoria, subcategoria] = CATEGORY_MAP[item.category] ?? ['Accesorios', 'Varios']
  const precio = round(item.price)
  const descuento = Number(item.discountPercentage) || 0
  const images = (item.images ?? [])
    .filter(isUrl)
    .slice(0, 3)
    .map((url) => url.trim())
  // La API incluye un thumbnail; se usa como respaldo si no hay imágenes grandes.
  if (images.length === 0 && isUrl(item.thumbnail)) images.push(item.thumbnail.trim())
  const descripcion = String(item.description ?? '').trim() || `${item.title} — ${subcategoria}.`
  return common({
    id: `dj-${item.id}`,
    codigo: String(item.sku ?? `DJ-${item.id}`),
    nombre: String(item.title ?? '').trim(),
    categoria,
    subcategoria,
    marca: String(item.brand ?? '').trim() || subcategoria,
    unidad: 'unidad',
    stock: Math.max(0, Number(item.stock) || 0),
    precio,
    precioAnterior: descuento > 0 ? round(precio / (1 - descuento / 100)) : null,
    imagenes: images,
    descripcionCorta: descripcion.slice(0, 140),
    descripcion,
    especificaciones: [
      { clave: 'Marca', valor: String(item.brand ?? 'No especificada') },
      { clave: 'Categoría original', valor: String(item.category ?? '') },
      { clave: 'SKU', valor: String(item.sku ?? '') },
      ...(item.weight ? [{ clave: 'Peso', valor: `${item.weight} g` }] : []),
      ...(item.warrantyInformation ? [{ clave: 'Garantía', valor: String(item.warrantyInformation) }] : []),
    ],
    etiquetas: [...(Array.isArray(item.tags) ? item.tags : []), 'DummyJSON'],
    proveedor: String(item.brand ?? 'DummyJSON') || 'DummyJSON',
    notas: 'Producto real importado de DummyJSON.',
    index,
  })
}

/** Open Food Facts -> Product. */
const fromOpenFoodFacts = (item, index, random) => {
  const categorias = String(item.categories ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const precio = groceryPrice(categorias.join(','), random)
  const imagen = String(item.image_front_url ?? '').trim()
  const ingredientes = String(item.ingredients_text ?? '').trim()
  const nombre = String(item.product_name ?? '').trim()
  const descripcion = [ingredientes ? `Ingredientes: ${ingredientes}` : '', categorias.join(' · ')]
    .filter(Boolean)
    .join('\n') || `${nombre} — producto de supermercado.`
  return common({
    id: `off-${item.code}`,
    codigo: `OFF-${item.code}`,
    nombre,
    categoria: 'Hogar y cocina',
    subcategoria: 'Supermercado',
    marca: String(item.brands ?? '').split(',')[0].trim() || 'Sin marca',
    unidad: 'paquete',
    stock: 8 + Math.floor(random() * 73),
    precio,
    precioAnterior: null,
    imagenes: [imagen],
    descripcionCorta: descripcion.replace(/\s+/g, ' ').slice(0, 140),
    descripcion,
    especificaciones: [
      { clave: 'Marca', valor: String(item.brands ?? 'No especificada') },
      { clave: 'Categorías', valor: categorias.slice(0, 4).join(', ') || 'Sin categoría' },
      ...(ingredientes ? [{ clave: 'Ingredientes', valor: ingredientes.slice(0, 400) }] : []),
      { clave: 'Código de barras', valor: String(item.code ?? '') },
    ],
    etiquetas: ['supermercado', ...categorias.slice(0, 3).map((c) => c.toLowerCase())],
    proveedor: String(item.brands ?? 'Open Food Facts').split(',')[0].trim() || 'Open Food Facts',
    notas: 'Producto real importado de Open Food Facts; precio estimado.',
    index,
  })
}

/** GET con reintentos: el servicio de OFF devuelve 503 de forma intermitente. */
const fetchJson = async (url, attempts = 5) => {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      })
      if (response.ok) return await response.json()
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = String(error)
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
    }
  }
  throw new Error(`${url} -> ${lastError}`)
}

const dedupe = (products) => {
  const byId = new Map()
  const byCode = new Set()
  for (const product of products) {
    if (!product.nombre || product.imagenes.length === 0) continue
    if (byId.has(product.id) || byCode.has(product.codigo)) continue
    byId.set(product.id, product)
    byCode.add(product.codigo)
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
}

const main = async () => {
  const args = new Set(process.argv.slice(2))
  const dryRun = args.has('--dry-run')
  const force = args.has('--force')
  const previous = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, 'utf8')) : []
  if (!Array.isArray(previous)) throw new Error('El JSON de destino no es un array de productos.')

  console.log('Descargando DummyJSON…')
  const dummy = await fetchJson(DUMMY_URL)
  const dummyProducts = (dummy.products ?? []).map(fromDummy)
  console.log(`  ${dummyProducts.length} productos`)

  const offProducts = []
  for (let page = 1; page <= 3; page++) {
    console.log(`Descargando Open Food Facts (página ${page}/3)…`)
    try {
      const data = await fetchJson(OFF_URL(page))
      const valid = (data.products ?? []).filter(
        (item) => String(item.code ?? '').trim()
          && String(item.product_name ?? '').trim()
          && isUrl(item.image_front_url),
      )
      valid.forEach((item, i) => {
        offProducts.push(fromOpenFoodFacts(item, offProducts.length + i + page, randomFor(`off-${item.code}`)))
      })
      console.log(`  ${valid.length} productos válidos`)
    } catch (error) {
      console.warn(`  Aviso: ${error.message}; se conservarán los productos ya sembrados de esa página.`)
    }
  }

  const fusionados = dedupe([...dummyProducts, ...offProducts, ...previous])
  console.log('\nVerificando que todas las fotos respondan como imágenes…')
  const { products: output, report } = await cleanProducts(fusionados, {
    onProgress: (done, total) => {
      if (done % 200 === 0 || done === total) console.log(`  ${done}/${total} URLs verificadas`)
    },
  })
  if (output.length < 100 && previous.length > 0 && !force) {
    throw new Error('La descarga dio demasiados pocos productos; no se sobrescribió el JSON existente.')
  }

  const json = `${JSON.stringify(output, null, 2)}\n`
  const fromDummyCount = output.filter((p) => p.id.startsWith('dj-')).length
  const fromOffCount = output.filter((p) => p.id.startsWith('off-')).length
  console.log(`\nTotal: ${output.length} productos (${fromDummyCount} DummyJSON + ${fromOffCount} Open Food Facts).`)
  console.log(`Imágenes guardadas como URLs: ${output.reduce((sum, p) => sum + p.imagenes.length, 0)}.`)
  console.log(`Descartados: ${report.eliminadosNoImportados} no importados, ${report.productosSinFotoValida.length} sin foto válida, ${report.fotosDescartadas.length} URLs rotas.`)

  if (dryRun) {
    console.log('Modo --dry-run: no se escribió el archivo.')
  } else {
    writeFileSync(OUTPUT, json, 'utf8')
    console.log(`Escrito: ${OUTPUT.pathname}`)
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`)
  process.exitCode = 1
})
