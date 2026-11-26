import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { isLightDevice } from '../helpers'
import { livingMotion, meshMotion } from '../tokens'

export type PerformanceTier = 'full' | 'lite' | 'static'

interface TierHint {
  reducedMotion?: boolean | null
  cores?: number
  memory?: number
  coarse?: boolean
}

/** Decisión pura para poder probarla sin navegador. */
export const tierFor = (hint: TierHint = {}): PerformanceTier => {
  if (hint.reducedMotion) return 'static'
  if (hint.coarse || isLightDevice({ hardwareConcurrency: hint.cores, deviceMemory: hint.memory })) {
    return 'lite'
  }
  return 'full'
}

/**
 * Elige el nivel de detalle del fondo vivo y lo rebaja si el muestreo inicial
 * no alcanza el suelo de fluidez. El muestreo se suspende mientras se desplaza
 * la página para no cambiar la composición justo durante el scroll.
 */
export const usePerformanceTier = (): PerformanceTier => {
  const reducedMotion = useReducedMotion()
  const [sampledTier, setSampledTier] = useState<PerformanceTier>(() => {
    if (typeof window === 'undefined') return 'full'
    return tierFor({
      reducedMotion,
      coarse: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    })
  })
  const tier: PerformanceTier = reducedMotion ? 'static' : sampledTier

  useEffect(() => {
    if (tier === 'static' || typeof window === 'undefined') return
    let frames = 0
    let start = 0
    let raf = 0
    let lastScroll = -meshMotion.resumeDelay
    const onScroll = () => {
      lastScroll = window.performance.now()
      frames = 0
      start = 0
    }
    const sample = (now: number) => {
      if (now - lastScroll < meshMotion.resumeDelay) {
        frames = 0
        start = 0
        raf = window.requestAnimationFrame(sample)
        return
      }
      if (start === 0) start = now
      frames += 1
      const elapsed = now - start
      if (elapsed < livingMotion.sampleMs) {
        raf = window.requestAnimationFrame(sample)
        return
      }
      const fps = (frames * 1000) / elapsed
      if (fps < livingMotion.minFps) {
        setSampledTier((current) => (current === 'full' ? 'lite' : 'static'))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    raf = window.requestAnimationFrame(sample)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.cancelAnimationFrame(raf)
    }
  }, [tier])

  return tier
}
