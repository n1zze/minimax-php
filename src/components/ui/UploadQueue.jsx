import { X, CheckCircle, AlertCircle, Loader, Image, FileText, Upload } from 'lucide-react'
import styles from './UploadQueue.module.css'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type) {
  if (type?.startsWith('image/')) return <Image size={16} />
  if (type === 'application/pdf') return <FileText size={16} />
  return <Upload size={16} />
}

/**
 * UploadQueue — визуальный компонент очереди загрузок.
 * Показывает прогресс, превью, ошибки для каждого файла.
 */
export function UploadQueue({ queue = [], errors = [], onRemove, onClearCompleted, onClearErrors }) {
  const hasItems = queue.length > 0
  const hasErrors = errors.length > 0
  const completedCount = queue.filter(i => i.status === 'done').length
  const totalCount = queue.length

  if (!hasItems && !hasErrors) return null

  return (
    <div className={styles.queue}>
      {/* Global errors */}
      {hasErrors && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span className={styles.errorText}>
            {errors.length === 1 ? errors[0] : `${errors.length} ошибок при загрузке`}
          </span>
          {onClearErrors && (
            <button className={styles.clearBtn} onClick={onClearErrors}>
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Header with summary */}
      {hasItems && (
        <div className={styles.header}>
          <span className={styles.summary}>
            {completedCount === totalCount
              ? `Загружено ${completedCount} из ${totalCount}`
              : `Загрузка ${completedCount} из ${totalCount}`}
          </span>
          {completedCount > 0 && onClearCompleted && (
            <button className={styles.clearBtn} onClick={onClearCompleted}>
              Очистить загруженные
            </button>
          )}
        </div>
      )}

      {/* File items */}
      <ul className={styles.list}>
        {queue.map((item) => (
          <li key={item.id} className={`${styles.item} ${styles[item.status] || ''}`}>
            {/* Preview */}
            <div className={styles.preview}>
              {item.preview ? (
                <img src={item.preview} alt="" className={styles.previewImg} />
              ) : (
                <span className={styles.previewIcon}>{getFileIcon(item.type)}</span>
              )}
            </div>

            {/* Info */}
            <div className={styles.info}>
              <span className={styles.name}>{item.name}</span>
              <span className={styles.meta}>
                {formatBytes(item.size)}
                {item.status === 'compressing' && ' · Сжатие...'}
                {item.status === 'uploading' && ` · ${item.progress}%`}
                {item.status === 'error' && ` · ${item.error}`}
              </span>
              {item.status === 'error' && (
                <span className={styles.errorMsg}>{item.error}</span>
              )}
            </div>

            {/* Status icon */}
            <div className={styles.status}>
              {item.status === 'done' && <CheckCircle size={16} className={styles.iconSuccess} />}
              {item.status === 'error' && <AlertCircle size={16} className={styles.iconError} />}
              {item.status === 'uploading' || item.status === 'compressing' ? (
                <Loader size={16} className={styles.iconLoading} />
              ) : null}
            </div>

            {/* Remove button */}
            {onRemove && (
              <button
                className={styles.removeBtn}
                onClick={() => onRemove(item.id)}
                title="Удалить"
              >
                <X size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}