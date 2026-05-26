'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Calendar, Clock, Star, MapPin, Phone, Mail, Check, Scissors, Palette, Sparkles, Heart } from 'lucide-react'
import { useEffect } from 'react'
import { cn, formatCurrency, formatDuration, getInitials } from '@/lib/utils'
import { format, addDays } from 'date-fns'
import { useStudioStore } from '@/lib/stores/studioStore'
import toast from 'react-hot-toast'

export default function HomePage() {
  const { services, staff, addBooking, bootstrapData, isBootstrapped } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  
  const [bookingStep, setBookingStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<typeof staff[0] | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  const categories = ['ALL', 'HAIR', 'COLOR', 'BEARD', 'NAILS', 'SPA']
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1))
  const timeSlots = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM']

  const featuredServices = services.filter(s => s.isPopular).slice(0, 4)
  const categoryColors: Record<string, { bg: string; text: string }> = {
    HAIR: { bg: 'bg-violet-500', text: 'text-violet-500' },
    COLOR: { bg: 'bg-pink-500', text: 'text-pink-500' },
    BEARD: { bg: 'bg-blue-500', text: 'text-blue-500' },
    NAILS: { bg: 'bg-emerald-500', text: 'text-emerald-500' },
    SPA: { bg: 'bg-amber-500', text: 'text-amber-500' },
  }

  const handleServiceSelect = (service: typeof services[0]) => {
    setSelectedService(service)
    setBookingStep(1)
  }

  const handleStaffSelect = (staffMember: typeof staff[0]) => {
    setSelectedStaff(staffMember)
    setBookingStep(2)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setBookingStep(3)
  }

  const handleConfirm = async () => {
    if (!customerName || !customerPhone || !selectedService || !selectedStaff || !selectedDate || !selectedTime) return
    
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
    })
    if (booking) {
      setBookingRef(booking.bookingRef)
      setIsConfirmed(true)
    } else {
      toast.error('Failed to create booking. Please try again.')
    }
  }

  const resetBooking = () => {
    setBookingStep(0)
    setSelectedService(null)
    setSelectedStaff(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setIsConfirmed(false)
  }

  const getFilteredServices = () => {
    if (selectedCategory === 'ALL') {
      return services
    }
    return services.filter(s => s.category === selectedCategory)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Button */}
      <Link
        href="/login"
        className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-surface border border-border rounded-full text-sm font-medium hover:bg-surface2 transition-colors shadow-lg flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Admin Login
      </Link>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
                TS
              </div>
              <div>
                <div className="font-bold text-lg">The Studio</div>
                <div className="text-xs text-text-muted">Williamsburg, Brooklyn</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm hover:text-primary transition-colors">Services</a>
              <a href="#team" className="text-sm hover:text-primary transition-colors">Our Team</a>
              <a href="#about" className="text-sm hover:text-primary transition-colors">About</a>
              <a href="#contact" className="text-sm hover:text-primary transition-colors">Contact</a>
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
              >
                Book Now
              </button>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-surface"
            >
              <div className="p-4 space-y-4">
                <a href="#services" className="block text-sm hover:text-primary">Services</a>
                <a href="#team" className="block text-sm hover:text-primary">Our Team</a>
                <a href="#about" className="block text-sm hover:text-primary">About</a>
                <a href="#contact" className="block text-sm hover:text-primary">Contact</a>
                <button
                  onClick={() => { setShowBookingModal(true); setMobileMenuOpen(false); }}
                  className="w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg"
                >
                  Book Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block px-3 py-1 bg-primary/15 text-primary text-sm font-medium rounded-full mb-4">
                Brooklyn&apos;s Premier Hair Salon
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Your Style,
                <br />
                <span className="gradient-text">Our Passion</span>
              </h1>
              <p className="text-lg text-text-secondary mb-8 max-w-lg">
                Expert cuts, stunning colors, and beautiful nails. AI-powered booking makes it easier than ever to look your best.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <Calendar size={18} />
                  Book Appointment
                </button>
                <a
                  href="tel:+17185554200"
                  className="px-6 py-3 bg-surface hover:bg-surface2 border border-border font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <Phone size={18} />
                  (718) 555-4200
                </a>
              </div>

              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-border">
                <div className="text-center">
                  <div className="text-3xl font-bold">4.9</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className="text-warning fill-warning" />
                    ))}
                  </div>
                  <div className="text-xs text-text-muted mt-1">500+ Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">5000+</div>
                  <div className="text-xs text-text-muted mt-1">Happy Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">10</div>
                  <div className="text-xs text-text-muted mt-1">Years Experience</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                <div className="absolute inset-0 bg-surface/30 flex items-center justify-center">
                  <div className="text-center">
                    <Scissors size={64} className="mx-auto mb-4 text-primary/50" />
                    <p className="text-text-muted">Salon Interior</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-surface border border-border rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Calendar className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold">Open Today</div>
                    <div className="text-sm text-text-muted">9am - 8pm</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-surface">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 bg-secondary/15 text-secondary text-sm font-medium rounded-full mb-4">
              Our Services
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Offer</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              From precision cuts to stunning color transformations, we offer a full range of services to help you look and feel your best.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Scissors, label: 'Hair', desc: 'Cuts, styling & treatments', color: 'violet' },
              { icon: Palette, label: 'Color', desc: 'Balayage, highlights & more', color: 'pink' },
              { icon: Sparkles, label: 'Nails', desc: 'Manicures, pedicures & art', color: 'emerald' },
              { icon: Heart, label: 'Spa', desc: 'Facials & relaxation', color: 'amber' },
            ].map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background border border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
              >
                <div className={`w-14 h-14 rounded-xl bg-${cat.color}/15 flex items-center justify-center mx-auto mb-4`}>
                  <cat.icon size={28} className={`text-${cat.color}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{cat.label}</h3>
                <p className="text-sm text-text-muted">{cat.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Popular Services */}
          <div className="mt-16">
            <h3 className="text-xl font-semibold mb-6 text-center">Most Popular Services</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredServices.map((service, i) => {
                const colors = categoryColors[service.category] || { bg: 'bg-gray-500', text: 'text-gray-500' }
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-background border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} bg-opacity-20 ${colors.text}`}>
                        {service.category}
                      </span>
                      <span className="text-amber-400 flex items-center gap-1 text-sm">
                        <Sparkles size={14} />
                        Popular
                      </span>
                    </div>
                    <h4 className="font-semibold mb-2">{service.name}</h4>
                    <p className="text-sm text-text-muted mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-text-muted">
                        <Clock size={14} />
                        {formatDuration(service.durationMin)}
                      </span>
                      <span className="font-bold text-lg">{formatCurrency(service.price)}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
            >
              View All Services & Book
            </button>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 bg-emerald-500/15 text-emerald-400 text-sm font-medium rounded-full mb-4">
              Our Team
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Stylists</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Our talented team of professionals is dedicated to making you look and feel your best.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {staff.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-border rounded-xl p-6 text-center"
              >
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {getInitials(member.name)}
                </div>
                <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                <p className="text-sm text-text-muted mb-3">{member.roleTitle}</p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Star size={14} className="text-warning fill-warning" />
                  <span className="font-medium">{member.rating}</span>
                  <span className="text-text-muted">({member.bookingsThisWeek} bookings)</span>
                </div>
                <p className="text-sm text-text-secondary mt-4 line-clamp-2">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-3 py-1 bg-primary/15 text-primary text-sm font-medium rounded-full mb-4">
                Why Choose Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Experience the Difference at The Studio
              </h2>
              <p className="text-text-secondary mb-8">
                At The Studio, we believe that great hair is about more than just a cut — it&apos;s about an experience. Our modern salon in the heart of Williamsburg offers a welcoming atmosphere where you can relax and let our expert team transform your look.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Expert Team', desc: 'Our stylists have years of experience and continuous training.' },
                  { title: 'Premium Products', desc: 'We use only the highest quality products for your hair.' },
                  { title: 'AI-Powered Booking', desc: 'Easy online booking with instant confirmation.' },
                  { title: 'Satisfaction Guaranteed', desc: 'Not happy? We\'ll make it right. Period.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-text-muted">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-background border border-border rounded-2xl p-8"
            >
              <h3 className="text-xl font-semibold mb-6">Salon Hours</h3>
              <div className="space-y-3">
                {[
                  { day: 'Monday', hours: '9am - 8pm' },
                  { day: 'Tuesday', hours: '9am - 8pm' },
                  { day: 'Wednesday', hours: '9am - 8pm' },
                  { day: 'Thursday', hours: '9am - 8pm' },
                  { day: 'Friday', hours: '9am - 8pm' },
                  { day: 'Saturday', hours: '9am - 8pm' },
                  { day: 'Sunday', hours: '10am - 6pm' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="font-medium">{item.day}</span>
                    <span className="text-text-muted">{item.hours}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full mt-6 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
              >
                Book Your Appointment
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 bg-warning/15 text-warning text-sm font-medium rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', text: 'Absolutely love my balayage! Jessica did an amazing job. The salon is beautiful and the staff is so friendly.', rating: 5 },
              { name: 'Michael R.', text: 'Best barbershop in Brooklyn. Marcus always gives me the perfect fade. Easy online booking is a huge plus.', rating: 5 },
              { name: 'Emily K.', text: 'My nails look incredible! Priya is so talented and professional. I\'ve been coming here for 2 years now.', rating: 5 },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} size={16} className="text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-text-secondary mb-4">&quot;{testimonial.text}&quot;</p>
                <div className="font-medium">— {testimonial.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-3 py-1 bg-blue-500/15 text-blue-400 text-sm font-medium rounded-full mb-4">
                Contact Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
              <p className="text-text-secondary mb-8">
                Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-text-muted">127 Bedford Ave, Williamsburg, Brooklyn, NY 11211</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Phone size={24} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Phone</div>
                    <a href="tel:+17185554200" className="text-text-muted hover:text-primary">(718) 555-4200</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Mail size={24} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Email</div>
                    <a href="mailto:hello@thestudio.com" className="text-text-muted hover:text-primary">hello@thestudio.com</a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <a href="#" className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center hover:bg-surface3 transition-colors">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center hover:bg-surface3 transition-colors">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background border border-border rounded-2xl p-8"
            >
              <h3 className="text-xl font-semibold mb-6">Send us a message</h3>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Your Phone"
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Your Message"
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
                >
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                TS
              </div>
              <div>
                <div className="font-bold">The Studio</div>
                <div className="text-xs text-text-muted">Williamsburg, Brooklyn</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <a href="#services">Services</a>
              <a href="#team">Team</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="text-sm text-text-muted">
              © 2026 The Studio. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => { setShowBookingModal(false); resetBooking(); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                    TS
                  </div>
                  <div>
                    <div className="font-semibold">Book Appointment</div>
                    <div className="text-xs text-text-muted">The Studio</div>
                  </div>
                </div>
                <button
                  onClick={() => { setShowBookingModal(false); resetBooking(); }}
                  className="p-2 hover:bg-surface2 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  {['Service', 'Staff', 'Time', 'Confirm'].map((stepName, i) => (
                    <div key={stepName} className="flex items-center">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                        i <= bookingStep ? 'bg-primary text-white' : 'bg-surface2 text-text-muted'
                      )}>
                        {i < bookingStep ? <Check size={12} /> : i + 1}
                      </div>
                      {i < 3 && (
                        <div className={cn('w-8 h-0.5 mx-1', i < bookingStep ? 'bg-primary' : 'bg-surface2')} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {isConfirmed ? (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                    >
                      <Check size={40} className="text-emerald-400" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                    <p className="text-text-muted mb-4">Confirmation sent to {customerPhone}</p>
                    <div className="bg-surface2 rounded-xl p-4 mb-6 text-left">
                      <div className="font-mono text-sm text-text-muted mb-2">{bookingRef}</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-text-muted">Service</span><span className="font-medium">{selectedService ? selectedService.name : ''}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Staff</span><span className="font-medium">{selectedStaff ? selectedStaff.name : ''}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">When</span><span className="font-medium">{selectedDate ? format(selectedDate, 'MMM d') : ''} at {selectedTime}</span></div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowBookingModal(false); resetBooking(); }}
                      className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
                    >
                      Done
                    </button>
                  </div>
                ) : bookingStep === 0 ? (
                  <div>
                    <h3 className="font-semibold mb-4">Select a Service</h3>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            'px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap',
                            selectedCategory === cat ? 'bg-primary text-white' : 'bg-surface2 hover:bg-surface3'
                          )}
                        >
                          {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {getFilteredServices().map(service => {
                        const colors = categoryColors[service.category] || { bg: 'bg-gray-500', text: 'text-gray-500' }
                        return (
                          <button
                            key={service.id}
                            onClick={() => handleServiceSelect(service)}
                            className="w-full p-4 bg-surface2 hover:bg-surface3 border border-border rounded-xl text-left transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.bg} bg-opacity-20 ${colors.text}`}>
                                  {service.category}
                                </span>
                                <div className="font-medium mt-1">{service.name}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatCurrency(service.price)}</div>
                                <div className="text-xs text-text-muted">{formatDuration(service.durationMin)}</div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : bookingStep === 1 ? (
                  <div>
                    <button onClick={() => setBookingStep(0)} className="text-sm text-text-muted hover:text-primary mb-4">
                      ← Change service
                    </button>
                    <h3 className="font-semibold mb-4">Choose Stylist</h3>
                    <button
                      onClick={() => handleStaffSelect(staff[0])}
                      className="w-full p-4 bg-surface2 hover:bg-surface3 border border-border rounded-xl text-left transition-colors mb-3"
                    >
                      <div className="font-medium">No preference</div>
                      <div className="text-sm text-text-muted">First available</div>
                    </button>
                    {staff.map(member => (
                      <button
                        key={member.id}
                        onClick={() => handleStaffSelect(member)}
                        className="w-full p-4 bg-surface2 hover:bg-surface3 border border-border rounded-xl text-left transition-colors mb-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: member.avatarColor }}
                          >
                            {getInitials(member.name)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-text-muted">{member.roleTitle}</div>
                          </div>
                          <div className="text-sm text-emerald-400">★ {member.rating}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : bookingStep === 2 ? (
                  <div>
                    <button onClick={() => setBookingStep(1)} className="text-sm text-text-muted hover:text-primary mb-4">
                      ← Change stylist
                    </button>
                    <h3 className="font-semibold mb-4">Select Date & Time</h3>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
                      {weekDays.map((day, i) => (
                        <button
                          key={i}
                          onClick={() => handleDateSelect(day)}
                          className={cn(
                            'flex-shrink-0 w-14 py-3 rounded-xl text-center',
                            selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                              ? 'bg-primary text-white'
                              : 'bg-surface2 hover:bg-surface3'
                          )}
                        >
                          <div className="text-xs opacity-70">{format(day, 'EEE')}</div>
                          <div className="text-lg font-bold">{format(day, 'd')}</div>
                        </button>
                      ))}
                    </div>
                    {selectedDate && (
                      <div className="grid grid-cols-3 gap-3">
                        {timeSlots.map(time => (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={cn(
                              'py-3 rounded-xl text-center font-medium transition-colors',
                              selectedTime === time
                                ? 'bg-primary text-white'
                                : 'bg-surface2 hover:bg-surface3'
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <button onClick={() => setBookingStep(2)} className="text-sm text-text-muted hover:text-primary mb-4">
                      ← Change time
                    </button>
                    <h3 className="font-semibold mb-4">Confirm Booking</h3>
                    
                    <div className="bg-surface2 rounded-xl p-4 mb-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-text-muted">Service</span><span className="font-medium">{selectedService ? selectedService.name : ''}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Duration</span><span className="font-medium">{selectedService ? formatDuration(selectedService.durationMin) : ''}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Stylist</span><span className="font-medium">{selectedStaff ? selectedStaff.name : ''}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">When</span><span className="font-medium">{selectedDate ? format(selectedDate, 'MMM d') : ''} at {selectedTime}</span></div>
                        <div className="flex justify-between border-t border-border pt-2">
                          <span className="font-semibold">Total</span>
                          <span className="font-bold text-xl">{selectedService ? formatCurrency(selectedService.price) : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Your Name *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number *"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                      />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                      />
                    </div>

                    <button
                      onClick={handleConfirm}
                      className="w-full mt-4 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
                    >
                      Confirm Booking
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}