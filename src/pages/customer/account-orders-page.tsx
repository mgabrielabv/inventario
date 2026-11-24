import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCustomer } from '../../app/providers/customer-provider'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { Select } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { estimarEntrega } from '../../logic/services/delivery'
import { formatShortDate } from '../../logic/services/formatters'
import { formatMoney } from '../../logic/services/pricing'
import { getAvailable } from '../../logic/services/stock'
import { useCartStore } from '../../logic/store/cart'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import { ORDER_STATUSES, type CustomerAccount, type Order, type OrderStatus } from '../../logic/types'
import {
  AccountDemoNote, AccountLoading, AccountSignInPrompt, AccountTrackingBar,
} from './account-page'

type Filter = 'Todos' | OrderStatus

const accountOrders = (account: CustomerAccount, orders: Order[]): Order[] => {
  const email = account.email.toLowerCase()
  const phone = account.telefono.replace(/\D/g, '')
  return orders
    .filter((order) => order.clienteId === account.id
      || (order.cliente.email ?? '').toLowerCase() === email
      || (phone.length >= 10 && order.cliente.telefono.replace(/\D/g, '') === phone))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export const AccountOrdersPage = () => {
  const { codigo } = useParams<{ codigo: string }>()
  const navigate = useNavigate()
  const { account, isAuthenticated, ready } = useCustomer()
  const orders = useOrdersStore((state) => state.orders)
  const products = useInventoryStore((state) => state.products)
  const settings = useSettingsStore((state) => state.settings)
  const add = useCartStore((state) => state.add)
  const { toast } = useToast()
  const [filter, setFilter] = useState<Filter>('Todos')

  if (!ready) return <AccountLoading />
  if (!isAuthenticated || !account) return <AccountSignInPrompt />

  const mine = accountOrders(account, orders)

  const reorder = (order: Order) => {
    let skipped = 0
    const current = useCartStore.getState().lines
    for (const line of order.lineas) {
      const product = products.find((item) => item.id === line.productoId)
      if (!product || product.archivado || !product.publicado || product.precio === null) {
        skipped += 1
        continue
      }
      const inCart = current.find((item) => item.productoId === product.id)?.cantidad ?? 0
      const available = getAvailable(product, orders) - inCart
      const quantity = Math.min(line.cantidad, available)
      if (quantity > 0) add(product.id, quantity, product.precio)
      else skipped += 1
    }
    toast(skipped > 0
      ? 'Agregamos lo que aún está disponible. Algunos artículos ya no están.'
      : 'Agregamos el pedido a tu carrito.',
    { action: { label: 'Ver carrito', onClick: () => navigate('/carrito') } })
  }

  if (codigo) {
    const order = mine.find((item) => item.codigo === codigo)
    if (!order) {
      return (
        <div className="eshop-account-page container-store">
          <EmptyState
            title="No encontramos ese pedido"
            description="Puede que no esté asociado a tu cuenta."
            action={<Link className="btn btn--primary" to="/cuenta/pedidos">Volver a pedidos</Link>}
          />
          <AccountDemoNote />
        </div>
      )
    }
    const estimate = estimarEntrega(order.entrega, settings, new Date(order.fecha))
    return (
      <div className="eshop-account-page container-store">
        <Link className="eshop-account-back t-mid" to="/cuenta/pedidos">
          <ArrowLeft size={16} strokeWidth={1.6} aria-hidden="true" />
          Volver a pedidos
        </Link>

        <header className="eshop-account-head">
          <div>
            <p className="eshop-account-eyebrow t-min t-clay">Detalle del pedido</p>
            <h1 className="t-section">Pedido {order.codigo}</h1>
            <p className="t-subtitle">{formatShortDate(order.fecha)} · {formatMoney(order.total, order.moneda)}</p>
          </div>
          <Chip active={order.estado !== 'Cancelado'}>{order.estado}</Chip>
        </header>

        <section className="eshop-account-panel card" aria-label="Seguimiento del pedido">
          <AccountTrackingBar estado={order.estado} />
          <p className="t-caption">
            {order.estado === 'Cancelado'
              ? 'Este pedido se canceló y no tiene pasos pendientes.'
              : `${estimate.titulo}. Estimación orientativa para ${formatShortDate(estimate.fecha)}.`}
          </p>
        </section>

        <section className="eshop-account-panel card" aria-labelledby="order-detail-lines">
          <h2 id="order-detail-lines" className="t-ui t-strong">Lo que pediste</h2>
          <ul className="eshop-account-lines">
            {order.lineas.map((line) => (
              <li key={line.productoId}>
                <span className="t-mid">{line.nombre}</span>
                <span className="t-min t-muted">{line.codigo} · {line.cantidad} × {formatMoney(line.precioUnit)}</span>
                <span className="num t-mid">{formatMoney(line.precioUnit * line.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="eshop-account-total">
            <span className="t-mid">Total</span>
            <strong className="price">{formatMoney(order.total, order.moneda)}</strong>
          </div>
          <Button variant="secondary" size="sm" onClick={() => reorder(order)}>
            <RotateCcw size={15} strokeWidth={1.7} aria-hidden="true" />
            Volver a pedir
          </Button>
        </section>

        <AccountDemoNote />
      </div>
    )
  }

  const visible = filter === 'Todos' ? mine : mine.filter((order) => order.estado === filter)

  return (
    <div className="eshop-account-page container-store">
      <header className="eshop-account-head">
        <div>
          <p className="eshop-account-eyebrow t-min t-clay">Mi cuenta</p>
          <h1 className="t-section">Mis pedidos</h1>
          <p className="t-subtitle">Consulta tus compras y vuelve a pedir lo que te gustó.</p>
        </div>
        <Link className="btn btn--secondary" to="/cuenta">Volver a mi cuenta</Link>
      </header>

      <div className="eshop-account-toolbar">
        <label className="t-caption" htmlFor="order-status">Estado</label>
        <Select id="order-status" className="eshop-account-filter" value={filter}
          onChange={(event) => setFilter(event.target.value as Filter)}>
          <option value="Todos">Todos</option>
          {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </Select>
        <span className="t-min t-muted">
          {visible.length} {visible.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={mine.length === 0 ? 'Aún no tienes pedidos' : 'No hay pedidos con ese estado'}
          description={mine.length === 0
            ? 'Cuando hagas una compra, la verás aquí.'
            : 'Prueba con otro estado para ver tus compras.'}
          action={mine.length === 0
            ? <Link className="btn btn--primary" to="/tienda">Explorar productos</Link>
            : undefined}
        />
      ) : (
        <div className="eshop-account-orders">
          {visible.map((order) => (
            <article key={order.id} className="eshop-account-order card">
              <div className="eshop-account-order__head">
                <div>
                  <p className="t-min t-muted">Código</p>
                  <p className="code t-mid t-strong">{order.codigo}</p>
                </div>
                <Chip active={order.estado !== 'Cancelado'}>{order.estado}</Chip>
              </div>
              <dl className="eshop-account-order__meta">
                <div><dt className="t-min">Fecha</dt><dd>{formatShortDate(order.fecha)}</dd></div>
                <div><dt className="t-min">Artículos</dt><dd className="num">{order.lineas.length}</dd></div>
                <div><dt className="t-min">Total</dt><dd className="num t-strong">{formatMoney(order.total, order.moneda)}</dd></div>
              </dl>
              <div className="eshop-account-order__actions">
                <Link className="btn btn--secondary btn--sm" to={`/cuenta/pedidos/${encodeURIComponent(order.codigo)}`}>
                  Ver detalle
                </Link>
                <Button size="sm" onClick={() => reorder(order)}>
                  <RotateCcw size={15} strokeWidth={1.7} aria-hidden="true" />
                  Volver a pedir
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AccountDemoNote />
    </div>
  )
}
