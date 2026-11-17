import { useCallback } from 'react'
import { downloadCsv } from '../services/exportCsv'
import { exportInventoryPdf, type PdfReportOptions } from '../services/exportPdf'

export const useExportPdf = () => {
  return useCallback((options: PdfReportOptions) => {
    exportInventoryPdf(options)
  }, [])
}

export const useExportCsv = () => {
  return useCallback((filename: string, headers: string[], rows: string[][]) => {
    downloadCsv(filename, headers, rows)
  }, [])
}
