/* Escenarios visuales de la ficha: valores acotados y normalización compartida
   entre el panel, la migración de datos y la importación de respaldos. */

import { ESCENARIOS, type Escenario } from '../types'

export const ESCENARIO_LABELS: Record<Escenario, string> = {
  natural: 'Natural',
  estudio: 'Estudio',
  arena: 'Arena',
  noche: 'Noche',
}

/** Devuelve el valor conocido o `undefined` para no inventar estilos. */
export const normalizeEscenario = (value: unknown): Escenario | undefined =>
  typeof value === 'string' && ESCENARIOS.includes(value as Escenario)
    ? value as Escenario
    : undefined
