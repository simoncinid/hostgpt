'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, User, Bot } from 'lucide-react'
import { conversations as convApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { useLanguage } from '@/lib/languageContext'
import MarkdownText from '@/app/components/MarkdownText'

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
  const { t } = useLanguage()
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
      toast.error(t.conversations.loading)
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
{conversation.message_count} {t.conversations.messages}
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

      {/* Messaggi espansi - Stile corretto */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-h-96 overflow-y-auto">
            {isLoadingMessages ? (
              <div className="p-4 text-center text-gray-500">
{t.conversations.loading}
              </div>
            ) : messages.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
{t.conversations.noMessages}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                                              className={`max-w-xs md:max-w-sm px-3 py-2 md:px-6 md:py-4 rounded-2xl shadow-lg ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                    >
                                             <div className="relative font-medium leading-relaxed text-sm md:text-base break-words">
                         <MarkdownText content={message.content} />
                       </div>
                                              <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                        }`}>
                        {new Date(message.timestamp).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
