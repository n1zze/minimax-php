import { useState, useCallback } from 'react'

/**
 * useVersionedFiles — хук для управления версиями файлов в секции.
 * 
 * Структура данных:
 * {
 *   versions: [
 *     { id: 1, pdfUrl: '...', title: '...' },  // version 1
 *     { id: 2, pdfUrl: '...', title: '...' },  // version 2
 *     ...
 *   ],
 *   currentVersion: 1  // which version is currently shown
 * }
 * 
 * @param {Object} initialData - { versions: [], currentVersion: 1 }
 */
export function useVersionedFiles(initialData = { versions: [], currentVersion: 1 }) {
  const [versions, setVersions] = useState(initialData.versions || [])
  const [currentVersion, setCurrentVersion] = useState(initialData.currentVersion || 1)

  const totalVersions = versions.length

  /**
   * Add a new version (e.g. new PDF upload)
   */
  const addVersion = useCallback((versionData) => {
    const newId = versions.length > 0 ? Math.max(...versions.map(v => v.id)) + 1 : 1
    const newVersion = { id: newId, ...versionData }
    setVersions(prev => [...prev, newVersion])
    setCurrentVersion(newId)
    return newId
  }, [versions])

  /**
   * Update an existing version
   */
  const updateVersion = useCallback((id, data) => {
    setVersions(prev => prev.map(v => v.id === id ? { ...v, ...data } : v))
  }, [])

  /**
   * Remove a version
   */
  const removeVersion = useCallback((id) => {
    setVersions(prev => {
      const filtered = prev.filter(v => v.id !== id)
      // If removed version was current or before current, adjust currentVersion
      if (currentVersion >= id && currentVersion > 1) {
        setCurrentVersion(prevCV => Math.max(1, prevCV - 1))
      }
      return filtered
    })
  }, [currentVersion])

  /**
   * Go to specific version
   */
  const goToVersion = useCallback((versionId) => {
    const maxId = versions.length > 0 ? Math.max(...versions.map(v => v.id)) : 0
    if (versionId >= 1 && versionId <= maxId) {
      setCurrentVersion(versionId)
    }
  }, [versions])

  /**
   * Get current version data
   */
  const getCurrentVersion = useCallback(() => {
    return versions.find(v => v.id === currentVersion) || null
  }, [versions, currentVersion])

  return {
    versions,
    currentVersion,
    totalVersions,
    setCurrentVersion: goToVersion,
    addVersion,
    updateVersion,
    removeVersion,
    getCurrentVersion,
  }
}