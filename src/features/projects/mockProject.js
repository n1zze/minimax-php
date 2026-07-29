export const PROJECT_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
}

export const STATUS_LABELS = {
  [PROJECT_STATUS.DRAFT]: 'Черновик',
  [PROJECT_STATUS.IN_PROGRESS]: 'В процессе',
  [PROJECT_STATUS.REVIEW]: 'На проверке',
  [PROJECT_STATUS.COMPLETED]: 'Завершён',
}

export const PROJECT_TYPE = {
  FULL_WITH_SUPERVISION: 'full_with_supervision',
  FULL: 'full',
  SKETCH: 'sketch',
  VISUALIZATION: 'visualization',
  DRAWINGS: 'drawings',
}

export const PROJECT_TYPE_LABELS = {
  [PROJECT_TYPE.FULL_WITH_SUPERVISION]: 'Полный проект + авторский надзор',
  [PROJECT_TYPE.FULL]: 'Полный проект',
  [PROJECT_TYPE.SKETCH]: 'Эскизный проект',
  [PROJECT_TYPE.VISUALIZATION]: 'Проект 3D-визуализации',
  [PROJECT_TYPE.DRAWINGS]: 'Комплект рабочих чертежей',
}

export const PROJECT_TYPE_DESCRIPTIONS = {
  [PROJECT_TYPE.FULL_WITH_SUPERVISION]: 'Полный комплекс услуг с авторским надзором',
  [PROJECT_TYPE.FULL]: 'Полный комплекс услуг без авторского надзора',
  [PROJECT_TYPE.SKETCH]: 'Базовая концепция будущего интерьера — без 3D-визуализации и чертежей',
  [PROJECT_TYPE.VISUALIZATION]: 'Подходит для визуализации идеи без проработки чертежей',
  [PROJECT_TYPE.DRAWINGS]: 'Техническая документация для реализации проекта на стройке',
}

export const OBJECT_TYPE = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  SOCIAL: 'social',
  COMMERCIAL: 'commercial',
}

export const OBJECT_TYPE_LABELS = {
  [OBJECT_TYPE.APARTMENT]: 'Квартира',
  [OBJECT_TYPE.HOUSE]: 'Частный дом',
  [OBJECT_TYPE.SOCIAL]: 'Социальный объект',
  [OBJECT_TYPE.COMMERCIAL]: 'Коммерческая недвижимость',
}

const makeSections = (overrides = {}) => ({
  timeline: {
    steps: [
      { id: 1, title: 'Замеры и брифинг', date: '2024-09-15', completed: true },
      { id: 2, title: 'Планировка', date: '2024-10-01', completed: true },
      { id: 3, title: 'Коллажи', date: '2024-10-20', completed: true },
      { id: 4, title: 'Визуализации', date: '2024-11-10', completed: true },
      { id: 5, title: 'Чертежи', date: '2024-11-25', completed: false },
      { id: 6, title: 'Спецификация', date: '2024-12-10', completed: false },
      { id: 7, title: 'Авторский надзор', date: '2025-01-15', completed: false },
    ],
  },
  contract: { pdfUrl: '/mock/contract.pdf', title: 'Договор на дизайн-проект' },
  floorPlan: {
    images: [
      { id: 1, src: 'https://placehold.co/800x600/f5f5f5/999?text=План+1', alt: 'Планировка — вариант 1' },
      { id: 2, src: 'https://placehold.co/800x600/f5f5f5/999?text=План+2', alt: 'Планировка — вариант 2' },
    ],
    videoUrl: 'https://placehold.co/800x450/f5f5f5/999?text=3D+Обзор',
    videoTitle: 'Видеозапись 3D-обзора',
  },
  floorPlanApproval: { pdfUrl: '/mock/floor-plan-approval.pdf', title: 'Утверждение планировки' },
  collages: {
    items: [
      { id: 1, src: 'https://placehold.co/600x800/f0f0f0/666?text=Коллаж+Гостиная', alt: 'Гостиная' },
      { id: 2, src: 'https://placehold.co/600x800/f0f0f0/666?text=Коллаж+Спальня', alt: 'Спальня' },
      { id: 3, src: 'https://placehold.co/600x800/f0f0f0/666?text=Коллаж+Кухня', alt: 'Кухня' },
      { id: 4, src: 'https://placehold.co/600x800/f0f0f0/666?text=Коллаж+Ванная', alt: 'Ванная' },
    ],
  },
  collagesApproval: { pdfUrl: '/mock/collages-approval.pdf', title: 'Утверждение коллажей' },
  visualizations: {
    tabs: [
      {
        id: 'living', title: 'Гостиная',
        images: [
          { id: 1, src: 'https://placehold.co/900x600/e8e8e8/555?text=Виз+Гостиная+1', alt: 'Гостиная — вид 1' },
          { id: 2, src: 'https://placehold.co/900x600/e8e8e8/555?text=Виз+Гостиная+2', alt: 'Гостиная — вид 2' },
        ],
      },
      {
        id: 'bedroom', title: 'Спальня',
        images: [
          { id: 3, src: 'https://placehold.co/900x600/e8e8e8/555?text=Виз+Спальня+1', alt: 'Спальня — вид 1' },
        ],
      },
      {
        id: 'kitchen', title: 'Кухня',
        images: [
          { id: 4, src: 'https://placehold.co/900x600/e8e8e8/555?text=Виз+Кухня+1', alt: 'Кухня — вид 1' },
          { id: 5, src: 'https://placehold.co/900x600/e8e8e8/555?text=Виз+Кухня+2', alt: 'Кухня — вид 2' },
        ],
      },
    ],
  },
  drawings: {
    items: [
      { id: 1, src: 'https://placehold.co/600x800/fafafa/888?text=Чертёж+1', alt: 'Чертёж — план' },
      { id: 2, src: 'https://placehold.co/600x800/fafafa/888?text=Чертёж+2', alt: 'Чертёж — разрез' },
      { id: 3, src: 'https://placehold.co/600x800/fafafa/888?text=Чертёж+3', alt: 'Чертёж — фасад' },
      { id: 4, src: 'https://placehold.co/600x800/fafafa/888?text=Чертёж+4', alt: 'Чертёж — узел' },
      { id: 5, src: 'https://placehold.co/600x800/fafafa/888?text=Чертёж+5', alt: 'Чертёж — сечение' },
      { id: 6, src: 'https://placehold.co/600x800/fafafa/888?text=Чертёж+6', alt: 'Чертёж — детали' },
    ],
  },
  drawingsApproval: { pdfUrl: '/mock/drawings-approval.pdf', title: 'Утверждение чертежей' },
  specification: {
    excelUrl: '/mock/specification.xlsx',
    items: [
      { id: 1, category: 'Мебель', name: 'Диван угловой', brand: 'IKEA', qty: 1, price: 89900 },
      { id: 2, category: 'Мебель', name: 'Кресло', brand: 'Leroy Merlin', qty: 2, price: 24500 },
      { id: 3, category: 'Освещение', name: 'Люстра', brand: 'Artemide', qty: 1, price: 45000 },
      { id: 4, category: 'Освещение', name: 'Бра настенное', brand: 'Flos', qty: 4, price: 12800 },
      { id: 5, category: 'Отделка', name: 'Ламинат дуб', brand: 'Tarkett', qty: 35, price: 1890 },
      { id: 6, category: 'Сантехника', name: 'Смеситель', brand: 'Grohe', qty: 2, price: 15700 },
      { id: 7, category: 'Декор', name: 'Шторы', brand: 'Zara Home', qty: 3, price: 8500 },
      { id: 8, category: 'Декор', name: 'Ковер', brand: 'IKEA', qty: 1, price: 12999 },
    ],
  },
  specificationApproval: { pdfUrl: '/mock/specification-approval.pdf', title: 'Утверждение спецификации' },
  finalProject: {
    items: [
      { id: 1, src: 'https://placehold.co/600x800/e0e0e0/444?text=Финал+1', alt: 'Финальный рендер 1' },
      { id: 2, src: 'https://placehold.co/800x600/e0e0e0/444?text=Финал+2', alt: 'Финальный рендер 2' },
      { id: 3, src: 'https://placehold.co/600x800/e0e0e0/444?text=Финал+3', alt: 'Финальный рендер 3' },
      { id: 4, src: 'https://placehold.co/800x600/e0e0e0/444?text=Финал+4', alt: 'Финальный рендер 4' },
      { id: 5, src: 'https://placehold.co/600x800/e0e0e0/444?text=Финал+5', alt: 'Финальный рендер 5' },
    ],
  },
  authorSupervision: {
    diary: [
      { id: 1, date: '2025-01-20', title: 'Выезд на объект', description: 'Контроль демонтажных работ' },
      { id: 2, date: '2025-02-05', title: 'Проверка черновых работ', description: 'Стяжка, штукатурка' },
    ],
    pdfUrl: '/mock/author-supervision.pdf',
    title: 'Журнал авторского надзора',
  },
  ...overrides,
})

export const mockProjects = [
  {
    id: '1',
    title: 'Квартира на Патриарших',
    client: 'Алексей М.',
    city: 'Москва',
    area: 85.2,
    year: 2024,
    status: PROJECT_STATUS.IN_PROGRESS,
    createdAt: '2024-09-15',
    updatedAt: '2024-12-01',
    passwordHash: '$2b$10$JlUlOXEGTbzW6fPkxY.DhuWFOLSFTl62/AIfiku4b9078vnrZ4q8i',
    preview: 'https://placehold.co/400x250/f5f5f5/999?text=Патриарших',
    sections: makeSections(),
  },
  {
    id: '2',
    title: 'Дом в Барвихе',
    client: 'Елена К.',
    status: PROJECT_STATUS.DRAFT,
    createdAt: '2025-01-10',
    updatedAt: '2025-02-20',
    passwordHash: '$2b$10$JlUlOXEGTbzW6fPkxY.DhuWFOLSFTl62/AIfiku4b9078vnrZ4q8i',
    preview: 'https://placehold.co/400x250/e8e8e8/666?text=Барвиха',
    sections: makeSections({
      timeline: {
        steps: [
          { id: 1, title: 'Замеры и брифинг', date: '2025-01-10', completed: true },
          { id: 2, title: 'Планировка', date: '2025-02-01', completed: false },
          { id: 3, title: 'Коллажи', date: '2025-03-01', completed: false },
        ],
      },
    }),
  },
  {
    id: '3',
    title: 'Офис на Тверской',
    client: 'Студия ��Арт»',
    status: PROJECT_STATUS.COMPLETED,
    createdAt: '2024-03-01',
    updatedAt: '2024-09-30',
    passwordHash: '$2b$10$JlUlOXEGTbzW6fPkxY.DhuWFOLSFTl62/AIfiku4b9078vnrZ4q8i',
    preview: 'https://placehold.co/400x250/dde0e4/555?text=Тверская',
    sections: makeSections({
      timeline: {
        steps: [
          { id: 1, title: 'Замеры и брифинг', date: '2024-03-01', completed: true },
          { id: 2, title: 'Планировка', date: '2024-04-01', completed: true },
          { id: 3, title: 'Коллажи', date: '2024-05-01', completed: true },
          { id: 4, title: 'Визуализации', date: '2024-06-01', completed: true },
          { id: 5, title: 'Чертежи', date: '2024-07-01', completed: true },
          { id: 6, title: 'Спецификация', date: '2024-08-01', completed: true },
          { id: 7, title: 'Авторский надзор', date: '2024-09-01', completed: true },
        ],
      },
    }),
  },
  {
    id: '4',
    title: 'Лофт в Петербурге',
    client: 'Дмитрий В.',
    status: PROJECT_STATUS.REVIEW,
    createdAt: '2024-11-05',
    updatedAt: '2025-01-28',
    passwordHash: '$2b$10$JlUlOXEGTbzW6fPkxY.DhuWFOLSFTl62/AIfiku4b9078vnrZ4q8i',
    preview: 'https://placehold.co/400x250/eee/777?text=Лофт+СПб',
    sections: makeSections({
      timeline: {
        steps: [
          { id: 1, title: 'Замеры и брифинг', date: '2024-11-05', completed: true },
          { id: 2, title: 'Планировка', date: '2024-12-01', completed: true },
          { id: 3, title: 'Коллажи', date: '2024-12-20', completed: true },
          { id: 4, title: 'Визуализации', date: '2025-01-15', completed: false },
          { id: 5, title: 'Чертежи', date: '2025-02-10', completed: false },
        ],
      },
    }),
  },
]

/** Find a project by ID */
export function getMockProject(id) {
  return mockProjects.find((p) => p.id === id) ?? mockProjects[0]
}
