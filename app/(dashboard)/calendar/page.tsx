'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  format, 
  addDays, 
  subDays, 
  parseISO, 
  startOfDay, 
  addMinutes, 
  setHours, 
  setMinutes, 
  isSameDay, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday,
  parse
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  User,
  Phone,
  Calendar,
  MessageSquare,
  Globe,
  UserCheck,
  Check,
  AlertTriangle,
  Slash,
  Lock,
  Search,
  Mail,
  FileText
} from 'lucide-react'
import { useCalendarStore } from '@/lib/stores/calendarStore'
import { useStudioStore } from '@/lib/stores/studioStore'
import { cn, formatTime, getInitials, statusColors, categoryColors } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const channelIcons: Record<string, React.ElementType> = {
  VOICE: Phone,
  WHATSAPP: MessageSquare,
  SMS: MessageSquare,
  WEB: Globe,
  WALK_IN: UserCheck,
}

const statusIcons: Record<string, React.ElementType> = {
  COMPLETED: Check,
  CONFIRMED: UserCheck,
  PENDING: Clock,
  IN_PROGRESS: Clock,
  NO_SHOW: AlertTriangle,
  CANCELLED: Slash,
}

function getDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

function isStaffWorking(staffMember: { workingHours: Record<string, { open: string; close: string; closed: boolean }> }, date: Date): boolean {
  const dayName = getDayName(date)
  return !staffMember.workingHours[dayName]?.closed
}

export default function CalendarPage() {
  const { 
    staff, 
    bookings: allBookings, 
    services, 
    customers, 
    addBooking, 
    updateBookingStatus, 
    bootstrapData, 
    isBootstrapped 
  } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const {
    selectedDate,
    setSelectedDate,
    view,
    setView,
    selectBooking,
    selectedBookingId,
    showBookingDetail,
    clearBookingSelection,
    showNewBookingModal,
    openNewBookingModal,
    closeNewBookingModal,
  } = useCalendarStore()

  const [currentTime, setCurrentTime] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  // New Booking Modal State
  const [customerMode, setCustomerMode] = useState<'select' | 'new'>('select')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [bookingDateInput, setBookingDateInput] = useState(format(selectedDate, 'yyyy-MM-dd'))
  const [bookingTimeInput, setBookingTimeInput] = useState('09:00 AM')
  const [bookingNotes, setBookingNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter working staff for selectedDate
  const workingStaff = staff.filter(s => isStaffWorking(s, selectedDate))
  const displayStaff = workingStaff.length > 0 ? workingStaff : staff

  // Sync date input when selectedDate changes
  useEffect(() => {
    setBookingDateInput(format(selectedDate, 'yyyy-MM-dd'))
  }, [selectedDate])

  // Timer to update current time indicator line
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Navigation handlers based on the active view
  const handlePrev = () => {
    if (view === 'day') {
      setSelectedDate(subDays(selectedDate, 1))
    } else if (view === 'week') {
      setSelectedDate(subDays(selectedDate, 7))
    } else if (view === 'month') {
      setSelectedDate(subMonths(selectedDate, 1))
    }
  }

  const handleNext = () => {
    if (view === 'day') {
      setSelectedDate(addDays(selectedDate, 1))
    } else if (view === 'week') {
      setSelectedDate(addDays(selectedDate, 7))
    } else if (view === 'month') {
      setSelectedDate(addMonths(selectedDate, 1))
    }
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  // Bookings filtered for active date/week/month
  const dayBookings = useMemo(() => {
    return allBookings.filter(booking => {
      const bookingDate = parseISO(booking.scheduledAt)
      return isSameDay(bookingDate, selectedDate)
    })
  }, [selectedDate, allBookings])

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  const monthGridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  // Get position details for booking event cards on Day View
  const getBookingPosition = (booking: typeof allBookings[0]) => {
    const start = parseISO(booking.scheduledAt)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const top = ((startMinutes - 9 * 60) / 15) * 32
    const height = (booking.serviceDurationMin / 15) * 32
    return { top, height }
  }

  // Selected Booking Details
  const selectedBooking = selectedBookingId 
    ? allBookings.find(b => b.id === selectedBookingId)
    : null

  const hours = Array.from({ length: 12 }, (_, i) => i + 9) // 9 AM to 8 PM

  // Filter customers for dropdown search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers
    const q = customerSearch.toLowerCase()
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email && c.email.toLowerCase().includes(q))
    )
  }, [customers, customerSearch])

  // Reset modal values
  const resetModal = () => {
    setCustomerMode('select')
    setCustomerSearch('')
    setSelectedCustomerId('')
    setNewCustomerName('')
    setNewCustomerPhone('')
    setNewCustomerEmail('')
    setSelectedServiceId('')
    setSelectedStaffId('')
    setBookingDateInput(format(selectedDate, 'yyyy-MM-dd'))
    setBookingTimeInput('09:00 AM')
    setBookingNotes('')
  }

  // Handle booking form submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServiceId || !selectedStaffId || !bookingDateInput || !bookingTimeInput) {
      toast.error('Please fill in all required fields')
      return
    }

    let custName = ''
    let custPhone = ''
    let custEmail = ''

    if (customerMode === 'select') {
      const existing = customers.find(c => c.id === selectedCustomerId)
      if (!existing) {
        toast.error('Please select an existing customer')
        return
      }
      custName = existing.name
      custPhone = existing.phone
      custEmail = existing.email || ''
    } else {
      if (!newCustomerName || !newCustomerPhone) {
        toast.error('Please enter customer Name and Phone')
        return
      }
      custName = newCustomerName
      custPhone = newCustomerPhone
      custEmail = newCustomerEmail
    }

    const serviceObj = services.find(s => s.id === selectedServiceId)
    const staffObj = staff.find(s => s.id === selectedStaffId)

    if (!serviceObj || !staffObj) {
      toast.error('Service or Stylist not found')
      return
    }

    setIsSubmitting(true)
    try {
      // Parse scheduled time
      const timeStrClean = bookingTimeInput.replace(/\s+/g, ' ')
      const dateParsed = parse(`${bookingDateInput} ${timeStrClean}`, 'yyyy-MM-dd h:mm a', new Date())
      
      if (isNaN(dateParsed.getTime())) {
        throw new Error('Invalid date or time format selected.')
      }

      const endsAtParsed = addMinutes(dateParsed, serviceObj.durationMin)

      const result = await addBooking({
        customerName: custName,
        customerPhone: custPhone,
        customerEmail: custEmail || undefined,
        staffId: staffObj.id,
        staffName: staffObj.name,
        serviceId: serviceObj.id,
        serviceName: serviceObj.name,
        serviceDurationMin: serviceObj.durationMin,
        servicePrice: serviceObj.price,
        scheduledAt: dateParsed.toISOString(),
        endsAt: endsAtParsed.toISOString(),
        channel: 'WALK_IN',
        notes: bookingNotes || undefined,
      })

      if (result) {
        toast.success('Booking created successfully')
        closeNewBookingModal()
        resetModal()
      } else {
        toast.error('Failed to create booking')
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Error constructing booking dates')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pre-fill fields when modal opens
  useEffect(() => {
    if (showNewBookingModal) {
      if (services.length > 0) setSelectedServiceId(services[0].id)
      if (displayStaff.length > 0) setSelectedStaffId(displayStaff[0].id)
    }
  }, [showNewBookingModal, services, displayStaff])

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-surface/50 border border-border p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-surface rounded-xl p-1 border border-border">
            <button onClick={handlePrev} className="p-2 rounded-lg hover:bg-surface2 transition-colors" title="Previous">
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={handleToday}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-surface2 transition-colors border border-border/50"
            >
              Today
            </button>
            <button onClick={handleNext} className="p-2 rounded-lg hover:bg-surface2 transition-colors" title="Next">
              <ChevronRight size={18} />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              {view === 'day' && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              {view === 'week' && `Week of ${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`}
              {view === 'month' && format(selectedDate, 'MMMM yyyy')}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {view === 'day' && `${dayBookings.length} total bookings scheduled`}
              {view === 'week' && `Weekly overview across all stylists`}
              {view === 'month' && `Monthly schedules overview`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          {/* View Toggle */}
          <div className="flex bg-surface rounded-xl p-1 border border-border">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize',
                  view === v 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface2'
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <button 
            onClick={() => {
              if (staff.length > 0) setSelectedStaffId(staff[0].id)
              if (services.length > 0) setSelectedServiceId(services[0].id)
              openNewBookingModal()
            }}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-2"
          >
            <Plus size={15} />
            New Booking
          </button>
        </div>
      </div>

      {/* Calendar Grid Views */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl transition-all">
        
        {/* ==================== 1. DAY VIEW ==================== */}
        {view === 'day' && (
          <div ref={calendarRef} className="overflow-x-auto">
            <div className="min-w-[900px]">
              
              {/* Column Headers */}
              <div className="grid border-b border-border bg-surface2/50" style={{ gridTemplateColumns: `80px repeat(${displayStaff.length}, 1fr)` }}>
                <div className="p-3 border-r border-border flex items-center justify-center text-xs font-semibold text-text-muted">Time</div>
                {displayStaff.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 border-r border-border last:border-r-0 text-center flex flex-col items-center justify-center"
                  >
                    <div
                      className="w-10 h-10 rounded-full mb-2 flex items-center justify-center text-white font-bold text-sm shadow-md"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className="font-semibold text-sm text-text-primary">{member.name}</div>
                    <div className="text-[10px] px-2 py-0.5 bg-surface3 border border-border rounded-full text-text-secondary mt-1 font-medium">
                      {dayBookings.filter(b => b.staffId === member.id && b.status !== 'CANCELLED').length} bookings
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots and Events Grid */}
              <div className="grid relative" style={{ gridTemplateColumns: `80px repeat(${displayStaff.length}, 1fr)` }}>
                
                {/* Current Time Indicator Line */}
                {isSameDay(selectedDate, new Date()) && currentTime.getHours() >= 9 && currentTime.getHours() < 21 && (
                  <div
                    className="col-span-full absolute z-20 pointer-events-none w-full"
                    style={{
                      top: `${((currentTime.getHours() - 9) * 60 + currentTime.getMinutes()) / 15 * 32}px`,
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-[78px] text-[10px] text-red-500 font-bold font-mono pr-2 text-right">
                        {format(currentTime, 'h:mm a')}
                      </div>
                      <div className="flex-1 h-0.5 bg-red-500 relative">
                        <div className="absolute -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 border border-surface shadow-md" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Vertical Time Rows */}
                {hours.map((hour) => (
                  <div key={hour} className="contents">
                    {/* Hourly Label */}
                    <div className="p-3 border-r border-b border-border/80 text-xs text-text-secondary font-mono flex items-start justify-center h-32 bg-surface2/20">
                      {format(setHours(new Date(), hour), 'h a')}
                    </div>
                    
                    {/* Columns grid cells */}
                    {displayStaff.map((member) => (
                      <div
                        key={member.id}
                        className="relative border-r border-b border-border/85 last:border-r-0 h-32 group hover:bg-surface2/10 transition-colors"
                      >
                        {/* 15-minute subdividers */}
                        {[15, 30, 45].map((offset) => (
                          <div
                            key={offset}
                            className="absolute left-0 right-0 h-px border-t border-dashed border-border/30"
                            style={{ top: `${offset * 32 / 15}px` }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Absolute Event Overlays */}
                {displayStaff.map((member, staffIndex) => {
                  const memberBookings = dayBookings.filter(b => b.staffId === member.id && b.status !== 'CANCELLED')
                  return (
                    <div 
                      key={member.id} 
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{
                        left: `${80 + (staffIndex * (100 / displayStaff.length))}%`,
                        width: `${100 / displayStaff.length}%`,
                      }}
                    >
                      <div className="relative w-full h-full">
                        {memberBookings.map((booking) => {
                          const { top, height } = getBookingPosition(booking)
                          const service = services.find(s => s.id === booking.serviceId)
                          const catColor = service ? categoryColors[service.category] : null
                          
                          return (
                            <motion.div
                              key={booking.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute left-2.5 right-2.5 rounded-xl cursor-pointer overflow-hidden shadow-lg border-l-4 pointer-events-auto transition-transform hover:-translate-y-0.5"
                              style={{
                                top: `${top}px`,
                                height: `${height - 3}px`,
                                backgroundColor: catColor ? catColor.light : 'rgba(108, 60, 225, 0.15)',
                                borderColor: catColor ? catColor.bg : '#6C3CE1',
                              }}
                              onClick={() => selectBooking(booking.id)}
                              whileHover={{ scale: 1.01 }}
                            >
                              <div className="p-2.5 h-full flex flex-col justify-between select-none">
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-text-primary truncate flex items-center gap-1.5">
                                    {booking.customerName}
                                  </div>
                                  <div className="text-[10px] font-medium text-text-secondary mt-0.5 truncate">
                                    {booking.serviceName} · {booking.serviceDurationMin}m
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className={cn(
                                    'text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
                                    booking.status === 'CONFIRMED' && 'bg-blue-500/20 text-blue-400 border border-blue-500/20',
                                    booking.status === 'COMPLETED' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
                                    booking.status === 'PENDING' && 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20',
                                    booking.status === 'IN_PROGRESS' && 'bg-violet-500/20 text-violet-400 border border-violet-500/20 animate-pulse',
                                    booking.status === 'NO_SHOW' && 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                                  )}>
                                    {booking.status === 'IN_PROGRESS' ? 'IN PROGRESS' : booking.status}
                                  </span>
                                  <span className="text-[10px] font-bold text-text-primary">${booking.servicePrice}</span>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
          </div>
        )}

        {/* ==================== 2. WEEK VIEW ==================== */}
        {view === 'week' && (
          <div className="grid grid-cols-7 divide-x divide-border min-h-[600px] bg-background">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayBookingsList = allBookings.filter(b => b.scheduledAt.startsWith(dateStr) && b.status !== 'CANCELLED')
              const isDayToday = isToday(day)

              return (
                <div key={dateStr} className="flex flex-col min-w-[120px] bg-surface/30">
                  {/* Day Column Header */}
                  <div className={cn(
                    "p-3 text-center border-b border-border bg-surface2/40 flex flex-col items-center justify-center",
                    isDayToday && "bg-primary/5"
                  )}>
                    <span className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      isDayToday ? "text-primary" : "text-text-secondary"
                    )}>
                      {format(day, 'E')}
                    </span>
                    <span className={cn(
                      "text-lg font-bold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full transition-all",
                      isDayToday ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-primary"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Day Bookings List */}
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                    {dayBookingsList.map((booking) => {
                      const service = services.find(s => s.id === booking.serviceId)
                      const catColor = service ? categoryColors[service.category] : null
                      return (
                        <div
                          key={booking.id}
                          onClick={() => selectBooking(booking.id)}
                          className="p-2 bg-surface border border-border hover:border-primary/50 rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between border-l-4"
                          style={{ borderColor: catColor?.bg || '#6C3CE1' }}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-text-muted font-mono">
                                {format(parseISO(booking.scheduledAt), 'h:mm a')}
                              </span>
                              <span className="text-[10px] font-bold text-text-primary">${booking.servicePrice}</span>
                            </div>
                            <div className="font-semibold text-xs text-text-primary mt-1 truncate">{booking.customerName}</div>
                            <div className="text-[10px] text-text-secondary truncate">{booking.serviceName}</div>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
                            <span className="text-[9px] text-text-muted truncate max-w-[60px]">{booking.staffName}</span>
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                              booking.status === 'CONFIRMED' && 'bg-blue-500/10 text-blue-400',
                              booking.status === 'COMPLETED' && 'bg-emerald-500/10 text-emerald-400',
                              booking.status === 'PENDING' && 'bg-yellow-500/10 text-yellow-400',
                              booking.status === 'IN_PROGRESS' && 'bg-violet-500/10 text-violet-400'
                            )}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {dayBookingsList.length === 0 && (
                      <div className="h-full flex items-center justify-center py-12 text-center">
                        <p className="text-[10px] text-text-muted italic">No bookings</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ==================== 3. MONTH VIEW ==================== */}
        {view === 'month' && (
          <div className="bg-border grid grid-cols-7 gap-px">
            
            {/* Weekday headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="p-3 text-center bg-surface2 text-xs font-bold text-text-secondary border-b border-border">
                {d}
              </div>
            ))}

            {/* Calendar Days */}
            {monthGridDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayBookingsList = allBookings.filter(b => b.scheduledAt.startsWith(dateStr) && b.status !== 'CANCELLED')
              const inCurrentMonth = isSameMonth(day, selectedDate)
              const isDayToday = isToday(day)

              return (
                <div 
                  key={dateStr} 
                  className={cn(
                    "min-h-[110px] p-2 bg-surface hover:bg-surface2/30 transition-colors flex flex-col justify-between group cursor-pointer relative",
                    !inCurrentMonth && "bg-surface2/20 opacity-40",
                    isDayToday && "bg-primary/5"
                  )}
                  onClick={() => {
                    setSelectedDate(day)
                    setView('day')
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                      isDayToday ? "bg-primary text-white shadow-sm" : "text-text-primary"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayBookingsList.length > 0 && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {dayBookingsList.length}
                      </span>
                    )}
                  </div>

                  {/* List of 3 bookings */}
                  <div className="mt-2 space-y-1 flex-1">
                    {dayBookingsList.slice(0, 3).map((booking) => {
                      const service = services.find(s => s.id === booking.serviceId)
                      const catColor = service ? categoryColors[service.category] : null
                      return (
                        <div 
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation() // Don't trigger date change
                            selectBooking(booking.id)
                          }}
                          className="px-1.5 py-0.5 text-[9px] font-semibold text-text-primary rounded-md truncate border-l-2 bg-surface2/60 border-border/80 hover:bg-surface2 transition-all"
                          style={{ borderLeftColor: catColor?.bg || '#6C3CE1' }}
                        >
                          {format(parseISO(booking.scheduledAt), 'h:mm a')} - {booking.customerName}
                        </div>
                      )
                    })}
                    {dayBookingsList.length > 3 && (
                      <div className="text-[9px] text-text-muted font-bold text-center mt-1">
                        + {dayBookingsList.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

          </div>
        )}

      </div>

      {/* ==================== NEW BOOKING MODAL ==================== */}
      <AnimatePresence>
        {showNewBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => { closeNewBookingModal(); resetModal(); }}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative z-10"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-border bg-surface2/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-base">Create New Booking</h3>
                    <p className="text-xs text-text-secondary">Fill in appointment details below</p>
                  </div>
                </div>
                <button 
                  onClick={() => { closeNewBookingModal(); resetModal(); }}
                  className="p-2 hover:bg-surface3 rounded-lg text-text-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateBooking} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                
                {/* Customer Toggle Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">Customer Info</label>
                  <div className="grid grid-cols-2 gap-2 bg-surface2 p-1 border border-border rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('select')}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg transition-all",
                        customerMode === 'select' ? "bg-surface text-text-primary shadow-sm border border-border" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      Existing Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('new')}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg transition-all",
                        customerMode === 'new' ? "bg-surface text-text-primary shadow-sm border border-border" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      New Client
                    </button>
                  </div>
                </div>

                {/* Customer Mode Selection fields */}
                {customerMode === 'select' ? (
                  <div className="space-y-3 p-3 bg-surface2/40 border border-border/50 rounded-xl">
                    {/* Search Field */}
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search by client name or phone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                      />
                    </div>
                    {/* Dropdown list */}
                    <div className="space-y-2">
                      <select
                        required
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                      >
                        <option value="">-- Choose Client --</option>
                        {filteredCustomers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone})
                          </option>
                        ))}
                      </select>
                      {filteredCustomers.length === 0 && (
                        <p className="text-[11px] text-orange-400 italic">No matching clients found.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-surface2/40 border border-border/50 rounded-xl">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">Full Name *</label>
                        <input
                          type="text"
                          required={customerMode === 'new'}
                          placeholder="e.g. John Doe"
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required={customerMode === 'new'}
                          placeholder="+1 (555) 123-4567"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="client@email.com"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Service Selector */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Service *</label>
                  <select
                    required
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Service...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.durationMin} mins (${s.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stylist Selector */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Stylist *</label>
                  <select
                    required
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Stylist...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time Selector */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Date *</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        min={format(new Date(), 'yyyy-MM-dd')}
                        value={bookingDateInput}
                        onChange={(e) => setBookingDateInput(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Time *</label>
                    <select
                      required
                      value={bookingTimeInput}
                      onChange={(e) => setBookingTimeInput(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    >
                      {/* Generates hourly slots */}
                      {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'].map(time => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Internal Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide special requests, client history, or instructions..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { closeNewBookingModal(); resetModal(); }}
                    className="px-4 py-2.5 text-xs font-bold border border-border rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface2 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Confirm Booking
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== BOOKING DETAIL SHEET ==================== */}
      <AnimatePresence>
        {showBookingDetail && selectedBooking && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={clearBookingSelection}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[420px] bg-surface border-l border-border z-50 overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface2/30">
                <div>
                  <div className="text-[10px] font-bold text-text-muted font-mono tracking-wider mb-1">{selectedBooking.bookingRef}</div>
                  <span className={cn(
                    "px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border",
                    selectedBooking.status === 'CONFIRMED' && 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    selectedBooking.status === 'COMPLETED' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    selectedBooking.status === 'PENDING' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                    selectedBooking.status === 'IN_PROGRESS' && 'bg-violet-500/10 text-violet-400 border-violet-500/30',
                    selectedBooking.status === 'NO_SHOW' && 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                    selectedBooking.status === 'CANCELLED' && 'bg-danger/10 text-danger border-danger/30'
                  )}>
                    {selectedBooking.status}
                  </span>
                </div>
                <button onClick={clearBookingSelection} className="p-2 hover:bg-surface3 rounded-lg text-text-secondary transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1">
                {/* Service Details */}
                <div>
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Service Booked</h4>
                  <h2 className="text-xl font-bold text-text-primary leading-tight">{selectedBooking.serviceName}</h2>
                  <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                    <span className="flex items-center gap-1"><Clock size={14} />{selectedBooking.serviceDurationMin} mins</span>
                    <span>·</span>
                    <span className="font-semibold text-text-primary">${selectedBooking.servicePrice}</span>
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="bg-surface2/60 border border-border rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">Client Profile</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-base shadow-sm">
                      {getInitials(selectedBooking.customerName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-text-primary truncate">{selectedBooking.customerName}</div>
                      <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                        <Phone size={11} /> {selectedBooking.customerPhone}
                      </div>
                      {selectedBooking.customerEmail && (
                        <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1 truncate">
                          <Mail size={11} /> {selectedBooking.customerEmail}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
                    <Link 
                      href={`/customers?search=${encodeURIComponent(selectedBooking.customerName)}`}
                      className="text-xs text-primary hover:text-primary-dark font-bold flex items-center gap-1"
                    >
                      View Profile Details →
                    </Link>
                  </div>
                </div>

                {/* Timing & Stylist info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Appointment Settings</h4>
                  
                  <div className="flex justify-between items-center py-2 border-b border-border/40 text-sm">
                    <span className="text-text-secondary flex items-center gap-1.5"><Calendar size={14} /> Date & Time</span>
                    <span className="font-semibold text-text-primary">
                      {format(parseISO(selectedBooking.scheduledAt), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-border/40 text-sm">
                    <span className="text-text-secondary flex items-center gap-1.5"><User size={14} /> Assigned Stylist</span>
                    <span className="font-semibold text-text-primary">{selectedBooking.staffName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-border/40 text-sm">
                    <span className="text-text-secondary flex items-center gap-1.5"><Globe size={14} /> Booking Channel</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = channelIcons[selectedBooking.channel] || Phone
                        return <Icon size={13} className="text-text-muted" />
                      })()}
                      <span className="font-semibold text-text-primary capitalize">{selectedBooking.channel.toLowerCase().replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Notes text area */}
                  {selectedBooking.notes && (
                    <div className="space-y-2">
                      <span className="text-text-secondary text-xs flex items-center gap-1.5"><FileText size={14} /> Notes & Comments</span>
                      <p className="text-xs bg-surface2/60 border border-border/50 rounded-xl p-3.5 text-text-secondary leading-relaxed">
                        {selectedBooking.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Billing Summary */}
                <div className="bg-surface2/60 border border-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2 text-sm font-semibold">
                    <span className="text-text-secondary">Billing Amount</span>
                    <span className="text-lg font-bold text-text-primary">${selectedBooking.servicePrice}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/40 text-sm">
                    <span className="text-text-secondary">Payment Status</span>
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-bold rounded-full border",
                      selectedBooking.paymentStatus === 'PAID' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    )}>
                      {selectedBooking.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drawer Actions Footer */}
              <div className="p-6 border-t border-border bg-surface2/30 space-y-3">
                {selectedBooking.status === 'CONFIRMED' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { 
                        updateBookingStatus(selectedBooking.id, 'COMPLETED')
                        toast.success('Marked as complete')
                        clearBookingSelection() 
                      }}
                      className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => { 
                        updateBookingStatus(selectedBooking.id, 'NO_SHOW')
                        toast.success('Marked as no-show')
                        clearBookingSelection() 
                      }}
                      className="py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-orange-500/10"
                    >
                      No-Show
                    </button>
                  </div>
                )}
                
                {selectedBooking.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => { 
                      updateBookingStatus(selectedBooking.id, 'COMPLETED')
                      toast.success('Marked as complete')
                      clearBookingSelection() 
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10"
                  >
                    Mark Complete
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      toast.success('Edit feature available in full booking sheet.')
                    }}
                    className="py-2.5 border border-border hover:bg-surface3 text-text-primary text-xs font-semibold rounded-xl transition-all"
                  >
                    Edit / Reschedule
                  </button>
                  <button 
                    onClick={() => {
                      toast.success('Reminder notification queued.')
                    }}
                    className="py-2.5 border border-border hover:bg-surface3 text-text-primary text-xs font-semibold rounded-xl transition-all"
                  >
                    Send Reminder
                  </button>
                </div>

                {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                  <button
                    onClick={() => { 
                      updateBookingStatus(selectedBooking.id, 'CANCELLED')
                      toast.success('Booking cancelled')
                      clearBookingSelection() 
                    }}
                    className="w-full py-3 text-danger hover:bg-danger/10 text-xs font-bold rounded-xl transition-all border border-transparent hover:border-danger/30"
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}