import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { spring, tilt } from '../tokens'
import { isLightDevice } from '../helpers'

/**
 * Inclinación con puntero fina: solo ratón, nunca táctil ni reduced-motion.
 * En dispositivos modestos se desactiva para no gastar batería.
 */
export const useParallaxTilt = (max = tilt.maxDegrees) => {
  const reduce = useReducedMotion()
  const [pointerFine, setPointerFine] = useState(false)
  const [light, setLight] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, spring.soft)
  const sy = useSpring(py, spring.soft)

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => {
      setPointerFine(query.matches)
      setLight(isLightDevice())
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const enabled = pointerFine && !light && !reduce

  const rotateY = useTransform(sx, [0, 1], [-max, max])
  const rotateX = useTransform(sy, [0, 1], [max, -max])
  const glareX = useTransform(sx, [0, 1], ['0%', '100%'])
  const glareY = useTransform(sy, [0, 1], ['0%', '100%'])

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (!enabled || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }, [px, py, enabled])

  const onPointerLeave = useCallback(() => {
    px.set(0.5)
    py.set(0.5)
  }, [px, py])

  return {
    ref,
    enabled,
    style: enabled ? { rotateX, rotateY, transformPerspective: tilt.perspective } : undefined,
    glare: enabled ? { x: glareX, y: glareY } : null,
    onPointerMove,
    onPointerLeave,
  }
}
