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
import { chatbots as chatbotsApi, subscription, auth } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout, setAuth, isAuthenticated } = useAuthStore()
  const { chatbots, setChatbots, deleteChatbot } = useChatbotStore()
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
        const me = await subscriptionStatus()
        const status = me?.subscription_status
        // Se arriviamo da checkout riuscito, prova una conferma e ri-verifica
        const urlParams = new URLSearchParams(window.location.search)
        const subscriptionSuccess = urlParams.get('subscription') === 'success'
        const sessionId = urlParams.get('session_id') || undefined
        if (subscriptionSuccess) {
          try {
            const { subscription } = await import('@/lib/api')
            await subscription.confirm(sessionId)
          } catch {}
        }
        if (status !== 'active') {
          router.replace('/checkout')
          return
        }
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

  // helper per leggere lo stato abbonamento
  const subscriptionStatus = async (): Promise<{ subscription_status: string } | null> => {
    try {
      const me = await auth.me()
      return { subscription_status: me.data?.subscription_status }
    } catch {
      return null
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
            Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center text-gray-600 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5 mr-2" />
            ESCI
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stats-card"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold">{totalStats.totalBots}</span>
            </div>
            <p className="text-gray-600">Chatbot Totali</p>
            <p className="text-sm text-green-600 mt-1">
              {totalStats.activeBots} attivi
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stats-card"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold">{totalStats.totalConversations}</span>
            </div>
            <p className="text-gray-600">Conversazioni</p>
            <p className="text-sm text-gray-500 mt-1">Totale storico</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stats-card"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold">{totalStats.totalMessages}</span>
            </div>
            <p className="text-gray-600">Messaggi Totali</p>
            <p className="text-sm text-gray-500 mt-1">Tutti i chatbot</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="stats-card"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold">24/7</span>
            </div>
            <p className="text-gray-600">Disponibilità</p>
            <p className="text-sm text-green-600 mt-1">Sempre online</p>
          </motion.div>
        </div>

        {/* Box informativo: limite 1 chatbot + CTA WhatsApp */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 md:p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Hai più strutture?</h2>
          <p className="mb-6 text-white/90">
            Ogni account può avere un solo chatbot. Se ti servono più chatbot perché gestisci più strutture, contattami al <strong>3391797616</strong>.
          </p>
          <a
            href="https://wa.me/393391797616"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Scrivimi su WhatsApp
          </a>
        </div>

        {/* Chatbots List */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl font-bold text-dark">I Tuoi Chatbot</h2>
            <Link 
              href="/dashboard/chatbots"
              className="text-primary hover:text-secondary"
            >
              Vedi tutti →
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : chatbots.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Non hai ancora creato nessun chatbot</p>
              <Link href="/dashboard/chatbots/create" className="btn-primary">
                Crea il tuo primo chatbot
              </Link>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {chatbots.slice(0, 5).map((bot) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/dashboard/chatbots/${bot.id}`)}
                    >
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="font-semibold text-lg">{bot.property_name}</h3>
                        {bot.is_active ? (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                            Attivo
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            Inattivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{bot.property_city}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {bot.total_conversations} conversazioni
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {bot.total_messages} messaggi
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => showQRCode(bot.chat_url, bot.qr_code)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="QR Code"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                      <a
                        href={bot.chat_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Apri Chat"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      <Link
                        href={`/dashboard/chatbots/${bot.id}`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Dettagli"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <Link
                        href={`/dashboard/chatbots/${bot.id}/edit`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Modifica"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteBot(bot.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Elimina"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && currentQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">QR Code Chatbot</h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <img
                src={`data:image/png;base64,${currentQR.qr}`}
                alt="QR Code"
                className="w-full h-auto"
                id="qr-code-image"
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Scansiona questo QR code per accedere al chatbot
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
                Copia
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
                Scarica QR
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 btn-primary"
              >
                Chiudi
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
