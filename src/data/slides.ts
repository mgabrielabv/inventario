import type { Slide } from '../logic/types'

export const slides: Slide[] = [
  {
    id: 'boxes',
    kicker: 'INV.001 / RECEPCIÓN',
    title: 'Cada cosa, en su lugar.',
    support: 'Del muelle al estante, sin perder una etiqueta de vista.',
    corners: {
      topLeft: 'INV.001 / STOCK:015',
      topRight: 'CAT:RECEP',
      bottomLeft: '06:40 / MUELLE 02',
      bottomRight: 'ATM:ALM-01',
    },
  },
  {
    id: 'shelf',
    kicker: 'INV.002 / CONTROL DE STOCK',
    title: 'Sabe qué hay. Sabe qué falta.',
    support: 'Un hueco en la estantería no es un error: es una señal.',
    corners: {
      topLeft: 'INV.002 / STOCK:004',
      topRight: 'CAT:STOCK',
      bottomLeft: 'MIN:010 / REPONER',
      bottomRight: 'ATM:ALM-02',
    },
  },
  {
    id: 'scanner',
    kicker: 'INV.003 / TRAZABILIDAD',
    title: 'Cada movimiento, registrado.',
    support: 'Una lectura, una entrada, una salida. El historial no se improvisa.',
    corners: {
      topLeft: 'INV.003 / STOCK:015',
      topRight: 'CAT:TRACE',
      bottomLeft: 'SCN:2048 / OK',
      bottomRight: 'ATM:ALM-01',
    },
  },
  {
    id: 'pallet',
    kicker: 'INV.004 / MOVIMIENTOS',
    title: 'Entradas y salidas, sin ruido.',
    support: 'El inventario se mueve; el registro se queda.',
    corners: {
      topLeft: 'INV.004 / STOCK:128',
      topRight: 'CAT:MOV',
      bottomLeft: 'IN:072 / OUT:056',
      bottomRight: 'ATM:ALM-03',
    },
  },
]
