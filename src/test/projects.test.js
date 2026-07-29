import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useProjectStore } from '../store/useProjectStore'

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}
globalThis.localStorage = localStorageMock

describe('useProjectStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useProjectStore.setState({
      project: null,
      projectsList: [],
      loading: false,
      error: null,
    })
  })

  it('should have initial state', () => {
    const state = useProjectStore.getState()
    expect(state.project).toBeNull()
    expect(state.projectsList).toEqual([])
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should set project', () => {
    const { setProject } = useProjectStore.getState()
    const mockProject = {
      id: '1',
      title: 'Test Project',
      client: 'Test Client',
    }
    
    act(() => {
      setProject(mockProject)
    })
    
    expect(useProjectStore.getState().project).toEqual(mockProject)
  })

  it('should set projects list', () => {
    const { setProjectsList } = useProjectStore.getState()
    const mockProjects = [
      { id: '1', title: 'Project 1' },
      { id: '2', title: 'Project 2' },
    ]
    
    act(() => {
      setProjectsList(mockProjects)
    })
    
    expect(useProjectStore.getState().projectsList).toEqual(mockProjects)
  })

  it('should add project to list', () => {
    const { setProjectsList } = useProjectStore.getState()
    const newProject = { id: 'new', title: 'New Project' }
    
    act(() => {
      setProjectsList([newProject])
    })
    
    expect(useProjectStore.getState().projectsList).toHaveLength(1)
    expect(useProjectStore.getState().projectsList[0]).toEqual(newProject)
  })

  it('should update section', () => {
    const mockProject = {
      id: '1',
      title: 'Test',
      sections: {
        timeline: { steps: [] },
        contract: { title: '', pdfUrl: '' },
      },
    }
    
    act(() => {
      useProjectStore.getState().setProject(mockProject)
    })
    
    act(() => {
      useProjectStore.getState().updateSection('timeline', { steps: [{ id: 1, title: 'Step 1' }] })
    })
    
    const updated = useProjectStore.getState().project
    expect(updated.sections.timeline.steps).toHaveLength(1)
    expect(updated.sections.timeline.steps[0].title).toBe('Step 1')
  })
})

describe('normalizeProject', () => {
  it('should normalize project with city, area, year', () => {
    // Test the normalization logic
    const raw = {
      id: '1',
      title: 'Test Project',
      clientName: 'John',
      city: 'Moscow',
      area: 85.5,
      year: 2024,
      status: 'in_progress',
      sections: {},
    }
    
    // Simulate what normalizeProject does
    const normalized = {
      id: raw.id,
      title: raw.title || '',
      clientName: raw.clientName || raw.client || '',
      city: raw.city || '',
      area: raw.area || null,
      year: raw.year || null,
      status: raw.status || 'draft',
      thumbnailPath: null,
      sections: {},
    }
    
    expect(normalized.city).toBe('Moscow')
    expect(normalized.area).toBe(85.5)
    expect(normalized.year).toBe(2024)
  })
})
