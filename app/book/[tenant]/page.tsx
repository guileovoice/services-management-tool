'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays } from 'date-fns'
import { Check, ChevronRight, Clock, User, Calendar, DollarSign, Scissors, Sparkles, ArrowRight, ExternalLink } from 'lucide-react'
import { cn, formatCurrency, getInitials, formatDuration } from '@/lib/utils'
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

  const categories = ['ALL', 'HAIR', 'COLOR', 'BEARD', 'NAILS', 'SPA']
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))
  
  const timeSlots = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM']

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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
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

    const parseTime = (timeStr: string) => {
      const [h, m] = timeStr.match(/(\d+):(\d+)/)?.slice(1).map(Number) || [9, 0]
      const isPM = timeStr.toLowerCase().includes('pm')
      const hour = isPM && h < 12 ? h + 12 : h
      return { hour, minute: m }
    }
    const { hour, minute } = parseTime(selectedTime)
    const scheduledAt = new Date(selectedDate)
    scheduledAt.setHours(hour, minute, 0, 0)
    const endsAt = new Date(scheduledAt.getTime() + selectedService.durationMin * 60000)

    const booking = await addBooking({
      customerName,
      customerPhone,
      customerEmail,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceDurationMin: selectedService.durationMin,
      servicePrice: selectedService.price,
      scheduledAt: scheduledAt.toISOString(),
      endsAt: endsAt.toISOString(),
      channel: 'WEB',
      notes,
    })
    if (booking) {
      setBookingRef(booking.bookingRef)
      setIsConfirmed(true)
      toast.success('Booking confirmed!')
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
          
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-text-secondary mb-6">Your appointment has been scheduled.</p>
          
          <div className="bg-surface2 rounded-xl p-4 mb-6 text-left">
            <div className="font-mono text-sm text-text-muted mb-2">{bookingRef}</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Service</span>
                <span className="font-medium">{selectedService?.name}</span>
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
              <div className="flex justify-between">
                <span className="text-text-muted">Price</span>
                <span className="font-medium">{formatCurrency(selectedService?.price || 0)}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-text-muted mb-6">
            Confirmation sent to {customerPhone} via WhatsApp
          </p>

          <div className="space-y-3">
            <button 
              onClick={() => window.open(`https://calendar.google.com`, '_blank')}
              className="w-full py-3 bg-surface2 hover:bg-surface3 border border-border rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Calendar size={18} />
              Add to Google Calendar
            </button>
            <button 
              onClick={resetBooking}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
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
      <header className="bg-surface border-b border-border py-6">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
              TS
            </div>
            <div>
              <div className="text-xl font-bold">The Studio</div>
              <div className="text-sm text-text-muted">Williamsburg, Brooklyn</div>
            </div>
          </div>
          <p className="mt-4 text-text-secondary text-sm">Book your appointment online · Instant confirmation</p>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                i <= step ? 'bg-primary text-white' : 'bg-surface2 text-text-muted'
              )}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-12 h-0.5 mx-1',
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
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {weekDays.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      'flex-shrink-0 w-16 py-3 rounded-xl text-center transition-colors',
                      selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                        ? 'bg-primary text-white'
                        : 'bg-surface hover:bg-surface2'
                    )}
                  >
                    <div className="text-xs opacity-70">{format(day, 'EEE')}</div>
                    <div className="text-lg font-bold">{format(day, 'd')}</div>
                  </button>
                ))}
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((time) => {
                    const isAvailable = Math.random() > 0.3
                    return (
                      <button
                        key={time}
                        onClick={() => isAvailable && handleTimeSelect(time)}
                        disabled={!isAvailable}
                        className={cn(
                          'py-4 rounded-xl text-center font-medium transition-colors',
                          selectedTime === time
                            ? 'bg-primary text-white'
                            : isAvailable
                            ? 'bg-surface hover:bg-surface2 border border-border'
                            : 'bg-surface2 text-text-muted cursor-not-allowed opacity-50'
                        )}
                      >
                        {time}
                      </button>
                    )
                  })}
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