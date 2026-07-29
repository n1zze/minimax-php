import { useMemo, useState } from 'react'
import { Check, Copy, KeyRound, Link as LinkIcon, RefreshCw, Eye, UserPlus } from 'lucide-react'
import { api } from '../../../api'
import styles from './ClientAccessPanel.module.css'

/** Generate a random 8-char password */
function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Generate a visualizer access token (longer, more secure) */
function generateVisualizerToken() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function ClientAccessPanel({ projectId, onVisualizerAccess }) {
  const [password, setPassword] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')

  // Visualizer access state
  const [visualizerToken, setVisualizerToken] = useState('')
  const [generatedVizToken, setGeneratedVizToken] = useState('')
  const [vizStatus, setVizStatus] = useState('')
  const [vizCopied, setVizCopied] = useState('')

  const clientLink = useMemo(() => {
    if (typeof window === 'undefined') return `/projects/${projectId}/unlock`
    return `${window.location.origin}/projects/${projectId}/unlock`
  }, [projectId])

  const visualizerLink = useMemo(() => {
    if (typeof window === 'undefined') return `/visualizer/${projectId}/unlock`
    return `${window.location.origin}/visualizer/${projectId}/unlock`
  }, [projectId])

  async function copyText(value, label) {
    setError('')
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(''), 1800)
    } catch {
      setError('Не удалось скопировать. Выделите значение вручную.')
    }
  }

  async function copyVizText(value, label) {
    try {
      await navigator.clipboard.writeText(value)
      setVizCopied(label)
      window.setTimeout(() => setVizCopied(''), 1800)
    } catch {
      // silent
    }
  }

  function handleGeneratePassword() {
    const pwd = generatePassword()
    setPassword(pwd)
    setGeneratedPassword(pwd)
    setError('')
    setStatus('')
  }

  async function handleSavePassword() {
    const pwdToSave = password.trim()
    if (pwdToSave.length < 4) {
      setError('Пароль должен быть не короче 4 символов')
      return
    }

    setSaving(true)
    setError('')
    setStatus('')

    try {
      // Send plain password — server hashes it with bcrypt
      await api.updateProject(projectId, { passwordHash: pwdToSave })
      setGeneratedPassword(pwdToSave)
      setStatus('Пароль клиента сохранён')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Visualizer access handlers
  function handleGenerateVizToken() {
    const token = generateVisualizerToken()
    setVisualizerToken(token)
    setGeneratedVizToken(token)
    setVizStatus('')
  }

  async function handleSaveVizToken() {
    const tokenToSave = visualizerToken.trim()
    if (tokenToSave.length < 8) {
      setVizStatus('Токен должен быть не короче 8 символов')
      return
    }

    setSaving(true)
    try {
      await api.updateProject(projectId, { visualizerToken: tokenToSave })
      setGeneratedVizToken(tokenToSave)
      setVizStatus('Токен визуализатора сохранён')
      onVisualizerAccess?.({ token: tokenToSave, link: visualizerLink })
    } catch (err) {
      setVizStatus(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Доступ клиента</h3>
          <p className={styles.subtitle}>Отправьте клиенту ссылку и пароль проекта.</p>
        </div>
        <KeyRound size={22} className={styles.icon} />
      </div>

      <div className={styles.linkRow}>
        <LinkIcon size={16} />
        <input className={styles.linkInput} value={clientLink} readOnly />
        <button className={styles.iconBtn} type="button" onClick={() => copyText(clientLink, 'link')} title="Скопировать ссылку">
          {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      <div className={styles.passwordRow}>
        <input
          className={styles.passwordInput}
          type="text"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setGeneratedPassword('')
            setError('')
            setStatus('')
          }}
          placeholder="Новый пароль клиента"
        />
        <button className={styles.iconBtn} type="button" onClick={handleGeneratePassword} title="Сгенерировать пароль">
          <RefreshCw size={16} />
        </button>
        <button className={styles.saveBtn} type="button" onClick={handleSavePassword} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button className={styles.iconBtn} type="button" onClick={() => copyText(password, 'password')} disabled={!password} title="Скопировать пароль">
          {copied === 'password' ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {generatedPassword && (
        <p className={styles.generatedNote}>
          Пароль сохранён. Скопируйте его и отправьте клиенту.
        </p>
      )}

      {status && <p className={styles.status}>{status}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* Visualizer Access Section */}
      <div className={styles.vizDivider}>
        <UserPlus size={18} />
        <span>Доступ визуализатора</span>
      </div>

      <p className={styles.vizDescription}>
        Создайте токен для CGI/3D визуализатора. Визуализатор увидит только планировку и визуализации.
      </p>

      <div className={styles.linkRow}>
        <Eye size={16} />
        <input className={styles.linkInput} value={visualizerLink} readOnly />
        <button className={styles.iconBtn} type="button" onClick={() => copyVizText(visualizerLink, 'vizLink')} title="Скопировать ссылку">
          {vizCopied === 'vizLink' ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      <div className={styles.passwordRow}>
        <input
          className={styles.passwordInput}
          type="text"
          value={visualizerToken}
          onChange={(e) => {
            setVisualizerToken(e.target.value)
            setGeneratedVizToken('')
            setVizStatus('')
          }}
          placeholder="Токен визуализатора"
        />
        <button className={styles.iconBtn} type="button" onClick={handleGenerateVizToken} title="Сгенерировать токен">
          <RefreshCw size={16} />
        </button>
        <button className={styles.saveBtn} type="button" onClick={handleSaveVizToken} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button className={styles.iconBtn} type="button" onClick={() => copyVizText(visualizerToken, 'vizToken')} disabled={!visualizerToken} title="Скопировать токен">
          {vizCopied === 'vizToken' ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {generatedVizToken && (
        <p className={styles.generatedNote}>
          Токен сохранён. Отправьте визуализатору ссылку и токен.
        </p>
      )}

      {vizStatus && <p className={styles.status}>{vizStatus}</p>}
    </section>
  )
}
