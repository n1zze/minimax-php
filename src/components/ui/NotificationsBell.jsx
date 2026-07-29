import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useNotificationsStore } from '../../store/useNotificationsStore'
import styles from './NotificationsBell.module.css'

function formatRelative(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'только что'
    if (diffMin < 60) return `${diffMin} мин назад`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH} ч назад`
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

export function NotificationsBell() {
  const { items, unreadCount, loadAll, markRead, markAllRead } = useNotificationsStore()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (!dropdownRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Load full list when opening
  useEffect(() => {
    if (open) loadAll()
  }, [open, loadAll])

  function handleItemClick(notification) {
    if (!notification.read) markRead(notification.id)
  }

  return (
    <div className={styles.wrap} ref={dropdownRef}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => setOpen((v) => !v)}
        title="Уведомления"
        aria-label="Уведомления"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.header}>
            <span className={styles.title}>Уведомления</span>
            {unreadCount > 0 && (
              <button type="button" className={styles.markAllBtn} onClick={markAllRead}>
                <CheckCheck size={14} /> Прочитать все
              </button>
            )}
          </div>

          <div className={styles.list}>
            {items.length === 0 ? (
              <div className={styles.empty}>Нет уведомлений</div>
            ) : (
              items.map((n) => {
                const linkTo = n.projectId ? `/projects/${n.projectId}` : null
                const content = (
                  <>
                    {!n.read && <span className={styles.unreadDot} />}
                    <div className={styles.itemBody}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      {n.message && <span className={styles.itemMessage}>{n.message}</span>}
                      <span className={styles.itemDate}>{formatRelative(n.createdAt)}</span>
                    </div>
                    {!n.read && (
                      <button
                        type="button"
                        className={styles.readBtn}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id) }}
                        title="Отметить прочитанным"
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </>
                )
                return linkTo ? (
                  <Link
                    key={n.id}
                    to={linkTo}
                    className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
                    onClick={() => { handleItemClick(n); setOpen(false) }}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={n.id}
                    className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
                    onClick={() => handleItemClick(n)}
                  >
                    {content}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
