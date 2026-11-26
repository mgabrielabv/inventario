import { Eye, EyeOff, Gift, Heart, MapPin, Package, ShieldCheck } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCustomer } from '../../app/providers/customer-provider'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { normalizePhoneVE, passwordStrength, type RegisterCustomerInput } from '../../logic/services/customer-auth'
import { AccountLoading } from './account-page'

type Prefill = {
  nombre?: string
  apellido?: string
  email?: string
  telefono?: string
  cliente?: { nombre?: string; apellido?: string; email?: string; telefono?: string }
}
type SignUpState = { from?: string; prefill?: Prefill }
type Form = {
  nombre: string; apellido: string; email: string; telefono: string
  password: string; confirm: string; terms: boolean; offers: boolean
}
type Errors = Partial<Record<keyof Form, string>>

const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte']

const Strength = ({ value }: { value: string }) => {
  const level = passwordStrength(value)
  return (
    <div className="eshop-account-strength" aria-live="polite">
      <div className="eshop-account-strength__bars" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={step <= level ? 'is-on' : ''} />
        ))}
      </div>
      <span className="t-min">{value ? STRENGTH_LABELS[level] : 'Mínimo 8 caracteres'}</span>
    </div>
  )
}

const benefits = [
  { icon: ShieldCheck, title: 'Tus datos, en tu navegador', detail: 'Nada se envía a ningún servidor.' },
  { icon: Package, title: 'Tus pedidos a la mano', detail: 'Consulta cada compra y su estado.' },
  { icon: MapPin, title: 'Tus direcciones guardadas', detail: 'Prepara tus entregas más rápido.' },
  { icon: Gift, title: 'Ofertas a tu medida', detail: 'Solo si tú decides recibirlas.' },
]

export const CustomerSignUpPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { signUp, emailExists, ready } = useCustomer()
  const { toast } = useToast()
  const state = (location.state as SignUpState | null) ?? {}
  const raw = state.prefill
  const prefill = raw ? { ...raw, ...raw.cliente } : null
  const tieneDatos = Boolean(prefill?.nombre || prefill?.email || prefill?.telefono)

  const [form, setForm] = useState<Form>({
    nombre: prefill?.nombre ?? '',
    apellido: prefill?.apellido ?? '',
    email: prefill?.email ?? '',
    telefono: prefill?.telefono ?? '',
    password: '',
    confirm: '',
    terms: false,
    offers: false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [alert, setAlert] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setAlert('')
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found: Errors = {}
    if (form.nombre.trim().length < 2) found.nombre = 'Escribe tu nombre.'
    if (form.apellido.trim().length < 2) found.apellido = 'Escribe tu apellido.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = 'Escribe un correo válido.'
    else if (emailExists(form.email)) found.email = 'Ya existe una cuenta con ese correo.'
    if (!normalizePhoneVE(form.telefono)) found.telefono = 'Escribe un teléfono venezolano válido (04xx-xxxxxxx).'
    if (form.password.length < 8) found.password = 'Usa al menos 8 caracteres.'
    if (form.password !== form.confirm) found.confirm = 'Las contraseñas no coinciden.'
    if (!form.terms) found.terms = 'Acepta los términos para continuar.'

    setErrors(found)
    setAlert('')
    if (Object.keys(found).length > 0) {
      window.setTimeout(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      }, 0)
      return
    }

    setSubmitting(true)
    const input: RegisterCustomerInput = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      password: form.password,
      aceptaOfertas: form.offers,
    }
    const result = await signUp(input)
    setSubmitting(false)
    if (!result.ok) {
      if (result.error?.toLowerCase().includes('correo')) setErrors({ email: result.error })
      else setAlert(result.error ?? 'No se pudo crear la cuenta. Inténtalo de nuevo.')
      return
    }
    toast('¡Bienvenido! Tu cuenta está lista.')
    navigate(state.from ?? '/cuenta', { replace: true })
  }

  if (!ready) return <AccountLoading />

  return (
    <div className="eshop-account-page">
      <div className="eshop-account-auth container-store">
        <section className="eshop-account-auth__form card" aria-labelledby="sign-up-title">
          <header className="eshop-account-auth__head">
            <p className="eshop-account-eyebrow t-min t-clay">Tu cuenta</p>
            <h1 id="sign-up-title" className="t-section">Crea tu cuenta</h1>
            <p className="t-subtitle">Guarda tus datos y haz tus compras más rápido.</p>
          </header>

          {tieneDatos && (
            <p className="eshop-account-notice" role="status">
              Trajimos tus datos del pedido. Solo falta la contraseña.
            </p>
          )}

          <form ref={formRef} className="eshop-account-form" onSubmit={(event) => { void onSubmit(event) }} noValidate>
            <div className="eshop-account-form__grid">
              <Field label="Nombre" required error={errors.nombre}>
                {(id, describedBy) => (
                  <Input id={id} value={form.nombre} autoComplete="given-name"
                    aria-invalid={Boolean(errors.nombre)} aria-describedby={describedBy || undefined}
                    onChange={(event) => set('nombre', event.target.value)} />
                )}
              </Field>
              <Field label="Apellido" required error={errors.apellido}>
                {(id, describedBy) => (
                  <Input id={id} value={form.apellido} autoComplete="family-name"
                    aria-invalid={Boolean(errors.apellido)} aria-describedby={describedBy || undefined}
                    onChange={(event) => set('apellido', event.target.value)} />
                )}
              </Field>
            </div>

            <Field label="Correo" required error={errors.email}>
              {(id, describedBy) => (
                <Input id={id} type="email" value={form.email} autoComplete="email"
                  aria-invalid={Boolean(errors.email)} aria-describedby={describedBy || undefined}
                  onChange={(event) => set('email', event.target.value)} />
              )}
            </Field>

            <Field label="Teléfono" required error={errors.telefono} hint="Por ejemplo: 0424-1234567">
              {(id, describedBy) => (
                <Input id={id} type="tel" inputMode="tel" value={form.telefono} autoComplete="tel"
                  aria-invalid={Boolean(errors.telefono)} aria-describedby={describedBy || undefined}
                  onChange={(event) => set('telefono', event.target.value)} />
              )}
            </Field>

            <Field label="Contraseña" required error={errors.password}>
              {(id, describedBy) => (
                <>
                  <div className="eshop-account-password">
                    <Input id={id} type={showPassword ? 'text' : 'password'} value={form.password}
                      autoComplete="new-password" aria-invalid={Boolean(errors.password)}
                      aria-describedby={describedBy || undefined}
                      onChange={(event) => set('password', event.target.value)} />
                    <button type="button" className="eshop-account-toggle"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((visible) => !visible)}>
                      {showPassword
                        ? <EyeOff size={18} strokeWidth={1.6} aria-hidden="true" />
                        : <Eye size={18} strokeWidth={1.6} aria-hidden="true" />}
                    </button>
                  </div>
                  <Strength value={form.password} />
                </>
              )}
            </Field>

            <Field label="Confirmar contraseña" required error={errors.confirm}>
              {(id, describedBy) => (
                <Input id={id} type={showPassword ? 'text' : 'password'} value={form.confirm}
                  autoComplete="new-password" aria-invalid={Boolean(errors.confirm)}
                  aria-describedby={describedBy || undefined}
                  onChange={(event) => set('confirm', event.target.value)} />
              )}
            </Field>

            <div className="eshop-account-terms">
              <label className="eshop-account-check">
                <input type="checkbox" checked={form.terms} aria-invalid={Boolean(errors.terms)}
                  onChange={(event) => set('terms', event.target.checked)} />
                <span>Acepto los términos de uso de esta demostración.</span>
              </label>
              {errors.terms && <p className="field__hint is-error" role="alert">{errors.terms}</p>}
              <label className="eshop-account-check">
                <input type="checkbox" checked={form.offers}
                  onChange={(event) => set('offers', event.target.checked)} />
                <span>Quiero recibir ofertas (opcional).</span>
              </label>
            </div>

            {alert && <div className="eshop-account-alert" role="alert" aria-live="assertive">{alert}</div>}

            <Button type="submit" full disabled={submitting}>
              {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>

            <p className="eshop-account-auth__switch t-caption">
              ¿Ya tienes cuenta? <Link to="/cuenta/ingresar" state={{ from: state.from, prefill: prefill ?? undefined }}>Entra aquí</Link>
            </p>
          </form>

          <p className="eshop-account-demo t-min">
            Demostración local: los datos se guardan solo en este navegador.
          </p>
        </section>

        <aside className="eshop-account-auth__benefits" aria-labelledby="benefits-signup-title">
          <div className="eshop-account-auth__benefits-inner">
            <Heart size={30} strokeWidth={1.4} aria-hidden="true" />
            <h2 id="benefits-signup-title" className="t-statement">Hecho para tu día a día</h2>
            <p>Cuéntanos quién eres y deja lo demás a tu cuenta.</p>
            <ul className="eshop-account-auth__benefit-list">
              {benefits.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="eshop-account-benefit">
                  <span className="eshop-account-benefit__icon" aria-hidden="true">
                    <Icon size={19} strokeWidth={1.7} />
                  </span>
                  <span>
                    <strong className="t-mid">{title}</strong>
                    <small>{detail}</small>
                  </span>
                </li>
              ))}
            </ul>
            <p className="eshop-account-auth__benefits-foot t-min">
              Cuenta local de demostración: tus datos no salen de aquí.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
