'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageCircle, Send, Check, Clock, AlertTriangle, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react'
import { cn, formatRelativeTime, formatTime } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'
import type { WhatsAppMessage } from '@/lib/types'

const TENANT_ID = '405b50b9-9504-4bda-bd38-7ce5b53e7aa0'

const statusIcon = {
  queued: Clock,
  sent: Check,
  received: MessageCircle,
  failed: AlertTriangle,
}

const statusColor = {
  queued: 'text-yellow-400',
  sent: 'text-blue-400',
  received: 'text-emerald-400',
  failed: 'text-red-400',
}

interface Contact {
  phoneNumber: string
  contactName: string
  lastMessage: WhatsAppMessage
  messages: WhatsAppMessage[]
  unread: number
}

export default function WhatsAppPanel() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [metaConfigured, setMetaConfigured] = useState<boolean | null>(null)
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
    checkMetaConfig()
    subscribeToMessages()

    return () => {
      supabase.channel('whatsapp-realtime').unsubscribe()
    }
  }, [])

  const checkMetaConfig = async () => {
    const { data } = await supabase
      .from('whatsapp_config')
      .select('status')
      .eq('tenant_id', TENANT_ID)
      .maybeSingle()
    setMetaConfigured(data ? data.status === 'active' : false)
  }

  const loadMessages = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('timestamp', { ascending: false })

    if (data) {
      setMessages(data.map(toCamel))
    }
    setIsLoading(false)
  }

  const subscribeToMessages = () => {
    supabase
      .channel('whatsapp-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
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

    const { error } = await supabase.from('whatsapp_messages').insert({
      tenant_id: TENANT_ID,
      phone_number: selectedContact.phoneNumber,
      contact_name: selectedContact.contactName,
      direction: 'outbound',
      message_body: text,
      status: 'queued',
      timestamp: new Date().toISOString(),
    })

    if (error) {
      setInputText(text)
      return
    }
  }

  const getContacts = (): Contact[] => {
    const grouped = new Map<string, WhatsAppMessage[]>()
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
    <div className="flex h-[600px] bg-[#09090B] border border-border rounded-xl overflow-hidden">
      {/* Contact List */}
      <div className="w-[320px] flex-shrink-0 border-r border-border flex flex-col bg-[#0C0C10]">
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
              <MessageCircle size={28} className="text-text-muted mb-2" />
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
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={16} className="text-emerald-400" />
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
                    {contact.lastMessage.orderId && (
                      <div className="flex-shrink-0">
                        <ShoppingBag size={12} className="text-text-muted" />
                      </div>
                    )}
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
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={14} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{selectedContact.contactName}</div>
                <div className="text-[10px] text-text-muted">{selectedContact.phoneNumber}</div>
              </div>
              {selectedContact.lastMessage.orderId && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-[10px] text-blue-400">
                  <ShoppingBag size={10} />
                  Order #{selectedContact.lastMessage.orderId}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                      'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      msg.direction === 'outbound'
                        ? 'bg-emerald-500 text-white rounded-br-md'
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
                          {msg.status === 'received' && <Check size={10} className="text-emerald-400" />}
                          {msg.status === 'failed' && <AlertTriangle size={10} />}
                        </span>
                      )}
                    </div>
                    {msg.orderId && (
                      <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-blue-300">
                        <ShoppingBag size={10} />
                        Order #{msg.orderId}
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
                  placeholder="Type a WhatsApp message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className={cn(
                    'p-2.5 rounded-xl transition-colors',
                    inputText.trim()
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
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
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-emerald-400/60" />
            </div>
            <h3 className="text-lg font-semibold mb-1">WhatsApp Messages</h3>
            <p className="text-sm text-text-muted max-w-xs">
              Select a contact from the left to view and send WhatsApp messages.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function toCamel(row: Record<string, unknown>): WhatsAppMessage {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    phoneNumber: row.phone_number as string,
    contactName: row.contact_name as string | undefined,
    direction: row.direction as 'inbound' | 'outbound',
    messageBody: row.message_body as string,
    status: row.status as WhatsAppMessage['status'],
    metaWaId: row.meta_wa_id as string | undefined,
    orderId: row.order_id as string | undefined,
    createdAt: (row.timestamp || row.created_at) as string,
    updatedAt: (row.timestamp || row.updated_at) as string,
  }
}
