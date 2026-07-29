import { Clock, User, Eye, CheckCircle } from 'lucide-react'
import styles from './VisualizationVersionCard.module.css'

/**
 * VisualizationVersionCard — карточка версии визуализации.
 * 
 * Показывает:
 * - номер версии
 * - дату загрузки
 * - автора загрузки
 * - статус версии (черновик/утверждено)
 * - preview изображений
 * 
 * @param {Object} props
 * @param {number} props.versionId - номер версии (1, 2, 3...)
 * @param {string} props.date - дата загрузки (ISO string)
 * @param {string} props.author - автор загрузки
 * @param {string} props.status - 'draft' | 'approved'
 * @param {Array} props.images - [{ id, src, alt }]
 * @param {boolean} props.isCurrent - является ли текущей версией
 * @param {Function} props.onSelect - callback при клике на версию
 */
export function VisualizationVersionCard({
  versionId,
  date,
  author,
  status = 'draft',
  images = [],
  isCurrent = false,
  onSelect,
}) {
  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  const previewImages = images.slice(0, 3)

  return (
    <div
      className={`${styles.card} ${isCurrent ? styles.current : ''}`}
      onClick={() => onSelect?.(versionId)}
      role="button"
      tabIndex={0}
    >
      {/* Version badge */}
      <div className={styles.versionBadge}>
        <span className={styles.versionNumber}>Версия {versionId}</span>
        {isCurrent && (
          <span className={styles.currentLabel}>
            <CheckCircle size={10} />
            Актуальная
          </span>
        )}
      </div>

      {/* Preview images */}
      {previewImages.length > 0 && (
        <div className={styles.previewGrid}>
          {previewImages.map((img) => (
            <div key={img.id} className={styles.previewItem}>
              <img src={img.src} alt={img.alt || ''} className={styles.previewImg} />
            </div>
          ))}
          {images.length > 3 && (
            <div className={`${styles.previewItem} ${styles.moreCount}`}>
              <span>+{images.length - 3}</span>
            </div>
          )}
        </div>
      )}

      {/* Meta info */}
      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <Clock size={12} className={styles.metaIcon} />
          <span>{formatDate(date)}</span>
        </div>
        <div className={styles.metaRow}>
          <User size={12} className={styles.metaIcon} />
          <span>{author || 'Неизвестен'}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={`${styles.statusBadge} ${styles[status]}`}>
            {status === 'approved' ? 'Утверждено' : 'Черновик'}
          </span>
        </div>
      </div>

      {/* Select indicator */}
      <div className={styles.selectIndicator}>
        <Eye size={14} />
        <span>Просмотр</span>
      </div>
    </div>
  )
}