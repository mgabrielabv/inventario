import { cssMotion } from './tokens'

/**
 * Puente único entre tokens.ts y CSS: cualquier @keyframes o transición que
 * necesite una duración/curva/distancia la lee de una variable inyectada aquí.
 * Así no hay números de movimiento duplicados en las hojas de estilo.
 */
if (typeof document !== 'undefined') {
  for (const [name, value] of Object.entries(cssMotion)) {
    document.documentElement.style.setProperty(name, value)
  }
}
