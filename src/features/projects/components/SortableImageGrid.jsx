import { useRef, useState } from 'react'
import { GripVertical, X } from 'lucide-react'
import styles from './SortableImageGrid.module.css'

/**
 * Sortable image grid with drag & drop reordering.
 *
 * Props:
 * - items: [{ id, src, alt, uploadedBy?, ... }]
 * - onReorder(newItems): called when user drops to a new position
 * - onRemove(id): optional remove handler
 * - badgeFor(item): optional function returning a badge string for an image
 */
export function SortableImageGrid({ items = [], onReorder, onRemove, badgeFor }) {
  const dragIndex = useRef(null)
  const [overIndex, setOverIndex] = useState(null)

  function handleDragStart(e, index) {
    dragIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
    // Required for Firefox
    try { e.dataTransfer.setData('text/plain', String(index)) } catch { /* ignore */ }
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overIndex !== index) setOverIndex(index)
  }

  function handleDragLeave() {
    setOverIndex(null)
  }

  function handleDrop(e, index) {
    e.preventDefault()
    const from = dragIndex.current
    dragIndex.current = null
    setOverIndex(null)
    if (from === null || from === index) return

    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(index, 0, moved)
    onReorder?.(next)
  }

  function handleDragEnd() {
    dragIndex.current = null
    setOverIndex(null)
  }

  if (items.length === 0) return null

  return (
    <div className={styles.grid}>
      {items.map((item, index) => {
        const isDragging = dragIndex.current === index
        const isOver = overIndex === index && dragIndex.current !== index
        const badge = badgeFor?.(item)

        return (
          <div
            key={item.id || index}
            className={`${styles.cell} ${isDragging ? styles.cellDragging : ''} ${isOver ? styles.cellOver : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.dragHandle} title="Перетащите для изменения порядка">
              <GripVertical size={14} />
            </div>
            <span className={styles.orderBadge}>{index + 1}</span>
            <img src={item.src} alt={item.alt || ''} className={styles.image} />
            {badge && <span className={styles.sourceBadge}>{badge}</span>}
            {onRemove && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => onRemove(item.id)}
                title="Удалить"
              >
                <X size={14} />
              </button>
            )}
            <span className={styles.caption}>{item.alt || ''}</span>
          </div>
        )
      })}
    </div>
  )
}
