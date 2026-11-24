#!/usr/bin/env node
/**
 * Copia el HTML único a la raíz con un nombre derivado de BRAND.slug.
 * Así el artefacto descargable sigue a la marca cuando esta cambie y no
 * queda ningún nombre histórico en el repositorio.
 */
import { copyFileSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const brand = readFileSync(join(root, 'src', 'config', 'brand.ts'), 'utf8')
const slug = /slug:\s*'([^']+)'/.exec(brand)?.[1] ?? 'tienda'
const source = join(root, 'dist', 'index.html')
const target = join(root, `${slug}.html`)

copyFileSync(source, target)
const bytes = statSync(target).size
console.log(`HTML único: ${slug}.html · ${(bytes / 1024).toFixed(2)} KiB`)
