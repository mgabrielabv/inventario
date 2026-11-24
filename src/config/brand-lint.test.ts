import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Lista blanca documentada. Solo se permiten texto técnico del panel, la
 * migración de nombres antiguos y el motivo de movimiento "Inventario inicial".
 * NUNCA se permite el nombre antiguo en tienda, cabecera, footer, login de
 * clientes, título/meta ni claves activas.
 */
const ALLOWED_FILES = [
  'src/config/legacy.ts',
  'src/app/router.tsx', // ruta interna del panel del personal
  'src/app/layouts/admin-layout.tsx',
  'src/pages/admin/',
  'src/logic/types/index.ts',
  'src/logic/store/inventory.ts',
  'src/data/products.ts',
]

const walk = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? walk(path) : [path]
})

const sourceFiles = [
  ...walk(join(root, 'src')).filter((path) => ['.ts', '.tsx', '.css'].includes(extname(path))),
  join(root, 'index.html'),
]

describe('marca centralizada', () => {
  it('no deja marcadores de nombre sin sustituir', () => {
    for (const path of sourceFiles) {
      if (path.endsWith('.test.ts')) continue
      expect(readFileSync(path, 'utf8'), path).not.toMatch(/\[NOMBRE/)
    }
  })

  it('no repite el nombre de la marca fuera de BRAND', () => {
    for (const path of sourceFiles) {
      const rel = path.slice(root.length + 1).replaceAll('\\', '/')
      if (rel.endsWith('.test.ts') || rel === 'src/config/brand.ts') continue
      expect(readFileSync(path, 'utf8'), rel).not.toMatch(/Ivoria/)
    }
  })

  it('no filtra el nombre antiguo en la tienda', () => {
    const offenders: string[] = []
    for (const path of sourceFiles) {
      const rel = path.slice(root.length + 1).replaceAll('\\', '/')
      // Los tests nombran el pasado a propósito para verificar la migración.
      if (rel.endsWith('.test.ts')) continue
      const source = readFileSync(path, 'utf8')
      source.split('\n').forEach((line, index) => {
        if (!/inventario/i.test(line)) return
        if (ALLOWED_FILES.some((allowed) => rel.startsWith(allowed))) return
        if (/Inventario inicial/i.test(line)) return
        offenders.push(`${rel}:${index + 1}: ${line.trim()}`)
      })
    }
    expect(offenders).toEqual([])
  })
})
