import { useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, Eye, MessageCircle, FileText } from 'lucide-react'
import { useOnboardingStore } from '../../store/useOnboardingStore'
import { useAuthStore, ROLE_CLIENT, ROLE_VISUALIZER, ROLE_DESIGNER } from '../../store/useAuthStore'
import styles from './Onboarding.module.css'

/**
 * Step content per role.
 */
const STEPS_BY_ROLE = {
  [ROLE_CLIENT]: [
    {
      icon: Sparkles,
      title: 'Добро пожаловать в ваш проект',
      text: 'Здесь собраны все материалы по дизайн-проекту: планировки, визуализации, чертежи и спецификация.',
    },
    {
      icon: Eye,
      title: 'Этапы и визуализации',
      text: 'Слева — таймлайн работ. Ниже — разделы с материалами. Кликните на изображение, чтобы открыть его на весь экран.',
    },
    {
      icon: FileText,
      title: 'Документы и утверждения',
      text: 'PDF-документы открываются в новой вкладке. Когда дизайнер просит ваше утверждение — внимательно проверьте материалы.',
    },
    {
      icon: MessageCircle,
      title: 'Связь с дизайнером',
      text: 'Если есть вопросы или замечания — свяжитесь с вашим дизайнером напрямую. Все правки фиксируются на стороне дизайнера.',
    },
  ],
  [ROLE_VISUALIZER]: [
    {
      icon: Sparkles,
      title: 'Добро пожаловать',
      text: 'Это рабочее место визуализатора. Вы увидите планировку проекта и сможете загружать рендеры по комнатам.',
    },
    {
      icon: Eye,
      title: 'Загрузка визуализаций',
      text: 'Перетащите изображения в зону загрузки или выберите файлы. Поддерживаются JPEG, PNG, WebP до 20 МБ.',
    },
    {
      icon: FileText,
      title: 'Сортировка и удаление',
      text: 'Превью загруженных файлов можно перетаскивать для изменения порядка. Удалять можно только свои изображения.',
    },
  ],
  [ROLE_DESIGNER]: [
    {
      icon: Sparkles,
      title: 'Добро пожаловать в Mimimax',
      text: 'Создавайте проекты, загружайте материалы и делитесь ими с клиентами и визуализаторами через защищённые ссылки.',
    },
    {
      icon: Eye,
      title: 'Панель управления',
      text: 'На главной странице — список ваших проектов. В панели управления — статусы, прогресс и предстоящие задачи.',
    },
    {
      icon: FileText,
      title: 'Редактирование проекта',
      text: 'В режиме редактирования вы загружаете изображения, PDF-документы, настраиваете таймлайн и спецификацию.',
    },
  ],
}

export function Onboarding() {
  const { isOpen, step, role, next, prev, finish, skip } = useOnboardingStore()

  useEffect(() => {
    if (!isOpen) return
    function onKey(e) {
      if (e.key === 'Escape') skip()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, next, prev, skip])

  if (!isOpen) return null

  const steps = STEPS_BY_ROLE[role] || []
  if (steps.length === 0) return null

  const safeStep = Math.min(step, steps.length - 1)
  const current = steps[safeStep]
  const Icon = current.icon
  const isLast = safeStep === steps.length - 1
  const isFirst = safeStep === 0

  return (
    <div className={styles.overlay} onClick={skip}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={skip} aria-label="Закрыть">
          <X size={18} />
        </button>

        <div className={styles.iconWrap}>
          <Icon size={28} />
        </div>

        <h2 className={styles.title}>{current.title}</h2>
        <p className={styles.text}>{current.text}</p>

        <div className={styles.progress}>
          {steps.map((_, idx) => (
            <span
              key={idx}
              className={`${styles.dot} ${idx === safeStep ? styles.dotActive : ''}`}
            />
          ))}
        </div>

        <div className={styles.actions}>
          {!isFirst && (
            <button type="button" className={styles.secondaryBtn} onClick={prev}>
              <ChevronLeft size={16} /> Назад
            </button>
          )}
          {isFirst && (
            <button type="button" className={styles.skipBtn} onClick={skip}>
              Пропустить
            </button>
          )}
          {isLast ? (
            <button type="button" className={styles.primaryBtn} onClick={finish}>
              Понятно
            </button>
          ) : (
            <button type="button" className={styles.primaryBtn} onClick={next}>
              Далее <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook that auto-starts onboarding for a freshly logged-in user.
 * Use inside layout / app root.
 */
export function useOnboardingBootstrap() {
  const user = useAuthStore((s) => s.user)
  const maybeStart = useOnboardingStore((s) => s.maybeStart)

  useEffect(() => {
    if (user?.role) {
      // Slight delay to let the page render first
      const t = setTimeout(() => maybeStart(user.role), 600)
      return () => clearTimeout(t)
    }
  }, [user?.role, maybeStart])
}
