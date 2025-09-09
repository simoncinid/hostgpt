'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageSquare, Users, QrCode, ExternalLink, Edit, Trash2, Eye, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuthStore, useChatbotStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import { chatbots as chatbotsApi, auth } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'
import ChatbotIcon from '@/app/components/ChatbotIcon'

export default function ChatbotsListPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { chatbots, setChatbots, deleteChatbot } = useChatbotStore()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [currentQR, setCurrentQR] = useState<{ url: string; qr: string } | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const bootstrap = async () => {
      if (!isAuthenticated) return
      try {
        const me = await auth.me()
        if (!['active', 'cancelling'].includes(me.data?.subscription_status)) {
          router.replace('/checkout')
          return
        }
      } catch {}
      await loadChatbots()
    }
    bootstrap()
  }, [isAuthenticated])

  const loadChatbots = async () => {
    try {
      const response = await chatbotsApi.list()
      setChatbots(response.data)
    } catch {
      toast.error('Errore nel caricamento dei chatbot')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo chatbot?')) return
    try {
      await chatbotsApi.delete(id)
      deleteChatbot(id)
      toast.success('Chatbot eliminato')
    } catch {
      toast.error('Errore durante l\'eliminazione')
    }
  }

  const showQRCode = (url: string, qr: string) => {
    setCurrentQR({ url, qr })
    setShowQRModal(true)
  }

  const handleLogout = () => {
    // Implementazione logout se necessario
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/chatbots" onLogout={handleLogout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content Wrapper */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{t.chatbots.title}</h1>
            {/* Nasconde il pulsante Crea se esiste già un chatbot */}
            {chatbots.length === 0 ? (
              <Link href="/dashboard/chatbots/create" className="btn-primary">{t.chatbots.create.title}</Link>
            ) : null}
          </div>
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Caricamento...
            </div>
          ) : chatbots.length === 0 ? (
            <div className="text-center bg-white rounded-2xl shadow p-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{t.chatbots.noChatbots}</p>
              <Link href="/dashboard/chatbots/create" className="btn-primary">{t.chatbots.createFirst}</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow">
              <div className="divide-y">
                {chatbots.map((bot) => (
                  <motion.div
                    key={bot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => router.push(`/dashboard/chatbots/${bot.id}`)}
                  >
                    {/* Prima riga: Nome e Status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <ChatbotIcon chatbotId={bot.id} chatbotUuid={bot.uuid} hasIcon={bot.has_icon} size="sm" />
                        <h3 className="font-semibold text-base md:text-lg">{bot.name}</h3>
                      </div>
                      {bot.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{t.chatbots.active}</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inattivo</span>
                      )}
                    </div>
                    
                    {/* Seconda riga: Luogo */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">{bot.property_city}</p>
                      <div></div>
                    </div>
                    
                    {/* Terza riga: Statistiche */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center text-xs md:text-sm text-gray-600">
                        <Users className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        {bot.total_conversations} {t.chatbots.conversations}
                      </span>
                      <span className="flex items-center text-xs md:text-sm text-gray-600">
                        <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        {bot.total_messages} {t.chatbots.messages}
                      </span>
                    </div>
                    
                    {/* Quarta riga: Icone */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          showQRCode(bot.chat_url, bot.qr_code)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="QR Code"
                      >
                        <QrCode className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                      </button>
                      <a
                        href={bot.chat_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Apri Chat"
                      >
                        <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                      </a>
                      <Link
                        href={`/dashboard/chatbots/${bot.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Dettagli"
                      >
                        <Eye className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                      </Link>
                      <Link
                        href={`/dashboard/chatbots/${bot.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Modifica"
                      >
                        <Edit className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(bot.id)
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showQRModal && currentQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 md:scale-80">
              <h3 className="text-xl font-bold mb-4">QR Code Chatbot</h3>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <img src={`data:image/png;base64,${currentQR.qr}`} alt="QR Code" className="w-full h-auto" />
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg mb-4">
                <input type="text" value={currentQR.url} readOnly className="flex-1 bg-transparent text-sm" />
                <button onClick={() => { navigator.clipboard.writeText(currentQR.url); toast.success('Link copiato!') }} className="text-primary hover:text-secondary">Copia</button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.download = 'qr-code-chatbot.png'
                    link.href = `data:image/png;base64,${currentQR.qr}`
                    link.click()
                    toast.success('QR Code scaricato!')
                  }}
                  className="flex-1 btn-secondary"
                >
                  Scarica QR
                </button>
                <button onClick={() => setShowQRModal(false)} className="flex-1 btn-primary">Chiudi</button>
              </div>
            </motion.div>
                      </div>
          )}
        </div>
      </div>
    </div>
  )
}


