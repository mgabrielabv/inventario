/* Tokens de movimiento. Ningún componente debe llevar números mágicos.
   Lenguaje de marca: marfil pulido — suave, con peso y sin rebotes caricaturescos. */
export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 38, mass: 0.8 },
  ui: { type: 'spring', stiffness: 380, damping: 34 },
  sheet: { type: 'spring', stiffness: 300, damping: 32, mass: 1 },
  soft: { type: 'spring', stiffness: 140, damping: 22, mass: 1.1 },
  /** Respuesta inmediata al toque, sin rebote. */
  press: { type: 'spring', stiffness: 620, damping: 42, mass: 0.7 },
  /** Asiento final: un rebote mínimo, nunca "boing". */
  settle: { type: 'spring', stiffness: 420, damping: 30, mass: 0.9 },
} as const

export const ease = {
  out: [0.22, 1, 0.36, 1],
  ios: [0.32, 0.72, 0, 1],
  inOut: [0.65, 0, 0.35, 1],
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeOutQuint: [0.23, 1, 0.32, 1],
  easeInOutSoft: [0.45, 0, 0.2, 1],
} as const

export const dur = {
  micro: 0.12,
  fast: 0.18,
  step: 0.24,
  base: 0.32,
  slow: 0.48,
  check: 0.6,
  hero: 0.8,
  celebration: 1.2,
  shimmer: 1.4,
  emptyFloat: 4,
} as const

export const stagger = { tight: 0.03, base: 0.055, wide: 0.09, maxTotal: 0.4 } as const

export const distance = { rise: 12, riseLg: 24, card: 14, cardMobile: 12, sheet: '100%' } as const

export const reduced = {
  duration: 0.14,
  ease: ease.out,
} as const

/** Vuelo del producto al carrito visible, con arco y cola acotada. */
export const flyCart = {
  duration: 0.66,
  settle: 0.12,
  endScale: 0.35,
  endOpacity: 0,
  endRotate: 8,
  tokenSize: 56,
  arcLift: 56,
  maxTokens: 3,
  ripple: 0.4,
  bumpScale: 1.18,
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

/** Escenarios de producto: halo que respira y entrada sin salto de layout. */
export const stageMotion = {
  revealY: 18,
  revealScale: 0.97,
  haloScale: 1.06,
  haloFrom: 0.45,
  haloTo: 0.8,
  haloDuration: 6,
  tileStagger: 0.07,
} as const

/** Entradas cinematográficas de portada: velo corto y revelado escalonado. */
export const cinematic = {
  routeScale: 0.995,
  titleRise: 28,
  titleDelay: 0.08,
  copyDelay: 0.18,
  artDelay: 0.26,
  revealDuration: dur.hero,
} as const

/** A20· caja abierta de estados vacíos. */
export const openBox = {
  drawDuration: 0.8,
  initialY: 16,
  initialScale: 0.92,
} as const

/** B1 · tarjeta, imagen, etiquetas y favorito. */
export const cardMotion = {
  hoverScale: 1.04,
  hoverDuration: 0.5,
  tapScale: 0.985,
  tapDuration: 0.08,
  quickOffset: 6,
  badgeFrom: 0.9,
  shimmerFrom: -120,
  shimmerTo: 120,
  favoritePop: 1.18,
  sparkCount: 6,
  sparkAngle: 60,
  sparkDistance: 16,
  sparkDuration: 0.35,
  priceDuration: dur.base,
} as const

/** B2 · respuesta táctil: desactivada por decisión pendiente de confirmación. */
export const haptics = {
  enabled: false,
  duration: 10,
} as const

/** B4 · banners con capas en paralaje suave y progreso del autoavance. */
export const bannerMotion = {
  autoplay: 6.5,
  swipeDistance: 48,
  backgroundShift: 8,
  textShift: 14,
  artShift: 20,
} as const

/** Errores de formulario: sacudida corta, nunca con reduced-motion. */
export const feedback = { shake: 6 } as const

/** B6 · cabecera, megamenú y barra inferior. */
export const chromeMotion = {
  hideAfter: 120,
  scrollDelta: 8,
  megaOffset: 8,
  tabIconScale: 1.08,
} as const

/** B9 · panel sobrio: KPIs escalonados, barras y cambio de estado. */
export const panelMotion = {
  kpiRise: 10,
  barRise: 0.6,
  statusScale: 1.06,
  highlightDuration: 0.9,
} as const

/** B7 · celebración contenida, nunca lluvia de confeti. */
export const celebration = {
  particles: 16,
  duration: dur.celebration,
  radius: 96,
  fullTurn: 360,
  wave: 4,
} as const

/** Escena flotante del héroe: rotación pausada, flotación corta y órbita ancha. */
export const heroSceneMotion = {
  rotateMs: 5600,
  floatMin: 6,
  floatJitter: 0.2,
  travel: 22,
  orbitSeconds: 34,
} as const

/** Fondo vivo de portada: capas decorativas y muestreo de rendimiento. */
export const livingMotion = {
  meshDuration: 26,
  auroraDuration: 18,
  particleDuration: 9,
  particleCount: 10,
  lightSize: 520,
  sampleMs: 1200,
  minFps: 45,
} as const

/** Parámetros CSS derivados de estos tokens (inyectados en :root por css-vars.ts). */
export const cssMotion = {
  '--orbit-seconds': `${heroSceneMotion.orbitSeconds}s`,
  '--m-living-mesh': `${livingMotion.meshDuration}s`,
  '--m-living-aurora': `${livingMotion.auroraDuration}s`,
  '--m-living-particle': `${livingMotion.particleDuration}s`,
  '--m-living-light-size': `${livingMotion.lightSize}px`,
  '--m-dur-micro': `${dur.micro}s`,
  '--m-dur-fast': `${dur.fast}s`,
  '--m-dur-step': `${dur.step}s`,
  '--m-dur-base': `${dur.base}s`,
  '--m-dur-slow': `${dur.slow}s`,
  '--m-dur-check': `${dur.check}s`,
  '--m-dur-hero': `${dur.hero}s`,
  '--m-dur-shimmer': `${dur.shimmer}s`,
  '--m-dur-empty-float': `${dur.emptyFloat}s`,
  '--m-dur-banner': `${bannerMotion.autoplay}s`,
  '--m-dur-ripple': `${flyCart.ripple}s`,
  '--m-dur-highlight': `${panelMotion.highlightDuration}s`,
  '--m-ease-out-expo': `cubic-bezier(${ease.easeOutExpo.join(', ')})`,
  '--m-ease-out-quint': `cubic-bezier(${ease.easeOutQuint.join(', ')})`,
  '--m-ease-in-out-soft': `cubic-bezier(${ease.easeInOutSoft.join(', ')})`,
  '--m-hover-scale': String(cardMotion.hoverScale),
  '--m-tap-scale': String(cardMotion.tapScale),
  '--m-dur-hover': `${cardMotion.hoverDuration}s`,
  '--m-dur-tap': `${cardMotion.tapDuration}s`,
  '--m-rise': `${distance.rise}px`,
  '--m-rise-lg': `${distance.riseLg}px`,
  '--m-spark-distance': `${cardMotion.sparkDistance}px`,
  '--m-dur-spark': `${cardMotion.sparkDuration}s`,
  '--m-quick-offset': `${cardMotion.quickOffset}px`,
  '--m-badge-from': String(cardMotion.badgeFrom),
  '--m-confetti-duration': `${celebration.duration}s`,
  '--m-stage-halo-scale': String(stageMotion.haloScale),
  '--m-stage-halo-duration': `${stageMotion.haloDuration}s`,
  '--m-stage-halo-from': String(stageMotion.haloFrom),
  '--m-stage-halo-to': String(stageMotion.haloTo),
  '--m-tile-stagger': `${stageMotion.tileStagger}s`,
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
