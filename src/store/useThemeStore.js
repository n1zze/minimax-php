import { create } from 'zustand'

const STORAGE_KEY = 'mimimax_theme'

function readInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

export const useThemeStore = create((set, get) => ({
  theme: readInitialTheme(),

  init: () => {
    applyTheme(get().theme)
  },

  setTheme: (theme) => {
    if (theme !== 'light' && theme !== 'dark') return
    applyTheme(theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
    set({ theme })
  },

  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))
