import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../../store/useProjectStore'
import { useAuthStore, ROLE_DESIGNER, ROLE_VISUALIZER } from '../../../store/useAuthStore'
import { calcProgress } from '../../../hooks/calcProgress'
import { ProgressBar } from '../../../components/ui/ProgressBar'
import { Edit3, Download } from 'lucide-react'
import { ExportModal } from '../components/ExportModal'
import { TimelineSection } from './sections/TimelineSection'
import { PdfBanner } from './sections/PdfBanner'
import { FloorPlanSection } from './sections/FloorPlanSection'
import { VisualizationsSection } from './sections/VisualizationsSection'
import { DrawingsSection } from './sections/DrawingsSection'
import { SpecificationSection } from './sections/SpecificationSection'
import { FinalProjectSection } from './sections/FinalProjectSection'
import { AuthorSupervisionSection } from './sections/AuthorSupervisionSection'
import styles from './ProjectPage.module.css'

const STATUS_LABELS = {
  draft: 'Черновик',
  in_progress: 'В процессе',
  completed: 'Завершён',
  review: 'На проверке',
}

export default function ProjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { project, loadProject, updateSection, saveProject } = useProjectStore()
  const { user } = useAuthStore()
  const [showExport, setShowExport] = useState(false)
  const isDesigner = user?.role === ROLE_DESIGNER
  const isVisualizer = user?.role === ROLE_VISUALIZER

  const loadIdRef = useRef(null)

  useEffect(() => {
    loadIdRef.current = id
    loadProject(id).then(() => {
      // If id changed while loading, discard stale result
      if (loadIdRef.current !== id) return
    })
  }, [id, loadProject])

  /**
   * Handle room approval from designer
   */
  function handleApproveRoom(tabId) {
    if (!project || !isDesigner) return

    const currentTabs = project.sections?.visualizations?.tabs || []
    const updatedTabs = currentTabs.map(tab => {
      return tab.id === tabId
        ? { ...tab, status: 'approved' }
        : tab
    })

    updateSection('visualizations', { tabs: updatedTabs })

    // Save to server
    const updatedProject = {
      ...project,
      sections: {
        ...project.sections,
        visualizations: { tabs: updatedTabs }
      }
    }
    saveProject(updatedProject)
  }

  const { error } = useProjectStore()
  if (error) return <div className={styles.loader}>Ошибка: {error}</div>
  if (!project) return <div className={styles.loader}>Загрузка...</div>

  const s = project.sections
  const progress = calcProgress(s)

  return (
    <div className={styles.page}>
      <div className={styles.projectHeader}>
        <div className={styles.container}>
          <Link to="/" className={styles.backLink}>← Проекты</Link>
          <h1 className={styles.projectTitle}>{project.title}</h1>
          <p className={styles.projectMeta}>
            Клиент: {project.clientName} · Статус: {STATUS_LABELS[project.status] ?? project.status}
          </p>
          {(project.city || project.area || project.year) && (
            <p className={styles.projectMeta}>
              {project.city && <>Город: {project.city}</>}
              {project.city && project.area && ' · '}
              {project.area && <>Площадь: {project.area} кв.м.</>}
              {(project.city || project.area) && project.year && ' · '}
              {project.year && <>Год реализации: {project.year}</>}
            </p>
          )}
          <div className={styles.progressWrap}>
            <ProgressBar value={progress} />
          </div>
          <div className={styles.headerActions}>
            {isDesigner && (
              <button className={styles.editBtn} onClick={() => navigate(`/projects/${id}/edit`)}>
                <Edit3 size={16} /> Редактировать
              </button>
            )}
            {isDesigner && (
              <button className={styles.exportBtn} onClick={() => setShowExport(true)}>
                <Download size={16} /> Экспорт PDF
              </button>
            )}
          </div>
        </div>
      </div>

      <TimelineSection steps={s.timeline.steps} />

      <PdfBanner id="section-00-brief" pdfUrl={s.brief?.pdfUrl} title={s.brief?.title} sectionTitle="Бриф" number={0} />

      <PdfBanner id="section-02-contract" pdfUrl={s.contract.pdfUrl} title={s.contract.title} sectionTitle="Договор" number={2} />

      <FloorPlanSection images={s.floorPlan.images} videoUrl={s.floorPlan.videoUrl} videoTitle={s.floorPlan.videoTitle} />

      <PdfBanner id="section-04-floorplan-approval" pdfUrl={s.floorPlanApproval.pdfUrl} title={s.floorPlanApproval.title} sectionTitle="Утверждение планировки" number={4} />

      <VisualizationsSection 
        tabs={s.visualizations.tabs} 
        isDesigner={isDesigner}
        isVisualizer={isVisualizer}
        onApproveRoom={handleApproveRoom}
      />

      <DrawingsSection items={s.drawings.items} />

      <PdfBanner id="section-09-drawings-approval" pdfUrl={s.drawingsApproval.pdfUrl} title={s.drawingsApproval.title} sectionTitle="Утверждение чертежей" number={9} />

      <SpecificationSection items={s.specification.items} excelUrl={s.specification.excelUrl} />

      <PdfBanner id="section-11-specification-approval" pdfUrl={s.specificationApproval.pdfUrl} title={s.specificationApproval.title} sectionTitle="Утверждение спецификации" number={11} />

      <FinalProjectSection items={s.finalProject.items} pdfUrl={s.finalProject.pdfUrl} pdfTitle={s.finalProject.title} />

      <AuthorSupervisionSection diary={s.authorSupervision.diary} pdfUrl={s.authorSupervision.pdfUrl} title={s.authorSupervision.title} />

      {showExport && (
        <ExportModal
          project={project}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
