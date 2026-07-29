import styles from './SpecEditor.module.css'

/**
 * Editable specification table — add, edit, remove rows.
 */
export function SpecEditor({ items = [], onChange }) {
  function handleItemChange(id, field, value) {
    onChange(items.map((it) => (it.id === id ? { ...it, [field]: value } : it)))
  }

  function handleAdd() {
    const newId = Date.now()
    onChange([...items, { id: newId, category: '', name: '', brand: '', qty: 1, price: 0, link: '' }])
  }

  function handleRemove(id) {
    onChange(items.filter((it) => it.id !== id))
  }

  return (
    <div className={styles.editor}>
      <div className={styles.table}>
        <div className={styles.headerRow}>
          <span>Категория</span>
          <span>Наименование</span>
          <span>Бренд</span>
          <span className={styles.numCol}>Кол-во</span>
          <span className={styles.numCol}>Цена</span>
          <span>Ссылка</span>
          <span className={styles.actionCol} />
        </div>
        {items.map((item) => (
          <div key={item.id} className={styles.row}>
            <input
              className={styles.cell}
              value={item.category}
              onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
              placeholder="Категория"
            />
            <input
              className={styles.cell}
              value={item.name}
              onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
              placeholder="Наименование"
            />
            <input
              className={styles.cell}
              value={item.brand}
              onChange={(e) => handleItemChange(item.id, 'brand', e.target.value)}
              placeholder="Бренд"
            />
            <input
              className={`${styles.cell} ${styles.numCell}`}
              type="number"
              min="1"
              value={item.qty}
              onChange={(e) => handleItemChange(item.id, 'qty', Number(e.target.value))}
            />
            <input
              className={`${styles.cell} ${styles.numCell}`}
              type="number"
              min="0"
              value={item.price}
              onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
            />
            <input
              className={styles.cell}
              type="url"
              value={item.link || ''}
              onChange={(e) => handleItemChange(item.id, 'link', e.target.value)}
              placeholder="https://..."
            />
            <button type="button" className={styles.removeBtn} onClick={() => handleRemove(item.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className={styles.addBtn} onClick={handleAdd}>
        + Добавить позицию
      </button>
    </div>
  )
}
