'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, isToday, isBefore, startOfDay, parseISO } from 'date-fns'
import { Check, ChevronRight, Clock, User, Calendar, Scissors, Sparkles, ExternalLink, MessageCircle, Phone } from 'lucide-react'
import { cn, formatCurrency, getInitials, formatDuration, bookingDateTime as bdt } from '@/lib/utils'
import { useStudioStore } from '@/lib/stores/studioStore'
import toast from 'react-hot-toast'

const steps = ['Service', 'Staff', 'Time', 'Confirm']

const categoryLabels: Record<string, string> = {
  HAIR: 'Hair',
  COLOR: 'Color',
  BEARD: 'Beard',
  NAILS: 'Nails',
  SPA: 'Spa',
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  HAIR: { bg: 'rgba(108, 60, 225, 0.15)', text: '#6C3CE1' },
  COLOR: { bg: 'rgba(236, 72, 153, 0.15)', text: '#EC4899' },
  BEARD: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
  NAILS: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
  SPA: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
}

const TENANT_ID = '405b50b9-9504-4bda-bd38-7ce5b53e7aa0'

export default function PublicBookingPage() {
  const { services, staff, addBooking, bootstrapData, isBootstrapped } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const [step, setStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<typeof staff[0] | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [agreedToPolicy, setAgreedToPolicy] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const categories = ['ALL', 'HAIR', 'COLOR', 'BEARD', 'NAILS', 'SPA']
  // Show today + next 13 days (2-week window), locking past days
  const weekDays = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

  // Generate 30-minute slots from 9:00 AM to 7:00 PM
  const generateTimeSlots = (): string[] => {
    const slots: string[] = []
    for (let h = 9; h < 19; h++) {
      for (const m of [0, 30]) {
        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
        const ampm = h < 12 ? 'AM' : 'PM'
        const label = `${hour12}:${m === 0 ? '00' : '30'} ${ampm}`
        slots.push(label)
      }
    }
    return slots
  }
  const allTimeSlots = generateTimeSlots()

  const filteredServices = selectedCategory === 'ALL' 
    ? services 
    : services.filter(s => s.category === selectedCategory)

  const availableStaff = selectedService 
    ? staff.filter(s => selectedService.staffIds.includes(s.id))
    : []

  const handleServiceSelect = (service: typeof services[0]) => {
    setSelectedService(service)
    setStep(1)
  }

  const handleStaffSelect = (staffMember: typeof staff[0]) => {
    setSelectedStaff(staffMember)
    setStep(2)
  }

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
    if (!selectedStaff) return
    setLoadingSlots(true)
    try {
      // Use YYYY-MM-DD in LOCAL timezone to query the API
      const y = date.getFullYear()
      const mo = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const dateStr = `${y}-${mo}-${d}`

      const res = await fetch(
        `/api/bookings/check-availability?staff_id=${selectedStaff.id}&date=${dateStr}&tenant_id=${TENANT_ID}`
      )
      const json = await res.json()
      const bookings: { date: string; time: string; service_duration_min: number }[] = json.bookings || []

      // Block every 30-min slot label that overlaps any existing booking
      const blocked: string[] = []
      bookings.forEach((b) => {
        const start = bdt(b.date, b.time)  // local datetime
        const end   = new Date(start.getTime() + b.service_duration_min * 60000)
        for (let h = 9; h < 19; h++) {
          for (const m of [0, 30]) {
            const slotStart = new Date(date)
            slotStart.setHours(h, m, 0, 0)           // local hours
            const slotEnd = new Date(slotStart.getTime() + 30 * 60000)
            if (slotStart < end && slotEnd > start) {
              const hour12 = h > 12 ? h - 12 : h
              const ampm   = h < 12 ? 'AM' : 'PM'
              blocked.push(`${hour12}:${m === 0 ? '00' : '30'} ${ampm}`)
            }
          }
        }
      })
      setBookedSlots(blocked)
    } catch {
      setBookedSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const isSlotAvailable = (time: string): boolean => {
    // Block already booked slots
    if (bookedSlots.includes(time)) return false
    // Block past slots if selected date is today
    if (selectedDate && isToday(selectedDate)) {
      const parseTime = (t: string) => {
        const [h, m] = t.match(/(\d+):(\d+)/)?.slice(1).map(Number) || [9, 0]
        const isPM = t.toLowerCase().includes('pm')
        const hour = isPM && h < 12 ? h + 12 : h
        return { hour, minute: m }
      }
      const { hour, minute } = parseTime(time)
      const slotDate = new Date(selectedDate)
      slotDate.setHours(hour, minute, 0, 0)
      if (isBefore(slotDate, new Date())) return false
    }
    return true
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep(3)
  }

  const handleConfirm = async () => {
    if (!customerName || !customerPhone || !agreedToPolicy || !selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      toast.error('Please fill in all required fields')
      return
    }

    // --- Unambiguous local → UTC datetime construction ---
    // Extract local date components from the date chip (selectedDate is local midnight)
    const year  = selectedDate.getFullYear()
    const month = selectedDate.getMonth()   // 0-based
    const day   = selectedDate.getDate()

    // Parse the selected slot label to 24h values
    const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!timeMatch) { toast.error('Invalid time selected'); return }
    let hour24 = parseInt(timeMatch[1], 10)
    const min  = parseInt(timeMatch[2], 10)
    const ampm = timeMatch[3].toUpperCase()
    if (ampm === 'PM' && hour24 < 12) hour24 += 12
    if (ampm === 'AM' && hour24 === 12) hour24 = 0

    // Build Date using LOCAL components — JavaScript will convert to UTC correctly via .toISOString()
    const scheduledAtDate = new Date(year, month, day, hour24, min, 0, 0)

    // Guard: must not be in the past
    if (scheduledAtDate.getTime() < Date.now()) {
      toast.error('Selected time is in the past. Please choose a future slot.')
      return
    }

    const scheduledAtISO = scheduledAtDate.toISOString()
    const endsAtISO      = new Date(scheduledAtDate.getTime() + selectedService.durationMin * 60000).toISOString()

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          staffId:            selectedStaff.id,
          staffName:          selectedStaff.name,
          serviceId:          selectedService.id,
          serviceName:        selectedService.name,
          serviceDurationMin: selectedService.durationMin,
          servicePrice:       selectedService.price,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          time: `${String(hour24).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
          channel: 'WEB',
          notes,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to create booking')
        return
      }

      setBookingRef(json.ref)
      setIsConfirmed(true)
      toast.success('Booking confirmed!')
    } catch (err) {
      toast.error('Network error — please try again.')
    }
  }

  const resetBooking = () => {
    setStep(0)
    setSelectedService(null)
    setSelectedStaff(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setNotes('')
    setAgreedToPolicy(false)
    setIsConfirmed(false)
  }

  // Confirmed screen
  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <Check size={40} className="text-emerald-400" />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Booking Confirmed! 🎉</h1>
          <p className="text-text-secondary mb-6">Your appointment has been scheduled successfully.</p>

          {/* Booking Reference */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 mb-6">
            <span className="text-xs text-text-muted">Booking Ref:</span>
            <span className="font-mono font-bold text-primary">{bookingRef}</span>
          </div>

          {/* Summary Card */}
          <div className="bg-surface2 rounded-xl p-5 mb-5 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted flex items-center gap-1.5"><Scissors size={14} /> Service</span>
              <span className="font-semibold">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted flex items-center gap-1.5"><User size={14} /> Stylist</span>
              <span className="font-semibold">{selectedStaff?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted flex items-center gap-1.5"><Calendar size={14} /> Date & Time</span>
              <span className="font-semibold">
                {selectedDate && format(selectedDate, 'EEE, MMM d yyyy')} · {selectedTime}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted flex items-center gap-1.5"><Clock size={14} /> Duration</span>
              <span className="font-semibold">{formatDuration(selectedService?.durationMin || 0)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-xl text-primary">{formatCurrency(selectedService?.price || 0)}</span>
            </div>
          </div>

          {/* Notifications sent */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">Confirmations Sent</p>
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
              <MessageCircle size={14} className="text-emerald-400" />
              WhatsApp → {customerPhone}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Phone size={14} className="text-emerald-400" />
              SMS → {customerPhone}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.open(`https://calendar.google.com`, '_blank')}
              className="w-full py-3 bg-surface2 hover:bg-surface3 border border-border rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Calendar size={16} />
              Add to Google Calendar
            </button>
            <button
              onClick={resetBooking}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
            >
              Book Another Appointment
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-text-muted mb-3">While you wait — we'd love a review!</p>
            <div className="flex items-center justify-center gap-4">
              <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
                Google Reviews <ExternalLink size={12} />
              </a>
              <span className="text-text-muted">·</span>
              <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
                Yelp <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border py-4 sm:py-6">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-lg sm:text-xl font-bold">
              TS
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-bold truncate">The Studio</div>
              <div className="text-xs sm:text-sm text-text-muted truncate">Williamsburg, Brooklyn</div>
            </div>
          </div>
          <p className="mt-3 sm:mt-4 text-text-secondary text-xs sm:text-sm">Book your appointment online · Instant confirmation</p>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-md mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium',
                i <= step ? 'bg-primary text-white' : 'bg-surface2 text-text-muted'
              )}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-8 sm:w-12 h-0.5 mx-0.5 sm:mx-1',
                  i < step ? 'bg-primary' : 'bg-surface2'
                )} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-2 text-sm text-text-muted">
          {steps[step]}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          {/* Step 1: Service */}
          {step === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
                      selectedCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-surface hover:bg-surface2 text-text-secondary'
                    )}
                  >
                    {cat === 'ALL' ? 'All' : categoryLabels[cat]}
                  </button>
                ))}
              </div>

              {/* Services */}
              {filteredServices.map((service) => {
                const colors = categoryColors[service.category] || { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' }
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full bg-surface border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {categoryLabels[service.category]}
                      </span>
                      {service.isPopular && (
                        <span className="flex items-center gap-1 text-xs text-orange-400">
                          <Sparkles size={12} />
                          Popular
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{service.name}</h3>
                    <p className="text-sm text-text-secondary mb-3 line-clamp-1">{service.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-text-muted">
                        <Clock size={14} />
                        {formatDuration(service.durationMin)}
                      </span>
                      <span className="font-semibold">{formatCurrency(service.price)}</span>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          )}

          {/* Step 2: Staff */}
          {step === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <button onClick={() => setStep(0)} className="text-sm text-text-muted hover:text-primary">
                ← Change service
              </button>

              <button
                onClick={() => handleStaffSelect(staff[0])}
                className="w-full bg-surface border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-surface2 flex items-center justify-center">
                    <User size={24} className="text-text-muted" />
                  </div>
                  <div>
                    <div className="font-medium">No preference</div>
                    <div className="text-sm text-text-muted">First available staff</div>
                  </div>
                </div>
              </button>

              <div className="text-sm text-text-muted mb-2">Or choose a specific stylist:</div>

              {availableStaff.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleStaffSelect(member)}
                  className="w-full bg-surface border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-sm text-text-muted">{member.roleTitle}</div>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <span className="text-warning">★ {member.rating}</span>
                          <span className="text-text-muted">·</span>
                          <span className="text-text-muted">Next available: Friday 2pm</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-text-muted" />
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 3: Time */}
          {step === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <button onClick={() => setStep(1)} className="text-sm text-text-muted hover:text-primary">
                ← Change staff
              </button>

              {/* Date Picker */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {weekDays.map((day, i) => {
                  const isPast = isBefore(startOfDay(day), startOfDay(new Date()))
                  return (
                    <button
                      key={i}
                      onClick={() => !isPast && handleDateSelect(day)}
                      disabled={isPast}
                      className={cn(
                        'flex-shrink-0 w-14 sm:w-16 py-2.5 sm:py-3 rounded-xl text-center transition-colors',
                        isPast
                          ? 'bg-surface2 text-text-muted opacity-40 cursor-not-allowed'
                          : selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                          ? 'bg-primary text-white'
                          : 'bg-surface hover:bg-surface2 border border-border'
                      )}
                    >
                      <div className="text-[10px] sm:text-xs opacity-70">{format(day, 'EEE')}</div>
                      <div className="text-base sm:text-lg font-bold">{format(day, 'd')}</div>
                      {isToday(day) && <div className="text-[8px] sm:text-[9px] opacity-70">TODAY</div>}
                    </button>
                  )
                })}
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  {loadingSlots ? (
                    <div className="text-center py-8 text-text-muted text-sm">Checking availability...</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {allTimeSlots.map((time) => {
                        const available = isSlotAvailable(time)
                        return (
                          <button
                            key={time}
                            onClick={() => available && handleTimeSelect(time)}
                            disabled={!available}
                            className={cn(
                              'py-3 rounded-xl text-center text-sm font-medium transition-colors',
                              selectedTime === time
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : available
                                ? 'bg-surface hover:bg-surface2 border border-border hover:border-primary/40'
                                : 'bg-surface2 text-text-muted cursor-not-allowed opacity-40'
                            )}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Confirm */}
          {step === 3 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button onClick={() => setStep(2)} className="text-sm text-text-muted hover:text-primary">
                ← Change time
              </button>

              {/* Summary */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <h3 className="font-semibold mb-4">Booking Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Service</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Duration</span>
                    <span className="font-medium">{formatDuration(selectedService?.durationMin || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Staff</span>
                    <span className="font-medium">{selectedStaff?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Date & Time</span>
                    <span className="font-medium">
                      {selectedDate && format(selectedDate, 'MMM d, yyyy')} at {selectedTime}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-xl">{formatCurrency(selectedService?.price || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Your Information</h3>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Email (optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary resize-none"
                    rows={2}
                    placeholder="Any special requests or allergies?"
                  />
                </div>
              </div>

              {/* Policy */}
              <div className="text-sm text-text-secondary">
                <p>We'll send a confirmation and reminder via WhatsApp. Free cancellation up to 24 hours before your appointment.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToPolicy}
                  onChange={(e) => setAgreedToPolicy(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-primary rounded"
                />
                <span className="text-sm">I agree to the cancellation policy</span>
              </label>

              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
              >
                Confirm Booking
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}