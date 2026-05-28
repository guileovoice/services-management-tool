'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, Download, Filter, ChevronRight, Phone, Mail, Calendar, Clock, AlertTriangle } from 'lucide-react'
import { useStudioStore } from '@/lib/stores/studioStore'
import { cn, formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils'

export default function CustomersPage() {
  const { customers, bootstrapData, isBootstrapped } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const [searchQuery, setSearchQuery] = useState('')
  const [activeSegment, setActiveSegment] = useState('All Customers')

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.lastBookingAt && new Date(c.lastBookingAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
  const atRiskCustomers = customers.filter(c => c.churnRisk === 'HIGH').length
  const marketingConsent = customers.filter(c => c.consents.marketing).length

  const segments = [
    { label: 'All Customers', count: totalCustomers },
    { label: 'Champions (18+ visits)', count: customers.filter(c => c.totalBookings >= 18).length },
    { label: 'Loyal (8-17 visits)', count: customers.filter(c => c.totalBookings >= 8 && c.totalBookings < 18).length },
    { label: 'Potential (3-7 visits)', count: customers.filter(c => c.totalBookings >= 3 && c.totalBookings < 8).length },
    { label: 'New (1-2 visits)', count: customers.filter(c => c.totalBookings >= 1 && c.totalBookings < 3).length },
    { label: 'At Risk (30d+)', count: atRiskCustomers },
    { label: 'Lost (90d+)', count: customers.filter(c => c.totalBookings === 0 || (c.lastBookingAt && new Date(c.lastBookingAt) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))).length },
  ]

  const filteredCustomers = customers.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.phone.includes(searchQuery)) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-text-secondary">{totalCustomers} total customers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors">
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">{totalCustomers}</div>
          <div className="text-sm text-text-secondary">Total Customers</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-400">{activeCustomers}</div>
          <div className="text-sm text-text-secondary">Active (30d)</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-warning">{atRiskCustomers}</div>
          <div className="text-sm text-text-secondary">At Risk</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">{marketingConsent}</div>
          <div className="text-sm text-text-secondary">Marketing Consent</div>
        </div>
      </div>

      {/* Segments */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {segments.map((seg) => (
          <button
            key={seg.label}
            onClick={() => setActiveSegment(seg.label)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
              activeSegment === seg.label
                ? 'bg-primary text-white'
                : 'bg-surface hover:bg-surface2 text-text-secondary'
            )}
          >
            {seg.label} ({seg.count})
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border rounded-lg hover:bg-surface3 transition-colors">
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Customer Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Visits</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Total Spent</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Avg Booking</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Last Visit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Preferred Staff</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Consents</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Churn Risk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">No-Shows</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCustomers.map((customer, i) => (
              <motion.tr
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="hover:bg-surface2 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <Link href={`/customers/${customer.id}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                      {getInitials(customer.name)}
                    </div>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-text-muted">{customer.phone}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-sm font-medium rounded-full bg-surface2">
                    {customer.totalBookings}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatCurrency(customer.totalSpent)}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {formatCurrency(customer.avgBookingValue)}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {customer.lastBookingAt ? formatRelativeTime(customer.lastBookingAt) : '-'}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {customer.preferredStaffName || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${customer.consents.essential ? 'bg-emerald-500/15 text-emerald-400' : 'bg-surface2 text-text-muted'}`}>E</span>
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${customer.consents.marketing ? 'bg-blue-500/15 text-blue-400' : 'bg-surface2 text-text-muted'}`}>M</span>
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${customer.consents.intelligence ? 'bg-violet-500/15 text-violet-400' : 'bg-surface2 text-text-muted'}`}>I</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    customer.churnRisk === 'LOW' ? 'bg-emerald-500/15 text-emerald-400' :
                    customer.churnRisk === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-red-500/15 text-red-400'
                  }`}>
                    {customer.churnRisk}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm ${customer.noShowCount > 2 ? 'text-danger font-medium' : 'text-text-secondary'}`}>
                    {customer.noShowCount}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}