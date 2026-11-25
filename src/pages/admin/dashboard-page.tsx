import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Boxes, ClipboardList, PackageSearch, TrendingUp } from 'lucide-react'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusDot } from '../../components/ui/StatusDot'
import { RollingNumber } from '../../motion/components/RollingNumber'
import { Reveal } from '../../motion/components/Reveal'
import { getActivity } from '../../logic/services/audit'
import { formatRelativeTime, formatShortDate } from '../../logic/services/formatters'
import { formatMoney } from '../../logic/services/pricing'
import {
  compareUrgency, getDailyFlow, getInventorySummary, getProductStatus, needsReplenishment,
} from '../../logic/services/stock'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { dur, ease, panelMotion, spring } from '../../motion/tokens'
import { motionSafe, staggerDelay } from '../../motion/helpers'

/** Los KPI heredan el stagger de Reveal; la barra crece desde la base. */
const kpiVariants: Variants = {
  hidden: { opacity: 0, y: panelMotion.kpiRise },
  show: {
    opacity: 1,
    y: 0,
    transition: { y: spring.soft, opacity: { duration: dur.base, ease: ease.easeOutQuint } },
  },
}

export const AdminDashboardPage = () => {
  const reduce = useReducedMotion()
  const products = useInventoryStore((state) => state.products)
  const movements = useInventoryStore((state) => state.movements)
  const orders = useOrdersStore((state) => state.orders)

  const summary = useMemo(
    () => getInventorySummary(products, movements, orders),
    [products, movements, orders],
  )
  const flow = useMemo(() => getDailyFlow(movements, 14), [movements])
  const peak = Math.max(1, ...flow.flatMap((day) => [day.entradas, day.salidas]))
  const height = (value: number): string => `${Math.max(2, Math.round((value / peak) * 100))}%`

  const pendientes = useMemo(
    () => orders.filter((order) => order.estado === 'Pendiente').slice(0, 5),
    [orders],
  )
  const reposicion = useMemo(
    () => products
      .filter((product) => !product.archivado && needsReplenishment(product, orders))
      .sort((a, b) => compareUrgency(a, b, orders))
      .slice(0, 5),
    [products, orders],
  )
  const activity = getActivity().slice(0, 6)

  const kpis: Array<{ label: string; value: ReactNode; detail: ReactNode; icon: ReactNode }> = [
    {
      label: 'Pedidos por atender',
      value: <RollingNumber value={summary.pedidosPorAtender} ariaLabel={`${summary.pedidosPorAtender} pedidos por atender`} />,
      detail: 'En estado pendiente',
      icon: <ClipboardList size={18} strokeWidth={1.5} />,
    },
    {
      label: 'Ventas de hoy',
      value: (
        <RollingNumber
          value={formatMoney(summary.ventasHoy)}
          ariaLabel={`Ventas de hoy ${formatMoney(summary.ventasHoy)}`}
        />
      ),
      detail: 'Pedidos entregados hoy',
      icon: <TrendingUp size={18} strokeWidth={1.5} />,
    },
    {
      label: 'Necesitan reposición',
      value: <RollingNumber value={summary.needsReplenishment} ariaLabel={`${summary.needsReplenishment} productos por reponer`} />,
      detail: 'Por debajo del mínimo',
      icon: <PackageSearch size={18} strokeWidth={1.5} />,
    },
    {
      label: 'Unidades en stock/valor',
      value: <RollingNumber value={summary.units} ariaLabel={`${summary.units} unidades en stock`} />,
      detail: summary.value === null
        ? 'Sin costos registrados'
        : `Valor ${formatMoney(summary.value)}`,
      icon: <Boxes size={18} strokeWidth={1.5} />,
    },
  ]

  return (
    <div className="admin-page container-admin">
      <header className="admin-page-head">
        <div className="col">
          <p className="t-min t-muted">Panel de administración</p>
          <h1 className="t-subtitle t-strong">Resumen de hoy</h1>
          <p className="t-caption t-pretty">Inventario, pedidos y reposición en una sola vista.</p>
        </div>
        <div className="admin-actions">
          <Link to="/admin/movimientos" className="btn btn--secondary btn--sm">Registrar movimiento</Link>
          <Link to="/admin/reposicion" className="btn btn--primary btn--sm">Ver reposición</Link>
        </div>
      </header>

      <Reveal className="admin-kpi-grid">
        {kpis.map((kpi) => (
          <motion.article
            className="kpi-card"
            key={kpi.label}
            variants={reduce ? motionSafe(kpiVariants) : kpiVariants}
          >
            <div className="kpi-card__top">
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-icon" aria-hidden="true">{kpi.icon}</span>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <p className="kpi-detail">{kpi.detail}</p>
          </motion.article>
        ))}
      </Reveal>

      <div className="admin-grid-2">
        <Reveal className="admin-panel" delay={0.05}>
          <div className="admin-panel__head">
            <div>
              <h2 className="t-ui t-strong">Flujo de los últimos 14 días</h2>
              <p className="t-min t-muted">Unidades por día, entradas y salidas</p>
            </div>
            <div className="admin-legend">
              <span><i className="admin-legend__mark admin-legend__mark--in" aria-hidden="true" />Entradas</span>
              <span><i className="admin-legend__mark admin-legend__mark--out" aria-hidden="true" />Salidas</span>
            </div>
          </div>
          <div className="admin-flow" role="img" aria-label="Barras de entradas y salidas de los últimos catorce días">
            <div className="admin-flow-bars">
              {flow.map((day, index) => (
                <div className="admin-flow-col" key={day.date.toISOString()}
                  title={`${day.label}: ${day.entradas} entradas · ${day.salidas} salidas`}>
                  <motion.div
                    className="admin-flow-bar admin-flow-bar--in"
                    style={{ height: height(day.entradas), transformOrigin: 'bottom' }}
                    initial={reduce ? undefined : { scaleY: panelMotion.barRise, opacity: 0 }}
                    whileInView={reduce ? undefined : { scaleY: 1, opacity: 1 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: dur.slow, ease: ease.easeOutQuint, delay: staggerDelay(index) }}
                  />
                  <motion.div
                    className="admin-flow-bar admin-flow-bar--out"
                    style={{ height: height(day.salidas), transformOrigin: 'bottom' }}
                    initial={reduce ? undefined : { scaleY: panelMotion.barRise, opacity: 0 }}
                    whileInView={reduce ? undefined : { scaleY: 1, opacity: 1 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: dur.slow, ease: ease.easeOutQuint, delay: staggerDelay(index) }}
                  />
                </div>
              ))}
            </div>
            <div className="admin-flow-labels" aria-hidden="true">
              {flow.map((day, index) => (
                <span key={day.date.toISOString()}>{index % 2 === 0 ? day.label : ''}</span>
              ))}
            </div>
          </div>
          <p className="t-min t-muted">
            Hoy: {summary.todayEntries} entradas · {summary.todayExits} salidas
          </p>
        </Reveal>

        <Reveal className="admin-panel" delay={0.1}>
          <div className="admin-panel__head">
            <div>
              <h2 className="t-ui t-strong">Pedidos recientes</h2>
              <p className="t-min t-muted">Últimos en cola</p>
            </div>
            <Link to="/admin/pedidos" className="admin-link">Ver todos <ArrowUpRight size={15} strokeWidth={1.5} /></Link>
          </div>
          {pendientes.length === 0 ? (
            <p className="inline-note">No hay pedidos pendientes en este momento.</p>
          ) : (
            <ul className="admin-list">
              {pendientes.map((order) => (
                <li className="admin-list__row" key={order.id}>
                  <div className="col">
                    <span className="order-code t-mid">{order.codigo}</span>
                    <span className="t-min t-muted">{order.cliente.nombre}</span>
                  </div>
                  <div className="admin-list__end">
                    <span className="t-mid t-num">{formatMoney(order.total)}</span>
                    <span className="t-min t-muted">{formatShortDate(order.fecha)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>

      <div className="admin-grid-2">
        <Reveal className="admin-panel" delay={0.05}>
          <div className="admin-panel__head">
            <div>
              <h2 className="t-ui t-strong">Reposición sugerida</h2>
              <p className="t-min t-muted">Ordenada por urgencia</p>
            </div>
            <Link to="/admin/reposicion" className="admin-link">Abrir lista <ArrowUpRight size={15} strokeWidth={1.5} /></Link>
          </div>
          {reposicion.length === 0 ? (
            <EmptyState compact title="Todo cubierto" description="Ningún producto está por debajo de su mínimo." />
          ) : (
            <ul className="admin-list">
              {reposicion.map((product) => {
                const status = getProductStatus(product, orders)
                return (
                  <li className="admin-list__row" key={product.id}>
                    <div className="col">
                      <span className="t-mid">{product.nombre}</span>
                      <span className="t-min t-muted">{product.codigo} · {product.ubicacion || 'Sin ubicación'}</span>
                    </div>
                    <StatusDot status={status.status} label={status.label} compact />
                  </li>
                )
              })}
            </ul>
          )}
        </Reveal>

        <Reveal className="admin-panel" delay={0.1}>
          <div className="admin-panel__head">
            <div>
              <h2 className="t-ui t-strong">Actividad reciente</h2>
              <p className="t-min t-muted">Últimos registros del panel</p>
            </div>
          </div>
          {activity.length === 0 ? (
            <p className="inline-note">Todavía no hay actividad registrada.</p>
          ) : (
            <ul className="admin-list">
              {activity.map((entry) => (
                <li className="admin-list__row admin-list__row--stack" key={entry.id}>
                  <div className="col">
                    <span className="t-mid">{entry.accion}</span>
                    <span className="t-caption t-pretty">{entry.detalle}</span>
                  </div>
                  <span className="t-min t-muted">
                    {entry.usuario} · {formatRelativeTime(entry.fecha)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>
    </div>
  )
}
