import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BRAND } from './brand'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const walk = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? walk(path) : [path]
})

const tienda = [
  ...['src/pages/store', 'src/components/store', 'src/components/ui'].flatMap((dir) =>
    walk(join(root, dir)).filter((path) => ['.ts', '.tsx'].includes(extname(path)))),
  join(root, 'src/data/banners.ts'),
  join(root, 'index.html'),
]

describe('lenguaje de la tienda', () => {
  it('no filtra vocabulario interno ni el nombre antiguo', () => {
    const offenders: string[] = []
    const escaped = BRAND.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patron = new RegExp(
      `\\b(${['inventario', 'stock', 'sku', 'reservad', 'bodega', 'almacen', 'almacén', escaped].join('|')})\\b`,
      'i',
    )
    for (const path of tienda) {
      const rel = path.slice(root.length + 1).replaceAll('\\', '/')
      readFileSync(path, 'utf8').split('\n').forEach((line, index) => {
        const trimmed = line.trim()
        if (!patron.test(line)) return
        if (trimmed.startsWith('import ') || trimmed.startsWith('//') || trimmed.startsWith('*')
          || trimmed.startsWith('/*')) return
        // Identificador interno de un aviso, nunca texto para la persona.
        if (trimmed.includes("issue.tipo === 'stock'")) return
        offenders.push(`${rel}:${index + 1}: ${trimmed}`)
      })
    }
    expect(offenders).toEqual([])
  })
})
