'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageSquare, Phone, Send, Check, Clock, AlertTriangle, Ban, ArrowLeft, Loader2 } from 'lucide-react'
import { cn, formatRelativeTime, formatTime } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'
import type { SMSMessage } from '@/lib/types'

const TENANT_ID = '405b50b9-9504-4bda-bd38-7ce5b53e7aa0'

const statusIcon = {
  queued: Clock,
  sent: Check,
  delivered: Check,
  failed: AlertTriangle,
  received: Phone,
}

const statusColor = {
  queued: 'text-yellow-400',
  sent: 'text-blue-400',
  delivered: 'text-emerald-400',
  failed: 'text-red-400',
  received: 'text-text-muted',
}

interface Contact {
  phoneNumber: string
  contactName: string
  lastMessage: SMSMessage
  messages: SMSMessage[]
  unread: number
}

export default function SMSPanel() {
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [twilioConfigured, setTwilioConfigured] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [selectedContact?.messages, scrollToBottom])

  useEffect(() => {
    loadMessages()
    checkTwilioConfig()
    subscribeToMessages()

    return () => {
      supabase.channel('sms-realtime').unsubscribe()
    }
  }, [])

  const checkTwilioConfig = async () => {
    const { data } = await supabase
      .from('sms_config')
      .select('tenant_id')
      .eq('tenant_id', TENANT_ID)
      .maybeSingle()
    setTwilioConfigured(!!data)
  }

  const loadMessages = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false })

    if (data) {
      setMessages(data.map(toCamel))
    }
    setIsLoading(false)
  }

  const subscribeToMessages = () => {
    supabase
      .channel('sms-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sms_messages',
          filter: `tenant_id=eq.${TENANT_ID}`,
        },
        (payload) => {
          const newMsg = toCamel(payload.new as Record<string, unknown>)
          setMessages((prev) => {
            const existing = prev.findIndex((m) => m.id === newMsg.id)
            if (existing >= 0) {
              const updated = [...prev]
              updated[existing] = newMsg
              return updated
            }
            return [newMsg, ...prev]
          })
        }
      )
      .subscribe()
  }

  const handleSendMessage = async () => {
    const text = inputText.trim()
    if (!text || !selectedContact) return

    setInputText('')

    const { error } = await supabase.from('sms_messages').insert({
      tenant_id: TENANT_ID,
      phone_number: selectedContact.phoneNumber,
      contact_name: selectedContact.contactName,
      direction: 'outbound',
      message_body: text,
      status: 'queued',
      created_at: new Date().toISOString(),
    })

    if (error) {
      setInputText(text)
      return
    }
  }

  const getContacts = (): Contact[] => {
    const grouped = new Map<string, SMSMessage[]>()
    for (const msg of messages || []) {
      const key = msg.phoneNumber
      if (!key) continue
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(msg)
    }

    const contacts: Contact[] = []
    grouped.forEach((msgs, phoneNumber) => {
      const sorted = [...msgs].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA)
      })
      contacts.push({
        phoneNumber,
        contactName: sorted[0]?.contactName || phoneNumber,
        lastMessage: sorted[0],
        messages: [...sorted].reverse(),
        unread: sorted.filter(
          (m) => m.direction === 'inbound' && m.status === 'received'
        ).length,
      })
    })

    return contacts.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA)
    })
  }

  const contacts = getContacts()
  const filteredContacts = searchQuery
    ? contacts.filter(
        (c) =>
          c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phoneNumber.includes(searchQuery)
      )
    : contacts

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-[600px] lg:h-[600px] min-h-[calc(100vh-12rem)] bg-[#09090B] border border-border rounded-xl overflow-hidden">
      {/* Contact List */}
      <div className={cn(
        'w-full lg:w-[320px] flex-shrink-0 border-r border-border flex flex-col bg-[#0C0C10]',
        selectedContact ? 'hidden lg:flex' : 'flex'
      )}>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface2 border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin text-text-muted" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageSquare size={28} className="text-text-muted mb-2" />
              <p className="text-sm text-text-muted">No conversations yet</p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const StatusIcon = statusIcon[contact.lastMessage.status]
              return (
                <button
                  key={contact.phoneNumber}
                  onClick={() => setSelectedContact(contact)}
                  className={cn(
                    'w-full p-3 text-left hover:bg-surface transition-colors border-b border-border/50',
                    selectedContact?.phoneNumber === contact.phoneNumber && 'bg-surface'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium truncate">
                          {contact.contactName}
                        </span>
                        <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">
                          {formatRelativeTime(contact.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon size={10} className={cn('flex-shrink-0', statusColor[contact.lastMessage.status])} />
                        <span className="text-xs text-text-muted truncate">
                          {contact.lastMessage.messageBody}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#09090B]">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-3 border-b border-border bg-[#0C0C10]">
              <button
                onClick={() => setSelectedContact(null)}
                className="p-1 hover:bg-surface2 rounded-lg lg:hidden"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{selectedContact.contactName}</div>
                <div className="text-[10px] text-text-muted">{selectedContact.phoneNumber}</div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-[10px] text-emerald-400">
                <Check size={10} />
                Opt-in
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {selectedContact.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2.5 text-sm leading-relaxed',
                      msg.direction === 'outbound'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-surface border border-border text-text-primary rounded-bl-md'
                    )}
                  >
                    <p>{msg.messageBody}</p>
                    <div
                      className={cn(
                        'flex items-center gap-1 mt-1',
                        msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <span className="text-[10px] opacity-60">
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.direction === 'outbound' && (
                        <span className={cn('text-[10px]', statusColor[msg.status])}>
                          {msg.status === 'queued' && <Clock size={10} />}
                          {msg.status === 'sent' && <Check size={10} />}
                          {msg.status === 'delivered' && <Check size={10} className="text-emerald-400" />}
                          {msg.status === 'failed' && <AlertTriangle size={10} />}
                        </span>
                      )}
                    </div>
                    {msg.complianceAction && (
                      <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-red-400">
                        <Ban size={10} />
                        Opt-out: {msg.complianceAction}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-[#0C0C10]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type an SMS message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className={cn(
                    'p-2.5 rounded-xl transition-colors',
                    inputText.trim()
                      ? 'bg-primary hover:bg-primary-dark text-white'
                      : 'bg-surface2 text-text-muted cursor-not-allowed'
                  )}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold mb-1">SMS Messages</h3>
            <p className="text-sm text-text-muted max-w-xs">
              Select a contact from the left to view and send SMS messages.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function toCamel(row: Record<string, unknown>): SMSMessage {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    phoneNumber: row.phone_number as string,
    contactName: row.contact_name as string | undefined,
    direction: row.direction as 'inbound' | 'outbound',
    messageBody: row.message_body as string,
    status: row.status as SMSMessage['status'],
    twilioSid: row.twilio_sid as string | undefined,
    complianceAction: row.compliance_action as SMSMessage['complianceAction'],
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at || row.created_at) as string,
  }
}
