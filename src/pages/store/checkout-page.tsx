import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, Copy, CreditCard, FileCheck2, MapPin,
  ShieldCheck, Store, Truck, Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCustomer } from '../../app/providers/customer-provider'
import { ProductArt } from '../../components/art/ProductArt'
import { DeliveryMap, DeliveryWindows } from '../../components/store/DeliveryArt'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { reduced, spring } from '../../motion/tokens'
import { shake, stepBack, stepForward } from '../../motion/variants'
import { errorMessage } from '../../logic/errors'
import { buildCheckoutOrder, couponStatus, revalidateCheckout, validateStep } from '../../logic/services/checkout'
import { estimarEntrega } from '../../logic/services/delivery'
import { storeName } from '../../logic/services/formatters'
import { getImage, saveImage } from '../../logic/services/images'
import { buildOrderLines } from '../../logic/services/orders'
import { formatMoney, formatSecondary } from '../../logic/services/pricing'
import { KEYS, readJson, writeJson } from '../../logic/services/storage'
import { useCartDraftStore } from '../../logic/store/cartDraft'
import { useCartStore } from '../../logic/store/cart'
import { useCheckoutDraftStore } from '../../logic/store/checkoutDraft'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import type {
  CustomerProfile, OrderDelivery, PaymentMethod,
} from '../../logic/types'

const STEP_LABELS = ['Datos', 'Entrega', 'Pago', 'Revisar']
/** Un único texto para el aviso de pago simulado en todo el checkout. */
const PAYMENT_NOTICE = 'Pago simulado. No se realiza ningún cobro.'

type DeliveryType = OrderDelivery['tipo']

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const draft = useCheckoutDraftStore()
  const cartDraft = useCartDraftStore()
  const lines = useCartStore((state) => state.lines)
  const clearCart = useCartStore((state) => state.clear)
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)
  const addOrder = useOrdersStore((state) => state.add)
  const settings = useSettingsStore((state) => state.settings)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const reduce = useReducedMotion()
  const [alert, setAlert] = useState('')
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<string | null>(null)
  const [receiptError, setReceiptError] = useState('')
  const [saveAddress, setSaveAddress] = useState(false)
  const formRef = useRef<HTMLDivElement | null>(null)
  const { account, addAddress } = useCustomer()

  const active = useMemo(() => lines.filter((line) => !line.guardado), [lines])

  /* Prioridad al entrar: lo ya escrito en el borrador > cuenta > carrito.
     Si vuelves de iniciar sesión, se completan solo los campos que faltan. */
  useEffect(() => {
    const current = useCheckoutDraftStore.getState()
    const cart = useCartDraftStore.getState()
    const profile = readJson<CustomerProfile | null>(KEYS.customer, null)
    const address = account?.direcciones.find((item) => item.esPrincipal)
      ?? account?.direcciones[0]
    const hasDraft = Boolean(
      current.nombre || current.telefono || current.email || current.direccion
      || current.zona || current.notas || current.step > 0 || current.reached > 0,
    )
    current.patch({
      nombre: current.nombre || (account
        ? `${account.nombre} ${account.apellido}`.trim()
        : profile?.nombre ?? ''),
      telefono: current.telefono || account?.telefono || profile?.telefono || '',
      email: current.email || account?.email || profile?.email || '',
      documento: current.documento || account?.documento || profile?.documento || '',
      direccion: current.direccion || address?.direccion || (!hasDraft ? cart.direccion : ''),
      zona: current.zona || address?.zona || (!hasDraft ? cart.zona : ''),
      notas: current.notas || (!hasDraft ? cart.nota : ''),
      ...(!hasDraft ? { entrega: cart.entrega } : {}),
    })
  }, [account?.id])

  useEffect(() => {
    let alive = true
    if (draft.comprobante) {
      getImage(draft.comprobante).then((url) => { if (alive) setReceipt(url) })
    } else setReceipt(null)
    return () => { alive = false }
  }, [draft.comprobante])

  const deliveryOptions = useMemo(() => {
    const options: Array<{ value: DeliveryType; label: string }> = []
    if (settings.entrega.retiro) options.push({ value: 'retiro', label: 'Retiro en tienda' })
    if (settings.entrega.delivery) options.push({ value: 'delivery', label: 'Delivery' })
    if (options.length === 0) options.push({ value: 'retiro', label: 'Retiro en tienda' })
    return options
  }, [settings.entrega.retiro, settings.entrega.delivery])

  const paymentOptions = useMemo(() => {
    const options: Array<{ value: PaymentMethod; label: string }> = []
    if (settings.pagos.efectivo) options.push({ value: 'efectivo', label: 'Efectivo' })
    if (settings.pagos.transferencia) options.push({ value: 'transferencia', label: 'Transferencia' })
    if (settings.pagos.movil) options.push({ value: 'movil', label: 'Pago móvil' })
    if (settings.pagos.tarjetaDemo) options.push({ value: 'tarjeta-demo', label: 'Tarjeta (simulada)' })
    if (options.length === 0) options.push({ value: 'efectivo', label: 'Efectivo' })
    return options
  }, [settings.pagos])

  const delivery: DeliveryType = deliveryOptions.some((option) => option.value === draft.entrega)
    ? draft.entrega : deliveryOptions[0]!.value
  const payment: PaymentMethod = paymentOptions.some((option) => option.value === draft.metodo)
    ? draft.metodo : paymentOptions[0]!.value
  const entrega = useMemo<OrderDelivery>(() => ({
    tipo: delivery,
    direccion: delivery === 'delivery' ? draft.direccion.trim() : undefined,
    zona: delivery === 'delivery' ? draft.zona : undefined,
    referencia: delivery === 'delivery' ? draft.referencia.trim() : undefined,
    notas: draft.notas.trim() || undefined,
  }), [delivery, draft.direccion, draft.zona, draft.referencia, draft.notas])

  const cupon = cartDraft.cupon.trim().toUpperCase()
  const review = useMemo(() => revalidateCheckout({
    cart: active, products, orders, settings, entrega, cupon,
  }), [active, products, orders, settings, entrega, cupon])
  const totals = review.totals
  const secondary = formatSecondary(totals.total, settings)
  const shippingEstimate = estimarEntrega(entrega, settings)
  const coupon = couponStatus(cupon, settings, totals.subtotal)
  /* El cambio de precio es un aviso: se cobra el precio actual. Stock sí bloquea. */
  const blocking = review.issues.filter((issue) => issue.tipo !== 'precio')
  const warnings = review.issues.filter((issue) => issue.tipo === 'precio')
  const lineas = useMemo(() => buildOrderLines(active, products), [active, products])
  const progress = Math.min(100, Math.round((draft.reached / STEP_LABELS.length) * 100))
  const step = Math.min(STEP_LABELS.length - 1, Math.max(0, draft.step))

  const setField = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    draft.patch({ [key]: value } as Parameters<typeof draft.patch>[0])
    setErrors((current) => {
      if (!current[key as string]) return current
      const next = { ...current }
      delete next[key as string]
      return next
    })
  }

  const focusFirst = (found: Record<string, string>) => {
    const first = Object.keys(found)[0]
    if (!first) return
    window.setTimeout(() => {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus()
    }, 0)
  }

  const openStep = (index: number) => {
    setDirection(index < step ? -1 : 1)
    setErrors({})
    draft.goTo(index)
  }

  const goNext = () => {
    const found = validateStep(draft, step, entrega)
    setErrors(found)
    if (Object.keys(found).length > 0) { focusFirst(found); return }
    setAlert('')
    setDirection(1)
    draft.advance(Math.min(STEP_LABELS.length - 1, step + 1))
  }

  const submit = async () => {
    const found = validateStep(draft, 3, entrega)
    setErrors(found)
    if (Object.keys(found).length > 0) { focusFirst(found); return }
    if (blocking.length > 0) {
      setAlert('Cambió la disponibilidad. Revisa los avisos y vuelve al carrito si hace falta.')
      return
    }
    setSubmitting(true)
    setAlert('')
    try {
      if (account && saveAddress && delivery === 'delivery'
        && draft.direccion.trim() && draft.zona.trim()) {
        addAddress({
          alias: 'Dirección de entrega',
          direccion: `${draft.direccion.trim()},${draft.zona.trim()}`,
          zona: draft.zona,
          referencia: draft.referencia.trim(),
          esPrincipal: account.direcciones.length === 0,
        })
      }
      const order = buildCheckoutOrder({ ...draft, cupon }, {
        cart: active, products, orders, settings, entrega, clienteId: account?.id,
      })
      const profile: CustomerProfile = {
        nombre: draft.nombre.trim(), telefono: draft.telefono.trim(),
        email: draft.email.trim(), documento: draft.documento.trim(),
      }
      writeJson(KEYS.customer, profile)
      addOrder(order)
      clearCart()
      cartDraft.patch({ cupon: '' })
      const [nombre, ...apellido] = draft.nombre.trim().split(/\s+/)
      draft.reset()
      navigate(`/pedido/${order.codigo}`, {
        state: {
          justCreated: true,
          prefill: account ? undefined : {
            nombre, apellido: apellido.join(' '), email: draft.email, telefono: draft.telefono,
          },
        },
      })
    } catch (error) {
      setAlert(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const onReceipt = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setReceiptError('')
    try {
      const id = await saveImage(file)
      setField('comprobante', id)
      toast('Comprobante guardado')
    } catch {
      setReceiptError('No se pudo guardar la imagen. Intenta con otro archivo.')
    }
    event.target.value = ''
  }

  const copyData = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast('Dato copiado')
    } catch {
      toast('Selecciona el texto para copiarlo')
    }
  }

  if (active.length === 0) {
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

  const summary = (index: number): string => {
    if (index === 0) return draft.nombre.trim() || 'Sin completar'
    if (index === 1) return delivery === 'delivery'
      ? `${draft.zona || 'Zona sin elegir'}${draft.ventana ? ` · ${draft.ventana}` : ''}`
      : settings.tienda.direccion
    if (index === 2) return paymentOptions.find((option) => option.value === payment)?.label ?? ''
    return `${lineas.length} ${lineas.length === 1 ? 'producto' : 'productos'} · ${formatMoney(totals.total)}`
  }

  const stepBody = (index: number) => {
    if (index === 0) return (
      <div className="checkout-step-account">
        <section className="checkout-account-card" aria-label="Tu cuenta">
          <p className="checkout-account-card__title t-mid t-strong">
            Comprando como {account?.nombre} {account?.apellido}
          </p>
          <p className="t-caption t-muted">
            Usaremos tus datos y tu dirección guardada. Puedes cambiarlos abajo.
          </p>
          <div className="checkout-account-card__actions">
            <Link className="checkout-account-card__link" to="/cuenta/direcciones">
              Ver mis direcciones
            </Link>
          </div>
        </section>
        <div className="checkout-fields">
          <Field label="Nombre y apellido" error={errors.nombre} required>
          {(id, describedBy) => (
            <Input id={id} data-field="nombre" autoComplete="name" inputMode="text" enterKeyHint="next"
              value={draft.nombre}
              aria-invalid={Boolean(errors.nombre)} aria-describedby={describedBy || undefined}
              onChange={(event) => setField('nombre', event.target.value)} />
          )}
        </Field>
        <Field label="Teléfono" error={errors.telefono} required hint="Formato 04xx-xxxxxxx">
          {(id, describedBy) => (
            <Input id={id} data-field="telefono" type="tel" autoComplete="tel" inputMode="tel"
              enterKeyHint="next" value={draft.telefono}
              aria-invalid={Boolean(errors.telefono)} aria-describedby={describedBy || undefined}
              onChange={(event) => setField('telefono', event.target.value)} />
          )}
        </Field>
        <Field label="Correo (opcional)" error={errors.email}>
          {(id, describedBy) => (
            <Input id={id} data-field="email" type="email" autoComplete="email" inputMode="email"
              enterKeyHint="next" value={draft.email}
              aria-invalid={Boolean(errors.email)} aria-describedby={describedBy || undefined}
              onChange={(event) => setField('email', event.target.value)} />
          )}
        </Field>
          <Field label="Documento (opcional)">
            {(id) => (
              <Input id={id} value={draft.documento}
                onChange={(event) => setField('documento', event.target.value)} />
            )}
          </Field>
        </div>
      </div>
    )

    if (index === 1) return (
      <div className="checkout-delivery">
        <div className="checkout-delivery__cards" role="radiogroup" aria-label="Tipo de entrega">
          {deliveryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={delivery === option.value}
              className={`checkout-delivery-card${delivery === option.value ? ' is-active' : ''}`}
              onClick={() => { setField('entrega', option.value); setAlert('') }}
            >
              <DeliveryMap tipo={option.value} />
              <span className="checkout-delivery-card__title t-mid t-strong">
                {option.value === 'retiro' ? <Store size={16} strokeWidth={1.6} aria-hidden="true" /> : <Truck size={16} strokeWidth={1.6} aria-hidden="true" />}
                {option.label}
              </span>
              <span className="t-min t-muted">
                {option.value === 'retiro' ? settings.tienda.direccion : 'Especifica zona y dirección'}
              </span>
              {delivery === option.value && <Check size={16} strokeWidth={2.2} className="checkout-delivery-card__check" aria-hidden="true" />}
            </button>
          ))}
        </div>

        {delivery === 'delivery' ? (
          <div className="checkout-fields">
            <Field label="Dirección" error={errors.direccion} required>
              {(id, describedBy) => (
                <Textarea id={id} data-field="direccion" rows={2} value={draft.direccion}
                  placeholder="Calle, número, piso"
                  aria-invalid={Boolean(errors.direccion)} aria-describedby={describedBy || undefined}
                  onChange={(event) => setField('direccion', event.target.value)} />
              )}
            </Field>
            <Field label="Zona" error={errors.zona} required>
              {(id, describedBy) => (
                <Select id={id} data-field="zona" value={draft.zona}
                  aria-invalid={Boolean(errors.zona)} aria-describedby={describedBy || undefined}
                  onChange={(event) => setField('zona', event.target.value)}>
                  <option value="">Selecciona una zona</option>
                  {settings.entrega.zonas.map((zone) => (
                    <option key={zone.nombre} value={zone.nombre}>
                      {zone.nombre} · {zone.tarifa === 0 ? 'sin costo' : formatMoney(zone.tarifa)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Referencia (opcional)">
              {(id) => (
                <Input id={id} value={draft.referencia} placeholder="Casa, piso, punto de referencia"
                  onChange={(event) => setField('referencia', event.target.value)} />
              )}
            </Field>
            <DeliveryWindows
              ventanas={settings.entrega.ventanas}
              value={draft.ventana}
              onChange={(ventana) => setField('ventana', ventana)}
            />
            {account && (
              <label className="checkout-save-address">
                <input type="checkbox" checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)} />
                <span>Guardar esta dirección en mi cuenta para la próxima compra.</span>
              </label>
            )}
          </div>
        ) : (
          <p className="checkout-hint t-caption">
            <MapPin size={15} strokeWidth={1.6} aria-hidden="true" />
            Retiras en {settings.tienda.direccion} durante {settings.tienda.horario}.
          </p>
        )}
        <p className="checkout-hint t-caption">{shippingEstimate.titulo} · {shippingEstimate.detalle}</p>
      </div>
    )

    if (index === 2) return (
      <div className="checkout-payment-step">
        <div className="checkout-payments" role="radiogroup" aria-label="Forma de pago">
          {paymentOptions.map((option) => (
            <label key={option.value}
              className={`checkout-payment${payment === option.value ? ' is-active' : ''}`}>
              <input type="radio" name="metodo-pago" value={option.value}
                checked={payment === option.value}
                onChange={() => setField('metodo', option.value)} />
              <span className="checkout-payment__body">
                <span className="t-mid">{option.label}</span>
                {option.value === 'movil' && (
                  <span className="t-min t-muted">Copia los datos y escribe la referencia.</span>
                )}
                {option.value === 'tarjeta-demo' && (
                  <span className="t-min t-muted">Tarjeta simulada: no se procesa ningún cargo.</span>
                )}
                {option.value === 'transferencia' && (
                  <span className="checkout-payment__data">{settings.pagos.datosTransferencia}</span>
                )}
              </span>
            </label>
          ))}
        </div>

        {payment === 'movil' && (
          <div className="checkout-movil">
            <div className="checkout-movil__data">
              <span className="t-min t-muted">Datos para el pago móvil</span>
              <code className="t-mid">{settings.pagos.datosMovil || 'Dato no configurado'}</code>
              <button type="button" className="checkout-copy t-caption"
                onClick={() => copyData(settings.pagos.datosMovil)}>
                <Copy size={15} strokeWidth={1.6} aria-hidden="true" /> Copiar
              </button>
            </div>
            <Field label="Referencia del pago móvil" error={errors.pagoReferencia} required>
              {(id, describedBy) => (
                <Input id={id} data-field="pagoReferencia" value={draft.pagoReferencia}
                  placeholder="Número de referencia"
                  aria-invalid={Boolean(errors.pagoReferencia)} aria-describedby={describedBy || undefined}
                  onChange={(event) => setField('pagoReferencia', event.target.value)} />
              )}
            </Field>
            <div className="checkout-receipt">
              <Field label="Comprobante (opcional)" hint="Imagen JPG, PNG o WebP. Se guarda solo en este navegador.">
                {(id, describedBy) => (
                  <input id={id} type="file" accept="image/*" className="input"
                    aria-describedby={describedBy || undefined} onChange={onReceipt} />
                )}
              </Field>
              {receipt && (
                <div className="checkout-receipt__preview">
                  <img src={receipt} alt="Comprobante adjunto" />
                  <button type="button" className="t-caption"
                    onClick={() => { setField('comprobante', ''); setReceipt(null) }}>
                    Quitar comprobante
                  </button>
                </div>
              )}
              {receiptError && <p className="field__hint is-error" role="alert">{receiptError}</p>}
            </div>
          </div>
        )}

        {payment === 'transferencia' && (
          <Field label="Referencia de transferencia (opcional)">
            {(id) => (
              <Input id={id} value={draft.pagoReferencia}
                placeholder="Código de referencia"
                onChange={(event) => setField('pagoReferencia', event.target.value)} />
            )}
          </Field>
        )}

        {payment === 'efectivo' && (
          <Field label="Vuelto (opcional)" error={errors.vuelto}
            hint="Cantidad estimada que deseas que te devuelvan.">
            {(id, describedBy) => (
              <Input id={id} data-field="vuelto" type="number" min={0} step="0.01"
                value={draft.vuelto}
                aria-invalid={Boolean(errors.vuelto)} aria-describedby={describedBy || undefined}
                onChange={(event) => setField('vuelto', Number(event.target.value))} />
            )}
          </Field>
        )}

        {payment === 'tarjeta-demo' && (
          <div className="checkout-demo-card" aria-label="Tarjeta simulada">
            <CreditCard size={22} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <span className="t-mid">Tarjeta (simulada)</span>
              <span className="t-min t-muted">•••• 4242 · sin cargos reales</span>
            </div>
          </div>
        )}

        <div className="checkout-currency">
          <Wallet size={16} strokeWidth={1.6} aria-hidden="true" />
          <span className="t-caption">Divisa: {settings.moneda.codigo}</span>
          {secondary && <span className="t-min t-muted">{secondary}</span>}
        </div>
        <p className="checkout-hint t-caption">
          <ShieldCheck size={15} strokeWidth={1.6} aria-hidden="true" />
          {PAYMENT_NOTICE}
        </p>
      </div>
    )

    return (
      <div className="checkout-review-step">
        <div className="checkout-review">
          <div className="checkout-review__block">
            <div className="row between">
              <h3 className="t-caption t-muted">Datos</h3>
              <button type="button" className="t-caption checkout-review__edit" onClick={() => openStep(0)}>
                Editar
              </button>
            </div>
            <p className="t-mid">{draft.nombre}</p>
            <p className="t-caption">{draft.telefono}</p>
            {draft.email && <p className="t-caption">{draft.email}</p>}
          </div>
          <div className="checkout-review__block">
            <div className="row between">
              <h3 className="t-caption t-muted">Entrega</h3>
              <button type="button" className="t-caption checkout-review__edit" onClick={() => openStep(1)}>
                Editar
              </button>
            </div>
            <Chip active>{delivery === 'delivery' ? 'Delivery' : 'Retiro en tienda'}</Chip>
            {delivery === 'delivery' && (
              <>
                <p className="t-caption checkout-review__address">{draft.direccion}</p>
                <p className="t-caption">{draft.zona}{draft.ventana ? ` · ${draft.ventana}` : ''}</p>
              </>
            )}
          </div>
          <div className="checkout-review__block">
            <div className="row between">
              <h3 className="t-caption t-muted">Pago</h3>
              <button type="button" className="t-caption checkout-review__edit" onClick={() => openStep(2)}>
                Editar
              </button>
            </div>
            <Chip active>{paymentOptions.find((option) => option.value === payment)?.label ?? 'Efectivo'}</Chip>
            {draft.comprobante && <p className="t-min t-muted"><FileCheck2 size={14} strokeWidth={1.6} aria-hidden="true" /> Comprobante adjunto</p>}
            <p className="t-caption">{PAYMENT_NOTICE}</p>
          </div>
        </div>

        <ul className="checkout-review__lines">
          {lineas.map((line) => {
            const product = products.find((item) => item.id === line.productoId)
            return (
              <li key={line.productoId}>
                {product && <ProductArt product={product} size={44} view="solo" />}
                <span>{line.cantidad} × {line.nombre}</span>
                <span className="num">{formatMoney(line.precioUnit * line.cantidad)}</span>
              </li>
            )
          })}
        </ul>

        <label className="checkout-accept">
          <input type="checkbox" data-field="acepta" checked={draft.acepta}
            aria-invalid={Boolean(errors.acepta)}
            onChange={(event) => setField('acepta', event.target.checked)} />
          <span>Acepto los términos de esta compra.</span>
        </label>
        {errors.acepta && <p className="field__hint is-error" role="alert">{errors.acepta}</p>}
      </div>
    )
  }

  return (
    <div className="checkout-page container-store" ref={formRef}>
      <header className="checkout-head">
        <p className="checkout-head__eyebrow t-min t-clay">Pedido</p>
        <h1 className="t-catalog">Finalizar compra</h1>
        <p className="t-subtitle">Cuatro pasos, sin cobros reales. Puedes editar cada sección cuando quieras.</p>
      </header>

      <form
        className="checkout-layout"
        onSubmit={(event) => {
          event.preventDefault()
          if (step === STEP_LABELS.length - 1) void submit()
        }}
        noValidate
      >
        <div className="checkout-main">
          <div className="checkout-progress" aria-label="Progreso del pedido">
            <div className="checkout-progress__head">
              <span className="t-caption t-strong">Paso {Math.min(draft.reached + 1, 4)} de 4</span>
              <span className="t-min t-muted">{STEP_LABELS[step]}</span>
            </div>
            <div className="checkout-progress__track" role="progressbar"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <motion.span
                style={{ width: '100%', transformOrigin: 'left' }}
                initial={false}
                animate={{ scaleX: progress / 100 }}
                transition={reduce ? { duration: reduced.duration } : spring.soft}
              />
            </div>
          </div>

          {alert && (
            <motion.div
              key={alert}
              className="checkout-alert"
              role="alert"
              aria-live="assertive"
              animate={reduce ? undefined : shake}
            >
              {alert}
            </motion.div>
          )}
          {blocking.length > 0 && (
            <div className="checkout-alert" role="alert">
              <p className="t-mid">Revisa el carrito</p>
              <ul>
                {blocking.map((issue) => (
                  <li key={`${issue.productoId}-${issue.tipo}`}>{issue.mensaje}</li>
                ))}
              </ul>
              <Link className="t-caption checkout-alert__link" to="/carrito">Ir al carrito</Link>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="checkout-notice" role="status">
              {warnings.map((issue) => (
                <p key={issue.productoId} className="t-caption">{issue.mensaje}</p>
              ))}
            </div>
          )}

          <ol className="checkout-accordion" aria-label="Pasos del pedido">
            {STEP_LABELS.map((label, index) => {
              const open = index === step
              const done = index < draft.reached
              return (
                <li key={label}
                  className={`checkout-accordion__item${open ? ' is-open' : ''}${done ? ' is-done' : ''}`}>
                  <div className="checkout-accordion__head">
                    <span className="checkout-accordion__num">
                      {done && !open ? <Check size={15} strokeWidth={2.2} aria-hidden="true" /> : index + 1}
                    </span>
                    <div className="checkout-accordion__label">
                      <h2 className="t-mid t-strong">{label}</h2>
                      <p className="t-min t-muted">{summary(index)}</p>
                    </div>
                    {!open && index <= draft.reached && (
                      <button type="button" className="checkout-accordion__edit t-caption"
                        onClick={() => openStep(index)}>
                        Editar
                      </button>
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        className="checkout-accordion__body"
                        variants={direction > 0 ? stepForward : stepBack}
                        initial="initial" animate="animate" exit="exit"
                      >
                        {stepBody(index)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ol>

          <div className="checkout-nav">
            {step > 0 && (
              <Button variant="secondary" type="button" onClick={() => openStep(step - 1)}>
                <ArrowLeft size={17} strokeWidth={1.5} aria-hidden="true" /> Atrás
              </Button>
            )}
            {step < STEP_LABELS.length - 1 ? (
              <Button type="button" onClick={goNext}>
                Continuar <ArrowRight size={17} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" disabled={submitting || blocking.length > 0}
                onClick={() => void submit()}>
                {submitting ? 'Registrando…' : 'Confirmar pedido'}
              </Button>
            )}
          </div>
        </div>

        <aside className="checkout-summary card" aria-label="Resumen del pedido">
          <h2 className="t-ui t-strong">Resumen</h2>
          <p className="t-min t-muted">{storeName(settings)}</p>
          <ul className="checkout-summary__lines">
            {lineas.map((line) => {
              const product = products.find((item) => item.id === line.productoId)
              return (
                <li key={line.productoId}>
                  {product && <ProductArt product={product} size={48} view="solo" />}
                  <span className="checkout-summary__line-name">
                    {line.cantidad} × {line.nombre}
                  </span>
                  <span className="num">{formatMoney(line.precioUnit * line.cantidad)}</span>
                </li>
              )
            })}
          </ul>

          <div className="checkout-summary__coupon">
            <Field label="Cupón" hint="Puedes probar BIENVENIDO10 o ENVIOGRATIS">
              {(id, describedBy) => (
                <Input id={id} value={cartDraft.cupon} placeholder="Código"
                  aria-describedby={describedBy || undefined} autoComplete="off"
                  inputMode="text" enterKeyHint="done"
                  onChange={(event) => cartDraft.patch({ cupon: event.target.value.toUpperCase() })} />
              )}
            </Field>
            {coupon.mensaje && (
              <p className={`t-min${coupon.valido ? ' checkout-summary__coupon-ok' : ''}`} role="status">
                {coupon.mensaje}
              </p>
            )}
          </div>

          <dl className="checkout-summary__totals">
            <div><dt className="t-caption">Subtotal</dt><dd className="num">{formatMoney(totals.subtotal)}</dd></div>
            {totals.descuento > 0 && (
              <div className="is-discount">
                <dt className="t-caption">Descuento</dt>
                <dd className="num">−{formatMoney(totals.descuento)}</dd>
              </div>
            )}
            <div>
              <dt className="t-caption">Envío</dt>
              <dd className="num">{totals.envio === 0 ? 'Sin costo' : formatMoney(totals.envio)}</dd>
            </div>
            <div className="checkout-summary__total">
              <dt className="t-strong">Total</dt><dd className="price">{formatMoney(totals.total)}</dd>
            </div>
          </dl>
          {secondary && <p className="t-min t-muted checkout-summary__secondary">{secondary}</p>}
          <p className="checkout-summary__note t-min">
            <ShieldCheck size={15} strokeWidth={1.5} aria-hidden="true" />
            {PAYMENT_NOTICE}
          </p>
        </aside>
      </form>
    </div>
  )
}
