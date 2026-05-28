'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Bell, Search, Plus, Menu } from 'lucide-react'
import { cn, formatRelativeTime, getInitials } from '@/lib/utils'
import { useUIStore } from '@/lib/stores/uiStore'
import { useCalendarStore } from '@/lib/stores/calendarStore'
import { useRouter, usePathname } from 'next/navigation'
import { supabaseAuth as supabase } from '@/lib/supabaseAuthClient'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'

const pageTitles: Record<string, string> = {
  '/overview': 'Overview',
  '/calendar': 'Booking Calendar',
  '/bookings': 'Bookings',
  '/staff': 'Team',
  '/services': 'Service Catalog',
  '/customers': 'Customers',
  '/leads': 'Leads',
  '/campaigns': 'Campaigns',
  '/calls': 'AI Call Logs',
  '/integrations': 'Integrations',
  '/settings': 'Settings',
}

export default function Topbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { notifications, unreadCount, toggleCommandPalette, markAsRead, markAllAsRead, toggleSidebar } = useUIStore()
  const { openNewBookingModal } = useCalendarStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [userInitials, setUserInitials] = useState('LC')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        const name = data.user.user_metadata?.name || data.user.email.split('@')[0]
        setUserInitials(getInitials(name))
      }
    })
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pageTitle = pageTitles[pathname] || 'Dashboard'

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-surface rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold truncate">{pageTitle}</h1>
          <div className="hidden sm:block"><DateRangeFilter /></div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Booking */}
          <button
            onClick={() => openNewBookingModal()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Booking</span>
          </button>

          {/* Live Clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-mono text-text-secondary">
              {format(currentTime, 'h:mm:ss a')}
            </span>
          </div>

          {/* Search */}
          <button
            onClick={toggleCommandPalette}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg hover:bg-surface2 transition-colors"
          >
            <Search size={16} className="text-text-muted" />
            <span className="text-sm text-text-muted hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-surface2 border border-border rounded text-text-muted">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-surface border border-border rounded-lg hover:bg-surface2 transition-colors"
            >
              <Bell size={18} className="text-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <span className="font-medium">Notifications</span>
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={cn(
                          'p-4 border-b border-border hover:bg-surface2 cursor-pointer transition-colors',
                          !notification.read && 'bg-primary/5'
                        )}
                      >
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-text-secondary mt-1">{notification.message}</div>
                        <div className="text-xs text-text-muted mt-2">
                          {formatRelativeTime(notification.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setShowNotifications(false)
                      router.push('/notifications')
                    }}
                    className="w-full p-3 text-center text-sm text-primary hover:bg-surface2 transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Avatar */}
          <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
            {userInitials}
          </button>
        </div>
      </div>
    </header>
  )
}