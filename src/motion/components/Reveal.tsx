import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { riseIn, riseItem } from '../variants'
import { dur } from '../tokens'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'ul' | 'ol' | 'article'
}

export const Reveal = ({ children, className = '', delay = 0, as = 'div' }: RevealProps) => {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      variants={riseIn}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      transition={reduce ? { duration: dur.fast } : { delay }}
    >
      {children}
    </Tag>
  )
}

export const RevealItem = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div className={className} variants={riseItem}>{children}</motion.div>
)
