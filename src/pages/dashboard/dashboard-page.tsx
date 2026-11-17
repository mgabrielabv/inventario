import type { CSSProperties } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import { useInventoryStore } from '../../logic/store/inventory'
import { useCategoryStock, useInventoryStats } from '../../logic/hooks/useInventoryStats'
import { useAnimatedNumber } from '../../logic/hooks/useAnimatedNumber'
import { getMostMovedProduct, getRecentMovements } from '../../logic/store/selectors'
import {
  formatNumber,
  formatRelativeTime,
  pluralize,
} from '../../logic/services/formatters'
import { EASE_OUT } from '../../components/illustrations/motion'

const AnimatedValue = ({ value }: { value: number }) => {
  const current = useAnimatedNumber(value)
  return <>{formatNumber(current)}</>
}

const Sparkline = ({ label }: { label: string }) => {
  const values = [4, 6, 5, 8, 7, 9, 10]
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 116 + 2
    const y = 40 - ((value - min) / range) * 32
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const path = `M${points.join(' L')}`

  return (
    <svg
      className="sparkline"
      viewBox="0 0 120 44"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <motion.path
        className="sparkline__line"
        d={path}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.3, ease: EASE_OUT }}
      />
    </svg>
  )
}

export const DashboardPage = () => {
  const stats = useInventoryStats()
  const categories = useCategoryStock()
  const movements = useInventoryStore((state) => state.movements)
  const recentMovements = getRecentMovements(movements, 4)
  const mostMoved = getMostMovedProduct(movements)
  const categoryUnits = categories.reduce((sum, item) => sum + item.units, 0)

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT } },
  }

  return (
    <div className="page dashboard">
      <header className="page-head">
        <div>
          <div className="page-head__meta">
            <span className="page-head__index">01 / DASHBOARD</span>
            <span className="page-head__rule" aria-hidden="true" />
            <span className="eyebrow">{formatNumber(stats.totalProducts)} referencias</span>
          </div>
          <h1 className="page-title">
            Inicio<em>.</em>
          </h1>
          <p className="page-head__sub">
            <span className="dashboard__alert-em">{stats.alertsCount}</span>{' '}
            {pluralize(stats.alertsCount, 'producto necesita', 'productos necesitan')} tu
            atención.{' '}
            <span className="dashboard__sub-mono">
              {stats.criticalCount} críticos · {stats.warningCount} bajos
            </span>
          </p>
        </div>
        <div className="page-head__aside">
          <div className="page-head__stat">
            <span className="page-head__stat-value">{formatNumber(stats.totalUnits)}</span>
            <span className="page-head__stat-label">Unidades</span>
          </div>
          <div className="page-head__stat">
            <span className="page-head__stat-value">{stats.movementsLast7Days}</span>
            <span className="page-head__stat-label">Mov. 7 días</span>
          </div>
        </div>
      </header>

      <motion.div
        className="dash-grid"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.article
          variants={item}
          className="dash-card dash-card--hero dash-card--span7"
        >
          <div className="dash-card__head">
            <span className="dash-card__label">Total de productos</span>
            <span className="dash-card__code">REF-01</span>
          </div>
          <div className="dash-card__main">
            <p className="dash-card__number">
              <AnimatedValue value={stats.totalProducts} />
            </p>
            <div className="dash-card__aside">
              <Sparkline label="Tendencia ascendente de referencias en la última semana" />
              <span className="dash-card__trend">
                <ArrowUp size={12} strokeWidth={1.6} aria-hidden="true" />
                12% vs. semana pasada
              </span>
            </div>
          </div>
          <div className="dash-card__foot">
            <span className="dash-card__rule" aria-hidden="true" />
            <span>{formatNumber(stats.totalUnits)} unidades en total</span>
          </div>
        </motion.article>

        <motion.article
          variants={item}
          className="dash-card dash-card--hero dash-card--span5 dash-card--accent"
        >
          <div className="dash-card__head">
            <span className="dash-card__label">Alertas de stock</span>
            <span className="dash-card__pulse" aria-hidden="true" />
          </div>
          <div className="dash-card__main">
            <p className="dash-card__number">
              <AnimatedValue value={stats.alertsCount} />
            </p>
            <span className="dash-card__code">ALT-04</span>
          </div>
          <div className="dash-card__chips">
            <span className="dash-chip">{stats.criticalCount} críticos</span>
            <span className="dash-chip">{stats.warningCount} en aviso</span>
          </div>
          <div className="dash-card__foot">
            <span className="dash-card__rule" aria-hidden="true" />
            <NavLink to="/alertas" className="panel__link panel__link--flush">
              Revisar alertas
              <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
            </NavLink>
          </div>
        </motion.article>

        <motion.article
          variants={item}
          className="dash-card dash-card--chart dash-card--span7"
        >
          <div className="dash-card__head">
            <span className="dash-card__label">Stock por categoría</span>
            <span className="dash-card__code">CH-01</span>
          </div>
          <div className="category-chart">
            {categories.map((entry, index) => (
              <div className="category-row" key={entry.category}>
                <span className="category-row__name">{entry.category}</span>
                <div
                  className="category-row__track"
                  role="img"
                  aria-label={`${entry.category}: ${entry.units} unidades, ${entry.percentage}% del total`}
                >
                  <motion.span
                    className="category-row__fill"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.16 + index * 0.07,
                      ease: EASE_OUT,
                    }}
                    style={{ '--bar-size': `${entry.percentage}%` } as CSSProperties}
                  />
                </div>
                <span className="category-row__value">
                  {formatNumber(entry.units)}
                  <span className="category-row__pct">{entry.percentage}%</span>
                </span>
              </div>
            ))}
          </div>
          <div className="category-chart__foot">
            <span>{formatNumber(categoryUnits)} unidades clasificadas</span>
            <span>{categories.length} categorías</span>
          </div>
        </motion.article>

        <motion.article
          variants={item}
          className="dash-card dash-card--chart dash-card--span5"
        >
          <div className="dash-card__head">
            <span className="dash-card__label">Últimos movimientos</span>
            <span className="dash-card__code">MV-01</span>
          </div>
          <div className="recent-list">
            {recentMovements.length === 0 && (
              <p className="table-empty">Todavía no hay movimientos registrados.</p>
            )}
            {recentMovements.map((movement) => {
              const isIn = movement.tipo === 'Entrada'
              return (
                <div className="recent-row" key={movement.id}>
                  <span
                    className={`recent-row__icon recent-row__icon--${isIn ? 'in' : 'out'}`}
                    aria-hidden="true"
                  >
                    {isIn ? (
                      <ArrowUp size={14} strokeWidth={1.5} />
                    ) : (
                      <ArrowDown size={14} strokeWidth={1.5} />
                    )}
                  </span>
                  <div className="recent-row__body">
                    <p className="recent-row__product">{movement.producto}</p>
                    <p className="recent-row__meta">
                      {movement.tipo} · {formatRelativeTime(movement.fecha)}
                    </p>
                  </div>
                  <span
                    className={`recent-row__amount recent-row__amount--${isIn ? 'in' : 'out'}`}
                  >
                    {isIn ? '+' : '−'}
                    {movement.cantidad}
                  </span>
                </div>
              )
            })}
          </div>
          <NavLink to="/movimientos" className="panel__link">
            Ver todos los movimientos
            <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
          </NavLink>
        </motion.article>

        <motion.article variants={item} className="dash-card dash-card--mini dash-card--span4">
          <div className="dash-card__head">
            <span className="dash-card__label">Movimientos · 7 días</span>
            <span className="dash-card__code">MV-07</span>
          </div>
          <p className="dash-card__mini-value">
            {stats.movementsLast7Days}
            <span className="dash-card__mini-unit">registros</span>
          </p>
          <p className="dash-card__mini-note">
            Entradas y salidas dentro de la ventana semanal
          </p>
        </motion.article>

        <motion.article variants={item} className="dash-card dash-card--mini dash-card--span4">
          <div className="dash-card__head">
            <span className="dash-card__label">Producto estrella</span>
            <span className="dash-card__code">TOP-01</span>
          </div>
          <p className="dash-card__mini-title">{mostMoved?.producto ?? 'Sin datos'}</p>
          <p className="dash-card__mini-meta">Mayor rotación registrada</p>
          <p className="dash-card__mini-note">
            {mostMoved
              ? `${formatNumber(mostMoved.units)} unidades movidas`
              : 'Registra movimientos para calcularlo'}
          </p>
        </motion.article>

        <motion.article variants={item} className="dash-card dash-card--mini dash-card--span4">
          <div className="dash-card__head">
            <span className="dash-card__label">Inventario total</span>
            <span className="dash-card__code">INV-01</span>
          </div>
          <p className="dash-card__mini-value">
            <AnimatedValue value={stats.totalUnits} />
            <span className="dash-card__mini-unit">uds.</span>
          </p>
          <p className="dash-card__mini-note">Unidades registradas en las 25 referencias</p>
        </motion.article>
      </motion.div>

      <p className="footer-note">
        <span>Última sincronización: ahora</span>
        <span aria-hidden="true">·</span>
        <span>Atelier de Almacén · ALM-01</span>
      </p>
    </div>
  )
}
