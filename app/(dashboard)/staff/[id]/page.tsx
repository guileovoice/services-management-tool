'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format, parseISO, addDays } from 'date-fns'
import { ArrowLeft, Star, Calendar, DollarSign, Edit, ExternalLink, Check } from 'lucide-react'
import { useStudioStore } from '@/lib/stores/studioStore'
import { cn, formatCurrency, formatDuration, getInitials, statusColors } from '@/lib/utils'

function getDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

export default function StaffDetailPage() {
  const { staff, services, bookings } = useStudioStore()
  const params = useParams()
  const router = useRouter()
  const member = staff.find(s => s.id === params.id)
  
  if (!member) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Staff member not found</h2>
        <button onClick={() => router.push('/staff')} className="text-primary hover:underline">
          Back to Team
        </button>
      </div>
    )
  }

  const memberServices = services.filter(s => member.services.includes(s.id))
  const memberBookings = bookings.filter(b => b.staffId === member.id).slice(0, 10)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - new Date().getDay()))
  const today = new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/staff')} className="p-2 hover:bg-surface rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: member.avatarColor }}
          >
            {getInitials(member.name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{member.name}</h1>
            <p className="text-text-secondary">{member.roleTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-text-muted'}`} />
            <span className="text-sm">{member.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          {member.googleCalendarConnected && (
            <span className="flex items-center gap-1 text-sm text-emerald-400">
              <Calendar size={14} />
              Google Calendar connected
            </span>
          )}
          <button className="p-2 hover:bg-surface rounded-lg">
            <Edit size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-3 space-y-6">
          {/* Bio & Services */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <p className="text-text-secondary mb-4">{member.bio}</p>
            <div className="flex flex-wrap gap-2">
              {memberServices.map(service => (
                <span
                  key={service.id}
                  className="px-3 py-1.5 text-sm font-medium rounded-full"
                  style={{ backgroundColor: `${service.color}20`, color: service.color }}
                >
                  {service.name}
                </span>
              ))}
            </div>
          </motion.div>

          {/* This Week's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">This Week's Schedule</h3>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => {
                const dayName = getDayName(day)
                const hours = member.workingHours[dayName]
                const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                const dayBookings = bookings.filter(b => {
                  const bDate = parseISO(b.scheduledAt)
                  return b.staffId === member.id && format(bDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                })
                
                return (
                  <div
                    key={i}
                    className={cn(
                      'p-3 rounded-lg text-center',
                      isToday ? 'bg-primary/10 border border-primary/30' : 'bg-surface2',
                      hours?.closed ? 'opacity-50' : ''
                    )}
                  >
                    <div className="text-xs font-medium text-text-muted mb-2">
                      {format(day, 'EEE')}
                    </div>
                    {hours?.closed ? (
                      <div className="text-xs text-text-muted">Off</div>
                    ) : (
                      <>
                        <div className="text-sm font-medium">{hours?.open}</div>
                        <div className="text-xs text-text-muted">to {hours?.close}</div>
                        {dayBookings.length > 0 && (
                          <div className="mt-2 text-xs text-primary">
                            {dayBookings.length} bookings
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
            <div className="space-y-3">
              {memberBookings.map((booking, i) => (
                <div key={booking.id} className="flex items-center gap-4 p-3 bg-surface2 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{booking.customerName}</div>
                    <div className="text-sm text-text-secondary">{booking.serviceName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{format(parseISO(booking.scheduledAt), 'MMM d')}</div>
                    <div className="text-xs text-text-muted">{format(parseISO(booking.scheduledAt), 'h:mm a')}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    cn(statusColors[booking.status])
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Performance</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs text-text-muted uppercase mb-2">This Week</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface2 rounded-lg p-3">
                    <div className="text-2xl font-bold">{member.bookingsThisWeek}</div>
                    <div className="text-xs text-text-muted">Bookings</div>
                  </div>
                  <div className="bg-surface2 rounded-lg p-3">
                    <div className="text-2xl font-bold">{formatCurrency(member.totalRevenue / 4)}</div>
                    <div className="text-xs text-text-muted">Revenue</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-surface2 rounded-lg p-3">
                    <div className="text-2xl font-bold">{member.utilizationRate}%</div>
                    <div className="text-xs text-text-muted">Utilization</div>
                  </div>
                  <div className="bg-surface2 rounded-lg p-3">
                    <div className="text-2xl font-bold">${Math.round(member.totalRevenue / member.bookingsThisWeek)}</div>
                    <div className="text-xs text-text-muted">Avg Value</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-xs text-text-muted uppercase mb-2">All Time</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Revenue</span>
                    <span className="font-semibold">{formatCurrency(member.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Bookings</span>
                    <span className="font-semibold">354</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Rating</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Star size={14} className="text-warning fill-warning" />
                      {member.rating} (47 reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Services</h3>
              <button className="text-sm text-primary hover:underline">Edit</button>
            </div>
            <div className="space-y-3">
              {memberServices.map(service => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-xs text-text-muted">{formatDuration(service.durationMin)}</div>
                  </div>
                  <span className="font-semibold">${service.price}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Working Hours */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Working Hours</h3>
              <button className="text-sm text-primary hover:underline">Edit</button>
            </div>
            <div className="space-y-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const hours = member.workingHours[day]
                return (
                  <div key={day} className="flex items-center justify-between py-2">
                    <span className="text-sm capitalize">{day}</span>
                    {hours.closed ? (
                      <span className="text-sm text-text-muted">Day off</span>
                    ) : (
                      <span className="text-sm font-mono">
                        {hours.open} — {hours.close}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Integrations */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Integrations</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Calendar size={16} className="text-gray-700" />
                  </div>
                  <span className="text-sm font-medium">Google Calendar</span>
                </div>
                {member.googleCalendarConnected ? (
                  <span className="flex items-center gap-1 text-sm text-emerald-400">
                    <Check size={14} />
                    Connected
                  </span>
                ) : (
                  <button className="text-sm text-primary hover:underline">Connect</button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}