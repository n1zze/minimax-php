import { SectionWrapper } from '../../../../components/layout/SectionWrapper'
import { PdfBanner } from './PdfBanner'
import styles from './AuthorSupervisionSection.module.css'

export function AuthorSupervisionSection({ diary = [], pdfUrl, title }) {
  return (
    <SectionWrapper id="section-13-supervision" title="Авторский надзор" number={13}>
      <div className={styles.diary}>
        {diary.map((entry) => (
          <div key={entry.id} className={styles.entry}>
            <span className={styles.entryDate}>{entry.date}</span>
            <div className={styles.entryInfo}>
              <span className={styles.entryTitle}>{entry.title}</span>
              <span className={styles.entryDesc}>{entry.description}</span>
            </div>
          </div>
        ))}
      </div>
      {pdfUrl && (
        <PdfBanner
          pdfUrl={pdfUrl}
          title={title}
          sectionTitle="Журнал надзора"
        />
      )}
    </SectionWrapper>
  )
}
