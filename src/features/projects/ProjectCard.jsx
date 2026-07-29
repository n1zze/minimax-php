import { Link } from 'react-router-dom'
import { useAuthStore, ROLE_DESIGNER } from '../../store/useAuthStore'
import { STATUS_LABELS, PROJECT_TYPE_LABELS } from './mockProject'
import styles from './ProjectCard.module.css'

export function ProjectCard({ project }) {
  const { user } = useAuthStore()
  const isDesigner = user?.role === ROLE_DESIGNER
  const isClient = user?.role === 'client'

  // Format update date
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Build parameters string
  const getParams = () => {
    const parts = []
    if (project.city) parts.push(project.city)
    if (project.area) parts.push(`${project.area} м²`)
    return parts.join(' · ')
  }

  const params = getParams()
  const clientName = project.clientName || project.client || ''
  const typeLabel = project.projectType ? PROJECT_TYPE_LABELS[project.projectType] : null

  // Designer goes directly to project, client goes to project page (already unlocked)
  const linkTo = isDesigner
    ? `/projects/${project.id}`
    : isClient && user?.projectId === project.id
    ? `/projects/${project.id}`
    : `/projects/${project.id}/unlock`

  return (
    <Link to={linkTo} className={styles.card}>
      <div className={styles.preview}>
        <img src={project.thumbnailPath || project.preview} alt={project.title} />
        <span className={`${styles.status} ${styles[`status_${project.status}`]}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{project.title}</h3>
        {typeLabel && <p className={styles.type}>{typeLabel}</p>}
        {clientName && <p className={styles.client}>{clientName}</p>}
        {params && <p className={styles.params}>{params}</p>}
        <span className={styles.date}>Обновлено: {formatDate(project.updatedAt)}</span>
      </div>
    </Link>
  )
}
