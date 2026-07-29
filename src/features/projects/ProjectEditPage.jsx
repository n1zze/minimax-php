import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../store/useProjectStore'
import { dbGetProject, dbGetFile, dbSaveFile, dbDeleteProject } from '../../db'
import { api, withAuthToken } from '../../api'
import { STATUS_LABELS, PROJECT_TYPE, PROJECT_TYPE_LABELS, OBJECT_TYPE, OBJECT_TYPE_LABELS } from './mockProject'
import { UploadArea } from './components/UploadArea'
import { PdfUploadField } from './components/PdfUploadField'
import { SortableImageGrid } from './components/SortableImageGrid'
import { FileSpreadsheet, X, Trash2 } from 'lucide-react'
import { ThumbnailField } from './components/ThumbnailField'
import { TimelineEditor } from './components/TimelineEditor'
import { SpecEditor } from './components/SpecEditor'
import { VisEditor } from './components/VisEditor'
import { DiaryEditor } from './components/DiaryEditor'
import { ClientAccessPanel } from './components/ClientAccessPanel'
import styles from './ProjectEditPage.module.css'

// ─── Helper Functions ─────────────────────────────────────

/**
 * Convert a File/Blob to base64 string
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert base64 string to a blob URL
 */
function base64ToBlobUrl(base64) {
  if (!base64) return null
  const byteString = atob(base64.split(',')[1] || base64)
  const mimeString = base64.split(',')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg'
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([ab], { type: mimeString })
  return URL.createObjectURL(blob)
}

/**
 * Normalize PDF data structure
 */

/**
 * Append auth token (?t=...) to /api/files/* URLs so <img> / <a href>
 * can pass authentication. Idempotent: skips already-tokenized URLs.
 */
function tokenizeUrl(url) {
  if (!url || typeof url !== 'string') return url
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.includes('t=') && url.includes('/api/files/')) return url
  return withAuthToken(url)
}

function applyAuthTokensToProject(p) {
  if (!p?.sections) return p
  for (const [, section] of Object.entries(p.sections)) {
    if (!section) continue
    if (typeof section.pdfUrl === 'string') section.pdfUrl = tokenizeUrl(section.pdfUrl)
    if (Array.isArray(section.images)) {
      for (const img of section.images) {
        if (img?.src) img.src = tokenizeUrl(img.src)
        if (img?.serverUrl) img.serverUrl = tokenizeUrl(img.serverUrl)
      }
    }
    if (Array.isArray(section.items)) {
      for (const item of section.items) {
        if (item?.src) item.src = tokenizeUrl(item.src)
        if (item?.serverUrl) item.serverUrl = tokenizeUrl(item.serverUrl)
      }
    }
    if (Array.isArray(section.tabs)) {
      for (const tab of section.tabs) {
        if (Array.isArray(tab.images)) {
          for (const img of tab.images) {
            if (img?.src) img.src = tokenizeUrl(img.src)
            if (img?.serverUrl) img.serverUrl = tokenizeUrl(img.serverUrl)
          }
        }
      }
    }
  }
  if (typeof p.thumbnailPath === 'string') p.thumbnailPath = tokenizeUrl(p.thumbnailPath)
  return p
}

// ─── Component ────────────────────────────────────────────

export default function ProjectEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { saveProject, setEditMode } = useProjectStore()
  const [local, setLocal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // First try IndexedDB (faster and more reliable without server)
        let p = null
        
        // Try store first
        const storeProject = useProjectStore.getState().project
        console.log('Store project:', storeProject?.id, storeProject ? 'exists' : 'null')
        if (storeProject?.id === id) {
          p = storeProject
        }
        
        // Then try IndexedDB directly
        if (!p) {
          p = await dbGetProject(id)
          console.log('IndexedDB project:', p?.id, p ? 'found' : 'null')
        }
        
        // Try API last (may fail if server not running)
        if (!p) {
          try {
            p = await api.getProject(id)
            console.log('API project:', p?.id, p ? 'found' : 'null')
          } catch (apiErr) {
            console.warn('API failed:', apiErr.message)
          }
        }
        
        if (cancelled) return
        if (!p) {
          console.warn('Project not found:', id)
          return
        }
        
        console.log('Loaded project:', p.id, 'has data:', !!p.data, 'has sections:', !!p.sections)

        // Make a deep copy to avoid mutating store state
        p = JSON.parse(JSON.stringify(p))
        
        console.log('[load] After stringify, p.sections:', p.sections ? Object.keys(p.sections) : 'none')
        console.log('[load] p.data.floorPlan:', p.data?.floorPlan)
        
        // Get existing sections or build from flat structure
        const existingSections = p.sections || {}
        // Data might be in p.data (API format) or p.sections (normalized format)
        const dataSource = p.data || {}
        
        // Helper to normalize timeline steps
        const normalizeTimelineSteps = (steps) => {
          if (!steps || !Array.isArray(steps)) return []
          return steps.map((s, idx) => ({
            id: s.id || `step-${idx}`,
            title: s.title || s.step || '',
            date: s.date || '',
            completed: s.completed || s.status === 'done' || s.status === 'completed',
          }))
        }
        
        const sectionsFromFlat = {
          brief: existingSections.brief
            || (dataSource.briefPdf ? { title: dataSource.briefPdf.title || '', pdfUrl: dataSource.briefPdf.url || '' } : null)
            || { title: '', pdfUrl: '' },
          timeline: existingSections.timeline || { steps: normalizeTimelineSteps(p.timeline || dataSource.timeline) },
          contract: existingSections.contract
            || (dataSource.contractPdf ? { title: dataSource.contractPdf.title || '', pdfUrl: dataSource.contractPdf.url || '' } : null)
            || { title: '', pdfUrl: '' },
          floorPlan: existingSections.floorPlan || { images: [], videoUrl: '', videoTitle: '' },
          floorPlanApproval: existingSections.floorPlanApproval
            || (dataSource.floorPlanApprovalPdf ? { title: dataSource.floorPlanApprovalPdf.title || '', pdfUrl: dataSource.floorPlanApprovalPdf.url || '' } : null)
            || { title: '', pdfUrl: '' },
          collages: existingSections.collages || { items: [] },
          collagesApproval: existingSections.collagesApproval
            || (dataSource.collagesApprovalPdf ? { title: dataSource.collagesApprovalPdf.title || '', pdfUrl: dataSource.collagesApprovalPdf.url || '' } : null)
            || { title: '', pdfUrl: '' },
          visualizations: existingSections.visualizations || { tabs: [] },
          drawings: existingSections.drawings || { items: [] },
          drawingsApproval: existingSections.drawingsApproval
            || (dataSource.drawingsApprovalPdf ? { title: dataSource.drawingsApprovalPdf.title || '', pdfUrl: dataSource.drawingsApprovalPdf.url || '' } : null)
            || { title: '', pdfUrl: '' },
          specification: existingSections.specification || { items: dataSource.specification?.items || [] },
          specificationApproval: existingSections.specificationApproval
            || (dataSource.specificationApprovalPdf ? { title: dataSource.specificationApprovalPdf.title || '', pdfUrl: dataSource.specificationApprovalPdf.url || '' } : null)
            || { title: '', pdfUrl: '' },
          finalProject: existingSections.finalProject || { items: [], pdfUrl: dataSource.finalProject?.pdfUrl || '', title: dataSource.finalProject?.title || '' },
          authorSupervision: existingSections.authorSupervision || {
            diary: dataSource.authorSupervision?.diary || [],
            pdfUrl: dataSource.authorSupervision?.reportPdf?.url || '',
            title: dataSource.authorSupervision?.reportPdf?.title || '',
          },
        }
        
        // Set sections on project
        p.sections = sectionsFromFlat

        // Apply auth tokens to all server URLs (so <img> and <a href> work)
        p = applyAuthTokensToProject(p)
        
        // Regenerate blob URLs for images in sections
        const sections = p.sections || {}
        for (const [, section] of Object.entries(sections)) {
          // Handle floorPlan.images
          if (section.images && Array.isArray(section.images)) {
            for (const img of section.images) {
              if (img.src && (img.src.startsWith('blob:') || img.src.startsWith('data:'))) {
                try {
                  const file = await dbGetFile(img.id)
                  if (file?.blob) {
                    img.src = URL.createObjectURL(file.blob)
                  } else if (file?.data) {
                    // Regenerate from base64 data stored in DB
                    img.src = base64ToBlobUrl(file.data)
                  } else if (img.base64) {
                    // Regenerate from base64 stored directly in image object
                    img.src = base64ToBlobUrl(img.base64)
                  } else if (img.id) {
                    console.warn('No data found for image:', img.id)
                  }
                } catch (e) {
                  console.warn('Failed to regenerate blob URL:', e)
                }
              }
            }
          }
          // Handle items arrays (collages, drawings, finalProject, etc.)
          if (section.items && Array.isArray(section.items)) {
            for (const item of section.items) {
              if (item.src && (item.src.startsWith('blob:') || item.src.startsWith('data:'))) {
                try {
                  const file = await dbGetFile(item.id)
                  if (file?.blob) {
                    item.src = URL.createObjectURL(file.blob)
                  } else if (file?.data) {
                    item.src = base64ToBlobUrl(file.data)
                  } else if (item.base64) {
                    item.src = base64ToBlobUrl(item.base64)
                  } else {
                    console.warn('No data found for item:', item.id)
                  }
                } catch (e) {
                  console.warn('Failed to regenerate blob URL:', e)
                }
              }
            }
          }
          // Handle visualizations.tabs
          if (section.tabs && Array.isArray(section.tabs)) {
            for (const tab of section.tabs) {
              if (tab.images && Array.isArray(tab.images)) {
                for (const img of tab.images) {
                  if (img.src && (img.src.startsWith('blob:') || img.src.startsWith('data:'))) {
                    try {
                      const file = await dbGetFile(img.id)
                      if (file?.blob) {
                        img.src = URL.createObjectURL(file.blob)
                      } else if (file?.data) {
                        img.src = base64ToBlobUrl(file.data)
                      } else if (img.base64) {
                        img.src = base64ToBlobUrl(img.base64)
                      } else {
                        console.warn('No data found for tab image:', img.id)
                      }
                    } catch (e) {
                      console.warn('Failed to regenerate blob URL:', e)
                    }
                  }
                }
              }
            }
          }
        }
        
        if (!cancelled) {
          setLocal(p)
        }
      } catch (err) {
        console.error('Error loading project:', err)
      }
    }
    
    load()
    return () => { cancelled = true }
  }, [id])

  if (!local) return null

  const s = local.sections

  function setField(key, value) {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  function setSectionField(sectionKey, field, value) {
    setLocal((prev) => ({
      ...prev,
      sections: { ...prev.sections, [sectionKey]: { ...prev.sections[sectionKey], [field]: value } },
    }))
  }

  function removeImage(sectionKey, field, imageId) {
    setLocal((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          [field]: prev.sections[sectionKey][field].filter((img) => img.id !== imageId),
        },
      },
    }))
  }

  function reorderImages(sectionKey, field, newItems) {
    setLocal((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          [field]: newItems,
        },
      },
    }))
  }

  async function handleImageUpload(sectionKey, field, files, rawFiles) {
    console.log(`[handleImageUpload] section=${sectionKey}, field=${field}, files=${files?.length}, rawFiles=${rawFiles?.length}`)
    
    // Debug: log what we're getting
    const debugInfo = {
      sectionKey,
      field,
      filesCount: files?.length,
      rawFilesCount: rawFiles?.length,
      filesTypes: files?.map(f => ({ id: f?.id, name: f?.name, hasBase64: !!f?.base64, srcType: f?.src?.substring(0, 20) })),
      rawFilesTypes: rawFiles?.map(f => ({ name: f?.name, type: f?.type, size: f?.size, isFile: f instanceof File }))
    }
    console.log('[handleImageUpload] DEBUG:', JSON.stringify(debugInfo, null, 2))
    
    // If files array is empty but rawFiles has items, use rawFiles as the source
    const sourceFiles = (files && files.length > 0) ? files : rawFiles
    const useRawFilesDirectly = !files || files.length === 0
    
    console.log(`[handleImageUpload] sourceFiles=${sourceFiles?.length}, useRawFilesDirectly=${useRawFilesDirectly}`)
    
    const uploaded = []
    
    for (let i = 0; i < sourceFiles.length; i++) {
      const file = sourceFiles[i]
      const rawFile = useRawFilesDirectly ? file : rawFiles?.[i]
      console.log(`[handleImageUpload] Processing file index ${i}:`, rawFile?.name || file?.id || file?.name)
      
      // Determine file ID - use existing ID if available, otherwise generate
      const fileId = file?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      
      // Determine if we have a File object or a result object
      const isFileObject = rawFile instanceof File || (rawFile?.type && rawFile?.size)
      const actualFile = isFileObject ? rawFile : file
      
      // Get base64 - either from result object or by converting File
      let base64 = null
      if (file?.base64) {
        base64 = file.base64
      } else if (file?.src?.startsWith('data:')) {
        base64 = file.src
      } else if (isFileObject && actualFile) {
        base64 = await blobToBase64(actualFile)
      }
      console.log(`[handleImageUpload] base64 length: ${base64?.length}`)

      let serverUrl = null

      // Try to upload to server first
      try {
        console.log(`[handleImageUpload] Uploading to API, actualFile type: ${actualFile?.constructor?.name}`)
        const result = await api.uploadFiles(id, sectionKey, [actualFile])
        console.log(`[handleImageUpload] API result:`, JSON.stringify(result))
        if (result) {
          serverUrl = result.url || (result[0]?.url)
          if (serverUrl) {
            console.log(`[handleImageUpload] API success, serverUrl=${serverUrl}`)
          } else {
            console.log(`[handleImageUpload] API returned but no URL, using blob`)
          }
        } else {
          console.log(`[handleImageUpload] API returned null, using blob`)
        }
      } catch (apiErr) {
        console.warn('[handleImageUpload] API upload failed:', apiErr.message)
      }

      const src = serverUrl ? tokenizeUrl(serverUrl) : URL.createObjectURL(actualFile)

      // Always save base64 to IndexedDB for persistence (even if server upload succeeded)
      console.log(`[handleImageUpload] Saving base64 to IndexedDB: ${fileId}, base64 length: ${base64?.length}`)
      try {
        await dbSaveFile({ id: fileId, projectId: id, section: sectionKey, name: actualFile?.name || file?.name || 'unknown', data: base64 })
        console.log(`[handleImageUpload] Saved base64 to IndexedDB: ${fileId}`)
      } catch (dbErr) {
        console.warn('[handleImageUpload] IndexedDB save failed:', dbErr)
      }

      uploaded.push({
        id: fileId,
        src,
        alt: (file.name || 'image').replace(/\.[^.]+$/, ''),
        name: file.name,
        base64,
        serverUrl: serverUrl ? tokenizeUrl(serverUrl) : null,
        uploadedBy: 'designer',
      })
    }
    setLocal((prev) => {
      const newState = {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: {
            ...prev.sections[sectionKey],
            [field]: [...(prev.sections[sectionKey]?.[field] ?? []), ...uploaded],
          },
        },
      }
      console.log(`[handleImageUpload] setLocal called, ${sectionKey}.${field} now has ${newState.sections[sectionKey]?.[field]?.length} items`)
      console.log(`[handleImageUpload] uploaded items:`, JSON.stringify(uploaded.map(u => ({ id: u.id, src: u.src?.substring(0, 30), serverUrl: u.serverUrl }))))
      return newState
    })
    console.log(`[handleImageUpload] Done, total uploaded: ${uploaded.length}`)
  }

  async function handlePdfUpload(sectionKey, file) {
    if (!file) return

    // Try server upload first
    try {
      const uploaded = await api.uploadFiles(id, sectionKey, [file])
      const serverUrl = Array.isArray(uploaded) ? uploaded[0]?.url : uploaded?.url
      if (serverUrl) {
        setSectionField(sectionKey, 'pdfUrl', tokenizeUrl(serverUrl))
        return
      }
    } catch {
      // Server upload failed — fall through to local storage
    }

    // Fallback: save as base64 in IndexedDB and use data: URL
    try {
      const base64 = await blobToBase64(file)
      const localFileId = `${sectionKey}-${Date.now()}`
      await dbSaveFile({ id: localFileId, projectId: id, section: sectionKey, name: file.name, data: base64 })
      // Store the base64 directly as pdfUrl so it survives page reload
      setSectionField(sectionKey, 'pdfUrl', base64)
      setSectionField(sectionKey, 'pdfName', file.name)
    } catch {
      // Last resort: blob URL (won't survive reload, but at least shows in current session)
      const blobUrl = URL.createObjectURL(file)
      setSectionField(sectionKey, 'pdfUrl', blobUrl)
    }
  }

  async function handleThumbnailUpload(file) {
    let thumbUrl = URL.createObjectURL(file)
    try {
      const uploaded = await api.uploadFiles(id, '_thumbnail', [file])
      const serverUrl = Array.isArray(uploaded) ? uploaded[0]?.url : uploaded.url
      if (serverUrl) {
        URL.revokeObjectURL(thumbUrl) // Clean up blob URL
        thumbUrl = tokenizeUrl(serverUrl)
      }
    } catch {
      // Keep local blob URL as fallback
      const fileId = `thumb-${Date.now()}`
      await dbSaveFile({ id: fileId, projectId: id, section: '_thumbnail', name: file.name, blob: file })
    }
    setField('thumbnailPath', thumbUrl)
  }

  function handleVisTabsChange(newTabs) {
    setSectionField('visualizations', 'tabs', newTabs)
  }

  async function handleVisImageUpload(tabId, files, rawFiles) {
    console.log(`[handleVisImageUpload] tabId=${tabId}, files=${files.length}, rawFiles=${rawFiles?.length}`)
    const uploaded = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const rawFile = rawFiles?.[i]
      const fileId = file?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const actualFile = (rawFile instanceof File || (rawFile?.type && rawFile?.size)) ? rawFile : file
      
      // Get base64
      let base64 = null
      if (file?.base64) {
        base64 = file.base64
      } else if (file?.src?.startsWith('data:')) {
        base64 = file.src
      } else if (actualFile) {
        base64 = await blobToBase64(actualFile)
      }
      console.log(`[handleVisImageUpload] base64 length: ${base64?.length}`)

      let serverUrl = null

      // Try to upload to server first
      try {
        console.log(`[handleVisImageUpload] Uploading to API, actualFile type: ${actualFile?.constructor?.name}`)
        const result = await api.uploadFiles(id, 'visualizations', [actualFile])
        if (result) {
          serverUrl = result.url || (result[0]?.url)
          if (serverUrl) {
            console.log(`[handleVisImageUpload] API success, serverUrl=${serverUrl}`)
          }
        }
      } catch (apiErr) {
        console.warn('API upload failed, using local storage:', apiErr.message)
      }

      const src = serverUrl ? tokenizeUrl(serverUrl) : URL.createObjectURL(actualFile)

      // Always save base64 to IndexedDB for persistence
      if (base64) {
        try {
          await dbSaveFile({ id: fileId, projectId: id, section: 'visualizations', name: actualFile?.name || file?.name || 'unknown', data: base64 })
        } catch (dbErr) {
          console.warn('IndexedDB save failed:', dbErr)
        }
      }

      uploaded.push({
        id: fileId,
        src,
        alt: (actualFile?.name || file?.name || '').replace(/\.[^.]+$/, ''),
        name: actualFile?.name || file?.name || '',
        base64,
        serverUrl: serverUrl ? tokenizeUrl(serverUrl) : null,
        uploadedBy: 'designer',
      })
    }
    setLocal((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        visualizations: {
          ...prev.sections.visualizations,
          tabs: prev.sections.visualizations.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, images: [...tab.images, ...uploaded] } : tab
          ),
        },
      },
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      console.log('[handleSave] Starting save, local.sections keys:', Object.keys(local.sections))
      console.log('[handleSave] floorPlan.images:', local.sections.floorPlan?.images)
      
      // Log what we're saving for each section with images
      for (const [key, section] of Object.entries(local.sections)) {
        if (section?.images?.length) {
          console.log(`[handleSave] ${key}.images:`, section.images.map(img => ({ id: img.id, hasSrc: !!img.src, srcType: img.src?.startsWith('blob:') ? 'blob' : img.src?.startsWith('data:') ? 'base64' : 'server', serverUrl: img.serverUrl })))
        }
        if (section?.items?.length) {
          console.log(`[handleSave] ${key}.items:`, section.items.map(item => ({ id: item.id, hasSrc: !!item.src, srcType: item.src?.startsWith('blob:') ? 'blob' : item.src?.startsWith('data:') ? 'base64' : 'server', serverUrl: item.serverUrl })))
        }
      }
      
      await saveProject(local)
      console.log('[handleSave] Save completed successfully')
      
      // Force reload from API before navigating
      const { loadProject } = useProjectStore.getState()
      try {
        await loadProject(id)
      } catch (e) {
        console.warn('Reload after save failed:', e)
      }
      
      setEditMode(false)
      navigate(`/projects/${id}`)
    } catch (err) {
      console.error('[handleSave] Failed to save project:', err)
      alert('Ошибка сохранения: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      // Delete from server
      try {
        await api.deleteProject(id)
      } catch {
        // Server may be unavailable — continue with local cleanup
      }
      // Delete from IndexedDB
      try {
        await dbDeleteProject(id)
      } catch {
        // Non-critical
      }
      // Remove from store list
      const { setProjectsList } = useProjectStore.getState()
      setProjectsList((prev) => Array.isArray(prev) ? prev.filter(p => p.id !== id) : [])
      setEditMode(false)
      navigate('/')
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  function handleCancel() {
    setEditMode(false)
    navigate(`/projects/${id}`)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.container}>
          <h1 className={styles.title}>Редактирование: {local.title}</h1>
          <div className={styles.actions}>
            <button
              className={styles.deleteBtn}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              title="Удалить проект"
            >
              <Trash2 size={15} />
              Удалить
            </button>
            <button className={styles.cancelBtn} onClick={handleCancel}>Отмена</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <Trash2 size={28} />
            </div>
            <h2 className={styles.modalTitle}>Удалить проект?</h2>
            <p className={styles.modalText}>
              Проект <strong>«{local.title}»</strong> и все его файлы будут удалены безвозвратно.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalDeleteBtn}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Удаление...' : 'Да, удалить'}
              </button>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>00</span>
            <h2 className={styles.sectionTitle}>Информация о проекте</h2>
          </div>

          <div className={styles.thumbnailRow}>
            <ThumbnailField
              src={local.thumbnailPath || local.preview}
              alt={local.title}
              onUpload={handleThumbnailUpload}
            />
            <div className={styles.thumbnailInfo}>
              <strong>Обложка проекта</strong>
              <span>Рекомендуется 16:10, min 800×500px</span>
              <span className={styles.thumbnailHint}>Нажмите для загрузки или замены</span>
            </div>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              Название
              <input className={styles.input} value={local.title} onChange={(e) => setField('title', e.target.value)} />
            </label>
            <label className={styles.field}>
              Клиент
              <input className={styles.input} value={local.clientName ?? ''} onChange={(e) => setField('clientName', e.target.value)} />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              Город
              <input className={styles.input} value={local.city ?? ''} onChange={(e) => setField('city', e.target.value)} placeholder="Город" />
            </label>
            <label className={styles.field}>
              Площадь (кв.м.)
              <input className={styles.input} type="number" step="0.1" value={local.area ?? ''} onChange={(e) => setField('area', e.target.value ? parseFloat(e.target.value) : null)} placeholder="0.0" />
            </label>
            <label className={styles.field}>
              Год реализации
              <input className={styles.input} type="number" value={local.year ?? ''} onChange={(e) => setField('year', e.target.value ? parseInt(e.target.value) : null)} placeholder="2024" />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              Статус
              <select className={styles.select} value={local.status} onChange={(e) => setField('status', e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              Тип проекта
              <select className={styles.select} value={local.projectType ?? PROJECT_TYPE.FULL_WITH_SUPERVISION} onChange={(e) => setField('projectType', e.target.value)}>
                {Object.entries(PROJECT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              Вид объекта
              <select className={styles.select} value={local.objectType ?? ''} onChange={(e) => setField('objectType', e.target.value || null)}>
                <option value="">— не указан —</option>
                {Object.entries(OBJECT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              Цена, руб/м²
              <input
                className={styles.input}
                type="number"
                min="0"
                step="100"
                value={local.pricePerSqm ?? ''}
                onChange={(e) => setField('pricePerSqm', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Например: 5000"
              />
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>00.1</span>
            <h2 className={styles.sectionTitle}>Бриф</h2>
          </div>
          <PdfUploadField
            title={s.brief.title}
            pdfUrl={s.brief.pdfUrl}
            onTitleChange={(value) => setSectionField('brief', 'title', value)}
            onUpload={(file) => handlePdfUpload('brief', file)}
            onClear={() => setSectionField('brief', 'pdfUrl', '')}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>01</span>
            <h2 className={styles.sectionTitle}>Ход работ</h2>
          </div>
          <TimelineEditor
            steps={s.timeline.steps}
            onChange={(steps) => setSectionField('timeline', 'steps', steps)}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>02</span>
            <h2 className={styles.sectionTitle}>Договор</h2>
          </div>
          <PdfUploadField
            title={s.contract.title}
            pdfUrl={s.contract.pdfUrl}
            onTitleChange={(value) => setSectionField('contract', 'title', value)}
            onUpload={(files) => handlePdfUpload('contract', files)}
            onClear={() => setSectionField('contract', 'pdfUrl', '')}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>03</span>
            <h2 className={styles.sectionTitle}>Планировка</h2>
          </div>
          <label className={styles.field} style={{ marginBottom: 'var(--space-md)' }}>
            Видео URL
            <input className={styles.input} value={s.floorPlan.videoUrl ?? ''} onChange={(e) => setSectionField('floorPlan', 'videoUrl', e.target.value)} />
          </label>
          <label className={styles.field} style={{ marginBottom: 'var(--space-md)' }}>
            Название видео
            <input className={styles.input} value={s.floorPlan.videoTitle ?? ''} onChange={(e) => setSectionField('floorPlan', 'videoTitle', e.target.value)} placeholder="Видеозапись 3D-обзора" />
          </label>
          {s.floorPlan.images?.length > 0 && (
            <SortableImageGrid
              items={s.floorPlan.images}
              onReorder={(items) => reorderImages('floorPlan', 'images', items)}
              onRemove={(imageId) => removeImage('floorPlan', 'images', imageId)}
            />
          )}
          <UploadArea label="Загрузить планировки" onUpload={(files, rawFiles) => handleImageUpload('floorPlan', 'images', files, rawFiles)} />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>04</span>
            <h2 className={styles.sectionTitle}>Утверждение планировки</h2>
          </div>
          <PdfUploadField
            title={s.floorPlanApproval.title}
            pdfUrl={s.floorPlanApproval.pdfUrl}
            onTitleChange={(value) => setSectionField('floorPlanApproval', 'title', value)}
            onUpload={(files) => handlePdfUpload('floorPlanApproval', files)}
            onClear={() => setSectionField('floorPlanApproval', 'pdfUrl', '')}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>05</span>
            <h2 className={styles.sectionTitle}>Визуализации</h2>
          </div>
          <VisEditor
            tabs={s.visualizations.tabs}
            onTabsChange={handleVisTabsChange}
            onImageUpload={handleVisImageUpload}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>08</span>
            <h2 className={styles.sectionTitle}>Чертежи</h2>
          </div>
          {s.drawings.items?.length > 0 && (
            <SortableImageGrid
              items={s.drawings.items}
              onReorder={(items) => reorderImages('drawings', 'items', items)}
              onRemove={(imageId) => removeImage('drawings', 'items', imageId)}
            />
          )}
          <UploadArea label="Загрузить чертежи" onUpload={(files, rawFiles) => handleImageUpload('drawings', 'items', files, rawFiles)} />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>09</span>
            <h2 className={styles.sectionTitle}>Утверждение чертежей</h2>
          </div>
          <PdfUploadField
            title={s.drawingsApproval.title}
            pdfUrl={s.drawingsApproval.pdfUrl}
            onTitleChange={(value) => setSectionField('drawingsApproval', 'title', value)}
            onUpload={(files) => handlePdfUpload('drawingsApproval', files)}
            onClear={() => setSectionField('drawingsApproval', 'pdfUrl', '')}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>10</span>
            <h2 className={styles.sectionTitle}>Спецификация</h2>
          </div>
          <SpecEditor
            items={s.specification.items}
            onChange={(items) => setSectionField('specification', 'items', items)}
          />

          {/* Excel upload */}
          <div className={styles.excelUpload}>
            <label className={styles.fieldLabel}>
              <FileSpreadsheet size={16} />
              Excel файл спецификации
            </label>
            {s.specification.excelUrl ? (
              <div className={styles.excelPreview}>
                <FileSpreadsheet size={20} className={styles.excelIcon} />
                <span className={styles.excelName}>{s.specification.excelUrl.split('/').pop()}</span>
                <button
                  type="button"
                  className={styles.excelClearBtn}
                  onClick={() => setSectionField('specification', 'excelUrl', '')}
                  title="Удалить"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <UploadArea
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                multiple={false}
                label="Загрузить Excel"
                maxSizeMB={20}
                onUpload={(results) => {
                  if (results && results[0]) {
                    setSectionField('specification', 'excelUrl', results[0].src)
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>11</span>
            <h2 className={styles.sectionTitle}>Утверждение спецификации</h2>
          </div>
          <PdfUploadField
            title={s.specificationApproval.title}
            pdfUrl={s.specificationApproval.pdfUrl}
            onTitleChange={(value) => setSectionField('specificationApproval', 'title', value)}
            onUpload={(files) => handlePdfUpload('specificationApproval', files)}
            onClear={() => setSectionField('specificationApproval', 'pdfUrl', '')}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>12</span>
            <h2 className={styles.sectionTitle}>Итоговый проект</h2>
          </div>
          {s.finalProject.items?.length > 0 && (
            <SortableImageGrid
              items={s.finalProject.items}
              onReorder={(items) => reorderImages('finalProject', 'items', items)}
              onRemove={(imageId) => removeImage('finalProject', 'items', imageId)}
            />
          )}
          <UploadArea label="Загрузить финальные рендеры" onUpload={(files, rawFiles) => handleImageUpload('finalProject', 'items', files, rawFiles)} />
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <PdfUploadField
              title={s.finalProject.title || 'Альбом в PDF'}
              pdfUrl={s.finalProject.pdfUrl ?? ''}
              onTitleChange={(value) => setSectionField('finalProject', 'title', value)}
              onUpload={(files) => handlePdfUpload('finalProject', files)}
              onClear={() => setSectionField('finalProject', 'pdfUrl', '')}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>13</span>
            <h2 className={styles.sectionTitle}>Авторский надзор</h2>
          </div>
          <DiaryEditor
            entries={s.authorSupervision.diary}
            onChange={(diary) => setSectionField('authorSupervision', 'diary', diary)}
          />
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <PdfUploadField
              title={s.authorSupervision.title}
              pdfUrl={s.authorSupervision.pdfUrl ?? ''}
              onTitleChange={(value) => setSectionField('authorSupervision', 'title', value)}
              onUpload={(files) => handlePdfUpload('authorSupervision', files)}
              onClear={() => setSectionField('authorSupervision', 'pdfUrl', '')}
            />
          </div>
        </div>

        <div className={styles.section}>
          <ClientAccessPanel projectId={id} />
        </div>
      </div>
    </div>
  )
}
