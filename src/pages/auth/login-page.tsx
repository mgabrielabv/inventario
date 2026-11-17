import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../app/providers/auth-provider'
import { slides } from '../../data/slides'
import { EASE_OUT } from '../../components/illustrations/motion'
import { OpenBox } from '../../components/illustrations/open-box'
import { HeroSlideshow } from '../../components/slideshow/hero-slideshow'
import { PageTitle } from '../../components/ui/page-title'
import { Stamp } from '../../components/ui/stamp'

export const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [granted, setGranted] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const triggerShake = () => {
    setShaking(true)
    window.setTimeout(() => setShaking(false), 420)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Completa todos los campos')
      triggerShake()
      return
    }

    setSubmitting(true)
    const result = await login(username, password)
    setSubmitting(false)

    if (result.success) {
      setGranted(true)
      window.setTimeout(() => {
        navigate('/', { replace: true })
      }, 950)
      return
    }

    setError(result.error ?? 'Credenciales incorrectas')
    triggerShake()
  }

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
    setError('')
  }

  if (isAuthenticated && !granted) return <Navigate to="/" replace />

  return (
    <div className="login">
      <motion.div
        className="login__form-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <div className="login__inner">
          <div className="login__brand">
            <OpenBox className="login__mark" />
            <span className="login__brand-name">INVENTARIO</span>
          </div>

          <div className="login__heading">
            <PageTitle lines={['ABRE LA', 'BODEGA']} className="login__title" />
            <motion.p
              className="login__subtitle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: EASE_OUT }}
            >
              Control de inventario
            </motion.p>
          </div>

          <div className="login__form-wrap">
            <motion.form
              className={['login__form', shaking ? 'login__form--shake' : '']
                .filter(Boolean)
                .join(' ')}
              onSubmit={handleSubmit}
              noValidate
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: EASE_OUT }}
            >
              <label className="login__field">
                <span className="login__field-label">Usuario</span>
                <input
                  className="login__input"
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    setError('')
                  }}
                  autoComplete="username"
                  aria-invalid={Boolean(error)}
                  disabled={granted}
                />
              </label>

              <label className="login__field">
                <span className="login__field-label">Contraseña</span>
                <input
                  className="login__input login__input--password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  autoComplete="current-password"
                  aria-invalid={Boolean(error)}
                  disabled={granted}
                />
                <button
                  type="button"
                  className="login__toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <Eye size={18} strokeWidth={1.5} aria-hidden="true" />
                  )}
                </button>
              </label>

              {error && (
                <motion.p
                  className="login__error"
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                className="btn btn--primary btn--lg login__submit"
                disabled={submitting || granted}
              >
                {submitting ? 'Comprobando…' : granted ? 'Adelante' : 'Entrar'}
              </button>
            </motion.form>

            {granted && (
              <div className="login__granted" role="status">
                <Stamp animate>Acceso concedido</Stamp>
              </div>
            )}
          </div>

          <div className="login__demo">
            <p className="login__demo-label">Credenciales de prueba</p>
            <div className="login__credential">
              <span className="login__credential-value">admin / admin123</span>
              <button
                type="button"
                className="login__use"
                onClick={() => fillCredentials('admin', 'admin123')}
              >
                Usar
              </button>
            </div>
            <div className="login__credential">
              <span className="login__credential-value">operador / operador123</span>
              <button
                type="button"
                className="login__use"
                onClick={() => fillCredentials('operador', 'operador123')}
              >
                Usar
              </button>
            </div>
            <p className="login__demo-note">El operador entra, pero no exporta reportes.</p>
          </div>
        </div>
      </motion.div>

      <div className="login__panel">
        <HeroSlideshow slides={slides} />
      </div>
    </div>
  )
}
