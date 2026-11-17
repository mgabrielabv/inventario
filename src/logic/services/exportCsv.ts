export interface CsvColumn {
  header: string
  value: (row: string[]) => string
}

const escapeCell = (value: string): string => {
  if (/[";\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export const buildCsv = (headers: string[], rows: string[][]): string =>
  [headers, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell)).join(';'))
    .join('\r\n')

export const downloadCsv = (filename: string, headers: string[], rows: string[][]): void => {
  const csv = `\uFEFF${buildCsv(headers, rows)}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
