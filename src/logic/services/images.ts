/* Fotos de producto: se redimensionan en el navegador y viven en IndexedDB.
   La base histórica se copia una sola vez a la clave derivada de BRAND.slug. */

import { storageKey } from '../../config/brand'
import { LEGACY_IMAGE_DB, LEGACY_SLUGS } from '../../config/legacy'

/** Las fotos importadas son URLs; las subidas desde el panel son ids de IndexedDB. */
export const isRemoteImage = (value: string | undefined): value is string =>
  typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim())

const DB_NAME = storageKey('imagenes')
const STORE = 'fotos'
const MAX_EDGE = 1200
const MAX_BYTES = 250_000

const openNamedDb = (name: string): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(name, 1)
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE)) {
      request.result.createObjectStore(STORE)
    }
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const openDb = (): Promise<IDBDatabase> => openNamedDb(DB_NAME)

let migration: Promise<void> | null = null

/** Copia una base antigua a la actual y la retira solo si tenía datos. */
const copyLegacyDb = async (name: string): Promise<void> => {
  const oldDb = await openNamedDb(name)
  const entries = await new Promise<Array<[IDBValidKey, Blob]>>((resolve, reject) => {
    const request = oldDb.transaction(STORE, 'readonly').objectStore(STORE).openCursor()
    const found: Array<[IDBValidKey, Blob]> = []
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) { found.push([cursor.key, cursor.value as Blob]); cursor.continue() }
      else resolve(found)
    }
    request.onerror = () => reject(request.error)
  })
  oldDb.close()
  if (entries.length === 0) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    const store = transaction.objectStore(STORE)
    for (const [key, value] of entries) store.put(value, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
  indexedDB.deleteDatabase(name)
}

const migrateImages = (): Promise<void> => {
  migration ??= (async () => {
    const names = new Set([
      LEGACY_IMAGE_DB,
      ...LEGACY_SLUGS.map((slug) => `${slug}-imagenes`),
    ])
    for (const name of names) {
      if (name === DB_NAME) continue
      try { await copyLegacyDb(name) } catch { /* Sin base histórica: seguimos. */ }
    }
  })()
  return migration
}

const tx = async <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  await migrateImages()
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = run(transaction.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}

const loadImage = (file: Blob): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')) }
  image.src = url
})

/** WebP <= 1200 px y <= 250 KB, bajando la calidad si hace falta. */
export const resizeImage = async (file: File): Promise<Blob> => {
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  let quality = 0.82
  let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  while (blob && blob.size > MAX_BYTES && quality > 0.4) {
    quality -= 0.1
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  }
  if (!blob) throw new Error('No se pudo convertir la imagen')
  return blob
}

export const saveImage = async (file: File): Promise<string> => {
  const blob = await resizeImage(file)
  const id = `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  await tx('readwrite', (store) => store.put(blob, id))
  return id
}

export const getImage = async (id: string): Promise<string | null> => {
  const blob = await tx<Blob | undefined>('readonly', (store) => store.get(id))
  if (!blob) return null
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(blob)
  })
}

export const deleteImage = async (id: string): Promise<void> => {
  await tx('readwrite', (store) => store.delete(id))
}

/* --- Respaldo de fotos -----------------------------------------------------
   Solo se exportan las fotos subidas desde el panel: las importadas ya son
   URLs y viajan dentro de `product.imagenes`. El límite evita que un respaldo
   manipulado llene IndexedDB con blobs desproporcionados. */

const MAX_BACKUP_BYTES = 1_000_000
const DATA_URL = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/i

const txBatch = async (mode: IDBTransactionMode, run: (store: IDBObjectStore) => void): Promise<void> => {
  await migrateImages()
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    run(transaction.objectStore(STORE))
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error) }
  })
}

export const dataUrlToBlob = (value: string): Blob => {
  const match = DATA_URL.exec(value.trim())
  if (!match) throw new Error('La foto del respaldo no es una imagen válida')
  const binary = atob(match[2]!)
  if (binary.length > MAX_BACKUP_BYTES) throw new Error('La foto del respaldo es demasiado grande')
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new Blob([bytes], { type: `image/${match[1]!.toLowerCase()}` })
}

/** Data URLs de las fotos que pidan las fichas y los comprobantes. */
export const getImages = async (ids: string[]): Promise<Record<string, string>> => {
  const fotos: Record<string, string> = {}
  for (const id of [...new Set(ids)].filter(Boolean)) {
    const data = await getImage(id)
    if (data) fotos[id] = data
  }
  return fotos
}

/** Restaura las fotos con sus ids originales y devuelve cuántas se guardaron. */
export const restoreImages = async (fotos: Record<string, string>): Promise<number> => {
  const entries = Object.entries(fotos)
  if (entries.length === 0) return 0
  const blobs = entries.map(([id, data]) => [id, dataUrlToBlob(data)] as [string, Blob])
  await txBatch('readwrite', (store) => {
    for (const [id, blob] of blobs) store.put(blob, id)
  })
  return entries.length
}

export const deleteImages = async (ids: string[]): Promise<void> => {
  const unicas = [...new Set(ids)].filter(Boolean)
  if (unicas.length === 0) return
  await txBatch('readwrite', (store) => {
    for (const id of unicas) store.delete(id)
  })
}
