import { useState, useRef, MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const cubeRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent) => {
    if (!cubeRef.current) return
    const rect = cubeRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / 30
    const y = (e.clientY - rect.top - rect.height / 2) / 30
    cubeRef.current.style.transform = `rotateY(${x + 15}deg) rotateX(${-y - 15}deg)`
  }

  const handleMouseLeave = () => {
    if (!cubeRef.current) return
    cubeRef.current.style.transform = 'rotateY(15deg) rotateX(-15deg)'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!username || !password) {
      setError('Completa todos los campos')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      return
    }

    const result = await login(username, password)
    if (result.success) {
      setIsSuccess(true)
      toast.success('Acceso concedido')
      setTimeout(() => {
        navigate('/')
      }, 1200)
    } else {
      setError(result.error || 'Credenciales incorrectas')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  }

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
    setError('')
  }

  return (
    <div 
      className="min-h-[100svh] w-full grid login-grid overflow-hidden relative"
      style={{ 
        gridTemplateColumns: 'minmax(420px, 1fr) 1.2fr',
        gap: 0,
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .login-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: 28svh 1fr;
          }
        }
        @media (max-height: 600px) {
          .login-reduce .logo-block { margin-bottom: 32px !important; }
          .login-reduce .title-block { margin-bottom: 8px !important; }
          .login-reduce .subtitle-block { display: none !important; }
          .login-reduce .fields-block { margin-top: 24px !important; }
          .login-reduce .field-group { margin-bottom: 16px !important; }
          .login-reduce .button-block { margin-top: 20px !important; }
          .login-reduce .demo-block { margin-top: 16px !important; padding-top: 16px !important; }
        }
        .field-container {
          position: relative;
          padding-top: 24px;
          margin-bottom: 32px;
        }
        .field-input {
          width: 100%;
          background: transparent;
          border: 0;
          border-bottom: 1px solid var(--line-strong);
          padding: 12px 0;
          height: 48px;
          font-size: 15px;
          color: var(--ink);
          outline: none;
          transition: border-color 0.3s ease;
        }
        .field-label {
          position: absolute;
          top: 24px;
          left: 0;
          font-size: 15px;
          color: var(--ink-subtle);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 1;
        }
        .field-container:focus-within .field-label,
        .field-input:not(:placeholder-shown) + .field-label {
          top: 0;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink);
        }
        .field-container:focus-within .field-input {
          border-color: var(--accent);
        }
        .field-line {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 1px;
          width: 100%;
          background: var(--accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .field-container:focus-within .field-line {
          transform: scaleX(1);
        }
        .password-toggle {
          position: absolute;
          right: 0;
          top: 24px;
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--ink-subtle);
          transition: color 0.3s ease;
          margin-top: 4px;
        }
        .password-toggle:hover {
          color: var(--ink);
        }
        .login-btn {
          width: 100%;
          height: 56px;
          background: var(--accent);
          color: #FBFAF6;
          border: none;
          font-size: 13px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.3s ease;
          margin-top: 40px;
        }
        .login-btn:hover {
          background: var(--accent-hover);
        }
        .login-btn:hover .btn-arrow {
          transform: translateX(4px);
        }
        .btn-arrow {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .chip {
          padding: 8px 12px;
          border: 1px solid var(--line-strong);
          font-size: 13px;
          font-family: var(--font-mono);
          color: var(--ink-soft);
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 2px;
        }
        .chip:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .cube-scene {
          perspective: 1200px;
          width: 200px;
          height: 200px;
        }
        .cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: cubeRotate 24s linear infinite;
        }
        @keyframes cubeRotate {
          from { transform: rotateY(15deg) rotateX(-15deg) rotateZ(0deg); }
          to { transform: rotateY(375deg) rotateX(-15deg) rotateZ(360deg); }
        }
        .cube-face {
          position: absolute;
          width: 200px;
          height: 200px;
          border: 1px solid rgba(251, 250, 246, 0.4);
          background: rgba(251, 250, 246, 0.04);
        }
        .cube-face.front { transform: translateZ(100px); }
        .cube-face.back { transform: rotateY(180deg) translateZ(100px); }
        .cube-face.right { transform: rotateY(90deg) translateZ(100px); }
        .cube-face.left { transform: rotateY(-90deg) translateZ(100px); }
        .cube-face.top { transform: rotateX(90deg) translateZ(100px); }
        .cube-face.bottom { transform: rotateX(-90deg) translateZ(100px); }
      `}</style>

      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isSuccess ? '-100%' : 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-center overflow-y-auto"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div className="w-full max-w-[440px] px-12 py-8 login-reduce">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="logo-block mb-[64px]"
          >
            <div className="flex items-center gap-3">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4L4 10V22L16 28L28 22V10L16 4Z" stroke="var(--ink)" strokeWidth="1.25" fill="none"/>
                <path d="M16 4V16M16 16L4 10M16 16L28 10M16 28V16" stroke="var(--ink)" strokeWidth="1.25"/>
              </svg>
              <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>
                Atelier de Almacén
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="title-block mb-[16px]"
          >
            <h1 
              className="leading-[1.05]"
              style={{ 
                fontFamily: 'var(--font-display)', 
                color: 'var(--ink)',
                fontSize: 'clamp(40px, 5vw, 72px)',
                textWrap: 'balance',
              }}
            >
              Cada cosa,<br />
              en su <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>lugar.</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="subtitle-block mb-[48px]"
          >
            <p className="text-sm" style={{ color: 'var(--ink-subtle)' }}>
              Sistema de Control e Inventario
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              x: isShaking ? [-4, 4, -4, 4, 0] : 0
            }}
            transition={{ 
              opacity: { duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] },
              y: { duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] },
              x: { duration: 0.4 }
            }}
            onSubmit={handleSubmit}
            className="fields-block"
          >
            <div className="field-group mb-[32px]">
              <div className="field-container">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError('')
                  }}
                  className="field-input"
                  placeholder=" "
                  autoComplete="username"
                />
                <label className="field-label">Usuario</label>
                <div className="field-line"></div>
              </div>

              <div className="field-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="field-input"
                  placeholder=" "
                  autoComplete="current-password"
                  style={{ paddingRight: '48px' }}
                />
                <label className="field-label">Contraseña</label>
                <div className="field-line"></div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.25} /> : <Eye size={18} strokeWidth={1.25} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs mb-4"
                  style={{ color: 'var(--accent)' }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="submit" className="login-btn button-block">
              <span>Ingresar</span>
              <ArrowRight size={16} strokeWidth={1.25} className="btn-arrow" />
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="demo-block mt-[32px] pt-[32px] border-t"
            style={{ borderColor: 'var(--line)' }}
          >
            <p className="text-[11px] tracking-[0.14em] uppercase mb-[12px]" style={{ color: 'var(--ink-subtle)' }}>
              CREDENCIALES DEMO
            </p>
            <div className="flex flex-wrap gap-[8px]">
              <button type="button" onClick={() => fillCredentials('admin', 'admin123')} className="chip">
                admin / admin123
              </button>
              <button type="button" onClick={() => fillCredentials('operador', 'operador123')} className="chip">
                operador / operador123
              </button>
            </div>
            <p className="text-xs mt-[12px]" style={{ color: 'var(--ink-subtle)' }}>
              Operador: solo lectura en Reportes
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isSuccess ? '0%' : 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#0E0E0C' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ECE8DD" strokeWidth="0.5" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="cube-scene relative z-10">
          <div ref={cubeRef} className="cube" style={{ transition: 'transform 0.3s ease-out' }}>
            <div className="cube-face front"></div>
            <div className="cube-face back"></div>
            <div className="cube-face right"></div>
            <div className="cube-face left"></div>
            <div className="cube-face top"></div>
            <div className="cube-face bottom"></div>
          </div>
        </div>

        <div className="absolute top-12 left-12 text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(236, 232, 221, 0.4)' }}>
          INV.001 / STOCK:015
        </div>
        <div className="absolute top-12 right-12 text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(236, 232, 221, 0.4)' }}>
          CAT:ELEC
        </div>
        <div className="absolute bottom-12 left-12 text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(236, 232, 221, 0.4)' }}>
          00:00:00
        </div>
        <div className="absolute bottom-12 right-12 text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(236, 232, 221, 0.4)' }}>
          ATM:ALM-01
        </div>
      </motion.div>
    </div>
  )
}
