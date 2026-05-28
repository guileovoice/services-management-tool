import { create } from 'zustand'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export interface DateRange {
  start: string
  end: string
}

interface DateFilterState {
  range: DateRange
  preset: string
  setRange: (range: DateRange) => void
  setPreset: (preset: string) => void
}

function getDefaultRange(): DateRange {
  const today = new Date()
  return {
    start: subDays(today, 6).toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  }
}

export const useDateFilterStore = create<DateFilterState>((set) => ({
  range: getDefaultRange(),
  preset: 'Last 7 days',
  setRange: (range) => set({ range }),
  setPreset: (preset) => set({ preset }),
}))
