import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { AlertOctagon, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../app/providers/auth-provider'
import { useAlerts } from '../../logic/hooks/useInventoryStats'
import { useInventoryStore } from '../../logic/store/inventory'
import { getProductStatus } from '../../logic/store/selectors'
import { formatNumber, pluralize } from '../../logic/services/formatters'
import type { Product } from '../../logic/types'
import { Button } from '../../components/ui/button'
import { EmptyState } from '../../components/ui/empty-state'
import { StatusBadge } from '../../components/ui/status-badge'
import { PageTitle } from '../../components/ui/page-title'
import { Stamp } from '../../components/ui/stamp'
import { WarehouseShelf } from '../../components/illustrations/warehouse-shelf'
import { EASE_OUT } from '../../components/illustrations/motion'

const ALERT_THRESHOLD = 10
const REPLENISH_AMOUNT = 10

export const AlertasPage = () => {
  const { alerts, critical, warning } = useAlerts()
  const addMovement = useInventoryStore((state) => state.addMovement)
  const { user } = useAuth()

  const handleReplenish = (product: Product) => {
    addMovement({
      productoId: product.id,
      producto: product.producto,
      tipo: 'Entrada',
      cantidad: REPLENISH_AMOUNT,
      usuario: user?.username ?? 'admin',
    })
    toast.success(`Repuesto: +${REPLENISH_AMOUNT} unidades de ${product.producto}`)
  }

  return (
    <div className="page alerts">
      <header className="page-head">
        <div className="page-head__main">
          <PageTitle lines={['LO QUE', 'FALTA']} />
          <p className="page-head__sub">
            {alerts.length === 0
              ? 'Nada falta. Todo está por encima del umbral.'
              : `${formatNumber(alerts.length)} ${pluralize(alerts.length, 'referencia pide', 'referencias piden')} reposición. ${critical.length} ${pluralize(critical.length, 'está en crítico', 'están en crítico')}.`}
          </p>
        </div>
        <div className="page-head__aside">
          <div className="page-head__stat">
            <span className="page-head__stat-value">{critical.length}</span>
            <span className="page-head__stat-label">Críticas</span>
          </div>
          <div className="page-head__stat">
            <span className="page-head__stat-value">{warning.length}</span>
            <span className="page-head__stat-label">Bajas</span>
          </div>
        </div>
      </header>

      <div className="alert-legend">
        <div className="alert-legend__item">
          <StatusBadge status="critical" />
          <span className="alert-legend__note">menos de 5 unidades</span>
        </div>
        <div className="alert-legend__item">
          <StatusBadge status="low" />
          <span className="alert-legend__note">de 5 a 9 unidades</span>
        </div>
        <p className="alert-legend__threshold">Umbral de reposición: {ALERT_THRESHOLD}</p>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          illustration={<WarehouseShelf />}
          stamp="Todo en su sitio"
          title="No falta nada."
          description="Todas las referencias están por encima del umbral. El estante respira tranquilo."
        />
      ) : (
        <motion.section
          className="alerts-board kraft"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          aria-labelledby="alerts-board-title"
        >
          <div className="alerts-board__head">
            <div>
              <h2 className="alerts-board__title" id="alerts-board-title">
                Reponer
              </h2>
              <p className="alerts-board__sub">
                {alerts.length} {pluralize(alerts.length, 'ficha', 'fichas')} por debajo del umbral
              </p>
            </div>
            <Stamp tilt="left" className="alerts-board__stamp">
              {critical.length > 0 ? 'Falta stock' : 'Vigilar'}
            </Stamp>
          </div>

          <div className="alerts-list">
            {alerts.map((product, index) => {
              const status = getProductStatus(product.cantidad)
              const isCritical = status.status === 'critical'
              const percentage = Math.min(100, (product.cantidad / ALERT_THRESHOLD) * 100)

              return (
                <motion.article
                  key={product.id}
                  className={[
                    'alerts-row',
                    isCritical ? 'alerts-row--critical' : 'alerts-row--low',
                  ].join(' ')}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.045, ease: EASE_OUT }}
                  aria-label={`${product.producto}, estado ${status.label}, ${product.cantidad} unidades`}
                >
                  <span className="alerts-row__mark" aria-hidden="true">
                    {isCritical ? (
                      <AlertOctagon size={20} strokeWidth={1.8} />
                    ) : (
                      <AlertTriangle size={20} strokeWidth={1.8} />
                    )}
                  </span>

                  <div className="alerts-row__identity">
                    <h3 className="alerts-row__name">{product.producto}</h3>
                    <p className="alerts-row__meta">
                      <span className="mono">{product.codigo}</span> · {product.categoria}
                    </p>
                  </div>

                  <StatusBadge status={status.status} />

                  <div className="alerts-row__stock">
                    <p className="alerts-row__qty">
                      <span className="alerts-row__value">{formatNumber(product.cantidad)}</span>
                      <span className="alerts-row__unit">
                        {pluralize(product.cantidad, 'unidad', 'unidades')}
                      </span>
                    </p>
                    <div
                      className="alerts-row__track"
                      role="img"
                      aria-label={`${product.cantidad} de ${ALERT_THRESHOLD} unidades del umbral`}
                    >
                      <span
                        className="alerts-row__fill"
                        style={{ '--alert-size': `${percentage}%` } as CSSProperties}
                      />
                    </div>
                  </div>

                  <div className="alerts-row__actions">
                    <Button type="button" size="sm" onClick={() => handleReplenish(product)}>
                      <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
                      Reponer {REPLENISH_AMOUNT}
                    </Button>
                    <Link className="alerts-row__link" to="/inventario">
                      Ver ficha
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </motion.section>
      )}
    </div>
  )
}
