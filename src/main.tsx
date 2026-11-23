import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './styles/index.css'
import App from './App'
import { AuthProvider } from './app/providers/auth-provider'
import { ThemeProvider } from './app/providers/theme-provider'
import { FlyToCartProvider } from './motion/hooks/useFlyToCart'
import { ToastProvider } from './components/ui/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <FlyToCartProvider>
              <App />
            </FlyToCartProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
)
