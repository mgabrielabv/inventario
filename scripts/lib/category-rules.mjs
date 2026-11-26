/**
 * Reglas de departamento compartidas con src/logic/services/category-rules.ts.
 * Leen el mismo JSON: al sembrar y al migrar se aplica exactamente la misma
 * clasificación, sin taxonomy nueva ni marcas inventadas.
 */

import { readFileSync } from 'node:fs'

const RULES = JSON.parse(readFileSync(
  new URL('../../src/data/category-rules.json', import.meta.url), 'utf8'))

const normaliza = (value) =>
  String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const coincide = (texto, palabras) =>
  palabras.some((palabra) => texto.includes(normaliza(palabra)))

export const clasificarImportado = (product) => {
  const nombre = normaliza(product.nombre)
  const contexto = normaliza([
    product.categoria, product.subcategoria ?? '',
    ...(product.etiquetas ?? []),
    ...(product.especificaciones ?? []).map(({ valor }) => valor),
  ].join(' '))
  const esAlimento = normaliza(product.id).startsWith('off-')
  const regla = RULES.porNombre.find((item) => coincide(nombre, item.keywords))
    ?? (esAlimento ? RULES.porCategoria.find((item) => coincide(contexto, item.keywords)) : null)
  if (!regla) return null
  return {
    categoria: regla.categoria,
    subcategoria: regla.subcategoria,
    arquetipo: RULES.arquetipos[regla.categoria] ?? 'paquete',
  }
}
