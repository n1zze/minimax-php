import { useState, useCallback } from 'react'
import { Lightbox } from '../../../components/ui/Lightbox'
import styles from './MediaGallery.module.css'

function ImageWithFallback({ src, alt, onError }) {
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      onError?.()
    }
  }, [hasError, onError])

  if (hasError) {
    return (
      <div className={styles.errorPlaceholder}>
        <span>⚠️ Изображение недоступно</span>
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={styles.image}
      onError={handleError}
    />
  )
}

export function MediaGallery({ images = [], columns = 3 }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const isOpen = lightboxIndex >= 0

  return (
    <>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {images.map((img, index) => (
          <div
            key={img.id}
            className={styles.item}
            onClick={() => setLightboxIndex(index)}
          >
            <ImageWithFallback src={img.src} alt={img.alt} />
          </div>
        ))}
      </div>

      {isOpen && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(images.length - 1, i + 1))}
        />
      )}
    </>
  )
}
