import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { api } from '../../api'
import { Lock } from 'lucide-react'
import styles from './UnlockPage.module.css'

export default function UnlockPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loginAsClient, loading, error, clearError } = useAuthStore()
  const [password, setPassword] = useState('')
  const [projectInfo, setProjectInfo] = useState(null)
  const [projectExists, setProjectExists] = useState(true)

  useEffect(() => {
    let cancelled = false

    api.getProjectAccessInfo(id)
      .then((info) => {
        if (!cancelled) {
          setProjectInfo(info)
          setProjectExists(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjectExists(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    clearError()
    try {
      await loginAsClient(id, password)
      navigate(`/projects/${id}`)
    } catch {
      // error is stored in auth store
    }
  }

  if (!projectExists) {
    return (
      <div className={styles.page}>
        <div className={styles.form}>
          <div className={styles.iconWrap}>
            <Lock size={32} />
          </div>
          <h1 className={styles.title}>Проект не найден</h1>
          <p className={styles.subtitle}>Этот проект не существует или был удалён.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.iconWrap}>
          <Lock size={32} />
        </div>
        <h1 className={styles.title}>Доступ к проекту</h1>
        <p className={styles.subtitle}>
          {projectInfo?.title ? `Проект: ${projectInfo.title}. ` : ''}
          Введите пароль, полученный от дизайнера.
        </p>
        <label className={styles.label}>
          <span>Пароль</span>
          <input
            type="password"
            className={styles.input}
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearError()
            }}
            required
            autoFocus
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? 'Проверка...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
