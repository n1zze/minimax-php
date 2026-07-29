import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'
import styles from './ThemeToggle.module.css'

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={`${styles.btn} ${className}`}
      onClick={toggle}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
