import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { UploadQueue } from '../../../components/ui/UploadQueue'
import { useUploadQueue } from '../../../hooks/useUploadQueue'
import styles from './UploadArea.module.css'

/**
 * UploadArea with queue, validation, compression, and progress display.
 * 
 * Extends the basic upload with:
 * - File validation (type, size)
 * - Auto-compression for images
 * - Progress tracking
 * - Error messages
 * - Preview thumbnails
 */
export function UploadArea({
  onUpload,
  accept = 'image/*,application/pdf',
  multiple = true,
  label = 'Загрузить файлы',
  maxSizeMB = 10,
  maxFiles = 20,
  autoCompress = true,
}) {
  const inputRef = useRef(null)

  const {
    queue,
    errors,
    addFiles,
    processQueue,
    removeItem,
    clearErrors,
    clearCompleted,
    getResults,
    getRawFiles,
  } = useUploadQueue({
    accept: accept.split(',').map(s => s.trim()),
    maxSizeMB,
    maxFiles,
    autoCompress,
    onUpload: null, // Let processQueue just set status to done with the raw file
  })

  async function handleChange(e) {
    const files = e.target.files
    console.log('[UploadArea] handleChange: files count =', files?.length)
    if (files?.length) {
      const { added, errors: validationErrors } = await addFiles(files)
      console.log('[UploadArea] addFiles:', added, 'added,', validationErrors?.length, 'errors')
      if (added > 0) {
        // CRITICAL: Wait for React to flush the setQueue state update from addFiles
        // We must ensure queue has items before calling processQueue
        await new Promise(resolve => setTimeout(resolve, 0))
        console.log('[UploadArea] after tick 1: queue=', queue?.map(i => ({ id: i.id, status: i.status })))
        
        // Process queue and wait for completion before getting results
        await processQueue()
        console.log('[UploadArea] after processQueue: queue=', queue?.map(i => ({ id: i.id, status: i.status })))
        
        // Give React multiple ticks to flush state updates from processQueue
        // Each tick allows React to flush pending state updates
        await new Promise(resolve => setTimeout(resolve, 0))
        await new Promise(resolve => setTimeout(resolve, 0))
        await new Promise(resolve => setTimeout(resolve, 0))
        await new Promise(resolve => setTimeout(resolve, 100)) // Extra delay for safety
        
        console.log('[UploadArea] after all delays: queue=', queue?.map(i => ({ id: i.id, status: i.status })))
        
        // Get the results after processing - these are the upload results with URLs
        const results = getResults()
        const rawFiles = getRawFiles()
        console.log('[UploadArea] results:', results?.length, 'rawFiles:', rawFiles?.length)
        
        // Pass both to onUpload - handleImageUpload will use rawFiles for actual upload
        if (onUpload && (rawFiles.length > 0 || results.length > 0)) {
          console.log('[UploadArea] calling onUpload with results:', results?.length, 'rawFiles:', rawFiles?.length)
          onUpload(results, rawFiles)
        } else {
          console.log('[UploadArea] NOT calling onUpload: onUpload=', !!onUpload, 'rawFiles=', rawFiles?.length, 'results=', results?.length)
        }
        
        // Clear completed after we have the data
        clearCompleted()
      }
      e.target.value = ''
    }
  }

  function handleClick() {
    inputRef.current?.click()
  }

  return (
    <div className={styles.wrapper}>
      {/* Progress/error display */}
      <UploadQueue
        queue={queue}
        errors={errors}
        onRemove={removeItem}
        onClearErrors={clearErrors}
        onClearCompleted={clearCompleted}
      />

      {/* Upload trigger */}
      <div className={styles.area} onClick={handleClick}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className={styles.input}
        />
        <Upload size={24} className={styles.icon} />
        <span className={styles.label}>{label}</span>
        <span className={styles.hint}>
          Нажмите для выбора · JPEG, PNG, PDF до {maxSizeMB} МБ
        </span>
      </div>
    </div>
  )
}
