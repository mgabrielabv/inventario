import { Eye, EyeOff, Gift, Heart, MapPin, Package, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCustomer } from '../../app/providers/customer-provider'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { useCustomerStore } from '../../logic/store/customer'
import { AccountLoading } from './account-page'

type Prefill = {
  nombre?: string
  apellido?: string
  email?: string
  telefono?: string
  cliente?: { nombre?: string; apellido?: string; email?: string; telefono?: string }
}
type SignInState = { from?: string; prefill?: Prefill }
type Errors = { identifier?: string; password?: string }

const benefits = [
  { icon: ShieldCheck, title: 'Tus datos, en tu navegador', detail: 'Nada se envía a ningún servidor.' },
  { icon: Package, title: 'Tus pedidos a la mano', detail: 'Consulta cada compra y su estado.' },
  { icon: MapPin, title: 'Tus direcciones guardadas', detail: 'Prepara tus entregas más rápido.' },
  { icon: Gift, title: 'Ofertas a tu medida', detail: 'Solo si tú decides recibirlas.' },
]

export const CustomerSignInPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { signIn, ready } = useCustomer()
  const { toast } = useToast()
  const setGuestCheckout = useCustomerStore((state) => state.setGuestCheckout)
  const state = (location.state as SignInState | null) ?? {}
  const raw = state.prefill
  const prefill = raw
    ? { ...raw, ...raw.cliente }
    : null
  const tieneDatos = Boolean(prefill?.nombre || prefill?.email || prefill?.telefono)

  const [identifier, setIdentifier] = useState(prefill?.email || prefill?.telefono || '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [alert, setAlert] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)

  useEffect(() => {
    if (countdown <= 0) return
    const id = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(id)
  }, [countdown])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found: Errors = {}
    if (!identifier.trim()) found.identifier = 'Escribe tu correo o teléfono.'
    if (!password) found.password = 'Escribe tu contraseña.'
    setErrors(found)
    setAlert('')
    if (Object.keys(found).length > 0) {
      window.setTimeout(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      }, 0)
      return
    }

    setSubmitting(true)
    const result = await signIn(identifier.trim(), password, remember)
    setSubmitting(false)
    if (result.account) {
      setGuestCheckout(false)
      toast('¡Qué bueno verte de nuevo!')
      if (state.from) navigate(state.from, { replace: true })
      else if (location.key !== 'default') navigate(-1)
      else navigate('/cuenta', { replace: true })
      return
    }
    setAlert(result.retrySeconds
      ? 'Hubo demasiados intentos seguidos.'
      : 'No pudimos entrar. Revisa tus datos e inténtalo de nuevo.')
    if (result.retrySeconds) setCountdown(result.retrySeconds)
  }

  if (!ready) return <AccountLoading />

  return (
    <div className="eshop-account-page">
      <div className="eshop-account-auth container-store">
        <section className="eshop-account-auth__form card" aria-labelledby="sign-in-title">
          <header className="eshop-account-auth__head">
            <p className="eshop-account-eyebrow t-min t-clay">Tu cuenta</p>
            <h1 id="sign-in-title" className="t-section">Qué bueno verte</h1>
            <p className="t-subtitle">Entra para seguir con tu compra o revisar tus pedidos.</p>
          </header>

          {tieneDatos && (
            <p className="eshop-account-notice" role="status">
              Ya tenemos tus datos del pedido. Solo falta la contraseña.
            </p>
          )}

          <form ref={formRef} className="eshop-account-form" onSubmit={(event) => { void onSubmit(event) }} noValidate>
            <Field label="Correo o teléfono" required error={errors.identifier}>
              {(id, describedBy) => (
                <Input
                  id={id}
                  value={identifier}
                  autoComplete="username"
                  inputMode="email"
                  enterKeyHint="next"
                  placeholder="correo@ejemplo.com o 04xx-xxxxxxx"
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={describedBy || undefined}
                  onChange={(event) => {
                    setIdentifier(event.target.value)
                    setErrors((current) => ({ ...current, identifier: undefined }))
                  }}
                />
              )}
            </Field>

            <Field label="Contraseña" required error={errors.password}>
              {(id, describedBy) => (
                <div className="eshop-account-password">
                  <Input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={describedBy || undefined}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setErrors((current) => ({ ...current, password: undefined }))
                    }}
                  />
                  <button
                    type="button"
                    className="eshop-account-toggle"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword
                      ? <EyeOff size={18} strokeWidth={1.6} aria-hidden="true" />
                      : <Eye size={18} strokeWidth={1.6} aria-hidden="true" />}
                  </button>
                </div>
              )}
            </Field>

            <label className="eshop-account-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Recordarme en este navegador</span>
            </label>

            {alert && (
              <div className="eshop-account-alert" role="alert" aria-live="assertive">
                <p className="t-mid">{alert}</p>
                {countdown > 0 && (
                  <p className="t-min">Intenta de nuevo en {countdown} {countdown === 1 ? 'segundo' : 'segundos'}.</p>
                )}
              </div>
            )}

            <Button type="submit" full disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </Button>

            <div className="eshop-account-auth__links">
              <Link to="/cuenta/recuperar" state={{ from: state.from }}>Olvidé mi contraseña</Link>
              <Link
                to="/cuenta/registrar"
                state={{ from: state.from, prefill: prefill ?? undefined }}
              >
                Crear una cuenta
              </Link>
            </div>
          </form>

          <p className="eshop-account-demo t-min">
            Demostración local: los datos se guardan solo en este navegador.
          </p>
        </section>

        <aside className="eshop-account-auth__benefits" aria-labelledby="benefits-title">
          <div className="eshop-account-auth__benefits-inner">
            <Heart size={30} strokeWidth={1.4} aria-hidden="true" />
            <h2 id="benefits-title" className="t-statement">Una cuenta hecha para ti</h2>
            <p>Hecha para que comprar sea más sencillo, sin complicaciones.</p>
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
