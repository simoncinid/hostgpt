'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, User, Bot } from 'lucide-react'
import { conversations as convApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ConversationPreview {
  id: number
  guest_name: string
  started_at: string
  message_count: number
  last_message?: { content: string } | null
}

interface ConversationItemProps {
  conversation: ConversationPreview
}

export default function ConversationItem({ conversation }: ConversationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const loadMessages = async () => {
    if (messages.length > 0) return // Already loaded
    
    setIsLoadingMessages(true)
    try {
      const response = await convApi.getMessages(conversation.id)
      setMessages(response.data)
    } catch (error) {
      toast.error('Errore nel caricamento dei messaggi')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleToggle = () => {
    if (!isExpanded) {
      loadMessages()
    }
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Header della conversazione */}
      <div 
        className="py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p className="font-medium text-gray-900">{conversation.guest_name}</p>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {conversation.message_count} messaggi
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {conversation.last_message?.content || '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(conversation.started_at).toLocaleString('it-IT')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Messaggi espansi */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-h-96 overflow-y-auto">
            {isLoadingMessages ? (
              <div className="p-4 text-center text-gray-500">
                Caricamento messaggi...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nessun messaggio disponibile
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {message.role === 'user' ? conversation.guest_name : 'Chatbot'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(message.timestamp).toLocaleString('it-IT')}
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
