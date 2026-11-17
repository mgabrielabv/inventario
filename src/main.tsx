import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import './styles/index.css'
import App from './App.tsx'
import { AuthProvider } from './app/providers/auth-provider'
import { ThemeProvider } from './app/providers/theme-provider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster position="bottom-right" closeButton />
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
)
