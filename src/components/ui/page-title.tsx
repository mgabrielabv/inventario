import { motion } from 'framer-motion'
import { useReducedMotion } from '../../logic/hooks/useSlideshow'
import { EASE_OUT } from '../illustrations/motion'

interface PageTitleProps {
  lines: string[]
  className?: string
  id?: string
}

export const PageTitle = ({ lines, className = '', id }: PageTitleProps) => {
  const reducedMotion = useReducedMotion()

  return (
    <h1 className={['page-title', className].filter(Boolean).join(' ')} id={id}>
      {lines.map((line, index) => (
        <span className="page-title__mask" key={line}>
          <motion.span
            className="page-title__line"
            initial={reducedMotion ? false : { y: '110%' }}
            animate={{ y: '0%' }}
            transition={{
              duration: reducedMotion ? 0 : 0.72,
              delay: reducedMotion ? 0 : index * 0.06,
              ease: EASE_OUT,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}
