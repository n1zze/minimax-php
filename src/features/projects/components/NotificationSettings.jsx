import { useState } from 'react'
import { api } from '../../../api'
import styles from './NotificationSettings.module.css'

export function NotificationSettings({ projectId, projectTitle, clientName }) {
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!emailEnabled) {
      setError('Email уведомления выключены')
      return
    }

    setSending(true)
    setStatus('')
    setError('')

    try {
      const result = await api.sendProjectEmailNotification(projectId, {
        recipientEmail,
        message: `Обновлены материалы проекта: ${projectTitle}`,
      })
      setStatus(result.status === 'mock_sent' ? 'Проверка пройдена: email поставлен в mock-отправку' : 'Уведомление отправлено')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.settingsCard}>
      <h3 className={styles.settingsTitle}>Уведомления клиенту</h3>

      <div className={styles.row}>
        <span className={styles.rowLabel}>Email уведомление</span>
        <button
          type="button"
          className={`${styles.toggle} ${emailEnabled ? styles.toggleActive : ''}`}
          onClick={() => setEmailEnabled(!emailEnabled)}
          aria-pressed={emailEnabled}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>

      <label className={styles.emailField}>
        Email клиента
        <input
          type="email"
          className={styles.emailInput}
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder={clientName ? `${clientName}@example.com` : 'client@example.com'}
          disabled={!emailEnabled || sending}
        />
      </label>

      <div className={styles.row}>
        <span className={styles.rowLabel}>Telegram уведомление</span>
        <button
          type="button"
          className={`${styles.toggle} ${telegramEnabled ? styles.toggleActive : ''}`}
          onClick={() => setTelegramEnabled(!telegramEnabled)}
          aria-pressed={telegramEnabled}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>

      <button className={styles.sendBtn} onClick={handleSend} disabled={sending || !emailEnabled}>
        {sending ? 'Отправка...' : 'Отправить уведомление'}
      </button>

      {status && <p className={styles.sentMsg}>{status}</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}
