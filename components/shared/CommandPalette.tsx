'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, User, Clock, ArrowRight, X, FileText } from 'lucide-react'
import { useUIStore } from '@/lib/stores/uiStore'
import { bookings } from '@/lib/mock-data/bookings'
import { customers } from '@/lib/mock-data/customers'
import { staff } from '@/lib/mock-data/staff'
import { formatTime, formatDate } from '@/lib/utils'
import { parseISO } from 'date-fns'

export default function CommandPalette() {
  const router = useRouter()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const todayBookings = bookings
    .filter(b => new Date(b.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)

  useEffect(() => {
    if (!commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [commandPaletteOpen])

  const actions = [
    { id: 'new-booking', label: 'New Booking', icon: Calendar, action: () => router.push('/calendar?new=true') },
    { id: 'add-customer', label: 'Add Customer', icon: User, action: () => router.push('/customers?new=true') },
    { id: 'add-lead', label: 'Add Lead', icon: FileText, action: () => router.push('/leads?new=true') },
    { id: 'block-time', label: 'Block Time', icon: Clock, action: () => router.push('/calendar?block=true') },
  ]

  const filteredBookings = todayBookings.filter(b => 
    b.customerName.toLowerCase().includes(query.toLowerCase()) ||
    b.serviceName.toLowerCase().includes(query.toLowerCase())
  )

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.phone.includes(query)
  ).slice(0, 5)

  const allItems = [
    ...actions.map(a => ({ type: 'action' as const, ...a })),
    ...filteredBookings.map(b => ({ type: 'booking' as const, ...b })),
    ...filteredCustomers.map(c => ({ type: 'customer' as const, ...c })),
  ]

  const filteredItems = query 
    ? allItems.filter(item => {
        if (item.type === 'action') return item.label.toLowerCase().includes(query.toLowerCase())
        if (item.type === 'booking') return item.customerName.toLowerCase().includes(query.toLowerCase())
        if (item.type === 'customer') return item.name.toLowerCase().includes(query.toLowerCase())
        return true
      })
    : actions

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      const item = filteredItems[selectedIndex]
      if (item.type === 'action') {
        item.action()
      } else if (item.type === 'booking') {
        router.push(`/bookings/${item.id}`)
      } else if (item.type === 'customer') {
        router.push(`/customers/${item.id}`)
      }
      setCommandPaletteOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div className="flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                <Search size={20} className="text-text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search bookings, customers, staff..."
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setCommandPaletteOpen(false)}
                  className="p-1 hover:bg-surface2 rounded transition-colors"
                >
                  <X size={16} className="text-text-muted" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {!query && (
                  <div className="px-4 py-2">
                    <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Quick Actions
                    </div>
                  </div>
                )}
                {filteredItems.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      if (item.type === 'action') {
                        item.action()
                      } else if (item.type === 'booking') {
                        router.push(`/bookings/${item.id}`)
                      } else if (item.type === 'customer') {
                        router.push(`/customers/${item.id}`)
                      }
                      setCommandPaletteOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface2 transition-colors ${
                      index === selectedIndex ? 'bg-surface2' : ''
                    }`}
                  >
                    {'icon' in item && <item.icon size={18} className="text-text-muted" />}
                    {'customerName' in item && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                        {item.customerName.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    {'name' in item && 'email' in item && (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-medium">
                        {item.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      {'label' in item && <div className="text-sm font-medium">{item.label}</div>}
                      {'customerName' in item && (
                        <div className="text-sm font-medium">{item.customerName}</div>
                      )}
                      {'name' in item && 'email' in item && (
                        <div className="text-sm font-medium">{item.name}</div>
                      )}
                    </div>
                    {'scheduledAt' in item && (
                      <div className="text-xs text-text-muted">
                        {formatTime(item.scheduledAt)} · {item.serviceName}
                      </div>
                    )}
                    {'totalBookings' in item && (
                      <div className="text-xs text-text-muted">
                        {item.totalBookings} visits · ${item.totalSpent}
                      </div>
                    )}
                    <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
                {filteredItems.length === 0 && query && (
                  <div className="px-4 py-8 text-center text-text-muted">
                    No results found for "{query}"
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border bg-surface/50 flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface rounded border border-border">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface rounded border border-border">↵</kbd>
                    Select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface rounded border border-border">Esc</kbd>
                  Close
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}