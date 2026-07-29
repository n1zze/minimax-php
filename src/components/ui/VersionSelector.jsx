import { ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import styles from './VersionSelector.module.css'

/**
 * VersionSelector — UI для переключения между версиями материалов.
 * Показывает "Версия X из Y" с кнопками назад/вперёд.
 * 
 * @param {number} currentVersion - текущая версия (1-based)
 * @param {number} totalVersions  - всего версий
 * @param {Function} onChange      - callback(newVersion)
 * @param {boolean} isDesigner      - показывать ли кнопки управления (только для дизайнера)
 */
export function VersionSelector({ currentVersion = 1, totalVersions = 1, onChange, isDesigner = false }) {
  if (totalVersions <= 0) return null

  const canPrev = currentVersion > 1
  const canNext = currentVersion < totalVersions

  function handlePrev(e) {
    e.stopPropagation()
    if (canPrev) onChange(currentVersion - 1)
  }

  function handleNext(e) {
    e.stopPropagation()
    if (canNext) onChange(currentVersion + 1)
  }

  return (
    <div className={styles.selector}>
      <div className={styles.label}>
        <Layers size={12} />
        <span>Версия</span>
      </div>

      <div className={styles.controls}>
        {isDesigner && (
          <button
            className={styles.btn}
            onClick={handlePrev}
            disabled={!canPrev}
            title="Предыдущая версия"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <span className={styles.current}>
          <strong>{currentVersion}</strong>
          <span className={styles.divider}>/</span>
          <span>{totalVersions}</span>
        </span>

        {isDesigner && (
          <button
            className={styles.btn}
            onClick={handleNext}
            disabled={!canNext}
            title="Следующая версия"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}