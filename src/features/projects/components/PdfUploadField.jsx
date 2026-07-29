import { FileText, X } from 'lucide-react'
import { UploadArea } from './UploadArea'
import styles from './PdfUploadField.module.css'

export function PdfUploadField({ title, pdfUrl, onTitleChange, onUpload, onClear }) {
  const fileName = pdfUrl ? pdfUrl.split('/').pop() : ''

  // UploadArea calls onUpload(results, rawFiles) — we need the raw File object
  function handleUpload(results, rawFiles) {
    const file = rawFiles?.[0] ?? results?.[0]?.file ?? null
    if (file) onUpload(file)
  }

  return (
    <div className={styles.field}>
      <label className={styles.label}>
        Название
        <input
          className={styles.input}
          value={title ?? ''}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </label>

      {pdfUrl ? (
        <div className={styles.current}>
          <FileText size={20} />
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
            {fileName || 'Открыть PDF'}
          </a>
          <button type="button" className={styles.clearBtn} onClick={onClear} title="Убрать PDF">
            <X size={16} />
          </button>
        </div>
      ) : (
        <UploadArea
          label="Загрузить PDF"
          accept="application/pdf"
          multiple={false}
          autoCompress={false}
          onUpload={handleUpload}
        />
      )}
    </div>
  )
}
