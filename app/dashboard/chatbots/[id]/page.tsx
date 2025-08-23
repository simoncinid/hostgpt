'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageSquare, Users, ExternalLink, Edit, BarChart3, Loader2 } from 'lucide-react'
import { chatbots as chatbotsApi } from '@/lib/api'
import { useChatbotStore, useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'
import ConversationItem from '@/app/components/ConversationItem'

interface ConversationPreview {
  id: number
  guest_name: string
  started_at: string
  message_count: number
  last_message?: { content: string } | null
}

export default function ChatbotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const { currentChatbot, setCurrentChatbot } = useChatbotStore()
  const { logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [botRes, convRes, anRes] = await Promise.all([
          chatbotsApi.get(id),
          chatbotsApi.getConversations(id),
          chatbotsApi.getAnalytics(id),
        ])
        setCurrentChatbot(botRes.data)
        setConversations(convRes.data)
        setAnalytics(anRes.data)
      } catch (e: any) {
        toast.error(e.response?.data?.detail || 'Errore nel caricamento')
        router.replace('/dashboard/chatbots')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Caricamento...
      </div>
    )
  }

  if (!currentChatbot) return null

  const chatUrl = typeof window !== 'undefined' && currentChatbot?.uuid
    ? `${window.location.origin}/chat/${currentChatbot.uuid}`
    : currentChatbot.chat_url

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath={`/dashboard/chatbots/${id}`} onLogout={handleLogout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content Wrapper */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {/* Header - Full width su mobile, con padding su desktop */}
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                              <h1 className="text-xl font-semibold flex-1 min-w-0">{currentChatbot.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/chatbots/${currentChatbot.id}/edit`} className="p-2 hover:bg-gray-100 rounded-lg" title="Modifica">
                <Edit className="w-5 h-5" />
              </Link>
              <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg" title="Apri Chat">
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Content con padding solo su desktop */}
        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              <div className="stats-card p-3 md:p-6">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <MessageSquare className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                  <span className="text-lg md:text-3xl font-bold">{currentChatbot.total_messages}</span>
                </div>
                <p className="text-gray-600 text-xs md:text-base">Messaggi</p>
              </div>
              <div className="stats-card p-3 md:p-6">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <Users className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                  <span className="text-lg md:text-3xl font-bold">{currentChatbot.total_conversations}</span>
                </div>
                <p className="text-gray-600 text-xs md:text-base">Conversazioni</p>
              </div>
              <div className="stats-card p-3 md:p-6">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <BarChart3 className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                  <span className="text-lg md:text-3xl font-bold">{Math.round((analytics?.avg_messages_per_conversation || 0) * 10) / 10}</span>
                </div>
                <p className="text-gray-600 text-xs md:text-base">Media per chat</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Anteprima & Azioni</h2>
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Scarica QR Code">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${currentChatbot.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{currentChatbot.is_active ? 'Attivo' : 'Inattivo'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => window.open(chatUrl, '_blank')} title="Apri Chat">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <Link href={`/dashboard/chatbots/${currentChatbot.id}/edit`} className="p-2 hover:bg-gray-100 rounded-lg" title="Modifica">
                        <Edit className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1">URL Chat</p>
                    <div className="flex items-center gap-2 bg-white border rounded-lg p-2">
                      <input readOnly value={chatUrl} className="flex-1 bg-transparent text-sm"/>
                      <button onClick={() => { if (chatUrl) { navigator.clipboard.writeText(chatUrl); toast.success('Copiato!') } }} className="text-primary hover:text-secondary">Copia</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Andamento Ultimi 30gg</h2>
                </div>
                {!analytics ? (
                  <p className="text-gray-500">Nessun dato disponibile</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Conversazioni</span>
                      <span className="font-semibold">{analytics.conversations_30d}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Messaggi</span>
                      <span className="font-semibold">{analytics.messages_30d}</span>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500">Dettaglio giornaliero</p>
                      <div className="max-h-56 overflow-y-auto mt-2 divide-y text-sm">
                        {analytics.daily_stats.map((d: any) => (
                          <div key={d.date} className="py-2 flex items-center justify-between">
                            <span className="text-gray-600">{d.date}</span>
                            <span className="font-medium">{d.conversations}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Conversazioni</h2>
                <Link href={`/dashboard/conversations?chatbot=${currentChatbot.id}`} className="text-primary hover:text-secondary">Vedi tutte →</Link>
              </div>
              {conversations.length === 0 ? (
                <p className="text-gray-500">Ancora nessuna conversazione</p>
              ) : (
                <div className="divide-y">
                  {conversations.slice(0, 10).map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


