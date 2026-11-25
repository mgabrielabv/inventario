import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './motion/css-vars'
import './styles/index.css'
import App from './App'
import { AuthProvider } from './app/providers/auth-provider'
import { CustomerProvider } from './app/providers/customer-provider'
import { ThemeProvider } from './app/providers/theme-provider'
import { FlyToCartProvider } from './motion/hooks/useFlyToCart'
import { ToastProvider } from './components/ui/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <CustomerProvider>
            <ToastProvider>
              <FlyToCartProvider>
                <App />
              </FlyToCartProvider>
            </ToastProvider>
          </CustomerProvider>
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
)
