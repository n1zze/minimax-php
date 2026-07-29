import { create } from 'zustand'
import { api, withAuthToken } from '../api'

// Track blob URLs for cleanup
const blobUrlRegistry = new Set()

function trackBlobUrl(url) {
  if (url && url.startsWith('blob:')) blobUrlRegistry.add(url)
  return url
}

function revokeAllBlobUrls() {
  for (const url of blobUrlRegistry) {
    URL.revokeObjectURL(url)
  }
  blobUrlRegistry.clear()
}

/**
 * Walk through project sections and append auth token to /api/files/* URLs.
 * Idempotent — safe to call multiple times (won't double-add tokens).
 */
function applyAuthTokens(project) {
  if (!project?.sections) return project
  const sections = project.sections

  function tokenize(url) {
    if (!url || typeof url !== 'string') return url
    // Don't re-tokenize URLs that already have one
    if (url.includes('t=') && url.includes('/api/files/')) return url
    return withAuthToken(url)
  }

  for (const [, section] of Object.entries(sections)) {
    if (!section) continue
    if (typeof section.pdfUrl === 'string') {
      section.pdfUrl = tokenize(section.pdfUrl)
    }
    if (Array.isArray(section.images)) {
      for (const img of section.images) {
        if (img?.src) img.src = tokenize(img.src)
        if (img?.serverUrl) img.serverUrl = tokenize(img.serverUrl)
      }
    }
    if (Array.isArray(section.items)) {
      for (const item of section.items) {
        if (item?.src) item.src = tokenize(item.src)
        if (item?.serverUrl) item.serverUrl = tokenize(item.serverUrl)
      }
    }
    if (Array.isArray(section.tabs)) {
      for (const tab of section.tabs) {
        if (Array.isArray(tab.images)) {
          for (const img of tab.images) {
            if (img?.src) img.src = tokenize(img.src)
            if (img?.serverUrl) img.serverUrl = tokenize(img.serverUrl)
          }
        }
      }
    }
  }
  if (typeof project.thumbnailPath === 'string') {
    project.thumbnailPath = tokenize(project.thumbnailPath)
  }
  return project
}

/**
 * Clean up project data before saving:
 * - Remove blob: URLs (they won't work after reload)
 * - Keep base64 data for persistence
 */
function cleanupProjectForSave(project) {
  const sections = project.sections || {}
  const cleanedSections = {}

  // Strip any ?t=TOKEN query from /api/files/* URLs before saving.
  // The token is short-lived; we re-attach it on read.
  function stripToken(url) {
    if (!url || typeof url !== 'string') return url
    if (!url.includes('/api/files/') || !url.includes('t=')) return url
    return url.replace(/([?&])t=[^&]*(&|$)/, (_m, p, after) => (after ? p : ''))
                .replace(/[?&]$/, '')
  }

  for (const [sectionKey, section] of Object.entries(sections)) {
    if (!section) continue
    
    const cleaned = { ...section }

    // ── PDF fields: strip blob: URLs (they die on reload) ──────────────────
    // Keep server URLs (/api/files/...) and data: URLs (base64 fallback).
    if (typeof cleaned.pdfUrl === 'string' && cleaned.pdfUrl.startsWith('blob:')) {
      cleaned.pdfUrl = ''
    } else if (typeof cleaned.pdfUrl === 'string') {
      cleaned.pdfUrl = stripToken(cleaned.pdfUrl)
    }

    // Handle images arrays
    if (cleaned.images && Array.isArray(cleaned.images)) {
      cleaned.images = cleaned.images.map((img) => {
        const next = { ...img }
        if (next.serverUrl) next.serverUrl = stripToken(next.serverUrl)
        if (next.src && !next.src.startsWith('blob:')) {
          next.src = stripToken(next.src)
          return next
        }
        if (next.base64) return { ...next, src: next.base64 }
        return next
      })
    }
    
    // Handle items arrays (collages, drawings, finalProject)
    if (cleaned.items && Array.isArray(cleaned.items)) {
      cleaned.items = cleaned.items.map((item) => {
        const next = { ...item }
        if (next.serverUrl) next.serverUrl = stripToken(next.serverUrl)
        if (next.src && !next.src.startsWith('blob:')) {
          next.src = stripToken(next.src)
          return next
        }
        if (next.base64) return { ...next, src: next.base64 }
        return next
      })
    }
    
    // Handle visualizations.tabs
    if (cleaned.tabs && Array.isArray(cleaned.tabs)) {
      cleaned.tabs = cleaned.tabs.map((tab) => {
        if (!tab.images) return tab
        return {
          ...tab,
          images: tab.images.map((img) => {
            const next = { ...img }
            if (next.serverUrl) next.serverUrl = stripToken(next.serverUrl)
            if (next.src && !next.src.startsWith('blob:')) {
              next.src = stripToken(next.src)
              return next
            }
            if (next.base64) return { ...next, src: next.base64 }
            return next
          }),
        }
      })
    }
    
    cleanedSections[sectionKey] = cleaned
  }

  const cleanedProject = { ...project, sections: cleanedSections }
  // Also strip token from thumbnailPath
  if (typeof cleanedProject.thumbnailPath === 'string') {
    cleanedProject.thumbnailPath = stripToken(cleanedProject.thumbnailPath)
  }
  return cleanedProject
}

/**
 * Normalize raw API project into a uniform shape
 * so all components can safely consume `project.sections`.
 */
function normalizeProject(raw) {
  if (!raw) return null
  const d = raw.data || raw.sections || {}

  return {
    id: raw.id,
    title: raw.title || '',
    clientName: raw.clientName || raw.client || '',
    city: raw.city || raw.data?.city || '',
    area: raw.area ?? raw.data?.area ?? null,
    year: raw.year ?? raw.data?.year ?? null,
    status: raw.status || 'draft',
    projectType: raw.projectType || raw.data?.projectType || '',
    pricePerSqm: raw.pricePerSqm ?? raw.data?.pricePerSqm ?? null,
    objectType: raw.objectType || raw.data?.objectType || '',
    thumbnailPath: raw.thumbnailPath || raw.preview || extractDefaultThumbnail(d),
    sections: {
      brief: normPdf(d.briefPdf || d.brief),
      timeline: normTimeline(d.timeline),
      contract: normPdf(d.contractPdf || d.contract),
      floorPlan: normFloorPlan(d.floorPlan),
      floorPlanApproval: normPdf(d.floorPlanApprovalPdf || d.floorPlanApproval),
      collages: normImageList(d.collages),
      collagesApproval: normPdf(d.collagesApprovalPdf || d.collagesApproval),
      visualizations: normVisualizations(d.visualizations),
      drawings: normImageList(d.drawings),
      drawingsApproval: normPdf(d.drawingsApprovalPdf || d.drawingsApproval),
      specification: normSpecification(d.specification),
      specificationApproval: normPdf(d.specificationApprovalPdf || d.specificationApproval),
      finalProject: normFinalProject(d.finalProject),
      authorSupervision: normAuthorSupervision(d.authorSupervision),
    },
    // Keep raw data for editor
    _raw: raw,
  }
}

function extractDefaultThumbnail(data) {
  // Try to get thumbnail from various sections in order of priority
  if (data.floorPlan?.images?.length > 0) {
    const img = data.floorPlan.images[0]
    return typeof img === 'string' ? img : img.src
  }
  if (data.visualizations?.length > 0 && data.visualizations[0].images?.length > 0) {
    const img = data.visualizations[0].images[0]
    return typeof img === 'string' ? img : img.src
  }
  if (data.collages?.length > 0) {
    const img = data.collages[0]
    return typeof img === 'string' ? img : img.src
  }
  if (data.finalProject?.length > 0) {
    const img = data.finalProject[0]
    return typeof img === 'string' ? img : img.src
  }
  return null
}

/**
 * Convert base64 string to a blob URL
 */
function base64ToBlobUrl(base64) {
  if (!base64) return null
  try {
    const byteString = atob(base64.split(',')[1] || base64)
    const mimeString = base64.split(',')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg'
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([ab], { type: mimeString })
    return trackBlobUrl(URL.createObjectURL(blob))
  } catch (e) {
    return null
  }
}

/**
 * Regenerate blob URLs for images in project sections
 */
async function regenerateImageUrls(project) {
  if (!project?.sections) return project
  
  const { dbGetFile } = await import('../db')
  const sections = project.sections
  
  for (const [, section] of Object.entries(sections)) {
    // Handle floorPlan.images
    if (section.images && Array.isArray(section.images)) {
      for (const img of section.images) {
        if (img.src && (img.src.startsWith('blob:') || img.src.startsWith('data:'))) {
          try {
            const file = await dbGetFile(img.id)
            if (file?.blob) {
              img.src = trackBlobUrl(URL.createObjectURL(file.blob))
            } else if (file?.data) {
              img.src = base64ToBlobUrl(file.data)
            } else if (img.base64) {
              img.src = base64ToBlobUrl(img.base64)
            }
          } catch (e) {
            // silent
          }
        }
      }
    }
    // Handle items arrays (collages, drawings, finalProject, etc.)
    if (section.items && Array.isArray(section.items)) {
      for (const item of section.items) {
        if (item.src && (item.src.startsWith('blob:') || item.src.startsWith('data:'))) {
          try {
            const file = await dbGetFile(item.id)
            if (file?.blob) {
              item.src = trackBlobUrl(URL.createObjectURL(file.blob))
            } else if (file?.data) {
              item.src = base64ToBlobUrl(file.data)
            } else if (item.base64) {
              item.src = base64ToBlobUrl(item.base64)
            }
          } catch (e) {
            // silent
          }
        }
      }
    }
    // Handle visualizations.tabs
    if (section.tabs && Array.isArray(section.tabs)) {
      for (const tab of section.tabs) {
        if (tab.images && Array.isArray(tab.images)) {
          for (const img of tab.images) {
            if (img.src && (img.src.startsWith('blob:') || img.src.startsWith('data:'))) {
              try {
                const file = await dbGetFile(img.id)
                if (file?.blob) {
                  img.src = trackBlobUrl(URL.createObjectURL(file.blob))
                } else if (file?.data) {
                  img.src = base64ToBlobUrl(file.data)
                } else if (img.base64) {
                  img.src = base64ToBlobUrl(img.base64)
                }
              } catch (e) {
                // silent
              }
            }
          }
        }
      }
    }
  }
  
  return project
}

function normTimeline(t) {
  if (!t) return { steps: [] }
  const steps = Array.isArray(t) ? t : t.steps
  if (Array.isArray(steps)) {
    return {
      steps: steps.map((step, index) => ({
        id: step.id ?? `timeline-${index}-${step.date ?? ''}`,
        title: step.title ?? step.step ?? '',
        date: step.date ?? '',
        completed: step.completed ?? step.status === 'done',
      })),
    }
  }
  return { steps: [] }
}

function normPdf(pdf) {
  if (!pdf) return { title: '', pdfUrl: '' }
  if (typeof pdf === 'string') return { title: '', pdfUrl: pdf }
  return {
    title: pdf.title || '',
    pdfUrl: pdf.url || pdf.pdfUrl || '',
    pdfName: pdf.name || pdf.pdfName || '',
  }
}

function normFloorPlan(fp) {
  if (!fp) return { images: [], videoUrl: '', videoTitle: '' }
  if (typeof fp === 'string') return { images: [{ id: 'fp-0', src: fp, alt: '' }], videoUrl: '', videoTitle: '' }
  return {
    images: Array.isArray(fp.images)
      ? fp.images.map((img, idx) => {
          if (typeof img === 'string') return { id: `fp-${idx}`, src: img, alt: '' }
          return img
        })
      : [],
    videoUrl: fp.videoUrl || fp.video || '',
    videoTitle: fp.videoTitle || '',
  }
}

function normImageList(val) {
  if (!val) return { items: [] }
  if (Array.isArray(val)) {
    return {
      items: val.map((item, idx) => {
        if (typeof item === 'string') {
          return { id: `img-${idx}`, src: item, alt: '' }
        }
        return item
      }),
    }
  }
  if (val.items) return { items: Array.isArray(val.items) ? val.items.map((item, idx) => {
    if (typeof item === 'string') return { id: `item-${idx}`, src: item, alt: '' }
    return item
  }) : [] }
  if (val.images) return { items: Array.isArray(val.images) ? val.images.map((item, idx) => {
    if (typeof item === 'string') return { id: `img-${idx}`, src: item, alt: '' }
    return item
  }) : [] }
  return { items: [] }
}

function normFinalProject(fp) {
  const base = normImageList(fp)
  if (!fp) return base
  return {
    ...base,
    pdfUrl: fp.pdfUrl || fp.url || '',
    title: fp.title || '',
  }
}

function normVisualizations(val) {
  if (!val) return { tabs: [] }
  if (Array.isArray(val)) {
    return {
      tabs: val.map((tab, idx) => ({
        id: tab.id ?? `vis-${idx}`,
        title: tab.name || tab.title || `Комната ${idx + 1}`,
        versionNumber: tab.versionNumber,
        date: tab.date,
        author: tab.author,
        status: tab.status,
        source: tab.source,
        images: Array.isArray(tab.images)
          ? tab.images.map((img, imgIdx) => {
              if (typeof img === 'string') {
                return { id: `img-${imgIdx}`, src: img, alt: '' }
              }
              return {
                id: img.id || `img-${imgIdx}`,
                src: img.src || '',
                alt: img.alt || '',
                name: img.name || '',
                uploadedBy: img.uploadedBy || null,
                serverUrl: img.serverUrl || null,
              }
            })
          : [],
      })),
    }
  }
  if (val.tabs) {
    return { tabs: val.tabs }
  }
  return { tabs: [] }
}

function normSpecification(val) {
  if (!val) return { items: [] }
  if (val.items) return { items: Array.isArray(val.items) ? val.items : [] }
  return { items: [] }
}

function normAuthorSupervision(val) {
  if (!val) return { diary: [], title: '', pdfUrl: '' }
  if (typeof val === 'string') return { diary: [], title: '', pdfUrl: '' }
  return {
    diary: Array.isArray(val.diary) ? val.diary : [],
    title: val.title || val.reportPdf?.title || '',
    pdfUrl: val.reportPdf?.url || val.pdfUrl || '',
  }
}

let loadProjectSeq = 0
let loadProjectsListSeq = 0

export const useProjectStore = create((set, get) => ({
  project: null,
  isUnlocked: false,
  isEditMode: false,
  projectsList: [],
  loading: false,
  error: null,

  setProject: (project) => set({ project }),
  setProjectsList: (listOrFn) => set((state) => {
    if (typeof listOrFn === 'function') {
      return { projectsList: listOrFn(state.projectsList || []) }
    }
    return { projectsList: listOrFn }
  }),

  /** Load all projects from API */
  loadProjectsList: async () => {
    const seq = ++loadProjectsListSeq
    set({ loading: true })
    try {
      // First try to fetch from API
      const apiProjects = await api.getProjects()
      if (seq !== loadProjectsListSeq) return get().projectsList
      if (apiProjects && apiProjects.length > 0) {
        // Tokenize thumbnail URLs for image rendering
        const tokenized = apiProjects.map((p) => {
          if (p.thumbnailPath && typeof p.thumbnailPath === 'string') {
            p.thumbnailPath = withAuthToken(p.thumbnailPath)
          }
          return p
        })
        // Save to IndexedDB for offline access
        try {
          const { dbSaveProject } = await import('../db')
          // Sync: update existing and add new
          for (const proj of tokenized) {
            await dbSaveProject(proj)
          }
        } catch (dbErr) {
          // silent
        }
        set({ projectsList: tokenized, loading: false })
        return tokenized
      }
      // If API returns empty, still update the list to empty array
      // This ensures new local projects appear correctly
      set({ projectsList: [], loading: false })
      // Check IndexedDB
      const { dbGetAllProjects, dbSeedIfNeeded } = await import('../db')
      const dbProjects = await dbGetAllProjects()
      if (dbProjects.length > 0) {
        set({ projectsList: dbProjects, loading: false })
        return dbProjects
      }
      // If DB is empty, seed with mock data
      const { mockProjects } = await import('../features/projects/mockProject')
      await dbSeedIfNeeded(mockProjects)
      set({ projectsList: mockProjects, loading: false })
      return mockProjects
    } catch (err) {
      // Fallback to IndexedDB
      try {
        const { dbGetAllProjects } = await import('../db')
        const dbProjects = await dbGetAllProjects()
        if (dbProjects.length > 0) {
          set({ projectsList: dbProjects, loading: false })
          return dbProjects
        }
      } catch (dbErr) {
        // silent
      }
      set({ loading: false })
      return []
    }
  },

  /** Load a single project from API (normalized) */
  loadProject: async (id) => {
    const seq = ++loadProjectSeq
    set({ loading: true, error: null })
    try {
      // Try API first
      const raw = await api.getProject(id)
      if (seq !== loadProjectSeq) return null
      if (raw) {
        // Revoke old blob URLs before loading new ones
        revokeAllBlobUrls()
        let project = normalizeProject(raw)
        project = applyAuthTokens(project)
        project = await regenerateImageUrls(project)
        if (seq !== loadProjectSeq) return null
        try {
          const { dbSaveProject } = await import('../db')
          await dbSaveProject(project)
        } catch (dbErr) {
          // silent
        }
        set({ project, loading: false })
        return project
      }
      set({ loading: false })
      return null
    } catch (err) {
      if (seq !== loadProjectSeq) return null
      try {
        const { dbGetProject } = await import('../db')
        let raw = await dbGetProject(id)
        if (raw) {
          revokeAllBlobUrls()
          let project = normalizeProject(raw)
          project = applyAuthTokens(project)
          project = await regenerateImageUrls(project)
          if (seq !== loadProjectSeq) return null
          set({ project, loading: false })
          return project
        }
      } catch (dbErr) {
        // silent
      }
      set({ loading: false, error: err.message || 'Ошибка загрузки проекта' })
      return null
    }
  },

  /** Save project via API, fallback to local storage */
  saveProject: async (project) => {
    try {
      // Add updatedAt timestamp
      const projectToSave = { ...project, updatedAt: new Date().toISOString() }
      
      // Clean up blob URLs before saving (they won't work after reload)
      const cleanedProject = cleanupProjectForSave(projectToSave)
      
      // Try to save to API first
      try {
        await api.updateProject(cleanedProject.id, cleanedProject)
      } catch (apiErr) {
        // API save failed, will save locally
      }
      
      // Always save to IndexedDB for offline access
      try {
        const { dbSaveProject } = await import('../db')
        await dbSaveProject(cleanedProject)
      } catch (dbErr) {
        throw dbErr
      }
      
      set({ project: cleanedProject })
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  updateSection: (key, value) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            sections: { ...state.project.sections, [key]: value },
          }
        : null,
    })),

  unlock: () => set({ isUnlocked: true }),
  lock: () => set({ isUnlocked: false }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setEditMode: (mode) => set({ isEditMode: mode }),
}))
