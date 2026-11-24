import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { Segmented } from '../../components/ui/Segmented'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../app/providers/auth-provider'
import { logActivity } from '../../logic/services/audit'
import { errorMessage } from '../../logic/errors'
import { formatPhoneDisplay, formatShortDate, formatTime } from '../../logic/services/formatters'
import { getImage } from '../../logic/services/images'
import { denyReason } from '../../logic/services/permissions'
import { formatMoney, formatSecondary } from '../../logic/services/pricing'
import { getAvailable } from '../../logic/services/stock'
import { nextStatus, nextStatusLabel } from '../../logic/services/orders'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import { ACTIVE_ORDER_STATUSES, type Order, type OrderStatus, type PaymentMethod } from '../../logic/types'

type OrderFilter = 'Todos' | OrderStatus

const FILTROS: Array<{ value: OrderFilter; label: string }> = [
  { value: 'Todos', label: 'Todos' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Confirmado', label: 'Confirmado' },
  { value: 'Preparando', label: 'Preparando' },
  { value: 'Listo', label: 'Listo' },
  { value: 'Entregado', label: 'Entregado' },
  { value: 'Cancelado', label: 'Cancelado' },
]

const PAGOS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  movil: 'Pago móvil',
  'tarjeta-demo': 'Tarjeta (demo)',
}

const reservedUnits = (order: Order): number =>
  ACTIVE_ORDER_STATUSES.includes(order.estado)
    ? order.lineas.reduce((sum, line) => sum + line.cantidad, 0)
    : 0

export const AdminOrdersPage = () => {
  const { can, user } = useAuth()
  const { toast } = useToast()
  const orders = useOrdersStore((state) => state.orders)
  const setStatus = useOrdersStore((state) => state.setStatus)
  const verifyPayment = useOrdersStore((state) => state.verifyPayment)
  const products = useInventoryStore((state) => state.products)
  const settings = useSettingsStore((state) => state.settings)

  const [filter, setFilter] = useState<OrderFilter>('Todos')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [comprobante, setComprobante] = useState<string | null>(null)

  const comprobanteId = orders.find((order) => order.id === detailId)?.pago.comprobante
  useEffect(() => {
    let alive = true
    if (comprobanteId) {
      getImage(comprobanteId).then((url) => { if (alive) setComprobante(url) })
    } else setComprobante(null)
    return () => { alive = false }
  }, [comprobanteId])

  const list = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.fecha.localeCompare(a.fecha))
    return filter === 'Todos' ? sorted : sorted.filter((order) => order.estado === filter)
  }, [orders, filter])
  const selected = orders.find((order) => order.id === detailId) ?? null
  const next = selected ? nextStatus(selected.estado) : null
  const secondary = selected ? formatSecondary(selected.total, settings) : null

  const avanzar = () => {
    if (!selected || !next || !can('avanzar:pedido')) return
    try {
      setStatus(selected.id, next, user?.name ?? 'sistema')
      logActivity(user?.name ?? 'sistema', 'Pedido avanzado', `${selected.codigo} → ${next}`)
      toast(next === 'Entregado'
        ? 'Pedido entregado: se generaron salidas por Venta y bajó el stock real'
        : `Pedido ${selected.codigo} pasó a ${next}`)
    } catch (cause) {
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  const verificar = () => {
    if (!selected || !can('verificar:pago')) return
    verifyPayment(selected.id, user?.name ?? 'sistema')
    logActivity(user?.name ?? 'sistema', 'Pago verificado', selected.codigo)
    toast('Pago verificado')
  }

  const cancelar = () => {
    if (!selected || !can('cancelar:pedido')) return
    try {
      setStatus(selected.id, 'Cancelado', user?.name ?? 'sistema', 'Cancelado desde el panel')
      logActivity(user?.name ?? 'sistema', 'Pedido cancelado', selected.codigo)
      toast('Pedido cancelado; las unidades reservadas quedaron libres')
      setCancelConfirm(false)
    } catch (cause) {
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  const openDetail = (id: string) => { setDetailId(id); setCancelConfirm(false) }

  return (
    <div className="admin-page container-admin">
      <header className="admin-page-head">
        <div className="col">
          <p className="t-min t-muted">Gestión de pedidos</p>
          <h1 className="t-ui t-strong">Pedidos</h1>
          <p className="t-caption">
            Los estados activos reservan unidades. Al entregar, el sistema registra salidas por Venta y descuenta el stock.
          </p>
        </div>
      </header>

      <Segmented value={filter} options={FILTROS} onChange={setFilter} label="Filtrar pedidos por estado" size="sm" />

      {list.length === 0 ? (
        <EmptyState title="No hay pedidos en este estado" description="Prueba con otro filtro." />
      ) : (
        <ul className="admin-order-list">
          {list.map((order) => {
            const reserved = reservedUnits(order)
            return (
              <li key={order.id}>
                <button type="button" className="admin-order-card" onClick={() => openDetail(order.id)}>
                  <span className="col">
                    <span className="order-code t-mid">{order.codigo}</span>
                    <span className="t-min t-muted">{formatShortDate(order.fecha)} · {formatTime(order.fecha)}</span>
                  </span>
                  <span className="col">
                    <span className="t-mid">{order.cliente.nombre}</span>
                    <span className="t-min t-muted">{formatPhoneDisplay(order.cliente.telefono)}</span>
                  </span>
                  <span className="col">
                    <span className="t-num t-mid">{formatMoney(order.total)}</span>
                    <span className="t-min t-muted">{order.lineas.length} líneas</span>
                  </span>
                  <span className="col admin-order-card__status">
                    <span className={`admin-order-status${ACTIVE_ORDER_STATUSES.includes(order.estado) ? ' is-active' : ''}`}>
                      {order.estado}
                    </span>
                    {reserved > 0 && <span className="t-min t-muted">{reserved} reservadas</span>}
                  </span>
                  <span className="admin-order-card__arrow" aria-hidden="true">›</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={Boolean(selected)} onClose={() => setDetailId(null)}
        title={selected ? `Pedido ${selected.codigo}` : 'Pedido'}>
        {selected && (
          <div className="admin-sheet-form">
            <div className="admin-detail-head">
              <span className={`admin-order-status${ACTIVE_ORDER_STATUSES.includes(selected.estado) ? ' is-active' : ''}`}>
                {selected.estado}
              </span>
              <span className="t-caption">{formatShortDate(selected.fecha)} · {formatTime(selected.fecha)}</span>
            </div>

            <section className="admin-detail-section">
              <h3 className="t-ui t-strong">Cliente y entrega</h3>
              <dl className="admin-detail-list">
                <div><dt>Nombre</dt><dd>{selected.cliente.nombre}</dd></div>
                <div><dt>Teléfono</dt><dd>{formatPhoneDisplay(selected.cliente.telefono)}</dd></div>
                {selected.cliente.email && <div><dt>Correo</dt><dd>{selected.cliente.email}</dd></div>}
                <div><dt>Entrega</dt><dd>{selected.entrega.tipo === 'delivery' ? 'Delivery' : 'Retiro en tienda'}</dd></div>
                {selected.entrega.zona && <div><dt>Zona</dt><dd>{selected.entrega.zona}</dd></div>}
                {selected.entrega.direccion && <div><dt>Dirección</dt><dd>{selected.entrega.direccion}</dd></div>}
                {selected.entrega.referencia && <div><dt>Referencia</dt><dd>{selected.entrega.referencia}</dd></div>}
                {selected.entrega.notas && <div><dt>Notas</dt><dd>{selected.entrega.notas}</dd></div>}
                {selected.ventana && <div><dt>Ventana</dt><dd>{selected.ventana}</dd></div>}
                {selected.nota && <div><dt>Nota del cliente</dt><dd>{selected.nota}</dd></div>}
              </dl>
            </section>

            <section className="admin-detail-section">
              <h3 className="t-ui t-strong">Productos</h3>
              <div className="table-wrap">
                <ResponsiveTable>
                  <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {selected.lineas.map((line) => {
                      const product = products.find((item) => item.id === line.productoId)
                      return (
                        <tr key={`${selected.id}-${line.productoId}`}>
                          <td>
                            <span className="t-mid">{line.nombre}</span>
                            <span className="product-code t-min t-muted"> · {line.codigo}</span>
                            {product && (
                              <span className="t-min t-muted"> · {getAvailable(product, orders)} disponibles</span>
                            )}
                          </td>
                          <td className="t-num">{line.cantidad}</td>
                          <td className="t-num">{formatMoney(line.precioUnit)}</td>
                          <td className="t-num t-mid">{formatMoney(line.precioUnit * line.cantidad)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </ResponsiveTable>
              </div>
              <div className="admin-totals">
                <div><span className="t-caption">Subtotal</span><span className="t-num">{formatMoney(selected.subtotal)}</span></div>
                {selected.descuento > 0 && (
                  <div className="is-discount">
                    <span className="t-caption">Descuento{selected.cupon ? ` · ${selected.cupon}` : ''}</span>
                    <span className="t-num">−{formatMoney(selected.descuento)}</span>
                  </div>
                )}
                <div><span className="t-caption">Envío</span><span className="t-num">{formatMoney(selected.envio)}</span></div>
                <div className="admin-totals__total"><span className="t-mid">Total</span><span className="t-num t-strong">{formatMoney(selected.total)}</span></div>
                {secondary && <p className="t-min t-muted">{secondary}</p>}
              </div>
            </section>

            <section className="admin-detail-section">
              <h3 className="t-ui t-strong">Pago</h3>
              <p className="t-caption">
                {PAGOS[selected.pago.metodo]}
                {selected.pago.referencia ? ` · Ref. ${selected.pago.referencia}` : ''}
                {' · '}{selected.pago.verificado ? 'Verificado' : 'Pendiente de verificación'}
              </p>
              {selected.pago.vuelto !== undefined && (
                <p className="t-caption">Vuelto solicitado: {formatMoney(selected.pago.vuelto, selected.moneda)}</p>
              )}
              {comprobante && (
                <div className="admin-comprobante">
                  <img src={comprobante} alt="Comprobante adjunto al pedido" />
                  <span className="t-min t-muted">Comprobante adjunto · pendiente de verificación</span>
                </div>
              )}
              {!selected.pago.verificado && !can('verificar:pago') && (
                <p className="t-min t-muted">{denyReason('verificar:pago')}</p>
              )}
              {!selected.pago.verificado && can('verificar:pago') && (
                <Button size="sm" variant="secondary" onClick={verificar}>Verificar pago</Button>
              )}
            </section>

            <section className="admin-detail-section">
              <h3 className="t-ui t-strong">Seguimiento</h3>
              <ol className="admin-timeline">
                {selected.historial.map((entry, index) => (
                  <li key={`${entry.fecha}-${index}`}>
                    <span className="admin-timeline__mark" aria-hidden="true" />
                    <div className="col">
                      <span className="t-mid">{entry.estado}</span>
                      <span className="t-min t-muted">
                        {formatShortDate(entry.fecha)} · {formatTime(entry.fecha)}
                        {entry.usuario ? ` · ${entry.usuario}` : ''}
                      </span>
                      {entry.nota && <span className="t-caption t-pretty">{entry.nota}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <p className="inline-note">
              Al marcar entregado se generan movimientos de salida por Venta y se descuenta el stock real de cada línea.
            </p>

            <div className="admin-sheet-actions admin-sheet-actions--wrap">
              {next && can('avanzar:pedido') && (
                <Button size="sm" onClick={avanzar}>{nextStatusLabel(selected.estado)}</Button>
              )}
              {ACTIVE_ORDER_STATUSES.includes(selected.estado) && can('cancelar:pedido') && (
                <Button size="sm" variant="tertiary" onClick={() => setCancelConfirm((value) => !value)}>
                  Cancelar pedido
                </Button>
              )}
              {ACTIVE_ORDER_STATUSES.includes(selected.estado) && !can('cancelar:pedido') && (
                <p className="t-min t-muted">{denyReason('cancelar:pedido')}</p>
              )}
            </div>
            {cancelConfirm && selected && can('cancelar:pedido') && (
              <div className="admin-confirm">
                <p className="t-min t-pretty">Se cerrará el pedido y se liberarán las unidades reservadas.</p>
                <div className="row">
                  <Button size="sm" variant="danger" onClick={cancelar}>Confirmar cancelación</Button>
                  <Button size="sm" variant="secondary" onClick={() => setCancelConfirm(false)}>Volver</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}
