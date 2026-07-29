import { useState, useCallback, useRef } from 'react'

/**
 * VALIDATION RULES
 */
const DEFAULT_MAX_SIZE_MB = 10
const DEFAULT_MAX_FILES = 20

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Validate a single file against rules.
 * Returns { valid: boolean, error: string | null }
 */
function validateFile(file, options = {}) {
  const {
    accept = [],
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
  } = options

  const acceptAll = accept.length === 0

  // Expand globs like 'image/*' to actual types
  function matchesAccept(fileType, acceptList) {
    for (const item of acceptList) {
      if (item === fileType) return true
      if (item === 'image/*' && fileType.startsWith('image/')) return true
      if (item === 'application/pdf' && fileType === 'application/pdf') return true
    }
    return false
  }

  // Check type
  if (!acceptAll && !matchesAccept(file.type, accept)) {
    const typeLabel = file.type || 'unknown'
    return { valid: false, error: `Тип файла "${typeLabel}" не поддерживается` }
  }

  // Check size
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return { valid: false, error: `Файл "${file.name}" слишком большой (${formatBytes(file.size)} > ${formatBytes(maxBytes)})` }
  }

  return { valid: true, error: null }
}

/**
 * Compress an image file using canvas API.
 * Returns a Promise<File> with compressed image.
 */
async function compressImage(file, options = {}) {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    type = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Scale down if needed
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'))
            return
          }
          // Use original filename, change type
          const compressedFile = new File([blob], file.name, { type })
          resolve(compressedFile)
        },
        type,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }

    img.src = url
  })
}

/**
 * Create a preview URL for an image file
 */
function createPreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * useUploadQueue — унифицированный хук для загрузки файлов.
 * 
 * Features:
 * - Очередь загрузок
 * - Валидация по типу и размеру
 * - Автосжатие изображений
 * - Превью для изображений
 * - Понятные ошибки
 * 
 * @param {Object} options
 * @param {string[]} options.accept - MIME types (e.g. ['image/*', 'application/pdf'])
 * @param {number} options.maxSizeMB - максимальный размер файла в MB
 * @param {number} options.maxFiles - максимальное число файлов
 * @param {boolean} options.autoCompress - автоматически сжимать изображения
 * @param {Function} options.onUpload - callback(file) => Promise<{ id, src, ... }>
 */
export function useUploadQueue(options = {}) {
  const {
    accept = [],
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    maxFiles = DEFAULT_MAX_FILES,
    autoCompress = true,
    onUpload,
  } = options

  const [queue, setQueue] = useState([])
  const [errors, setErrors] = useState([])
  const queueRef = useRef([])
  const processingRef = useRef(false)

  // Keep queueRef in sync with state
  queueRef.current = queue

  /**
   * Add files to queue (with validation)
   */
  const addFiles = useCallback(async (files) => {
    const fileArray = Array.from(files)
    const newErrors = []
    const validFiles = []

    // Check max count
    const totalAfterAdd = queueRef.current.length + fileArray.length
    console.log('[useUploadQueue] addFiles: totalAfterAdd=', totalAfterAdd, 'maxFiles=', maxFiles)
    if (totalAfterAdd > maxFiles) {
      newErrors.push(`Максимум ${maxFiles} файлов. Выбрано: ${fileArray.length}, в очереди: ${queueRef.current.length}`)
      setErrors(newErrors)
      return { added: 0, errors: newErrors }
    }

    // Validate each file
    for (const file of fileArray) {
      const validation = validateFile(file, { accept, maxSizeMB })
      if (!validation.valid) {
        newErrors.push(validation.error)
        continue
      }
      validFiles.push(file)
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
    } else {
      setErrors([])
    }

    if (validFiles.length === 0) {
      return { added: 0, errors: newErrors }
    }

    // Create queue items with preview
    const items = await Promise.all(
      validFiles.map(async (file) => {
        const isImage = file.type.startsWith('image/')
        let preview = null

        if (isImage) {
          preview = await createPreview(file)
        }

        return {
          id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
          status: 'pending', // pending | compressing | uploading | done | error
          progress: 0,
          error: null,
          result: null,
        }
      })
    )

    setQueue(prev => {
      const newQueue = [...prev, ...items]
      queueRef.current = newQueue  // Update ref immediately
      console.log('[useUploadQueue] addFiles setQueue: newQueue length:', newQueue.length)
      return newQueue
    })
    console.log('[useUploadQueue] addFiles: returning', items.length, 'items')
    return { added: items.length, errors: newErrors }
  }, [accept, maxSizeMB, maxFiles])
  const processQueue = useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true

    console.log('[useUploadQueue] processQueue: starting, queueRef.current:', queueRef.current?.map(i => ({ id: i.id, status: i.status })))

    const processItems = async () => {
      // Process items one at a time, capturing current state at each step
      let iteration = 0
      const maxIterations = queueRef.current.length * 2 + 1 // Safety limit

      while (iteration < maxIterations) {
        iteration++
        const currentQueue = queueRef.current
        const pendingItems = currentQueue.filter(item => item.status === 'pending' || item.status === 'compressing')

        if (pendingItems.length === 0) {
          break // No more pending items
        }

        // Take first pending item
        const item = pendingItems[0]

        // Update status to compressing
        setQueue(prev => {
          const updated = prev.map(i => i.id === item.id ? { ...i, status: 'compressing' } : i)
          queueRef.current = updated
          return updated
        })

        try {
          let fileToUpload = item.file

          // Compress if image and autoCompress enabled
          if (autoCompress && item.type.startsWith('image/')) {
            try {
              fileToUpload = await compressImage(item.file)
            } catch (compressErr) {
              console.warn('Compression failed, using original:', compressErr)
              fileToUpload = item.file
            }
          }

          // Mark as uploading
          setQueue(prev => {
            const updated = prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i)
            queueRef.current = updated
            return updated
          })

          // Upload
          if (onUpload) {
            const result = await onUpload(fileToUpload)
            setQueue(prev => {
              const updated = prev.map(i => i.id === item.id ? {
                ...i,
                status: 'done',
                progress: 100,
                result,
              } : i)
              queueRef.current = updated
              return updated
            })
          } else {
            // No onUpload — just create object URL (mock mode)
            const src = URL.createObjectURL(fileToUpload)
            setQueue(prev => {
              const updated = prev.map(i => i.id === item.id ? {
                ...i,
                status: 'done',
                progress: 100,
                result: { id: item.id, src, name: item.name },
              } : i)
              queueRef.current = updated
              return updated
            })
          }
        } catch (err) {
          setQueue(prev => {
            const updated = prev.map(i => i.id === item.id ? {
              ...i,
              status: 'error',
              error: err.message || 'Ошибка загрузки',
            } : i)
            queueRef.current = updated
            return updated
          })
        }

        // Small delay to allow React to flush state
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      if (iteration >= maxIterations) {
        console.warn('[useUploadQueue] processQueue: reached max iterations, some items may not be processed')
      }
    }

    await processItems()
    processingRef.current = false
  }, [autoCompress, onUpload])

  /**
   * Remove item from queue
   */
  const removeItem = useCallback((id) => {
    setQueue(prev => {
      const item = prev.find(i => i.id === id)
      if (item?.preview) {
        URL.revokeObjectURL(item.preview)
      }
      return prev.filter(i => i.id !== id)
    })
  }, [])

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  /**
   * Clear completed items
   */
  const clearCompleted = useCallback(() => {
    setQueue(prev => {
      prev.forEach(item => {
        if (item.status === 'done' && item.preview) {
          URL.revokeObjectURL(item.preview)
        }
      })
      return prev.filter(i => i.status !== 'done')
    })
  }, [])

  /**
   * Get results (done items)
   */
  const getResults = useCallback(() => {
    const results = queueRef.current.filter(i => i.status === 'done').map(i => i.result).filter(Boolean)
    console.log('[useUploadQueue] getResults: returning', results.length, 'results, queue:', queueRef.current?.map(i => ({ id: i.id, status: i.status })))
    return results
  }, [])

  /**
   * Get raw file objects for upload (not the processed results)
   */
  const getRawFiles = useCallback(() => {
    const rawFiles = queueRef.current.filter(i => i.status === 'done').map(i => i.file).filter(Boolean)
    console.log('[useUploadQueue] getRawFiles: returning', rawFiles.length, 'raw files')
    return rawFiles
  }, [])

  return {
    queue,
    errors,
    addFiles,
    processQueue,
    removeItem,
    clearErrors,
    clearCompleted,
    getResults,
    getRawFiles,
    hasItems: queue.length > 0,
    hasErrors: errors.length > 0,
    hasPending: queue.some(i => i.status === 'pending' || i.status === 'compressing'),
  }
}