/* Tokens de movimiento. Ningún componente debe llevar números mágicos. */
export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 38, mass: 0.8 },
  ui: { type: 'spring', stiffness: 380, damping: 34 },
  sheet: { type: 'spring', stiffness: 300, damping: 32, mass: 1 },
  soft: { type: 'spring', stiffness: 140, damping: 22, mass: 1.1 },
} as const

export const ease = {
  out: [0.22, 1, 0.36, 1],
  ios: [0.32, 0.72, 0, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const

export const dur = { fast: 0.18, base: 0.32, slow: 0.6, hero: 1.1 } as const

export const stagger = { tight: 0.04, base: 0.07, wide: 0.12 } as const

export const reduced = {
  duration: 0.14,
  ease: ease.out,
} as const
