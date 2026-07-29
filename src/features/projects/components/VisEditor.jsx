import { SortableImageGrid } from './SortableImageGrid'
import { UploadArea } from './UploadArea'
import { Check } from 'lucide-react'
import styles from './VisEditor.module.css'

/**
 * Editor for visualizations — tabs with images.
 * Designer can upload, reorder (drag & drop), delete all images, and approve rooms.
 * Images uploaded by visualizer are marked with a badge.
 */
export function VisEditor({ tabs = [], onTabsChange, onImageUpload, onApproveTab }) {
  function handleTabTitleChange(tabId, title) {
    onTabsChange(tabs.map((t) => (t.id === tabId ? { ...t, title } : t)))
  }

  function handleAddTab() {
    const newId = `tab-${Date.now()}`
    onTabsChange([...tabs, { id: newId, title: '', images: [], status: 'draft' }])
  }

  function handleRemoveTab(tabId) {
    onTabsChange(tabs.filter((t) => t.id !== tabId))
  }

  function handleRemoveImage(tabId, imageId) {
    onTabsChange(
      tabs.map((t) =>
        t.id === tabId
          ? { ...t, images: t.images.filter((img) => img.id !== imageId) }
          : t
      )
    )
  }

  function handleReorderImages(tabId, newImages) {
    onTabsChange(
      tabs.map((t) => (t.id === tabId ? { ...t, images: newImages } : t))
    )
  }

  function handleApprove(tabId) {
    onTabsChange(
      tabs.map((t) =>
        t.id === tabId ? {
          ...t,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: 'Дизайнер',
        } : t
      )
    )
    onApproveTab?.(tabId)
  }

  return (
    <div className={styles.editor}>
      {tabs.map((tab) => (
        <div key={tab.id} className={styles.tabCard}>
          <div className={styles.tabHeader}>
            <input
              className={styles.tabTitleInput}
              value={tab.title}
              onChange={(e) => handleTabTitleChange(tab.id, e.target.value)}
              placeholder="Название комнаты"
            />
            <span className={`${styles.statusBadge} ${styles[tab.status || 'draft']}`}>
              {tab.status === 'approved' ? 'Утверждено' : 'Черновик'}
              {tab.approvedAt && (
                <span className={styles.approvedDate}>
                  {new Date(tab.approvedAt).toLocaleDateString('ru-RU')}
                  {tab.approvedBy && <> · {tab.approvedBy}</>}
                </span>
              )}
            </span>
            {tab.status !== 'approved' && (
              <button
                type="button"
                className={styles.approveBtn}
                onClick={() => handleApprove(tab.id)}
                title="Утвердить визуализации"
              >
                <Check size={14} />
                Утвердить
              </button>
            )}
            <button
              type="button"
              className={styles.removeTabBtn}
              onClick={() => handleRemoveTab(tab.id)}
            >
              Удалить
            </button>
          </div>
          {tab.images?.length > 0 && (
            <SortableImageGrid
              items={tab.images}
              onReorder={(items) => handleReorderImages(tab.id, items)}
              onRemove={(imageId) => handleRemoveImage(tab.id, imageId)}
              badgeFor={(img) => (img.uploadedBy === 'visualizer' ? 'Визуализатор' : null)}
            />
          )}
          <UploadArea
            label="Добавить визуализации"
            onUpload={(files, rawFiles) => onImageUpload(tab.id, files, rawFiles)}
          />
        </div>
      ))}
      <button type="button" className={styles.addBtn} onClick={handleAddTab}>
        + Добавить комнату
      </button>
    </div>
  )
}
