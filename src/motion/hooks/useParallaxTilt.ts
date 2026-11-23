import { useCallback, useRef } from 'react'
import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { spring, tilt } from '../tokens'

/** A3/A6/A19 · inclinación suave con el puntero y brillo especular. */
export const useParallaxTilt = (max = tilt.maxDegrees) => {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, spring.soft)
  const sy = useSpring(py, spring.soft)

  const rotateY = useTransform(sx, [0, 1], [-max, max])
  const rotateX = useTransform(sy, [0, 1], [max, -max])
  const glareX = useTransform(sx, [0, 1], ['0%', '100%'])
  const glareY = useTransform(sy, [0, 1], ['0%', '100%'])

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }, [px, py, reduce])

  const onPointerLeave = useCallback(() => {
    px.set(0.5)
    py.set(0.5)
  }, [px, py])

  return {
    ref,
    style: reduce ? {} : { rotateX, rotateY, transformPerspective: tilt.perspective },
    glare: reduce ? null : { x: glareX, y: glareY },
    onPointerMove,
    onPointerLeave,
  }
}
