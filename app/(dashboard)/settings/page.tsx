'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Bot, Calendar, Bell, Users, CreditCard, AlertTriangle, Play, ChevronRight, X, Check, Upload, MapPin } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useStudioStore } from '@/lib/stores/studioStore'

const tabs = [
  { id: 'business', label: 'Business Info', icon: Building2 },
  { id: 'voice', label: 'Voice Agent', icon: Bot },
  { id: 'booking', label: 'Booking Rules', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'team', label: 'Team Access', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
]

const voices = [
  { id: 'alex', name: 'Alex', desc: 'Professional & Warm', gender: 'male', selected: false },
  { id: 'sofia', name: 'Sofia', desc: 'Friendly & Energetic', gender: 'female', selected: true },
  { id: 'jordan', name: 'Jordan', desc: 'Calm & Neutral', gender: 'non-binary', selected: false },
]

export default function SettingsPage() {
  const { bootstrapData, isBootstrapped } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const [activeTab, setActiveTab] = useState('business')
  const [selectedVoice, setSelectedVoice] = useState('sofia')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-text-secondary">Manage your business settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-xl p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface2'
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-surface border border-border rounded-xl p-6">
            {activeTab === 'business' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Business Information</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-secondary">Business Name</label>
                    <input
                      type="text"
                      defaultValue="The Studio"
                      className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-secondary">Business Type</label>
                    <select className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary">
                      <option>Salon / Barbershop</option>
                      <option>Spa</option>
                      <option>Law Firm</option>
                      <option>Contractor</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-secondary">Phone Number</label>
                    <input
                      type="text"
                      defaultValue="+1 (718) 555-4200"
                      className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-secondary">Email</label>
                    <input
                      type="email"
                      defaultValue="hello@thestudio.com"
                      className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Address</label>
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-text-muted" />
                    <input
                      type="text"
                      defaultValue="127 Bedford Ave, Williamsburg, Brooklyn, NY 11211"
                      className="flex-1 px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Logo</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload size={32} className="mx-auto mb-2 text-text-muted" />
                    <p className="text-sm text-text-muted">Drag & drop or click to upload</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Operating Hours</label>
                  <div className="space-y-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center justify-between py-2">
                        <span className="text-sm w-28">{day}</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded" />
                            <span className="text-sm">Open</span>
                          </label>
                          <input
                            type="time"
                            defaultValue="09:00"
                            className="px-3 py-1 bg-surface2 border border-border rounded-lg text-text-primary text-sm"
                          />
                          <span className="text-text-muted">to</span>
                          <input
                            type="time"
                            defaultValue="20:00"
                            className="px-3 py-1 bg-surface2 border border-border rounded-lg text-text-primary text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Voice Agent</h2>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Agent Name</label>
                  <input
                    type="text"
                    defaultValue="Alex"
                    className="w-48 px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Voice Selection</label>
                  <div className="grid grid-cols-3 gap-4">
                    {voices.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-colors text-left',
                          selectedVoice === voice.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center mb-3">
                          <Play size={20} className="text-text-muted ml-1" />
                        </div>
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-xs text-text-muted">{voice.desc}</div>
                        <div className="text-xs text-text-muted mt-1">{voice.gender}</div>
                        {selectedVoice === voice.id && (
                          <div className="mt-2 text-xs text-primary flex items-center gap-1">
                            <Check size={14} />
                            Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Language</label>
                  <div className="flex items-center gap-4">
                    <select className="px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary">
                      <option>English</option>
                      <option>Spanish</option>
                    </select>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-primary rounded" />
                      <span className="text-sm">Add Spanish</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Escalation</label>
                  <p className="text-sm text-text-muted mb-3">Transfer to human after unanswered questions</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        className={cn(
                          'w-10 h-10 rounded-lg font-medium transition-colors',
                          n === 3 ? 'bg-primary text-white' : 'bg-surface2 hover:bg-surface3'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">After Hours Behavior</label>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="afterhours" className="mt-1 text-primary" />
                      <div>
                        <span className="text-sm font-medium">Play voicemail message</span>
                        <p className="text-xs text-text-muted">Customers can leave a message</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="afterhours" className="mt-1 text-primary" />
                      <div>
                        <span className="text-sm font-medium">Still take bookings</span>
                        <p className="text-xs text-text-muted">Schedule for next available slot</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="afterhours" defaultChecked className="mt-1 text-primary" />
                      <div>
                        <span className="text-sm font-medium">Transfer to on-call number</span>
                      </div>
                    </label>
                  </div>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="mt-3 w-64 px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <button className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Booking Rules</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-secondary">Minimum booking notice</label>
                    <select className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary">
                      <option>2 hours</option>
                      <option>4 hours</option>
                      <option>12 hours</option>
                      <option>24 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-secondary">Maximum booking advance</label>
                    <select className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary">
                      <option>30 days</option>
                      <option>60 days</option>
                      <option>90 days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Cancellation Policy</label>
                  <textarea
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-lg text-text-primary resize-none"
                    rows={3}
                    defaultValue="Free cancellation up to 24 hours before your appointment."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Buffer between appointments</label>
                  <div className="flex items-center gap-4">
                    {[0, 5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        className={cn(
                          'px-4 py-2 rounded-lg font-medium transition-colors',
                          mins === 0 ? 'bg-primary text-white' : 'bg-surface2 hover:bg-surface3'
                        )}
                      >
                        {mins === 0 ? 'None' : `${mins} min`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded" />
                    <span className="text-sm">Require confirmation via YES reply</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded" />
                    <span className="text-sm">Allow online booking during phone holds</span>
                  </label>
                </div>

                <button className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Notifications</h2>

                <div className="space-y-4">
                  {[
                    { label: 'New booking created', desc: 'Get notified when AI books a new appointment' },
                    { label: 'Booking cancelled', desc: 'Get notified when a booking is cancelled' },
                    { label: 'No-show flagged', desc: 'Get notified when a customer is marked as no-show' },
                    { label: 'New lead from AI', desc: 'Get notified when AI captures a new lead' },
                    { label: 'Daily summary', desc: 'Receive a daily summary of bookings and stats' },
                    { label: 'Staff schedule change', desc: 'Get notified when staff update their availability' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-text-muted">{item.desc}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded" />
                          <span className="text-sm">Push</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded" />
                          <span className="text-sm">Email</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 text-primary rounded" />
                          <span className="text-sm">SMS</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Team Access</h2>
                  <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors text-sm">
                    Invite Team Member
                  </button>
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-text-muted uppercase">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Last Login</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-3 font-medium">Luis Costa</td>
                      <td className="py-3 text-text-secondary">luis@thestudio.com</td>
                      <td className="py-3">
                        <span className="px-2 py-1 text-xs bg-amber-500/15 text-amber-400 rounded-full">Owner</span>
                      </td>
                      <td className="py-3 text-text-muted">Just now</td>
                      <td className="py-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">Marcus Silva</td>
                      <td className="py-3 text-text-secondary">marcus@thestudio.com</td>
                      <td className="py-3">
                        <span className="px-2 py-1 text-xs bg-blue-500/15 text-blue-400 rounded-full">Staff</span>
                      </td>
                      <td className="py-3 text-text-muted">2 hours ago</td>
                      <td className="py-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Billing</h2>

                <div className="bg-surface2 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold">GROWTH PLAN</div>
                      <div className="text-text-secondary">$149/month</div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg hover:opacity-90 transition-opacity">
                      Upgrade to Scale
                    </button>
                  </div>
                  <div className="text-sm text-text-muted">
                    Next billing date: June 1, 2026
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Invoice History</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-text-muted">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-2">May 1, 2026</td>
                        <td className="py-2">{formatCurrency(149)}</td>
                        <td className="py-2 text-emerald-400">Paid</td>
                      </tr>
                      <tr>
                        <td className="py-2">April 1, 2026</td>
                        <td className="py-2">{formatCurrency(149)}</td>
                        <td className="py-2 text-emerald-400">Paid</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-danger">Danger Zone</h2>

                <div className="border border-danger/30 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-danger/15 flex items-center justify-center flex-shrink-0">
                      <Upload size={24} className="text-danger" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Export all business data</h3>
                      <p className="text-sm text-text-secondary mb-3">Download all your bookings, customers, and settings as a JSON file.</p>
                      <button className="px-4 py-2 border border-border rounded-lg hover:bg-surface2 transition-colors text-sm">
                        Export Data (GDPR)
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-danger/15 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={24} className="text-danger" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">Delete all customer data</h3>
                        <p className="text-sm text-text-secondary mb-3">Permanently delete all customer data. This action cannot be undone.</p>
                        <button className="px-4 py-2 bg-danger/15 text-danger border border-danger/30 rounded-lg hover:bg-danger/25 transition-colors text-sm">
                          Delete Customer Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}