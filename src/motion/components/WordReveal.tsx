import { motion, useReducedMotion } from 'framer-motion'
import { wordMask } from '../variants'
import { dur, ease } from '../tokens'

interface Props {
  text: string
  className?: string
  as?: 'h1' | 'h2' | 'p'
}

/** A3 · titular palabra por palabra con máscara y desenfoque. */
export const WordReveal = ({ text, className = '', as = 'h1' }: Props) => {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag className={className} aria-label={text}>
      {text.split(' ').map((word, index) => (
        <span className="word-mask" key={`${word}-${index}`} aria-hidden="true">
          <motion.span
            custom={index}
            variants={wordMask}
            initial="hidden"
            animate="show"
            transition={reduce ? { duration: dur.fast, ease: ease.out } : undefined}
          >
            {word}
            {index < text.split(' ').length - 1 ? '\u00a0' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
