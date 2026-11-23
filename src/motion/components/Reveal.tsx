import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import type { Variants } from 'framer-motion'
import { dur, spring } from '../tokens'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'ul' | 'ol' | 'article'
}

/* El estado base es visible: la animación solo acompaña, nunca oculta contenido. */
const revealIn: Variants = {
  hidden: { opacity: 1, y: 14 },
  show: { opacity: 1, y: 0, transition: { ...spring.ui, staggerChildren: 0.04 } },
}
const revealItem: Variants = {
  hidden: { opacity: 1, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease: 'easeOut' } },
}

export const Reveal = ({ children, className = '', delay = 0, as = 'div' }: RevealProps) => {
  const reduce = useReducedMotion()
  const [safe, setSafe] = useState(false)
  const Tag = motion[as]

  useEffect(() => {
    const timer = window.setTimeout(() => setSafe(true), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <Tag
      className={className}
      variants={reduce ? undefined : revealIn}
      initial={false}
      animate={safe ? 'show' : undefined}
      whileInView={reduce || safe ? undefined : 'show'}
      viewport={{ once: true, amount: 0.08 }}
      transition={reduce ? { duration: dur.fast } : { delay }}
      style={{ opacity: 1 }}
    >
      {children}
    </Tag>
  )
}

export const RevealItem = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div className={className} variants={revealItem} style={{ opacity: 1 }}>{children}</motion.div>
)
