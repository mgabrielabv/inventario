import { useMemo, useState, type FormEvent } from 'react'
import { ClipboardList, History } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Combobox } from '../../components/ui/Combobox'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input, Select } from '../../components/ui/Field'
import { Segmented } from '../../components/ui/Segmented'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../app/providers/auth-provider'
import { logActivity } from '../../logic/services/audit'
import { formatGroupDate, formatNumber, formatTime } from '../../logic/services/formatters'
import { errorMessage } from '../../logic/errors'
import { denyReason } from '../../logic/services/permissions'
import {
  buildKardex, getAvailable, getMovementDelta, getMovementSummary,
} from '../../logic/services/stock'
import { validateMovementQuantity } from '../../logic/services/validation'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import {
  MOTIVOS_BY_TYPE, type Motivo, type Movement, type MovementType,
} from '../../logic/types'

const TYPE_OPTIONS: Array<{ value: MovementType; label: string }> = [
  { value: 'Entrada', label: 'Entrada' },
  { value: 'Salida', label: 'Salida' },
  { value: 'Ajuste', label: 'Ajuste' },
]

const deltaText = (movement: Movement): string => {
  const delta = getMovementDelta(movement)
  return `${delta > 0 ? '+' : ''}${formatNumber(delta)}`
}

export const AdminMovementsPage = () => {
  const { can, user } = useAuth()
  const { toast } = useToast()
  const products = useInventoryStore((state) => state.products)
  const movements = useInventoryStore((state) => state.movements)
  const addMovement = useInventoryStore((state) => state.addMovement)
  const voidMovement = useInventoryStore((state) => state.voidMovement)
  const orders = useOrdersStore((state) => state.orders)

  const [productoId, setProductoId] = useState('')
  const [tipo, setTipo] = useState<MovementType>('Entrada')
  const [motivo, setMotivo] = useState<Motivo>('Compra')
  const [cantidad, setCantidad] = useState('1')
  const [referencia, setReferencia] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('todos')
  const [kardexId, setKardexId] = useState<string | null>(null)
  const [voidId, setVoidId] = useState<string | null>(null)
  const [voidNota, setVoidNota] = useState('')

  const activos = useMemo(() => products.filter((product) => !product.archivado), [products])
  const selected = activos.find((product) => product.id === productoId) ?? null
  const disponible = selected ? getAvailable(selected, orders) : 0

  const opciones = useMemo(() => activos.map((product) => ({
    id: product.id,
    label: `${product.nombre} · ${product.codigo}`,
    sub: `${product.ubicacion || 'Sin ubicación'} · ${formatNumber(getAvailable(product, orders))} disponibles`,
  })), [activos, orders])

  const changeTipo = (next: MovementType) => {
    setTipo(next)
    setMotivo(MOTIVOS_BY_TYPE[next][0] ?? 'Compra')
    setError('')
  }

  const registrar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!can('registrar:movimiento')) {
      setError(denyReason('registrar:movimiento'))
      return
    }
    if (!selected) {
      setError('Selecciona un producto')
      return
    }
    const parsed = Number(cantidad)
    const validation = cantidad.trim() === ''
      ? (tipo === 'Ajuste' ? 'Escribe el conteo real' : 'Escribe la cantidad')
      : validateMovementQuantity(tipo, parsed, disponible)
    if (validation) { setError(validation); return }
    setError('')

    try {
      addMovement({
        productoId: selected.id, tipo, cantidad: parsed, motivo,
        referencia, nota, usuario: user?.name ?? 'sistema',
      })
      logActivity(user?.name ?? 'sistema', 'Movimiento registrado',
        `${tipo} de ${formatNumber(parsed)} en ${selected.nombre} · ${motivo}`)
      toast(`${tipo} registrada en ${selected.nombre}`)
      setCantidad('1')
      setReferencia('')
      setNota('')
    } catch (cause) {
      setError(errorMessage(cause))
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  const confirmarAnulacion = (movement: Movement) => {
    try {
      voidMovement(movement.id, user?.name ?? 'sistema', voidNota.trim() || 'Anulación desde el panel')
      logActivity(user?.name ?? 'sistema', 'Movimiento anulado',
        `${movement.tipo} de ${formatNumber(movement.cantidad)} · ${movement.productoNombre}`)
      toast('Movimiento anulado; se creó el contramovimiento')
      setVoidId(null)
      setVoidNota('')
    } catch (cause) {
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  const filtrados = useMemo(() => {
    const list = filtroProducto === 'todos'
      ? movements
      : movements.filter((movement) => movement.productoId === filtroProducto)
    return [...list].sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [movements, filtroProducto])

  const grupos = useMemo(() => {
    const map = new Map<string, Movement[]>()
    for (const movement of filtrados) {
      const key = formatGroupDate(movement.fecha)
      const list = map.get(key) ?? []
      list.push(movement)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [filtrados])

  const kardex = useMemo(
    () => kardexId ? buildKardex(movements.filter((movement) => movement.productoId === kardexId)) : [],
    [kardexId, movements],
  )
  const kardexProducto = products.find((product) => product.id === kardexId)

  return (
    <div className="admin-page container-admin">
      <header className="admin-page-head">
        <div className="col">
          <p className="t-min t-muted">Entradas, salidas y ajustes</p>
          <h1 className="t-ui t-strong">Movimientos</h1>
          <p className="t-caption">Cada registro cambia el stock real y deja huella en el kardex del producto.</p>
        </div>
      </header>

      <div className="admin-grid-form">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2 className="t-ui t-strong">Registrar movimiento</h2>
              <p className="t-min t-muted">Pulsa Enter para guardar; en el buscador, las flechas recorren la lista.</p>
            </div>
          </div>
          {!can('registrar:movimiento') && <p className="inline-note">{denyReason('registrar:movimiento')}</p>}
          <form className="admin-sheet-form" onSubmit={registrar} noValidate>
            <Field label="Producto" required>
              {() => (
                <Combobox options={opciones} value={productoId} onChange={(id) => { setProductoId(id); setError('') }}
                  placeholder="Nombre o código del producto" />
              )}
            </Field>
            {selected && (
              <p className="inline-note">
                {selected.nombre} · stock {formatNumber(selected.stock)} · {formatNumber(disponible)} disponibles
              </p>
            )}
            <Segmented value={tipo} options={TYPE_OPTIONS} onChange={changeTipo} label="Tipo de movimiento" size="sm" />
            <div className="admin-form-grid">
              <Field label="Motivo" required>
                {(id) => (
                  <Select id={id} value={motivo} onChange={(event) => setMotivo(event.target.value as Motivo)}>
                    {MOTIVOS_BY_TYPE[tipo].map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                )}
              </Field>
              <Field label={tipo === 'Ajuste' ? 'Conteo real' : 'Cantidad'} required
                hint={tipo === 'Salida' ? `Máximo ${formatNumber(disponible)} unidades` : undefined}>
                {(id, describedBy) => (
                  <Input id={id} type="number" step="1"
                    aria-describedby={describedBy || undefined} value={cantidad}
                    onChange={(event) => { setCantidad(event.target.value); setError('') }} />
                )}
              </Field>
              <Field label="Referencia">
                {(id) => (
                  <Input id={id} value={referencia} placeholder="Factura, pedido o albarán"
                    onChange={(event) => setReferencia(event.target.value)} />
                )}
              </Field>
              <Field label="Nota">
                {(id) => (
                  <Input id={id} value={nota} placeholder="Detalle opcional"
                    onChange={(event) => setNota(event.target.value)} />
                )}
              </Field>
            </div>
            {error && <p className="inline-alert" role="alert">{error}</p>}
            <div className="admin-sheet-actions">
              <Button type="submit" size="sm" disabled={!can('registrar:movimiento')}>Guardar movimiento</Button>
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2 className="t-ui t-strong">Historial</h2>
              <p className="t-min t-muted">{formatNumber(movements.length)} movimientos registrados</p>
            </div>
            <Field label="Ver producto">
              {(id) => (
                <Select id={id} value={filtroProducto} onChange={(event) => setFiltroProducto(event.target.value)}>
                  <option value="todos">Todos</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.nombre}</option>)}
                </Select>
              )}
            </Field>
          </div>
          {grupos.length === 0 ? (
            <EmptyState compact title="Sin movimientos" description="Registra una entrada para comenzar." />
          ) : (
            <div className="admin-movements-list">
              {grupos.map(([fecha, items]) => (
                <section className="admin-movement-group" key={fecha}>
                  <h3 className="admin-movement-group__date t-min t-muted">{fecha}</h3>
                  <ul className="admin-list">
                    {items.map((movement) => (
                      <li className="admin-list__row admin-list__row--stack" key={movement.id}>
                        <div className="col">
                          <span className="t-mid">{movement.productoNombre}</span>
                          <span className="t-min t-muted">
                            {formatTime(movement.fecha)} · {movement.motivo}
                            {movement.referencia ? ` · ${movement.referencia}` : ''}
                          </span>
                          {movement.nota && <span className="t-min t-muted t-pretty">{movement.nota}</span>}
                          {movement.anuladoPor && <span className="t-min t-muted">Anulado posteriormente</span>}
                        </div>
                        <div className="admin-movement-meta">
                          <span className={`admin-delta ${getMovementDelta(movement) >= 0 ? 'admin-delta--in' : 'admin-delta--out'}`}>
                            {deltaText(movement)}
                          </span>
                          <span className="t-min t-muted">{getMovementSummary(movement)} · {movement.usuario}</span>
                          <div className="row">
                            <button type="button" className="link-button t-min"
                              onClick={() => setKardexId(movement.productoId)}>Kardex</button>
                            {can('anular:movimiento') && !movement.anuladoPor && movement.motivo !== 'Anulación' && (
                              <button type="button" className="link-button t-min"
                                onClick={() => { setVoidId(voidId === movement.id ? null : movement.id); setVoidNota('') }}>
                                Anular
                              </button>
                            )}
                          </div>
                          {voidId === movement.id && (
                            <div className="admin-confirm">
                              <Field label="Motivo de la anulación">
                                {(id) => (
                                  <Input id={id} value={voidNota} placeholder="Detalle opcional"
                                    onChange={(event) => setVoidNota(event.target.value)} />
                                )}
                              </Field>
                              <div className="row">
                                <Button size="sm" variant="danger" onClick={() => confirmarAnulacion(movement)}>Confirmar</Button>
                                <Button size="sm" variant="secondary" onClick={() => setVoidId(null)}>Cancelar</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>

      <Sheet open={Boolean(kardexId)} onClose={() => setKardexId(null)}
        title={`Kardex · ${kardexProducto?.nombre ?? 'producto'}`}>
        <div className="admin-sheet-form">
          <p className="t-caption t-pretty">
            Saldo calculado desde el primer movimiento. Las anulaciones aparecen como movimientos inversos.
          </p>
          {kardex.length === 0 ? (
            <EmptyState compact title="Sin kardex" description="Este producto aún no tiene movimientos." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Fecha</th><th>Movimiento</th><th>Cantidad</th><th>Saldo</th></tr>
                </thead>
                <tbody>
                  {kardex.map((row) => (
                    <tr key={row.movement.id}>
                      <td className="t-min">{formatTime(row.movement.fecha)}</td>
                      <td>{row.movement.tipo}<span className="t-min t-muted"> · {row.movement.motivo}</span></td>
                      <td className={`t-num ${getMovementDelta(row.movement) >= 0 ? 't-primary' : 't-clay'}`}>
                        {deltaText(row.movement)}
                      </td>
                      <td className="t-num t-mid">{formatNumber(row.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Sheet>
      <p className="admin-footnote"><ClipboardList size={14} strokeWidth={1.5} /> Los movimientos son la única vía para cambiar existencias.</p>
      <p className="admin-footnote"><History size={14} strokeWidth={1.5} /> Las anulaciones crean un movimiento inverso y no borran el original.</p>
    </div>
  )
}
