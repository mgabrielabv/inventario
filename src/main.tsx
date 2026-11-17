import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-surface)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: '0',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
