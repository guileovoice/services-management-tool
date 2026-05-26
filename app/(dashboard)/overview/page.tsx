'use client'

import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  CalendarCheck,
  Activity,
  UserX,
  Funnel,
  PhoneMissed,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Phone,
  Calendar,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useStudioStore } from '@/lib/stores/studioStore'
import { formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils'
import Link from 'next/link'
import { format, parseISO, isToday, subDays, startOfDay, endOfDay } from 'date-fns'

export default function OverviewPage() {
  const { bookings, services, staff, bootstrapData, isBootstrapped } = useStudioStore()

  useEffect(() => {
    if (!isBootstrapped) bootstrapData()
  }, [isBootstrapped, bootstrapData])

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const todayBookings = useMemo(() => {
    return bookings
      .filter(b => b.scheduledAt.startsWith(todayStr))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 6)
  }, [bookings, todayStr])

  const todayStats = useMemo(() => {
    const todays = bookings.filter(b => b.scheduledAt.startsWith(todayStr))
    const revenue = todays.reduce((sum, b) => sum + b.servicePrice, 0)
    const noShows = todays.filter(b => b.status === 'NO_SHOW').length
    const completed = todays.filter(b => b.status === 'COMPLETED').length
    const utilization = staff.length > 0 ? Math.round((todays.length / (staff.length * 8)) * 100) : 0
    return { bookings: todays.length, revenue, noShows, missedCalls: 2, utilization: Math.min(utilization, 100) }
  }, [bookings, todayStr, staff])

  const thisWeekBookings = useMemo(() => {
    const weekAgo = subDays(new Date(), 7)
    return bookings.filter(b => new Date(b.scheduledAt) >= weekAgo)
  }, [bookings])

  const topServices = useMemo(() => {
    const counts: Record<string, { name: string; count: number; revenue: number }> = {}
    thisWeekBookings.forEach(b => {
      if (!counts[b.serviceId]) counts[b.serviceId] = { name: b.serviceName, count: 0, revenue: 0 }
      counts[b.serviceId].count++
      counts[b.serviceId].revenue += b.servicePrice
    })
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [thisWeekBookings])

  const staffUtilization = useMemo(() => {
    return staff.map(s => {
      const staffBookings = thisWeekBookings.filter(b => b.staffId === s.id)
      const possibleSlots = 40
      const util = Math.min(Math.round((staffBookings.length / possibleSlots) * 100), 100)
      return { name: s.name, utilization: util, bookings: staffBookings.length }
    })
  }, [staff, thisWeekBookings])

  const revenueChart = useMemo(() => {
    const data = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayBookings = bookings.filter(b => b.scheduledAt.startsWith(dateStr))
      const revenue = dayBookings.reduce((sum, b) => sum + b.servicePrice, 0)
      data.push({ date: format(date, 'MMM d'), revenue, bookings: dayBookings.length })
    }
    return data
  }, [bookings])

  const stats = [
    { label: "Today's Revenue", value: formatCurrency(todayStats.revenue), change: '+14%', trend: 'up', icon: DollarSign, color: 'emerald' },
    { label: 'Bookings Today', value: todayStats.bookings.toString(), change: '+4%', trend: 'up', icon: CalendarCheck, color: 'violet' },
    { label: 'Staff Utilization', value: `${todayStats.utilization}%`, change: '+6%', trend: 'up', icon: Activity, color: 'blue' },
    { label: 'No-Shows Today', value: todayStats.noShows.toString(), change: '-50%', trend: 'down', icon: UserX, color: 'orange' },
    { label: 'New Leads', value: '4', change: '+100%', trend: 'up', icon: Funnel, color: 'pink' },
    { label: 'Missed Calls', value: todayStats.missedCalls.toString(), change: '-33%', trend: 'down', icon: PhoneMissed, color: 'red' },
  ]

  const maxServiceCount = Math.max(...topServices.map(s => s.count), 1)

  const activityIcons: Record<string, React.ElementType> = {
    phone: Phone,
    check: CalendarCheck,
    alert: UserX,
    user: Activity,
    calendar: CalendarCheck,
    globe: Activity,
    message: Funnel,
  }

  const recentActivity = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)
    return sorted.map(b => ({
      id: b.id,
      type: b.status === 'COMPLETED' ? 'BOOKING_COMPLETED' : 'BOOKING_CREATED',
      icon: b.channel === 'VOICE' ? 'phone' : b.channel === 'WHATSAPP' ? 'message' : 'globe',
      text: `${b.customerName} — ${b.serviceName} with ${b.staffName}`,
      timestamp: b.createdAt,
    }))
  }, [bookings])

  const alerts = useMemo(() => {
    const result = []
    const heavyStaff = staff.filter(s => {
      const todays = bookings.filter(b => b.staffId === s.id && b.scheduledAt.startsWith(todayStr))
      return todays.length >= 4
    })
    heavyStaff.forEach(s => result.push({ id: s.id, text: `${s.name} has ${heavyStaff.filter(x => x.id === s.id).length} back-to-back bookings — no break scheduled`, type: 'warning' }))
    const newLeads = bookings.filter(b => b.status === 'PENDING')
    if (newLeads.length > 0) result.push({ id: 'leads', text: `${newLeads.length} booking${newLeads.length > 1 ? 's' : ''} haven't been confirmed`, type: 'info' })
    return result.slice(0, 3)
  }, [bookings, staff, todayStr])

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-border rounded-xl p-5 hover:scale-[1.01] hover:shadow-lg transition-all cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${stat.color}/15`}>
              <stat.icon className={`text-${stat.color}`} size={20} />
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-text-secondary">{stat.label}</div>
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              stat.trend === 'up' ? 'text-emerald-400' : 'text-emerald-400'
            }`}>
              {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {stat.change} vs yesterday
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Revenue & Bookings</h3>
              <p className="text-sm text-text-secondary">Last 14 days</p>
            </div>
            <div className="flex gap-2">
              {['7D', '14D', '30D'].map((period) => (
                <button
                  key={period}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    period === '14D'
                      ? 'bg-primary text-white'
                      : 'bg-surface2 hover:bg-surface3 text-text-secondary'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C3CE1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6C3CE1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#8B8BA0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8B8BA0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid #2E2E3F',
                    borderRadius: '8px',
                    color: '#F1F1F3',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6C3CE1"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#EC4899"
                  strokeWidth={2}
                  fill="url(#colorBookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staff Utilization */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">Staff Utilization</h3>
          <p className="text-sm text-text-secondary mb-6">Today</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffUtilization} layout="vertical">
                <XAxis type="number" domain={[0, 100]} stroke="#8B8BA0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid #2E2E3F',
                    borderRadius: '8px',
                    color: '#F1F1F3',
                  }}
                />
                <Bar dataKey="utilization" fill="#6C3CE1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-text-secondary">Average</span>
            <span className="font-semibold">{Math.round(staffUtilization.reduce((a, b) => a + b.utilization, 0) / staffUtilization.length)}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Up Next Today</h3>
            <Link href="/calendar" className="text-sm text-primary hover:underline flex items-center gap-1">
              View Calendar <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {todayBookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface2 hover:bg-surface3 transition-colors cursor-pointer"
              >
                <div className="w-1 h-10 rounded-full bg-primary" />
                <div className="text-sm font-mono text-text-muted w-16">
                  {format(parseISO(booking.scheduledAt), 'h:mm a')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{booking.customerName}</div>
                  <div className="text-xs text-text-secondary truncate">{booking.serviceName}</div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                  booking.status === 'CONFIRMED' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                  booking.status === 'IN_PROGRESS' ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' :
                  booking.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}>
                  {booking.status}
                </span>
              </motion.div>
            ))}
            {todayBookings.length === 0 && (
              <div className="text-center py-8 text-text-muted">
                <CalendarCheck size={32} className="mx-auto mb-2 opacity-50" />
                <p>No more bookings today</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Services This Week</h3>
          <div className="space-y-4">
            {topServices.map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{service.name}</span>
                  <span className="text-xs text-text-secondary">
                    {service.count} bookings · {formatCurrency(service.revenue)}
                  </span>
                </div>
                <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(service.count / maxServiceCount) * 100}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity.map((activity, i) => {
              const Icon = activityIcons[activity.icon] || Activity
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-secondary">{activity.text}</p>
                    <p className="text-xs text-text-muted mt-1">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mt-6 space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-warning bg-warning/5"
                >
                  <div className="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center">
                    <span className="text-warning text-xs">!</span>
                  </div>
                  <span className="text-sm">{alert.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}