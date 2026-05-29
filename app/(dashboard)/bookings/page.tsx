'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek,
} from 'date-fns'
import {
  Search, Download, ChevronLeft, ChevronRight,
  Calendar, List, Plus,
} from 'lucide-react'
import { useStudioStore } from '@/lib/stores/studioStore'
import { cn, formatDuration, getInitials, statusColors } from '@/lib/utils'

const statuses = ['All Status', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const channels = ['All Channels', 'VOICE', 'WEB', 'WHATSAPP', 'SMS', 'WALK_IN']

export default function BookingsPage() {
  const router = useRouter()
  const { bookings, bootstrapData, retryBootstrap, isBootstrapped, isLoading, error } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [channelFilter, setChannelFilter] = useState('All Channels')
  const [searchQuery, setSearchQuery] = useState('')

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const dayBookings = bookings.filter(b => {
    const d = format(selectedDay, 'yyyy-MM-dd')
    return b.date === d
  })

  const filteredBookings = dayBookings.filter(b => {
    if (statusFilter !== 'All Status' && b.status !== statusFilter) return false
    if (channelFilter !== 'All Channels' && b.channel !== channelFilter) return false
    if (searchQuery && !b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) && !b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  function getDayBookings(date: Date) {
    const d = format(date, 'yyyy-MM-dd')
    return bookings.filter(b => b.date === d)
  }

  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length
  const noShowCount = bookings.filter(b => b.status === 'NO_SHOW').length
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length
  const thisMonthBookings = bookings.filter(b => (b.date ?? '').startsWith(format(new Date(), 'yyyy-MM'))).length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-text-secondary">Manage all your appointments</p>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          New Booking
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface border border-border rounded-xl p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-bold">{thisMonthBookings}</div>
          <div className="text-xs sm:text-sm text-text-secondary">Total this month</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-bold text-emerald-400">{completedCount}</div>
          <div className="text-xs sm:text-sm text-text-secondary">Completed ({bookings.length > 0 ? Math.round(completedCount / bookings.length * 100) : 0}%)</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-bold text-orange-400">{noShowCount}</div>
          <div className="text-xs sm:text-sm text-text-secondary">No-shows ({bookings.length > 0 ? Math.round(noShowCount / bookings.length * 100) : 0}%)</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-bold text-danger">{cancelledCount}</div>
          <div className="text-xs sm:text-sm text-text-secondary">Cancellations ({bookings.length > 0 ? Math.round(cancelledCount / bookings.length * 100) : 0}%)</div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
                viewMode === 'calendar' ? 'bg-primary text-white' : 'hover:bg-surface2 text-text-secondary'
              )}
            >
              <Calendar size={14} />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
                viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-surface2 text-text-secondary'
              )}
            >
              <List size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-surface transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-sm sm:text-lg font-semibold min-w-[120px] sm:min-w-[160px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-surface transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()) }}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium border border-border rounded-lg hover:bg-surface transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'calendar' && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="px-3 py-2 text-xs font-medium text-text-muted uppercase text-center bg-surface2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayBks = getDayBookings(day)
              const isSelected = isSameDay(day, selectedDay)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isTodayDate = isToday(day)

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'min-h-[80px] p-2 border-b border-r border-border text-left transition-colors relative',
                    !isCurrentMonth && 'opacity-30',
                    isSelected && 'bg-primary/5',
                    isTodayDate && 'bg-primary/10',
                    'hover:bg-surface2'
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full',
                    isTodayDate && 'bg-primary text-white',
                    !isTodayDate && isCurrentMonth && 'text-text-primary',
                    !isCurrentMonth && 'text-text-muted',
                  )}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayBks.slice(0, 3).map(b => (
                      <div
                        key={b.id}
                        className={cn(
                          'text-[10px] px-1 py-0.5 rounded truncate font-medium',
                          b.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                          b.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-300' :
                          b.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
                          b.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300' :
                          b.status === 'NO_SHOW' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-surface2 text-text-muted'
                        )}
                      >
                        {b.customerName.split(' ')[0]} {b.time}
                      </div>
                    ))}
                    {dayBks.length > 3 && (
                      <div className="text-[10px] text-text-muted pl-1">+{dayBks.length - 3} more</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-surface border border-border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-surface2">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Ref</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Customer</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Service</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Staff</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Date & Time</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Price</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Channel</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted">
                    <div className="flex justify-center items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading bookings...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted">
                    <p className="text-danger mb-2">Failed to load bookings</p>
                    <p className="text-sm">{error}</p>
                    <button
                      onClick={() => retryBootstrap()}
                      className="mt-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted">
                    <div className="max-w-sm mx-auto">
                      <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium text-text-secondary mb-1">No bookings yet</p>
                      <p className="text-sm">Create your first booking from the Calendar page to get started.</p>
                      <Link
                        href="/calendar"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg"
                      >
                        <Plus size={16} />
                        Go to Calendar
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : null}
              {!isLoading && !error && bookings.length > 0 && bookings.map((booking, i) => (
                <motion.tr
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                  className="hover:bg-surface2 transition-colors cursor-pointer"
                >
                  <td className="px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm">
                    <Link href={`/bookings/${booking.id}`} className="text-primary hover:underline">
                      {booking.bookingRef}
                    </Link>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                        {getInitials(booking.customerName)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{booking.customerName}</div>
                        <div className="text-xs text-text-muted truncate">{booking.customerPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="font-medium text-sm">{booking.serviceName}</div>
                    <div className="text-xs text-text-muted">{formatDuration(booking.serviceDurationMin)}</div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-sm">
                    <div className="font-medium">{booking.staffName}</div>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="font-medium text-sm">{booking.date}</div>
                    <div className="text-xs text-text-muted">{booking.time}</div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-semibold text-sm">
                    ${booking.servicePrice}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-surface2">
                      {booking.channel}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/bookings/${booking.id}`} className="px-2 py-1 text-xs hover:bg-surface rounded transition-colors">
                        View
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Day Details */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-semibold">
              {isSameDay(selectedDay, new Date()) ? "Today's" : format(selectedDay, 'EEEE, MMMM d')} Bookings
              <span className="text-text-secondary text-sm font-normal ml-2">({dayBookings.length})</span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none min-w-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search day..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm bg-surface2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary w-full sm:w-48"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
              >
                {channels.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-surface2">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Ref</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Customer</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Service</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Staff</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Time</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Price</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted">
                      {searchQuery || statusFilter !== 'All Status' || channelFilter !== 'All Channels'
                        ? 'No bookings match your filters.'
                        : 'No bookings on this day.'}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking, i) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                      className="hover:bg-surface2 transition-colors cursor-pointer"
                    >
                      <td className="px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm">
                        <Link href={`/bookings/${booking.id}`} className="text-primary hover:underline">
                          {booking.bookingRef}
                        </Link>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                            {getInitials(booking.customerName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{booking.customerName}</div>
                            <div className="text-xs text-text-muted truncate">{booking.customerPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="font-medium text-sm">{booking.serviceName}</div>
                        <div className="text-xs text-text-muted">{formatDuration(booking.serviceDurationMin)}</div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm">
                        <div className="font-medium">{booking.staffName}</div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm">
                        <div className="font-medium">{booking.time}</div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-sm">
                        ${booking.servicePrice}
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[booking.status]}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <Link href={`/bookings/${booking.id}`} className="px-2 py-1 text-xs hover:bg-surface rounded transition-colors">
                          View
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
