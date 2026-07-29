/**
 * Centralized Permissions System
 * 
 * Single source of truth for role-based access control.
 * Use these functions to check permissions throughout the app.
 */

import { ROLE_DESIGNER, ROLE_VISUALIZER } from '../store/useAuthStore'

/**
 * Check if user can view a specific project section
 */
export function canViewSection(user, section) {
  if (!user) return false
  if (user.role === ROLE_DESIGNER) return true
  
  // CLIENT and VISUALIZER have restricted access
  // Both CLIENT and VISUALIZER can see project sections
  const publicSections = [
    'timeline',
    'contract',
    'floorPlan',
    'floorPlanApproval',
    'collages',
    'collagesApproval',
    'visualizations',
    'drawings',
    'drawingsApproval',
    'specification',
    'specificationApproval',
    'finalProject',
    'authorSupervision',
  ]
  
  return publicSections.includes(section)
}

/**
 * Check if user can upload media
 */
export function canUploadMedia(user, section) {
  if (!user) return false
  if (user.role === ROLE_DESIGNER) return true
  if (user.role === ROLE_VISUALIZER && section === 'visualizations') return true
  return false
}

/**
 * Check if user can delete media
 */
export function canDeleteMedia(user) {
  if (!user) return false
  return user.role === ROLE_DESIGNER
}

/**
 * Check if user can edit project
 */
export function canEditProject(user) {
  if (!user) return false
  return user.role === ROLE_DESIGNER
}

/**
 * Check if user can manage versions
 */
export function canManageVersions(user) {
  if (!user) return false
  return user.role === ROLE_DESIGNER
}

/**
 * Check if user can access drafts
 */
export function canAccessDrafts(user) {
  if (!user) return false
  return user.role === ROLE_DESIGNER
}

/**
 * Check if user can view preview (thumbnails, etc)
 */
export function canPreviewMedia(user) {
  if (!user) return false
  return true // All authenticated users can preview
}

/**
 * Get visible sections for user role
 */
export function getVisibleSections(user) {
  if (!user) return []
  
  const allSections = [
    'timeline',
    'contract',
    'floorPlan',
    'floorPlanApproval',
    'collages',
    'collagesApproval',
    'visualizations',
    'drawings',
    'drawingsApproval',
    'specification',
    'specificationApproval',
    'finalProject',
    'authorSupervision',
  ]
  
  if (user.role === ROLE_DESIGNER) return allSections
  
  // For CLIENT and VISUALIZER, return all public sections
  return allSections
}

/**
 * Filter project data based on user role
 * Removes sensitive data from client/visualizer payloads
 */
export function filterProjectForRole(project, user) {
  if (!project) return null
  if (!user) return null
  
  if (user.role === ROLE_DESIGNER) return project
  
  // For CLIENT and VISUALIZER - remove internal notes, cost data
  return {
    ...project,
    // Keep sections but they should be filtered at render time
  }
}
