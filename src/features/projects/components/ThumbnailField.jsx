import { useRef } from 'react'
import { Camera } from 'lucide-react'
import styles from './ThumbnailField.module.css'

/**
 * Clickable thumbnail image with upload overlay.
 * Saves file to IndexedDB, shows preview immediately.
 */
export function ThumbnailField({ src, alt, onUpload }) {
  const inputRef = useRef(null)

  function handleClick() {
    inputRef.current?.click()
  }

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
      e.target.value = ''
    }
  }

  return (
    <div className={styles.thumbnailWrap} onClick={handleClick}>
      {src && <img src={src} alt={alt} />}
      <div className={styles.overlay}>
        <Camera size={24} />
        <span>{src ? 'Заменить обложку' : 'Загрузить обложку'}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.input}
        onChange={handleChange}
      />
    </div>
  )
}
