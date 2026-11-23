import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { AlertOctagon, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../app/providers/auth-provider'
import { useAlerts } from '../../logic/hooks/useInventoryStats'
import { useInventoryStore } from '../../logic/store/inventory'
import { getProductStatus } from '../../logic/store/selectors'
import { errorMessage } from '../../logic/errors'
import { getSuggestedQuantity } from '../../logic/services/stock'
import { formatNumber, pluralize } from '../../logic/services/formatters'
import type { Product } from '../../logic/types'
import { Button } from '../../components/ui/button'
import { EmptyState } from '../../components/ui/empty-state'
import { StatusBadge } from '../../components/ui/status-badge'
import { PageTitle } from '../../components/ui/page-title'
import { Stamp } from '../../components/ui/stamp'
import { WarehouseShelf } from '../../components/illustrations/warehouse-shelf'
import { EASE_OUT } from '../../components/illustrations/motion'

/** Sólo se usa si no hay una cantidad sugerida calculada. */
const FALLBACK_REPLENISH_AMOUNT = 10

export const AlertasPage = () => {
  const { alerts, critical, warning } = useAlerts()
  const addMovement = useInventoryStore((state) => state.addMovement)
  const { user } = useAuth()

  const handleReplenish = (product: Product, amount: number) => {
    try {
      addMovement({
        productoId: product.id,
        tipo: 'Entrada',
        cantidad: amount,
        motivo: 'Compra',
        referencia: 'Reposición desde alertas',
        nota: `Mínimo: ${product.stockMinimo}`,
        usuario: user?.username ?? 'admin',
      })
    } catch (error) {
      toast.error(errorMessage(error))
      return
    }
    toast.success(
      `Repuesto: +${amount} ${pluralize(amount, 'unidad', 'unidades')} de ${product.nombre}`,
    )
  }

  return (
    <div className="page alerts">
      <header className="page-head">
        <div className="page-head__main">
          <PageTitle lines={['LO QUE', 'FALTA']} />
          <p className="page-head__sub">
            {alerts.length === 0
              ? 'Nada falta. Todo está por encima de su mínimo.'
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
          <StatusBadge status="agotado" />
          <span className="alert-legend__note">0 unidades</span>
        </div>
        <div className="alert-legend__item">
          <StatusBadge status="critico" />
          <span className="alert-legend__note">hasta la mitad del mínimo</span>
        </div>
        <div className="alert-legend__item">
          <StatusBadge status="bajo" />
          <span className="alert-legend__note">hasta el mínimo</span>
        </div>
        <p className="alert-legend__threshold">
          Umbral de reposición: el mínimo de cada referencia
        </p>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          illustration={<WarehouseShelf />}
          stamp="Todo en su sitio"
          title="No falta nada."
          description="Todas las referencias están por encima de su mínimo. El estante respira tranquilo."
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
                {alerts.length} {pluralize(alerts.length, 'ficha', 'fichas')} por debajo de su mínimo
              </p>
            </div>
            <Stamp tilt="left" className="alerts-board__stamp">
              {critical.length > 0 ? 'Falta stock' : 'Vigilar'}
            </Stamp>
          </div>

          <div className="alerts-list">
            {alerts.map((product, index) => {
              const status = getProductStatus(product)
              const isCritical = status.status === 'critico' || status.status === 'agotado'
              const suggested = getSuggestedQuantity(product) || FALLBACK_REPLENISH_AMOUNT
              const percentage = Math.min(
                100,
                (product.stock / Math.max(1, product.stockMinimo)) * 100,
              )

              return (
                <motion.article
                  key={product.id}
                  className={[
                    'alerts-row',
                    isCritical
                      ? `alerts-row--critical alerts-row--${status.status}`
                      : 'alerts-row--low',
                  ].join(' ')}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.045, ease: EASE_OUT }}
                  aria-label={`${product.nombre}, estado ${status.label}, ${product.stock} unidades, mínimo ${product.stockMinimo}`}
                >
                  <span className="alerts-row__mark" aria-hidden="true">
                    {isCritical ? (
                      <AlertOctagon size={20} strokeWidth={1.8} />
                    ) : (
                      <AlertTriangle size={20} strokeWidth={1.8} />
                    )}
                  </span>

                  <div className="alerts-row__identity">
                    <h3 className="alerts-row__name">{product.nombre}</h3>
                    <p className="alerts-row__meta">
                      <span className="mono">{product.codigo}</span> · {product.categoria} · mín.{' '}
                      {formatNumber(product.stockMinimo)}
                    </p>
                  </div>

                  <StatusBadge status={status.status} />

                  <div className="alerts-row__stock">
                    <p className="alerts-row__qty">
                      <span className="alerts-row__value">{formatNumber(product.stock)}</span>
                      <span className="alerts-row__unit">
                        {pluralize(product.stock, 'unidad', 'unidades')}
                      </span>
                    </p>
                    <div
                      className="alerts-row__track"
                      role="img"
                      aria-label={`${formatNumber(product.stock)} de ${formatNumber(product.stockMinimo)} unidades del mínimo`}
                    >
                      <span
                        className="alerts-row__fill"
                        style={{ '--alert-size': `${percentage}%` } as CSSProperties}
                      />
                    </div>
                  </div>

                  <div className="alerts-row__actions">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleReplenish(product, suggested)}
                    >
                      <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
                      Reponer {suggested}
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
