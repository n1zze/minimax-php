import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './Lightbox.module.css'

export function Lightbox({ images = [], currentIndex = 0, onClose, onPrev, onNext }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onPrev?.()
    if (e.key === 'ArrowRight') onNext?.()
  }, [onClose, onPrev, onNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  if (!images.length) return null

  const image = images[currentIndex]

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Просмотр изображения">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
        {currentIndex > 0 && (
          <button className={`${styles.navBtn} ${styles.prev}`} onClick={onPrev} aria-label="Предыдущее изображение">
            <ChevronLeft size={24} />
          </button>
        )}
        {currentIndex < images.length - 1 && (
          <button className={`${styles.navBtn} ${styles.next}`} onClick={onNext} aria-label="Следующее изображение">
            <ChevronRight size={24} />
          </button>
        )}
        <img src={image.src} alt={image.alt} className={styles.image} />
      </div>
    </div>
  )
}
