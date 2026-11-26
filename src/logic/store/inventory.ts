import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { initialMovements, initialProducts } from '../../data/products'
import { AppError } from '../errors'
import { applyMovement, buildVoidMovement } from '../services/stock'
import { migrateProductFacets, reclasificarImportados } from '../services/product-migrate'
import { cleanImportedProducts } from '../services/real-products'
import { KEYS, safeStorage } from '../services/storage'
import { slugify } from '../services/formatters'
import {
  ARQUETIPOS, MOTIVOS, type Arquetipo, type Movement, type MovementInput, type Product,
  type ProductDraft,
} from '../types'

export interface NewMovementInput extends MovementInput { usuario: string }

interface InventoryStore {
  products: Product[]
  movements: Movement[]
  addProduct: (draft: ProductDraft, usuario: string) => Product
  updateProduct: (id: string, patch: Partial<Product>) => void
  archiveProduct: (id: string, archivado: boolean) => void
  deleteProduct: (id: string) => void
  addMovement: (input: NewMovementInput) => void
  voidMovement: (id: string, usuario: string, nota: string) => void
  replaceAll: (products: Product[], movements: Movement[]) => void
}

const newId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const nowIso = (): string => new Date().toISOString()
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback
const asString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const wasFillerId = (id: unknown): boolean =>
  typeof id === 'string' && /^p\d{3}$/.test(id)

const legacyProductId = (v: unknown): string => {
  if (typeof v === 'string') return v
  if (typeof v === 'number' && Number.isInteger(v)) return `p${String(v).padStart(3, '0')}`
  return ''
}

/** Acepta fichas v1/v2/v3 y rellena los campos de tienda. */
const normalizeProduct = (value: unknown): Product | null => {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  const codigo = asString(raw.codigo)
  if (!codigo) return null
  const nombre = asString(raw.nombre, asString(raw.producto, 'Sin nombre'))
  const minimo = asNumber(raw.stockMinimo, 0)
  const precio = typeof raw.precio === 'number' ? raw.precio : null
  return {
    id: asString(raw.id) || legacyProductId(raw.id) || `p-${codigo}`,
    codigo,
    slug: asString(raw.slug) || slugify(nombre),
    nombre,
    categoria: asString(raw.categoria, 'Otras'),
    unidad: (asString(raw.unidad, 'unidad') as Product['unidad']) || 'unidad',
    stock: asNumber(raw.stock, asNumber(raw.cantidad)),
    stockMinimo: minimo,
    stockObjetivo: asNumber(raw.stockObjetivo, minimo * 2),
    ubicacion: asString(raw.ubicacion),
    costo: typeof raw.costo === 'number' ? raw.costo : null,
    publicado: typeof raw.publicado === 'boolean' ? raw.publicado : true,
    arquetipo: ARQUETIPOS.includes(raw.arquetipo as Arquetipo)
      ? raw.arquetipo as Arquetipo : 'paquete',
    precio,
    precioAnterior: typeof raw.precioAnterior === 'number' ? raw.precioAnterior : null,
    descripcionCorta: asString(raw.descripcionCorta),
    descripcion: asString(raw.descripcion),
    especificaciones: Array.isArray(raw.especificaciones)
      ? raw.especificaciones as Product['especificaciones'] : [],
    etiquetas: Array.isArray(raw.etiquetas) ? raw.etiquetas as string[] : [],
    destacado: raw.destacado === true,
    imagenes: Array.isArray(raw.imagenes) ? raw.imagenes as string[] : [],
    proveedor: asString(raw.proveedor),
    notas: asString(raw.notas),
    archivado: raw.archivado === true,
    creadoEn: asString(raw.creadoEn, nowIso()),
    actualizadoEn: asString(raw.actualizadoEn, asString(raw.creadoEn, nowIso())),
  }
}

const normalizeMovement = (value: unknown, products: Product[]): Movement | null => {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  const productoId = legacyProductId(raw.productoId)
  if (!productoId) return null
  const product = products.find((item) => item.id === productoId)
  const tipo = (['Entrada', 'Salida', 'Ajuste'] as const).find((item) => item === raw.tipo)
  if (!tipo) return null
  const cantidad = Math.abs(asNumber(raw.cantidad, 1)) || 1
  const stockDespues = asNumber(raw.stockDespues, product?.stock ?? cantidad)
  const delta = tipo === 'Entrada' ? cantidad : tipo === 'Salida' ? -cantidad : 0
  const motivo = asString(raw.motivo) || (tipo === 'Entrada' ? 'Inventario inicial' : 'Venta')
  return {
    id: asString(raw.id) || newId('mov'),
    fecha: asString(raw.fecha, nowIso()),
    productoId,
    productoNombre: asString(raw.productoNombre, asString(raw.producto, product?.nombre ?? '')),
    tipo, cantidad,
    stockAntes: asNumber(raw.stockAntes, Math.max(0, stockDespues - delta)),
    stockDespues,
    motivo: MOTIVOS.find((item) => item === motivo) ?? 'Inventario inicial',
    referencia: asString(raw.referencia), nota: asString(raw.nota),
    usuario: asString(raw.usuario, 'admin'),
    anulaA: asString(raw.anulaA) || undefined,
    anuladoPor: asString(raw.anuladoPor) || undefined,
  }
}

const migrate = (persisted: unknown, version: number): InventoryStore | undefined => {
  const state = persisted as Partial<InventoryStore> | undefined
  if (!state) return undefined
  if (version >= 5) {
    const products = (state.products ?? []).map((product) => ({
      ...product,
      arquetipo: ARQUETIPOS.includes(product.arquetipo)
        ? product.arquetipo : 'paquete' as Arquetipo,
    }))
    // v6: las fichas antiguas pasan a las 9 categorías y estrenan facetas.
    // v7: se incorporan los productos reales de las APIs sin duplicar los que
    // ya existan.
    // v8: se descartan las fichas de relleno (p001..p060) y sus movimientos.
    // v9: las fichas de las APIs se reubican con las reglas compartidas.
    const movements = (state.movements ?? [])
      .filter((movement) => !wasFillerId((movement as Movement | undefined)?.productoId))
    return {
      ...state,
      products: cleanImportedProducts(reclasificarImportados(migrateProductFacets(products))),
      movements,
    } as InventoryStore
  }
  const products = (state.products ?? []).map(normalizeProduct).filter((p): p is Product => p !== null)
  const movements = (state.movements ?? [])
    .map((m) => normalizeMovement(m, products))
    .filter((m): m is Movement => m !== null)
    .filter((m) => !wasFillerId(m.productoId))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  return {
    ...state,
    products: cleanImportedProducts(reclasificarImportados(
      products.length ? products : initialProducts,
    )),
    movements: movements.length ? movements : initialMovements,
  } as InventoryStore
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      products: cleanImportedProducts(initialProducts),
      movements: initialMovements,

      addProduct: (draft, usuario) => {
        const timestamp = nowIso()
        const product: Product = {
          id: newId('prod'),
          codigo: draft.codigo.trim(),
          slug: slugify(draft.nombre),
          nombre: draft.nombre.trim(),
          categoria: draft.categoria,
          unidad: draft.unidad,
          stock: draft.stockInicial,
          stockMinimo: draft.stockMinimo,
          stockObjetivo: draft.stockObjetivo,
          ubicacion: draft.ubicacion,
          costo: draft.costo,
          publicado: draft.publicado ?? false,
          arquetipo: draft.arquetipo ?? 'paquete',
          precio: draft.precio,
          precioAnterior: null,
          descripcionCorta: '',
          descripcion: '',
          especificaciones: [], etiquetas: [],
          destacado: draft.destacado ?? false, imagenes: draft.imagenes ?? [],
          proveedor: draft.proveedor, notas: draft.notas,
          archivado: false, creadoEn: timestamp, actualizadoEn: timestamp,
        }
        set((state) => ({ products: [...state.products, product] }))
        if (draft.stockInicial > 0) {
          get().addMovement({
            productoId: product.id, tipo: 'Entrada', cantidad: draft.stockInicial,
            motivo: 'Inventario inicial', nota: 'Stock inicial del producto', usuario,
          })
        }
        return product
      },

      updateProduct: (id, patch) => set((state) => ({
        products: state.products.map((product) => {
          if (product.id !== id) return product
          const next = { ...product, ...patch, actualizadoEn: nowIso() }
          return { ...next, slug: patch.nombre ? slugify(patch.nombre) : next.slug }
        }),
      })),

      archiveProduct: (id, archivado) => get().updateProduct(id, { archivado }),

      deleteProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        movements: state.movements.filter((m) => m.productoId !== id),
      })),

      addMovement: (input) => {
        const product = get().products.find((p) => p.id === input.productoId)
        if (!product) throw new AppError('NOT_FOUND', 'No existe la ficha del producto', 'productoId')
        const applied = applyMovement(product, input)
        const movement: Movement = {
          id: newId('mov'), fecha: nowIso(), productoId: product.id,
          productoNombre: product.nombre, tipo: input.tipo, cantidad: Number(input.cantidad),
          stockAntes: applied.stockAntes, stockDespues: applied.stockDespues,
          motivo: input.motivo, referencia: input.referencia?.trim() ?? '',
          nota: input.nota?.trim() ?? '', usuario: input.usuario,
        }
        set((state) => ({
          movements: [movement, ...state.movements],
          products: state.products.map((p) => (p.id === product.id ? applied.product : p)),
        }))
      },

      voidMovement: (id, usuario, nota) => {
        const state = get()
        const original = state.movements.find((m) => m.id === id)
        if (!original) throw new AppError('NOT_FOUND', 'No existe el movimiento')
        const product = state.products.find((p) => p.id === original.productoId)
        if (!product) throw new AppError('NOT_FOUND', 'No existe el producto')
        const reverse = buildVoidMovement(original, product, usuario, nota)
        const applied = applyMovement(product, {
          productoId: product.id, tipo: reverse.tipo, cantidad: reverse.cantidad,
          motivo: 'Anulación', referencia: reverse.referencia, nota,
        })
        const created: Movement = { ...reverse, id: newId('mov'), stockDespues: applied.stockDespues }
        set((current) => ({
          movements: [created, ...current.movements.map((m) =>
            m.id === id ? { ...m, anuladoPor: created.id } : m)],
          products: current.products.map((p) => (p.id === product.id ? applied.product : p)),
        }))
      },

      replaceAll: (products, movements) => set({ products, movements }),
    }),
    {
      name: KEYS.inventory,
      storage: createJSONStorage(() => safeStorage),
      version: 9,
      migrate: (persisted, version) => migrate(persisted, version) ?? ({} as InventoryStore),
      partialize: (state) => ({ products: state.products, movements: state.movements }) as InventoryStore,
    },
  ),
)
