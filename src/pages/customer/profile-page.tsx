import { Bell, Eye, EyeOff, KeyRound, LogOut, Trash2, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../../app/providers/customer-provider'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { Switch } from '../../components/ui/Switch'
import { useToast } from '../../components/ui/Toast'
import { errorMessage } from '../../logic/errors'
import { normalizePhoneVE } from '../../logic/services/customer-auth'
import { AccountDemoNote, AccountLoading, AccountSignInPrompt } from './account-page'

type ProfileForm = {
  nombre: string; apellido: string; email: string
  telefono: string; documento: string; aceptaOfertas: boolean
}
type Errors = Record<string, string | undefined>

export const ProfilePage = () => {
  const navigate = useNavigate()
  const { account, isAuthenticated, ready, update, changePassword, signOut, deleteAccount } = useCustomer()
  const { toast } = useToast()
  const [form, setForm] = useState<ProfileForm | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<Errors>({})
  const [passwordAlert, setPasswordAlert] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const profileRef = useRef<HTMLFormElement | null>(null)
  const passwordRef = useRef<HTMLFormElement | null>(null)

  useEffect(() => {
    if (!account) return
    setForm({
      nombre: account.nombre,
      apellido: account.apellido,
      email: account.email,
      telefono: account.telefono,
      documento: account.documento ?? '',
      aceptaOfertas: account.aceptaOfertas,
    })
  }, [account])

  if (!ready) return <AccountLoading />
  if (!isAuthenticated || !account) return <AccountSignInPrompt />

  const focusFirst = (ref: RefObject<HTMLFormElement | null>) => {
    window.setTimeout(() => {
      ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }, 0)
  }

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((current) => current ? { ...current, [key]: value } : current)
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const onSubmitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return
    const found: Errors = {}
    if (form.nombre.trim().length < 2) found.nombre = 'Escribe tu nombre.'
    if (form.apellido.trim().length < 2) found.apellido = 'Escribe tu apellido.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = 'Escribe un correo válido.'
    if (!normalizePhoneVE(form.telefono)) found.telefono = 'Escribe un teléfono venezolano válido (04xx-xxxxxxx).'
    setErrors(found)
    if (Object.keys(found).length > 0) { focusFirst(profileRef); return }
    try {
      update({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        documento: form.documento.trim(),
        aceptaOfertas: form.aceptaOfertas,
      })
      toast('Tus datos se guardaron.')
    } catch (error) {
      setErrors({ email: errorMessage(error) })
      focusFirst(profileRef)
    }
  }

  const onSubmitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found: Errors = {}
    if (!currentPassword) found.current = 'Escribe tu contraseña actual.'
    if (newPassword.length < 8) found.next = 'Usa al menos 8 caracteres.'
    if (newPassword !== confirmPassword) found.confirm = 'Las contraseñas no coinciden.'
    setPasswordErrors(found)
    setPasswordAlert('')
    if (Object.keys(found).length > 0) { focusFirst(passwordRef); return }
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast('Contraseña actualizada.')
    } catch (error) {
      setPasswordAlert(errorMessage(error))
    }
  }

  const onSignOut = () => {
    signOut()
    toast('Cerraste sesión.')
    navigate('/')
  }

  return (
    <div className="eshop-account-page container-store">
      <header className="eshop-account-head">
        <div>
          <p className="eshop-account-eyebrow t-min t-clay">Mi cuenta</p>
          <h1 className="t-section">Mi perfil</h1>
          <p className="t-subtitle">Mantén tus datos al día y decide qué quieres recibir.</p>
        </div>
        <Button variant="secondary" onClick={onSignOut}>
          <LogOut size={16} strokeWidth={1.7} aria-hidden="true" />
          Cerrar sesión
        </Button>
      </header>

      <div className="eshop-account-profile">
        <div className="eshop-account-profile__main">
          <section className="eshop-account-panel card" aria-labelledby="profile-data-title">
            <h2 id="profile-data-title" className="t-ui t-strong">
              <UserRound size={17} strokeWidth={1.7} aria-hidden="true" /> Mis datos
            </h2>
            {form && (
              <form ref={profileRef} className="eshop-account-form" onSubmit={onSubmitProfile} noValidate>
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
                <div className="eshop-account-form__grid">
                  <Field label="Teléfono" required error={errors.telefono}>
                    {(id, describedBy) => (
                      <Input id={id} type="tel" inputMode="tel" value={form.telefono} autoComplete="tel"
                        aria-invalid={Boolean(errors.telefono)} aria-describedby={describedBy || undefined}
                        onChange={(event) => set('telefono', event.target.value)} />
                    )}
                  </Field>
                  <Field label="Documento" hint="Opcional">
                    {(id, describedBy) => (
                      <Input id={id} value={form.documento} aria-describedby={describedBy || undefined}
                        onChange={(event) => set('documento', event.target.value)} />
                    )}
                  </Field>
                </div>
                <div className="eshop-account-preference">
                  <div>
                    <p className="t-mid">Quiero recibir ofertas</p>
                    <p className="t-min">Puedes cambiarlo cuando quieras.</p>
                  </div>
                  <Switch checked={form.aceptaOfertas} label="Recibir ofertas"
                    onChange={(value) => set('aceptaOfertas', value)} />
                </div>
                <Button type="submit">Guardar datos</Button>
              </form>
            )}
          </section>

          <section className="eshop-account-panel card" aria-labelledby="password-title">
            <h2 id="password-title" className="t-ui t-strong">
              <KeyRound size={17} strokeWidth={1.7} aria-hidden="true" /> Cambiar contraseña
            </h2>
            <form ref={passwordRef} className="eshop-account-form" onSubmit={(event) => { void onSubmitPassword(event) }} noValidate>
              <Field label="Contraseña actual" required error={passwordErrors.current}>
                {(id, describedBy) => (
                  <Input id={id} type={showPassword ? 'text' : 'password'} value={currentPassword}
                    autoComplete="current-password" aria-invalid={Boolean(passwordErrors.current)}
                    aria-describedby={describedBy || undefined}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value)
                      setPasswordErrors((c) => ({ ...c, current: undefined }))
                    }} />
                )}
              </Field>
              <div className="eshop-account-form__grid">
                <Field label="Contraseña nueva" required error={passwordErrors.next}>
                  {(id, describedBy) => (
                    <Input id={id} type={showPassword ? 'text' : 'password'} value={newPassword}
                      autoComplete="new-password" aria-invalid={Boolean(passwordErrors.next)}
                      aria-describedby={describedBy || undefined}
                      onChange={(event) => {
                        setNewPassword(event.target.value)
                        setPasswordErrors((c) => ({ ...c, next: undefined }))
                      }} />
                  )}
                </Field>
                <Field label="Confirmar contraseña" required error={passwordErrors.confirm}>
                  {(id, describedBy) => (
                    <Input id={id} type={showPassword ? 'text' : 'password'} value={confirmPassword}
                      autoComplete="new-password" aria-invalid={Boolean(passwordErrors.confirm)}
                      aria-describedby={describedBy || undefined}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value)
                        setPasswordErrors((c) => ({ ...c, confirm: undefined }))
                      }} />
                  )}
                </Field>
              </div>
              <button type="button" className="eshop-account-show t-caption"
                aria-label={showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword
                  ? <EyeOff size={16} strokeWidth={1.6} aria-hidden="true" />
                  : <Eye size={16} strokeWidth={1.6} aria-hidden="true" />}
                {showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
              </button>
              {passwordAlert && <div className="eshop-account-alert" role="alert" aria-live="assertive">{passwordAlert}</div>}
              <Button type="submit">Actualizar contraseña</Button>
            </form>
          </section>
        </div>

        <aside className="eshop-account-profile__side">
          <section className="eshop-account-panel card" aria-labelledby="preferences-title">
            <h2 id="preferences-title" className="t-ui t-strong">
              <Bell size={17} strokeWidth={1.7} aria-hidden="true" /> Preferencias
            </h2>
            <div className="eshop-account-preference">
              <div>
                <p className="t-mid">Ofertas y novedades</p>
                <p className="t-min">Lo guardamos con tus datos de cuenta.</p>
              </div>
              <Switch
                checked={form?.aceptaOfertas ?? account.aceptaOfertas}
                label="Recibir ofertas y novedades"
                onChange={(value) => {
                  set('aceptaOfertas', value)
                  update({ aceptaOfertas: value })
                }}
              />
            </div>
          </section>

          <section className="eshop-account-panel eshop-account-panel--danger card" aria-labelledby="delete-title">
            <h2 id="delete-title" className="t-ui t-strong">
              <Trash2 size={17} strokeWidth={1.7} aria-hidden="true" /> Eliminar cuenta
            </h2>
            <p className="t-caption">Si lo haces, tus datos y direcciones se borrarán de este navegador.</p>
            <Button variant="danger" size="sm" onClick={() => { setConfirmText(''); setDeleteOpen(true) }}>
              Eliminar mi cuenta
            </Button>
          </section>
        </aside>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar cuenta">
        <p className="t-mid">Esta acción no se puede deshacer.</p>
        <p className="t-caption">Escribe exactamente <strong className="t-strong">ELIMINAR</strong> para confirmar.</p>
        <Field label="Confirmación">
          {(id) => (
            <Input id={id} value={confirmText} autoComplete="off"
              onChange={(event) => setConfirmText(event.target.value)} />
          )}
        </Field>
        <div className="eshop-account-modal-actions">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button variant="danger" disabled={confirmText !== 'ELIMINAR'} onClick={() => {
            deleteAccount()
            setDeleteOpen(false)
            toast('Tu cuenta se eliminó de este navegador.')
            navigate('/')
          }}>
            Sí, eliminar
          </Button>
        </div>
      </Modal>

      <AccountDemoNote />
    </div>
  )
}
