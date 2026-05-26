'use client'

import WhatsAppPanel from '@/components/integrations/WhatsAppPanel'
import { MessageCircle } from 'lucide-react'

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="text-emerald-400" size={24} />
            WhatsApp Communications
          </h1>
          <p className="text-text-secondary">
            Manage your Meta WhatsApp Cloud API conversations, send customer messages, and view webhook delivery status.
          </p>
        </div>
      </div>
      <WhatsAppPanel />
    </div>
  )
}
