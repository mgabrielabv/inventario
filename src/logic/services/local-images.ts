/* Miniaturas WebP embebidas en el bundle: funcionan con file:// sin fetch.
   Generadas por scripts/optimize-images.mjs a partir de las fotos importadas. */

import local from '../../data/imagenes-locales.json'

export interface LocalImage {
  src: string
  blur: string
}

const images: Record<string, LocalImage> = local.images

/** Foto local optimizada de una ficha, si el pipeline la generó. */
export const localImageFor = (id: string | undefined): LocalImage | undefined =>
  id ? images[id] : undefined
