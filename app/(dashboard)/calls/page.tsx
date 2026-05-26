'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Phone, MessageSquare, Clock, Filter, Download, Search, Play, FileAudio } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useStudioStore } from '@/lib/stores/studioStore'
import type { Channel } from '@/lib/types'

interface CallEntry {
  id: string; customerName: string; customerPhone: string; channel: string; duration: number; intent: string; outcome: string; sentiment: string; cost: number; createdAt: string; transcript: string
}

const mockCalls: CallEntry[] = [
  {
    id: 'call-1',
    customerName: 'Sofia Chen',
    customerPhone: '+1 (718) 555-1234',
    channel: 'VOICE' as Channel,
    duration: 245,
    intent: 'BOOKING',
    outcome: 'Booked ✓',
    sentiment: 'POSITIVE',
    cost: 0.15,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    transcript: `AI: Hi, thanks for calling The Studio. How can I help you today?
Customer: Hi, I'd like to book an appointment for a balayage.
AI: Great choice! I have Jessica available on Friday at 2pm. Would that work for you?
Customer: Yes, that sounds perfect. Can I also get a trim at the same time?
AI: Unfortunately, a trim would be an additional 30 minutes. We can do a trim before the balayage starting at 11am. Would that work instead?
Customer: Yes, let's do that. 11am Friday.
AI: Perfect! I've booked you with Jessica for a trim at 11am and balayage at 12pm on Friday. You'll receive a confirmation shortly.`,
  },
  {
    id: 'call-2',
    customerName: 'James Williams',
    customerPhone: '+1 (718) 555-2345',
    channel: 'WHATSAPP' as Channel,
    duration: 180,
    intent: 'INQUIRY',
    outcome: 'No action',
    sentiment: 'NEUTRAL',
    cost: 0.02,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    transcript: `AI: Hi, thanks for messaging The Studio! How can I help you?
Customer: What are your hours on Saturday?
AI: We're open Saturday from 9am to 8pm. Can I help you book an appointment?
Customer: Just checking. Thanks!`,
  },
  {
    id: 'call-3',
    customerName: 'Rachel Kim',
    customerPhone: '+1 (718) 555-7777',
    channel: 'VOICE' as Channel,
    duration: 320,
    intent: 'BOOKING',
    outcome: 'Lead created',
    sentiment: 'POSITIVE',
    cost: 0.15,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    transcript: `AI: Hi, thanks for calling The Studio. How can I help you today?
Customer: Hi, I saw your Instagram and I'm looking to book a balayage for my birthday. It's in 2 weeks. Do you have availability?
AI: Congratulations on your upcoming birthday! Let me check our availability... I have Jessica available on Saturday the 24th at 2pm. Would that work for you?
Customer: Yes, that sounds perfect!
AI: Great! I'll create a lead for you and we'll follow up to confirm the booking. Can I get your email?
Customer: Rachel.k@email.com
AI: Perfect! I've recorded your interest. A team member will contact you within 24 hours to confirm your appointment. Happy early birthday!`,
  },
  {
    id: 'call-4',
    customerName: 'Carlos Mendez',
    customerPhone: '+1 (718) 555-4567',
    channel: 'VOICE' as Channel,
    duration: 180,
    intent: 'RESCHEDULE',
    outcome: 'Rescheduled',
    sentiment: 'NEUTRAL',
    cost: 0.15,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    transcript: `AI: Hi, thanks for calling The Studio. How can I help you today?
Customer: I need to reschedule my appointment.
AI: Of course. Can I have your name or booking reference?
Customer: It's Carlos Mendez, I was supposed to come in tomorrow at 2.
AI: I found your booking. What date and time would work better for you?
Customer: Any afternoon next week would be fine.
AI: I have Thursday at 3pm or Friday at 4pm available. Which works better?
Customer: Let's do Thursday at 3pm.
AI: Done! Your appointment is now Thursday at 3pm with Marcus for Men's Haircut. See you then!`,
  },
  {
    id: 'call-5',
    customerName: 'Tyler Brooks',
    customerPhone: '+1 (718) 555-6789',
    channel: 'SMS' as Channel,
    duration: 60,
    intent: 'CANCEL',
    outcome: 'Cancelled',
    sentiment: 'NEGATIVE',
    cost: 0.01,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    transcript: `Customer: Need to cancel my appointment tomorrow
AI: I understand. I can help you cancel. Your appointment tomorrow at 11am with Marcus has been cancelled. No charges will apply. Would you like to rebook for another time?
Customer: Maybe later. Thanks.
AI: No problem! When you're ready to book again, just call or message us. Have a great day!`,
  },
]

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
  const { callLogs, setCallLogs, bootstrapData, isBootstrapped } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const [selectedCall, setSelectedCall] = useState<CallEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const calls: CallEntry[] = callLogs.length > 0
    ? callLogs.map(l => ({ ...l, customerName: '', customerPhone: '', outcome: '', cost: 0, transcript: '' }))
    : mockCalls

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
            {filteredCalls.map((call, i) => {
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
            })}
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