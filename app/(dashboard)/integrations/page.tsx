'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CreditCard, Phone, Zap, Link2, Plus, Check, X, Settings } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { staff } from '@/lib/mock-data/staff'

const integrations = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync bookings to staff calendars',
    icon: Calendar,
    connected: true,
    connectedCount: 3,
    details: 'Last sync: 2 minutes ago',
  },
  {
    id: 'stripe',
    name: 'Stripe Payments',
    description: 'Accept payments and deposits',
    icon: CreditCard,
    connected: true,
    connectedCount: 1,
    details: 'Last charge: 20 min ago · $4,820 this month',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Voice calls and WhatsApp',
    icon: Phone,
    connected: true,
    connectedCount: 1,
    details: 'Connected · Assistant active',
  },
  {
    id: 'vapi',
    name: 'Vapi Voice AI',
    description: 'AI phone assistant',
    icon: Zap,
    connected: true,
    connectedCount: 1,
    details: 'Connected · 18 calls today',
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Online booking links',
    icon: Link2,
    connected: false,
    connectedCount: 0,
    details: null,
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    description: 'Customer data sync',
    icon: Link2,
    connected: false,
    connectedCount: 0,
    details: null,
  },
]

const comingSoon = [
  { name: 'QuickBooks', description: 'Accounting' },
  { name: 'Mindbody', description: 'Industry POS' },
  { name: 'Square', description: 'Point of sale' },
]

export default function IntegrationsPage() {
  const [showManageModal, setShowManageModal] = useState<string | null>(null)

  const connectedIntegrations = integrations.filter(i => i.connected)
  const notConnectedIntegrations = integrations.filter(i => !i.connected)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-text-secondary">Connect your tools to automate booking, payments, and customer sync.</p>
      </div>

      {/* Connected */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Connected
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedIntegrations.map((integration, i) => {
            const Icon = integration.icon
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface border border-border rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <Icon size={24} className="text-emerald-400" />
                  </div>
                  <span className="px-2 py-1 text-xs bg-emerald-500/15 text-emerald-400 rounded-full flex items-center gap-1">
                    <Check size={12} />
                    Connected
                  </span>
                </div>
                <h3 className="font-semibold mb-1">{integration.name}</h3>
                <p className="text-sm text-text-secondary mb-4">{integration.description}</p>
                <div className="text-sm text-text-muted mb-4">
                  {integration.connectedCount} of {staff.length} staff connected
                </div>
                <div className="text-xs text-text-muted mb-4">{integration.details}</div>
                <button
                  onClick={() => setShowManageModal(integration.id)}
                  className="w-full py-2 border border-border rounded-lg hover:bg-surface2 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Settings size={14} />
                  Manage
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Not Connected */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notConnectedIntegrations.map((integration, i) => {
            const Icon = integration.icon
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface border border-border rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-surface2 flex items-center justify-center">
                    <Icon size={24} className="text-text-muted" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{integration.name}</h3>
                <p className="text-sm text-text-secondary mb-4">{integration.description}</p>
                <button className="w-full py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors text-sm">
                  Connect
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-text-muted">Coming Soon</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comingSoon.map((item) => (
            <div key={item.name} className="bg-surface border border-border rounded-xl p-5 opacity-60">
              <div className="w-10 h-10 rounded-lg bg-surface2 flex items-center justify-center mb-3">
                <Plus size={18} className="text-text-muted" />
              </div>
              <h3 className="font-medium mb-1">{item.name}</h3>
              <p className="text-sm text-text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Manage Modal - Google Calendar */}
      {showManageModal === 'google-calendar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowManageModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-surface border border-border rounded-xl p-6 w-full max-w-lg"
          >
            <h2 className="text-xl font-semibold mb-6">Manage Google Calendar</h2>
            
            <div className="space-y-4 mb-6">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-surface2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-text-muted">{member.googleCalendarConnected ? 'Connected' : 'Not connected'}</div>
                    </div>
                  </div>
                  {member.googleCalendarConnected ? (
                    <span className="px-3 py-1 text-sm bg-emerald-500/15 text-emerald-400 rounded-full flex items-center gap-1">
                      <Check size={14} />
                      Connected
                    </span>
                  ) : (
                    <button className="px-3 py-1 text-sm text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded" />
                <span className="text-sm">Auto-create calendar event on booking</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded" />
                <span className="text-sm">Sync cancellations to calendar</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary rounded" />
                <span className="text-sm">Add customer details to event</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowManageModal(null)}
                className="px-4 py-2 text-text-secondary hover:bg-surface2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manage Modal - Stripe */}
      {showManageModal === 'stripe' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowManageModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-surface border border-border rounded-xl p-6 w-full max-w-lg"
          >
            <h2 className="text-xl font-semibold mb-6">Manage Stripe</h2>
            
            <div className="bg-surface2 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-secondary">Connected Account</span>
                <span className="font-mono text-sm">acct_••••••••5420</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Processed this month</span>
                <span className="text-xl font-bold text-emerald-400">{formatCurrency(4820)}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded" />
                  <span className="text-sm">Require deposit for color services</span>
                </label>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Deposit percentage</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="25"
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">25%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button className="text-sm text-primary hover:underline">
                Manage payouts →
              </button>
              <button
                onClick={() => setShowManageModal(null)}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}