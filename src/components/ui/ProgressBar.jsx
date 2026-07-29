import styles from './ProgressBar.module.css'

export function ProgressBar({ value = 0 }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <div className={styles.bar}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.label}>{percent}%</span>
    </div>
  )
}
