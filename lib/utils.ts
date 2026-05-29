import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Construct a JS Date from a booking's separate date + time columns.
 * Handles both "HH:MM" and "HH:MM:SS" (Postgres TIME type) formats safely.
 */
export function bookingDateTime(date: string, time: string): Date {
  // Slice to HH:MM to avoid "HH:MM:SS:00" if Postgres returns seconds
  const hhmm = (time ?? '00:00').slice(0, 5)
  return new Date(`${date}T${hhmm}:00`)
}


export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'h:mm a')
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy · h:mm a')
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#6C3CE1', '#EC4899', '#10B981', '#F59E0B', 
    '#3B82F6', '#EF4444', '#8B5CF6', '#14B8A6',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export const statusColors = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  NO_SHOW: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  IN_PROGRESS: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
}

export const leadStatusColors = {
  NEW: 'bg-blue-500/15 text-blue-400',
  CONTACTED: 'bg-yellow-500/15 text-yellow-400',
  QUALIFIED: 'bg-violet-500/15 text-violet-400',
  BOOKED: 'bg-emerald-500/15 text-emerald-400',
  LOST: 'bg-red-500/15 text-red-400',
}

export const channelIcons = {
  VOICE: 'phone',
  WHATSAPP: 'message-circle',
  SMS: 'message-square',
  WEB: 'globe',
  WALK_IN: 'user',
}

export const categoryColors = {
  HAIR: { bg: '#6C3CE1', light: 'rgba(108, 60, 225, 0.2)' },
  COLOR: { bg: '#EC4899', light: 'rgba(236, 72, 153, 0.2)' },
  BEARD: { bg: '#3B82F6', light: 'rgba(59, 130, 246, 0.2)' },
  NAILS: { bg: '#10B981', light: 'rgba(16, 185, 129, 0.2)' },
  SPA: { bg: '#F59E0B', light: 'rgba(245, 158, 11, 0.2)' },
  CONSULTATION: { bg: '#8B5CF6', light: 'rgba(139, 92, 246, 0.2)' },
  OTHER: { bg: '#6B7280', light: 'rgba(107, 114, 128, 0.2)' },
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}