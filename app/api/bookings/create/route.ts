import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'

const TENANT_ID = '405b50b9-9504-4bda-bd38-7ce5b53e7aa0'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

function generateRef() {
  return 'STU-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customerName,
      customerPhone,
      customerEmail,
      staffId,
      staffName,
      serviceId,
      serviceName,
      serviceDurationMin,
      servicePrice,
      scheduledAt,   // ISO string from client — already UTC-correct
      endsAt,
      channel = 'WEB',
      notes,
    } = body

    if (!customerName || !customerPhone || !staffId || !serviceId || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getAdminClient()
    const now = new Date().toISOString()

    // 1. Validate: not in the past
    const bookingTime = new Date(scheduledAt)
    if (bookingTime.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Booking date and time cannot be in the past.' },
        { status: 400 }
      )
    }

    const newStart = bookingTime
    const newEnd   = new Date(newStart.getTime() + serviceDurationMin * 60000)

    // Day boundaries in UTC using the exact UTC date of the booking
    const dayStart = new Date(newStart)
    dayStart.setUTCHours(0, 0, 0, 0)

    // 2. Check overlapping bookings for same staff (server-side, service role bypasses RLS)
    const { data: existing, error: checkErr } = await supabase
      .from('bookings')
      .select('id, scheduled_at, service_duration_min, customer_name, service_name')
      .eq('tenant_id', TENANT_ID)
      .eq('staff_id', staffId)
      .neq('status', 'CANCELLED')
      .gte('scheduled_at', dayStart.toISOString())
      .lt('scheduled_at', newEnd.toISOString())

    if (checkErr) {
      return NextResponse.json({ error: checkErr.message }, { status: 500 })
    }

    if (existing && existing.length > 0) {
      const conflict = existing.find((b: { scheduled_at: string; service_duration_min: number }) => {
        const exStart = new Date(b.scheduled_at)
        const exEnd   = new Date(exStart.getTime() + b.service_duration_min * 60000)
        return newStart < exEnd && newEnd > exStart
      })
      if (conflict) {
        const conflictTyped = conflict as { customer_name: string; service_name: string; scheduled_at: string }
        return NextResponse.json(
          {
            error: `This slot is already booked (${conflictTyped.customer_name} – ${conflictTyped.service_name}). Please choose another time.`,
          },
          { status: 409 }
        )
      }
    }

    // 3. Find or create customer
    const { data: existingCust } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', customerPhone)
      .maybeSingle()

    let customerId: string
    if (existingCust) {
      customerId = existingCust.id
    } else {
      const { data: newCust, error: custErr } = await supabase
        .from('customers')
        .insert({
          business_id: TENANT_ID,
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
          preferred_channel: channel,
          consents: { essential: true, marketing: false, intelligence: false },
        })
        .select()
        .single()
      if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 })
      customerId = newCust.id
    }

    // 4. Create the booking
    const ref = generateRef()
    const { data: newBooking, error: bookErr } = await supabase
      .from('bookings')
      .insert({
        booking_ref: ref,
        tenant_id: TENANT_ID,
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        staff_id: staffId,
        staff_name: staffName,
        service_id: serviceId,
        service_name: serviceName,
        service_duration_min: serviceDurationMin,
        service_price: servicePrice,
        scheduled_at: scheduledAt,
        ends_at: endsAt,
        status: 'CONFIRMED',
        channel,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 500 })

    // 5. Build rich confirmation messages
    const dateFormatted = format(parseISO(scheduledAt), 'EEEE, MMMM d, yyyy')
    const timeFormatted = format(parseISO(scheduledAt), 'h:mm a')

    const whatsappMsg =
`✅ *Booking Confirmed!*

Hi ${customerName}, your appointment is confirmed. Here are your details:

📋 *Booking Ref:* ${ref}
💇 *Service:* ${serviceName}
👤 *Stylist:* ${staffName}
📅 *Date:* ${dateFormatted}
⏰ *Time:* ${timeFormatted}
⏱ *Duration:* ${serviceDurationMin} min
💰 *Price:* $${Number(servicePrice).toFixed(2)}

📍 The Studio – Williamsburg, Brooklyn

For changes or cancellations, please contact us at least 24 hours in advance. See you soon! 💈`

    const dateShort    = format(parseISO(scheduledAt), 'M/d/yyyy')
    const timePadded   = format(parseISO(scheduledAt), 'hh:mm a')

    const smsMsg =
`Hello ${customerName} 👋
Your appointment has been successfully confirmed! ✅

📖 *Booking Ref:* ${ref}
📅 *Date:* ${dateShort}
⏰ *Time:* ${timePadded}
✂️ *Service:* ${serviceName}
👨‍💼 *Staff:* ${staffName}
⏳ *Duration:* ${serviceDurationMin} mins
💲 *Price:* $${Number(servicePrice).toFixed(2)}
🏥 *Salon:* Studio Luxe Barber Lounge
📍 *Location:* 127 Bedford Ave, Williamsburg, Brooklyn, NY 11211

We look forward to seeing you. Reply to this message if you need to reschedule or have any questions!`

    // Insert WhatsApp + SMS logs (best-effort — don't fail the booking if these error)
    await Promise.allSettled([
      supabase.from('whatsapp_messages').insert({
        tenant_id: TENANT_ID,
        phone_number: customerPhone,
        contact_name: customerName,
        direction: 'outbound',
        message_body: whatsappMsg,
        status: 'sent',
        timestamp: now,
      }),
      supabase.from('sms_messages').insert({
        tenant_id: TENANT_ID,
        phone_number: customerPhone,
        contact_name: customerName,
        direction: 'outbound',
        message_body: smsMsg,
        status: 'delivered',
        created_at: now,
      }),
    ])

    return NextResponse.json({ booking: newBooking, ref }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
