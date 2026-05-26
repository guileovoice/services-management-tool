'use client'

import SMSPanel from '@/components/integrations/SMSPanel'
import { MessageSquare } from 'lucide-react'

export default function SMSPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-primary" size={24} />
            SMS Communications
          </h1>
          <p className="text-text-secondary">
            View and send SMS messages to customers, check opt-in compliance, and manage automated messages.
          </p>
        </div>
      </div>
      <SMSPanel />
    </div>
  )
}
