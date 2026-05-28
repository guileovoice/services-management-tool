'use client'

import SMSPanel from '@/components/integrations/SMSPanel'
import { MessageSquare } from 'lucide-react'

export default function SMSPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
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
