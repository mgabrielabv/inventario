import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../../components/brand/BrandMark'
import { BoxStack } from '../../components/box/BoxStack'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { useAuth } from '../../app/providers/auth-provider'
import { storeName } from '../../logic/services/formatters'
import { useSettingsStore } from '../../logic/store/settings'
import { MeshBackground } from '../../motion/components/MeshBackground'
import { useParallaxTilt } from '../../motion/hooks/useParallaxTilt'
import { riseIn, riseItem } from '../../motion/variants'

const credentials = [
  { username: 'admin', password: 'admin123', label: 'admin / admin123' },
  { username: 'operador', password: 'operador123', label: 'operador / operador123' },
]

export const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const tilt = useParallaxTilt()
  const settings = useSettingsStore((state) => state.settings)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Escribe tu usuario y contraseña.')
      return
    }
    setSubmitting(true)
    const result = await login(username, password)
    setSubmitting(false)
    if (result.success) {
      navigate('/admin', { replace: true })
      return
    }
    setError(result.error ?? 'No se pudo iniciar sesión.')
  }

  const fill = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
    setError('')
  }

  return (
    <div className="login-page">
      <motion.section
        className="login-page__panel"
        variants={riseIn}
        initial="hidden"
        animate="show"
        aria-labelledby="login-page-title"
      >
        <motion.div className="login-page__inner" variants={riseItem}>
          <div className="login-page__brand">
            <BrandMark size={28} />
            <span>{storeName(settings)}</span>
          </div>

          <motion.div className="login-page__heading" variants={riseItem}>
            <p className="login-page__eyebrow t-min t-clay">Acceso del personal</p>
            <h1 id="login-page-title" className="t-section">Entrar al panel</h1>
            <p className="t-caption">
              Este ingreso es solo para el equipo de {storeName(settings)}.
            </p>
            <p className="t-caption">
              ¿Eres cliente? <Link to="/cuenta/ingresar">Ingresa aquí</Link>.
            </p>
          </motion.div>

          <form className="login-page__form" onSubmit={onSubmit} noValidate>
            <Field label="Usuario" required>
              {(id, describedBy) => (
                <Input
                  id={id}
                  value={username}
                  autoComplete="username"
                  autoFocus
                  enterKeyHint="next"
                  aria-describedby={describedBy || undefined}
                  aria-invalid={Boolean(error)}
                  onChange={(event) => { setUsername(event.target.value); setError('') }}
                />
              )}
            </Field>

            <Field label="Contraseña" required>
              {(id, describedBy) => (
                <div className="login-page__password">
                  <Input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    aria-describedby={describedBy || undefined}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => { setPassword(event.target.value); setError('') }}
                  />
                  <button
                    type="button"
                    className="login-page__toggle"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword
                      ? <EyeOff size={18} strokeWidth={1.5} aria-hidden="true" />
                      : <Eye size={18} strokeWidth={1.5} aria-hidden="true" />}
                  </button>
                </div>
              )}
            </Field>

            {error && (
              <p className="login-page__error" role="alert" aria-live="assertive">{error}</p>
            )}

            <Button type="submit" full disabled={submitting}>
              {submitting ? 'Comprobando…' : 'Entrar'}
            </Button>
          </form>

          <div className="login-page__demo">
            <p className="t-min t-muted">Cuentas de demostración</p>
            {credentials.map((item) => (
              <div className="login-page__credential" key={item.username}>
                <code className="t-caption">{item.label}</code>
                <button
                  type="button"
                  className="login-page__use t-caption"
                  onClick={() => fill(item.username, item.password)}
                >
                  Usar
                </button>
              </div>
            ))}
          </div>

          <Link className="login-page__back t-mid" to="/">
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
            Volver a la tienda
          </Link>
        </motion.div>
      </motion.section>

      <section className="login-page__visual" aria-label="Ilustración de la tienda">
        <MeshBackground />
        <div className="login-page__visual-inner">
          <motion.div
            ref={tilt.ref}
            className="login-page__tilt"
            style={tilt.style}
            onPointerMove={tilt.onPointerMove}
            onPointerLeave={tilt.onPointerLeave}
          >
            <BoxStack size={340} />
          </motion.div>
          <div className="login-page__visual-copy">
            <p className="t-min t-clay">Panel del personal</p>
            <p className="t-statement">Cada caja, en su lugar.</p>
            <p className="t-caption">Productos, movimientos y pedidos en un mismo sitio.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
