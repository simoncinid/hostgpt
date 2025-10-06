'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageSquare, Users, QrCode, ExternalLink, Edit, Trash2, Eye, ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { useAuthStore, useChatbotStore } from '@/lib/store'
import { useAuthInit } from '@/lib/useAuthInit'
import { useLanguage } from '@/lib/languageContext'
import { chatbots as chatbotsApi, auth } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'
import ChatbotIcon from '@/app/components/ChatbotIcon'
import CollaboratorInviteModal from '@/app/components/CollaboratorInviteModal'

export default function ChatbotsListPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { chatbots, limits, setChatbots, setLimits, deleteChatbot } = useChatbotStore()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [currentQR, setCurrentQR] = useState<{ url: string; qr: string } | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false)
  const [selectedChatbotForInvite, setSelectedChatbotForInvite] = useState<{id: number, name: string} | null>(null)
  
  // Inizializza automaticamente l'autenticazione
  const { isHydrated } = useAuthInit()

  useEffect(() => {
    const bootstrap = async () => {
      // Aspetta che lo store sia pronto e l'utente sia autenticato
      if (!isHydrated || !isAuthenticated) return
      try {
        const me = await auth.me()
        if (!['active', 'cancelling', 'free_trial'].includes(me.data?.subscription_status)) {
          router.replace('/checkout')
          return
        }
      } catch {}
      await loadChatbots()
    }
    bootstrap()
  }, [isHydrated, isAuthenticated])

  const loadChatbots = async () => {
    try {
      const response = await chatbotsApi.list()
      // Gestisce sia il formato vecchio che nuovo
      if (response.data.chatbots) {
        // Nuovo formato con limiti
        setChatbots(response.data.chatbots)
        setLimits(response.data.limits)
      } else {
        // Formato vecchio (array diretto)
        setChatbots(response.data)
        setLimits(null)
      }
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

  const handleInviteCollaborators = (bot: any) => {
    setSelectedChatbotForInvite({ id: bot.id, name: bot.name })
    setShowCollaboratorModal(true)
  }

  const handleInviteSent = () => {
    // Ricarica i chatbot per aggiornare eventuali informazioni sui collaboratori
    loadChatbots()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/chatbots" onLogout={handleLogout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content Wrapper */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{t.chatbots.title}</h1>
            {/* Mostra sempre il pulsante, ma lo disabilita se il limite è raggiunto */}
            {chatbots.length === 0 ? (
              <Link href="/dashboard/chatbots/create" className="btn-primary">{t.chatbots.createFirst}</Link>
            ) : limits?.can_create_new ? (
              <Link href="/dashboard/chatbots/create" className="btn-primary">{t.chatbots.createNew}</Link>
            ) : (
              <button 
                disabled 
                className="btn-primary opacity-50 cursor-not-allowed"
                title={`${t.chatbots.limitReached} (${limits?.current_count}/${limits?.max_allowed})`}
              >
                {t.chatbots.createNew}
              </button>
            )}
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
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base md:text-lg">{bot.name}</h3>
                          {bot.user_role === 'collaborator' && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                              Collaboratore
                            </span>
                          )}
                        </div>
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
                      {bot.is_owner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInviteCollaborators(bot)
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Invita Collaboratori"
                        >
                          <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      )}
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
                      {bot.is_owner && (
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
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showQRModal && currentQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full mx-4 md:h-[80vh] md:overflow-y-auto">
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">QR Code Chatbot</h3>
              <div className="bg-gray-100 p-2 md:p-3 rounded-lg mb-2 md:mb-3">
                <img src={`data:image/png;base64,${currentQR.qr}`} alt="QR Code" className="w-full h-auto max-h-[180px] md:max-h-[200px] object-contain" />
              </div>
              <div className="flex items-center gap-1 md:gap-2 p-1 md:p-2 bg-gray-100 rounded-lg mb-2 md:mb-3">
                <input type="text" value={currentQR.url} readOnly className="flex-1 bg-transparent text-xs md:text-sm" />
                <button onClick={() => { navigator.clipboard.writeText(currentQR.url); toast.success('Link copiato!') }} className="text-primary hover:text-secondary text-xs md:text-sm">Copia</button>
              </div>
              <div className="flex gap-1 md:gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.download = 'qr-code-chatbot.png'
                    link.href = `data:image/png;base64,${currentQR.qr}`
                    link.click()
                    toast.success('QR Code scaricato!')
                  }}
                  className="flex-1 btn-secondary text-xs md:text-sm py-1 md:py-2"
                >
                  Scarica QR
                </button>
                <button onClick={() => setShowQRModal(false)} className="flex-1 btn-primary text-xs md:text-sm py-1 md:py-2">Chiudi</button>
              </div>
            </motion.div>
                      </div>
          )}

          {/* Collaborator Invite Modal */}
          {showCollaboratorModal && selectedChatbotForInvite && (
            <CollaboratorInviteModal
              isOpen={showCollaboratorModal}
              onClose={() => {
                setShowCollaboratorModal(false)
                setSelectedChatbotForInvite(null)
              }}
              chatbotId={selectedChatbotForInvite.id}
              chatbotName={selectedChatbotForInvite.name}
              onInviteSent={handleInviteSent}
            />
          )}
        </div>
      </div>
    </div>
  )
}


