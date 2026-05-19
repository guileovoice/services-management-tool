export type BookingStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW' 
  | 'IN_PROGRESS'

export type LeadStatus = 
  | 'NEW' 
  | 'CONTACTED' 
  | 'QUALIFIED' 
  | 'BOOKED' 
  | 'LOST'

export type LeadUrgency = 'LOW' | 'MEDIUM' | 'HIGH'

export type Channel = 'VOICE' | 'WHATSAPP' | 'SMS' | 'WEB' | 'WALK_IN'

export type ConsentTier = 'ESSENTIAL' | 'MARKETING' | 'INTELLIGENCE'

export type ServiceCategory = 
  | 'HAIR' 
  | 'COLOR' 
  | 'BEARD' 
  | 'NAILS' 
  | 'SPA' 
  | 'CONSULTATION' 
  | 'OTHER'

export interface StaffMember {
  id: string
  name: string
  roleTitle: string
  bio: string
  avatarUrl?: string
  avatarColor: string
  services: string[]
  workingHours: {
    [day: string]: { open: string; close: string; closed: boolean }
  }
  googleCalendarConnected: boolean
  bookingsToday: number
  bookingsThisWeek: number
  utilizationRate: number
  totalRevenue: number
  rating: number
  isActive: boolean
}

export interface Service {
  id: string
  name: string
  description: string
  category: ServiceCategory
  durationMin: number
  price: number
  staffIds: string[]
  isActive: boolean
  isPopular: boolean
  requiresDeposit: boolean
  depositAmount?: number
  color: string
}

export interface Booking {
  id: string
  bookingRef: string
  tenantId: string
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  staffId: string
  staffName: string
  serviceId: string
  serviceName: string
  serviceDurationMin: number
  servicePrice: number
  scheduledAt: string
  endsAt: string
  status: BookingStatus
  channel: Channel
  notes?: string
  internalNotes?: string
  reminderSent: boolean
  depositPaid: boolean
  depositAmount?: number
  paymentStatus: 'UNPAID' | 'PAID' | 'PARTIAL' | 'REFUNDED'
  googleEventId?: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  preferredChannel: Channel
  preferredStaffId?: string
  preferredStaffName?: string
  notes?: string
  consents: {
    essential: boolean
    marketing: boolean
    intelligence: boolean
  }
  totalBookings: number
  totalSpent: number
  avgBookingValue: number
  lastBookingAt?: string
  firstBookingAt?: string
  noShowCount: number
  cancellationCount: number
  churnRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  ltv: number
  rfmSegment?: string
  tags: string[]
  bookings: Booking[]
  calls: CallLog[]
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  email?: string
  status: LeadStatus
  urgency: LeadUrgency
  score: number
  channel: Channel
  inquiryText: string
  serviceInterest: string
  notes: string
  assignedStaffId?: string
  assignedStaffName?: string
  followUpAt?: string
  convertedBookingId?: string
  createdAt: string
  updatedAt: string
}

export interface CallLog {
  id: string
  customerId?: string
  duration: number
  channel: Channel
  transcript: string
  recordingUrl?: string
  intent: 'BOOKING' | 'INQUIRY' | 'COMPLAINT' | 'LEAD' | 'CANCEL' | 'RESCHEDULE' | 'OTHER'
  bookingCreated: boolean
  bookingId?: string
  leadCreated: boolean
  leadId?: string
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  createdAt: string
}

export interface DashboardStats {
  today: {
    bookings: number
    revenue: number
    newCustomers: number
    missedCalls: number
    noShows: number
    utilization: number
  }
  thisWeek: {
    bookings: number
    revenue: number
    bookingsChange: number
    revenueChange: number
  }
  revenueChart: { date: string; revenue: number; bookings: number }[]
  staffUtilization: { name: string; utilization: number; bookings: number }[]
  topServices: { name: string; count: number; revenue: number }[]
  channelBreakdown: { channel: Channel; count: number; percentage: number }[]
}