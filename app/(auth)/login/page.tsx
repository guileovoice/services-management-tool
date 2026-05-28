'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { supabaseAuth as supabase } from '@/lib/supabaseAuthClient'
import { storeSessionMeta, clearSessionMeta } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    const signIn = async () =>
      supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password })

    let { error: signInError } = await signIn()

    if (signInError?.message === 'Invalid login credentials') {
      const res = await fetch('/api/auth/setup', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        const retry = await signIn()
        signInError = retry.error
      }
    }

    if (signInError) {
      const msg =
        signInError.message === 'Invalid login credentials'
          ? 'Invalid email or password'
          : signInError.message
      setError(msg)
      setLoading(false)
      clearSessionMeta()
    } else {
      storeSessionMeta()
      router.push('/overview')
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(108,60,225,0.12) 0%, #0d0d14 55%)' }}
    >
      <div className="w-full max-w-[400px] flex flex-col items-center gap-8">

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full rounded-2xl border border-white/[0.07] p-6 sm:p-8"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
        >
          {/* Logo + Brand */}
          <div className="flex flex-col items-center mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7C4DEE 0%, #5B2FD4 100%)' }}
            >
              <img src="/favicon.svg" alt="Guileo" className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-white">Guileo</span>
              <span className="text-primary">AI</span>
            </h1>
            <p className="text-sm text-text-muted mt-1">Services Dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@studio.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary/60 focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary/60 focus:bg-white/[0.06] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3 mt-1 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #7C4DEE 0%, #5B2FD4 100%)',
                boxShadow: '0 0 24px rgba(108,60,225,0.45)',
              }}
            >
              <span className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors rounded-xl" />
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="text-xs text-text-muted">
          © 2026 Guileo AI. All rights reserved.
        </p>
      </div>
    </div>
  )
}