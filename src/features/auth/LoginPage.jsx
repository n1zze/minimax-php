import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { Palette } from 'lucide-react'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loginAsDesigner, loading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    clearError()
    try {
      await loginAsDesigner(email.trim(), password)
      navigate('/')
    } catch {
      // error is set in store
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.iconWrap}>
          <Palette size={32} />
        </div>
        <h1 className={styles.title}>Вход для дизайнера</h1>
        <p className={styles.subtitle}>Войдите для управления проектами</p>
        <label className={styles.label}>
          <span>Email</span>
          <input
            type="email"
            className={styles.input}
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError() }}
            autoComplete="username"
            required
          />
        </label>
        <label className={styles.label}>
          <span>Пароль</span>
          <input
            type="password"
            className={styles.input}
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError() }}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
        <p className={styles.footer}>
          Клиент? Перейдите по ссылке из письма
        </p>
      </form>
    </div>
  )
}
