import type { Variants } from 'framer-motion'
import { distance, dur, reduced, stagger } from './tokens'

/** Quita traslaciones, escalas y giros; deja un fundido corto y funcional. */
export const motionSafe = (variants: Variants): Variants => {
  const strip = (state: Record<string, unknown> | undefined) => {
    if (!state) return state
    const { x, y, scale, scaleX, scaleY, rotate, ...rest } = state
    void x; void y; void scale; void scaleX; void scaleY; void rotate
    return rest
  }
  return {
    hidden: (strip(variants.hidden as Record<string, unknown> | undefined) ?? {}),
    show: {
      ...(strip(variants.show as Record<string, unknown> | undefined) ?? {}),
      transition: { duration: reduced.duration, ease: reduced.ease },
    },
    exit: {
      ...(strip(variants.exit as Record<string, unknown> | undefined) ?? {}),
      transition: { duration: reduced.duration, ease: reduced.ease },
    },
  } as Variants
}

/** Escalonado por columna con tope: en dos columnas, el sexto ya no espera. */
export const staggerDelay = (index: number, step: number = stagger.tight): number =>
  Math.min(Math.max(0, index) * step, stagger.maxTotal)

/** Distancia de entrada: 12 px en móvil, 14 px en escritorio. */
export const riseFor = (mobile: boolean): number => mobile ? distance.rise : distance.card

/** Dispositivo modesto: menos parallax, escalonados cortos y sin confeti. */
export const isLightDevice = (hint?: { hardwareConcurrency?: number; deviceMemory?: number }): boolean => {
  const source = hint ?? (typeof navigator === 'undefined' ? {} : navigator as Navigator & { deviceMemory?: number })
  const cores = source.hardwareConcurrency ?? 8
  const memory = source.deviceMemory ?? 8
  return cores <= 4 || memory <= 4
}

/** Cola de vuelos: never más de tres miniaturas simultáneas. */
export const enqueueFlight = <T>(items: T[], item: T, max = 3): T[] =>
  items.length >= max ? [...items.slice(items.length - max + 1), item] : [...items, item]

/** Duración total de un escalonado con tope, para pruebas y documentación. */
export const staggerTotal = (count: number, step: number = stagger.tight): number =>
  count <= 1 ? 0 : staggerDelay(count - 1, step)

export const pulseDuration = dur.micro
