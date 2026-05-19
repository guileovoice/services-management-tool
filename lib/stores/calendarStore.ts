import { create } from 'zustand'

interface CalendarState {
  selectedDate: Date
  view: 'day' | 'week' | 'month'
  selectedStaffIds: string[]
  showBookingDetail: boolean
  selectedBookingId: string | null
  showNewBookingModal: boolean
  preselectedStaffId: string | null
  preselectedTime: string | null
  
  setSelectedDate: (date: Date) => void
  setView: (view: 'day' | 'week' | 'month') => void
  toggleStaff: (staffId: string) => void
  setAllStaff: () => void
  selectBooking: (bookingId: string) => void
  clearBookingSelection: () => void
  openNewBookingModal: (staffId?: string, time?: string) => void
  closeNewBookingModal: () => void
  goToNextDay: () => void
  goToPrevDay: () => void
  goToToday: () => void
}

export const useCalendarStore = create<CalendarState>((set) => ({
  selectedDate: new Date(),
  view: 'day',
  selectedStaffIds: [],
  showBookingDetail: false,
  selectedBookingId: null,
  showNewBookingModal: false,
  preselectedStaffId: null,
  preselectedTime: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  
  setView: (view) => set({ view }),
  
  toggleStaff: (staffId) => set((state) => ({
    selectedStaffIds: state.selectedStaffIds.includes(staffId)
      ? state.selectedStaffIds.filter(id => id !== staffId)
      : [...state.selectedStaffIds, staffId]
  })),
  
  setAllStaff: () => set({ selectedStaffIds: [] }),
  
  selectBooking: (bookingId) => set({ 
    selectedBookingId: bookingId, 
    showBookingDetail: true 
  }),
  
  clearBookingSelection: () => set({ 
    selectedBookingId: null, 
    showBookingDetail: false 
  }),
  
  openNewBookingModal: (staffId, time) => set({ 
    showNewBookingModal: true,
    preselectedStaffId: staffId || null,
    preselectedTime: time || null,
  }),
  
  closeNewBookingModal: () => set({ 
    showNewBookingModal: false,
    preselectedStaffId: null,
    preselectedTime: null,
  }),
  
  goToNextDay: () => set((state) => ({
    selectedDate: new Date(state.selectedDate.getTime() + 86400000)
  })),
  
  goToPrevDay: () => set((state) => ({
    selectedDate: new Date(state.selectedDate.getTime() - 86400000)
  })),
  
  goToToday: () => set({ selectedDate: new Date() }),
}))