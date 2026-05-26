import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'
import type { Booking, Customer, Lead, StaffMember, Service, CallLog, BookingStatus, LeadStatus } from '@/lib/types'

const TENANT_ID = '405b50b9-9504-4bda-bd38-7ce5b53e7aa0'

function toCamelCase<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result as T
}

interface StudioState {
  bookings: Booking[]
  customers: Customer[]
  leads: Lead[]
  staff: StaffMember[]
  services: Service[]
  callLogs: CallLog[]
  isLoading: boolean
  error: string | null
  isBootstrapped: boolean

  bootstrapData: () => Promise<void>
  addBooking: (data: {
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
    channel: string
    notes?: string
  }) => Promise<Booking | null>
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
  addCustomer: (data: {
    name: string
    phone: string
    email?: string
    preferredChannel?: string
    notes?: string
  }) => Promise<Customer | null>
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>
  addLead: (data: {
    name: string
    phone: string
    email?: string
    channel?: string
    inquiryText?: string
    serviceInterest?: string
  }) => Promise<Lead | null>
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>
  setStaff: (staff: StaffMember[]) => void
  setServices: (services: Service[]) => void
  setCallLogs: (logs: CallLog[]) => void
}

export const useStudioStore = create<StudioState>((set, get) => ({
  bookings: [],
  customers: [],
  leads: [],
  staff: [],
  services: [],
  callLogs: [],
  isLoading: false,
  error: null,
  isBootstrapped: false,

  bootstrapData: async () => {
    if (get().isBootstrapped) return
    set({ isLoading: true, error: null })
    try {
      const [
        { data: bookingsData, error: bookingsError },
        { data: customersData, error: customersError },
        { data: leadsData, error: leadsError },
        { data: staffData, error: staffError },
        { data: servicesData, error: servicesError },
      ] = await Promise.all([
        supabase.from('bookings').select('*').eq('tenant_id', TENANT_ID),
        supabase.from('customers').select('*').eq('business_id', TENANT_ID),
        supabase.from('leads').select('*').eq('business_id', TENANT_ID),
        supabase.from('staff').select('*').eq('business_id', TENANT_ID),
        supabase.from('studio_services').select('*').eq('business_id', TENANT_ID),
      ])

      if (bookingsError) throw bookingsError
      if (customersError) throw customersError
      if (leadsError) throw leadsError
      if (staffError) throw staffError
      if (servicesError) throw servicesError

      set({
        bookings: (bookingsData || []).map(r => toCamelCase<Booking>(r)),
        customers: (customersData || []).map(r => toCamelCase<Customer>(r)),
        leads: (leadsData || []).map(r => toCamelCase<Lead>(r)),
        staff: (staffData || []).map(r => toCamelCase<StaffMember>(r)),
        services: (servicesData || []).map(r => toCamelCase<Service>(r)),
        isBootstrapped: true,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      set({ error: message, isLoading: false })
    }
  },

  addBooking: async (data) => {
    try {
      const now = new Date().toISOString()
      const ref = 'STU-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0')

      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', data.customerPhone)
        .maybeSingle()

      let customerId: string
      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const customer = await get().addCustomer({
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail,
        })
        if (!customer) throw new Error('Failed to create customer')
        customerId = customer.id
      }

      const { data: newBooking, error } = await supabase.from('bookings').insert({
        booking_ref: ref,
        tenant_id: TENANT_ID,
        customer_id: customerId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || null,
        staff_id: data.staffId,
        staff_name: data.staffName,
        service_id: data.serviceId,
        service_name: data.serviceName,
        service_duration_min: data.serviceDurationMin,
        service_price: data.servicePrice,
        scheduled_at: data.scheduledAt,
        ends_at: data.endsAt,
        status: 'CONFIRMED',
        channel: data.channel,
        notes: data.notes || null,
        created_at: now,
        updated_at: now,
      }).select().single()

      if (error) throw error
      const booking = toCamelCase<Booking>(newBooking)
      set(state => ({ bookings: [...state.bookings, booking] }))
      return booking
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking'
      set({ error: message })
      return null
    }
  },

  updateBookingStatus: async (id, status) => {
    const prev = get().bookings
    set(state => ({
      bookings: state.bookings.map(b => b.id === id ? { ...b, status } : b),
    }))
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (error) {
      set(state => ({ bookings: prev }))
    }
  },

  deleteBooking: async (id) => {
    const prev = get().bookings
    set(state => ({ bookings: state.bookings.filter(b => b.id !== id) }))
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) {
      set(state => ({ bookings: prev }))
    }
  },

  addCustomer: async (data) => {
    try {
      const { data: newCustomer, error } = await supabase.from('customers').insert({
        business_id: TENANT_ID,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        preferred_channel: data.preferredChannel || 'WEB',
        notes: data.notes || null,
        consents: { essential: true, marketing: false, intelligence: false },
      }).select().single()

      if (error) throw error
      const customer = toCamelCase<Customer>(newCustomer)
      set(state => ({ customers: [...state.customers, customer] }))
      return customer
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create customer'
      set({ error: message })
      return null
    }
  },

  updateCustomer: async (id, data) => {
    const dbData: Record<string, unknown> = {}
    if (data.name) dbData.name = data.name
    if (data.phone) dbData.phone = data.phone
    if (data.email) dbData.email = data.email
    if (data.notes) dbData.notes = data.notes
    if (data.preferredChannel) dbData.preferred_channel = data.preferredChannel
    if (data.preferredStaffId) dbData.preferred_staff_id = data.preferredStaffId
    if (data.preferredStaffName) dbData.preferred_staff_name = data.preferredStaffName
    if (data.tags) dbData.tags = data.tags

    const prev = get().customers
    set(state => ({
      customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c),
    }))
    const { error } = await supabase.from('customers').update(dbData).eq('id', id)
    if (error) {
      set(state => ({ customers: prev }))
    }
  },

  addLead: async (data) => {
    try {
      const now = new Date().toISOString()
      const { data: newLead, error } = await supabase.from('leads').insert({
        business_id: TENANT_ID,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        channel: data.channel || 'VOICE',
        inquiry_text: data.inquiryText || '',
        service_interest: data.serviceInterest || '',
        status: 'NEW',
        urgency: 'MEDIUM',
        score: 50,
        created_at: now,
        updated_at: now,
      }).select().single()

      if (error) throw error
      const lead = toCamelCase<Lead>(newLead)
      set(state => ({ leads: [...state.leads, lead] }))
      return lead
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create lead'
      set({ error: message })
      return null
    }
  },

  updateLeadStatus: async (id, status) => {
    const prev = get().leads
    set(state => ({
      leads: state.leads.map(l => l.id === id ? { ...l, status } : l),
    }))
    const { error } = await supabase.from('leads').update({ status }).eq('id', id)
    if (error) {
      set(state => ({ leads: prev }))
    }
  },

  setStaff: (staff) => set({ staff }),
  setServices: (services) => set({ services }),
  setCallLogs: (callLogs) => set({ callLogs }),
}))
