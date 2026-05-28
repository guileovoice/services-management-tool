'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Phone, MessageSquare, Mail, Star, Clock, DollarSign, GripVertical, MoreHorizontal, X, ChevronRight } from 'lucide-react'
import { cn, formatRelativeTime, getInitials } from '@/lib/utils'
import { useStudioStore } from '@/lib/stores/studioStore'
import type { LeadStatus, LeadUrgency } from '@/lib/types'
import { DndContext, closestCenter, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'

const statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'BOOKED', 'LOST']
const statusLabels: Record<LeadStatus, string> = {
  NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', BOOKED: 'Booked', LOST: 'Lost',
}

const urgencyColors: Record<LeadUrgency, string> = {
  HIGH: 'bg-red-500/15 text-red-400 border-red-500/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

function LeadCard({ lead, onClick, services }: { lead: { id: string; name: string; phone: string; urgency: LeadUrgency; inquiryText: string; serviceInterest: string; channel: string; score: number }; onClick: () => void; services: { id: string; name: string; price: number }[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const service = services.find(s => s.name === lead.serviceInterest)
  const estimatedRevenue = service?.price || 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all',
        isDragging && 'opacity-50 shadow-xl'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab text-text-muted hover:text-text-secondary">
            <GripVertical size={16} />
          </div>
          <div>
            <div className="font-medium">{lead.name}</div>
            <div className="text-xs text-text-muted">{lead.phone}</div>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${urgencyColors[lead.urgency]}`}>
          {lead.urgency}
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-3 line-clamp-2">{lead.inquiryText}</p>

      <div className="flex items-center gap-2 mb-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Star size={12} className="text-warning" />
          {lead.serviceInterest}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign size={12} />
          ~${estimatedRevenue}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {lead.channel}
        </span>
      </div>

      {/* Lead Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-muted">Score</span>
          <span className={cn(
            'font-medium',
            lead.score > 70 ? 'text-emerald-400' : lead.score > 40 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {lead.score}/100
          </span>
        </div>
        <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full',
              lead.score > 70 ? 'bg-emerald-500' : lead.score > 40 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${lead.score}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex-1 py-2 text-xs font-medium border border-border rounded-lg hover:bg-surface2 transition-colors">
          Call Back
        </button>
        <button className="flex-1 py-2 text-xs font-medium bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
          Book Now
        </button>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const { leads: storeLeads, services, staff, updateLeadStatus, bootstrapData, isBootstrapped } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const [localLeads, setLocalLeads] = useState<typeof storeLeads>([])
  const [selectedLead, setSelectedLead] = useState<typeof storeLeads[0] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setLocalLeads(storeLeads)
  }, [storeLeads])

  const leadStatuses = statuses.map(s => ({
    label: statusLabels[s],
    value: s,
    count: localLeads.filter(l => l.status === s).length,
  }))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragStart = (event: any) => {
    setActiveId(String(event.active.id))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (event: any) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeLead = localLeads.find(l => l.id === active.id)
    const overLead = localLeads.find(l => l.id === over.id)

    if (activeLead && overLead && activeLead.status !== overLead.status) {
      const newStatus = overLead.status as LeadStatus
      setLocalLeads(prev => prev.map(lead => {
        if (lead.id === active.id) {
          return { ...lead, status: newStatus }
        }
        return lead
      }))
      updateLeadStatus(active.id, newStatus)
      toast.success(`Lead moved to ${overLead.status}`)
    }

    setActiveId(null)
  }

  const totalPipelineValue = localLeads
    .filter(l => l.status !== 'BOOKED' && l.status !== 'LOST')
    .reduce((sum, lead) => {
      const service = services.find(s => s.name === lead.serviceInterest)
      return sum + (service?.price || 0)
    }, 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Leads</h1>
          <p className="text-text-secondary">${totalPipelineValue} potential revenue</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors">
            Import from calls
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
            <Plus size={18} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="overflow-x-auto -mx-4 sm:-mx-0 px-4 sm:px-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-[400px] sm:min-w-0">
          {leadStatuses.map((status) => (
            <div
              key={status.value}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-surface border border-border rounded-lg"
            >
              <div className="text-lg sm:text-xl font-bold">{status.count}</div>
              <div className="text-xs text-text-muted">{status.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {leadStatuses.map((status) => {
            const statusLeads = localLeads.filter(l => l.status === status.value)
            return (
              <div
                key={status.value}
                className="flex-shrink-0 w-80 bg-surface2 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{status.label}</h3>
                    <span className="px-2 py-0.5 text-xs bg-surface rounded-full text-text-muted">
                      {status.count}
                    </span>
                  </div>
                </div>

                <SortableContext
                  items={statusLeads.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 min-h-[200px]">
                    <AnimatePresence>
                      {statusLeads.map((lead) => (
                        <motion.div
                          key={lead.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <LeadCard
                            lead={lead}
                            services={services}
                            onClick={() => setSelectedLead(lead)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </div>
            )
          })}
        </div>
      </DndContext>

      {/* Lead Detail Sheet */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedLead(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-surface border-l border-border z-50 overflow-y-auto"
            >
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg font-bold">
                      {getInitials(selectedLead.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{selectedLead.name}</div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${urgencyColors[selectedLead.urgency]}`}>
                        {selectedLead.urgency} URGENCY
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-surface2 rounded-lg">
                    <X size={20} />
                  </button>
                </div>

                {/* Score Circle */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-surface2"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${selectedLead.score * 2.51} 251`}
                        className={selectedLead.score > 70 ? 'text-emerald-400' : selectedLead.score > 40 ? 'text-yellow-400' : 'text-red-400'}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{selectedLead.score}</span>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-surface2 rounded-xl p-4 mb-6">
                  <div className="text-sm text-text-secondary mb-2">Phone</div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedLead.phone}</span>
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25">
                        <Phone size={16} />
                      </button>
                      <button className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25">
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inquiry */}
                <div className="mb-6">
                  <h4 className="text-sm text-text-secondary mb-2">Inquiry</h4>
                  <p className="text-sm bg-surface2 rounded-lg p-4">{selectedLead.inquiryText}</p>
                </div>

                {/* Service Interest */}
                <div className="mb-6">
                  <h4 className="text-sm text-text-secondary mb-2">Service Interest</h4>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-primary/15 text-primary rounded-full text-sm font-medium">
                      {selectedLead.serviceInterest}
                    </span>
                    {(() => {
                      const service = services.find(s => s.name === selectedLead.serviceInterest)
                      return service ? (
                        <span className="text-sm text-text-muted">~${service.price}</span>
                      ) : null
                    })()}
                  </div>
                </div>

                {/* Assignment */}
                <div className="mb-6">
                  <h4 className="text-sm text-text-secondary mb-2">Assigned to</h4>
                  <select className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg text-text-primary">
                    <option value={selectedLead.assignedStaffId || ''}>
                      {selectedLead.assignedStaffName || 'Unassigned'}
                    </option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <h4 className="text-sm text-text-secondary mb-2">Notes</h4>
                  <textarea
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-lg text-text-primary resize-none"
                    rows={3}
                    placeholder="Add notes..."
                    defaultValue={selectedLead.notes}
                  />
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                    Create Booking
                  </button>
                  <button className="w-full py-2 border border-danger text-danger hover:bg-danger/10 rounded-lg transition-colors">
                    Mark as Lost
                  </button>
                  <button className="w-full py-2 border border-border rounded-lg hover:bg-surface2 transition-colors">
                    Send Follow-up WhatsApp
                  </button>
                </div>

                {/* Converted Banner */}
                {selectedLead.status === 'BOOKED' && selectedLead.convertedBookingId && (
                  <div className="mt-6 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-lg">
                    <div className="text-sm text-emerald-400 font-medium mb-1">Converted!</div>
                    <div className="text-sm">Booking {selectedLead.convertedBookingId}</div>
                    <button className="text-sm text-primary hover:underline mt-2">
                      View Booking →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}