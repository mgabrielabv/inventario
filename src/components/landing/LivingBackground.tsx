import { useEffect, useRef, type CSSProperties } from 'react'
import { usePerformanceTier } from '../../motion/hooks/usePerformanceTier'
import { livingMotion } from '../../motion/tokens'

/**
 * Fondo decorativo de la portada. Vive detrás del contenido, no recibe eventos
 * y solo mueve `transform`/`opacity`. El nivel `full` se rebaja automáticamente
 * cuando el equipo o el muestreo inicial no sostienen la fluidez.
 */
export const LivingBackground = () => {
  const tier = usePerformanceTier()
  const ref = useRef<HTMLDivElement | null>(null)
  const particles = tier === 'full'
    ? livingMotion.particleCount
    : tier === 'lite' ? Math.ceil(livingMotion.particleCount / 2) : 0

  useEffect(() => {
    const element = ref.current
    if (!element || tier !== 'full') return
    let frame = 0
    const target = { x: 0, y: 0 }

    const paint = () => {
      frame = 0
      element.style.setProperty('--living-cursor-x', `${target.x}px`)
      element.style.setProperty('--living-cursor-y', `${target.y}px`)
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      target.x = event.clientX + window.scrollX
      target.y = event.clientY + window.scrollY
      if (!frame) frame = window.requestAnimationFrame(paint)
    }
    const onVisibility = () => {
      element.classList.toggle('living-bg--paused', document.hidden)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
      window.cancelAnimationFrame(frame)
    }
  }, [tier])

  return (
    <div ref={ref} className={`living-bg living-bg--${tier}`} aria-hidden="true">
      <span className="living-bg__mesh">
        <i className="living-bg__blob living-bg__blob--1" />
        <i className="living-bg__blob living-bg__blob--2" />
        <i className="living-bg__blob living-bg__blob--3" />
      </span>
      <span className="living-bg__aurora" />
      <span className="living-bg__grid" />
      <span className="living-bg__particles">
        {Array.from({ length: particles }, (_, index) => (
          <i
            key={index}
            className="living-bg__particle"
            style={{
              '--living-x': `${4 + (index * 37) % 92}%`,
              '--living-y': `${6 + (index * 53) % 86}%`,
              '--living-delay': `${-((index % 11) * 0.7)}s`,
              '--living-duration': `calc(var(--m-living-particle) * ${0.8 + (index % 5) * 0.12})`,
            } as CSSProperties}
          />
        ))}
      </span>
      <span className="living-bg__light" />
      <span className="living-bg__grain" />
    </div>
  )
}
