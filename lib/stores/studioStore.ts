import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'
import type { Booking, Customer, Lead, StaffMember, Service, CallLog, BookingStatus, LeadStatus } from '@/lib/types'
import { format } from 'date-fns'
import { bookingDateTime as bdt } from '@/lib/utils'

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
    date: string
    time: string
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
  retryBootstrap: () => void
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

    const tables = [
      { key: 'bookings', promise: supabase.from('bookings').select('*').eq('tenant_id', TENANT_ID) },
      { key: 'customers', promise: supabase.from('customers').select('*').eq('business_id', TENANT_ID) },
      { key: 'leads', promise: supabase.from('leads').select('*').eq('business_id', TENANT_ID) },
      { key: 'staff', promise: supabase.from('staff').select('*').eq('business_id', TENANT_ID) },
      { key: 'services', promise: supabase.from('studio_services').select('*').eq('business_id', TENANT_ID) },
    ] as const

    const raw: Record<string, unknown[]> = {}
    const errs: string[] = []

    for (const { key, promise } of tables) {
      try {
        const { data, error } = await promise
        if (error) {
          console.error(`[StudioStore] ${key}:`, error)
          errs.push(`${key}: ${error.message}`)
        } else {
          console.log(`[StudioStore] ${key}: ${data?.length || 0} rows`)
          raw[key] = data || []
        }
      } catch (ex) {
        const msg = ex instanceof Error ? ex.message : String(ex)
        console.error(`[StudioStore] ${key} exception:`, msg)
        errs.push(`${key}: ${msg}`)
      }
    }

    const mapTo = <T>(rows: unknown[]) => rows.map(r => toCamelCase<T>(r as Record<string, unknown>))

    set({
      bookings: mapTo<Booking>(raw.bookings || []),
      customers: mapTo<Customer>(raw.customers || []),
      leads: mapTo<Lead>(raw.leads || []),
      staff: mapTo<StaffMember>(raw.staff || []),
      services: mapTo<Service>(raw.services || []),
      isBootstrapped: true,
      isLoading: false,
      error: errs.length > 0 ? errs.join('; ') : null,
    })
  },

  addBooking: async (data) => {
    try {
      const now = new Date().toISOString()
      const ref = 'STU-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0')

      // Build a full datetime from date + time for overlap checking
      const bookingTime = bdt(data.date, data.time)
      const nowTime = new Date()
      if (bookingTime.getTime() < nowTime.getTime()) {
        throw new Error('Booking date and time cannot be in the past.')
      }

      // 2. Check for overlapping bookings (same stylist, overlapping time window)
      const newStart = bookingTime
      const newEnd = new Date(newStart.getTime() + data.serviceDurationMin * 60000)

      const { data: overlapping } = await supabase
        .from('bookings')
        .select('id, date, time, service_duration_min')
        .eq('tenant_id', TENANT_ID)
        .eq('staff_id', data.staffId)
        .neq('status', 'CANCELLED')
        .eq('date', data.date)

      if (overlapping && overlapping.length > 0) {
        const conflict = overlapping.find((b: { date: string; time: string; service_duration_min: number }) => {
          const exStart = bdt(b.date, b.time)
          const exEnd = new Date(exStart.getTime() + b.service_duration_min * 60000)
          return newStart < exEnd && newEnd > exStart
        })
        if (conflict) {
          throw new Error('This time slot is already booked for this stylist. Please choose another time or stylist.')
        }
      }


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
        date: data.date,
        time: data.time,
        status: 'CONFIRMED',
        channel: data.channel,
        notes: data.notes || null,
        created_at: now,
        updated_at: now,
      }).select().single()

      if (error) throw error
      const booking = toCamelCase<Booking>(newBooking)

      // Update local Zustand state
      set(state => ({ bookings: [...state.bookings, booking] }))

      // 3. Build rich confirmation messages using date + time
      const bookingDateTime = bdt(data.date, data.time)
      const dateFormatted = format(bookingDateTime, 'EEEE, MMMM d, yyyy')
      const timeFormatted = format(bookingDateTime, 'h:mm a')

      const whatsappMsg =
        `✅ *Booking Confirmed!*

Hi ${data.customerName}, your appointment is confirmed. Here are your details:

📋 *Booking Ref:* ${ref}
💇 *Service:* ${data.serviceName}
👤 *Stylist:* ${data.staffName}
📅 *Date:* ${dateFormatted}
⏰ *Time:* ${timeFormatted}
⏱ *Duration:* ${data.serviceDurationMin} min
💰 *Price:* $${data.servicePrice.toFixed(2)}

📍 The Studio – Williamsburg, Brooklyn

For changes or cancellations, please contact us at least 24 hours in advance. See you soon! 💈`

      const dateShort = format(bookingDateTime, 'M/d/yyyy')
      const timePadded = format(bookingDateTime, 'hh:mm a')

      const smsMsg =
        `Hello ${data.customerName} 👋
Your appointment has been successfully confirmed! ✅

📖 *Booking Ref:* ${ref}
📅 *Date:* ${dateShort}
⏰ *Time:* ${timePadded}
✂️ *Service:* ${data.serviceName}
👨‍💼 *Staff:* ${data.staffName}
⏳ *Duration:* ${data.serviceDurationMin} mins
💲 *Price:* $${data.servicePrice.toFixed(2)}
🏥 *Salon:* Studio Luxe Barber Lounge
📍 *Location:* 127 Bedford Ave, Williamsburg, Brooklyn, NY 11211

We look forward to seeing you. Reply to this message if you need to reschedule or have any questions!`

      // Insert WhatsApp log
      const { error: waErr } = await supabase.from('whatsapp_messages').insert({
        tenant_id: TENANT_ID,
        phone_number: data.customerPhone,
        contact_name: data.customerName,
        direction: 'outbound',
        message_body: whatsappMsg,
        status: 'sent',
        timestamp: now,
      })
      if (waErr) console.error('[addBooking] WhatsApp insert error:', waErr.message)

      // Insert SMS log
      const { error: smsErr } = await supabase.from('sms_messages').insert({
        tenant_id: TENANT_ID,
        phone_number: data.customerPhone,
        contact_name: data.customerName,
        direction: 'outbound',
        message_body: smsMsg,
        status: 'delivered',
        created_at: now,
      })
      if (smsErr) console.error('[addBooking] SMS insert error:', smsErr.message)

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
  retryBootstrap: () => {
    set({ isBootstrapped: false, error: null })
    get().bootstrapData()
  },
}))
