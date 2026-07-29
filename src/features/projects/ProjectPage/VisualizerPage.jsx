import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjectStore } from '../../../store/useProjectStore'
import { useAuthStore, ROLE_VISUALIZER } from '../../../store/useAuthStore'
import { api, withAuthToken } from '../../../api'
import { dbSaveFile } from '../../../db'
import { X, ImageIcon } from 'lucide-react'
import { FloorPlanSection } from './sections/FloorPlanSection'
import { VisualizationUploader } from '../components/VisualizationUploader'
import { Lightbox } from '../../../components/ui/Lightbox'
import styles from './VisualizerPage.module.css'

/**
 * VisualizerPage — страница для роли ВИЗУАЛИЗАТОР.
 *
 * Показывает:
 * - Планировку (readonly)
 * - Визуализации: загрузка, удаление, просмотр, сортировка, статус сохранения
 */
export default function VisualizerPage() {
  const { id } = useParams()
  const { project, loadProject, updateSection, saveProject } = useProjectStore()
  const { user } = useAuthStore()

  const [selectedTabId, setSelectedTabId] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const saveStatusTimer = useRef(null)

  const loadIdRef = useRef(null)

  useEffect(() => {
    loadIdRef.current = id
    loadProject(id)
  }, [id, loadProject])

  // Clear save status after 3s
  useEffect(() => {
    if (saveStatus === 'saved' || saveStatus === 'error') {
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current)
      saveStatusTimer.current = setTimeout(() => setSaveStatus(null), 3000)
    }
    return () => {
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current)
    }
  }, [saveStatus])

  const { error } = useProjectStore()

  const existingTabs = project?.sections?.visualizations?.tabs || []

  const activeTab = selectedTabId
    ? existingTabs.find(t => t.id === selectedTabId)
    : existingTabs[0] || null

  // Total images across all rooms — for header counter
  const totalImages = existingTabs.reduce((sum, tab) => sum + (tab.images?.length || 0), 0)

  // ─── Persist helper ──────────────────────────────────────────────────────────

  const persistTabs = useCallback(async (updatedTabs, prevTabs) => {
    setSaveStatus('saving')
    try {
      const updatedProject = {
        ...project,
        sections: {
          ...project.sections,
          visualizations: { tabs: updatedTabs },
        },
      }
      await saveProject(updatedProject)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
      // Revert store on failure
      updateSection('visualizations', { tabs: prevTabs })
    }
  }, [project, saveProject, updateSection])

  // ─── Upload ──────────────────────────────────────────────────────────────────

  const handleImageUpload = useCallback(async (uploadedImages) => {
    if (!project || !activeTab) return

    let serverFiles = []
    try {
      const files = uploadedImages.map((img) => img.file).filter(Boolean)
      if (files.length > 0) {
        const result = await api.uploadFiles(id, 'visualizations', files)
        serverFiles = Array.isArray(result) ? result : [result]
      }
    } catch {
      // Continue with local storage
    }

    const processedImages = uploadedImages.map((img, imgIdx) => {
      const serverUrl = serverFiles[imgIdx]?.url || ''
      const tokenizedUrl = serverUrl ? withAuthToken(serverUrl) : ''
      return {
        id: img.id || `img-${Date.now()}-${imgIdx}`,
        src: tokenizedUrl || img.base64 || img.src,
        alt: img.alt || img.name || '',
        name: img.name || serverFiles[imgIdx]?.fileName || '',
        base64: img.base64 || (img.src?.startsWith('data:') ? img.src : ''),
        serverUrl: serverUrl || '',
        uploadedFileId: serverFiles[imgIdx]?.id,
        uploadedBy: 'visualizer',
      }
    })

    const prevTabs = project.sections?.visualizations?.tabs || []
    const updatedTabs = prevTabs.map(tab => {
      if (tab.id !== activeTab.id) return tab
      return {
        ...tab,
        images: [...(tab.images || []), ...processedImages],
        date: new Date().toISOString(),
        author: user?.name || 'Визуализатор',
        source: 'visualizer',
      }
    })

    updateSection('visualizations', { tabs: updatedTabs })

    // Save to IndexedDB
    try {
      for (const img of processedImages) {
        if (img.base64 || img.src?.startsWith('data:')) {
          await dbSaveFile({
            id: img.id,
            projectId: id,
            section: 'visualizations',
            name: img.name || 'image.jpg',
            data: img.base64 || img.src,
          })
        }
      }
    } catch {
      // Non-critical
    }

    await persistTabs(updatedTabs, prevTabs)
  }, [project, activeTab, id, user, updateSection, persistTabs])

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const handleImageDelete = useCallback(async (imageId) => {
    if (!project || !activeTab) return

    const prevTabs = project.sections?.visualizations?.tabs || []
    const updatedTabs = prevTabs.map(tab => {
      if (tab.id !== activeTab.id) return tab
      return {
        ...tab,
        images: (tab.images || []).filter(img => img.id !== imageId),
      }
    })

    updateSection('visualizations', { tabs: updatedTabs })
    await persistTabs(updatedTabs, prevTabs)
  }, [project, activeTab, updateSection, persistTabs])

  // ─── Guards ──────────────────────────────────────────────────────────────────

  if (!user || user.role !== ROLE_VISUALIZER) {
    return (
      <div className={styles.accessDenied}>
        <h2>Доступ запрещён</h2>
        <p>Эта страница доступна только визуализаторам.</p>
        <Link to="/">На главную</Link>
      </div>
    )
  }

  if (error) return <div className={styles.loader}>Ошибка: {error}</div>
  if (!project) return <div className={styles.loader}>Загрузка...</div>

  const s = project?.sections || {}
  const activeImages = activeTab?.images || []

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.container}>
          <Link to="/" className={styles.backLink}>← Проекты</Link>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.subtitle}>Визуализатор · {user.name}</p>
        </div>
      </div>

      <div className={styles.content}>

        {/* ── Floor plan (readonly) ────────────────────────────────────── */}
        <section className={styles.section}>
          <FloorPlanSection
            images={s.floorPlan?.images || []}
            videoUrl={s.floorPlan?.videoUrl}
            videoTitle={s.floorPlan?.videoTitle}
            number={1}
          />
        </section>

        {/* ── Visualizations ──────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.container}>

            {/* Section header with total counter */}
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>02</span>
              <h2 className={styles.sectionTitle}>Визуализации</h2>
              {totalImages > 0 && (
                <span className={styles.totalBadge}>
                  <ImageIcon size={13} />
                  {totalImages} {totalImages === 1 ? 'изображение' : totalImages < 5 ? 'изображения' : 'изображений'}
                </span>
              )}
            </div>

            {/* Room tabs */}
            {existingTabs.length > 0 && (
              <div className={styles.roomTabs}>
                <p className={styles.roomTabsTitle}>Выберите комнату:</p>
                <div className={styles.tabsList}>
                  {existingTabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`${styles.roomTab} ${activeTab?.id === tab.id ? styles.roomTabActive : ''}`}
                      onClick={() => setSelectedTabId(tab.id)}
                    >
                      {tab.title || `Комната ${existingTabs.indexOf(tab) + 1}`}
                      {tab.images?.length > 0 && (
                        <span className={styles.roomTabCount}>{tab.images.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active tab content */}
            {activeTab && (
              <div className={styles.currentTabSection}>

                {/* Tab title */}
                <div className={styles.currentTabHeader}>
                  <h3 className={styles.currentTabTitle}>
                    {activeTab.title || 'Комната'}
                  </h3>
                  {activeImages.length > 0 && (
                    <span className={styles.imageCount}>{activeImages.length} изображений</span>
                  )}
                </div>

                {/* Gallery */}
                {activeImages.length > 0 ? (
                  <div className={styles.galleryGrid}>
                    {activeImages.map((img, idx) => {
                      const isOwn = img.uploadedBy === 'visualizer' || !img.uploadedBy
                      return (
                        <div
                          key={img.id || idx}
                          className={styles.galleryItem}
                          onClick={() => setLightboxIndex(idx)}
                        >
                          <img src={img.src} alt={img.alt || ''} />
                          <div className={styles.galleryOverlay}>
                            <span className={styles.galleryViewHint}>Открыть</span>
                          </div>
                          {/* Source badge for designer images */}
                          {img.uploadedBy === 'designer' && (
                            <span className={styles.designerBadge} title="Загружено дизайнером">
                              Дизайнер
                            </span>
                          )}
                          {/* Delete only own images */}
                          {isOwn && (
                            <button
                              className={styles.deleteBtn}
                              onClick={(e) => { e.stopPropagation(); handleImageDelete(img.id) }}
                              title="Удалить изображение"
                              type="button"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className={styles.roomEmptyState}>
                    <ImageIcon size={32} className={styles.roomEmptyIcon} />
                    <p className={styles.roomEmptyText}>В этой комнате пока нет визуализаций</p>
                    <p className={styles.roomEmptyHint}>Загрузите рендеры через форму ниже</p>
                  </div>
                )}
              </div>
            )}

            {/* Uploader */}
            {activeTab && (
              <VisualizationUploader
                authorName={user.name || 'Визуализатор'}
                onImageUpload={handleImageUpload}
                existingImages={activeImages}
                saveStatus={saveStatus}
              />
            )}

            {/* No tabs state */}
            {existingTabs.length === 0 && (
              <div className={styles.emptyState}>
                <ImageIcon size={40} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Комнаты не созданы</p>
                <p className={styles.emptyText}>Дизайнер ещё не добавил вкладки для визуализаций.</p>
              </div>
            )}

          </div>
        </section>
      </div>

      {/* Lightbox */}
      {lightboxIndex >= 0 && (
        <Lightbox
          images={activeImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
          onPrev={() => setLightboxIndex(i => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex(i => Math.min(activeImages.length - 1, i + 1))}
        />
      )}
    </div>
  )
}
