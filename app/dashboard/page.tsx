'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  LogOut,
  Users,
  TrendingUp,
  Clock,
  QrCode,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { useAuthStore, useChatbotStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import { chatbots as chatbotsApi, subscription, auth } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'
import ChatbotIcon from '@/app/components/ChatbotIcon'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout, setAuth, setUser, isAuthenticated } = useAuthStore()
  const { chatbots, setChatbots, deleteChatbot } = useChatbotStore()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBot, setSelectedBot] = useState<number | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [currentQR, setCurrentQR] = useState<{ url: string; qr: string } | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)

  // Solo inizializzazione semplice; il checkout avviene su /checkout
  useEffect(() => {
    setIsInitializing(false)
  }, [])

  useEffect(() => {
    const enforceSubscription = async () => {
      if (isInitializing || isStartingCheckout) return
      if (!isAuthenticated) return
      try {
        const me = await auth.me()
        const status = me.data?.subscription_status
        
        // Controlla se arriviamo da un checkout riuscito
        const urlParams = new URLSearchParams(window.location.search)
        const subscriptionSuccess = urlParams.get('subscription') === 'success'
        const refresh = urlParams.get('refresh') === 'true'
        const sessionId = urlParams.get('session_id') || undefined
        
        // Se arriviamo da checkout riuscito, aggiorna i dati
        if (subscriptionSuccess || refresh) {
          try {
            if (sessionId) {
              const { subscription } = await import('@/lib/api')
              await subscription.confirm(sessionId)
            }
            // Ricarica i dati utente dopo la conferma
            const updatedMe = await auth.me()
            setUser(updatedMe.data)
            // Rimuovi i parametri dall'URL
            window.history.replaceState({}, document.title, window.location.pathname)
          } catch (error) {
            console.error('Error confirming subscription:', error)
          }
        }
        
        if (!['active', 'cancelling', 'free_trial'].includes(status)) {
          router.replace('/checkout')
          return
        }
        
        // Aggiorna sempre lo store con i dati più recenti
        setUser(me.data)
        loadChatbots()
      } catch {
        loadChatbots()
      }
    }
    enforceSubscription()
  }, [isInitializing, isStartingCheckout, isAuthenticated])

  const loadChatbots = async () => {
    try {
      const response = await chatbotsApi.list()
      setChatbots(response.data)
    } catch (error) {
      toast.error('Errore nel caricamento dei chatbot')
    } finally {
      setIsLoading(false)
    }
  }



  const handleDeleteBot = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo chatbot?')) return

    try {
      await chatbotsApi.delete(id)
      deleteChatbot(id)
      toast.success('Chatbot eliminato con successo')
    } catch (error) {
      toast.error('Errore nell\'eliminazione del chatbot')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const showQRCode = (url: string, qr: string) => {
    setCurrentQR({ url, qr })
    setShowQRModal(true)
  }

  // Calcola statistiche totali
  const totalStats = {
    totalBots: chatbots.length,
    totalConversations: chatbots.reduce((acc, bot) => acc + bot.total_conversations, 0),
    totalMessages: chatbots.reduce((acc, bot) => acc + bot.total_messages, 0),
    activeBots: chatbots.filter(bot => bot.is_active).length
  }

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard" onLogout={handleLogout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} p-4 md:p-8`}>
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-dark">
            {t.dashboard.title}
          </h1>
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center text-gray-600 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t.common.logout.toUpperCase()}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 md:grid-cols-4 md:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stats-card p-2 md:p-6"
          >
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <MessageSquare className="w-4 h-4 md:w-8 md:h-8 text-primary" />
              <span className="text-sm md:text-3xl font-bold">{totalStats.totalBots}</span>
            </div>
            <p className="text-gray-600 text-xs md:text-base">
              <span className="md:hidden">{t.dashboard.stats.totalChatbots}</span>
              <span className="hidden md:inline">{t.dashboard.stats.totalChatbots}</span>
            </p>
            <p className="text-xs md:text-sm text-green-600 mt-1">
              <span className="md:hidden">{totalStats.activeBots} {t.dashboard.stats.activeChatbots}</span>
              <span className="hidden md:inline">{totalStats.activeBots} {t.dashboard.stats.activeChatbots}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stats-card p-2 md:p-6"
          >
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <Users className="w-4 h-4 md:w-8 md:h-8 text-primary" />
              <span className="text-sm md:text-3xl font-bold">{totalStats.totalConversations}</span>
            </div>
            <p className="text-gray-600 text-xs md:text-base">
              <span className="md:hidden">{t.dashboard.stats.totalMessages}</span>
              <span className="hidden md:inline">{t.dashboard.stats.totalMessages}</span>
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              <span className="hidden md:inline">{t.dashboard.stats.totalHistorical}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stats-card p-2 md:p-6"
          >
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <TrendingUp className="w-4 h-4 md:w-8 md:h-8 text-primary" />
              <span className="text-sm md:text-3xl font-bold">{totalStats.totalMessages}</span>
            </div>
            <p className="text-gray-600 text-xs md:text-base">
              <span className="md:hidden">{t.dashboard.stats.totalMessages}</span>
              <span className="hidden md:inline">{t.dashboard.stats.totalMessages}</span>
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              <span className="hidden md:inline">{t.dashboard.stats.allChatbots}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="stats-card p-2 md:p-6"
          >
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <Clock className="w-4 h-4 md:w-8 md:h-8 text-primary" />
              <span className="text-sm md:text-3xl font-bold">
                <span className="md:hidden">24/7</span>
                <span className="hidden md:inline">24/7</span>
              </span>
            </div>
            <p className="text-gray-600 text-xs md:text-base">
              <span className="md:hidden">{t.common.support}</span>
              <span className="hidden md:inline">{t.common.support}</span>
            </p>
            <p className="text-xs md:text-sm text-green-600 mt-1">{t.dashboard.stats.alwaysOnline}</p>
          </motion.div>
        </div>

        {/* Free Trial Banner */}
        {user?.subscription_status === 'free_trial' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 md:p-6 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">🎉</span>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">{t.dashboard.freeTrial.title}</h3>
                  <p className="text-green-700 text-sm">
                    {t.dashboard.freeTrial.description
                      .replace('{messages}', user.messages_remaining.toString())
                      .replace('{limit}', user.messages_limit.toString())
                      .replace('{date}', user.free_trial_end_date ? new Date(user.free_trial_end_date).toLocaleDateString('it-IT') : '14 giorni')
                    }
                  </p>
                </div>
              </div>
              <Link
                href="/checkout"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
{t.dashboard.freeTrial.activateButton}
              </Link>
            </div>
          </motion.div>
        )}

        {/* Chatbots List */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl font-bold text-dark">{t.dashboard.chatbots.title}</h2>
            <Link 
              href="/dashboard/chatbots"
              className="text-primary hover:text-secondary"
            >
              {t.dashboard.chatbots.seeAll}
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : chatbots.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{t.dashboard.chatbots.noChatbots}</p>
              <Link href="/dashboard/chatbots/create" className="btn-primary">
                {t.dashboard.chatbots.createFirst}
              </Link>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {chatbots.slice(0, 5).map((bot) => (
                                 <motion.div
                   key={bot.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                   onClick={() => router.push(`/dashboard/chatbots/${bot.id}`)}
                 >
                   {/* Prima riga: Nome e Status */}
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center space-x-3">
                       <ChatbotIcon chatbotId={bot.id} chatbotUuid={bot.uuid} hasIcon={bot.has_icon} size="sm" />
                       <h3 className="font-semibold text-base md:text-lg">{bot.property_name}</h3>
                     </div>
                     {bot.is_active ? (
                       <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                         {t.chatbots.active}
                       </span>
                     ) : (
                       <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                         Inattivo
                       </span>
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
                       className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                       title="QR Code"
                     >
                       <QrCode className="w-4 h-4 md:w-5 md:h-5" />
                     </button>
                     <a
                       href={bot.chat_url}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={(e) => e.stopPropagation()}
                       className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                       title="Apri Chat"
                     >
                       <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                     </a>
                     <Link
                       href={`/dashboard/chatbots/${bot.id}`}
                       onClick={(e) => e.stopPropagation()}
                       className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                       title="Dettagli"
                     >
                       <Eye className="w-4 h-4 md:w-5 md:h-5" />
                     </Link>
                     <Link
                       href={`/dashboard/chatbots/${bot.id}/edit`}
                       onClick={(e) => e.stopPropagation()}
                       className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                       title="Modifica"
                     >
                       <Edit className="w-4 h-4 md:w-5 md:h-5" />
                     </Link>
                     <button
                       onClick={(e) => {
                         e.stopPropagation()
                         handleDeleteBot(bot.id)
                       }}
                       className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                       title="Elimina"
                     >
                       <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                     </button>
                   </div>
                 </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Box informativo: limite 1 chatbot + CTA WhatsApp */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 md:p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">{t.dashboard.moreStructures.title}</h2>
          <p className="mb-6 text-white/90">
            {t.dashboard.moreStructures.description}
          </p>
          <a
            href="https://wa.me/393391797616"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            <Plus className="w-5 h-5 mr-2" />
{t.dashboard.moreStructures.whatsappButton}
          </a>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && currentQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full md:scale-64"
          >
            <h3 className="text-xl font-bold mb-4">{t.dashboard.qrModal.title}</h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <img
                src={`data:image/png;base64,${currentQR.qr}`}
                alt="QR Code"
                className="w-full h-auto"
                id="qr-code-image"
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {t.dashboard.qrModal.description}
            </p>
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg mb-4">
              <input
                type="text"
                value={currentQR.url}
                readOnly
                className="flex-1 bg-transparent text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentQR.url)
                  toast.success('Link copiato!')
                }}
                className="text-primary hover:text-secondary"
              >
{t.dashboard.qrModal.copyButton}
              </button>
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
{t.dashboard.qrModal.downloadButton}
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 btn-primary"
              >
{t.dashboard.qrModal.closeButton}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Componente di fallback per il loading
function DashboardFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
        <p className="text-gray-600">Caricamento dashboard...</p>
      </div>
    </div>
  )
}

// Componente principale avvolto in Suspense
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  )
}
