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

/** Extrae el primer bloque canónico de un selector, balanceando llaves.
    Ignora los `:root` anidados en @media/@supports (solo ajustan layout). */
const extractBlock = (source, selector) => {
  const start = source.indexOf(`${selector} {`)
  if (start < 0) return ''
  const open = source.indexOf('{', start)
  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i)
  }
  return ''
}

const parseBlocks = (source) => {
  const parseTokens = (body) => {
    const tokens = {}
    for (const line of body.split('\n')) {
      const match = line.trim().match(/^(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/)
      if (match) tokens[match[1]] = match[2]
    }
    return tokens
  }
  return {
    light: parseTokens(extractBlock(source, ':root')),
    dark: parseTokens(extractBlock(source, '.dark')),
  }
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

/* Pares que realmente se usan en la interfaz. Se configuran en tokens.css,
   junto al resto de la paleta, para cambiar de identidad tocando un solo archivo. */
const tokensRaw = readFileSync(tokensPath, 'utf8')
const pairToken = (name, fallback) => {
  const value = tokensRaw.match(new RegExp(`--contrast-${name}\\s*:\\s*([^;]+);`))?.[1]
  return (value ?? fallback).trim().split(/\s+/).filter(Boolean).map((pair) => {
    const [fg, bg] = pair.split('/')
    return [fg, bg]
  })
}
const TEXT_PAIRS = pairToken('pairs', 'text/bg')
const LIGHT_TEXT_PAIRS = pairToken('light-pairs', '')
const LARGE_PAIRS = pairToken('large-pairs', '')
const CONTROL_PAIRS = pairToken('control-pairs', '')

const blocks = parseBlocks(tokensRaw)
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
