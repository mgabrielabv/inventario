import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../app/providers/theme-provider'
import { useViewTransitionTheme } from '../../motion/hooks/useViewTransitionTheme'

export const ThemeToggle = ({ className = '' }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme()
  const toggle = useViewTransitionTheme(toggleTheme)
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      aria-label={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      onClick={(event) => toggle(event)}
    >
      {theme === 'light' ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />}
    </button>
  )
}
