import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { dur, ease, stageMotion } from '../../motion/tokens'
import type { Escenario } from '../../logic/types'

interface Props {
  children: ReactNode
  className?: string
  escenario?: Escenario
  categoria?: string
}

/** Mismo vocabulario de tonos que la tarjeta, sin introducir colores nuevos. */
const categoryTone = (categoria?: string): string => {
  const value = (categoria ?? '').toLocaleLowerCase('es')
  if (value.includes('cuidado')) return 'cuidado'
  if (value.includes('tecnolog')) return 'tecnologia'
  if (value.includes('deport')) return 'deportes'
  if (value.includes('aliment')) return 'alimentos'
  if (value.includes('hogar')) return 'hogar'
  if (value.includes('accesor')) return 'accesorios'
  return 'natural'
}

/**
 * Escenario cálido para el producto: un halo que respira detrás del arte y una
 * entrada corta sin desplazar el layout. El contenido sigue siendo el único
 * foco interactivo; el halo es decorativo y se omite con reduced-motion.
 */
export const ProductStage = ({ children, className = '', escenario = 'natural', categoria }: Props) => {
  const reduce = useReducedMotion()
  return (
    <div
      className={`stage-scene ${className}`.trim()}
      data-escenario={escenario}
      data-categoria={categoryTone(categoria)}
    >
      {!reduce && (
        <motion.span
          className="stage-scene__halo"
          aria-hidden="true"
          initial={{ opacity: stageMotion.haloFrom }}
          animate={{
            opacity: [stageMotion.haloFrom, stageMotion.haloTo, stageMotion.haloFrom],
            scale: [1, stageMotion.haloScale, 1],
          }}
          transition={{
            duration: stageMotion.haloDuration,
            ease: ease.inOut,
            repeat: Infinity,
          }}
        />
      )}
      <motion.div
        className="stage-scene__content"
        initial={reduce ? undefined : {
          opacity: 0,
          y: stageMotion.revealY,
          scale: stageMotion.revealScale,
        }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduce
          ? { duration: dur.micro }
          : { duration: dur.slow, ease: ease.easeOutQuint }}
      >
        <div className="stage-scene__float">{children}</div>
      </motion.div>
    </div>
  )
}
