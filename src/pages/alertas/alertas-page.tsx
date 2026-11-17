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
    toast.success(
      `Reposición registrada: +${REPLENISH_AMOUNT} unidades de ${product.producto}`,
    )
  }

  return (
    <div className="page alerts">
      <header className="page-head">
        <div>
          <div className="page-head__meta">
            <span className="page-head__index">04 / SEÑALES</span>
            <span className="page-head__rule" aria-hidden="true" />
            <span className="eyebrow">
              {alerts.length} {pluralize(alerts.length, 'alerta activa', 'alertas activas')}
            </span>
          </div>
          <h1 className="page-title">
            Alertas<em>.</em>
          </h1>
          <p className="page-head__sub">
            El stock bajo no es un error: es una señal. Revisa las referencias que necesitan
            reposición y registra la entrada en un solo gesto.
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

      <div className="alert-toolbar">
        <div className="alert-toolbar__legend">
          <StatusBadge status="critical" />
          <span className="alert-toolbar__note">menos de 5 unidades</span>
          <StatusBadge status="low" />
          <span className="alert-toolbar__note">entre 5 y 9 unidades</span>
        </div>
        <span className="alert-toolbar__note">
          Umbral de reposición: {ALERT_THRESHOLD} unidades
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="panel">
          <EmptyState
            illustration={<WarehouseShelf />}
            title="Nada por aquí todavía."
            description="Todas las referencias se encuentran dentro de los niveles óptimos. La estantería respira tranquila."
          />
        </div>
      ) : (
        <div className="alert-grid">
          {alerts.map((product, index) => {
            const status = getProductStatus(product.cantidad)
            const isCritical = status.status === 'critical'
            const percentage = Math.min(100, (product.cantidad / ALERT_THRESHOLD) * 100)

            return (
              <motion.article
                key={product.id}
                className={[
                  'alert-card',
                  isCritical ? 'alert-card--critical' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: index * 0.05, ease: EASE_OUT }}
                aria-label={`${product.producto}, estado ${status.label}, ${product.cantidad} unidades`}
              >
                <div className="alert-card__head">
                  <div className="alert-card__identity">
                    <span className="alert-card__icon" aria-hidden="true">
                      {isCritical ? (
                        <AlertOctagon size={18} strokeWidth={1.4} />
                      ) : (
                        <AlertTriangle size={18} strokeWidth={1.4} />
                      )}
                    </span>
                    <div>
                      <h2 className="alert-card__title">{product.producto}</h2>
                      <p className="alert-card__meta">
                        {product.codigo} · {product.categoria}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={status.status} />
                </div>

                <div>
                  <p className="alert-card__qty">
                    <span className="alert-card__value">{formatNumber(product.cantidad)}</span>
                    <span className="alert-card__unit">
                      {pluralize(product.cantidad, 'unidad', 'unidades')} en stock
                    </span>
                  </p>
                  <div className="alert-card__threshold">
                    <span>Nivel actual</span>
                    <span>{Math.round(percentage)}% del umbral</span>
                  </div>
                  <div
                    className="alert-card__track"
                    role="img"
                    aria-label={`${product.cantidad} de ${ALERT_THRESHOLD} unidades del umbral`}
                  >
                    <span
                      className="alert-card__fill"
                      style={{ '--alert-size': `${percentage}%` } as CSSProperties}
                    />
                  </div>
                </div>

                <div className="alert-card__actions">
                  <Button type="button" onClick={() => handleReplenish(product)}>
                    <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
                    Reponer {REPLENISH_AMOUNT}
                  </Button>
                  <Link className="btn btn--outline" to="/inventario">
                    Ver catálogo
                  </Link>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}
    </div>
  )
}
