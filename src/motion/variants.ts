import { dur, ease, spring, stagger } from './tokens'

type Variant = Record<string, unknown>

/** A1 · transiciones de ruta */
export const routeVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
  exit: { opacity: 0, y: -8, transition: { duration: dur.fast, ease: ease.out } },
}

/** A5 / A6 · entrada al aparecer en pantalla */
export const riseIn: Variant = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { ...spring.ui, staggerChildren: stagger.tight } },
}

export const riseItem: Variant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
}

/** A3 · palabra con máscara y desenfoque */
export const wordMask: Variant = {
  hidden: { y: '100%', filter: 'blur(12px)', opacity: 0 },
  show: (i: number) => ({
    y: '0%', filter: 'blur(0px)', opacity: 1,
    transition: { duration: dur.hero, ease: ease.out, delay: i * stagger.base },
  }),
}

/** A10 / A16 · hojas y popovers */
export const sheetDesktop = {
  initial: { x: '100%', opacity: 0.6 },
  animate: { x: 0, opacity: 1, transition: spring.sheet },
  exit: { x: '100%', opacity: 0.4, transition: { duration: dur.fast, ease: ease.ios } },
}
export const sheetMobile = {
  initial: { y: '100%', opacity: 0.6 },
  animate: { y: 0, opacity: 1, transition: spring.sheet },
  exit: { y: '100%', opacity: 0.4, transition: { duration: dur.fast, ease: ease.ios } },
}
export const popover = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: spring.ui },
  exit: { opacity: 0, scale: 0.96, transition: { duration: dur.fast } },
}

/** A14 · toast isla dinámica */
export const toastAnimate = {
  initial: { opacity: 0, y: -12, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: spring.ui },
  exit: { opacity: 0, scale: 0.92, transition: { duration: dur.fast } },
}

/** A11 · pasos direccionales */
export const stepForward = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0, transition: { duration: dur.base, ease: ease.out } },
  exit: { opacity: 0, x: -32, transition: { duration: dur.fast } },
}
export const stepBack = {
  initial: { opacity: 0, x: -32 },
  animate: { opacity: 1, x: 0, transition: { duration: dur.base, ease: ease.out } },
  exit: { opacity: 0, x: 32, transition: { duration: dur.fast } },
}

/** A18 · press y check de botón */
export const pressable = {
  whileTap: { scale: 0.97, transition: spring.snappy },
  whileHover: { scale: 1.01, transition: spring.snappy },
}

export const shake = {
  x: [0, -4, 4, -3, 3, 0],
  transition: { duration: 0.28, ease: ease.inOut },
}

/** A20 · caja vacía que se asienta */
export const emptyBox = {
  initial: { opacity: 0, y: 18, rotate: -4, scale: 0.92 },
  animate: { opacity: 1, y: 0, rotate: 0, scale: 1, transition: spring.soft },
}

export const fadeOnly = (duration = 0.14): Variant => ({
  initial: { opacity: 0, transition: { duration } },
  animate: { opacity: 1, transition: { duration } },
  exit: { opacity: 0, transition: { duration } },
})
