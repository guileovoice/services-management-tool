'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Phone, MessageSquare, Clock, Filter, Download, Search, Play, FileAudio } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useStudioStore } from '@/lib/stores/studioStore'
import { supabase } from '@/lib/supabaseClient'
import type { Channel } from '@/lib/types'

interface CallEntry {
  id: string; customerName: string; customerPhone: string; channel: string; duration: number; intent: string; outcome: string; sentiment: string; cost: number; createdAt: string; transcript: string
}

const intentColors = {
  BOOKING: 'bg-emerald-500/15 text-emerald-400',
  INQUIRY: 'bg-blue-500/15 text-blue-400',
  COMPLAINT: 'bg-red-500/15 text-red-400',
  LEAD: 'bg-violet-500/15 text-violet-400',
  CANCEL: 'bg-orange-500/15 text-orange-400',
  RESCHEDULE: 'bg-yellow-500/15 text-yellow-400',
  OTHER: 'bg-surface2 text-text-muted',
}

const sentimentIcons = {
  POSITIVE: { icon: '😊', label: 'Positive' },
  NEUTRAL: { icon: '😐', label: 'Neutral' },
  NEGATIVE: { icon: '😞', label: 'Negative' },
}

const channelIcons = {
  VOICE: Phone,
  WHATSAPP: MessageSquare,
  SMS: MessageSquare,
  WEB: Phone,
  WALK_IN: Phone,
}

export default function CallsPage() {
  const { bootstrapData, isBootstrapped } = useStudioStore()
  const [dbCalls, setDbCalls] = useState<CallEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  useEffect(() => {
    async function fetchCalls() {
      setLoading(true)
      const { data } = await supabase
        .from('vapi_call_logs')
        .select('*')
        .order('started_at', { ascending: false })
      
      if (data) {
        const mapped: CallEntry[] = data.map((row, idx) => ({
          id: row.id || `call-db-${idx}`,
          customerName: row.customer_name || 'Guest User',
          customerPhone: row.customer_phone || 'Unknown Phone',
          channel: (row.type && row.type.includes('web') ? 'WEB' : 'VOICE') as Channel,
          duration: row.duration_seconds || 0,
          intent: (row.summary && row.summary.toUpperCase().includes('BOOK') ? 'BOOKING' : 'INQUIRY'),
          outcome: (row.status === 'assistant-ended-call' ? 'Handled by AI' : 'Failed'),
          sentiment: 'NEUTRAL',
          cost: row.cost_usd || 0,
          createdAt: row.started_at || row.created_at,
          transcript: row.transcript || ''
        }))
        setDbCalls(mapped)
      }
      setLoading(false)
    }
    fetchCalls()
  }, [])

  const [selectedCall, setSelectedCall] = useState<CallEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const calls = dbCalls

  const filteredCalls = calls.filter(c => 
    (c.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.customerPhone || '').includes(searchQuery)
  )

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Call & Message Logs</h1>
          <p className="text-text-secondary">18 total today · 83% handled by AI · 9 bookings created</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors">
          <Download size={16} />
          Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">18</div>
          <div className="text-sm text-text-secondary">Total Today</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">15 (83%)</div>
          <div className="text-sm text-text-secondary">Handled by AI</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-400">9</div>
          <div className="text-sm text-text-secondary">Bookings Created</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">1m 52s</div>
          <div className="text-sm text-text-secondary">Avg Duration</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search calls..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
        />
      </div>

      {/* Calls Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Channel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Intent</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Outcome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Sentiment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-text-muted">
                  <div className="flex justify-center items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading call logs from Supabase...
                  </div>
                </td>
              </tr>
            ) : filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-text-muted">
                  No call logs found in Supabase.
                </td>
              </tr>
            ) : (
              filteredCalls.map((call, i) => {
                const ChannelIcon = channelIcons[call.channel] || Phone
                const sent = sentimentIcons[call.sentiment as keyof typeof sentimentIcons]
              return (
                <motion.tr
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-surface2 transition-colors cursor-pointer"
                  onClick={() => setSelectedCall(call)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{call.customerName}</div>
                      <div className="text-xs text-text-muted">{call.customerPhone}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ChannelIcon size={14} className="text-text-muted" />
                      <span className="text-sm">{call.channel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm">
                    {formatRelativeTime(call.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm">
                    {formatDuration(call.duration)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${intentColors[call.intent as keyof typeof intentColors]}`}>
                      {call.intent}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{call.outcome}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-lg">{sent.icon}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-sm">
                    ${call.cost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-3 py-1.5 text-xs font-medium bg-surface2 hover:bg-surface3 rounded-lg transition-colors">
                      Transcript
                    </button>
                  </td>
                </motion.tr>
              )
            })
          )}
          </tbody>
        </table>
      </div>

      {/* Transcript Sheet */}
      {selectedCall && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedCall(null)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="fixed right-0 top-0 bottom-0 w-[500px] bg-surface border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Call Transcript</h2>
                <button onClick={() => setSelectedCall(null)} className="p-2 hover:bg-surface2 rounded-lg">
                  ✕
                </button>
              </div>

              {/* Call Info */}
              <div className="bg-surface2 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg font-bold">
                    {selectedCall.customerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold">{selectedCall.customerName}</div>
                    <div className="text-sm text-text-muted">{selectedCall.customerPhone}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Duration</span>
                    <div className="font-medium">{formatDuration(selectedCall.duration)}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Channel</span>
                    <div className="font-medium">{selectedCall.channel}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Cost</span>
                    <div className="font-medium">${selectedCall.cost.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Audio Player (mock) */}
              <div className="bg-surface2 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                    <Play size={18} fill="white" />
                  </button>
                  <div className="flex-1">
                    <div className="h-1 bg-surface rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-primary rounded-full" />
                    </div>
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>0:45</span>
                      <span>{formatDuration(selectedCall.duration)}</span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-surface rounded-lg">
                    <FileAudio size={18} />
                  </button>
                </div>
              </div>

              {/* Analysis */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface2 rounded-xl p-4">
                  <span className="text-sm text-text-muted">Intent</span>
                  <div className="font-semibold mt-1">{selectedCall.intent}</div>
                  <span className="text-xs text-emerald-400">Confidence: 94%</span>
                </div>
                <div className="bg-surface2 rounded-xl p-4">
                  <span className="text-sm text-text-muted">Sentiment</span>
                  <div className="font-semibold mt-1 flex items-center gap-2">
                    <span>{sentimentIcons[selectedCall.sentiment as keyof typeof sentimentIcons].icon}</span>
                    {sentimentIcons[selectedCall.sentiment as keyof typeof sentimentIcons].label}
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Transcript</h3>
                <div className="space-y-4">
                  {selectedCall.transcript.split('\n').filter(Boolean).map((line, i) => {
                    const isAI = line.startsWith('AI:')
                    return (
                      <div
                        key={i}
                        className={cn(
                          'p-4 rounded-xl',
                          isAI ? 'bg-surface2 border-l-2 border-primary' : 'bg-surface'
                        )}
                      >
                        <span className={cn(
                          'text-xs font-medium mb-2 block',
                          isAI ? 'text-primary' : 'text-emerald-400'
                        )}>
                          {isAI ? 'AI' : 'Customer'}
                        </span>
                        <p className="text-sm">{line.replace(/^(AI|Customer):\s*/, '')}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}