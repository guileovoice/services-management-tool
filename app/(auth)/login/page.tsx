'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Calendar, User, Phone } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    const validCredentials = [
      { email: 'info@scalepods.co', password: 'ScalePods@123' },
      { email: 'admguileo@gmail.com', password: 'Prosperity2026#' },
      { email: 'admin@guileo.ai', password: 'guileo123' },
    ]

    const isValid = validCredentials.some(
      cred => email.toLowerCase() === cred.email.toLowerCase() && password === cred.password
    )

    if (isValid) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/overview')
    } else {
      setError('Invalid email or password')
      setShake(true)
      setLoading(false)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Login Form */}
      <div className="w-[55%] flex flex-col justify-center px-16 bg-surface">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-primary">Guileo AI</div>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-secondary/15 text-secondary">
                for Services
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome back</h1>
            <p className="text-text-secondary">Sign in to your services dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                placeholder="you@company.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-surface2 text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface text-text-muted">or</span>
              </div>
            </div>

            {/* Magic Link */}
            <button
              type="button"
              className="w-full py-3 border border-border bg-surface2 hover:bg-surface3 text-text-primary font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Continue with Magic Link
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-text-muted">
            Need access?{' '}
            <button className="text-primary hover:underline">Contact your admin</button>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Visual */}
      <div className="w-[45%] bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-surface/50" />
        
        {/* Floating Cards */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center p-12">
          <div className="space-y-6 w-full max-w-sm">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="p-5 bg-surface border border-border rounded-xl shadow-xl"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Calendar className="text-primary" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold">28 bookings today</div>
                  <div className="text-sm text-text-secondary">+4 from yesterday</div>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="p-5 bg-surface border border-border rounded-xl shadow-xl"
              style={{ animation: 'float 6s ease-in-out infinite 0.5s' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                  MS
                </div>
                <div>
                  <div className="font-semibold">Marcus Silva</div>
                  <div className="text-sm text-text-secondary">3 back-to-back bookings</div>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="p-5 bg-surface border border-border rounded-xl shadow-xl"
              style={{ animation: 'float 6s ease-in-out infinite 1s' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Phone className="text-emerald-400" size={24} />
                </div>
                <div>
                  <div className="text-xs font-medium text-emerald-400 mb-1">New booking via Voice</div>
                  <div className="font-semibold">Sofia Chen · Balayage</div>
                </div>
              </div>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-center pt-8"
            >
              <p className="text-text-secondary text-sm">
                AI answers every call. Your team stays focused.
              </p>
            </motion.div>

            {/* Partner logos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex items-center justify-center gap-6 pt-4 opacity-50"
            >
              <span className="text-sm font-medium text-text-muted">Powered by</span>
              <div className="flex items-center gap-4 text-text-muted text-xs">
                <span>Vapi</span>
                <span>·</span>
                <span>Twilio</span>
                <span>·</span>
                <span>Google Calendar</span>
                <span>·</span>
                <span>Stripe</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}