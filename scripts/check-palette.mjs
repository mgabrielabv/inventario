#!/usr/bin/env node
/**
 * check-palette.mjs
 * 1) Falla si existe un color literal fuera de src/styles/tokens.css.
 * 2) Falla si un color dentro de tokens.css sale de la familia
 *    burdeos–arcilla–crema–tan (matiz 350°–40°, saturación >= 12%).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src')
const tokensPath = join(srcDir, 'styles', 'tokens.css')
const failures = []

const COMMENT = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g
const strip = (source) => source.replace(COMMENT, '')

const NAMED = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque',
  'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue',
  'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan',
  'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey',
  'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred',
  'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey',
  'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey',
  'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro',
  'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey',
  'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
  'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
  'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen',
  'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid',
  'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
  'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose',
  'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum',
  'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue',
  'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver',
  'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat',
  'white', 'whitesmoke', 'yellow', 'yellowgreen',
])

const COLOR_PATTERNS = [
  /#[0-9a-fA-F]{3,8}\b/g,
  /\brgba?\s*\([^)]*\)/gi,
  /\bhsla?\s*\([^)]*\)/gi,
]

const namedPattern = new RegExp(
  `(?<![\\w-])(${[...NAMED].join('|')})(?![\\w-])`,
  'gi',
)

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, files)
    else files.push(path)
  }
  return files
}

const sourceFiles = walk(srcDir).filter((path) => ['.css', '.ts', '.tsx'].includes(extname(path)))

for (const path of sourceFiles) {
  if (path === tokensPath) continue
  const source = strip(readFileSync(path, 'utf8'))
  const rel = relative(root, path)
  for (const pattern of COLOR_PATTERNS) {
    const matches = source.match(pattern)
    if (matches) failures.push(`${rel}: color literal ${[...new Set(matches)].join(', ')}`)
  }
  // En TS/TSX las palabras "red" o "tan" son texto normal (red de invitados,
  // color Tan). Los nombres de color se controlan solo en CSS, donde pueden
  // aparecer como valor de una declaración.
  const named = extname(path) === '.css' ? source.match(namedPattern) : null
  if (named) failures.push(`${rel}: nombre de color ${[...new Set(named)].join(', ')}`)
}

/* --- Matiz / saturación de los colores de tokens.css ------------------- */
function parseColor(value) {
  const hex = value.trim().match(/^#([0-9a-fA-F]{3,8})$/)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    if (h.length === 8) h = h.slice(0, 6)
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  }
  const fn = value.trim().match(/^(rgba?|hsla?)\s*\(([^)]*)\)$/i)
  if (fn) {
    const parts = fn[2].split(/[\s,/]+/).filter(Boolean).map(Number)
    if (fn[1].toLowerCase().startsWith('hsl')) {
      const [h, s, l] = parts
      const sat = s / 100
      const light = l / 100
      const c = (1 - Math.abs(2 * light - 1)) * sat
      const hp = h / 60
      const x = c * (1 - Math.abs((hp % 2) - 1))
      const m = light - c / 2
      let rgb
      if (hp < 1) rgb = [c, x, 0]
      else if (hp < 2) rgb = [x, c, 0]
      else if (hp < 3) rgb = [0, c, x]
      else if (hp < 4) rgb = [0, x, c]
      else if (hp < 5) rgb = [x, 0, c]
      else rgb = [c, 0, x]
      return rgb.map((v) => Math.round((v + m) * 255))
    }
    if (parts.length >= 3) return parts.slice(0, 3)
  }
  return null
}

function hueSat([r, g, b]) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const d = max - min
  const l = (max + min) / 2
  if (d === 0) return { h: 0, s: 0 }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h = (h * 60 + 360) % 360
  return { h, s: s * 100 }
}

const tokensSource = strip(readFileSync(tokensPath, 'utf8'))
const tokenValues = [...tokensSource.matchAll(/--[a-z0-9-]+\s*:\s*([^;]+);/gi)].map((m) => m[1])
const checked = new Set()
for (const value of tokenValues) {
  for (const pattern of COLOR_PATTERNS) {
    for (const literal of value.match(pattern) ?? []) {
      if (checked.has(literal)) continue
      checked.add(literal)
      const rgb = parseColor(literal)
      if (!rgb) {
        failures.push(`tokens.css: no se pudo interpretar ${literal}`)
        continue
      }
      const { h, s } = hueSat(rgb)
      if (h > 40 && h < 350) {
        failures.push(`tokens.css: ${literal} tiene matiz ${h.toFixed(1)}° (permitido 350°–40°)`)
      }
      if (s < 12) {
        failures.push(`tokens.css: ${literal} tiene saturación ${s.toFixed(1)}% (mínimo 12%)`)
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Paleta: FALLO')
  for (const failure of failures) console.error(`  · ${failure}`)
  process.exit(1)
}
console.log(`Paleta: OK (${sourceFiles.length - 1} archivos limpios, ${checked.size} colores en tokens.css dentro de 350°–40° y S>=12%).`)
