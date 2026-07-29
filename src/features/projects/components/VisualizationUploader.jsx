import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Plus, X, Trash2, Check, AlertCircle, Loader } from 'lucide-react'
import { useUploadQueue } from '../../../hooks/useUploadQueue'
import styles from './VisualizationUploader.module.css'

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * VisualizationUploader — компонент загрузки визуализаций.
 *
 * Улучшения:
 * 1. Drag & drop зона
 * 2. Прогресс / статус сохранения
 * 3. Drag-сортировка pending файлов
 * 4. Пустое состояние с подсказкой
 */
export function VisualizationUploader({
  authorName = 'Визуализатор',
  onImageUpload,
  existingImages = [],
  isSaving = false,
  saveStatus = null, // null | 'saving' | 'saved' | 'error'
}) {
  const fileInputRef = useRef(null)
  const [pendingFiles, setPendingFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // Drag-sort state
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const { addFiles, processQueue, clearCompleted, getResults } = useUploadQueue({
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMB: 20,
    maxFiles: 50,
    autoCompress: true,
    onUpload: async (file) => {
      const base64 = await blobToDataUrl(file)
      return {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        src: base64,
        base64,
        name: file.name,
        type: file.type,
        file,
        size: file.size,
      }
    },
  })

  const processFiles = useCallback(async (files) => {
    setIsProcessing(true)
    const { added } = await addFiles(files)
    if (added > 0) {
      await processQueue()
      const results = getResults()
      setPendingFiles(prev => {
        const existingIds = new Set(prev.map(f => f.id))
        const newFiles = results.filter(f => !existingIds.has(f.id))
        return [...prev, ...newFiles]
      })
    }
    setIsProcessing(false)
  }, [addFiles, processQueue, getResults])

  // ─── Drag & drop on the drop zone ──────────────────────────────────────────

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    // Only leave if we're leaving the drop zone itself (not a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    const files = e.dataTransfer?.files
    if (files?.length) processFiles(files)
  }, [processFiles])

  // ─── Drag-sort pending files ────────────────────────────────────────────────

  const handleSortDragStart = useCallback((index) => {
    dragItem.current = index
  }, [])

  const handleSortDragEnter = useCallback((index) => {
    dragOverItem.current = index
  }, [])

  const handleSortDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return
    if (dragItem.current === dragOverItem.current) return

    setPendingFiles(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(dragItem.current, 1)
      updated.splice(dragOverItem.current, 0, moved)
      return updated
    })
    dragItem.current = null
    dragOverItem.current = null
  }, [])

  // ─── Remove / clear ─────────────────────────────────────────────────────────

  const handleRemoveFile = useCallback((fileId) => {
    setPendingFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const handleClearAll = useCallback(() => {
    setPendingFiles([])
    clearCompleted()
  }, [clearCompleted])

  // ─── Confirm ────────────────────────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    if (pendingFiles.length === 0) return
    onImageUpload?.(pendingFiles)
    setPendingFiles([])
    clearCompleted()
  }, [pendingFiles, onImageUpload, clearCompleted])

  const hasFiles = pendingFiles.length > 0

  return (
    <div className={styles.uploader}>

      {/* ── Drop zone ─────────────────────────────────────────────────────── */}
      <div
        className={`${styles.dropZone} ${isDraggingOver ? styles.dropZoneActive : ''} ${isProcessing ? styles.dropZoneProcessing : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className={styles.fileInput}
          onChange={(e) => {
            if (e.target.files?.length) {
              processFiles(e.target.files)
              e.target.value = ''
            }
          }}
        />

        {isProcessing ? (
          <>
            <Loader size={32} className={styles.dropIconSpin} />
            <span className={styles.dropTitle}>Обработка файлов...</span>
          </>
        ) : isDraggingOver ? (
          <>
            <Upload size={32} className={styles.dropIconActive} />
            <span className={styles.dropTitle}>Отпустите для загрузки</span>
          </>
        ) : (
          <>
            <Upload size={32} className={styles.dropIcon} />
            <span className={styles.dropTitle}>
              Перетащите изображения сюда
            </span>
            <span className={styles.dropHint}>или нажмите для выбора файлов</span>
            <span className={styles.dropFormats}>JPEG, PNG, WebP · до 20 МБ · до 50 файлов</span>
            <button type="button" className={styles.dropBtn} tabIndex={-1}>
              <Plus size={14} /> Выбрать файлы
            </button>
          </>
        )}
      </div>

      {/* ── Pending files ─────────────────────────────────────────────────── */}
      {hasFiles && (
        <div className={styles.pendingSection}>
          <div className={styles.pendingHeader}>
            <span className={styles.pendingTitle}>
              Выбрано: {pendingFiles.length} {pendingFiles.length === 1 ? 'файл' : 'файлов'}
            </span>
            <span className={styles.pendingHint}>Перетащите для изменения порядка</span>
            <button type="button" className={styles.clearAllBtn} onClick={handleClearAll}>
              <Trash2 size={13} /> Очистить
            </button>
          </div>

          <div className={styles.pendingGrid}>
            {pendingFiles.map((file, index) => (
              <div
                key={file.id}
                className={styles.pendingItem}
                draggable
                onDragStart={() => handleSortDragStart(index)}
                onDragEnter={() => handleSortDragEnter(index)}
                onDragEnd={handleSortDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className={styles.pendingImgWrap}>
                  <img src={file.src} alt={file.name} className={styles.pendingImg} />
                  <span className={styles.pendingOrder}>{index + 1}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveFile(file.id)}
                    title="Удалить"
                  >
                    <X size={12} />
                  </button>
                </div>
                <span className={styles.pendingName}>{file.name}</span>
              </div>
            ))}
          </div>

          <div className={styles.pendingActions}>
            <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>
              <Plus size={15} />
              Добавить {pendingFiles.length} {pendingFiles.length === 1 ? 'изображение' : 'изображений'}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={handleClearAll}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* ── Save status ───────────────────────────────────────────────────── */}
      {saveStatus && (
        <div className={`${styles.saveStatus} ${styles[`saveStatus_${saveStatus}`]}`}>
          {saveStatus === 'saving' && <><Loader size={14} className={styles.spin} /> Сохранение...</>}
          {saveStatus === 'saved' && <><Check size={14} /> Сохранено</>}
          {saveStatus === 'error' && <><AlertCircle size={14} /> Ошибка сохранения</>}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!hasFiles && !isProcessing && existingImages.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>В этой комнате пока нет визуализаций</p>
          <p className={styles.emptyHint}>Загрузите первые рендеры через зону выше</p>
        </div>
      )}
    </div>
  )
}
