import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ESCENARIO_LABELS, normalizeEscenario } from '../logic/services/stage'
import { ESCENARIOS } from '../logic/types'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const source = (path: string): string => readFileSync(join(root, path), 'utf8')

describe('panel de personal · fase 7', () => {
  const page = source('src/pages/admin/inventory-page.tsx')
  const settings = source('src/pages/admin/settings-page.tsx')
  const adminCss = source('src/styles/admin.css')
  const storeCss = source('src/styles/store.css')
  const stage = source('src/components/store/ProductStage.tsx')
  const pdp = source('src/pages/store/product-page.tsx')
  const store = source('src/logic/store/inventory.ts')

  it('acepta solo escenarios conocidos y con etiqueta', () => {
    expect(ESCENARIOS).toEqual(['natural', 'estudio', 'arena', 'noche'])
    for (const escenario of ESCENARIOS) {
      expect(normalizeEscenario(escenario)).toBe(escenario)
      expect(ESCENARIO_LABELS[escenario].length).toBeGreaterThan(0)
    }
    for (const valor of ['', 'desconocido', 7, null, undefined]) {
      expect(normalizeEscenario(valor)).toBeUndefined()
    }
  })

  it('migra las fichas antiguas a la versión 10 sin inventar escenario', () => {
    expect(store).toContain('version: 10')
    expect(store).toContain('normalizeEscenario(raw.escenario)')
    expect(store).toContain('normalizeEscenario(product.escenario)')
    expect(store).toContain('escenario: draft.escenario')
    expect(store).not.toMatch(/\b(reservado|disponible)\s*:/)
  })

  it('muestra el escenario elegido en la ficha y en la vista previa', () => {
    expect(page).toContain("data-escenario={draft.escenario ?? 'natural'}")
    expect(page).toContain('ESCENARIOS.map')
    expect(page).toContain('ESCENARIO_LABELS[item]')
    expect(stage).toContain('data-escenario={escenario}')
    expect(pdp).toContain('<ProductStage escenario={product.escenario}>')
    for (const selector of ['estudio', 'arena', 'noche']) {
      expect(storeCss).toContain(`[data-escenario='${selector}']`)
      expect(adminCss).toContain(`[data-escenario='${selector}']`)
    }
  })

  it('filtra por foto y por mínimo sin tocar el stock', () => {
    expect(page).toContain('label="Sin foto"')
    expect(page).toContain('label="Bajo mínimo"')
    expect(page).toContain('(product.imagenes?.length ?? 0) === 0')
    expect(page).toContain('getAvailable(product, orders) < product.stockMinimo')
    expect(page).not.toMatch(/\bsetStock|stock\s*=/)
  })

  it('separa stock, reservado y disponible en columnas derivadas', () => {
    expect(page).toContain('<th>Reservado</th>')
    expect(page).toContain('<th>Disponible</th>')
    expect(page).toContain('getReserved(product.id, orders)')
    expect(page).toContain('getAvailable(product, orders)')
  })

  it('permite subir varias fotos, elegir la principal y borrarlas al guardar', () => {
    expect(page).toContain('accept="image/*" multiple')
    expect(page).toContain('moverFoto(fotoActual, -1)')
    expect(page).toContain('moverFoto(fotoActual, 1)')
    expect(page).toContain("index === 0 ? 'Principal'")
    expect(page).toContain('if (!isRemoteImage(id)) setFotosEliminadas')
    expect(page).toContain('deleteImage(id).catch(() => undefined)')
    expect(page).toContain('fotosNuevas.map((id) => deleteImage(id)')
    expect(adminCss).toContain('.admin-gallery')
    expect(adminCss).toContain('.admin-store-photo__tag')
  })

  it('registra movimientos rápidos con la misma regla que el kardex', () => {
    expect(page).toContain('MOTIVOS_BY_TYPE[movTipo]')
    expect(page).toContain('validateMovementQuantity(movTipo, cantidad, disponible)')
    expect(page).toContain('applyMovement(movTarget, input)')
    expect(page).toContain('addMovement({ ...input, usuario: who })')
    expect(page).toContain("denyReason('registrar:movimiento')")
    expect(page).toContain('Stock inicial')
  })

  it('incluye y restaura las fotos subidas en el respaldo', () => {
    expect(settings).toContain('getImages([...ids])')
    expect(settings).toContain('isRemoteImage(comprobante)')
    expect(settings).toContain('restoreImages(data.fotos ?? {})')
    expect(settings).toContain('fotosRestauradas')
    expect(settings).toContain('Los respaldos')
  })
})
