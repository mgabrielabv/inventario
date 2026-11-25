import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Copy, FileCheck2, MessageCircle, Printer } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useCustomer } from '../../app/providers/customer-provider'
import { ProductArt } from '../../components/art/ProductArt'
import { OrderBox } from '../../components/box/OrderBox'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { estimarEntrega } from '../../logic/services/delivery'
import { formatShortDate, formatTime, storeName } from '../../logic/services/formatters'
import { getImage } from '../../logic/services/images'
import { whatsappLink } from '../../logic/services/orders'
import { friendlyStatus, friendlyStatusDetail } from '../../logic/services/order-labels'
import { formatMoney, formatSecondary } from '../../logic/services/pricing'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import type { Order } from '../../logic/types'
import { celebration, dur, ease } from '../../motion/tokens'
import { isLightDevice, staggerDelay } from '../../motion/helpers'

/** Check que se dibuja y destellos discretos; sin confeti con reduced-motion. */
const OrderCelebration = ({ animate }: { animate: boolean }) => {
  const reduce = useReducedMotion()
  const light = isLightDevice()
  const decorative = animate && !reduce && !light

  return (
    <span className="order-celebration" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <motion.path
          d="M14 24.5 21 31 34 17"
          fill="none" stroke="currentColor" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? dur.micro : dur.hero, ease: ease.easeOutQuint }}
        />
      </svg>
      {decorative && Array.from({ length: celebration.particles }, (_, index) => (
        <motion.i
          key={index}
          style={{ rotate: index * (celebration.fullTurn / celebration.particles) }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -celebration.radius, -celebration.radius * 1.2],
            scale: [0, 1, 0.6],
          }}
          transition={{
            duration: celebration.duration,
            delay: staggerDelay(index % celebration.wave),
            ease: ease.easeOutExpo,
          }}
        />
      ))}
    </span>
  )
}

const Timeline = ({ items }: { items: Order['historial'] }) => (
  <ol className="order-timeline">
    {items.map((item, index) => (
      <li className="order-timeline__item" key={`${item.fecha}-${index}`}>
        <span className="order-timeline__dot" aria-hidden="true" />
        <div>
          <p className="t-mid">{friendlyStatus(item.estado)}</p>
          <p className="t-min">{formatShortDate(item.fecha)} · {formatTime(item.fecha)}</p>
          <p className="t-caption t-muted">{friendlyStatusDetail(item.estado)}</p>
          {item.nota && <p className="t-caption">{item.nota}</p>}
        </div>
      </li>
    ))}
  </ol>
)

const paymentLabels: Record<Order['pago']['metodo'], string> = {
  efectivo: 'Efectivo', transferencia: 'Transferencia',
  movil: 'Pago móvil', 'tarjeta-demo': 'Tarjeta (simulada)',
}

export const OrderPage = () => {
  const { codigo } = useParams<{ codigo: string }>()
  const location = useLocation()
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated)
  const order = useOrdersStore((state) => state.orders.find((item) => item.codigo === codigo))
  const products = useInventoryStore((state) => state.products)
  const settings = useSettingsStore((state) => state.settings)
  const { toast } = useToast()
  const { account } = useCustomer()
  const [receipt, setReceipt] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (order?.pago.comprobante) {
      getImage(order.pago.comprobante).then((url) => { if (alive) setReceipt(url) })
    } else setReceipt(null)
    return () => { alive = false }
  }, [order?.pago.comprobante])

  const estimate = useMemo(() => order
    ? estimarEntrega(order.entrega, settings, new Date(order.fecha)) : null,
  [order, settings])

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
  const [nombre, ...apellido] = order.cliente.nombre.trim().split(/\s+/)
  const prefill = {
    nombre, apellido: apellido.join(' '),
    email: order.cliente.email ?? '', telefono: order.cliente.telefono,
  }
  const deliveryLabel = order.entrega.tipo === 'delivery' ? 'Delivery' : 'Retiro en tienda'
  const followTo = `/seguimiento?codigo=${encodeURIComponent(order.codigo)}`
    + `&telefono=${encodeURIComponent(order.cliente.telefono)}`
  const steps = [
    { label: 'Revisamos tu pedido', done: order.estado !== 'Pendiente' },
    { label: 'Preparamos tus productos', done: ['Listo', 'Entregado'].includes(order.estado) },
    {
      label: order.entrega.tipo === 'delivery' ? 'Te lo llevamos' : 'Lo retiras en tienda',
      done: order.estado === 'Entregado',
    },
  ]
  const cancelled = order.estado === 'Cancelado'

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(order.codigo)
      toast('Código copiado')
    } catch {
      toast('Selecciona el código para copiarlo')
    }
  }

  return (
    <div className="order-page container-detail">
      <header className="order-head">
        {justCreated && <OrderCelebration animate />}
        <p className="order-head__eyebrow t-min t-clay">{justCreated ? 'Listo' : 'Detalle'}</p>
        <h1 className="t-section">{justCreated ? 'Pedido confirmado' : 'Tu pedido'}</h1>
        <p className="t-subtitle">
          {justCreated
            ? 'Guarda tu código para consultar el estado cuando quieras.'
            : 'Consulta el resumen y el estado de tu compra.'}
        </p>
      </header>

      <section className="order-hero card" aria-label="Código del pedido">
        <OrderBox code={order.codigo} size={240} />
        <div className="order-hero__side">
          <div className="order-hero__status">
            <Chip active>{friendlyStatus(order.estado)}</Chip>
            <span className="t-caption t-muted">{storeName(settings)} · {formatShortDate(order.fecha)}</span>
          </div>
          <p className="t-mid t-strong">
            {justCreated ? 'Tu pedido quedó registrado' : `Pedido ${order.codigo}`}
          </p>
          <p className="t-caption t-muted">
            Pago simulado: no se realizó ningún cobro real.
          </p>
          <div className="order-actions">
            <Button variant="secondary" onClick={() => void copyCode()}>
              <Copy size={16} strokeWidth={1.6} aria-hidden="true" /> Copiar código
            </Button>
            <a
              className="btn btn--primary"
              href={whatsappLink(order, settings.tienda.whatsapp, storeName(settings))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} strokeWidth={1.6} aria-hidden="true" />
              WhatsApp
            </a>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={16} strokeWidth={1.6} aria-hidden="true" /> Imprimir
            </Button>
          </div>
          <Link className="order-hero__follow t-caption" to={followTo}>
            Seguir mi pedido <ArrowRight size={15} strokeWidth={1.6} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {justCreated && !order.clienteId && !account && (
        <section className="order-account-invite card" aria-labelledby="order-invite-title">
          <h2 id="order-invite-title" className="t-ui t-strong">
            ¿Quieres guardar este pedido en tu cuenta?
          </h2>
          <p className="t-caption t-muted">
            Crea tu cuenta con los datos de esta compra y podrás repetir pedidos y seguirlos desde un solo lugar.
          </p>
          <div className="order-account-invite__actions">
            <Link className="btn btn--primary btn--sm"
              to="/cuenta/registro" state={{ from: '/cuenta/pedidos', prefill }}>
              Crear cuenta con mis datos
            </Link>
            <Link className="btn btn--secondary btn--sm"
              to="/cuenta/ingresar" state={{ from: '/cuenta/pedidos', prefill }}>
              Ya tengo cuenta
            </Link>
          </div>
        </section>
      )}
      {account && (
        <p className="order-account-link t-caption">
          <Link to="/cuenta/pedidos">Ver este y todos tus pedidos en mi cuenta</Link>
        </p>
      )}

      <section className="order-next card" aria-labelledby="order-next-title">
        <h2 id="order-next-title" className="t-ui t-strong">Qué sigue</h2>
        {cancelled ? (
          <p className="t-caption t-muted">Este pedido fue cancelado. No hay pasos pendientes.</p>
        ) : (
          <ol className="order-next__list">
            {steps.map((step, index) => (
              <li key={step.label} className={step.done ? 'is-done' : ''}>
                <span className="order-next__num" aria-hidden="true">
                  {step.done ? <Check size={14} strokeWidth={2.2} /> : index + 1}
                </span>
                <span className="t-caption">{step.label}</span>
              </li>
            ))}
          </ol>
        )}
        {estimate && !cancelled && (
          <p className="order-next__estimate t-caption">
            <strong>{estimate.titulo}</strong> · estimado para {formatShortDate(estimate.fecha)}.
            {' '}{order.entrega.tipo === 'delivery' && order.ventana
              ? `Ventana elegida: ${order.ventana}.`
              : estimate.detalle}
          </p>
        )}
      </section>

      <div className="order-layout">
        <div className="order-main">
          <section className="order-card card" aria-labelledby="order-lines-title">
            <h2 id="order-lines-title" className="t-ui t-strong">Tu recibo</h2>
            <ul className="order-receipt">
              {order.lineas.map((line) => {
                const product = products.find((item) => item.id === line.productoId)
                return (
                  <li key={line.productoId}>
                    {product && <ProductArt product={product} size={52} view="solo" />}
                    <div className="order-receipt__name">
                      <span className="t-mid">{line.nombre}</span>
                      <span className="t-min t-muted">{line.cantidad} × {formatMoney(line.precioUnit)}</span>
                    </div>
                    <span className="num t-mid">{formatMoney(line.precioUnit * line.cantidad)}</span>
                  </li>
                )
              })}
            </ul>
            <dl className="order-totals">
              <div><dt className="t-caption">Subtotal</dt><dd className="num">{formatMoney(order.subtotal)}</dd></div>
              {order.descuento > 0 && (
                <div className="is-discount">
                  <dt className="t-caption">Descuento{order.cupon ? ` · ${order.cupon}` : ''}</dt>
                  <dd className="num">−{formatMoney(order.descuento)}</dd>
                </div>
              )}
              <div><dt className="t-caption">Envío</dt><dd className="num">{order.envio === 0 ? 'Sin costo' : formatMoney(order.envio)}</dd></div>
              <div className="order-totals__grand">
                <dt className="t-strong">Total</dt><dd className="price">{formatMoney(order.total, order.moneda)}</dd>
              </div>
            </dl>
            {secondary && <p className="t-min t-muted order-totals__secondary">{secondary}</p>}
          </section>

          <section className="order-card card" aria-labelledby="order-summary-title">
            <h2 id="order-summary-title" className="t-ui t-strong">Datos del pedido</h2>
            <dl className="order-summary">
              <div><dt className="t-caption">Fecha</dt><dd>{formatShortDate(order.fecha)} · {formatTime(order.fecha)}</dd></div>
              <div><dt className="t-caption">Cliente</dt><dd>{order.cliente.nombre}</dd></div>
              <div><dt className="t-caption">Teléfono</dt><dd>{order.cliente.telefono}</dd></div>
              {order.cliente.email && (
                <div><dt className="t-caption">Correo</dt><dd>{order.cliente.email}</dd></div>
              )}
              {order.cliente.documento && (
                <div><dt className="t-caption">Documento</dt><dd>{order.cliente.documento}</dd></div>
              )}
              <div><dt className="t-caption">Entrega</dt><dd>{deliveryLabel}</dd></div>
              {order.entrega.direccion && (
                <div><dt className="t-caption">Dirección</dt><dd>{order.entrega.direccion}</dd></div>
              )}
              {order.entrega.zona && (
                <div><dt className="t-caption">Zona</dt><dd>{order.entrega.zona}</dd></div>
              )}
              {order.entrega.referencia && (
                <div><dt className="t-caption">Referencia</dt><dd>{order.entrega.referencia}</dd></div>
              )}
              {order.ventana && (
                <div><dt className="t-caption">Ventana</dt><dd>{order.ventana}</dd></div>
              )}
              <div><dt className="t-caption">Pago</dt><dd>{paymentLabels[order.pago.metodo]}</dd></div>
              {order.pago.referencia && (
                <div><dt className="t-caption">Referencia de pago</dt><dd>{order.pago.referencia}</dd></div>
              )}
              {order.pago.vuelto !== undefined && (
                <div><dt className="t-caption">Vuelto solicitado</dt><dd>{formatMoney(order.pago.vuelto, order.moneda)}</dd></div>
              )}
              {order.nota && (
                <div className="order-summary__wide"><dt className="t-caption">Nota</dt><dd>{order.nota}</dd></div>
              )}
            </dl>
            {receipt && (
              <div className="order-comprobante">
                <FileCheck2 size={17} strokeWidth={1.6} aria-hidden="true" />
                <img src={receipt} alt="Comprobante adjunto al pedido" />
                <span className="t-min t-muted">Comprobante adjunto · pendiente de verificación</span>
              </div>
            )}
          </section>
        </div>

        <aside className="order-aside card" aria-labelledby="order-timeline-title">
          <h2 id="order-timeline-title" className="t-ui t-strong">Seguimiento</h2>
          <Timeline items={order.historial ?? []} />
          {estimate && (
            <p className="order-aside__note t-min">
              {estimate.titulo}. Estimación orientativa basada en la fecha del pedido.
            </p>
          )}
          <p className="order-aside__note t-min">
            Los cambios de estado los hace el equipo de la tienda.
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
