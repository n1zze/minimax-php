import { SectionWrapper } from '../../../../components/layout/SectionWrapper'
import { VersionSelector } from '../../../../components/ui/VersionSelector'
import { FileText, FileX } from 'lucide-react'
import styles from './PdfBanner.module.css'

/**
 * PdfBanner with version support.
 * 
 * Props (backward compatible):
 * - pdfUrl, title, number, sectionTitle — legacy single PDF mode
 * 
 * Props (versioned mode):
 * - versions: [{ id, pdfUrl, title }]
 * - currentVersion: number
 * - onVersionChange: (versionId) => void
 * - isDesigner: boolean
 */
export function PdfBanner({
  id,
  // Legacy props
  pdfUrl: legacyPdfUrl,
  title: legacyTitle,
  number,
  sectionTitle,
  // Versioned props
  versions = [],
  currentVersion = 1,
  onVersionChange,
  isDesigner = false,
}) {
  // Legacy mode: single PDF (no versions array)
  const isLegacyMode = versions.length === 0

  const currentData = isLegacyMode
    ? { pdfUrl: legacyPdfUrl, title: legacyTitle }
    : versions.find(v => v.id === currentVersion) || versions[0]

  const totalVersions = Math.max(versions.length, isLegacyMode ? 1 : 0)
  const hasPdf = Boolean(currentData?.pdfUrl)

  return (
    <SectionWrapper id={id} title={sectionTitle} number={number}>
      <div className={styles.wrapper}>
        {hasPdf ? (
          <a
            href={currentData.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.banner}
          >
            <div className={styles.icon}>
              <FileText size={32} />
            </div>
            <div className={styles.info}>
              <span className={styles.title}>{currentData.title || 'PDF документ'}</span>
              <span className={styles.hint}>Открыть PDF</span>
            </div>
            <span className={styles.arrow}>→</span>
          </a>
        ) : (
          <div className={styles.bannerEmpty}>
            <div className={styles.icon}>
              <FileX size={32} />
            </div>
            <div className={styles.info}>
              <span className={styles.title}>{legacyTitle || sectionTitle || 'PDF документ'}</span>
              <span className={styles.hint}>Файл не загружен</span>
            </div>
          </div>
        )}

        {!isLegacyMode && totalVersions > 0 && (
          <div className={styles.versionBar}>
            <VersionSelector
              currentVersion={currentVersion}
              totalVersions={totalVersions}
              onChange={onVersionChange}
              isDesigner={isDesigner}
            />
          </div>
        )}
      </div>
    </SectionWrapper>
  )
}
