import styles from './ImageField.module.css'

/**
 * Editable image with delete button.
 * Shows image preview and an ✕ button to remove it.
 * Optional badge prop shows source label (e.g. "Визуализатор").
 */
export function ImageField({ id, src, alt, onRemove, badge }) {
  return (
    <div className={styles.wrap}>
      <img src={src} alt={alt} className={styles.image} />
      {badge && (
        <span className={styles.badge}>{badge}</span>
      )}
      {onRemove && (
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => onRemove(id)}
          title="Удалить"
        >
          ✕
        </button>
      )}
      <span className={styles.caption}>{alt}</span>
    </div>
  )
}
