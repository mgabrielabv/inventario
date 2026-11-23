import { box, cyl, plate, rod, type ArtPart, type Tone } from './iso'
import type { Arquetipo } from '../../logic/types'

export interface Archetype {
  label: string
  parts: ArtPart[]
  /** Piezas adicionales de la vista `abierto`. */
  open?: ArtPart[]
  /** Punto de interés para el zoom de la vista `detalle`. */
  focus?: { x: number; y: number }
}

const keys = (rows: number, tone: Tone): ArtPart[] =>
  Array.from({ length: rows }, (_, row) =>
    box(-26, -8 + row * 5, 3, 52, 2.4, 1.4, tone))

const def = (label: string, parts: ArtPart[], extra: Partial<Archetype> = {}): Archetype =>
  ({ label, parts, ...extra })

export const ARQUETIPOS_ARTE: Record<Arquetipo, Archetype> = {
  laptop: def('Laptop', [
    box(0, 0, 0, 54, 36, 4, 'metal'),
    box(0, -16, 4, 54, 2.4, 32, 'screen'),
    plate(0, 9, 4, 18, 10, 'paper'),
    ...keys(4, 'paper'),
  ], {
    open: [
      box(0, 0, 0, 54, 36, 4, 'metal'),
      box(0, -26, 4, 54, 2.4, 44, 'screen'),
      plate(0, 9, 4, 18, 10, 'paper'),
    ],
    focus: { x: 0, y: -16 },
  }),

  monitor: def('Monitor', [
    box(0, 10, 0, 28, 16, 2, 'metal'),
    cyl(0, 2, 2, 3.5, 14, 'metal'),
    box(0, -10, 16, 66, 2.4, 38, 'screen'),
    plate(0, -10, 16, 58, 30, 'paper'),
  ], { focus: { x: 0, y: -10 } }),

  mouse: def('Mouse', [
    box(0, 0, 0, 24, 32, 8, 'base'),
    plate(0, -6, 8, 5, 8, 'metal'),
    box(-5, 4, 8, 8, 8, 1, 'paper'),
    box(5, 4, 8, 8, 8, 1, 'paper'),
  ], { focus: { x: 0, y: -2 } }),

  teclado: def('Teclado', [
    box(0, 0, 0, 66, 26, 3, 'base'),
    ...keys(4, 'paper'),
    box(22, 10, 3, 10, 4, 1.2, 'accent'),
  ]),

  audifonos: def('Audífonos', [
    rod(0, 0, 32, 34, 'base', 'x'),
    box(-16, 0, 8, 9, 18, 22, 'base'),
    box(16, 0, 8, 9, 18, 22, 'base'),
    cyl(-16, 0, 8, 7, 5, 'metal'),
    cyl(16, 0, 8, 7, 5, 'metal'),
  ], { focus: { x: 0, y: 0 } }),

  cargador: def('Cargador', [
    box(0, 0, 0, 26, 20, 11, 'base'),
    rod(-4, 10, 5, 6, 'metal'),
    rod(4, 10, 5, 6, 'metal'),
  ]),

  camara: def('Cámara', [
    box(0, 0, 0, 30, 20, 20, 'base'),
    cyl(0, 12, 11, 8, 5, 'metal'),
    plate(0, -10, 14, 12, 4, 'screen'),
  ]),

  pad: def('Almohadilla', [
    box(0, 0, 0, 62, 44, 1.6, 'base'),
    plate(0, 0, 1.6, 54, 36, 'paper'),
  ]),

  lampara: def('Lámpara', [
    cyl(0, 8, 0, 12, 2.5, 'metal'),
    rod(0, 8, 3, 32, 'metal'),
    box(0, -4, 34, 28, 16, 6, 'accent'),
    plate(0, -4, 28, 24, 12, 'paper'),
  ], { focus: { x: 0, y: -4 } }),

  taza: def('Taza', [
    cyl(0, 0, 0, 12, 17, 'base'),
    cyl(14, 0, 8, 5, 2, 'base'),
    plate(0, 0, 17, 9, 9, 'paper'),
  ], { open: [cyl(0, 0, 0, 12, 17, 'base'), plate(0, 0, 17, 9, 9, 'paper')] }),

  ssd: def('SSD', [
    box(0, 0, 0, 42, 30, 3, 'metal'),
    plate(0, 0, 3, 30, 18, 'paper'),
    box(-18, -12, 3, 5, 5, 0.8, 'accent'),
  ], { open: [box(0, 0, 0, 42, 30, 3, 'metal'), plate(0, 0, 3, 30, 18, 'paper'), box(4, 0, 3.4, 22, 14, 2, 'base')] }),

  cable: def('Cable', [
    rod(0, 0, 3, 44, 'base', 'x'),
    box(-24, 0, 0, 8, 12, 6, 'metal'),
    box(24, 0, 0, 8, 12, 6, 'metal'),
  ]),

  agenda: def('Agenda', [
    box(0, 0, 0, 34, 44, 5, 'base'),
    plate(0, 0, 5, 30, 40, 'paper'),
    rod(-16, 0, 5, 40, 'metal'),
  ], { open: [box(-16, 0, 0, 32, 44, 2, 'base'), box(16, 0, 0, 32, 44, 2, 'paper'), rod(0, 0, 2, 40, 'metal')] }),

  cuaderno: def('Cuaderno', [
    box(0, 0, 0, 38, 48, 4, 'base'),
    plate(0, 0, 4, 33, 43, 'paper'),
    rod(-18, 0, 4, 44, 'metal'),
  ], { open: [box(-18, 0, 0, 36, 48, 1.6, 'paper'), box(18, 0, 0, 36, 48, 1.6, 'paper'), rod(0, 0, 2, 44, 'metal')] }),

  lapices: def('Lápices', [
    box(0, 0, 0, 36, 20, 8, 'base'),
    rod(-12, 0, 8, 16, 'accent'),
    rod(-4, 0, 8, 16, 'accent'),
    rod(4, 0, 8, 16, 'accent'),
    rod(12, 0, 8, 16, 'accent'),
  ]),

  ventilador: def('Ventilador', [
    cyl(0, 10, 0, 12, 2, 'metal'),
    rod(0, 10, 2, 24, 'metal'),
    box(0, -2, 24, 30, 8, 30, 'base'),
    plate(0, -7, 28, 20, 12, 'paper'),
  ]),

  router: def('Router', [
    box(0, 0, 0, 46, 26, 9, 'base'),
    rod(-18, -8, 9, 26, 'metal'),
    rod(-6, -8, 9, 26, 'metal'),
    rod(6, -8, 9, 26, 'metal'),
    rod(18, -8, 9, 26, 'metal'),
    plate(0, 10, 9, 30, 4, 'accent'),
  ]),

  funda: def('Funda', [
    box(0, 0, 0, 52, 38, 9, 'base'),
    plate(0, -6, 9, 44, 16, 'paper'),
    box(0, 16, 9, 18, 6, 2, 'metal'),
  ], { open: [box(0, 0, 0, 52, 38, 6, 'base'), box(0, -16, 6, 52, 6, 22, 'base'), plate(0, -4, 6, 40, 22, 'paper')] }),

  notas: def('Notas adhesivas', [
    box(-8, 4, 0, 24, 24, 2, 'base'),
    box(6, -2, 2, 24, 24, 2, 'accent'),
    box(-2, 6, 4, 24, 24, 2, 'paper'),
  ]),

  reloj: def('Reloj', [
    cyl(0, 6, 0, 10, 3, 'metal'),
    box(0, -2, 3, 32, 14, 18, 'base'),
    plate(0, -10, 7, 22, 6, 'screen'),
  ]),

  microfono: def('Micrófono', [
    cyl(0, 8, 0, 11, 2, 'metal'),
    rod(0, 8, 2, 28, 'metal'),
    cyl(0, 0, 28, 8, 20, 'base'),
    cyl(0, 0, 48, 9, 6, 'metal'),
  ]),

  hub: def('Hub USB', [
    box(0, 0, 0, 44, 22, 7, 'base'),
    rod(-16, 12, 3.5, 8, 'metal'),
    rod(-8, 12, 3.5, 8, 'metal'),
    rod(0, 12, 3.5, 8, 'metal'),
    rod(8, 12, 3.5, 8, 'metal'),
    rod(16, 12, 3.5, 8, 'metal'),
  ]),

  grapadora: def('Grapadora', [
    box(0, 0, 0, 40, 16, 5, 'metal'),
    box(0, -2, 5, 38, 12, 8, 'base'),
    plate(0, 3, 13, 26, 6, 'accent'),
  ]),

  portavelas: def('Portavelas', [
    cyl(0, 0, 0, 15, 12, 'base'),
    cyl(0, 0, 12, 10, 2, 'accent'),
    cyl(0, 0, 14, 4, 6, 'paper'),
  ]),

  paquete: def('Paquete', [
    box(0, 0, 0, 44, 36, 30, 'base'),
    plate(0, 0, 30, 10, 36, 'paper'),
    plate(-10, 0, 12, 20, 12, 'accent'),
  ], {
    open: [
      box(0, 0, 0, 44, 36, 24, 'base'),
      plate(-22, 0, 24, 44, 5, 'paper'),
      plate(22, 0, 24, 44, 5, 'paper'),
      box(0, 0, 24, 22, 16, 6, 'accent'),
    ],
  }),
}
