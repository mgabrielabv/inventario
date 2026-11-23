import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInventoryStore } from '../../logic/store/inventory'
import { useCategoryStock, useInventoryStats } from '../../logic/hooks/useInventoryStats'
import { getMostMovedProduct, getRecentMovements } from '../../logic/store/selectors'
import { getMovementSummary } from '../../logic/services/stock'
import { formatNumber, formatRelativeTime, pluralize } from '../../logic/services/formatters'
import { EASE_OUT } from '../../components/illustrations/motion'
import { PageTitle } from '../../components/ui/page-title'
import { MegaNumber } from '../../components/ui/mega-number'
import { Stamp } from '../../components/ui/stamp'

export const DashboardPage = () => {
  const stats = useInventoryStats()
  const categories = useCategoryStock()
  const movements = useInventoryStore((state) => state.movements)
  const recentMovements = getRecentMovements(movements, 4)
  const mostMoved = getMostMovedProduct(movements)

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
  }

  return (
    <div className="page dashboard">
      <header className="page-head dashboard__head">
        <div className="page-head__main">
          <PageTitle lines={['HOY EN', 'BODEGA']} />
          <p className="page-head__sub">
            <strong>{formatNumber(stats.totalProducts)} productos.</strong>{' '}
            {stats.alertsCount === 1
              ? '1 se está acabando.'
              : `${formatNumber(stats.alertsCount)} se están acabando.`}{' '}
            El resto está en su estante.
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

      <motion.div className="dash" variants={container} initial="hidden" animate="visible">
        <div className="dash__main">
          <motion.section className="dash__total" variants={item} aria-label="Total de productos">
            <div className="mega-clip">
              <MegaNumber
                value={stats.totalProducts}
                label={`${formatNumber(stats.totalProducts)} productos`}
              />
            </div>
            <p className="dash__total-label">productos en el libro</p>
            <div className="dash__total-foot">
              <span>{formatNumber(stats.totalUnits)} unidades</span>
              <span className="dash__rule" aria-hidden="true" />
              <span>{categories.length} categorías</span>
            </div>
          </motion.section>

          <motion.section
            className="dash__alerts"
            variants={item}
            aria-labelledby="dash-alerts-title"
          >
            <div className="dash__alerts-main">
              <div className="mega-clip">
                <MegaNumber
                  value={stats.alertsCount}
                  tone="cream"
                  label={`${formatNumber(stats.alertsCount)} alertas de stock`}
                />
              </div>
              <p className="dash__alerts-label" id="dash-alerts-title">
                {pluralize(stats.alertsCount, 'referencia pide', 'referencias piden')} reposición
              </p>
            </div>

            <Stamp tilt="right" className="dash__stamp">
              {stats.criticalCount > 0 ? 'Crítico' : 'En orden'}
            </Stamp>

            <div className="dash__alerts-foot">
              <p>
                {stats.criticalCount} {pluralize(stats.criticalCount, 'crítico', 'críticos')} ·{' '}
                {stats.warningCount} {pluralize(stats.warningCount, 'bajo', 'bajos')}
              </p>
              <NavLink to="/alertas" className="dash__link">
                Revisar alertas →
              </NavLink>
            </div>
          </motion.section>
        </div>

        <aside className="dash__side" aria-label="Detalle del almacén">
          <motion.section className="kraft dash__cat" variants={item}>
            <div className="dash__side-head">
              <h2 className="label">Stock por categoría</h2>
              <span className="dash__side-note">{categories.length} grupos</span>
            </div>
            <div className="leader-list">
              {categories.map((entry) => (
                <div className="leader-row" key={entry.category}>
                  <span className="leader-row__label">{entry.category}</span>
                  <span className="leader-row__fill" aria-hidden="true" />
                  <span className="leader-row__value">
                    {formatNumber(entry.units)}
                    <small>{entry.percentage}%</small>
                  </span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section className="dash__recent" variants={item}>
            <div className="dash__side-head">
              <h2 className="label">Últimos movimientos</h2>
              <NavLink to="/movimientos" className="dash__side-link">
                Ver todos
              </NavLink>
            </div>
            <div className="dash__recent-list">
              {recentMovements.length === 0 && (
                <p className="dash__empty">Todavía no hay nada anotado.</p>
              )}
              {recentMovements.map((movement) => {
                const isIn = movement.tipo === 'Entrada'
                return (
                  <div className="dash__recent-row" key={movement.id}>
                    <span className="dash__recent-product">
                      {movement.productoNombre}
                      <span className="dash__recent-time">
                        {movement.tipo} · {formatRelativeTime(movement.fecha)}
                      </span>
                    </span>
                    <span className="dash__recent-fill" aria-hidden="true" />
                    <span
                      className={[
                        'dash__recent-amount',
                        isIn ? 'dash__recent-amount--in' : 'dash__recent-amount--out',
                      ].join(' ')}
                    >
                      {movement.tipo === 'Ajuste'
                        ? getMovementSummary(movement)
                        : `${isIn ? '+' : '−'}${movement.cantidad}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.section>

          <motion.section className="dash__most" variants={item}>
            <h2 className="label">El más movido</h2>
            <p className="dash__most-name">{mostMoved?.producto ?? 'Sin datos'}</p>
            <p className="dash__most-meta">
              {mostMoved
                ? `${formatNumber(mostMoved.units)} unidades movidas`
                : 'Anota un movimiento para saberlo.'}
            </p>
          </motion.section>
        </aside>
      </motion.div>

      <p className="footer-note">
        <span>Libro abierto</span>
        <span aria-hidden="true">·</span>
        <span>INVENTARIO · Control de bodega</span>
      </p>
    </div>
  )
}
