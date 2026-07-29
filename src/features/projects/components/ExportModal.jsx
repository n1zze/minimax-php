import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { ProjectPDFDocument } from './ProjectPDF'
import styles from './ExportModal.module.css'

export function ExportModal({ project, onClose }) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  async function handleExport() {
    setExporting(true)
    setError(null)

    try {
      const doc = <ProjectPDFDocument project={project} sections={['finalProject']} />
      const blob = await pdf(doc).toBlob()

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.title || 'project'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onClose()
    } catch (err) {
      console.error('PDF export error:', err)
      const message = err?.message || err?.toString() || 'Ошибка генерации PDF. Попробуйте ещё раз.'
      setError(message.length > 100 ? 'Ошибка генерации PDF. Попробуйте ещё раз.' : message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Экспорт PDF</h2>
        <p className={styles.description}>
          Будет экспортирован только раздел «Итоговый проект»
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={exporting}>Отмена</button>
          <button className={styles.exportBtn} onClick={handleExport} disabled={exporting}>
            {exporting ? 'Генерация...' : 'Экспорт'}
          </button>
        </div>
      </div>
    </div>
  )
}
