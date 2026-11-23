import type { Product } from '../types'
import { getProductStatus } from './stock'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const ROW_HEIGHT = 18

type Rgb = readonly [number, number, number]

const INK: Rgb = [0.165, 0.039, 0.031]
const INK_SUBTLE: Rgb = [0.435, 0.294, 0.263]
const BURGUNDY: Rgb = [0.537, 0, 0]
const CREAM: Rgb = [1, 0.957, 0.929]
const SURFACE: Rgb = [1, 0.976, 0.961]
const LINE: Rgb = [0.86, 0.78, 0.74]
const GOLD: Rgb = [0.478, 0.329, 0.133]
const GREEN: Rgb = [0.31, 0.36, 0.216]

export interface PdfReportOptions {
  title: string
  subtitle?: string
  products: Product[]
  notes?: string[]
}

const CP1252: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89,
  'Š': 0x8a,
  '‹': 0x8b,
  'Œ': 0x8c,
  'Ž': 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9a,
  '›': 0x9b,
  'œ': 0x9c,
  'ž': 0x9e,
  'Ÿ': 0x9f,
  '\u202f': 0x20,
  '\u00a0': 0x20,
}

const escapeText = (value: string): string => {
  let output = ''
  for (const char of value) {
    const code = CP1252[char] ?? char.codePointAt(0) ?? 63
    if (code === 40 || code === 41 || code === 92) {
      output += `\\${String.fromCharCode(code)}`
    } else if (code >= 32 && code <= 126) {
      output += String.fromCharCode(code)
    } else {
      output += `\\${Math.max(0, Math.min(255, code)).toString(8).padStart(3, '0')}`
    }
  }
  return output
}

const color = (rgb: Rgb): string => `${rgb[0]} ${rgb[1]} ${rgb[2]}`

const truncate = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const buildPdf = (options: PdfReportOptions): string => {
  const { title, subtitle, products, notes = [] } = options
  const pages: string[][] = [[]]
  let page = pages[0]!
  let y = PAGE_HEIGHT - MARGIN

  const text = (
    value: string,
    x: number,
    baseline: number,
    size: number,
    font: 'F1' | 'F2' | 'F3' | 'F4' | 'F5',
    rgb: Rgb,
    align: 'left' | 'right' = 'left',
  ) => {
    const approxWidth = value.length * size * (font === 'F3' ? 0.6 : 0.48)
    const startX = align === 'right' ? x - approxWidth : x
    page.push(
      `BT /${font} ${size} Tf ${color(rgb)} rg 1 0 0 1 ${startX.toFixed(2)} ${baseline.toFixed(2)} Tm (${escapeText(value)}) Tj ET`,
    )
  }

  const line = (x1: number, y1: number, x2: number, y2: number, width = 0.5) => {
    page.push(
      `${color(LINE)} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
    )
  }

  const rect = (x: number, top: number, width: number, height: number, rgb: Rgb) => {
    page.push(`${color(rgb)} rg ${x.toFixed(2)} ${(top - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`)
  }

  const drawTableHeader = (baseline: number) => {
    rect(MARGIN, baseline + 6, CONTENT_WIDTH, 20, CREAM)
    text('CÓDIGO', 54, baseline, 7, 'F2', INK_SUBTLE)
    text('PRODUCTO', 112, baseline, 7, 'F2', INK_SUBTLE)
    text('CATEGORÍA', 306, baseline, 7, 'F2', INK_SUBTLE)
    text('CANT.', 452, baseline, 7, 'F2', INK_SUBTLE, 'right')
    text('ESTADO', 548, baseline, 7, 'F2', INK_SUBTLE, 'right')
  }

  const drawPageChrome = () => {
    rect(0, PAGE_HEIGHT, PAGE_WIDTH, 6, BURGUNDY)
    text('INVENTARIO', MARGIN, PAGE_HEIGHT - 42, 7.5, 'F2', BURGUNDY)
    text('Sistema de Control e Inventario', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 42, 7.5, 'F1', INK_SUBTLE, 'right')
  }

  drawPageChrome()

  y = PAGE_HEIGHT - 82
  text(title, MARGIN, y, 24, 'F5', INK)
  y -= 18

  if (subtitle) {
    text(subtitle, MARGIN, y, 9, 'F1', INK_SUBTLE)
    y -= 13
  }

  text(
    `Generado el ${new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}`,
    MARGIN,
    y,
    9,
    'F1',
    INK_SUBTLE,
  )
  y -= 12

  for (const note of notes) {
    text(note, MARGIN, y, 8, 'F1', INK_SUBTLE)
    y -= 11
  }

  y -= 8
  line(MARGIN, y, PAGE_WIDTH - MARGIN, y, 0.8)
  y -= 18

  const startTable = () => {
    drawTableHeader(y)
    y -= ROW_HEIGHT
  }

  startTable()

  products.forEach((product, index) => {
    if (y < MARGIN + 44) {
      page = []
      pages.push(page)
      drawPageChrome()
      y = PAGE_HEIGHT - 60
      text(`${title} · continuación`, MARGIN, y, 9, 'F2', BURGUNDY)
      y -= 22
      startTable()
    }

    if (index % 2 === 1) {
      rect(MARGIN, y + 6, CONTENT_WIDTH, ROW_HEIGHT, SURFACE)
    }

    const status = getProductStatus(product)
    const statusColor =
      status.status === 'agotado' || status.status === 'critico'
        ? BURGUNDY
        : status.status === 'bajo'
          ? GOLD
          : GREEN

    text(truncate(product.codigo, 9), 54, y, 8, 'F3', INK)
    text(truncate(product.nombre, 38), 112, y, 8, 'F1', INK)
    text(truncate(product.categoria, 19), 306, y, 8, 'F1', INK_SUBTLE)
    text(String(product.stock), 452, y, 8, 'F3', INK, 'right')
    text(status.label.toUpperCase(), 548, y, 7.5, 'F2', statusColor, 'right')

    line(MARGIN, y - 5, PAGE_WIDTH - MARGIN, y - 5, 0.4)
    y -= ROW_HEIGHT
  })

  const pageContents = pages.map((content, index) => {
    content.push(
      `BT /F1 7.5 Tf ${color(INK_SUBTLE)} rg 1 0 0 1 ${MARGIN} ${MARGIN - 14} Tm (${escapeText(
        'INVENTARIO · Documento interno',
      )}) Tj ET`,
    )
    const label = `Página ${index + 1} de ${pages.length}`
    const approxWidth = label.length * 7.5 * 0.48
    content.push(
      `BT /F1 7.5 Tf ${color(INK_SUBTLE)} rg 1 0 0 1 ${(PAGE_WIDTH - MARGIN - approxWidth).toFixed(2)} ${
        MARGIN - 14
      } Tm (${escapeText(label)}) Tj ET`,
    )
    return content.join('\n')
  })

  const objects: string[] = []
  const addObject = (body: string): number => {
    objects.push(body)
    return objects.length
  }

  addObject('<< /Type /Catalog /Pages 2 0 R >>')
  addObject('PLACEHOLDER_PAGES')

  const fonts: Array<readonly [string, string]> = [
    ['F1', 'Helvetica'],
    ['F2', 'Helvetica-Bold'],
    ['F3', 'Courier'],
    ['F4', 'Helvetica-Oblique'],
    ['F5', 'Times-Bold'],
  ]

  for (const [, baseFont] of fonts) {
    addObject(
      `<< /Type /Font /Subtype /Type1 /BaseFont /${baseFont} /Encoding /WinAnsiEncoding >>`,
    )
  }

  const fontResources = fonts.map(([id], index) => `/${id} ${3 + index} 0 R`).join(' ')

  const pageObjectIds: number[] = []
  for (const content of pageContents) {
    const contentId = addObject(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    )
    const pageId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << ${fontResources} >> >> /Contents ${contentId} 0 R >>`,
    )
    pageObjectIds.push(pageId)
  }

  objects[1] =
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = new Array(objects.length + 1).fill(0)

  objects.forEach((body, index) => {
    offsets[index + 1] = pdf.length
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return pdf
}

const toBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(new ArrayBuffer(value.length))
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff
  }
  return bytes
}

export const exportInventoryPdf = ({
  title,
  subtitle,
  products,
  notes = [],
}: PdfReportOptions): void => {
  const pdf = buildPdf({ title, subtitle, products, notes })
  const blob = new Blob([toBytes(pdf)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `reporte-${slugify(title)}-${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
