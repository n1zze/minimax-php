import styles from './TimelineEditor.module.css'

/**
 * Editor for timeline steps — add, edit, remove, reorder.
 */
export function TimelineEditor({ steps = [], onChange }) {
  function handleStepChange(id, field, value) {
    onChange(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  function handleAdd() {
    const newId = `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    onChange([...steps, { id: newId, title: '', date: '', completed: false }])
  }

  function handleRemove(id) {
    onChange(steps.filter((s) => s.id !== id))
  }

  function handleMoveUp(index) {
    if (index === 0) return
    const next = [...steps]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  function handleMoveDown(index) {
    if (index === steps.length - 1) return
    const next = [...steps]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  return (
    <div className={styles.editor}>
      {steps.map((step, index) => (
        <div key={step.id ?? index} className={styles.row}>
          <div className={styles.order}>
            <button type="button" onClick={() => handleMoveUp(index)} disabled={index === 0}>↑</button>
            <span className={styles.index}>{index + 1}</span>
            <button type="button" onClick={() => handleMoveDown(index)} disabled={index === steps.length - 1}>↓</button>
          </div>
          <div className={styles.fields}>
            <input
              className={styles.input}
              value={step.title}
              onChange={(e) => handleStepChange(step.id, 'title', e.target.value)}
              placeholder="Название этапа"
            />
            <input
              className={styles.dateInput}
              type="date"
              value={step.date}
              onChange={(e) => handleStepChange(step.id, 'date', e.target.value)}
            />
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={step.completed}
                onChange={(e) => handleStepChange(step.id, 'completed', e.target.checked)}
              />
              Готово
            </label>
          </div>
          <button type="button" className={styles.removeBtn} onClick={() => handleRemove(step.id)}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className={styles.addBtn} onClick={handleAdd}>
        + Добавить этап
      </button>
    </div>
  )
}
