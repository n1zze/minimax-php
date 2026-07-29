import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore, ROLE_DESIGNER, ROLE_LABELS } from '../../store/useAuthStore'
import { useNotificationsStore } from '../../store/useNotificationsStore'
import { LogOut, Palette, User } from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { NotificationsBell } from '../ui/NotificationsBell'
import styles from './Header.module.css'

export function Header() {
  const { user, logout } = useAuthStore()
  const { startPolling, stopPolling, reset } = useNotificationsStore()
  const navigate = useNavigate()

  // Manage notifications polling lifecycle
  useEffect(() => {
    if (user) {
      startPolling()
      return () => stopPolling()
    } else {
      reset()
    }
  }, [user, startPolling, stopPolling, reset])

  function handleLogout() {
    stopPolling()
    reset()
    logout()
    navigate('/login')
  }

  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : ''

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoImg} aria-label="Vitalina Design" role="img" />
        </Link>

        <nav className={styles.nav}>
          {user && (
            <Link to="/" className={styles.navLink}>
              Проекты
            </Link>
          )}
        </nav>

        <div className={styles.userSection}>
          {user && <NotificationsBell />}
          <ThemeToggle />
          {user ? (
            <>
              <div className={styles.userInfo}>
                <span className={styles.roleIcon}>
                  {user.role === ROLE_DESIGNER ? <Palette size={14} /> : <User size={14} />}
                </span>
                <span className={styles.roleLabel}>{roleLabel}</span>
                {user.email && <span className={styles.email}>{user.email}</span>}
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout} title="Выйти">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.loginLink}>
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
