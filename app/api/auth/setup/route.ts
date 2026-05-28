import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const SEED_USERS = [
  { email: 'info@scalepods.co', password: 'ScalePods@123', name: 'ScalePods Admin', role: 'ADMIN' },
  { email: 'admguileo@gmail.com', password: 'Guileo@123', name: 'Guileo Admin', role: 'ADMIN' },
]

export async function POST() {
  try {
    const results: { email: string; status: string }[] = []

    for (const user of SEED_USERS) {
      const { error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      })

      if (authError) {
        if (authError.message.includes('already exists')) {
          results.push({ email: user.email, status: 'already exists' })
          continue
        }
        results.push({ email: user.email, status: `error: ${authError.message}` })
        continue
      }

      results.push({ email: user.email, status: 'created' })
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
