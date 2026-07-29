import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Search, Plus, LayoutDashboard, X, ArrowLeft, FolderOpen } from 'lucide-react'
import { useProjectStore } from '../../store/useProjectStore'
import { useAuthStore, ROLE_DESIGNER, ROLE_CLIENT, ROLE_VISUALIZER } from '../../store/useAuthStore'
import {
  PROJECT_STATUS, STATUS_LABELS,
  PROJECT_TYPE, PROJECT_TYPE_LABELS, PROJECT_TYPE_DESCRIPTIONS,
  OBJECT_TYPE, OBJECT_TYPE_LABELS,
} from './mockProject'
import { dbSaveProject } from '../../db'
import { api } from '../../api'
import { ProjectCard } from './ProjectCard'
import styles from './HomePage.module.css'

const FILTER_OPTIONS = [
  { key: 'all', label: 'Все' },
  { key: PROJECT_STATUS.DRAFT, label: STATUS_LABELS[PROJECT_STATUS.DRAFT] },
  { key: PROJECT_STATUS.IN_PROGRESS, label: STATUS_LABELS[PROJECT_STATUS.IN_PROGRESS] },
  { key: PROJECT_STATUS.REVIEW, label: STATUS_LABELS[PROJECT_STATUS.REVIEW] },
  { key: PROJECT_STATUS.COMPLETED, label: STATUS_LABELS[PROJECT_STATUS.COMPLETED] },
]

export default function HomePage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [modalStep, setModalStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [pricePerSqm, setPricePerSqm] = useState('')
  const [objectType, setObjectType] = useState('')
  const [createError, setCreateError] = useState(null)
  const navigate = useNavigate()
  const { projectsList, loadProjectsList, setProjectsList } = useProjectStore()
  const { user } = useAuthStore()
  const isDesigner = user?.role === ROLE_DESIGNER
  const userProjectId = user?.projectId || user?.visualizerProjectId

  useEffect(() => {
    loadProjectsList()
  }, [loadProjectsList])

  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Закрытие по Escape + scroll lock + focus trap
  useEffect(() => {
    if (!showTypeModal) return

    // Сохранить элемент, который был в фокусе
    previousFocusRef.current = document.activeElement

    // Заблокировать скролл body
    document.body.style.overflow = 'hidden'

    // Фокус на модалку
    setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (firstFocusable) firstFocusable.focus()
      }
    }, 0)

    // Обработка Escape
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        closeModal()
        return
      }

      // Focus trap: Tab циклически по модалке
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      // Вернуть фокус на элемент, который открыл модалку
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [showTypeModal])

  function openModal() {
    setModalStep(1)
    setSelectedType(null)
    setPricePerSqm('')
    setObjectType('')
    setCreateError(null)
    setShowTypeModal(true)
  }

  function closeModal() {
    setShowTypeModal(false)
  }

  function handleTypeSelect(type) {
    setSelectedType(type)
    setModalStep(2)
  }

  async function handleCreateProject() {
    closeModal()
    try {
      const newProject = {
        id: `local-${Date.now()}`,
        title: 'Новый проект',
        client: '',
        clientName: '',
        city: '',
        area: null,
        year: null,
        status: 'draft',
        projectType: selectedType,
        pricePerSqm: pricePerSqm ? parseFloat(pricePerSqm) : null,
        objectType: objectType || null,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        passwordHash: '',
        preview: '',
        sections: {
          brief: { title: '', pdfUrl: '' },
          timeline: { steps: [] },
          contract: { title: '', pdfUrl: '' },
          floorPlan: { images: [], videoUrl: '', videoTitle: '' },
          floorPlanApproval: { title: '', pdfUrl: '' },
          collages: { items: [] },
          collagesApproval: { title: '', pdfUrl: '' },
          visualizations: { tabs: [] },
          drawings: { items: [] },
          drawingsApproval: { title: '', pdfUrl: '' },
          specification: { items: [] },
          specificationApproval: { title: '', pdfUrl: '' },
          finalProject: { items: [], pdfUrl: '', title: '' },
          authorSupervision: { diary: [], title: '', pdfUrl: '' },
        },
      }

      await dbSaveProject(newProject)

      try {
        const serverProject = await api.createProject({
          title: newProject.title,
          clientName: newProject.clientName,
          status: newProject.status,
          projectType: newProject.projectType,
          pricePerSqm: newProject.pricePerSqm,
          objectType: newProject.objectType,
          data: {},
        })
        if (serverProject?.id && serverProject.id !== newProject.id) {
          newProject.id = serverProject.id
          await dbSaveProject(newProject)
        }
      } catch (apiErr) {
        console.warn('[handleCreateProject] Server create failed, using local ID:', apiErr.message)
      }

      setProjectsList((prev) => {
        const list = Array.isArray(prev) ? prev : []
        return [newProject, ...list]
      })

      navigate(`/projects/${newProject.id}/edit`)
    } catch (err) {
      console.error('Failed to create project:', err)
      setCreateError('Не удалось создать проект. Попробуйте ещё раз.')
      setShowTypeModal(true)
    }
  }

  const filtered = useMemo(() => {
    if (!Array.isArray(projectsList)) return []
    return projectsList.filter((p) => {
      // For clients, only show the project they have access to
      if (user?.role === ROLE_CLIENT && user?.projectId) {
        return p.id === user.projectId
      }
      const matchesFilter = filter === 'all' || p.status === filter
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.clientName || p.client || '').toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [filter, search, projectsList, user])

  if (user?.role === ROLE_CLIENT && userProjectId) {
    return <Navigate to={`/projects/${userProjectId}`} replace />
  }

  if (user?.role === ROLE_VISUALIZER && userProjectId) {
    return <Navigate to={`/visualizer/${userProjectId}`} replace />
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Проекты</h1>
          <div className={styles.headerActions}>
            {isDesigner && (
              <button className={styles.dashboardBtn} onClick={() => navigate('/dashboard')}>
                <LayoutDashboard size={16} /> Панель управления
              </button>
            )}
            {isDesigner && (
              <button className={styles.addBtn} onClick={openModal}>
                <Plus size={16} /> Добавить проект
              </button>
            )}
          </div>
        </div>

        <div className={styles.filters}>
          {user?.role === ROLE_CLIENT && user?.projectId ? null : (
            <>
              <div className={styles.filterTabs}>
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    className={`${styles.filterBtn} ${filter === opt.key ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter(opt.key)}
                    aria-pressed={filter === opt.key}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Поиск по названию или клиенту..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className={styles.grid}>
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <FolderOpen size={48} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Проектов пока нет</p>
            <p className={styles.emptyDesc}>
              {search
                ? 'Попробуйте изменить поисковый запрос'
                : isDesigner
                  ? 'Создайте свой первый проект'
                  : 'Проекты появятся здесь, когда дизайнер их добавит'}
            </p>
            {isDesigner && !search && (
              <button className={styles.addBtn} onClick={openModal} style={{ marginTop: 'var(--space-lg)' }}>
                <Plus size={16} /> Создать проект
              </button>
            )}
          </div>
        )}
      </div>

      {/* Project creation modal */}
      {showTypeModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            ref={modalRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Создание проекта"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Step 1 — choose project type */}
            {modalStep === 1 && (
              <>
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>Тип проекта</h2>
                  <button className={styles.modalClose} onClick={closeModal}>
                    <X size={20} />
                  </button>
                </div>
                <div className={styles.typeList}>
                  {Object.values(PROJECT_TYPE).map((type) => (
                    <button
                      key={type}
                      className={styles.typeOption}
                      onClick={() => handleTypeSelect(type)}
                    >
                      <span className={styles.typeLabel}>{PROJECT_TYPE_LABELS[type]}</span>
                      <span className={styles.typeDesc}>{PROJECT_TYPE_DESCRIPTIONS[type]}</span>
                      {type === PROJECT_TYPE.FULL_WITH_SUPERVISION && (
                        <span className={styles.typeBadge}>По умолчанию</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2 — price & object type */}
            {modalStep === 2 && (
              <>
                <div className={styles.modalHeader}>
                  <button className={styles.modalBack} onClick={() => setModalStep(1)}>
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className={styles.modalTitle}>Детали проекта</h2>
                  <button className={styles.modalClose} onClick={closeModal}>
                    <X size={20} />
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <p className={styles.modalSubtitle}>
                    {PROJECT_TYPE_LABELS[selectedType]}
                  </p>

                  <label className={styles.modalField}>
                    <span className={styles.modalLabel}>Вид объекта</span>
                    <div className={styles.objectTypeGrid}>
                      {Object.values(OBJECT_TYPE).map((ot) => (
                        <button
                          key={ot}
                          type="button"
                          className={`${styles.objectTypeBtn} ${objectType === ot ? styles.objectTypeBtnActive : ''}`}
                          onClick={() => setObjectType(ot)}
                        >
                          {OBJECT_TYPE_LABELS[ot]}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className={styles.modalField}>
                    <span className={styles.modalLabel}>Цена, руб/м²</span>
                    <input
                      className={styles.modalInput}
                      type="number"
                      min="0"
                      step="100"
                      placeholder="Например: 5000"
                      value={pricePerSqm}
                      onChange={(e) => setPricePerSqm(e.target.value)}
                    />
                  </label>

                  {createError && (
                    <p className={styles.createError}>{createError}</p>
                  )}

                  <button className={styles.modalCreateBtn} onClick={handleCreateProject}>
                    Создать проект
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
