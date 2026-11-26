import type { Variants } from 'framer-motion'
import { cinematic, distance, dur, ease, feedback, spring, stagger } from './tokens'

/** A1 · transiciones de ruta: entrada elegante, salida rápida. */
export const routeVariants: Variants = {
  initial: { opacity: 0, y: distance.riseLg, scale: cinematic.routeScale },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: dur.base, ease: ease.easeOutQuint } },
  exit: { opacity: 0, y: -distance.rise, transition: { duration: dur.fast, ease: ease.ios } },
}

/** Portada cinematográfica: título, texto y arte entran con un mismo compás. */
const stageStagger = cinematic.copyDelay - cinematic.titleDelay

export const cinematicVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: stageStagger, delayChildren: cinematic.titleDelay },
  },
}

export const cinematicTitle: Variants = {
  hidden: { opacity: 0, y: cinematic.titleRise },
  show: {
    opacity: 1, y: 0,
    transition: { duration: cinematic.revealDuration, ease: ease.easeOutQuint },
  },
}

export const cinematicCopy: Variants = {
  hidden: { opacity: 0, y: distance.riseLg },
  show: {
    opacity: 1, y: 0,
    transition: { duration: cinematic.revealDuration, ease: ease.easeOutQuint },
  },
}

export const cinematicArt: Variants = {
  hidden: { opacity: 0, scale: cinematic.routeScale },
  show: {
    opacity: 1, scale: 1,
    transition: { duration: cinematic.revealDuration, ease: ease.out, delay: cinematic.artDelay },
  },
}

/** A5 / A6 · entrada al aparecer en pantalla */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { ...spring.ui, staggerChildren: stagger.tight } },
}

export const riseItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
}

/** A10 / A16 · hojas y popovers */
export const sheetDesktop: Variants = {
  initial: { x: '100%', opacity: 0.6 },
  animate: { x: 0, opacity: 1, transition: spring.sheet },
  exit: { x: '100%', opacity: 0.4, transition: { duration: dur.fast, ease: ease.ios } },
}
export const sheetMobile: Variants = {
  initial: { y: '100%', opacity: 0.6 },
  animate: { y: 0, opacity: 1, transition: spring.sheet },
  exit: { y: '100%', opacity: 0.4, transition: { duration: dur.fast, ease: ease.ios } },
}
export const popover: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: spring.ui },
  exit: { opacity: 0, scale: 0.96, transition: { duration: dur.fast } },
}

/** A14 · toast isla dinámica */
export const toastAnimate: Variants = {
  initial: { opacity: 0, y: -12, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: spring.ui },
  exit: { opacity: 0, scale: 0.92, transition: { duration: dur.fast } },
}

/** A11 · pasos direccionales */
export const stepForward: Variants = {
  initial: { opacity: 0, x: distance.riseLg },
  animate: { opacity: 1, x: 0, transition: { duration: dur.base, ease: ease.easeOutQuint } },
  exit: { opacity: 0, x: -distance.riseLg, transition: { duration: dur.fast, ease: ease.ios } },
}
export const stepBack: Variants = {
  initial: { opacity: 0, x: -distance.riseLg },
  animate: { opacity: 1, x: 0, transition: { duration: dur.base, ease: ease.easeOutQuint } },
  exit: { opacity: 0, x: distance.riseLg, transition: { duration: dur.fast, ease: ease.ios } },
}

/** A18 · press y check de botón */
export const pressable = {
  whileTap: { scale: 0.97, transition: spring.snappy },
  whileHover: { scale: 1.01, transition: spring.snappy },
}

export const shake = {
  x: [0, -feedback.shake, feedback.shake, -feedback.shake / 2, feedback.shake / 2, 0],
  transition: { duration: dur.step + dur.micro, ease: ease.inOut },
}

/** A20 · caja vacía que se asienta */
export const emptyBox: Variants = {
  initial: { opacity: 0, y: 18, rotate: -4, scale: 0.92 },
  animate: { opacity: 1, y: 0, rotate: 0, scale: 1, transition: spring.soft },
}

export const fadeOnly = (duration = 0.14): Variants => ({
  initial: { opacity: 0, transition: { duration } },
  animate: { opacity: 1, transition: { duration } },
  exit: { opacity: 0, transition: { duration } },
})
