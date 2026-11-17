import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../app/providers/auth-provider'
import { useInventoryStore } from '../../logic/store/inventory'
import {
  filterReportProducts,
  getProductStatus,
  groupMovementsByDate,
} from '../../logic/store/selectors'
import {
  formatGroupDate,
  formatNumber,
  formatRelativeTime,
  pluralize,
} from '../../logic/services/formatters'
import { useExportCsv, useExportPdf } from '../../logic/hooks/useExportPdf'
import { CATEGORIES, type CategoryFilter, type ProductStatus } from '../../logic/types'
import { StatusBadge } from '../../components/ui/status-badge'
import { EmptyState } from '../../components/ui/empty-state'
import { PageTitle } from '../../components/ui/page-title'
import { Stamp } from '../../components/ui/stamp'
import { BarcodeScan } from '../../components/illustrations/barcode-scan'
import { EASE_OUT } from '../../components/illustrations/motion'

type ReportId = 'stock' | 'movimientos' | 'fecha' | 'top'

const REPORTS = [
  { id: 'stock', label: 'Stock actual' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'fecha', label: 'Por fecha' },
  { id: 'top', label: 'Más movidos' },
] as const

const STATUS_OPTIONS = ['Todos', 'Normal', 'Bajo', 'Crítico'] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

interface ReportColumn {
  key: string
  label: string
  align?: 'right'
}

interface ReportCell {
  key: string
  content: string
  tone?: 'in' | 'out'
  status?: ProductStatus
  strong?: boolean
  mono?: boolean
}

interface ReportRow {
  id: string
  cells: ReportCell[]
}

interface ReportView {
  title: string
  caption: string
  columns: ReportColumn[]
  rows: ReportRow[]
}

const todaySlug = (): string => new Date().toISOString().slice(0, 10)

export const ReportesPage = () => {
  const { canAccessReports } = useAuth()
  const products = useInventoryStore((state) => state.products)
  const movements = useInventoryStore((state) => state.movements)
  const exportPdf = useExportPdf()
  const exportCsv = useExportCsv()

  const [activeReport, setActiveReport] = useState<ReportId>('stock')
  const [category, setCategory] = useState<CategoryFilter>('Todas')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')

  const productCategory = useMemo(
    () => new Map(products.map((product) => [product.id, product.categoria])),
    [products],
  )

  const filteredProducts = useMemo(
    () => filterReportProducts(products, category, statusFilter),
    [products, category, statusFilter],
  )

  const filteredMovements = useMemo(
    () =>
      movements.filter((movement) => {
        if (category === 'Todas') return true
        return productCategory.get(movement.productoId) === category
      }),
    [movements, category, productCategory],
  )

  const view = useMemo<ReportView>(() => {
    if (activeReport === 'stock') {
      return {
        title: 'Stock actual',
        caption: `${filteredProducts.length} ${pluralize(filteredProducts.length, 'producto', 'productos')} · ${formatNumber(
          filteredProducts.reduce((sum, product) => sum + product.cantidad, 0),
        )} unidades`,
        columns: [
          { key: 'codigo', label: 'Código' },
          { key: 'producto', label: 'Producto' },
          { key: 'categoria', label: 'Categoría' },
          { key: 'cantidad', label: 'Cantidad', align: 'right' },
          { key: 'estado', label: 'Estado' },
        ],
        rows: filteredProducts.map((product) => ({
          id: `stock-${product.id}`,
          cells: [
            { key: 'codigo', content: product.codigo, mono: true },
            { key: 'producto', content: product.producto, strong: true },
            { key: 'categoria', content: product.categoria },
            { key: 'cantidad', content: formatNumber(product.cantidad), mono: true },
            {
              key: 'estado',
              content: getProductStatus(product.cantidad).label,
              status: getProductStatus(product.cantidad).status,
            },
          ],
        })),
      }
    }

    if (activeReport === 'movimientos') {
      return {
        title: 'Libro de movimientos',
        caption: `${filteredMovements.length} ${pluralize(
          filteredMovements.length,
          'registro',
          'registros',
        )} · todo lo que entró y salió`,
        columns: [
          { key: 'fecha', label: 'Fecha' },
          { key: 'producto', label: 'Producto' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'cantidad', label: 'Cantidad', align: 'right' },
          { key: 'usuario', label: 'Firmado por' },
        ],
        rows: filteredMovements.map((movement) => {
          const isIn = movement.tipo === 'Entrada'
          return {
            id: `movement-${movement.id}`,
            cells: [
              { key: 'fecha', content: formatRelativeTime(movement.fecha), mono: true },
              { key: 'producto', content: movement.producto, strong: true },
              { key: 'tipo', content: movement.tipo },
              {
                key: 'cantidad',
                content: `${isIn ? '+' : '−'}${formatNumber(movement.cantidad)}`,
                tone: isIn ? 'in' : 'out',
                mono: true,
              },
              { key: 'usuario', content: movement.usuario, mono: true },
            ],
          }
        }),
      }
    }

    if (activeReport === 'fecha') {
      const groups = groupMovementsByDate(filteredMovements)
      return {
        title: 'Movimientos por fecha',
        caption: `${groups.length} ${pluralize(groups.length, 'jornada', 'jornadas')} con actividad`,
        columns: [
          { key: 'fecha', label: 'Fecha' },
          { key: 'registros', label: 'Registros', align: 'right' },
          { key: 'entradas', label: 'Entradas', align: 'right' },
          { key: 'salidas', label: 'Salidas', align: 'right' },
          { key: 'balance', label: 'Balance', align: 'right' },
        ],
        rows: groups.map((group) => {
          const entradas = group.movements
            .filter((movement) => movement.tipo === 'Entrada')
            .reduce((sum, movement) => sum + movement.cantidad, 0)
          const salidas = group.movements
            .filter((movement) => movement.tipo === 'Salida')
            .reduce((sum, movement) => sum + movement.cantidad, 0)
          const balance = entradas - salidas
          return {
            id: `date-${group.date}`,
            cells: [
              { key: 'fecha', content: formatGroupDate(group.movements[0]?.fecha ?? ''), strong: true },
              { key: 'registros', content: formatNumber(group.movements.length), mono: true },
              { key: 'entradas', content: `+${formatNumber(entradas)}`, tone: 'in', mono: true },
              { key: 'salidas', content: `−${formatNumber(salidas)}`, tone: 'out', mono: true },
              {
                key: 'balance',
                content: `${balance >= 0 ? '+' : '−'}${formatNumber(Math.abs(balance))}`,
                tone: balance >= 0 ? 'in' : 'out',
                mono: true,
              },
            ],
          }
        }),
      }
    }

    const totals = new Map<number, { producto: string; units: number; count: number }>()
    for (const movement of filteredMovements) {
      const entry = totals.get(movement.productoId) ?? {
        producto: movement.producto,
        units: 0,
        count: 0,
      }
      entry.units += movement.cantidad
      entry.count += 1
      totals.set(movement.productoId, entry)
    }

    const ranking = Array.from(totals.values()).sort((a, b) => b.units - a.units)

    return {
      title: 'Productos más movidos',
      caption: `${ranking.length} ${pluralize(ranking.length, 'producto', 'productos')} con rotación`,
      columns: [
        { key: 'puesto', label: '#' },
        { key: 'producto', label: 'Producto' },
        { key: 'registros', label: 'Movimientos', align: 'right' },
        { key: 'unidades', label: 'Unidades movidas', align: 'right' },
      ],
      rows: ranking.map((entry, index) => ({
        id: `top-${entry.producto}`,
        cells: [
          { key: 'puesto', content: String(index + 1).padStart(2, '0'), mono: true },
          { key: 'producto', content: entry.producto, strong: true },
          { key: 'registros', content: formatNumber(entry.count), mono: true },
          { key: 'unidades', content: formatNumber(entry.units), mono: true },
        ],
      })),
    }
  }, [activeReport, filteredMovements, filteredProducts])

  const handleExportCsv = () => {
    exportCsv(
      `reporte-${activeReport}-${todaySlug()}.csv`,
      view.columns.map((column) => column.label),
      view.rows.map((row) => row.cells.map((cell) => cell.content)),
    )
    toast.success('CSV descargado')
  }

  const handleExportPdf = () => {
    exportPdf({
      title: view.title,
      subtitle: `${view.caption} · ${category === 'Todas' ? 'Todas las categorías' : category}`,
      products: filteredProducts,
      notes: [
        'Documento generado desde el módulo de cuentas.',
        `Filtro de estado: ${statusFilter}.`,
      ],
    })
    toast.success('PDF descargado')
  }

  if (!canAccessReports) {
    return (
      <div className="page reportes">
        <header className="page-head">
          <div className="page-head__main">
            <PageTitle lines={['LAS CUENTAS']} />
            <p className="page-head__sub">Los números completos quedan bajo llave.</p>
          </div>
        </header>
        <div className="report-locked">
          <Stamp tilt="left">Solo administrador</Stamp>
          <p className="report-locked__icon" aria-hidden="true">
            <Lock size={22} strokeWidth={1.8} />
          </p>
          <h2 className="report-locked__title">Esta página no se abre con tu llave</h2>
          <p className="report-locked__text">
            Exportar y revisar los informes está reservado al rol Administrador. Puedes
            consultar el inventario, anotar movimientos y revisar alertas.
          </p>
          <Link className="btn btn--outline" to="/">
            Volver a hoy
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page reportes">
      <header className="page-head">
        <div className="page-head__main">
          <PageTitle lines={['LAS CUENTAS']} />
          <p className="page-head__sub">
            Lo que hay, lo que se movió y lo que más rota. Para decidir sin adivinar.
          </p>
        </div>
        <div className="page-head__aside">
          <div className="page-head__stat">
            <span className="page-head__stat-value">{formatNumber(products.length)}</span>
            <span className="page-head__stat-label">Productos</span>
          </div>
          <div className="page-head__stat">
            <span className="page-head__stat-value">{formatNumber(movements.length)}</span>
            <span className="page-head__stat-label">Movimientos</span>
          </div>
        </div>
      </header>

      <div className="filter-bar report-tabs" role="tablist" aria-label="Tipo de informe">
        {REPORTS.map((report) => {
          const isActive = activeReport === report.id
          return (
            <button
              key={report.id}
              type="button"
              role="tab"
              id={`report-tab-${report.id}`}
              aria-selected={isActive}
              aria-controls="report-panel"
              className={['filter-tab', isActive ? 'filter-tab--active' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActiveReport(report.id)}
            >
              {report.label}
            </button>
          )
        })}
      </div>

      <motion.section
        className="report-panel"
        id="report-panel"
        role="tabpanel"
        aria-labelledby={`report-tab-${activeReport}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        <div className="report-head">
          <div>
            <h2 className="report-head__title">{view.title}</h2>
            <p className="report-head__caption">{view.caption}</p>
          </div>

          <div className="report-toolbar">
            <div className="report-toolbar__filters">
              <label className="visually-hidden" htmlFor="report-category">
                Categoría
              </label>
              <select
                id="report-category"
                className="report-toolbar__select"
                value={category}
                onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              >
                <option value="Todas">Todas las categorías</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              {activeReport === 'stock' && (
                <>
                  <label className="visually-hidden" htmlFor="report-status">
                    Estado
                  </label>
                  <select
                    id="report-status"
                    className="report-toolbar__select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option === 'Todos' ? 'Todos los estados' : option}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div className="report-toolbar__actions">
              <button type="button" className="btn btn--outline btn--sm" onClick={handleExportCsv}>
                <Download size={15} strokeWidth={1.8} aria-hidden="true" />
                CSV
              </button>
              <button type="button" className="btn btn--primary btn--sm" onClick={handleExportPdf}>
                <Download size={15} strokeWidth={1.8} aria-hidden="true" />
                PDF
              </button>
            </div>
          </div>
        </div>

        {view.rows.length === 0 ? (
          <EmptyState
            illustration={<BarcodeScan />}
            stamp="Sin datos"
            title="Este informe está vacío."
            description="Cambia los filtros o anota movimientos para que la cuenta tenga contenido."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table ledger" aria-label={view.title}>
              <thead>
                <tr>
                  {view.columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={column.align === 'right' ? 'is-right' : undefined}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.rows.map((row) => (
                  <tr key={row.id}>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.key}
                        className={[
                          cell.mono ? 'cell-amount' : '',
                          cell.strong ? 'cell-strong' : '',
                          cell.tone === 'in' ? 'cell-amount--in' : '',
                          cell.tone === 'out' ? 'cell-amount--out' : '',
                          cell.key === 'fecha' ? 'cell-muted' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {cell.status ? (
                          <StatusBadge status={cell.status} />
                        ) : (
                          cell.content
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </div>
  )
}
