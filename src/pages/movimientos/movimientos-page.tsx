import { useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../app/providers/auth-provider'
import { useInventoryStore } from '../../logic/store/inventory'
import { groupMovementsByDate } from '../../logic/store/selectors'
import { formatNumber, formatTime, pluralize } from '../../logic/services/formatters'
import { validateMovementQuantity } from '../../logic/services/validation'
import type { MovementType } from '../../logic/types'
import { Button } from '../../components/ui/button'
import { EmptyState } from '../../components/ui/empty-state'
import { PalletArrows } from '../../components/illustrations/pallet-arrows'
import { EASE_OUT } from '../../components/illustrations/motion'

export const MovimientosPage = () => {
  const products = useInventoryStore((state) => state.products)
  const movements = useInventoryStore((state) => state.movements)
  const addMovement = useInventoryStore((state) => state.addMovement)
  const { user } = useAuth()

  const [formOpen, setFormOpen] = useState(false)
  const [productoId, setProductoId] = useState(0)
  const [tipo, setTipo] = useState<MovementType>('Entrada')
  const [cantidad, setCantidad] = useState(1)
  const [error, setError] = useState('')

  const groups = useMemo(() => groupMovementsByDate(movements), [movements])
  const totals = useMemo(() => {
    const entradas = movements
      .filter((movement) => movement.tipo === 'Entrada')
      .reduce((sum, movement) => sum + movement.cantidad, 0)
    const salidas = movements
      .filter((movement) => movement.tipo === 'Salida')
      .reduce((sum, movement) => sum + movement.cantidad, 0)
    return { entradas, salidas, registros: movements.length }
  }, [movements])

  const selectedProduct = products.find((product) => product.id === productoId)

  const resetForm = () => {
    setProductoId(0)
    setTipo('Entrada')
    setCantidad(1)
    setError('')
  }

  const closeForm = () => {
    setFormOpen(false)
    resetForm()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!selectedProduct) {
      setError('Selecciona un producto para registrar el movimiento')
      return
    }

    const validation = validateMovementQuantity(tipo, cantidad, selectedProduct.cantidad)
    if (validation) {
      setError(validation)
      return
    }

    addMovement({
      productoId: selectedProduct.id,
      producto: selectedProduct.producto,
      tipo,
      cantidad,
      usuario: user?.username ?? 'admin',
    })
    toast.success(
      `${tipo} de ${cantidad} ${pluralize(cantidad, 'unidad', 'unidades')} · ${selectedProduct.producto}`,
    )
    closeForm()
  }

  return (
    <div className="page movements">
      <header className="page-head">
        <div>
          <div className="page-head__meta">
            <span className="page-head__index">03 / BITÁCORA</span>
            <span className="page-head__rule" aria-hidden="true" />
            <span className="eyebrow">
              {movements.length} {pluralize(movements.length, 'registro', 'registros')}
            </span>
          </div>
          <h1 className="page-title">
            Movimientos<em>.</em>
          </h1>
          <p className="page-head__sub">
            Entradas y salidas con trazabilidad completa. Cada lectura deja rastro y cada
            cantidad actualiza el stock.
          </p>
        </div>
        <Button type="button" onClick={() => (formOpen ? closeForm() : setFormOpen(true))}>
          {formOpen ? (
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
          )}
          {formOpen ? 'Cerrar' : 'Registrar movimiento'}
        </Button>
      </header>

      <div className="movements-summary">
        <div className="movements-summary__item">
          <span className="movements-summary__label">Entradas</span>
          <span className="movements-summary__value movements-summary__value--in">
            +{formatNumber(totals.entradas)}
          </span>
        </div>
        <div className="movements-summary__item">
          <span className="movements-summary__label">Salidas</span>
          <span className="movements-summary__value movements-summary__value--out">
            −{formatNumber(totals.salidas)}
          </span>
        </div>
        <div className="movements-summary__item">
          <span className="movements-summary__label">Registros</span>
          <span className="movements-summary__value">{formatNumber(totals.registros)}</span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {formOpen && (
          <motion.div
            className="movement-form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <form onSubmit={handleSubmit} noValidate>
              <div className="movement-form__grid">
                <div className="field-line">
                  <label className="field-line__label" htmlFor="movement-product">
                    Producto
                  </label>
                  <select
                    id="movement-product"
                    className="field-line__control"
                    value={productoId}
                    onChange={(event) => {
                      setProductoId(Number(event.target.value))
                      setError('')
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'movement-error' : undefined}
                  >
                    <option value={0}>Seleccionar referencia…</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.codigo} · {product.producto} ({product.cantidad})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-line">
                  <span className="field-line__label" id="movement-type-label">
                    Tipo
                  </span>
                  <div className="segmented" role="group" aria-labelledby="movement-type-label">
                    {(['Entrada', 'Salida'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={[
                          'segmented__option',
                          tipo === option ? 'segmented__option--active' : '',
                          option === 'Entrada' ? 'segmented__option--in' : 'segmented__option--out',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => {
                          setTipo(option)
                          setError('')
                        }}
                        aria-pressed={tipo === option}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-line">
                  <label className="field-line__label" htmlFor="movement-quantity">
                    Cantidad
                  </label>
                  <input
                    id="movement-quantity"
                    className="field-line__control mono"
                    type="number"
                    min="1"
                    step="1"
                    value={cantidad}
                    onChange={(event) => {
                      setCantidad(Number(event.target.value))
                      setError('')
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'movement-error' : undefined}
                  />
                </div>

                <div className="movement-form__actions">
                  <Button type="submit">Registrar</Button>
                  <Button type="button" variant="ghost" onClick={closeForm}>
                    Cancelar
                  </Button>
                </div>
              </div>

              {error && (
                <p className="form-error" id="movement-error" role="alert">
                  {error}
                </p>
              )}
              {selectedProduct && !error && (
                <p className="form-help">
                  Stock actual de {selectedProduct.producto}: {selectedProduct.cantidad} uds.
                  {tipo === 'Salida' && cantidad > 0
                    ? ` · quedarían ${Math.max(0, selectedProduct.cantidad - cantidad)} uds.`
                    : ''}
                </p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {groups.length === 0 ? (
        <div className="panel">
          <EmptyState
            illustration={<PalletArrows />}
            title="La bitácora está en blanco."
            description="Registra la primera entrada o salida y el historial empezará a escribirse."
          />
        </div>
      ) : (
        <div className="timeline">
          {groups.map((group, groupIndex) => (
            <motion.section
              key={group.date}
              className="timeline-day"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: groupIndex * 0.06, ease: EASE_OUT }}
              aria-label={group.date}
            >
              <div className="timeline-day__head">
                <h2 className="timeline-day__title">{group.date}</h2>
                <span className="timeline-day__rule" aria-hidden="true" />
                <span className="timeline-day__count">
                  {group.movements.length}{' '}
                  {pluralize(group.movements.length, 'movimiento', 'movimientos')}
                </span>
              </div>

              <div className="timeline-day__list">
                {group.movements.map((movement) => {
                  const isIn = movement.tipo === 'Entrada'
                  return (
                    <div className="timeline-item" key={movement.id}>
                      <span
                        className={[
                          'timeline-item__node',
                          isIn ? '' : 'timeline-item__node--out',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-hidden="true"
                      />
                      <div className="timeline-card">
                        <span
                          className={[
                            'timeline-card__icon',
                            isIn ? 'timeline-card__icon--in' : 'timeline-card__icon--out',
                          ].join(' ')}
                          aria-hidden="true"
                        >
                          {isIn ? (
                            <ArrowUp size={16} strokeWidth={1.4} />
                          ) : (
                            <ArrowDown size={16} strokeWidth={1.4} />
                          )}
                        </span>
                        <div className="timeline-card__body">
                          <p className="timeline-card__product">{movement.producto}</p>
                          <p className="timeline-card__meta">
                            {movement.tipo} · {movement.usuario}
                          </p>
                        </div>
                        <div className="timeline-card__right">
                          <p
                            className={[
                              'timeline-card__amount',
                              isIn
                                ? 'timeline-card__amount--in'
                                : 'timeline-card__amount--out',
                            ].join(' ')}
                          >
                            {isIn ? '+' : '−'}
                            {movement.cantidad}
                          </p>
                          <p className="timeline-card__time">{formatTime(movement.fecha)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  )
}
