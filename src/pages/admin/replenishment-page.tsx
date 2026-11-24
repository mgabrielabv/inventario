import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input } from '../../components/ui/Field'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { ProductBox } from '../../components/box/ProductBox'
import { Sheet } from '../../components/ui/Sheet'
import { StatusDot } from '../../components/ui/StatusDot'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../app/providers/auth-provider'
import { logActivity } from '../../logic/services/audit'
import { errorMessage } from '../../logic/errors'
import { formatNumber } from '../../logic/services/formatters'
import { denyReason } from '../../logic/services/permissions'
import {
  compareUrgency, getAvailable, getProductStatus, getSuggestedQuantity, getTargetStock, needsReplenishment,
} from '../../logic/services/stock'
import { validateMovementQuantity } from '../../logic/services/validation'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import type { Product } from '../../logic/types'

export const AdminReplenishmentPage = () => {
  const { can, user } = useAuth()
  const { toast } = useToast()
  const products = useInventoryStore((state) => state.products)
  const addMovement = useInventoryStore((state) => state.addMovement)
  const orders = useOrdersStore((state) => state.orders)

  const [entryId, setEntryId] = useState<string | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [referencia, setReferencia] = useState('')
  const [error, setError] = useState('')

  const filas = useMemo(
    () => products
      .filter((product) => !product.archivado && needsReplenishment(product, orders))
      .sort((a, b) => compareUrgency(a, b, orders)),
    [products, orders],
  )

  const criticos = filas.filter((product) => getProductStatus(product, orders).status === 'critico').length
  const sugeridas = filas.reduce((sum, product) => sum + getSuggestedQuantity(product, orders), 0)
  const seleccionado: Product | null = filas.find((product) => product.id === entryId) ?? null

  const abrirEntrada = (product: Product) => {
    setEntryId(product.id)
    setCantidad(String(getSuggestedQuantity(product, orders)))
    setReferencia('')
    setError('')
  }

  const registrar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!seleccionado || !can('registrar:movimiento')) return
    const parsed = Number(cantidad)
    const validation = cantidad.trim() === ''
      ? 'Escribe la cantidad a ingresar'
      : validateMovementQuantity('Entrada', parsed, getAvailable(seleccionado, orders))
    if (validation) { setError(validation); return }
    try {
      addMovement({
        productoId: seleccionado.id, tipo: 'Entrada', cantidad: parsed, motivo: 'Compra',
        referencia, usuario: user?.name ?? 'sistema',
        nota: 'Entrada desde reposición',
      })
      logActivity(user?.name ?? 'sistema', 'Reposición registrada',
        `${formatNumber(parsed)} unidades en ${seleccionado.nombre}`)
      toast(`Entrada registrada en ${seleccionado.nombre}`)
      setEntryId(null)
    } catch (cause) {
      setError(errorMessage(cause))
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  return (
    <div className="admin-page container-admin">
      <header className="admin-page-head">
        <div className="col">
          <p className="t-min t-muted">Alertas de stock</p>
          <h1 className="t-ui t-strong">Reposición</h1>
          <p className="t-caption">
            Prioridad por estado y cobertura. Las unidades reservadas por pedidos activos se descuentan del disponible.
          </p>
        </div>
        <div className="admin-actions">
          <Link to="/admin/inventario" className="btn btn--secondary btn--sm">Ir al inventario</Link>
        </div>
      </header>

      <div className="admin-kpi-grid admin-kpi-grid--compact">
        <article className="kpi-card">
          <span className="kpi-label">Productos por reponer</span>
          <div className="kpi-value">{formatNumber(filas.length)}</div>
          <p className="kpi-detail">Por debajo de su mínimo</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Estado crítico</span>
          <div className="kpi-value">{formatNumber(criticos)}</div>
          <p className="kpi-detail">Requieren atención inmediata</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Unidades sugeridas</span>
          <div className="kpi-value">{formatNumber(sugeridas)}</div>
          <p className="kpi-detail">Para alcanzar el objetivo</p>
        </article>
      </div>

      {filas.length === 0 ? (
        <EmptyState title="Todo en orden" description="Ningún producto está por debajo de su mínimo."
          action={<Link to="/admin/inventario" className="btn btn--secondary btn--sm">Ver inventario</Link>} />
      ) : (
        <div className="table-wrap">
          <ResponsiveTable className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Estado</th>
                <th>Disponible</th>
                <th>Mínimo</th>
                <th>Objetivo</th>
                <th>Sugerido</th>
                <th className="admin-cell-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((product) => {
                const status = getProductStatus(product, orders)
                const sugerido = getSuggestedQuantity(product, orders)
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-cell">
                        <ProductBox categoria={product.categoria} codigo={product.codigo}
                          nombre={product.nombre} size={44} />
                        <div className="col">
                          <span className="t-mid">{product.nombre}</span>
                          <span className="product-code t-min t-muted">{product.codigo} · {product.ubicacion || 'Sin ubicación'}</span>
                        </div>
                      </div>
                    </td>
                    <td><StatusDot status={status.status} label={status.label} compact /></td>
                    <td className="t-num">{formatNumber(getAvailable(product, orders))}</td>
                    <td className="t-num">{formatNumber(product.stockMinimo)}</td>
                    <td className="t-num">{formatNumber(getTargetStock(product))}</td>
                    <td className="t-num t-strong">{formatNumber(sugerido)}</td>
                    <td>
                      <div className="actions">
                        {can('registrar:movimiento')
                          ? <Button size="sm" variant="secondary" onClick={() => abrirEntrada(product)}>Registrar entrada</Button>
                          : <span className="t-min t-muted">{denyReason('registrar:movimiento')}</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      <Sheet open={Boolean(seleccionado)} onClose={() => setEntryId(null)}
        title={`Entrada · ${seleccionado?.nombre ?? 'producto'}`}>
        {seleccionado && (
          <form className="admin-sheet-form" onSubmit={registrar} noValidate>
            <p className="t-caption t-pretty">
              Disponible {formatNumber(getAvailable(seleccionado, orders))} · objetivo {formatNumber(getTargetStock(seleccionado))}.
              Se registrará como entrada por compra.
            </p>
            <Field label="Cantidad a ingresar" required error={error || undefined}>
              {(id, describedBy) => (
                <Input id={id} type="number" min={1} step="1" aria-describedby={describedBy || undefined}
                  value={cantidad} onChange={(event) => { setCantidad(event.target.value); setError('') }} />
              )}
            </Field>
            <Field label="Referencia (opcional)">
              {(id) => (
                <Input id={id} value={referencia} placeholder="Factura o albarán"
                  onChange={(event) => setReferencia(event.target.value)} />
              )}
            </Field>
            <div className="admin-sheet-actions">
              <Button type="submit" size="sm" disabled={!can('registrar:movimiento')}>Guardar entrada</Button>
              <Button size="sm" variant="secondary" onClick={() => setEntryId(null)}>Cancelar</Button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  )
}
