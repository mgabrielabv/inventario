import { useRef } from 'react'
import { useScroll } from 'framer-motion'

/**
 * Progreso 0→1 de un contenedor ligado directamente al scroll.
 * A4 usa el valor en crudo: un resorte añadiría fotogramas tras cada rueda
 * y provocaría tareas largas con la CPU acelerada.
 */
export const useScrollProgress = (offset: string[] = ['start start', 'end end']) => {
  const ref = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: offset as never })
  return { ref, progress: scrollYProgress, raw: scrollYProgress }
}

/** Factor 0→1→0 para secciones que se revelan al entrar y salir. */
export const useInViewProgress = () => {
  const ref = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  return { ref, progress: scrollYProgress }
}
