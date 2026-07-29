import { create } from 'zustand'
import { api } from '../api'

const TOKEN_KEY = 'mimimax_token'
const AUTH_KEY = 'mimimax_auth'

function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistAuth(auth) {
  if (auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    return
  }

  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

function persistToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    return
  }

  localStorage.removeItem(TOKEN_KEY)
}

export const ROLE_DESIGNER = 'designer'
export const ROLE_CLIENT = 'client'
export const ROLE_VISUALIZER = 'visualizer'

export const ROLE_LABELS = {
  [ROLE_DESIGNER]: 'Дизайнер',
  [ROLE_CLIENT]: 'Клиент',
  [ROLE_VISUALIZER]: 'Визуализатор',
}

export const useAuthStore = create((set) => ({
  user: getStoredAuth(),
  loading: false,
  error: null,

  loginAsDesigner: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { token, user } = await api.login(email, password)
      persistToken(token)
      persistAuth(user)
      set({ user, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  loginAsClient: async (projectId, password) => {
    set({ loading: true, error: null })
    try {
      const { token, user, projectTitle } = await api.unlock(projectId, password)
      const authUser = user || {
        id: `client-${projectId}`,
        role: ROLE_CLIENT,
        projectId,
        name: projectTitle || 'Клиент',
      }

      persistToken(token)
      persistAuth(authUser)
      set({ user: authUser, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  loginAsVisualizer: async (projectId, visualizerToken) => {
    set({ loading: true, error: null })
    try {
      const { token, user, projectTitle } = await api.validateVisualizerToken(projectId, visualizerToken.trim())
      const authUser = user || {
        id: `visualizer-${projectId}`,
        role: ROLE_VISUALIZER,
        projectId,
        visualizerProjectId: projectId,
        name: projectTitle || 'Визуализатор',
      }

      persistToken(token)
      persistAuth(authUser)
      set({ user: authUser, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  hydrateFromToken: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      return null
    }

    set({ loading: true })
    try {
      const { user } = await api.me()
      persistAuth(user)
      set({ user, loading: false, error: null })
      return user
    } catch {
      persistAuth(null)
      set({ user: null, loading: false, error: null })
      return null
    }
  },

  logout: () => {
    persistAuth(null)
    set({ user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))
