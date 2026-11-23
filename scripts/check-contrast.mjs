#!/usr/bin/env node
/**
 * check-contrast.mjs — pares de uso real de tokens.css frente a WCAG 2.1.
 * Texto normal >= 4.5:1 · texto grande / iconos y controles >= 3:1.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokensPath = join(root, 'src', 'styles', 'tokens.css')

const parseBlocks = (source) => {
  const blocks = {}
  let scope = null
  let depth = 0
  for (const line of source.split('\n')) {
    const trimmed = line.trim()
    if (!scope && /(:root|\.dark)\s*\{/.test(trimmed)) {
      scope = trimmed.startsWith('.dark') ? 'dark' : 'light'
      blocks[scope] = {}
      depth = 1
      continue
    }
    if (!scope) continue
    depth += (trimmed.match(/\{/g) ?? []).length
    depth -= (trimmed.match(/\}/g) ?? []).length
    if (depth <= 0) { scope = null; continue }
    const match = trimmed.match(/^(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/)
    if (match) blocks[scope][match[1]] = match[2]
  }
  return blocks
}

const hexToRgb = (hex) => {
  let value = hex.replace('#', '')
  if (value.length === 3) value = value.split('').map((c) => c + c).join('')
  if (value.length === 8) value = value.slice(0, 6)
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
}
const channel = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/* Pares que realmente se usan en la interfaz. */
const TEXT_PAIRS = [
  ['text', 'bg'], ['text', 'bg-alt'], ['text', 'surface'], ['text', 'surface-2'],
  ['text-2', 'bg'], ['text-2', 'bg-alt'], ['text-2', 'surface'], ['text-2', 'surface-2'],
  ['primary-text', 'bg'], ['primary-text', 'surface'],
  ['clay-text', 'bg'], ['clay-text', 'surface'], ['clay-text', 'surface-2'],
  ['on-primary', 'primary'], ['on-primary', 'primary-hover'],
  ['on-clay', 'clay'], ['on-tan', 'tan'],
]
/* En claro las etiquetas sobre arcilla/tan usan tinta oscura; en oscuro,
   esas mismas superficies llevan --on-clay / --on-tan (ya incluidos arriba). */
const LIGHT_TEXT_PAIRS = [['text', 'tan'], ['text', 'clay']]
const LARGE_PAIRS = [
  // En oscuro el protagonista es --primary-text; --primary solo aparece relleno.
  ['primary-text', 'bg-alt'], ['status-critical', 'surface'],
]
const CONTROL_PAIRS = [
  ['control-border', 'bg'], ['control-border', 'bg-alt'],
  ['control-border', 'surface'], ['control-border', 'surface-2'],
  ['status-available', 'bg'], ['status-low', 'bg'], ['status-critical', 'bg'],
  ['tan-strong', 'bg'],
]

const blocks = parseBlocks(readFileSync(tokensPath, 'utf8'))
const failures = []
for (const theme of ['light', 'dark']) {
  const t = blocks[theme]
  if (!t) { failures.push(`${theme}: no se encontraron tokens`); continue }
  const check = (fg, bg, min, kind) => {
    if (!t[`--${fg}`] || !t[`--${bg}`]) { failures.push(`${theme}: falta --${fg} o --${bg}`); return }
    const ratio = contrast(t[`--${fg}`], t[`--${bg}`])
    if (ratio < min) failures.push(`${theme}: ${kind} ${fg}/${bg} = ${ratio.toFixed(2)}:1 (mínimo ${min})`)
  }
  for (const [fg, bg] of TEXT_PAIRS) check(fg, bg, 4.5, 'texto')
  if (theme === 'light') for (const [fg, bg] of LIGHT_TEXT_PAIRS) check(fg, bg, 4.5, 'texto')
  for (const [fg, bg] of LARGE_PAIRS) check(fg, bg, 3, 'texto grande')
  for (const [fg, bg] of CONTROL_PAIRS) check(fg, bg, 3, 'control')
}

if (failures.length > 0) {
  console.error('Contraste: FALLO')
  for (const failure of failures) console.error(`  · ${failure}`)
  process.exit(1)
}
console.log('Contraste: OK — claro y oscuro cumplen AA (texto 4.5:1, grande/controles 3:1).')
