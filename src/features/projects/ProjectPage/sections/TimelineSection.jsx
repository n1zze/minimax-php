import { SectionWrapper } from '../../../../components/layout/SectionWrapper'
import styles from './TimelineSection.module.css'

export function TimelineSection({ steps = [] }) {
  return (
    <SectionWrapper id="section-01-timeline" title="Ход работ" number={1}>
      <div className={styles.timeline}>
        {steps.map((step, index) => (
          <div key={step.id} className={styles.step}>
            <div className={styles.track}>
              <div className={`${styles.dot} ${step.completed ? styles.dotCompleted : ''}`} />
              {index < steps.length - 1 && (
                <div className={`${styles.line} ${step.completed ? styles.lineCompleted : ''}`} />
              )}
            </div>
            <div className={styles.info}>
              <span className={styles.stepTitle}>{step.title}</span>
              <span className={styles.stepDate}>{step.date}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
