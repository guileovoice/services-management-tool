'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Scissors,
  UserCircle,
  Megaphone,
  Phone,
  Settings,
  Funnel,
  LogOut,
  MessageSquare,
  MessageCircle,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useStudioStore } from '@/lib/stores/studioStore'
import { supabaseAuth as supabase } from '@/lib/supabaseAuthClient'
import { clearSessionMeta } from '@/lib/auth'
import { useEffect, useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { staff, leads, bookings } = useStudioStore()
  const [sessionUser, setSessionUser] = useState<{ email?: string; name?: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setSessionUser({
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        })
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearSessionMeta()
    router.replace('/login')
  }

  const newLeadsCount = leads.filter(l => l.status === 'NEW').length

  const currentUser = { name: sessionUser?.name || 'Owner', avatarColor: '#6C3CE1' }

  const navGroups = [
    {
      label: 'Operations',
      items: [
        { label: 'Overview', icon: LayoutDashboard, href: '/overview' },
        { label: 'Bookings', icon: ClipboardList, href: '/bookings' },
        { label: 'Leads', icon: Funnel, href: '/leads', badge: String(newLeadsCount) },
      ],
    },
    {
      label: 'Team',
      items: [
        { label: 'Staff', icon: Users, href: '/staff' },
        { label: 'Services', icon: Scissors, href: '/services' },
      ],
    },
    {
      label: 'Customers',
      items: [
        { label: 'Customers', icon: UserCircle, href: '/customers' },
        { label: 'WhatsApp', icon: MessageCircle, href: '/whatsapp' },
        { label: 'SMS', icon: MessageSquare, href: '/sms' },
        { label: 'Campaigns', icon: Megaphone, href: '/campaigns' },
        { label: 'Call Logs', icon: Phone, href: '/calls' },
      ],
    },
    {
      label: 'Setup',
      items: [
        { label: 'Settings', icon: Settings, href: '/settings' },
      ],
    },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#13131A] border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/overview" className="flex items-center gap-3 group">
          <div className="text-2xl font-bold text-primary">Guileo AI</div>
        </Link>
        <p className="text-xs text-text-muted mt-1">for Services</p>
      </div>

      {/* Tenant Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-lg font-bold text-primary">
            TS
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">The Studio</div>
            <div className="text-xs text-text-muted truncate">Williamsburg, Brooklyn</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-5 mb-2 text-xs font-medium text-text-muted uppercase tracking-wider">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg transition-all relative',
                    isActive
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <item.icon size={18} />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      item.label === 'Leads' ? 'bg-danger/15 text-danger' : 'bg-primary/15 text-primary'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border">
        {/* Plan Badge */}
        <div className="mb-4">
          <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-warning/15 text-warning">
            GROWTH PLAN
          </span>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            {getInitials(currentUser.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{currentUser.name}</div>
            <div className="text-xs text-text-muted">Owner</div>
          </div>
          <button onClick={handleLogout} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-text-primary">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}