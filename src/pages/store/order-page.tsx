import { ArrowLeft, MessageCircle, Printer } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatShortDate, formatTime, storeName } from '../../logic/services/formatters'
import { whatsappLink } from '../../logic/services/orders'
import { formatMoney, formatSecondary } from '../../logic/services/pricing'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import type { Order } from '../../logic/types'

const Timeline = ({ items }: { items: Order['historial'] }) => (
  <ol className="order-timeline">
    {items.map((item, index) => (
      <li className="order-timeline__item" key={`${item.fecha}-${index}`}>
        <span className="order-timeline__dot" aria-hidden="true" />
        <div>
          <p className="t-mid">{item.estado}</p>
          <p className="t-min">{formatShortDate(item.fecha)} · {formatTime(item.fecha)}</p>
          {item.nota && <p className="t-caption">{item.nota}</p>}
        </div>
      </li>
    ))}
  </ol>
)

export const OrderPage = () => {
  const { codigo } = useParams<{ codigo: string }>()
  const location = useLocation()
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated)
  const order = useOrdersStore((state) => state.orders.find((item) => item.codigo === codigo))
  const settings = useSettingsStore((state) => state.settings)

  if (!order) {
    return (
      <div className="order-page container-store">
        <EmptyState
          title="No encontramos ese pedido"
          description="Consulta el estado con tu código y teléfono o correo."
          action={<Link className="btn btn--primary" to="/seguimiento">Ir a seguimiento</Link>}
        />
      </div>
    )
  }

  const secondary = formatSecondary(order.total, settings)
  const deliveryLabel = order.entrega.tipo === 'delivery' ? 'Delivery' : 'Retiro en tienda'
  const paymentLabel = order.pago.metodo === 'tarjeta-demo'
    ? 'Tarjeta · Demostración'
    : order.pago.metodo === 'transferencia' ? 'Transferencia' : 'Efectivo'

  return (
    <div className="order-page container-detail">
      <header className="order-head">
        {justCreated ? (
          <>
            <p className="order-head__eyebrow t-min t-clay">Listo</p>
            <h1 className="t-section">Pedido confirmado</h1>
            <p className="t-subtitle">Guarda tu código para consultar el estado cuando quieras.</p>
          </>
        ) : (
          <>
            <p className="order-head__eyebrow t-min t-clay">Detalle</p>
            <h1 className="t-section">Tu pedido</h1>
          </>
        )}
        <p className="order-head__code order-code">{order.codigo}</p>
      </header>

      <div className="order-actions">
        <a
          className="btn btn--primary"
          href={whatsappLink(order, settings.tienda.whatsapp, storeName(settings))}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={17} strokeWidth={1.5} aria-hidden="true" />
          Compartir por WhatsApp
        </a>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={17} strokeWidth={1.5} aria-hidden="true" />
          Imprimir
        </Button>
      </div>

      <div className="order-layout">
        <div className="order-main">
          <section className="order-card card" aria-labelledby="order-summary-title">
            <h2 id="order-summary-title" className="t-ui t-strong">Resumen</h2>
            <dl className="order-summary">
              <div><dt className="t-caption">Estado</dt><dd><Chip active>{order.estado}</Chip></dd></div>
              <div><dt className="t-caption">Fecha</dt><dd>{formatShortDate(order.fecha)} · {formatTime(order.fecha)}</dd></div>
              <div><dt className="t-caption">Cliente</dt><dd>{order.cliente.nombre}</dd></div>
              <div><dt className="t-caption">Teléfono</dt><dd>{order.cliente.telefono}</dd></div>
              {order.cliente.email && (
                <div><dt className="t-caption">Correo</dt><dd>{order.cliente.email}</dd></div>
              )}
              <div><dt className="t-caption">Entrega</dt><dd>{deliveryLabel}</dd></div>
              {order.entrega.direccion && (
                <div><dt className="t-caption">Dirección</dt><dd>{order.entrega.direccion}</dd></div>
              )}
              {order.entrega.zona && (
                <div><dt className="t-caption">Zona</dt><dd>{order.entrega.zona}</dd></div>
              )}
              <div><dt className="t-caption">Pago</dt><dd>{paymentLabel}</dd></div>
              {order.pago.referencia && (
                <div><dt className="t-caption">Referencia de pago</dt><dd>{order.pago.referencia}</dd></div>
              )}
            </dl>
          </section>

          <section className="order-card card" aria-labelledby="order-lines-title">
            <h2 id="order-lines-title" className="t-ui t-strong">Productos</h2>
            <table className="order-lines">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.lineas.map((line) => (
                  <tr key={line.productoId}>
                    <td>
                      <span className="t-mid">{line.nombre}</span>
                      <span className="t-min t-muted order-lines__code">{line.codigo}</span>
                    </td>
                    <td className="num">{line.cantidad}</td>
                    <td className="num">{formatMoney(line.precioUnit)}</td>
                    <td className="num">{formatMoney(line.precioUnit * line.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="order-totals">
              <div><dt className="t-caption">Subtotal</dt><dd className="num">{formatMoney(order.subtotal)}</dd></div>
              <div><dt className="t-caption">Envío</dt><dd className="num">{order.envio === 0 ? 'Sin costo' : formatMoney(order.envio)}</dd></div>
              <div className="order-totals__grand">
                <dt className="t-strong">Total</dt><dd className="price">{formatMoney(order.total)}</dd>
              </div>
            </dl>
            {secondary && <p className="t-min t-muted order-totals__secondary">{secondary}</p>}
          </section>
        </div>

        <aside className="order-aside card" aria-labelledby="order-timeline-title">
          <h2 id="order-timeline-title" className="t-ui t-strong">Seguimiento</h2>
          <Timeline items={order.historial ?? []} />
          <p className="order-aside__note t-min">
            Consulta local de demostración. Los cambios de estado los hace el personal.
          </p>
          <Link className="order-aside__back t-mid" to="/tienda">
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
            Volver al catálogo
          </Link>
        </aside>
      </div>
    </div>
  )
}
