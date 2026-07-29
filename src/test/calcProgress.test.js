import { describe, it, expect } from 'vitest'
import { calcProgress } from '../hooks/calcProgress'
import { mockProjects } from '../features/projects/mockProject'

describe('calcProgress', () => {
  it('returns 0 for null sections', () => {
    expect(calcProgress(null)).toBe(0)
  })

  it('returns 0 for undefined sections', () => {
    expect(calcProgress(undefined)).toBe(0)
  })

  it('returns 0 for empty object', () => {
    expect(calcProgress({})).toBe(0)
  })

  it('returns 100 for fully completed project', () => {
    const project = mockProjects[2] // completed — all timeline steps done + all sections filled
    const result = calcProgress(project.sections)
    expect(result).toBe(100)
  })

  it('returns > 0 when at least one section is filled', () => {
    const project = mockProjects[0] // in_progress — has content in most sections
    const result = calcProgress(project.sections)
    expect(result).toBeGreaterThan(0)
  })

  it('counts each section correctly', () => {
    const sections = {
      timeline: { steps: [{ completed: true }] },
      contract: { pdfUrl: '/mock/contract.pdf' },
      floorPlan: { images: [{ id: 1 }] },
      floorPlanApproval: { pdfUrl: '/mock/approval.pdf' },
      collages: { items: [] },
      collagesApproval: { pdfUrl: null },
      visualizations: { tabs: [] },
      drawings: { items: [] },
      drawingsApproval: { pdfUrl: null },
      specification: { items: [] },
      specificationApproval: { pdfUrl: null },
      finalProject: { items: [] },
      authorSupervision: { diary: [] },
    }
    // 4 out of 13 sections are filled
    const result = calcProgress(sections)
    expect(result).toBe(Math.round((4 / 13) * 100))
  })

  it('returns correct progress for partially filled sections', () => {
    const sections = {
      timeline: { steps: [{ completed: true }] },
      contract: { pdfUrl: null },
      floorPlan: { images: [] },
      floorPlanApproval: { pdfUrl: null },
      collages: { items: [{ id: 1 }] },
      collagesApproval: { pdfUrl: null },
      visualizations: { tabs: [] },
      drawings: { items: [] },
      drawingsApproval: { pdfUrl: null },
      specification: { items: [] },
      specificationApproval: { pdfUrl: null },
      finalProject: { items: [] },
      authorSupervision: { diary: [] },
    }
    // 2 out of 13: timeline (some completed) + collages (items exist)
    const result = calcProgress(sections)
    expect(result).toBe(Math.round((2 / 13) * 100))
  })
})
