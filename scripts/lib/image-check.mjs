/* Verificación de fotos remotas sin descargarlas: HEAD (o GET parcial) y
   comprobación de estado y tipo MIME. No se guarda ningún binario. */

const IMAGE_EXTENSION = /\.(webp|jpe?g|png|gif|avif)(?:[?#]|$)/i
const USER_AGENT = 'IvoriaImageVerifier/1.0 (educational demo)'

export const isHttpUrl = (value) =>
  typeof value === 'string' && /^https?:\/\/[^\s]+$/i.test(value.trim())

const mimeLooksLikeImage = (contentType, url) =>
  /^image\//i.test(contentType)
  || (/^application\/(octet-stream|binary)/i.test(contentType) && IMAGE_EXTENSION.test(url))

const probe = async (url, method, timeoutMs) => {
  const response = await fetch(url, {
    method,
    headers: { 'User-Agent': USER_AGENT, Accept: 'image/avif,image/webp,image/*,*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  })
  const contentType = response.headers.get('content-type') ?? ''
  const length = Number(response.headers.get('content-length') ?? 0)
  // Con GET parcial basta la cabecera; cancelamos el cuerpo para no descargar la foto.
  await response.body?.cancel().catch(() => {})
  return {
    ok: (response.ok || response.status === 206)
      && mimeLooksLikeImage(contentType, url)
      && (length === 0 || length > 64),
    status: response.status,
    contentType,
  }
}

/** true solo si la URL responde una imagen válida. 404/410 se descartan al momento. */
export const verifyImageUrl = async (url, { attempts = 3, timeoutMs = 12_000 } = {}) => {
  let last = { status: 0, contentType: '' }
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      let result = await probe(url, 'HEAD', timeoutMs)
      if (result.ok) return { ok: true, ...result }
      if (result.status === 405 || result.status === 501) {
        result = await probe(url, 'GET', timeoutMs)
        if (result.ok) return { ok: true, ...result }
      }
      last = result
      if (result.status === 404 || result.status === 410 || /^text\/html/i.test(result.contentType)) break
    } catch (error) {
      last = { status: 0, contentType: String(error?.name ?? error) }
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt))
    }
  }
  return { ok: false, ...last }
}

/** Ejecuta verificaciones con un número limitado de peticiones concurrentes. */
export const mapWithConcurrency = async (items, limit, worker) => {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

/** Devuelve Map<url, {ok, status, contentType}>. */
export const verifyImages = async (urls, { concurrency = 12, onProgress } = {}) => {
  const unicas = [...new Set(urls.filter(isHttpUrl).map((url) => url.trim()))]
  const estados = await mapWithConcurrency(unicas, concurrency, (url, index) =>
    verifyImageUrl(url).then((estado) => {
      onProgress?.(index + 1, unicas.length, url, estado)
      return estado
    }))
  return new Map(unicas.map((url, index) => [url, estados[index]]))
}
