'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Loader2, MessageSquare, Users } from 'lucide-react'
import { chatbots as chatbotsApi, conversations as convApi } from '@/lib/api'
import { useChatbotStore } from '@/lib/store'
import toast from 'react-hot-toast'

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
  const [selectedBotId, setSelectedBotId] = useState<number | null>(preselectedId)
  const [items, setItems] = useState<ConversationItem[]>([])
  const [filter, setFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (chatbots.length === 0) {
          const list = await chatbotsApi.list()
          setChatbots(list.data)
          if (!preselectedId && list.data.length) setSelectedBotId(list.data[0].id)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-600 hover:text-primary flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
          <h1 className="text-xl font-semibold">Conversazioni</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="label">Chatbot</label>
              <select
                className="input-field"
                value={selectedBotId ?? ''}
                onChange={(e) => setSelectedBotId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Seleziona...</option>
                {chatbots.map((b) => (
                  <option key={b.id} value={b.id}>{b.property_name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Cerca per ospite</label>
              <div className="relative">
                <input className="input-field pl-10" placeholder="Es. Marco" value={filter} onChange={(e) => setFilter(e.target.value)} />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Caricamento...
            </div>
          ) : !selectedBotId ? (
            <div className="p-6 text-gray-500">Seleziona un chatbot per vedere le conversazioni</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-gray-500">Nessuna conversazione trovata</div>
          ) : (
            <div className="divide-y">
              {filtered.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.guest_name}</p>
                    <p className="text-sm text-gray-500">{new Date(c.started_at).toLocaleString('it-IT')}</p>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" /> {c.message_count} messaggi
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente di fallback per il loading
function ConversationsFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-600 hover:text-primary flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
          <h1 className="text-xl font-semibold">Conversazioni</h1>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-center py-12">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento conversazioni...</p>
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


