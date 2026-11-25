import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { distance, dur, ease, spring, stagger } from '../tokens'
import { motionSafe, riseFor } from '../helpers'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'ul' | 'ol' | 'article'
  'aria-label'?: string
  id?: string
}

/**
 * Entrada real: opacidad 0 → 1 y subida de 12 px (móvil) o 14 px.
 * Se dispara una sola vez al entrar en pantalla (15 % visible). El estado
 * oculto solo afecta a transform/opacity: el contenido sigue en el árbol de
 * accesibilidad y no desplaza el layout (CLS 0). Sin temporizadores.
 */
export const Reveal = ({
  children, className = '', delay = 0, as = 'div', 'aria-label': ariaLabel, id,
}: RevealProps) => {
  const reduce = useReducedMotion()
  const [mobile, setMobile] = useState(false)
  const Tag = motion[as]

  useEffect(() => {
    const query = window.matchMedia('(max-width: 480px)')
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const item: Variants = {
    hidden: { opacity: 0, y: riseFor(mobile) },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        opacity: { duration: dur.base, ease: ease.easeOutQuint },
        y: spring.soft,
        staggerChildren: stagger.tight,
        delayChildren: delay,
      },
    },
  }

  return (
    <Tag
      className={className}
      variants={reduce ? motionSafe(item) : item}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      aria-label={ariaLabel}
      id={id}
    >
      {children}
    </Tag>
  )
}

/** Elemento hijo opcional: hereda el escalonado del contenedor. */
export const RevealItem = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: distance.rise },
      show: {
        opacity: 1,
        y: 0,
        transition: { y: spring.soft, opacity: { duration: dur.base, ease: ease.out } },
      },
    }}
  >
    {children}
  </motion.div>
)
