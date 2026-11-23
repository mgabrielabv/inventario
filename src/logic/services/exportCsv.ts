/** CSV con BOM para que Excel respete los acentos en es-VE. */
export const toCsv = (headers: string[], rows: Array<Array<string | number>>): string => {
  const escape = (value: string | number): string => {
    const text = String(value ?? '')
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [headers, ...rows].map((row) => row.map(escape).join(';')).join('\r\n')
}

export const downloadFile = (filename: string, content: string, type: string): void => {
  const blob = new Blob([`\uFEFF${content}`], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const exportCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>): void =>
  downloadFile(filename, toCsv(headers, rows), 'text/csv;charset=utf-8')

/** Plantilla para importar productos. */
export const productTemplate = (): void =>
  exportCsv('plantilla-productos.csv',
    ['codigo', 'nombre', 'categoria', 'unidad', 'stockInicial', 'stockMinimo', 'precio', 'ubicacion'],
    [['EJ-001', 'Ejemplo', 'Otras', 'unidad', 0, 5, 10, 'A-01']])

export const parseCsv = (source: string): string[][] => {
  const rows: string[][] = []
  let field = '', row: string[] = [], quoted = false
  const text = source.replace(/^\uFEFF/, '')
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1 }
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ';' || char === ',') { row.push(field); field = '' }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (char !== '\r') field += char
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}
