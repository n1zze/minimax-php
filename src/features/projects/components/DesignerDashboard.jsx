import { Link } from 'react-router-dom'
import { useProjectStore } from '../../../store/useProjectStore'
import { STATUS_LABELS, PROJECT_STATUS } from '../mockProject'
import styles from './DesignerDashboard.module.css'

const STATUS_ORDER = [
  PROJECT_STATUS.IN_PROGRESS,
  PROJECT_STATUS.REVIEW,
  PROJECT_STATUS.DRAFT,
  PROJECT_STATUS.COMPLETED,
]

export function DesignerDashboard() {
  const { projectsList } = useProjectStore()

  if (!Array.isArray(projectsList) || projectsList.length === 0) {
    return null
  }

  // Count projects by status
  const statusCounts = projectsList.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  // Gather upcoming timeline steps (not completed, with future dates)
  const upcomingSteps = []
  const now = new Date()
  
  projectsList.forEach((project) => {
    const steps = project.sections?.timeline?.steps || []
    steps.forEach((step) => {
      if (!step.completed && step.date) {
        const stepDate = new Date(step.date)
        upcomingSteps.push({
          projectId: project.id,
          projectTitle: project.title,
          stepTitle: step.title,
          stepDate: step.date,
          isOverdue: stepDate < now,
          isToday: stepDate.toDateString() === now.toDateString(),
        })
      }
    })
  })

  // Sort by date
  upcomingSteps.sort((a, b) => new Date(a.stepDate) - new Date(b.stepDate))
  
  // Take next 5
  const nextSteps = upcomingSteps.slice(0, 5)

  // Format date for display
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      if (date.toDateString() === today.toDateString()) return 'Сегодня'
      if (date.toDateString() === tomorrow.toDateString()) return 'Завтра'
      
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className={styles.dashboard}>
      {/* Status Overview */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Статус проектов</h2>
        <div className={styles.statusGrid}>
          {STATUS_ORDER.map((status) => {
            const count = statusCounts[status] || 0
            return (
              <div key={status} className={`${styles.statusCard} ${styles[`status_${status}`]}`}>
                <span className={styles.statusCount}>{count}</span>
                <span className={styles.statusLabel}>{STATUS_LABELS[status]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      {nextSteps.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Предстоящие мероприятия</h2>
          <div className={styles.eventsList}>
            {nextSteps.map((step, index) => (
              <Link
                key={`${step.projectId}-${step.stepDate}-${index}`}
                to={`/projects/${step.projectId}`}
                className={`${styles.eventItem} ${step.isOverdue ? styles.overdue : ''} ${step.isToday ? styles.today : ''}`}
              >
                <div className={styles.eventDate}>{formatDate(step.stepDate)}</div>
                <div className={styles.eventInfo}>
                  <span className={styles.eventProject}>{step.projectTitle}</span>
                  <span className={styles.eventTitle}>{step.stepTitle}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}