import { describe, expect, it } from 'vitest'
import { tierFor } from './usePerformanceTier'

describe('niveles del fondo vivo', () => {
  it('apaga el movimiento decorativo con prefers-reduced-motion', () => {
    expect(tierFor({ reducedMotion: true, cores: 16, memory: 16 })).toBe('static')
  })

  it('reduce detalle en equipos modestos y pantallas táctiles', () => {
    expect(tierFor({ cores: 4, memory: 16 })).toBe('lite')
    expect(tierFor({ cores: 16, memory: 4 })).toBe('lite')
    expect(tierFor({ cores: 16, memory: 16, coarse: true })).toBe('lite')
  })

  it('usa el nivel completo solo cuando hay señales de capacidad', () => {
    expect(tierFor({ cores: 16, memory: 16 })).toBe('full')
    expect(tierFor()).toBe('full')
  })
})
