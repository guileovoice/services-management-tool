import type { DashboardStats } from '@/lib/types'
import { format, subDays } from 'date-fns'

const today = new Date()

const generateRevenueData = () => {
  const data = []
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i)
    const baseRevenue = 1200 + Math.random() * 1600
    const dayOfWeek = date.getDay()
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1
    const revenue = Math.round(baseRevenue * weekendMultiplier)
    const bookings = Math.round(revenue / 65)
    
    data.push({
      date: format(date, 'MMM d'),
      revenue,
      bookings,
    })
  }
  return data
}

export const dashboardStats: DashboardStats = {
  today: {
    bookings: 28,
    revenue: 1847,
    newCustomers: 4,
    missedCalls: 2,
    noShows: 1,
    utilization: 79,
  },
  thisWeek: {
    bookings: 156,
    revenue: 9840,
    bookingsChange: 8,
    revenueChange: 12,
  },
  revenueChart: generateRevenueData(),
  staffUtilization: [
    { name: 'Priya Sharma', utilization: 92, bookings: 8 },
    { name: 'Marcus Silva', utilization: 88, bookings: 7 },
    { name: 'Alex Rivera', utilization: 80, bookings: 6 },
    { name: 'Jessica Park', utilization: 75, bookings: 5 },
    { name: 'Devon Chase', utilization: 60, bookings: 4 },
  ],
  topServices: [
    { name: "Men's Haircut", count: 42, revenue: 1470 },
    { name: 'Balayage', count: 28, revenue: 5600 },
    { name: 'Gel Manicure', count: 35, revenue: 1750 },
    { name: 'Blowout', count: 24, revenue: 1320 },
    { name: 'Hair + Beard Combo', count: 18, revenue: 990 },
  ],
  channelBreakdown: [
    { channel: 'VOICE', count: 87, percentage: 40 },
    { channel: 'WEB', count: 76, percentage: 35 },
    { channel: 'WHATSAPP', count: 55, percentage: 25 },
  ],
}

export const recentActivity = [
  {
    id: '1',
    type: 'BOOKING_CREATED',
    icon: 'phone',
    text: 'AI booked Sofia Chen — Balayage with Jessica · 3pm Fri',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'LEAD_CREATED',
    icon: 'message',
    text: 'WhatsApp inquiry: Rachel Kim — Full Color',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'BOOKING_COMPLETED',
    icon: 'check',
    text: 'James Williams completed — Beard Trim with Marcus',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'NO_SHOW',
    icon: 'alert',
    text: 'Carlos Mendez no-show — 1pm today',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'CUSTOMER_CREATED',
    icon: 'user',
    text: 'New customer: Aisha Johnson registered',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'REMINDER_SENT',
    icon: 'calendar',
    text: "Reminder sent to Devon's 4pm client",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    type: 'LEAD_CREATED',
    icon: 'phone',
    text: 'New voice lead: Emma Rodriguez — Balayage inquiry',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    type: 'BOOKING_CREATED',
    icon: 'globe',
    text: 'Online booking: Tyler Brooks — Marcus Silva · 11am Tomorrow',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const alerts = [
  {
    id: '1',
    text: "Marcus has 3 back-to-back bookings — no break scheduled",
    type: 'warning',
  },
  {
    id: '2',
    text: '2 leads haven\'t been contacted in 48 hours',
    type: 'info',
  },
  {
    id: '3',
    text: 'Priya\'s Thursday fully booked — suggest overflow to other staff',
    type: 'suggestion',
  },
]