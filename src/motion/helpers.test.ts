import { describe, expect, it } from 'vitest'
import { enqueueFlight, isLightDevice, motionSafe, riseFor, staggerDelay, staggerTotal } from './helpers'
import { reduced, stagger } from './tokens'

describe('tokens y helpers de movimiento', () => {
  it('motionSafe elimina movimiento y deja un fundido de 140 ms', () => {
    const safe = motionSafe({
      hidden: { opacity: 0, y: 16, scale: 0.9, rotate: 8 },
      show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8 } },
      exit: { opacity: 0, x: 20 },
    })
    expect(safe.hidden).toEqual({ opacity: 0 })
    expect(safe.show).toMatchObject({ opacity: 1 })
    expect((safe.show as { transition: unknown }).transition).toEqual({
      duration: reduced.duration, ease: expect.any(Array),
    })
    expect(safe.exit).toEqual({ opacity: 0, transition: { duration: reduced.duration, ease: expect.any(Array) } })
  })

  it('el escalonado nunca supera 400 ms', () => {
    expect(staggerDelay(0)).toBe(0)
    expect(staggerDelay(2)).toBe(stagger.tight * 2)
    expect(staggerDelay(30)).toBe(stagger.maxTotal)
    expect(staggerTotal(60)).toBe(stagger.maxTotal)
  })

  it('detecta dispositivos modestos sin depender del navegador', () => {
    expect(isLightDevice({ hardwareConcurrency: 4, deviceMemory: 8 })).toBe(true)
    expect(isLightDevice({ hardwareConcurrency: 8, deviceMemory: 4 })).toBe(true)
    expect(isLightDevice({ hardwareConcurrency: 8, deviceMemory: 8 })).toBe(false)
  })

  it('la cola de vuelos conserva como máximo tres elementos', () => {
    let queue: number[] = []
    for (let i = 0; i < 6; i += 1) queue = enqueueFlight(queue, i, 3)
    expect(queue).toEqual([3, 4, 5])
  })

  it('la subida es menor en móvil', () => {
    expect(riseFor(true)).toBe(12)
    expect(riseFor(false)).toBe(14)
  })
})
