import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../app/providers/auth-provider'
import { slides } from '../../data/slides'
import { EASE_OUT } from '../../components/illustrations/motion'
import { OpenBox } from '../../components/illustrations/open-box'
import { HeroSlideshow } from '../../components/slideshow/hero-slideshow'

export const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { login, isAuthenticated } = useAuth()

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
      toast.success('Acceso concedido')
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

  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="login">
      <motion.div
        className="login__form-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <div className="login__inner">
          <motion.div
            className="login__brand"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
          >
            <OpenBox className="login__mark" />
            <span className="login__brand-name">Atelier de Almacén</span>
          </motion.div>

          <motion.div
            className="login__heading"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: EASE_OUT }}
          >
            <h1 className="login__title">
              Cada cosa,
              <br />
              en su <em>lugar.</em>
            </h1>
            <p className="login__subtitle">Sistema de Control e Inventario</p>
          </motion.div>

          <motion.form
            className={['login__form', shaking ? 'login__form--shake' : ''].filter(Boolean).join(' ')}
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.26, ease: EASE_OUT }}
          >
            <div className="field field--line">
              <input
                id="login-user"
                className="field__input"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setError('')
                }}
                placeholder=" "
                autoComplete="username"
                aria-invalid={Boolean(error)}
              />
              <label className="field__label" htmlFor="login-user">
                Usuario
              </label>
              <span className="field__rule" aria-hidden="true" />
            </div>

            <div className="field field--line field--password">
              <input
                id="login-password"
                className="field__input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
                placeholder=" "
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
              />
              <label className="field__label" htmlFor="login-password">
                Contraseña
              </label>
              <span className="field__rule" aria-hidden="true" />
              <button
                type="button"
                className="field__toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.25} aria-hidden="true" />
                ) : (
                  <Eye size={18} strokeWidth={1.25} aria-hidden="true" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  className="login__error"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="submit" className="btn btn--primary btn--lg login__submit" disabled={submitting}>
              <span>{submitting ? 'Comprobando…' : 'Ingresar'}</span>
              <ArrowRight size={16} strokeWidth={1.25} className="login__submit-arrow" aria-hidden="true" />
            </button>
          </motion.form>

          <motion.div
            className="login__demo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: EASE_OUT }}
          >
            <p className="login__demo-label">Credenciales demo</p>
            <div className="login__chips">
              <button
                type="button"
                className="chip"
                onClick={() => fillCredentials('admin', 'admin123')}
              >
                admin / admin123
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => fillCredentials('operador', 'operador123')}
              >
                operador / operador123
              </button>
            </div>
            <p className="login__demo-note">Operador: solo lectura en Reportes</p>
          </motion.div>

          <p className="login__meta">01 / ACCESO · ATELIER DE ALMACÉN</p>
        </div>
      </motion.div>

      <div className="login__panel">
        <HeroSlideshow slides={slides} />
      </div>
    </div>
  )
}
