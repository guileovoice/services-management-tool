'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Phone, Mail, Tag, Calendar, DollarSign, Star, MessageSquare, Check, X, AlertTriangle, Download, Trash2 } from 'lucide-react'
import { useStudioStore } from '@/lib/stores/studioStore'
import { cn, formatCurrency, formatRelativeTime, getInitials, statusColors } from '@/lib/utils'

export default function CustomerDetailPage() {
  const { customers, bookings } = useStudioStore()
  const params = useParams()
  const router = useRouter()
  const customer = customers.find(c => c.id === params.id)
  
  if (!customer) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
        <button onClick={() => router.push('/customers')} className="text-primary hover:underline">
          Back to Customers
        </button>
      </div>
    )
  }

  const customerBookings = bookings.filter(b => b.customerId === customer.id)
  const totalRevenue = customerBookings.reduce((sum, b) => sum + b.servicePrice, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/customers')} className="p-2 hover:bg-surface rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-18 h-18 w-18 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold" style={{ width: 72, height: 72 }}>
            {getInitials(customer.name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="flex items-center gap-4 text-text-secondary">
              <span className="flex items-center gap-1"><Phone size={14} /> {customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail size={14} /> {customer.email}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {customer.tags.map(tag => (
            <span key={tag} className="px-3 py-1 text-sm bg-surface2 rounded-full">{tag}</span>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">{customer.totalBookings}</div>
          <div className="text-sm text-text-secondary">Total Visits</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">{formatCurrency(customer.totalSpent)}</div>
          <div className="text-sm text-text-secondary">Total Spent</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">{formatCurrency(customer.avgBookingValue)}</div>
          <div className="text-sm text-text-secondary">Avg Booking Value</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{customer.preferredStaffName || 'N/A'}</span>
          </div>
          <div className="text-sm text-text-secondary">Preferred Staff</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-3 space-y-6">
          {/* Consent Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Consent Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface2 rounded-lg">
                <div>
                  <div className="font-medium">Essential</div>
                  <div className="text-sm text-text-secondary">Order/booking confirmations</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-xs bg-emerald-500/15 text-emerald-400 rounded-full">Always on</span>
                  <Check size={20} className="text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface2 rounded-lg">
                <div>
                  <div className="font-medium">Marketing</div>
                  <div className="text-sm text-text-secondary">Promotional messages & offers</div>
                </div>
                <div className="flex items-center gap-3">
                  {customer.consents.marketing ? (
                    <>
                      <span className="px-2 py-1 text-xs bg-emerald-500/15 text-emerald-400 rounded-full">Granted via WhatsApp · March 12</span>
                      <Check size={20} className="text-emerald-400" />
                    </>
                  ) : (
                    <>
                      <span className="px-2 py-1 text-xs bg-surface text-text-muted rounded-full">Not granted</span>
                      <X size={20} className="text-text-muted" />
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface2 rounded-lg">
                <div>
                  <div className="font-medium">Intelligence</div>
                  <div className="text-sm text-text-secondary">Ad audiences & ML predictions</div>
                </div>
                <div className="flex items-center gap-3">
                  {customer.consents.intelligence ? (
                    <span className="px-2 py-1 text-xs bg-emerald-500/15 text-emerald-400 rounded-full">Granted</span>
                  ) : (
                    <button className="px-3 py-1 text-sm text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors">
                      Request Consent
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Booking History */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Booking History</h3>
            <div className="space-y-3">
              {customerBookings.slice(0, 5).map((booking, i) => (
                <div key={booking.id} className="flex items-center gap-4 p-4 bg-surface2 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm font-medium">{format(parseISO(booking.scheduledAt), 'MMM')}</div>
                    <div className="text-2xl font-bold">{format(parseISO(booking.scheduledAt), 'd')}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{booking.serviceName}</div>
                    <div className="text-sm text-text-secondary">{booking.staffName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${booking.servicePrice}</div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Call & Message Log */}
          {customer.calls && customer.calls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Call & Message Log</h3>
              <div className="space-y-3">
                {customer.calls.map((call) => (
                  <div key={call.id} className="p-4 bg-surface2 rounded-lg">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="px-2 py-1 text-xs font-medium bg-primary/15 text-primary rounded-full">{call.intent}</span>
                      <span className="text-sm text-text-muted">{format(parseISO(call.createdAt), 'MMM d, yyyy · h:mm a')}</span>
                      <span className="text-sm text-text-muted">{Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2">{call.transcript}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Predictive Intelligence */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Predictive Intelligence</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Churn Risk</span>
                  <span className={`text-sm font-medium ${
                    customer.churnRisk === 'LOW' ? 'text-emerald-400' :
                    customer.churnRisk === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{customer.churnRisk}</span>
                </div>
                <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      customer.churnRisk === 'LOW' ? 'bg-emerald-500' :
                      customer.churnRisk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: customer.churnRisk === 'LOW' ? '15%' : customer.churnRisk === 'MEDIUM' ? '50%' : '85%' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface2 rounded-lg p-3">
                  <div className="text-xl font-bold">{formatCurrency(customer.ltv)}</div>
                  <div className="text-xs text-text-muted">LTV (12mo)</div>
                </div>
                <div className="bg-surface2 rounded-lg p-3">
                  <div className="text-xl font-bold">{customer.rfmSegment || 'N/A'}</div>
                  <div className="text-xs text-text-muted">RFM Segment</div>
                </div>
              </div>
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="text-sm">Recommended action:</div>
                <div className="text-sm font-medium">Send birthday coupon (birthday next month)</div>
              </div>
            </div>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Preferences</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Preferred staff</span>
                <span className="font-medium">{customer.preferredStaffName || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Contact channel</span>
                <span className="font-medium">{customer.preferredChannel}</span>
              </div>
              {customer.notes && (
                <div className="pt-3 border-t border-border">
                  <span className="text-text-secondary block mb-1">Notes</span>
                  <p className="text-sm">{customer.notes}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                New Booking
              </button>
              <button className="w-full py-2 border border-border rounded-lg hover:bg-surface2 transition-colors">
                Send Message
              </button>
              <button className="w-full py-2 flex items-center justify-center gap-2 border border-border rounded-lg hover:bg-surface2 transition-colors text-text-muted">
                <Download size={16} />
                Export Data (GDPR)
              </button>
              <button className="w-full py-2 flex items-center justify-center gap-2 text-danger hover:bg-danger/10 transition-colors">
                <Trash2 size={16} />
                Delete Customer
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}