import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) {
      return NextResponse.json({ exists: false, error: error.message })
    }
    const users = data?.users || []
    const seedEmails = ['info@scalepods.co', 'admguileo@gmail.com']
    const existing = users.filter((u: { email?: string }) => seedEmails.includes(u.email || ''))
    return NextResponse.json({ exists: existing.length === 2, users: existing.length })
  } catch {
    return NextResponse.json({ exists: false, error: 'check failed' })
  }
}
