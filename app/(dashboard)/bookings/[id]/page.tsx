'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Phone, Mail, Calendar, MessageSquare, Clock, User, DollarSign, Check } from 'lucide-react'
import { useStudioStore } from '@/lib/stores/studioStore'
import { cn, formatCurrency, formatDuration, getInitials, statusColors } from '@/lib/utils'

export default function BookingDetailPage() {
  const { bookings, customers, staff: allStaff, services } = useStudioStore()
  const params = useParams()
  const router = useRouter()
  const booking = bookings.find(b => b.id === params.id)
  
  if (!booking) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Booking not found</h2>
        <button onClick={() => router.push('/bookings')} className="text-primary hover:underline">
          Back to Bookings
        </button>
      </div>
    )
  }

  const customer = customers.find(c => c.id === booking.customerId)
  const staffMember = allStaff.find(s => s.id === booking.staffId)
  const service = services.find(s => s.id === booking.serviceId)

  const timeline = [
    { label: 'Booking created', date: parseISO(booking.createdAt), detail: `via ${booking.channel} AI call` },
    { label: 'Confirmation sent', date: parseISO(booking.createdAt), detail: 'WhatsApp confirmation to customer' },
    { label: '24h reminder sent', date: parseISO(booking.scheduledAt).getTime() - 24 * 60 * 60 * 1000, detail: 'Reminder message sent' },
    { label: '2h reminder sent', date: parseISO(booking.scheduledAt).getTime() - 2 * 60 * 60 * 1000, detail: 'Final reminder SMS' },
  ]

  if (booking.status === 'COMPLETED') {
    timeline.push({ label: 'Appointment completed', date: parseISO(booking.endsAt), detail: `Completed by ${booking.staffName}` })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/bookings')} className="p-2 hover:bg-surface rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <span className="font-mono text-text-muted">{booking.bookingRef}</span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusColors[booking.status]}`}>
              {booking.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1">{booking.serviceName}</h1>
          <p className="text-text-secondary">Created {format(parseISO(booking.createdAt), 'MMM d, yyyy')} via {booking.channel} AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-3 space-y-6">
          {/* Customer Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                {getInitials(booking.customerName)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{booking.customerName}</h2>
                  {customer && (
                    <button onClick={() => router.push(`/customers/${customer.id}`)} className="text-sm text-primary hover:underline">
                      View full profile →
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                  <span className="flex items-center gap-1"><Phone size={14} /> {booking.customerPhone}</span>
                  {booking.customerEmail && <span className="flex items-center gap-1"><Mail size={14} /> {booking.customerEmail}</span>}
                </div>
                {customer && (
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-text-secondary">Regular customer</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-secondary">{customer.totalBookings} visits</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-secondary">${customer.totalSpent} total</span>
                  </div>
                )}
                {customer?.preferredStaffName && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-text-muted">Preferred staff:</span>
                    <span className="text-xs bg-surface2 px-2 py-1 rounded">{customer.preferredStaffName}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-text-muted">Consents:</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/15 text-emerald-400">Essential ✓</span>
                  {customer?.consents?.marketing && <span className="px-2 py-1 text-xs rounded-full bg-blue-500/15 text-blue-400">Marketing ✓</span>}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-text-muted text-sm">Date</span>
                <div className="font-medium mt-1">{format(parseISO(booking.scheduledAt), 'EEEE, MMMM d, yyyy')}</div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Time</span>
                <div className="font-medium mt-1">
                  {format(parseISO(booking.scheduledAt), 'h:mm a')} — {format(parseISO(booking.endsAt), 'h:mm a')}
                  <span className="text-text-muted text-sm ml-2">({formatDuration(booking.serviceDurationMin)})</span>
                </div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Staff</span>
                <div className="font-medium mt-1 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface2 flex items-center justify-center text-xs" style={{ backgroundColor: staffMember?.avatarColor, color: 'white' }}>
                    {staffMember && getInitials(staffMember.name)}
                  </div>
                  {booking.staffName}
                </div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Channel</span>
                <div className="font-medium mt-1">Booked via {booking.channel} AI</div>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-text-muted text-sm">Customer Notes</span>
                <p className="mt-1 text-sm bg-surface2 rounded-lg p-3">{booking.notes}</p>
              </div>
            )}
            {booking.internalNotes && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-text-muted text-sm">Internal Notes</span>
                <p className="mt-1 text-sm bg-surface2 rounded-lg p-3">{booking.internalNotes}</p>
              </div>
            )}
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    {i === timeline.length - 1 ? <Check size={14} className="text-primary" /> : <Clock size={14} className="text-text-muted" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-text-muted">{item.detail}</div>
                    <div className="text-xs text-text-muted mt-1">{format(item.date, 'MMM d, yyyy · h:mm a')}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Payment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Payment</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold">${booking.servicePrice}</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                booking.paymentStatus === 'PAID' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'
              }`}>
                {booking.paymentStatus}
              </span>
            </div>
            {booking.paymentStatus !== 'PAID' && (
              <button className="w-full py-2 border border-border rounded-lg hover:bg-surface2 transition-colors text-sm">
                Send Payment Link
              </button>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              {booking.status === 'CONFIRMED' && (
                <>
                  <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Check size={18} />
                    Mark as Complete
                  </button>
                  <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors">
                    Customer is a No-Show
                  </button>
                </>
              )}
              {booking.status === 'COMPLETED' && (
                <>
                  <button className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                    Request Review
                  </button>
                  <button className="w-full py-3 bg-surface2 hover:bg-surface3 border border-border text-text-primary font-medium rounded-lg transition-colors">
                    Book Again
                  </button>
                </>
              )}
              <button className="w-full py-2 border border-border rounded-lg hover:bg-surface2 transition-colors text-sm">
                Reschedule
              </button>
              <button className="w-full py-2 border border-border rounded-lg hover:bg-surface2 transition-colors text-sm">
                Send Reminder
              </button>
              <button className="w-full py-2 text-danger hover:bg-danger/10 font-medium rounded-lg transition-colors">
                Cancel Booking
              </button>
            </div>
          </motion.div>

          {/* Reminders */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Reminders</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">24h reminder</span>
                <span className={`text-xs px-2 py-1 rounded-full ${booking.reminderSent ? 'bg-emerald-500/15 text-emerald-400' : 'bg-surface2 text-text-muted'}`}>
                  {booking.reminderSent ? 'Sent ✓' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">2h reminder</span>
                <span className="text-xs px-2 py-1 rounded-full bg-surface2 text-text-muted">Pending</span>
              </div>
              <button className="w-full py-2 text-sm text-primary hover:underline">
                Send Manual Reminder Now
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}