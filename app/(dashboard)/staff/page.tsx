'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus, Star, Calendar, DollarSign, MoreHorizontal, MapPin } from 'lucide-react'
import { staff } from '@/lib/mock-data/staff'
import { services } from '@/lib/mock-data/services'
import { cn, formatCurrency, getInitials } from '@/lib/utils'

export default function StaffPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-text-secondary">{staff.length} active staff members</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Staff Member
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member, i) => {
          const memberServices = services.filter(s => member.services.includes(s.id))
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface border border-border rounded-xl p-6 hover:scale-[1.01] hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{member.name}</div>
                    <div className="text-sm text-text-secondary">{member.roleTitle}</div>
                  </div>
                </div>
                <button className="p-2 hover:bg-surface2 rounded-lg">
                  <MoreHorizontal size={18} className="text-text-muted" />
                </button>
              </div>

              {/* Stats */}
              <div className="mb-4">
                <div className="text-sm text-text-secondary mb-1">{member.bookingsToday} bookings today</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-surface2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${member.utilizationRate}%`, backgroundColor: member.avatarColor }}
                    />
                  </div>
                  <span className="text-sm font-medium">{member.utilizationRate}%</span>
                </div>
                <div className="text-xs text-text-muted mt-1">utilization rate</div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-warning fill-warning" />
                  <span className="font-medium">{member.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign size={14} className="text-emerald-400" />
                  <span className="font-medium">{formatCurrency(member.totalRevenue)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} className={member.googleCalendarConnected ? 'text-primary' : 'text-text-muted'} />
                  <span className={member.googleCalendarConnected ? 'text-primary' : 'text-text-muted'}>
                    {member.googleCalendarConnected ? 'Connected' : 'Not linked'}
                  </span>
                </div>
              </div>

              {/* Services */}
              <div className="flex flex-wrap gap-2 mb-4">
                {memberServices.slice(0, 3).map(service => (
                  <span
                    key={service.id}
                    className="px-2 py-1 text-xs font-medium rounded-full"
                    style={{ backgroundColor: `${service.color}20`, color: service.color }}
                  >
                    {service.name}
                  </span>
                ))}
                {memberServices.length > 3 && (
                  <span className="px-2 py-1 text-xs text-text-muted">
                    +{memberServices.length - 3} more
                  </span>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-text-muted'}`} />
                  <span className="text-sm">{member.isActive ? 'Working today' : 'Day off'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/staff/${member.id}`}
                    className="px-3 py-1.5 text-sm font-medium hover:bg-surface2 rounded-lg transition-colors"
                  >
                    View Profile
                  </Link>
                  <button className="px-3 py-1.5 text-sm font-medium bg-surface2 hover:bg-surface3 rounded-lg transition-colors">
                    Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Add Staff Modal (Simplified) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-surface border border-border rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-6">Add Staff Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Role Title</label>
                <select className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary">
                  <option>Stylist</option>
                  <option>Barber</option>
                  <option>Nail Tech</option>
                  <option>Esthetician</option>
                  <option>Colorist</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-text-secondary hover:bg-surface2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                Add Staff Member
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}