import styles from './SectionWrapper.module.css'

export function SectionWrapper({ id, title, number, children, className = '' }) {
  return (
    <section id={id} className={`${styles.section} ${className}`}>
      <div className={styles.container}>
        {(title || number) && (
          <div className={styles.header}>
            {number && <span className={styles.number}>{String(number).padStart(2, '0')}</span>}
            {title && <h2 className={styles.title}>{title}</h2>}
          </div>
        )}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </section>
  )
}
