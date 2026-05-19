'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, subDays, parseISO, startOfDay, addMinutes, setHours, setMinutes, isSameDay } from 'date-fns'
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
} from 'lucide-react'
import { useCalendarStore } from '@/lib/stores/calendarStore'
import { staff } from '@/lib/mock-data/staff'
import { bookings as allBookings } from '@/lib/mock-data/bookings'
import { services } from '@/lib/mock-data/services'
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

function isStaffWorking(staffMember: typeof staff[0], date: Date): boolean {
  const dayName = getDayName(date)
  return !staffMember.workingHours[dayName]?.closed
}

export default function CalendarPage() {
  const {
    selectedDate,
    view,
    setView,
    selectBooking,
    selectedBookingId,
    showBookingDetail,
    clearBookingSelection,
    showNewBookingModal,
    openNewBookingModal,
    closeNewBookingModal,
    goToNextDay,
    goToPrevDay,
    goToToday,
  } = useCalendarStore()

  const [currentTime, setCurrentTime] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  const workingStaff = staff.filter(s => isStaffWorking(s, selectedDate))
  const dayName = getDayName(selectedDate)

  const dayBookings = useMemo(() => {
    return allBookings.filter(booking => {
      const bookingDate = parseISO(booking.scheduledAt)
      return isSameDay(bookingDate, selectedDate)
    })
  }, [selectedDate])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getBookingPosition = (booking: typeof allBookings[0]) => {
    const start = parseISO(booking.scheduledAt)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const top = (startMinutes - 9 * 60) / 15 * 32
    const height = booking.serviceDurationMin / 15 * 32
    return { top, height }
  }

  const selectedBooking = selectedBookingId 
    ? allBookings.find(b => b.id === selectedBookingId)
    : null

  const hours = Array.from({ length: 12 }, (_, i) => i + 9)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={goToPrevDay} className="p-2 rounded-lg hover:bg-surface transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-surface transition-colors"
            >
              Today
            </button>
            <button onClick={goToNextDay} className="p-2 rounded-lg hover:bg-surface transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          <h2 className="text-xl font-semibold">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
                  view === v ? 'bg-primary text-white' : 'hover:bg-surface2'
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <button className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-surface transition-colors flex items-center gap-2">
            <Lock size={16} />
            Block Time
          </button>

          <button
            onClick={() => openNewBookingModal()}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            New Booking
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div ref={calendarRef} className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Column Headers */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
          <div className="p-3 bg-surface2 border-r border-border" />
          {workingStaff.map((member) => (
            <div
              key={member.id}
              className="p-4 border-r border-border last:border-r-0 text-center"
            >
              <div
                className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: member.avatarColor }}
              >
                {getInitials(member.name)}
              </div>
              <div className="font-medium text-sm">{member.name}</div>
              <div className="text-xs text-text-muted mt-1">
                {dayBookings.filter(b => b.staffId === member.id).length} bookings
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="grid relative" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
          {/* Current Time Line */}
          {isSameDay(selectedDate, new Date()) && (
            <div
              className="col-span-full absolute z-20 pointer-events-none"
              style={{
                top: `${((currentTime.getHours() - 9) * 60 + currentTime.getMinutes()) / 15 * 32 + 16}px`,
              }}
            >
              <div className="flex items-center">
                <div className="w-20 text-xs text-red-500 font-mono pr-2 text-right">
                  {format(currentTime, 'h:mm a')}
                </div>
                <div className="flex-1 h-0.5 bg-red-500 relative">
                  <div className="absolute -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
                </div>
              </div>
            </div>
          )}

          {/* Time Labels */}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-3 border-r border-border text-xs text-text-muted font-mono">
                {format(setHours(new Date(), hour), 'h a')}
              </div>
              {workingStaff.map((member) => (
                <div
                  key={member.id}
                  className="relative border-r border-border last:border-r-0 min-h-[64px]"
                >
                  {[0, 15, 30, 45].map((offset) => (
                    <div
                      key={offset}
                      className="absolute left-0 right-0 h-px bg-border/50"
                      style={{ top: `${offset * 32 / 15}px` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}

          {/* Booking Events */}
          {workingStaff.map((member) => {
            const memberBookings = dayBookings.filter(b => b.staffId === member.id)
            return (
              <div key={member.id} className="relative border-r border-border last:border-r-0 min-h-[768px]">
                {memberBookings.map((booking) => {
                  const { top, height } = getBookingPosition(booking)
                  const service = services.find(s => s.id === booking.serviceId)
                  const StatusIcon = statusIcons[booking.status] || Clock
                  
                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute left-2 right-2 rounded-lg cursor-pointer overflow-hidden group"
                      style={{
                        top: `${top + 16}px`,
                        height: `${height - 4}px`,
                        backgroundColor: service ? categoryColors[service.category]?.light : 'rgba(108, 60, 225, 0.2)',
                        borderLeft: `3px solid ${service ? categoryColors[service.category]?.bg : '#6C3CE1'}`,
                      }}
                      onClick={() => selectBooking(booking.id)}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="p-2 h-full flex flex-col justify-between">
                        <div>
                          <div className="font-medium text-sm truncate">{booking.customerName}</div>
                          <div className="text-xs text-text-secondary truncate">
                            {booking.serviceName} · {booking.serviceDurationMin}min
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            statusColors[booking.status]
                          }`}>
                            {booking.status === 'IN_PROGRESS' ? (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                In Progress
                              </span>
                            ) : booking.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Booking Detail Sheet */}
      <AnimatePresence>
        {showBookingDetail && selectedBooking && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={clearBookingSelection}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[420px] bg-surface border-l border-border z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm font-mono text-text-muted mb-1">{selectedBooking.bookingRef}</div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusColors[selectedBooking.status]}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <button onClick={clearBookingSelection} className="p-2 hover:bg-surface2 rounded-lg">
                    <X size={20} />
                  </button>
                </div>

                {/* Service */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">{selectedBooking.serviceName}</h2>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>{selectedBooking.serviceDurationMin} minutes</span>
                    <span>·</span>
                    <span className="font-semibold text-text-primary">${selectedBooking.servicePrice}</span>
                  </div>
                </div>

                {/* Customer */}
                <div className="bg-surface2 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {getInitials(selectedBooking.customerName)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{selectedBooking.customerName}</div>
                      <div className="text-sm text-text-secondary">{selectedBooking.customerPhone}</div>
                    </div>
                    <Link href={`/customers/${selectedBooking.customerId}`} className="text-sm text-primary hover:underline">
                      View Profile →
                    </Link>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Date & Time</span>
                    <span className="font-medium">
                      {format(parseISO(selectedBooking.scheduledAt), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Staff</span>
                    <span className="font-medium">{selectedBooking.staffName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Channel</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = channelIcons[selectedBooking.channel] || Phone
                        return <Icon size={14} className="text-text-muted" />
                      })()}
                      <span className="font-medium">{selectedBooking.channel}</span>
                    </div>
                  </div>
                  {selectedBooking.notes && (
                    <div>
                      <span className="text-text-secondary block mb-1">Notes</span>
                      <p className="text-sm bg-surface2 rounded-lg p-3">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="bg-surface2 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-secondary">Total</span>
                    <span className="text-xl font-bold">${selectedBooking.servicePrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Payment Status</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedBooking.paymentStatus === 'PAID' 
                        ? 'bg-emerald-500/15 text-emerald-400' 
                        : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {selectedBooking.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {selectedBooking.status === 'CONFIRMED' && (
                    <>
                      <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors">
                        Mark Complete
                      </button>
                      <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors">
                        Customer is a No-Show
                      </button>
                    </>
                  )}
                  <button className="w-full py-3 border border-border hover:bg-surface2 text-text-primary font-medium rounded-lg transition-colors">
                    Reschedule
                  </button>
                  <button className="w-full py-3 border border-border hover:bg-surface2 text-text-primary font-medium rounded-lg transition-colors">
                    Send Reminder
                  </button>
                  <button className="w-full py-3 text-danger hover:bg-danger/10 font-medium rounded-lg transition-colors border border-transparent">
                    Cancel Booking
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}