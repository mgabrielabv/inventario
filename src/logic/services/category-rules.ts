/* Clasificación de las fichas importadas. Las mismas reglas las usa
   scripts/lib/category-rules.mjs al sembrar y al reclasificar el JSON. */

import rules from '../../data/category-rules.json'
import { ARQUETIPOS, type Arquetipo } from '../types'

export interface Clasificacion {
  categoria: string
  subcategoria: string
  arquetipo: Arquetipo
}

interface Clasificable {
  id?: string
  nombre: string
  categoria: string
  subcategoria?: string
  etiquetas?: string[]
  especificaciones?: { clave: string; valor: string }[]
}

const normaliza = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const coincide = (texto: string, palabras: string[]): boolean =>
  palabras.some((palabra) => texto.includes(normaliza(palabra)))

/** Devuelve una reclasificación cuando una regla aplica; si no, `null`. */
export const clasificarImportado = (product: Clasificable): Clasificacion | null => {
  const nombre = normaliza(product.nombre)
  const contexto = normaliza([
    product.categoria, product.subcategoria ?? '',
    ...(product.etiquetas ?? []),
    ...(product.especificaciones ?? []).map(({ valor }) => valor),
  ].join(' '))
  // Las reglas de comestibles solo aplican a Open Food Facts: en DummyJSON
  // palabras como «Apple» son marca, no alimento.
  const esAlimento = normaliza(product.id ?? '').startsWith('off-')
  const regla = rules.porNombre.find((item) => coincide(nombre, item.keywords))
    ?? (esAlimento ? rules.porCategoria.find((item) => coincide(contexto, item.keywords)) : null)
  if (!regla) return null
  const arquetipo = rules.arquetipos[regla.categoria as keyof typeof rules.arquetipos] ?? 'paquete'
  return {
    categoria: regla.categoria,
    subcategoria: regla.subcategoria,
    arquetipo: ARQUETIPOS.includes(arquetipo as Arquetipo) ? arquetipo as Arquetipo : 'paquete',
  }
}
