import { useRef } from 'react'
import { useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { spring } from '../tokens'

/** Progreso 0→1 de un contenedor, suavizado con resorte. */
export const useScrollProgress = (offset: ['start' | 'end', 'start' | 'end'] = ['start start', 'end end']) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: offset as never })
  const smooth = useSpring(scrollYProgress, spring.soft)
  return { ref, progress: reduce ? scrollYProgress : smooth, raw: scrollYProgress }
}

/** Factor 0→1→0 para secciones que se revelan al entrar y salir. */
export const useInViewProgress = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const smooth = useSpring(scrollYProgress, spring.soft)
  return { ref, progress: reduce ? scrollYProgress : smooth }
}
