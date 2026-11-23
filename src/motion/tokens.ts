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

/** A4· sección fijada: recorrido y puntos de relevo del relato. */
export const narrative = {
  heightVh: 400,
  stops: [0, 0.25, 0.5, 0.75, 1],
  in: [0, 1, 1, 0, 0],
  middle: [0, 0, 1, 0, 0],
  out: [0, 0, 0, 1, 1],
  shift: [18, 0, 0, 0, -18],
} as const

/** A9· vuelo al carrito y rebote del contador. */
export const flyCart = {
  duration: 0.7,
  settle: 0.12,
  endScale: 0.2,
  endOpacity: 0.5,
  endRotate: 12,
  iconSize: 22,
  bumpScale: 1.28,
} as const

/** A3/A19· inclinación con el puntero. */
export const tilt = {
  maxDegrees: 8,
  perspective: 900,
} as const

/** A10/A16· backdrop y umbrales de arrastre de las hojas. */
export const sheetUI = {
  backdropBlur: 8,
  backdropDuration: 0.24,
  dragElastic: 0.22,
  dragDistance: 120,
  dragVelocity: 700,
  focusDelay: 60,
} as const

/** Ensamblaje y flotación de la caja de identidad. */
export const boxReveal = {
  floatY: -6,
  floatDuration: 5,
  dropY: -70,
  tapeY: -40,
  tapeDelay: 0.36,
  pieceDelays: [0, 0.12, 0.24],
} as const

/** A18· respuesta de las cajas interactivas. */
export const boxInteractive = {
  hoverY: -6,
  tapScale: 0.98,
} as const

/** A20· caja abierta de estados vacíos. */
export const openBox = {
  drawDuration: 0.8,
  initialY: 16,
  initialScale: 0.92,
} as const

/** Fondo de malla: se detiene mientras se desplaza la página. */
export const meshMotion = {
  resumeDelay: 160,
} as const

/** A7/A15· capas sobre la navegación (menú, buscador y paleta de comandos). */
export const overlayUI = {
  offsetY: 12,
  panelOffsetY: 16,
  panelScale: 0.96,
  commandOffsetY: 8,
  focusDelay: 40,
} as const
