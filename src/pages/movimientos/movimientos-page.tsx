import { useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Equal, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../app/providers/auth-provider'
import { errorMessage } from '../../logic/errors'
import { useInventoryStore } from '../../logic/store/inventory'
import { groupMovementsByDate } from '../../logic/store/selectors'
import { formatNumber, formatTime, pluralize } from '../../logic/services/formatters'
import { getMovementSummary } from '../../logic/services/stock'
import { validateMovementQuantity } from '../../logic/services/validation'
import {
  MOTIVOS_BY_TYPE,
  MOVEMENT_TYPES,
  type Motivo,
  type MovementType,
} from '../../logic/types'
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
  const [productoId, setProductoId] = useState('')
  const [tipo, setTipo] = useState<MovementType>('Entrada')
  const [motivo, setMotivo] = useState<Motivo>('Compra')
  const [cantidad, setCantidad] = useState(1)
  const [referencia, setReferencia] = useState('')
  const [nota, setNota] = useState('')
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
  const previewStock =
    selectedProduct && Number.isFinite(cantidad)
      ? tipo === 'Entrada'
        ? selectedProduct.stock + cantidad
        : tipo === 'Salida'
          ? Math.max(0, selectedProduct.stock - cantidad)
          : Math.max(0, cantidad)
      : null

  const handleProductChange = (id: string) => {
    setProductoId(id)
    if (tipo === 'Ajuste') {
      setCantidad(products.find((product) => product.id === id)?.stock ?? 0)
    }
    setError('')
  }

  const handleTipoChange = (option: MovementType) => {
    setTipo(option)
    setMotivo(MOTIVOS_BY_TYPE[option][0] ?? 'Compra')
    setCantidad(option === 'Ajuste' ? (selectedProduct?.stock ?? 0) : 1)
    setError('')
  }

  const resetForm = () => {
    setProductoId('')
    setTipo('Entrada')
    setMotivo('Compra')
    setCantidad(1)
    setReferencia('')
    setNota('')
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

    const validation = validateMovementQuantity(tipo, cantidad, selectedProduct.stock)
    if (validation) {
      setError(validation)
      return
    }

    try {
      addMovement({
        productoId: selectedProduct.id,
        tipo,
        cantidad,
        motivo,
        referencia,
        nota,
        usuario: user?.username ?? 'admin',
      })
    } catch (error) {
      toast.error(errorMessage(error))
      return
    }

    toast.success(
      `${tipo} de ${cantidad} ${pluralize(cantidad, 'unidad', 'unidades')} · ${selectedProduct.nombre}`,
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
                    onChange={(event) => handleProductChange(event.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'movement-error' : undefined}
                  >
                    <option value="">Elige un producto…</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.codigo} · {product.nombre} ({product.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-line">
                  <span className="field-line__label" id="movement-type-label">
                    Tipo
                  </span>
                  <div className="segmented" role="group" aria-labelledby="movement-type-label">
                    {MOVEMENT_TYPES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={[
                          'segmented__option',
                          tipo === option ? 'segmented__option--active' : '',
                          option === 'Entrada'
                            ? 'segmented__option--in'
                            : option === 'Salida'
                              ? 'segmented__option--out'
                              : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => handleTipoChange(option)}
                        aria-pressed={tipo === option}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-line">
                  <label className="field-line__label" htmlFor="movement-quantity">
                    {tipo === 'Ajuste' ? 'Conteo real (stock)' : 'Cantidad'}
                  </label>
                  <input
                    id="movement-quantity"
                    className="field-line__control mono"
                    type="number"
                    min={tipo === 'Ajuste' ? 0 : 1}
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

                <div className="field-line">
                  <label className="field-line__label" htmlFor="movement-motivo">
                    Motivo
                  </label>
                  <select
                    id="movement-motivo"
                    className="field-line__control"
                    value={motivo}
                    onChange={(event) => {
                      setMotivo(event.target.value as Motivo)
                      setError('')
                    }}
                  >
                    {MOTIVOS_BY_TYPE[tipo].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-line">
                  <label className="field-line__label" htmlFor="movement-referencia">
                    Referencia
                  </label>
                  <input
                    id="movement-referencia"
                    className="field-line__control"
                    type="text"
                    placeholder="Opcional"
                    value={referencia}
                    onChange={(event) => setReferencia(event.target.value)}
                  />
                </div>

                <div className="field-line">
                  <label className="field-line__label" htmlFor="movement-nota">
                    Nota
                  </label>
                  <input
                    id="movement-nota"
                    className="field-line__control"
                    type="text"
                    placeholder="Opcional"
                    value={nota}
                    onChange={(event) => setNota(event.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="form-error" id="movement-error" role="alert">
                  {error}
                </p>
              )}
              {selectedProduct && !error && (
                <p className="movement-form__help">
                  {selectedProduct.stock} uds. de {selectedProduct.nombre}
                  {previewStock !== null
                    ? ` · ${selectedProduct.stock} → ${previewStock} uds.`
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
                  const isOut = movement.tipo === 'Salida'
                  return (
                    <div
                      className={[
                        'ledger-move',
                        isIn ? 'ledger-move--in' : '',
                        isOut ? 'ledger-move--out' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      key={movement.id}
                    >
                      <span className="ledger-move__sign" aria-hidden="true">
                        {isIn ? (
                          <ArrowUp size={17} strokeWidth={2} />
                        ) : isOut ? (
                          <ArrowDown size={17} strokeWidth={2} />
                        ) : (
                          <Equal size={17} strokeWidth={2} />
                        )}
                      </span>
                      <span className="ledger-move__product">{movement.productoNombre}</span>
                      <span className="ledger-move__meta">
                        {movement.tipo} · {movement.usuario}
                        {movement.tipo === 'Ajuste'
                          ? ` · ${movement.motivo} · ${getMovementSummary(movement)}`
                          : ''}
                      </span>
                      <span
                        className={[
                          'ledger-move__amount',
                          isIn ? 'ledger-move__amount--in' : '',
                          isOut ? 'ledger-move__amount--out' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {isIn ? '+' : isOut ? '−' : ''}
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
