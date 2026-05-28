import { create } from 'zustand'

interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface UIState {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  notifications: Notification[]
  unreadCount: number
  
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  notifications: [],
  unreadCount: 0,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  toggleCommandPalette: () => set((state) => ({ 
    commandPaletteOpen: !state.commandPaletteOpen 
  })),
  
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      },
      ...state.notifications,
    ],
    unreadCount: state.unreadCount + 1,
  })),
  
  markAsRead: (id) => set((state) => {
    const notification = state.notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      return {
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    }
    return state
  }),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  
  clearNotifications: () => set({ 
    notifications: [],
    unreadCount: 0,
  }),
}))