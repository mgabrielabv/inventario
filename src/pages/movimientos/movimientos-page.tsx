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
import { PageTitle } from '../../components/ui/page-title'
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
      setError('Elige un producto para anotar el movimiento')
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
        <div className="page-head__main">
          <PageTitle lines={['LO QUE ENTRÓ', 'Y SALIÓ']} />
          <p className="page-head__sub">
            Cada entrada y cada salida queda firmada. Quién, qué, cuánto y a qué hora.
          </p>
        </div>
        <div className="page-head__aside">
          <div className="page-head__stat">
            <span className="page-head__stat-value">{formatNumber(totals.registros)}</span>
            <span className="page-head__stat-label">Registros</span>
          </div>
          <Button type="button" onClick={() => (formOpen ? closeForm() : setFormOpen(true))}>
            {formOpen ? (
              <X size={16} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
            )}
            {formOpen ? 'Cerrar' : 'Anotar movimiento'}
          </Button>
        </div>
      </header>

      <div className="movements-tally" role="group" aria-label="Totales del libro">
        <div className="movements-tally__item">
          <span className="movements-tally__label">Entradas</span>
          <span className="movements-tally__value movements-tally__value--in">
            +{formatNumber(totals.entradas)}
          </span>
        </div>
        <div className="movements-tally__item">
          <span className="movements-tally__label">Salidas</span>
          <span className="movements-tally__value movements-tally__value--out">
            −{formatNumber(totals.salidas)}
          </span>
        </div>
        <div className="movements-tally__item">
          <span className="movements-tally__label">Anotaciones</span>
          <span className="movements-tally__value">{formatNumber(totals.registros)}</span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {formOpen && (
          <motion.div
            className="movement-form kraft"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <form onSubmit={handleSubmit} noValidate>
              <div className="movement-form__grid">
                <div className="field-line movement-form__product">
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
                    <option value={0}>Elige un producto…</option>
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
                  <Button type="submit">Anotar</Button>
                  <Button type="button" variant="outline" onClick={closeForm}>
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
                <p className="movement-form__help">
                  Quedan {selectedProduct.cantidad} uds. de {selectedProduct.producto}
                  {tipo === 'Salida' && cantidad > 0
                    ? ` · después de esta salida: ${Math.max(0, selectedProduct.cantidad - cantidad)}`
                    : ''}
                </p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {groups.length === 0 ? (
        <EmptyState
          illustration={<PalletArrows />}
          stamp="Sin anotar"
          title="El libro está en blanco."
          description="Anota la primera entrada o salida y el historial empieza a escribirse."
        />
      ) : (
        <div className="ledger-book">
          {groups.map((group, groupIndex) => (
            <motion.section
              key={group.date}
              className="ledger-day"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: groupIndex * 0.06, ease: EASE_OUT }}
              aria-label={group.date}
            >
              <div className="ledger-day__head">
                <h2 className="ledger-day__title">{group.date}</h2>
                <span className="ledger-day__rule" aria-hidden="true" />
                <span className="ledger-day__count">
                  {group.movements.length}{' '}
                  {pluralize(group.movements.length, 'movimiento', 'movimientos')}
                </span>
              </div>

              <div className="ledger-day__list">
                {group.movements.map((movement) => {
                  const isIn = movement.tipo === 'Entrada'
                  return (
                    <div
                      className={['ledger-move', isIn ? 'ledger-move--in' : 'ledger-move--out']
                        .filter(Boolean)
                        .join(' ')}
                      key={movement.id}
                    >
                      <span className="ledger-move__sign" aria-hidden="true">
                        {isIn ? (
                          <ArrowUp size={17} strokeWidth={2} />
                        ) : (
                          <ArrowDown size={17} strokeWidth={2} />
                        )}
                      </span>
                      <span className="ledger-move__product">{movement.producto}</span>
                      <span className="ledger-move__meta">
                        {movement.tipo} · {movement.usuario}
                      </span>
                      <span
                        className={[
                          'ledger-move__amount',
                          isIn ? 'ledger-move__amount--in' : 'ledger-move__amount--out',
                        ].join(' ')}
                      >
                        {isIn ? '+' : '−'}
                        {formatNumber(movement.cantidad)}
                      </span>
                      <span className="ledger-move__time">{formatTime(movement.fecha)}</span>
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
