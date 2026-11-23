import { useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Segmented } from '../../components/ui/Segmented'
import { RollingNumber } from '../../motion/components/RollingNumber'
import { Reveal } from '../../motion/components/Reveal'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../app/providers/auth-provider'
import { formatShortDate, formatTime } from '../../logic/services/formatters'
import { exportCsv } from '../../logic/services/exportCsv'
import { denyReason } from '../../logic/services/permissions'
import { formatMoney } from '../../logic/services/pricing'
import { getCategoryStock, getInventorySummary } from '../../logic/services/stock'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { ACTIVE_ORDER_STATUSES } from '../../logic/types'

type Rango = 'todos' | '7' | '30'

const RANGOS: Array<{ value: Rango; label: string }> = [
  { value: 'todos', label: 'Todo' },
  { value: '7', label: '7 días' },
  { value: '30', label: '30 días' },
]

const fileStamp = (): string => new Date().toISOString().slice(0, 10)

export const AdminReportsPage = () => {
  const { can } = useAuth()
  const { toast } = useToast()
  const products = useInventoryStore((state) => state.products)
  const movements = useInventoryStore((state) => state.movements)
  const orders = useOrdersStore((state) => state.orders)
  const [rango, setRango] = useState<Rango>('todos')
  const [hoy] = useState(() => Date.now())

  const resumen = useMemo(
    () => getInventorySummary(products, movements, orders),
    [products, movements, orders],
  )
  const categorias = useMemo(() => getCategoryStock(products), [products])
  const peak = Math.max(1, ...categorias.map((item) => item.units))

  const desde = useMemo(
    () => rango === 'todos' ? null : hoy - Number(rango) * 86_400_000,
    [rango, hoy],
  )
  const movimientosPeriodo = useMemo(
    () => desde === null ? movements
      : movements.filter((movement) => new Date(movement.fecha).getTime() >= desde),
    [movements, desde],
  )
  const pedidosPeriodo = useMemo(
    () => desde === null ? orders
      : orders.filter((order) => new Date(order.fecha).getTime() >= desde),
    [orders, desde],
  )
  const facturado = pedidosPeriodo
    .filter((order) => order.estado !== 'Cancelado')
    .reduce((sum, order) => sum + order.total, 0)
  const pendientes = orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.estado)).length

  const exportarMovimientos = () => {
    exportCsv(
      `movimientos-${fileStamp()}.csv`,
      ['fecha', 'producto', 'tipo', 'cantidad', 'motivo', 'referencia', 'usuario'],
      movimientosPeriodo.map((movement) => [
        `${formatShortDate(movement.fecha)} ${formatTime(movement.fecha)}`,
        movement.productoNombre, movement.tipo, movement.cantidad, movement.motivo,
        movement.referencia, movement.usuario,
      ]),
    )
    toast('CSV de movimientos descargado')
  }

  const exportarProductos = () => {
    exportCsv(
      `productos-${fileStamp()}.csv`,
      ['codigo', 'nombre', 'categoria', 'unidad', 'ubicacion', 'stock', 'minimo', 'objetivo', 'costo', 'precio'],
      products.map((product) => [
        product.codigo, product.nombre, product.categoria, product.unidad, product.ubicacion,
        product.stock, product.stockMinimo, product.stockObjetivo,
        product.costo ?? '', product.precio ?? '',
      ]),
    )
    toast('CSV de productos descargado')
  }

  const exportarPedidos = () => {
    exportCsv(
      `pedidos-${fileStamp()}.csv`,
      ['codigo', 'fecha', 'cliente', 'telefono', 'estado', 'lineas', 'envio', 'total', 'pago'],
      pedidosPeriodo.map((order) => [
        order.codigo, formatShortDate(order.fecha), order.cliente.nombre, order.cliente.telefono,
        order.estado, order.lineas.reduce((sum, line) => sum + line.cantidad, 0),
        order.envio, order.total, order.pago.metodo,
      ]),
    )
    toast('CSV de pedidos descargado')
  }

  return (
    <div className="admin-page container-admin">
      <header className="admin-page-head">
        <div className="col">
          <p className="t-min t-muted">Indicadores y exportación</p>
          <h1 className="t-ui t-strong">Reportes</h1>
          <p className="t-caption">Cifras del inventario y los pedidos. La exportación está reservada al administrador.</p>
        </div>
        <div className="admin-actions admin-actions--wrap">
          <Segmented value={rango} options={RANGOS} onChange={setRango} label="Rango de fechas" size="sm" />
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            <Printer size={16} strokeWidth={1.5} />Imprimir
          </Button>
        </div>
      </header>

      <Reveal className="admin-kpi-grid">
        <article className="kpi-card">
          <span className="kpi-label">Unidades en stock</span>
          <div className="kpi-value"><RollingNumber value={resumen.units} /></div>
          <p className="kpi-detail">{resumen.activeProducts} productos activos</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Valor del inventario</span>
          <div className="kpi-value"><RollingNumber value={formatMoney(resumen.value ?? 0)} /></div>
          <p className="kpi-detail">Según costo registrado</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Movimientos del periodo</span>
          <div className="kpi-value"><RollingNumber value={movimientosPeriodo.length} /></div>
          <p className="kpi-detail">
            {movimientosPeriodo.filter((movement) => movement.tipo === 'Entrada').length} entradas ·
            {' '}{movimientosPeriodo.filter((movement) => movement.tipo === 'Salida').length} salidas
          </p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Pedidos del periodo</span>
          <div className="kpi-value"><RollingNumber value={pedidosPeriodo.length} /></div>
          <p className="kpi-detail">{pendientes} activos ahora</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Facturación del periodo</span>
          <div className="kpi-value"><RollingNumber value={formatMoney(facturado)} /></div>
          <p className="kpi-detail">Sin pedidos cancelados</p>
        </article>
      </Reveal>

      <Reveal className="admin-panel">
        <div className="admin-panel__head">
          <div>
            <h2 className="t-ui t-strong">Existencias por categoría</h2>
            <p className="t-min t-muted">Unidades y valor según el costo de cada producto</p>
          </div>
        </div>
        {categorias.length === 0 ? (
          <EmptyState compact title="Sin categorías" description="Aún no hay productos activos para resumir." />
        ) : (
          <ul className="admin-category-bars">
            {categorias.map((item) => (
              <li className="admin-category-row" key={item.categoria}>
                <div className="admin-category-row__head">
                  <span className="t-mid">{item.categoria}</span>
                  <span className="t-min t-muted">
                    {item.products} productos · {formatMoney(item.value)}
                  </span>
                </div>
                <div className="admin-category-track">
                  <div className="admin-category-fill"
                    style={{ width: `${Math.max(2, Math.round((item.units / peak) * 100))}%` }} />
                </div>
                <span className="t-min t-muted t-num">{item.units} unidades</span>
              </li>
            ))}
          </ul>
        )}
      </Reveal>

      <Reveal className="admin-panel">
        <div className="admin-panel__head">
          <div>
            <h2 className="t-ui t-strong">Exportar datos</h2>
            <p className="t-min t-muted">Archivos CSV con separador punto y coma, listos para Excel.</p>
          </div>
        </div>
        {!can('exportar:reportes') && <p className="inline-note">{denyReason('exportar:reportes')}</p>}
        <div className="admin-export-grid">
          <div className="admin-export-card">
            <div className="col">
              <span className="t-mid">Movimientos</span>
              <span className="t-caption">{movimientosPeriodo.length} registros del periodo</span>
            </div>
            <Button size="sm" variant="secondary" disabled={!can('exportar:reportes')} onClick={exportarMovimientos}>
              Descargar
            </Button>
          </div>
          <div className="admin-export-card">
            <div className="col">
              <span className="t-mid">Productos</span>
              <span className="t-caption">{products.length} fichas</span>
            </div>
            <Button size="sm" variant="secondary" disabled={!can('exportar:reportes')} onClick={exportarProductos}>
              Descargar
            </Button>
          </div>
          <div className="admin-export-card">
            <div className="col">
              <span className="t-mid">Pedidos</span>
              <span className="t-caption">{pedidosPeriodo.length} registros del periodo</span>
            </div>
            <Button size="sm" variant="secondary" disabled={!can('exportar:reportes')} onClick={exportarPedidos}>
              Descargar
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
