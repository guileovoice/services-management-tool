'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Mail, MessageSquare, Phone, Globe, Check, Send, Calendar, Users, TrendingUp, Copy, Archive, MoreHorizontal } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

const campaigns = [
  {
    id: 1,
    name: 'Birthday Surprise — May 2026',
    channel: 'WHATSAPP',
    status: 'SENT',
    sentDate: 'May 1, 2026',
    recipients: 23,
    openRate: 78,
    converted: 9,
    conversionRate: 39,
    revenue: 630,
    message: "Happy birthday [name]! 🎉 Treat yourself — 20% off any service this month, just for you...",
  },
  {
    id: 2,
    name: 'Win-back Campaign — April',
    channel: 'SMS',
    status: 'SENT',
    sentDate: 'April 15, 2026',
    recipients: 31,
    openRate: 65,
    converted: 5,
    conversionRate: 16,
    revenue: 275,
    message: 'We miss you! It\'s been a while since your last visit. Book now and get 15% off your next service...',
  },
  {
    id: 3,
    name: 'New Service Announcement',
    channel: 'EMAIL',
    status: 'SENT',
    sentDate: 'April 8, 2026',
    recipients: 194,
    openRate: 45,
    converted: 12,
    conversionRate: 6,
    revenue: 480,
    message: 'Introducing our new Deep Cleansing Facial! Book now and experience the ultimate relaxation...',
  },
  {
    id: 4,
    name: 'Summer Promotion',
    channel: 'WHATSAPP',
    status: 'SCHEDULED',
    sentDate: 'June 1, 2026',
    recipients: 156,
    openRate: null,
    converted: null,
    conversionRate: null,
    revenue: null,
    message: 'Summer is here! 🌞 Get 25% off all color services this June. Valid through June 30th...',
  },
  {
    id: 5,
    name: 'Monthly Newsletter',
    channel: 'EMAIL',
    status: 'DRAFT',
    sentDate: null,
    recipients: 189,
    openRate: null,
    converted: null,
    conversionRate: null,
    revenue: null,
    message: 'May update: New stylists, summer hours, and our top services for the season...',
  },
]

const statusColors = {
  DRAFT: 'bg-surface2 text-text-muted',
  SCHEDULED: 'bg-blue-500/15 text-blue-400',
  SENT: 'bg-emerald-500/15 text-emerald-400',
  FAILED: 'bg-red-500/15 text-red-400',
}

const channelIcons = {
  WHATSAPP: MessageSquare,
  SMS: MessageSquare,
  EMAIL: Mail,
  VOICE: Phone,
}

const segments = [
  { label: 'All with marketing consent', count: 194 },
  { label: 'Inactive 30+ days (at risk)', count: 31 },
  { label: 'Birthday this month', count: 8 },
  { label: 'Booked 5+ times (loyals)', count: 67 },
]

export default function CampaignsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  const [createStep, setCreateStep] = useState(1)

  const tabs = ['All', 'Active', 'Scheduled', 'Drafts', 'Sent']
  const filteredCampaigns = activeTab === 'All' 
    ? campaigns 
    : campaigns.filter(c => c.status.toUpperCase() === activeTab.toUpperCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-text-secondary">8 sent · Avg open rate 68% · $3,240 attributed revenue</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={18} />
          Create Campaign
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeTab === tab
                ? 'bg-primary text-white'
                : 'bg-surface hover:bg-surface2 text-text-secondary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign, i) => {
          const ChannelIcon = channelIcons[campaign.channel as keyof typeof channelIcons] || Mail
          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-border rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center">
                    <ChannelIcon size={20} className="text-text-muted" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-text-muted">
                      <span>{campaign.channel}</span>
                      <span>·</span>
                      <span>{campaign.sentDate || 'Not sent'}</span>
                      {campaign.recipients && <span>·</span>}
                      {campaign.recipients && <span>{campaign.recipients} recipients</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[campaign.status as keyof typeof statusColors]}`}>
                    {campaign.status === 'SENT' && <Check size={14} className="inline mr-1" />}
                    {campaign.status}
                  </span>
                  <button className="p-2 hover:bg-surface2 rounded-lg">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              {campaign.openRate !== null && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-surface2 rounded-lg p-3">
                    <div className="text-2xl font-bold">{campaign.openRate}%</div>
                    <div className="text-xs text-text-muted">Open Rate</div>
                  </div>
                  <div className="bg-surface2 rounded-lg p-3">
                    <div className="text-2xl font-bold">{campaign.converted} ({campaign.conversionRate}%)</div>
                    <div className="text-xs text-text-muted">Converted</div>
                  </div>
                  <div className="bg-surface2 rounded-lg p-3">
                    <div className="text-2xl font-bold">{formatCurrency(campaign.revenue)}</div>
                    <div className="text-xs text-text-muted">Revenue</div>
                  </div>
                </div>
              )}

              <div className="bg-surface2 rounded-lg p-4 text-sm text-text-secondary mb-4">
                "{campaign.message}"
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-surface2 transition-colors">
                  View Report
                </button>
                <button className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-surface2 transition-colors">
                  Duplicate
                </button>
                <button className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-surface2 transition-colors">
                  Archive
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-surface border border-border rounded-xl p-6 w-full max-w-lg"
          >
            <h2 className="text-xl font-semibold mb-6">Create Campaign</h2>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    step <= createStep ? 'bg-primary text-white' : 'bg-surface2 text-text-muted'
                  )}
                >
                  {step}
                </div>
              ))}
            </div>

            {/* Step Content */}
            {createStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Choose Channel</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: MessageSquare, label: 'WhatsApp', desc: 'Rich messaging with templates' },
                    { icon: MessageSquare, label: 'SMS', desc: 'Text messages' },
                    { icon: Mail, label: 'Email', desc: 'Email campaigns' },
                    { icon: Phone, label: 'Voice', desc: 'Outbound calls' },
                  ].map((channel) => (
                    <button
                      key={channel.label}
                      className="p-4 bg-surface2 border border-border rounded-xl hover:border-primary transition-colors text-left"
                    >
                      <channel.icon size={24} className="mb-2" />
                      <div className="font-medium">{channel.label}</div>
                      <div className="text-xs text-text-muted">{channel.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Select Audience</h3>
                <div className="space-y-3">
                  {segments.map((seg) => (
                    <button
                      key={seg.label}
                      className="w-full p-4 bg-surface2 border border-border rounded-xl hover:border-primary transition-colors text-left flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{seg.label}</div>
                        <div className="text-sm text-text-muted">{seg.count} people</div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-border" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {createStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Compose Message</h3>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Message</label>
                  <textarea
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-lg text-text-primary"
                    rows={4}
                    placeholder="Type your message..."
                  />
                </div>
              </div>
            )}

            {createStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Schedule</h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="schedule" className="text-primary" />
                    <span>Send Now</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="schedule" className="text-primary" />
                    <span>Schedule for later</span>
                  </label>
                </div>
              </div>
            )}

            {createStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Review & Send</h3>
                <div className="bg-surface2 rounded-xl p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Channel</span>
                      <span className="font-medium">WhatsApp</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Audience</span>
                      <span className="font-medium">All with marketing consent (194)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Estimated cost</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setCreateStep(s => Math.max(1, s - 1))}
                className="px-4 py-2 text-text-secondary hover:bg-surface2 rounded-lg transition-colors"
                disabled={createStep === 1}
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (createStep === 5) {
                    setShowCreateModal(false)
                    setCreateStep(1)
                  } else {
                    setCreateStep(s => s + 1)
                  }
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
              >
                {createStep === 5 ? 'Send Campaign' : 'Continue'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}