import styles from './DiaryEditor.module.css'

/**
 * Editor for author supervision diary entries — add, edit, remove.
 */
export function DiaryEditor({ entries = [], onChange }) {
  function handleEntryChange(id, field, value) {
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  function handleAdd() {
    const newId = Date.now()
    const today = new Date().toISOString().slice(0, 10)
    onChange([...entries, { id: newId, date: today, title: '', description: '' }])
  }

  function handleRemove(id) {
    onChange(entries.filter((e) => e.id !== id))
  }

  return (
    <div className={styles.editor}>
      {entries.map((entry) => (
        <div key={entry.id} className={styles.row}>
          <input
            className={styles.dateInput}
            type="date"
            value={entry.date}
            onChange={(e) => handleEntryChange(entry.id, 'date', e.target.value)}
          />
          <input
            className={styles.titleInput}
            value={entry.title}
            onChange={(e) => handleEntryChange(entry.id, 'title', e.target.value)}
            placeholder="Заголовок"
          />
          <input
            className={styles.descInput}
            value={entry.description}
            onChange={(e) => handleEntryChange(entry.id, 'description', e.target.value)}
            placeholder="Описание"
          />
          <button type="button" className={styles.removeBtn} onClick={() => handleRemove(entry.id)}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className={styles.addBtn} onClick={handleAdd}>
        + Добавить запись
      </button>
    </div>
  )
}
