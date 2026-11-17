import type { Slide } from '../logic/types'

export const slides: Slide[] = [
  {
    id: 'boxes',
    label: 'Recepción',
    kicker: 'Muelle',
    title: 'Llegó. Se cuenta. Se anota.',
    support: 'Nada entra al estante sin pasar por la lista.',
  },
  {
    id: 'shelf',
    label: 'Stock',
    kicker: 'Estante',
    title: 'Donde hay un hueco, falta algo.',
    support: 'El estante vacío avisa antes que cualquier reporte.',
  },
  {
    id: 'scanner',
    label: 'Escáner',
    kicker: 'Lector',
    title: 'Un pitido, un registro.',
    support: 'Quién, qué, cuánto y a qué hora. Sin adivinar.',
  },
  {
    id: 'pallet',
    label: 'Movimientos',
    kicker: 'Libro de registro',
    title: 'Lo que entra, sale con nombre.',
    support: 'Cada entrada y cada salida queda firmada.',
  },
]
