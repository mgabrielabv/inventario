import { describe, expect, it } from 'vitest'
import local from '../../data/imagenes-locales.json'
import { localImageFor } from './local-images'

describe('miniaturas locales embebidas', () => {
  it('incluye una muestra representativa con blur-up', () => {
    const ids = Object.keys(local.images)
    expect(ids.length).toBeGreaterThanOrEqual(24)
    for (const id of ids.slice(0, 5)) {
      const image = localImageFor(id)!
      expect(image.src.startsWith('data:image/webp;base64,')).toBe(true)
      expect(image.blur.startsWith('data:image/webp;base64,')).toBe(true)
      expect(image.blur.length).toBeLessThan(image.src.length)
    }
  })

  it('no inventa fotos para fichas sin miniatura', () => {
    expect(localImageFor('no-existe')).toBeUndefined()
    expect(localImageFor(undefined)).toBeUndefined()
  })
})
