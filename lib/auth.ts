import { supabaseAuth as supabase } from '@/lib/supabaseAuthClient'

const FINGERPRINT_KEY = 'guileo_browser_fingerprint'
const LOGIN_TIME_KEY = 'guileo_login_time'
const SESSION_DURATION_MS = 60 * 60 * 1000

export function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') return ''
  const ua = navigator.userAgent
  const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
  const language = navigator.language
  const raw = `${ua}||${screenRes}||${language}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}

export function storeSessionMeta(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(FINGERPRINT_KEY, getBrowserFingerprint())
  localStorage.setItem(LOGIN_TIME_KEY, String(Date.now()))
}

export function clearSessionMeta(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(FINGERPRINT_KEY)
  localStorage.removeItem(LOGIN_TIME_KEY)
}

export function checkBrowserFingerprint(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(FINGERPRINT_KEY)
  if (!stored) return false
  return stored === getBrowserFingerprint()
}

export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return false
  const loginTime = localStorage.getItem(LOGIN_TIME_KEY)
  if (!loginTime) return true
  return Date.now() - Number(loginTime) > SESSION_DURATION_MS
}

export async function validateSession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  if (!checkBrowserFingerprint()) {
    await supabase.auth.signOut()
    clearSessionMeta()
    return false
  }
  if (isSessionExpired()) {
    await supabase.auth.signOut()
    clearSessionMeta()
    return false
  }
  localStorage.setItem(LOGIN_TIME_KEY, String(Date.now()))
  return true
}
