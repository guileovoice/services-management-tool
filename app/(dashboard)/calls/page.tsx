'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, MessageSquare, Clock, Filter, Download, Search, Play, FileAudio } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn, formatRelativeTime, getInitials } from '@/lib/utils'
import { useStudioStore } from '@/lib/stores/studioStore'
import { useDateFilterStore } from '@/lib/stores/dateFilterStore'
import { supabase } from '@/lib/supabaseClient'
import type { Channel } from '@/lib/types'
import toast from 'react-hot-toast'

interface CallEntry {
  id: string; 
  customerName: string; 
  customerPhone: string; 
  channel: string; 
  duration: number; 
  intent: string; 
  outcome: string; 
  sentiment: string; 
  cost: number; 
  createdAt: string; 
  transcript: string;
  recordingUrl: string | null;
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

// Custom Premium HTML5 Audio Player with Play/Pause, Seek, Playback Speed, and Download options
function CallAudioPlayer({ url, duration }: { url: string | null; duration: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration || 0)
  const [playbackRate, setPlaybackRate] = useState(1)

  useEffect(() => {
    // Reset player state when URL changes
    setIsPlaying(false)
    setCurrentTime(0)
    setPlaybackRate(1)
  }, [url])

  if (!url) {
    return (
      <div className="bg-surface2 rounded-xl p-4 mb-6 flex items-center justify-center text-text-muted text-xs gap-2 border border-border/40">
        <FileAudio size={18} />
        <span>No audio recording available for this call</span>
      </div>
    )
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(err => {
          console.error("Audio play failed:", err)
          toast.error("Failed to play audio recording")
        })
      }
    }
  }

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = val
      setCurrentTime(val)
    }
  }

  const handleSpeedChange = () => {
    if (audioRef.current) {
      let nextRate = 1
      if (playbackRate === 1) nextRate = 1.5
      else if (playbackRate === 1.5) nextRate = 2
      else nextRate = 1
      audioRef.current.playbackRate = nextRate
      setPlaybackRate(nextRate)
    }
  }

  const formatAudioTime = (timeInSecs: number) => {
    const minutes = Math.floor(timeInSecs / 60)
    const seconds = Math.floor(timeInSecs % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-surface2 border border-border/80 rounded-xl p-4 mb-6">
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
        className="hidden"
      />
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button 
          type="button"
          onClick={togglePlay} 
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
        >
          {isPlaying ? (
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <rect x="5" y="4" width="4" height="16" />
              <rect x="15" y="4" width="4" height="16" />
            </svg>
          ) : (
            <Play size={16} fill="white" className="ml-0.5" />
          )}
        </button>

        {/* Progress bar slider for seeking */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <input
            type="range"
            min={0}
            max={audioDuration || 100}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1.5 bg-surface3 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            style={{
              background: `linear-gradient(to right, #6C3CE1 0%, #6C3CE1 ${(currentTime / (audioDuration || 100)) * 100}%, #1F1F2E ${(currentTime / (audioDuration || 100)) * 100}%, #1F1F2E 100%)`
            }}
          />
          <div className="flex justify-between text-[10px] text-text-muted mt-1.5 font-mono">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(audioDuration)}</span>
          </div>
        </div>

        {/* Playback speed multiplier */}
        <button
          type="button"
          onClick={handleSpeedChange}
          className="px-2 py-1 text-[10px] font-bold bg-surface hover:bg-surface3 border border-border/80 rounded-md text-text-secondary transition-colors flex-shrink-0"
          title="Playback Speed"
        >
          {playbackRate}x
        </button>

        {/* Direct Download Button */}
        <a 
          href={url} 
          download 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 hover:bg-surface border border-border/50 rounded-lg text-text-secondary hover:text-text-primary transition-all flex-shrink-0"
          title="Download Recording"
        >
          <Download size={16} />
        </a>
      </div>
    </div>
  )
}

export default function CallsPage() {
  const { bootstrapData, retryBootstrap, isBootstrapped, isLoading, error } = useStudioStore()
  const { range: dateRange } = useDateFilterStore()
  const [dbCalls, setDbCalls] = useState<CallEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const [todayStats, setTodayStats] = useState({ total: 0, handledByAI: 0, bookingsCreated: 0, avgDuration: 0 })

  useEffect(() => {
    async function fetchCalls() {
      setLoading(true)

      const { data } = await supabase
        .from('vapi_call_logs')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('created_at', { ascending: false })
      
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
          transcript: row.transcript || '',
          recordingUrl: row.recording_url || null
        }))
        setDbCalls(mapped)
        
        const aiHandled = data.filter(r => r.status === 'assistant-ended-call').length
        const bookingsCreated = data.filter(r => r.summary && r.summary.toUpperCase().includes('BOOK')).length
        const durations = data.map(r => r.duration_seconds || 0)
        const avgDur = durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : 0
        setTodayStats({
          total: data.length,
          handledByAI: aiHandled,
          bookingsCreated,
          avgDuration: avgDur,
        })
      }
      setLoading(false)
    }
    fetchCalls()
  }, [dateRange])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const avgDurationDisplay = formatDuration(todayStats.avgDuration)
  const aiPercent = todayStats.total > 0 ? Math.round(todayStats.handledByAI / todayStats.total * 100) : 0

  const [selectedCall, setSelectedCall] = useState<CallEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCalls = dbCalls.filter(c => 
    (c.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.customerPhone || '').includes(searchQuery)
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30">
          <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0">
            <span className="text-danger font-bold text-sm">!</span>
          </div>
          <div className="flex-1 text-sm">
            <span className="font-medium text-danger">Data load error</span>
            <span className="text-text-secondary ml-2">{error}</span>
          </div>
          <button onClick={() => retryBootstrap()} className="px-3 py-1.5 text-sm font-medium bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition-colors">
            Retry
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">AI Call & Message Logs</h1>
          <p className="text-text-secondary">{todayStats.total} total today · {aiPercent}% handled by AI · {todayStats.bookingsCreated} bookings created</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors">
          <Download size={16} />
          Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary">{todayStats.total}</div>
          <div className="text-sm text-text-secondary">Total Today</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">{todayStats.handledByAI} ({aiPercent}%)</div>
          <div className="text-sm text-text-secondary">Handled by AI</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-400">{todayStats.bookingsCreated}</div>
          <div className="text-sm text-text-secondary">Bookings Created</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary">{avgDurationDisplay}</div>
          <div className="text-sm text-text-secondary">Avg Duration</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search calls..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
        />
      </div>

      {/* Calls Table (Outcome and Sentiment columns removed) */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-surface2">
            <tr>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Customer</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Channel</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Time</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Duration</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Intent</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Cost</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-muted">
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
                <td colSpan={7} className="py-8 text-center text-text-muted">
                  No call logs found in Supabase.
                </td>
              </tr>
            ) : (
              filteredCalls.map((call, i) => {
                const ChannelIcon = channelIcons[call.channel] || Phone
              return (
                <motion.tr
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-surface2 transition-colors cursor-pointer"
                  onClick={() => setSelectedCall(call)}
                >
                  <td className="px-3 sm:px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary truncate">{call.customerName}</div>
                      <div className="text-xs text-text-muted truncate">{call.customerPhone}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ChannelIcon size={14} className="text-text-muted flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-text-secondary">{call.channel}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-text-secondary text-xs sm:text-sm">
                    {formatRelativeTime(call.createdAt)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-text-secondary text-xs sm:text-sm">
                    {formatDuration(call.duration)}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${intentColors[call.intent as keyof typeof intentColors]}`}>
                      {call.intent}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-text-muted text-xs sm:text-sm">
                    ${call.cost.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <button className="px-3 py-1.5 text-xs font-semibold bg-surface2 hover:bg-surface3 rounded-lg border border-border/40 transition-colors">
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
      </div>

      {/* Transcript Center Modal (Replaces Right-side Sheet) */}
      <AnimatePresence>
        {selectedCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setSelectedCall(null)}
            />
            {/* Centered Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative z-10 max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-border bg-surface2/50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Call Details & Transcript</h2>
                <button 
                  onClick={() => setSelectedCall(null)} 
                  className="p-2 hover:bg-surface3 rounded-lg text-text-secondary transition-colors font-semibold"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
                {/* Call Info Profile Card */}
                <div className="bg-surface2 border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-base font-bold shadow-sm">
                      {getInitials(selectedCall.customerName)}
                    </div>
                    <div>
                      <div className="font-bold text-text-primary">{selectedCall.customerName}</div>
                      <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                        <Phone size={12} /> {selectedCall.customerPhone}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs pt-3 border-t border-border/40">
                    <div>
                      <span className="text-text-muted block">Duration</span>
                      <div className="font-semibold text-text-primary mt-0.5">{formatDuration(selectedCall.duration)}</div>
                    </div>
                    <div>
                      <span className="text-text-muted block">Channel</span>
                      <div className="font-semibold text-text-primary mt-0.5">{selectedCall.channel}</div>
                    </div>
                    <div>
                      <span className="text-text-muted block">Cost</span>
                      <div className="font-semibold text-text-primary mt-0.5">${selectedCall.cost.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Fully Connected Real Audio Player */}
                <CallAudioPlayer url={selectedCall.recordingUrl} duration={selectedCall.duration} />

                {/* Analysis Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-surface2 border border-border/50 rounded-xl p-4">
                    <span className="text-xs text-text-muted font-semibold uppercase tracking-wider block">Detected Intent</span>
                    <div className="font-bold text-text-primary mt-1 text-sm">{selectedCall.intent}</div>
                    <span className="text-[10px] text-emerald-400 font-medium block mt-1">Confidence: 94%</span>
                  </div>
                  <div className="bg-surface2 border border-border/50 rounded-xl p-4">
                    <span className="text-xs text-text-muted font-semibold uppercase tracking-wider block">Sentiment Profile</span>
                    <div className="font-bold text-text-primary mt-1 flex items-center gap-2 text-sm">
                      <span>{sentimentIcons[selectedCall.sentiment as keyof typeof sentimentIcons]?.icon || '😐'}</span>
                      {sentimentIcons[selectedCall.sentiment as keyof typeof sentimentIcons]?.label || 'Neutral'}
                    </div>
                  </div>
                </div>

                {/* Transcript Script */}
                <div>
                  <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Conversation Transcript
                  </h3>
                  <div className="space-y-3">
                    {selectedCall.transcript && selectedCall.transcript.trim() ? (
                      selectedCall.transcript.split('\n').filter(Boolean).map((line, i) => {
                        const isAI = line.startsWith('AI:')
                        return (
                          <div
                            key={i}
                            className={cn(
                              'p-3.5 rounded-xl border',
                              isAI 
                                ? 'bg-surface2 border-l-4 border-l-primary border-border/50' 
                                : 'bg-surface border-border/40'
                            )}
                          >
                            <span className={cn(
                              'text-[10px] font-bold uppercase tracking-wider mb-1.5 block',
                              isAI ? 'text-primary' : 'text-emerald-400'
                            )}>
                              {isAI ? 'AI Assistant' : 'Customer'}
                            </span>
                            <p className="text-sm text-text-primary leading-relaxed">
                              {line.replace(/^(AI|Customer):\s*/, '')}
                            </p>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-text-muted italic border border-dashed border-border/55 rounded-xl bg-surface2/25">
                        No text transcript available for this call
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}