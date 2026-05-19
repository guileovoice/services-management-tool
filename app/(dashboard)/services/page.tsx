'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Flame, Clock, DollarSign } from 'lucide-react'
import { services } from '@/lib/mock-data/services'
import { staff } from '@/lib/mock-data/staff'
import { cn, formatCurrency, formatDuration, getInitials } from '@/lib/utils'
import type { ServiceCategory } from '@/lib/types'

const categories: { label: string; value: ServiceCategory | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Hair', value: 'HAIR' },
  { label: 'Color', value: 'COLOR' },
  { label: 'Beard', value: 'BEARD' },
  { label: 'Nails', value: 'NAILS' },
  { label: 'Spa', value: 'SPA' },
]

const categoryColors: Record<string, { bg: string; text: string }> = {
  HAIR: { bg: 'rgba(108, 60, 225, 0.15)', text: '#6C3CE1' },
  COLOR: { bg: 'rgba(236, 72, 153, 0.15)', text: '#EC4899' },
  BEARD: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
  NAILS: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
  SPA: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
}

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'ALL'>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredServices = activeCategory === 'ALL' 
    ? services 
    : services.filter(s => s.category === activeCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Catalog</h1>
          <p className="text-text-secondary">{services.length} services · {categories.length - 1} categories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Service
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const count = cat.value === 'ALL' 
            ? services.length 
            : services.filter(s => s.category === cat.value).length
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                activeCategory === cat.value
                  ? 'bg-primary text-white'
                  : 'bg-surface hover:bg-surface2 text-text-secondary'
              )}
            >
              {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service, i) => {
          const serviceStaff = staff.filter(s => service.staffIds.includes(s.id))
          const colors = categoryColors[service.category] || { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' }
          
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-border rounded-xl p-5 hover:scale-[1.01] hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="px-3 py-1 text-xs font-medium rounded-full"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {service.category}
                  </span>
                  {service.isPopular && (
                    <span className="flex items-center gap-1 text-xs text-orange-400">
                      <Flame size={12} />
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 hover:bg-surface2 rounded transition-colors">
                    <Pencil size={14} className="text-text-muted" />
                  </button>
                  <button className="p-1.5 hover:bg-surface2 rounded transition-colors">
                    <Trash2 size={14} className="text-text-muted" />
                  </button>
                </div>
              </div>

              {/* Service Info */}
              <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
              <p className="text-sm text-text-secondary mb-4 line-clamp-2">{service.description}</p>

              {/* Duration & Price */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Clock size={14} />
                  {formatDuration(service.durationMin)}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <DollarSign size={14} />
                  {formatCurrency(service.price)}
                </div>
              </div>

              {/* Staff */}
              <div className="mb-4">
                <div className="text-xs text-text-muted mb-2">Staff</div>
                <div className="flex items-center gap-1">
                  {serviceStaff.slice(0, 3).map((s, idx) => (
                    <div
                      key={s.id}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium -ml-2 first:ml-0 border-2 border-surface"
                      style={{ backgroundColor: s.avatarColor, zIndex: 3 - idx }}
                    >
                      {getInitials(s.name)}
                    </div>
                  ))}
                  {serviceStaff.length > 3 && (
                    <span className="text-xs text-text-muted ml-2">+{serviceStaff.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className={`text-sm ${service.isActive ? 'text-emerald-400' : 'text-text-muted'}`}>
                  {service.isActive ? '● Available' : '○ Unavailable'}
                </span>
                {service.requiresDeposit && (
                  <span className="text-xs text-text-muted">
                    Requires ${service.depositAmount} deposit
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-surface border border-border rounded-xl p-6 w-full max-w-lg"
          >
            <h2 className="text-xl font-semibold mb-6">Add Service</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Service Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  placeholder="Enter service name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Category</label>
                  <select className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary">
                    <option value="HAIR">Hair</option>
                    <option value="COLOR">Color</option>
                    <option value="BEARD">Beard</option>
                    <option value="NAILS">Nails</option>
                    <option value="SPA">Spa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Duration (minutes)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    placeholder="60"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Price ($)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  placeholder="0"
                />
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
                Add Service
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}