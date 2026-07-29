import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Calendar, Edit3, ExternalLink } from 'lucide-react'
import { useProjectStore } from '../../store/useProjectStore'
import { STATUS_LABELS, PROJECT_STATUS } from './mockProject'
import styles from './DashboardPage.module.css'

const STATUS_ORDER = [
  PROJECT_STATUS.IN_PROGRESS,
  PROJECT_STATUS.REVIEW,
  PROJECT_STATUS.DRAFT,
  PROJECT_STATUS.COMPLETED,
]

export default function DashboardPage() {
  const { projectsList, loadProjectsList } = useProjectStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadProjectsList()
  }, [loadProjectsList])

  /**
   * Calculate timeline progress for a project in the list.
   * Uses timeline steps if available, otherwise returns null.
   */
  function calcTimelineProgress(project) {
    const steps = project.sections?.timeline?.steps || []
    if (steps.length === 0) return null
    const done = steps.filter(s => s.completed).length
    return Math.round((done / steps.length) * 100)
  }

  if (!Array.isArray(projectsList) || projectsList.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.empty}>Загрузка данных...</div>
        </div>
      </div>
    )
  }

  // Count projects by status
  const statusCounts = projectsList.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  // Gather upcoming timeline steps
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

  upcomingSteps.sort((a, b) => new Date(a.stepDate) - new Date(b.stepDate))
  const nextSteps = upcomingSteps.slice(0, 10)

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      if (date.toDateString() === today.toDateString()) return 'Сегодня'
      if (date.toDateString() === tomorrow.toDateString()) return 'Завтра'

      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Group projects by status for quick access
  const projectsByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = projectsList.filter((p) => p.status === status)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Проекты
          </Link>
          <h1 className={styles.title}>Панель управления</h1>
        </div>

        <div className={styles.grid}>
          {/* Status Overview */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <BarChart3 size={20} />
              <h2>Статус проектов</h2>
            </div>
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
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Calendar size={20} />
              <h2>Предстоящие мероприятия</h2>
            </div>
            {nextSteps.length > 0 ? (
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
            ) : (
              <p className={styles.emptyEvents}>Нет предстоящих мероприятий</p>
            )}
          </div>
        </div>

        {/* Projects by Status */}
        <div className={styles.projectsByStatus}>
          <h2 className={styles.sectionTitle}>Проекты по статусам</h2>
          {STATUS_ORDER.map((status) => {
            const projects = projectsByStatus[status] || []
            if (projects.length === 0) return null
            return (
              <div key={status} className={styles.statusSection}>
                <h3 className={styles.statusSectionTitle}>
                  <span className={`${styles.statusDot} ${styles[`statusDot_${status}`]}`} />
                  {STATUS_LABELS[status]} ({projects.length})
                </h3>
                <div className={styles.projectList}>
                  {projects.map((project) => {
                    const progress = calcTimelineProgress(project)
                    return (
                      <div key={project.id} className={styles.projectItem}>
                        <div className={styles.projectItemMain}>
                          <div className={styles.projectItemInfo}>
                            <span className={styles.projectTitle}>{project.title}</span>
                            <span className={styles.projectMeta}>
                              {project.clientName || project.client || '—'}
                              {project.city && ` · ${project.city}`}
                              {project.area && ` · ${project.area} м²`}
                            </span>
                          </div>
                          <div className={styles.projectItemActions}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => navigate(`/projects/${project.id}/edit`)}
                              title="Редактировать"
                            >
                              <Edit3 size={14} />
                            </button>
                            <Link
                              to={`/projects/${project.id}`}
                              className={styles.actionBtn}
                              title="Открыть проект"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        </div>
                        {progress !== null && (
                          <div className={styles.progressWrap}>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className={styles.progressLabel}>{progress}%</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}