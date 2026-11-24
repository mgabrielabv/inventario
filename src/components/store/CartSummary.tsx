import { ArrowRight, Tag, Truck } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { validateCart } from '../../logic/services/cart'
import { couponStatus } from '../../logic/services/checkout'
import { buildOrderLines } from '../../logic/services/orders'
import { calcTotals, findCoupon, formatMoney, formatSecondary } from '../../logic/services/pricing'
import { useCartDraftStore } from '../../logic/store/cartDraft'
import { useCartStore } from '../../logic/store/cart'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'

interface Props {
  compact?: boolean
  onNavigate?: () => void
  /** Variante móvil: solo total y acción, anclada al pie de la pantalla. */
  mobileBar?: boolean
}

/** Resumen sticky del carrito: cupón, envío, entrega, nota y totales. */
export const CartSummary = ({ compact = false, onNavigate, mobileBar = false }: Props) => {
  const navigate = useNavigate()
  const lines = useCartStore((state) => state.lines)
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const settings = useSettingsStore((state) => state.settings)
  const draft = useCartDraftStore()
  const active = useMemo(() => lines.filter((line) => !line.guardado), [lines])
  const issues = useMemo(
    () => validateCart(active, products, orders), [active, products, orders],
  )
  const entrega = draft.entrega === 'delivery'
    ? { tipo: 'delivery' as const, zona: draft.zona || undefined, direccion: draft.direccion || undefined }
    : { tipo: 'retiro' as const }
  const totals = useMemo(() => calcTotals(
    buildOrderLines(active, products), entrega, settings, findCoupon(draft.cupon, settings),
  ), [active, products, entrega, settings, draft.cupon])
  const status = couponStatus(draft.cupon, settings, totals.subtotal)
  const threshold = settings.entrega.envioGratisDesde
  const freeShipping = totals.envio === 0
  const progress = threshold && threshold > 0
    ? Math.min(100, Math.round((totals.subtotal / threshold) * 100)) : 0
  const blocking = issues.some((issue) => issue.tipo !== 'precio')

  const go = () => { onNavigate?.(); navigate('/pagar') }

  if (mobileBar) {
    return (
      <div className="cart-mobile-bar" aria-label="Total del carrito">
        <div>
          <span className="t-min t-muted">Total</span>
          <p className="price t-strong">{formatMoney(totals.total)}</p>
        </div>
        <Button full disabled={active.length === 0 || blocking} onClick={go}>
          Continuar al pago <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <aside className={`cart-summary${compact ? ' cart-summary--compact' : ''}`} aria-label="Resumen del carrito">
      <h2 className="t-ui t-strong">Resumen</h2>

      <div className="cart-summary__coupon">
        <Field label="Cupón" hint="Puedes probar BIENVENIDO10 o ENVIOGRATIS">
          {(id, describedBy) => (
            <div className="cart-summary__coupon-row">
              <Input
                id={id}
                value={draft.cupon}
                placeholder="Código"
                aria-describedby={describedBy || undefined}
                autoComplete="off"
                inputMode="text"
                enterKeyHint="done"
                onChange={(event) => draft.patch({ cupon: event.target.value.toUpperCase() })}
              />
              {draft.cupon && (
                <button
                  type="button"
                  className="cart-summary__clear"
                  onClick={() => draft.patch({ cupon: '' })}
                  aria-label="Quitar cupón"
                >
                  Quitar
                </button>
              )}
            </div>
          )}
        </Field>
        {status.mensaje && (
          <p className={`cart-summary__coupon-status t-min${status.valido ? ' is-valid' : ''}`} role="status">
            <Tag size={14} strokeWidth={1.6} aria-hidden="true" /> {status.mensaje}
          </p>
        )}
      </div>

      <div className="cart-summary__shipping">
        <div className="cart-summary__shipping-head">
          <Truck size={17} strokeWidth={1.6} aria-hidden="true" />
          <span className="t-caption t-strong">
            {freeShipping ? 'Envío sin costo' : 'Envío calculado en el checkout'}
          </span>
        </div>
        {threshold && threshold > 0 ? (
          <>
            <div
              className="shipping-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Progreso hacia envío sin costo"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="t-min t-muted">
              {freeShipping
                ? 'Ya tienes el envío sin costo aplicado.'
                : `Te faltan ${formatMoney(Math.max(0, threshold - totals.subtotal))} para envío sin costo.`}
            </p>
          </>
        ) : (
          <p className="t-min t-muted">La tarifa depende de la zona que elijas al pagar.</p>
        )}
      </div>

      <fieldset className="cart-summary__delivery">
        <legend className="t-caption t-strong">Entrega</legend>
        <div className="cart-summary__delivery-options">
          <button
            type="button"
            className={draft.entrega === 'retiro' ? 'is-active' : ''}
            aria-pressed={draft.entrega === 'retiro'}
            onClick={() => draft.patch({ entrega: 'retiro' })}
          >
            Retiro
          </button>
          <button
            type="button"
            className={draft.entrega === 'delivery' ? 'is-active' : ''}
            aria-pressed={draft.entrega === 'delivery'}
            disabled={!settings.entrega.delivery}
            onClick={() => draft.patch({ entrega: 'delivery' })}
          >
            Delivery
          </button>
        </div>
        {draft.entrega === 'delivery' && (
          <div className="cart-summary__delivery-fields">
            <Field label="Zona">
              {(id) => (
                <Select
                  id={id}
                  value={draft.zona}
                  onChange={(event) => draft.patch({ zona: event.target.value })}
                >
                  <option value="">Selecciona una zona</option>
                  {settings.entrega.zonas.map((zone) => (
                    <option key={zone.nombre} value={zone.nombre}>{zone.nombre}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Dirección">
              {(id) => (
                <Input
                  id={id}
                  value={draft.direccion}
                  placeholder="Calle, número, referencia"
                  autoComplete="street-address"
                  inputMode="text"
                  enterKeyHint="done"
                  onChange={(event) => draft.patch({ direccion: event.target.value })}
                />
              )}
            </Field>
          </div>
        )}
        {draft.entrega === 'retiro' && (
          <p className="t-min t-muted">{settings.tienda.direccion} · {settings.tienda.horario}</p>
        )}
      </fieldset>

      {!compact && (
        <Field label="Nota del pedido" hint="Opcional. La veremos al preparar tu pedido.">
          {(id, describedBy) => (
            <Textarea
              id={id}
              rows={3}
              value={draft.nota}
              maxLength={300}
              placeholder="Indicaciones para la entrega o preparación"
              aria-describedby={describedBy || undefined}
              onChange={(event) => draft.patch({ nota: event.target.value })}
            />
          )}
        </Field>
      )}

      <dl className="cart-summary__totals">
        <div><dt className="t-caption">Subtotal</dt><dd className="t-mid num">{formatMoney(totals.subtotal)}</dd></div>
        {totals.descuento > 0 && (
          <div className="is-discount">
            <dt className="t-caption">Descuento</dt>
            <dd className="t-mid num">−{formatMoney(totals.descuento)}</dd>
          </div>
        )}
        <div>
          <dt className="t-caption">Envío</dt>
          <dd className="t-mid num">{totals.envio === 0 ? 'Sin costo' : formatMoney(totals.envio)}</dd>
        </div>
        <div className="cart-summary__total">
          <dt className="t-mid t-strong">Total</dt>
          <dd className="price t-strong">{formatMoney(totals.total)}</dd>
        </div>
      </dl>
      {formatSecondary(totals.total, settings) && (
        <p className="t-min t-muted">{formatSecondary(totals.total, settings)}</p>
      )}

      {issues.length > 0 && (
        <ul className="cart-summary__issues" aria-label="Avisos del carrito">
          {issues.map((issue) => (
            <li key={`${issue.productoId}-${issue.tipo}`} className="t-min">{issue.mensaje}</li>
          ))}
        </ul>
      )}

      <Button full className="cart-summary__cta" disabled={active.length === 0 || blocking} onClick={go}>
        Continuar al pago <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
      </Button>
      {active.length === 0 && <p className="t-min t-muted">Agrega productos para continuar.</p>}
      <p className="cart-summary__note t-min t-muted">
        Pago simulado · no se realiza ningún cobro real.
      </p>
    </aside>
  )
}
