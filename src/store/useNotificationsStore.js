import { create } from 'zustand'
import { api } from '../api'

const POLL_INTERVAL_MS = 30_000

export const useNotificationsStore = create((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  pollTimer: null,

  /** Fetch full list */
  loadAll: async () => {
    set({ loading: true })
    try {
      const items = await api.listNotifications()
      const arr = Array.isArray(items) ? items : []
      const unread = arr.filter((n) => !n.read).length
      set({ items: arr, unreadCount: unread, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  /** Just fetch unread count (cheap) */
  loadUnreadCount: async () => {
    try {
      const { count } = await api.unreadNotificationsCount()
      set({ unreadCount: Number(count) || 0 })
    } catch {
      // ignore
    }
  },

  markRead: async (id) => {
    try {
      await api.markNotificationRead(id)
      set((s) => {
        const items = s.items.map((n) => (n.id === id ? { ...n, read: true } : n))
        const unread = items.filter((n) => !n.read).length
        return { items, unreadCount: unread }
      })
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    try {
      await api.markAllNotificationsRead()
      set((s) => ({
        items: s.items.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }))
    } catch {
      // ignore
    }
  },

  /** Start polling for new notifications */
  startPolling: () => {
    if (get().pollTimer) return
    get().loadUnreadCount()
    const timer = setInterval(() => {
      get().loadUnreadCount()
    }, POLL_INTERVAL_MS)
    set({ pollTimer: timer })
  },

  stopPolling: () => {
    const timer = get().pollTimer
    if (timer) clearInterval(timer)
    set({ pollTimer: null })
  },

  reset: () => set({ items: [], unreadCount: 0 }),
}))
