/* Geometría isométrica a 30°. Toda superficie se sombrea con tres caras
   coherentes (clara / media / oscura) derivadas de tokens de color. */

export interface Point { x: number; y: number }
export type Tone = 'base' | 'accent' | 'screen' | 'metal' | 'paper'

export interface BoxPart {
  kind: 'box'
  x: number
  y: number
  z: number
  w: number
  d: number
  h: number
  tone: Tone
  /** Inclinación del frente, en grados; 0 mantiene la caja recta. */
  tilt?: number
}

export interface CylinderPart {
  kind: 'cylinder'
  x: number
  y: number
  z: number
  r: number
  h: number
  tone: Tone
}

export interface PlatePart {
  kind: 'plate'
  x: number
  y: number
  z: number
  w: number
  d: number
  tone: Tone
}

export interface RodPart {
  kind: 'rod'
  x: number
  y: number
  z: number
  length: number
  tone: Tone
  axis?: 'x' | 'y'
}

export type ArtPart = BoxPart | CylinderPart | PlatePart | RodPart

export const box = (
  x: number, y: number, z: number, w: number, d: number, h: number, tone: Tone = 'base',
): BoxPart => ({ kind: 'box', x, y, z, w, d, h, tone })

export const cyl = (
  x: number, y: number, z: number, r: number, h: number, tone: Tone = 'base',
): CylinderPart => ({ kind: 'cylinder', x, y, z, r, h, tone })

export const plate = (
  x: number, y: number, z: number, w: number, d: number, tone: Tone = 'paper',
): PlatePart => ({ kind: 'plate', x, y, z, w, d, tone })

export const rod = (
  x: number, y: number, z: number, length: number, tone: Tone = 'metal', axis: 'x' | 'y' = 'y',
): RodPart => ({ kind: 'rod', x, y, z, length, tone, axis })

/** Proyección: α = 30°, por eso sin = 0,5 y cos = √3/2. */
export const COS30 = Math.sqrt(3) / 2
export const SIN30 = 0.5
export const ORIGIN = { x: 100, y: 118 }
export const SCALE = 1.42

export const project = (x: number, y: number, z: number): Point => ({
  x: ORIGIN.x + (x - y) * COS30 * SCALE,
  y: ORIGIN.y + (x + y) * SIN30 * SCALE - z * SCALE,
})

export const polygon = (points: Point[]): string =>
  points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')

export interface BoxFaces {
  top: Point[]
  left: Point[]
  right: Point[]
  frontEdge: Point[]
}

/** Caras visibles: superior (A'B'C'D'), izquierda (D'C'CD) y derecha (B'C'CB). */
export const boxFaces = (part: BoxPart): BoxFaces => {
  const { x, y, z, w, d, h } = part
  const ground = [
    project(x - w / 2, y - d / 2, z),       // A
    project(x + w / 2, y - d / 2, z),       // B
    project(x + w / 2, y + d / 2, z),       // C
    project(x - w / 2, y + d / 2, z),       // D
  ]
  const top = [
    project(x - w / 2, y - d / 2, z + h),
    project(x + w / 2, y - d / 2, z + h),
    project(x + w / 2, y + d / 2, z + h),
    project(x - w / 2, y + d / 2, z + h),
  ]
  return {
    top,
    left: [top[3], top[2], ground[2], ground[3]],
    right: [top[1], top[2], ground[2], ground[1]],
    frontEdge: [top[3], ground[3], ground[2]],
  }
}

export const ellipsePath = (
  x: number, y: number, z: number, rx: number, ry: number,
): { cx: number; cy: number; rx: number; ry: number } => {
  const center = project(x, y, z)
  return { cx: center.x, cy: center.y, rx: rx * COS30 * SCALE, ry: rx * SIN30 * SCALE + ry * 0.1 }
}

/** Tres tonos por cara, siempre derivados de variables (sin colores literales). */
export const toneFill = (tone: Tone, face: 'top' | 'left' | 'right'): string => {
  const base = `var(--art-${tone})`
  if (face === 'top') return `color-mix(in oklab, ${base} 72%, var(--cream))`
  if (face === 'right') return `color-mix(in oklab, ${base} 88%, var(--burgundy))`
  return `color-mix(in oklab, ${base} 76%, var(--burgundy))`
}
