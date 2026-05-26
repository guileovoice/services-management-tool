'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStudioStore } from '@/lib/stores/studioStore'
import { cn, formatCurrency, formatDuration, getInitials, statusColors } from '@/lib/utils'

const statuses = ['All Status', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

const channels = ['All Channels', 'VOICE', 'WEB', 'WHATSAPP', 'SMS', 'WALK_IN']

export default function BookingsPage() {
  const { bookings, bootstrapData, isBootstrapped } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const [activeTab, setActiveTab] = useState('Today')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [channelFilter, setChannelFilter] = useState('All Channels')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 15

  const filteredBookings = [...bookings].filter(b => {
    if (statusFilter !== 'All Status' && b.status !== statusFilter) return false
    if (channelFilter !== 'All Channels' && b.channel !== channelFilter) return false
    if (searchQuery && !b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) && !b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const paginatedBookings = filteredBookings.slice((currentPage - 1) * perPage, currentPage * perPage)
  const totalPages = Math.ceil(filteredBookings.length / perPage)

  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length
  const noShowCount = bookings.filter(b => b.status === 'NO_SHOW').length
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length

  const tabs = [
    { label: 'Today', count: bookings.filter(b => b.scheduledAt.startsWith(format(new Date(), 'yyyy-MM-dd'))).length },
    { label: 'Upcoming', count: bookings.filter(b => new Date(b.scheduledAt) > new Date() && b.status !== 'CANCELLED').length },
    { label: 'Past', count: bookings.filter(b => new Date(b.scheduledAt) < new Date()).length },
    { label: 'All', count: bookings.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-text-secondary">Manage all your appointments</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeTab === tab.label
                ? 'bg-primary text-white'
                : 'hover:bg-surface text-text-secondary'
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">187</div>
          <div className="text-sm text-text-secondary">Total this month</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
          <div className="text-sm text-text-secondary">Completed (83%)</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-400">{noShowCount}</div>
          <div className="text-sm text-text-secondary">No-shows (4%)</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-danger">{cancelledCount}</div>
          <div className="text-sm text-text-secondary">Cancellations (12%)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by customer name or booking ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
        >
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
        >
          {channels.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Ref</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Service</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Staff</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Channel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedBookings.map((booking, i) => (
              <motion.tr
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="hover:bg-surface2 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-sm">
                  <Link href={`/bookings/${booking.id}`} className="text-primary hover:underline">
                    {booking.bookingRef}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                      {getInitials(booking.customerName)}
                    </div>
                    <div>
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-xs text-text-muted">{booking.customerPhone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{booking.serviceName}</div>
                  <div className="text-xs text-text-muted">{formatDuration(booking.serviceDurationMin)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{booking.staffName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{format(parseISO(booking.scheduledAt), 'MMM d, yyyy')}</div>
                  <div className="text-xs text-text-muted">{format(parseISO(booking.scheduledAt), 'h:mm a')}</div>
                </td>
                <td className="px-4 py-3 font-semibold">
                  ${booking.servicePrice}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-surface2">
                    {booking.channel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[booking.status]}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/bookings/${booking.id}`} className="px-2 py-1 text-xs hover:bg-surface rounded transition-colors">
                      View
                    </Link>
                    <button className="px-2 py-1 text-xs hover:bg-surface rounded transition-colors">
                      Edit
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-secondary">
          Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filteredBookings.length)} of {filteredBookings.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                currentPage === page ? 'bg-primary text-white' : 'border border-border hover:bg-surface'
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}