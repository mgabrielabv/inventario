import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { Segmented } from '../../components/ui/Segmented'
import { errorMessage } from '../../logic/errors'
import { storeName } from '../../logic/services/formatters'
import { buildOrderLines, createOrder, findStockConflicts } from '../../logic/services/orders'
import { calcTotals, formatMoney, formatSecondary } from '../../logic/services/pricing'
import { KEYS, readJson, writeJson } from '../../logic/services/storage'
import { validateCheckout } from '../../logic/services/validation'
import { useCartStore } from '../../logic/store/cart'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import { stepBack, stepForward } from '../../motion/variants'
import type {
  CustomerProfile, OrderDelivery, PaymentMethod,
} from '../../logic/types'

const STEP_LABELS = ['Datos', 'Entrega', 'Pago', 'Revisar']

type DeliveryType = OrderDelivery['tipo']

interface CheckoutForm {
  nombre: string
  telefono: string
  email: string
  documento: string
  entrega: DeliveryType
  direccion: string
  zona: string
  referencia: string
  notas: string
  metodo: PaymentMethod
  pagoReferencia: string
  acepta: boolean
}

const STEP_OF_FIELD: Record<string, number> = {
  nombre: 0, telefono: 0, email: 0,
  direccion: 1, zona: 1,
  acepta: 2,
}

export const CheckoutPage = () => {
  const [savedProfile] = useState(() => readJson<CustomerProfile | null>(KEYS.customer, null))
  const [form, setForm] = useState<CheckoutForm>({
    nombre: savedProfile?.nombre ?? '',
    telefono: savedProfile?.telefono ?? '',
    email: savedProfile?.email ?? '',
    documento: savedProfile?.documento ?? '',
    entrega: 'retiro',
    direccion: '',
    zona: '',
    referencia: '',
    notas: '',
    metodo: 'efectivo',
    pagoReferencia: '',
    acepta: false,
  })
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [alert, setAlert] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  const lines = useCartStore((state) => state.lines)
  const clearCart = useCartStore((state) => state.clear)
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const addOrder = useOrdersStore((state) => state.add)
  const settings = useSettingsStore((state) => state.settings)

  const deliveryOptions = useMemo(() => {
    const options: Array<{ value: DeliveryType; label: string }> = []
    if (settings.entrega.retiro) options.push({ value: 'retiro', label: 'Retiro en tienda' })
    if (settings.entrega.delivery) options.push({ value: 'delivery', label: 'Delivery' })
    return options
  }, [settings.entrega.retiro, settings.entrega.delivery])

  const paymentOptions = useMemo(() => {
    const options: Array<{ value: PaymentMethod; label: string }> = []
    if (settings.pagos.efectivo) options.push({ value: 'efectivo', label: 'Efectivo' })
    if (settings.pagos.transferencia) options.push({ value: 'transferencia', label: 'Transferencia' })
    if (settings.pagos.tarjetaDemo) {
      options.push({ value: 'tarjeta-demo', label: 'Tarjeta · Demostración' })
    }
    return options
  }, [settings.pagos.efectivo, settings.pagos.transferencia, settings.pagos.tarjetaDemo])

  const delivery: DeliveryType = deliveryOptions.some((option) => option.value === form.entrega)
    ? form.entrega
    : deliveryOptions[0]?.value ?? 'retiro'
  const payment: PaymentMethod = paymentOptions.some((option) => option.value === form.metodo)
    ? form.metodo
    : paymentOptions[0]?.value ?? 'efectivo'

  const entrega = useMemo<OrderDelivery>(() => ({
    tipo: delivery,
    direccion: delivery === 'delivery' ? form.direccion.trim() : undefined,
    zona: delivery === 'delivery' ? form.zona : undefined,
    referencia: delivery === 'delivery' ? form.referencia.trim() : undefined,
    notas: delivery === 'delivery' ? form.notas.trim() : undefined,
  }), [delivery, form.direccion, form.zona, form.referencia, form.notas])

  const lineas = useMemo(() => buildOrderLines(lines, products), [lines, products])
  const totals = useMemo(() => calcTotals(lineas, entrega, settings), [lineas, entrega, settings])
  const secondary = formatSecondary(totals.total, settings)
  const conflicts = useMemo(
    () => findStockConflicts(lines, products, orders), [lines, products, orders],
  )

  const setField = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const allErrors = () => validateCheckout({
    nombre: form.nombre,
    telefono: form.telefono,
    email: form.email,
    direccion: form.direccion,
    zona: form.zona,
    entrega: delivery,
    acepta: form.acepta,
  })

  const errorsForStep = (target: number): Record<string, string> => {
    const all = allErrors()
    const keys = target === 0
      ? ['nombre', 'telefono', 'email']
      : target === 1
        ? (delivery === 'delivery' ? ['direccion', 'zona'] : [])
        : target === 2
          ? ['acepta']
          : Object.keys(all)
    const found: Record<string, string> = {}
    for (const key of keys) {
      if (all[key]) found[key] = all[key]
    }
    return found
  }

  const focusFirst = (found: Record<string, string>) => {
    const first = Object.keys(found)[0]
    if (!first) return
    window.setTimeout(() => {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus()
    }, 0)
  }

  const goNext = () => {
    const found = errorsForStep(step)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      focusFirst(found)
      return
    }
    setAlert('')
    setDirection(1)
    setStep((current) => Math.min(STEP_LABELS.length - 1, current + 1))
  }

  const goBack = () => {
    setAlert('')
    setDirection(-1)
    setStep((current) => Math.max(0, current - 1))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = errorsForStep(STEP_LABELS.length - 1)
    setErrors(found)
    if (conflicts.length > 0) {
      setAlert('El stock cambió mientras comprabas. Ajusta las cantidades antes de continuar.')
      return
    }
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0]!
      setDirection(-1)
      setStep(STEP_OF_FIELD[first] ?? 0)
      focusFirst(found)
      return
    }

    setSubmitting(true)
    setAlert('')
    try {
      const cliente = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || undefined,
        documento: form.documento.trim() || undefined,
      }
      const profile: CustomerProfile = {
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: form.email.trim(),
        documento: form.documento.trim(),
      }
      const order = createOrder({
        products,
        orders,
        cart: lines,
        cliente,
        entrega,
        pago: {
          metodo: payment,
          referencia: payment === 'transferencia' ? form.pagoReferencia.trim() : undefined,
        },
        settings,
      })
      writeJson(KEYS.customer, profile)
      addOrder(order)
      clearCart()
      navigate(`/pedido/${order.codigo}`, { state: { justCreated: true } })
    } catch (error) {
      setAlert(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="checkout-page container-store">
        <EmptyState
          title="No hay nada para pagar"
          description="Agrega productos al carrito para comenzar tu pedido."
          action={<Button onClick={() => navigate('/tienda')}>Ver catálogo</Button>}
        />
      </div>
    )
  }

  return (
    <div className="checkout-page container-store" ref={formRef}>
      <header className="checkout-head">
        <p className="checkout-head__eyebrow t-min t-clay">Pedido</p>
        <h1 className="t-catalog">Finalizar compra</h1>
        <p className="t-subtitle">Cuatro pasos y tu pedido queda registrado en esta demostración.</p>
      </header>

      <form className="checkout-layout" onSubmit={submit} noValidate>
        <div className="checkout-main">
          <ol className="checkout-steps" aria-label="Pasos del pedido">
            {STEP_LABELS.map((label, index) => (
              <li
                key={label}
                className={`checkout-steps__item${index === step ? ' is-active' : ''}${index < step ? ' is-done' : ''}`}
                aria-current={index === step ? 'step' : undefined}
              >
                <span className="checkout-steps__num">{index + 1}</span>
                <span>{label}</span>
              </li>
            ))}
          </ol>

          {alert && (
            <div className="checkout-alert" role="alert" aria-live="assertive">{alert}</div>
          )}

          {conflicts.length > 0 && (
            <div className="checkout-alert" role="alert">
              <p className="t-mid">Revisa la disponibilidad</p>
              <ul>
                {conflicts.map((conflict) => (
                  <li key={conflict.productoId}>
                    {conflict.nombre}: pediste {conflict.solicitado}, hay {conflict.disponible}.
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className="checkout-step"
              variants={direction > 0 ? stepForward : stepBack}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {step === 0 && (
                <section className="checkout-step__section" aria-labelledby="checkout-datos-title">
                  <h2 id="checkout-datos-title" className="t-ui t-strong">Tus datos</h2>
                  <div className="checkout-fields">
                    <Field label="Nombre y apellido" error={errors.nombre} required>
                      {(id, describedBy) => (
                        <Input
                          id={id}
                          data-field="nombre"
                          autoComplete="name"
                          value={form.nombre}
                          aria-invalid={Boolean(errors.nombre)}
                          aria-describedby={describedBy || undefined}
                          onChange={(event) => setField('nombre', event.target.value)}
                        />
                      )}
                    </Field>
                    <Field label="Teléfono" error={errors.telefono} required hint="Formato 04xx-xxxxxxx">
                      {(id, describedBy) => (
                        <Input
                          id={id}
                          data-field="telefono"
                          type="tel"
                          autoComplete="tel"
                          value={form.telefono}
                          aria-invalid={Boolean(errors.telefono)}
                          aria-describedby={describedBy || undefined}
                          onChange={(event) => setField('telefono', event.target.value)}
                        />
                      )}
                    </Field>
                    <Field label="Correo (opcional)" error={errors.email}>
                      {(id, describedBy) => (
                        <Input
                          id={id}
                          data-field="email"
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={describedBy || undefined}
                          onChange={(event) => setField('email', event.target.value)}
                        />
                      )}
                    </Field>
                    <Field label="Documento (opcional)">
                      {(id) => (
                        <Input
                          id={id}
                          value={form.documento}
                          onChange={(event) => setField('documento', event.target.value)}
                        />
                      )}
                    </Field>
                  </div>
                </section>
              )}

              {step === 1 && (
                <section className="checkout-step__section" aria-labelledby="checkout-entrega-title">
                  <h2 id="checkout-entrega-title" className="t-ui t-strong">Entrega</h2>
                  <Segmented
                    label="Tipo de entrega"
                    value={delivery}
                    options={deliveryOptions}
                    onChange={(value) => setField('entrega', value)}
                  />
                  {delivery === 'delivery' ? (
                    <div className="checkout-fields">
                      <Field label="Dirección" error={errors.direccion} required>
                        {(id, describedBy) => (
                          <Textarea
                            id={id}
                            data-field="direccion"
                            rows={2}
                            value={form.direccion}
                            aria-invalid={Boolean(errors.direccion)}
                            aria-describedby={describedBy || undefined}
                            onChange={(event) => setField('direccion', event.target.value)}
                          />
                        )}
                      </Field>
                      <Field label="Zona" error={errors.zona} required>
                        {(id, describedBy) => (
                          <Select
                            id={id}
                            data-field="zona"
                            value={form.zona}
                            aria-invalid={Boolean(errors.zona)}
                            aria-describedby={describedBy || undefined}
                            onChange={(event) => setField('zona', event.target.value)}
                          >
                            <option value="">Selecciona una zona</option>
                            {settings.entrega.zonas.map((zone) => (
                              <option key={zone.nombre} value={zone.nombre}>
                                {zone.nombre} · {formatMoney(zone.tarifa)}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                      <Field label="Referencia (opcional)">
                        {(id) => (
                          <Input
                            id={id}
                            value={form.referencia}
                            placeholder="Casa, piso, punto de referencia"
                            onChange={(event) => setField('referencia', event.target.value)}
                          />
                        )}
                      </Field>
                      <Field label="Notas (opcional)">
                        {(id) => (
                          <Textarea
                            id={id}
                            rows={2}
                            value={form.notas}
                            onChange={(event) => setField('notas', event.target.value)}
                          />
                        )}
                      </Field>
                      {settings.entrega.envioGratisDesde !== null && (
                        <p className="checkout-hint t-caption">
                          Envío sin costo desde {formatMoney(settings.entrega.envioGratisDesde)}.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="checkout-hint t-caption">
                      Retiras en {settings.tienda.direccion} durante {settings.tienda.horario}.
                    </p>
                  )}
                </section>
              )}

              {step === 2 && (
                <section className="checkout-step__section" aria-labelledby="checkout-pago-title">
                  <h2 id="checkout-pago-title" className="t-ui t-strong">Forma de pago</h2>
                  <div className="checkout-payments" role="radiogroup" aria-label="Forma de pago">
                    {paymentOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`checkout-payment${payment === option.value ? ' is-active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="metodo-pago"
                          value={option.value}
                          checked={payment === option.value}
                          onChange={() => setField('metodo', option.value)}
                        />
                        <span className="checkout-payment__body">
                          <span className="t-mid">{option.label}</span>
                          {option.value === 'tarjeta-demo' && (
                            <span className="t-min t-muted">Demostración: no se procesa ninguna tarjeta.</span>
                          )}
                          {option.value === 'transferencia' && (
                            <span className="checkout-payment__data">{settings.pagos.datosTransferencia}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>

                  {payment === 'transferencia' && (
                    <Field label="Referencia de transferencia (opcional)">
                      {(id) => (
                        <Input
                          id={id}
                          value={form.pagoReferencia}
                          onChange={(event) => setField('pagoReferencia', event.target.value)}
                        />
                      )}
                    </Field>
                  )}

                  <label className="checkout-accept">
                    <input
                      type="checkbox"
                      data-field="acepta"
                      checked={form.acepta}
                      aria-invalid={Boolean(errors.acepta)}
                      onChange={(event) => setField('acepta', event.target.checked)}
                    />
                    <span>Acepto los términos de esta compra de demostración.</span>
                  </label>
                  {errors.acepta && (
                    <p className="field__hint is-error" role="alert">{errors.acepta}</p>
                  )}

                  <p className="checkout-hint t-caption">
                    Pago simulado. No se realiza ningún cargo ni transferencia real.
                  </p>
                </section>
              )}

              {step === 3 && (
                <section className="checkout-step__section" aria-labelledby="checkout-revisar-title">
                  <h2 id="checkout-revisar-title" className="t-ui t-strong">Revisa tu pedido</h2>

                  <div className="checkout-review">
                    <div className="checkout-review__block">
                      <div className="row between">
                        <h3 className="t-caption t-muted">Datos</h3>
                        <button type="button" className="t-caption checkout-review__edit" onClick={() => { setDirection(-1); setStep(0) }}>
                          Editar
                        </button>
                      </div>
                      <p className="t-mid">{form.nombre}</p>
                      <p className="t-caption">{form.telefono}</p>
                      {form.email && <p className="t-caption">{form.email}</p>}
                    </div>
                    <div className="checkout-review__block">
                      <div className="row between">
                        <h3 className="t-caption t-muted">Entrega</h3>
                        <button type="button" className="t-caption checkout-review__edit" onClick={() => { setDirection(-1); setStep(1) }}>
                          Editar
                        </button>
                      </div>
                      <Chip active>{delivery === 'delivery' ? 'Delivery' : 'Retiro en tienda'}</Chip>
                      {delivery === 'delivery' && (
                        <>
                          <p className="t-caption checkout-review__address">{form.direccion}</p>
                          <p className="t-caption">{form.zona}</p>
                        </>
                      )}
                    </div>
                    <div className="checkout-review__block">
                      <div className="row between">
                        <h3 className="t-caption t-muted">Pago</h3>
                        <button type="button" className="t-caption checkout-review__edit" onClick={() => { setDirection(-1); setStep(2) }}>
                          Editar
                        </button>
                      </div>
                      <Chip active>{paymentOptions.find((option) => option.value === payment)?.label ?? 'Efectivo'}</Chip>
                      <p className="t-caption">Demostración: sin cobro real.</p>
                    </div>
                  </div>

                  <ul className="checkout-review__lines">
                    {lineas.map((line) => (
                      <li key={line.productoId}>
                        <span>{line.cantidad} × {line.nombre}</span>
                        <span className="num">{formatMoney(line.precioUnit * line.cantidad)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="checkout-nav">
            {step > 0 && (
              <Button variant="secondary" onClick={goBack}>
                <ArrowLeft size={17} strokeWidth={1.5} aria-hidden="true" /> Atrás
              </Button>
            )}
            {step < STEP_LABELS.length - 1 ? (
              <Button key="checkout-next" onClick={goNext}>
                Continuar <ArrowRight size={17} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            ) : (
              <Button key="checkout-confirm" type="submit" disabled={submitting}>
                {submitting ? 'Procesando…' : 'Confirmar pedido'}
              </Button>
            )}
          </div>
        </div>

        <aside className="checkout-summary card" aria-label="Resumen del pedido">
          <h2 className="t-ui t-strong">Resumen</h2>
          <p className="t-min t-muted">{storeName(settings)}</p>
          <ul className="checkout-summary__lines">
            {lineas.map((line) => (
              <li key={line.productoId}>
                <span>{line.cantidad} × {line.nombre}</span>
                <span className="num">{formatMoney(line.precioUnit * line.cantidad)}</span>
              </li>
            ))}
          </ul>
          <dl className="checkout-summary__totals">
            <div><dt className="t-caption">Subtotal</dt><dd className="num">{formatMoney(totals.subtotal)}</dd></div>
            <div><dt className="t-caption">Envío</dt><dd className="num">{totals.envio === 0 ? 'Sin costo' : formatMoney(totals.envio)}</dd></div>
            <div className="checkout-summary__total">
              <dt className="t-strong">Total</dt><dd className="price">{formatMoney(totals.total)}</dd>
            </div>
          </dl>
          {secondary && <p className="t-min t-muted checkout-summary__secondary">{secondary}</p>}
          <p className="checkout-summary__note t-min">
            <ShieldCheck size={15} strokeWidth={1.5} aria-hidden="true" />
            Pago de demostración. No se realiza ningún cobro.
          </p>
        </aside>
      </form>
    </div>
  )
}
