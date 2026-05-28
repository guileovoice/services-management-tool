import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-only admin client — service role key never exposed to the browser
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const staffId  = searchParams.get('staff_id')
  const date     = searchParams.get('date')      // e.g. "2026-05-31" in LOCAL timezone
  const tenantId = searchParams.get('tenant_id')

  if (!staffId || !date || !tenantId) {
    return NextResponse.json({ error: 'Missing staff_id, date, or tenant_id' }, { status: 400 })
  }

  // Because bookings are stored in UTC but the date string is in the user's LOCAL timezone,
  // we expand the search by ±1 day so we never miss bookings across timezone boundaries.
  // The client JS (running in local timezone) will compute exact slot overlaps.
  const localDate  = new Date(`${date}T00:00:00.000Z`)
  const searchFrom = new Date(localDate.getTime() - 24 * 60 * 60 * 1000)  // day before
  const searchTo   = new Date(localDate.getTime() + 2 * 24 * 60 * 60 * 1000) // day after

  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('scheduled_at, service_duration_min, booking_ref, customer_name, service_name')
    .eq('tenant_id', tenantId)
    .eq('staff_id', staffId)
    .neq('status', 'CANCELLED')
    .gte('scheduled_at', searchFrom.toISOString())
    .lte('scheduled_at', searchTo.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return the raw rows — client will compute overlaps using local timezone
  return NextResponse.json({ bookings: data || [] })
}

