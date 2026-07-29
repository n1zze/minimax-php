const API_URL = import.meta.env.VITE_API_URL || '/api'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

/**
 * WithToken is a no-op — tokens are sent via Authorization header only.
 * Kept for API compatibility; returns the URL unchanged.
 */
function withAuthToken(url) {
  return url
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mimimax_token')
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Add timeout to prevent hanging requests
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new ApiError(data.error || 'Ошибка запроса', res.status)
    }

    return data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new ApiError('Таймаут запроса', 408)
    }
    throw err
  }
}

// ─── Auth ──────────────────────────────────────────

export const api = {
  /** Designer login */
  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  /** Client unlock project */
  unlock(projectId, password) {
    return request(`/auth/unlock/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
  },

  /** Visualizer token validation */
  validateVisualizerToken(projectId, token) {
    return request(`/auth/visualizer/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },

  /** Get current user */
  me() {
    return request('/auth/me')
  },

  // ─── Projects ──────────────────────────────────

  /** List all projects */
  getProjects() {
    return request('/projects')
  },

  /** Get single project with data + files */
  getProject(id) {
    return request(`/projects/${id}`)
  },

  /** Public access info for unlock pages */
  getProjectAccessInfo(id) {
    return request(`/projects/${id}/access`)
  },

  /** Create project */
  createProject(data) {
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /** Update project */
  updateProject(id, data) {
    return request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /** Delete project */
  deleteProject(id) {
    return request(`/projects/${id}`, { method: 'DELETE' })
  },

  // ─── Files ─────────────────────────────────────

  /** Upload files to a project section */
  uploadFiles(projectId, section, files, onProgress) {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('mimimax_token')
      const formData = new FormData()
      formData.append('section', section)
      for (const file of files) {
        formData.append('files', file)
      }

      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve(data)
          } catch {
            reject(new ApiError('Invalid response', 500))
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText)
            reject(new ApiError(data.error || 'Upload failed', xhr.status))
          } catch {
            reject(new ApiError('Upload failed', xhr.status))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new ApiError('Network error', 0))
      })

      xhr.open('POST', `${API_URL}/projects/${projectId}/files`)
      xhr.timeout = 300000 // 5 min timeout for large file uploads
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.addEventListener('timeout', () => {
        reject(new ApiError('Таймаут загрузки файла', 408))
      })

      xhr.send(formData)
    })
  },

  /** Get file URL */
  getFileUrl(projectId, fileId) {
    return `${API_URL}/projects/${projectId}/files/${fileId}`
  },

  /** Delete a file */
  deleteFile(projectId, fileId) {
    return request(`/projects/${projectId}/files/${fileId}`, { method: 'DELETE' })
  },

  /** Send a client email notification */
  sendProjectEmailNotification(projectId, data) {
    return request(`/projects/${projectId}/notifications/email`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // ─── Notifications ─────────────────────────────

  /** List notifications for current user (last 100) */
  listNotifications() {
    return request('/notifications')
  },

  /** Unread notifications count */
  unreadNotificationsCount() {
    return request('/notifications/unread-count')
  },

  /** Mark single notification as read */
  markNotificationRead(id) {
    return request(`/notifications/${id}/read`, { method: 'POST' })
  },

  /** Mark all notifications as read */
  markAllNotificationsRead() {
    return request('/notifications/read-all', { method: 'POST' })
  },

  /** Designer creates a notification for the client */
  createNotification(projectId, data) {
    return request(`/projects/${projectId}/notifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export { ApiError, withAuthToken }
