import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCustomer } from '../../app/providers/customer-provider'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { hashPassword, makeSalt } from '../../logic/services/auth'
import { normalizeEmail, normalizePhoneVE, saveCustomers } from '../../logic/services/customer-auth'
import { normalizeText } from '../../logic/services/formatters'
import { AccountLoading } from './account-page'

type Step = 'email' | 'verify' | 'done'
type Errors = Record<string, string | undefined>

export const CustomerRecoverPage = () => {
  const { list, refresh, ready } = useCustomer()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [alert, setAlert] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)

  const focusFirst = () => {
    window.setTimeout(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }, 0)
  }

  const onSubmitEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: 'Escribe un correo válido.' })
      focusFirst()
      return
    }
    setErrors({})
    setAlert('')
    setStep('verify')
  }

  const onSubmitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found: Errors = {}
    if (apellido.trim().length < 2) found.apellido = 'Escribe tu apellido.'
    if (!normalizePhoneVE(telefono)) found.telefono = 'Escribe un teléfono venezolano válido (04xx-xxxxxxx).'
    if (password.length < 8) found.password = 'Usa al menos 8 caracteres.'
    if (password !== confirm) found.confirm = 'Las contraseñas no coinciden.'
    setErrors(found)
    setAlert('')
    if (Object.keys(found).length > 0) { focusFirst(); return }

    const customers = list()
    const account = customers.find((item) => normalizeEmail(item.email) === normalizeEmail(email))
    const phone = normalizePhoneVE(telefono)
    if (!account || !phone
      || normalizeText(account.apellido) !== normalizeText(apellido)
      || normalizePhoneVE(account.telefono) !== phone) {
      setAlert('No pudimos confirmar esos datos. Revisa el apellido y el teléfono.')
      return
    }

    setSubmitting(true)
    const salt = makeSalt()
    const passwordHash = await hashPassword(password, salt)
    saveCustomers(customers.map((item) => item.id === account.id
      ? { ...item, salt, passwordHash }
      : item))
    refresh()
    setSubmitting(false)
    setStep('done')
  }

  if (!ready) return <AccountLoading />

  return (
    <div className="eshop-account-page">
      <div className="eshop-account-recover container-store">
        <section className="eshop-account-recover__card card" aria-labelledby="recover-title">
          <header className="eshop-account-auth__head">
            <p className="eshop-account-eyebrow t-min t-clay">Recuperación local</p>
            <h1 id="recover-title" className="t-section">
              {step === 'done' ? 'Contraseña actualizada' : 'Recupera tu acceso'}
            </h1>
            <p className="t-subtitle">
              {step === 'email'
                ? 'Te diremos cómo continuar, sin depender de ningún correo.'
                : step === 'verify'
                  ? 'Confirma tus datos y elige una contraseña nueva.'
                  : 'Ya puedes entrar con tu contraseña nueva.'}
            </p>
          </header>

          <ol className="eshop-account-steps" aria-label="Pasos de la recuperación">
            <li className={step === 'email' ? 'is-current' : 'is-done'} aria-current={step === 'email' ? 'step' : undefined}>
              <span aria-hidden="true">1</span> Tu correo
            </li>
            <li className={step === 'verify' ? 'is-current' : step === 'done' ? 'is-done' : ''}
              aria-current={step === 'verify' ? 'step' : undefined}>
              <span aria-hidden="true">2</span> Tus datos y contraseña
            </li>
          </ol>

          {step === 'email' && (
            <form ref={formRef} className="eshop-account-form" onSubmit={onSubmitEmail} noValidate>
              <Field label="Correo" required error={errors.email}>
                {(id, describedBy) => (
                  <Input id={id} type="email" value={email} autoComplete="email"
                    placeholder="correo@ejemplo.com" aria-invalid={Boolean(errors.email)}
                    aria-describedby={describedBy || undefined}
                    onChange={(event) => { setEmail(event.target.value); setErrors({}) }} />
                )}
              </Field>
              <Button type="submit" full>Continuar</Button>
            </form>
          )}

          {step === 'email' && (
            <p className="eshop-account-notice" role="status">
              Si la cuenta existe, te mostramos cómo continuar.
            </p>
          )}

          {step === 'verify' && (
            <>
              <p className="eshop-account-notice" role="status">
                Si la cuenta existe, te mostramos cómo continuar.
              </p>
              <form ref={formRef} className="eshop-account-form" onSubmit={(event) => { void onSubmitReset(event) }} noValidate>
                <Field label="Apellido" required error={errors.apellido}>
                  {(id, describedBy) => (
                    <Input id={id} value={apellido} autoComplete="family-name"
                      aria-invalid={Boolean(errors.apellido)} aria-describedby={describedBy || undefined}
                      onChange={(event) => { setApellido(event.target.value); setErrors((c) => ({ ...c, apellido: undefined })) }} />
                  )}
                </Field>
                <Field label="Teléfono" required error={errors.telefono} hint="El que registraste al crear tu cuenta.">
                  {(id, describedBy) => (
                    <Input id={id} type="tel" inputMode="tel" value={telefono} autoComplete="tel"
                      aria-invalid={Boolean(errors.telefono)} aria-describedby={describedBy || undefined}
                      onChange={(event) => { setTelefono(event.target.value); setErrors((c) => ({ ...c, telefono: undefined })) }} />
                  )}
                </Field>
                <Field label="Contraseña nueva" required error={errors.password}>
                  {(id, describedBy) => (
                    <Input id={id} type="password" value={password} autoComplete="new-password"
                      aria-invalid={Boolean(errors.password)} aria-describedby={describedBy || undefined}
                      onChange={(event) => { setPassword(event.target.value); setErrors((c) => ({ ...c, password: undefined })) }} />
                  )}
                </Field>
                <Field label="Confirmar contraseña" required error={errors.confirm}>
                  {(id, describedBy) => (
                    <Input id={id} type="password" value={confirm} autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirm)} aria-describedby={describedBy || undefined}
                      onChange={(event) => { setConfirm(event.target.value); setErrors((c) => ({ ...c, confirm: undefined })) }} />
                  )}
                </Field>
                {alert && <div className="eshop-account-alert" role="alert" aria-live="assertive">{alert}</div>}
                <Button type="submit" full disabled={submitting}>
                  {submitting ? 'Actualizando…' : 'Restablecer contraseña'}
                </Button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="eshop-account-recover__done" role="status">
              <span className="eshop-account-recover__icon" aria-hidden="true"><ShieldCheck size={28} strokeWidth={1.5} /></span>
              <p className="t-mid">Tu contraseña se actualizó solo en este navegador.</p>
              <Link className="btn btn--primary" to="/cuenta/ingresar" state={{ from: '/cuenta' }}>
                Ir a ingresar
              </Link>
            </div>
          )}

          <div className="eshop-account-recover__foot">
            <KeyRound size={16} strokeWidth={1.6} aria-hidden="true" />
            <p className="t-min">
              Demostración local: no enviamos correos. Para continuar necesitas saber tu apellido y teléfono.
            </p>
          </div>
          <Link className="eshop-account-back t-mid" to="/cuenta/ingresar" state={{ from: '/cuenta' }}>
            <ArrowLeft size={16} strokeWidth={1.6} aria-hidden="true" />
            Volver a ingresar
          </Link>
        </section>
        <p className="eshop-account-demo t-min">
          Demostración local: los datos se guardan solo en este navegador.
        </p>
      </div>
    </div>
  )
}
