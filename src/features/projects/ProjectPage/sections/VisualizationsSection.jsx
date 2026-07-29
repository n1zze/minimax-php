import { useState } from 'react'
import { Check, Eye, Clock, User } from 'lucide-react'
import { SectionWrapper } from '../../../../components/layout/SectionWrapper'
import { Lightbox } from '../../../../components/ui/Lightbox'
import styles from './VisualizationsSection.module.css'

/**
 * VisualizationsSection — секция визуализаций.
 * 
 * Структура:
 * - tabs = комнаты (Гостиная, Спальня, etc.)
 * - Каждая комната может быть утверждена или в черновике
 * - Внутри комнаты могут быть изображения (несколько версий рендеров)
 * 
 * Для дизайнера и визуализатора:
 * - Показывает историю версий (все загруженные версии)
 * - Показывает переключение между комнатами
 * - Показывает статус каждой комнаты (черновик/утверждено)
 * - Кнопка утверждения комнаты (только для дизайнера)
 * 
 * Для клиента:
 * - Показывает только утверждённые комнаты
 */
export function VisualizationsSection({ 
  tabs = [], 
  isDesigner = false,
  isVisualizer = false,
  onApproveRoom 
}) {
  const [selectedTabId, setSelectedTabId] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [selectedVersionId, setSelectedVersionId] = useState(null)

  // For clients: show only approved rooms. For designers/visualizers: show all.
  const visibleTabs = (isDesigner || isVisualizer) ? tabs : tabs.filter(tab => tab.status === 'approved')

  // Build versions from tabs (for version history)
  const versions = tabs.map((tab, idx) => ({
    id: tab.versionNumber || (idx + 1),
    tabId: tab.id,
    title: tab.title,
    date: tab.date,
    author: tab.author,
    status: tab.status,
    images: tab.images || [],
  }))

  // Find active tab
  const activeTabId = visibleTabs.some((tab) => tab.id === selectedTabId)
    ? selectedTabId
    : visibleTabs[0]?.id ?? ''
  const activeTab = visibleTabs.find((t) => t.id === activeTabId)
  const activeImages = activeTab?.images ?? []

  // Current selected version's images
  const currentVersion = selectedVersionId
    ? versions.find(v => v.id === selectedVersionId)
    : null
  const displayImages = currentVersion?.images || activeImages

  const isLightboxOpen = lightboxIndex >= 0

  // Current tab status
  const isCurrentApproved = activeTab?.status === 'approved'

  function handleTabClick(tabId) {
    setSelectedTabId(tabId)
    setSelectedVersionId(null) // Reset version when changing room
  }

  function handleVersionSelect(versionId) {
    setSelectedVersionId(versionId)
    const version = versions.find(v => v.id === versionId)
    if (version) {
      setSelectedTabId(version.tabId)
    }
  }

  function handleApprove() {
    if (onApproveRoom && activeTabId) {
      onApproveRoom(activeTabId)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  // Show message if no approved visualizations for client
  if (!isDesigner && !isVisualizer && visibleTabs.length === 0) {
    return (
      <SectionWrapper id="section-07-visualizations" title="Визуализации" number={7}>
        <div className={styles.empty}>Визуализации находятся на утверждении</div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper id="section-07-visualizations" title="Визуализации" number={7}>
      {/* Version history for designer and visualizer */}
      {(isDesigner || isVisualizer) && versions.length > 0 && (
        <div className={styles.versionHistory}>
          <h3 className={styles.versionHistoryTitle}>История версий</h3>
          <div className={styles.versionGrid}>
            {versions.map((version) => (
              <div
                key={version.id}
                className={`${styles.versionCard} ${selectedVersionId === version.id || (!selectedVersionId && version.id === versions[0]?.id) ? styles.versionCardActive : ''}`}
                onClick={() => handleVersionSelect(version.id)}
              >
                <div className={styles.versionBadge}>
                  <span>{version.title || `Комната ${version.id}`}</span>
                  {version.status === 'approved' && (
                    <span className={styles.approvedIcon} title="Комната утверждена">
                      <Check size={10} />
                    </span>
                  )}
                </div>
                <div className={styles.versionMeta}>
                  {version.date && (
                    <div className={styles.versionMetaRow}>
                      <Clock size={10} />
                      <span>{formatDate(version.date)}</span>
                    </div>
                  )}
                  {version.author && (
                    <div className={styles.versionMetaRow}>
                      <User size={10} />
                      <span>{version.author}</span>
                    </div>
                  )}
                </div>
                <div className={styles.versionImageCount}>
                  {version.images.length} {version.images.length === 1 ? 'изображение' : version.images.length < 5 ? 'изображения' : 'изображений'}
                </div>
                <div className={styles.versionPreview}>
                  {version.images.slice(0, 2).map((img, idx) => (
                    <img key={img.id || idx} src={img.src} alt="" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room tabs navigation */}
      <div className={styles.tabs}>
        {visibleTabs.map((tab) => {
          const isSelected = tab.id === activeTabId
          
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${isSelected ? styles.tabActive : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className={styles.tabTitle}>{tab.title}</span>
              {tab.status === 'approved' && (
                <span className={styles.approvedBadge} title="Утверждено">
                  <Check size={10} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Gallery */}
      <div className={styles.gallery}>
        {displayImages.map((img, index) => (
          <div
            key={img.id}
            className={styles.imageWrap}
            onClick={() => setLightboxIndex(index)}
          >
            <img src={img.src} alt={img.alt} className={styles.image} />
            <div className={styles.imageOverlay}>
              <Eye size={20} />
            </div>
          </div>
        ))}
      </div>

      {displayImages.length === 0 && (
        <div className={styles.empty}>Нет визуализаций{selectedVersionId ? ' в этой версии' : ' для этой комнаты'}</div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          images={displayImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(displayImages.length - 1, i + 1))}
        />
      )}
    </SectionWrapper>
  )
}
