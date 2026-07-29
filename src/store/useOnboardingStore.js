import { create } from 'zustand'

const STORAGE_KEY_PREFIX = 'mimimax_onboarding_'

function getKey(role) {
  return `${STORAGE_KEY_PREFIX}${role || 'unknown'}`
}

function readSeen(role) {
  try {
    return localStorage.getItem(getKey(role)) === '1'
  } catch {
    return true // fail-safe: don't show onboarding on error
  }
}

function writeSeen(role) {
  try {
    localStorage.setItem(getKey(role), '1')
  } catch {
    // ignore
  }
}

export const useOnboardingStore = create((set) => ({
  isOpen: false,
  step: 0,
  role: null,

  /**
   * Start onboarding for a role if user hasn't seen it yet.
   * Returns true if onboarding was started.
   */
  maybeStart: (role) => {
    if (!role) return false
    if (readSeen(role)) return false
    set({ isOpen: true, step: 0, role })
    return true
  },

  /** Force-start onboarding (e.g. from a Help button) */
  start: (role) => {
    set({ isOpen: true, step: 0, role })
  },

  next: () => set((state) => ({ step: state.step + 1 })),
  prev: () => set((state) => ({ step: Math.max(0, state.step - 1) })),

  finish: () => set((state) => {
    if (state.role) writeSeen(state.role)
    return { isOpen: false, step: 0 }
  }),

  skip: () => set((state) => {
    if (state.role) writeSeen(state.role)
    return { isOpen: false, step: 0 }
  }),
}))
