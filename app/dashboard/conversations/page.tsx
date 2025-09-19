'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Loader2, MessageSquare, Users } from 'lucide-react'
import { chatbots as chatbotsApi, conversations as convApi } from '@/lib/api'
import { useChatbotStore, useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'
import ConversationItem from '@/app/components/ConversationItem'

interface ConversationItem {
  id: number
  guest_name: string
  started_at: string
  message_count: number
}

function ConversationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedBotIdQuery = searchParams.get('chatbot')
  const preselectedId = selectedBotIdQuery ? Number(selectedBotIdQuery) : null

  const { chatbots, setChatbots } = useChatbotStore()
  const { logout } = useAuthStore()
  const { t } = useLanguage()
  const [selectedBotId, setSelectedBotId] = useState<number | null>(preselectedId)
  const [items, setItems] = useState<ConversationItem[]>([])
  const [filter, setFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        if (chatbots.length === 0) {
          const list = await chatbotsApi.list()
          // Gestisce sia il formato vecchio che nuovo
          const bots = list.data.chatbots || list.data
          setChatbots(bots)
          if (!preselectedId && bots.length) setSelectedBotId(bots[0].id)
        }
      } catch {
        toast.error('Errore nel caricamento dei chatbot')
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadConversations = async () => {
      if (!selectedBotId) { setIsLoading(false); return }
      setIsLoading(true)
      try {
        const res = await chatbotsApi.getConversations(selectedBotId)
        setItems(res.data)
      } catch (e: any) {
        toast.error(e.response?.data?.detail || 'Errore nel caricamento delle conversazioni')
      } finally {
        setIsLoading(false)
      }
    }
    loadConversations()
  }, [selectedBotId])

  const filtered = useMemo(() => {
    const f = filter.toLowerCase()
    return items.filter(i => i.guest_name.toLowerCase().includes(f))
  }, [items, filter])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/conversations" onLogout={handleLogout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content Wrapper */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{t.conversations.title}</h1>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="label">{t.conversations.chatbot}</label>
                  <select
                    className="input-field"
                    value={selectedBotId ?? ''}
                    onChange={(e) => setSelectedBotId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">{t.conversations.selectOption}</option>
                    {chatbots.map((b) => (
                      <option key={b.id} value={b.id}>{b.property_name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">{t.conversations.searchGuest}</label>
                  <div className="relative">
                    <input className="input-field pl-10" placeholder={t.conversations.searchPlaceholder} value={filter} onChange={(e) => setFilter(e.target.value)} />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> {t.conversations.loading}
                </div>
              ) : !selectedBotId ? (
                <div className="p-6 text-gray-500">{t.conversations.selectChatbot}</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-gray-500">{t.conversations.noConversations}</div>
              ) : (
                <div className="divide-y">
                  {filtered.map((c) => (
                    <ConversationItem key={c.id} conversation={c} />
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

// Componente di fallback per il loading
function ConversationsFallback() {
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t.conversations.title}</h1>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-center py-12">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-gray-600">{t.conversations.loading}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principale avvolto in Suspense
export default function ConversationsPage() {
  return (
    <Suspense fallback={<ConversationsFallback />}>
      <ConversationsContent />
    </Suspense>
  )
}


