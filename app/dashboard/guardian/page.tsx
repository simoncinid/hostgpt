'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  Zap,
  LogOut,
  Play,
  Target,
  Heart,
  Lightbulb,
  CreditCard,
  Loader2
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'
import { guardian } from '@/lib/api'
import { useLanguage } from '@/lib/languageContext'

interface GuardianStatus {
  guardian_subscription_status: string
  guardian_subscription_end_date: string | null
  is_active: boolean
}

interface GuardianStats {
  total_guests: number
  high_risk_guests: number
  resolved_issues: number
  avg_satisfaction: number
  negative_reviews_prevented: number
}

interface GuardianAlert {
  id: number
  guest_id: string
  alert_type: string
  severity: string
  message: string
  suggested_action: string
  created_at: string
  conversation: Array<{
    role: string
    content: string
    timestamp: string
  }>
}

function GuardianContent() {
  const router = useRouter()
  const { user, logout, setUser } = useAuthStore()
  const { t } = useLanguage()
  const [guardianStatus, setGuardianStatus] = useState<GuardianStatus | null>(null)
  const [guardianStats, setGuardianStats] = useState<GuardianStats | null>(null)
  const [alerts, setAlerts] = useState<GuardianAlert[]>([])
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  
  // Controlla se c'è un parametro di successo nell'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const subscription = urlParams.get('subscription')
    const refresh = urlParams.get('refresh') === 'true'
    const sessionId = urlParams.get('session_id')
    
    if ((subscription === 'success' || refresh) && sessionId) {
      // Conferma la sottoscrizione
      confirmGuardianSubscription(sessionId)
    } else if (refresh) {
      // Solo refresh senza sessionId (caso del checkout personalizzato)
      fetchGuardianStatus()
      // Rimuovi i parametri dall'URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchGuardianStatus()
    }
  }, [user])

  const fetchGuardianStatus = async () => {
    try {
      const response = await guardian.getStatus()
      const status = response.data
      setGuardianStatus(status)
      
      // Aggiorna completamente lo stato utente dal server
      try {
        const auth = (await import('@/lib/api')).auth
        const me = await auth.me()
        setUser(me.data)
      } catch (error) {
        console.error('Error updating user data:', error)
      }
      
      if (status.is_active) {
        fetchGuardianData()
      }
    } catch (error) {
      console.error('Error fetching guardian status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGuardianData = async () => {
    try {
      console.log('Fetching guardian data...')
      
      // Fetch statistics
      const statsResponse = await guardian.getStatistics()
      setGuardianStats(statsResponse.data)
      console.log('Stats aggiornate:', statsResponse.data)

      // Fetch alerts
      const alertsResponse = await guardian.getAlerts()
      console.log('Alert ricevuti dal server:', alertsResponse.data)
      setAlerts(alertsResponse.data)
    } catch (error) {
      console.error('Error fetching guardian data:', error)
    }
  }

  const confirmGuardianSubscription = async (sessionId: string) => {
    try {
      // Rimuovi i parametri dall'URL
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Ricarica i dati Guardian
      await fetchGuardianStatus()
      
      // Mostra messaggio di successo
      toast.success(t.guardian.success.subscriptionActivated)
    } catch (error) {
      console.error('Error confirming guardian subscription:', error)
    }
  }

  const handleSubscribe = async () => {
    setIsCheckoutLoading(true)
    try {
      const response = await guardian.createCheckout()
      
      // Se la risposta indica riattivazione, gestiscila
      if (response.data.status === 'reactivated') {
        toast.success(response.data.message)
        await fetchGuardianStatus()
        return
      }
      
      // Se è un checkout combinato, reindirizza al checkout combinato personalizzato
      if (response.data.is_combined) {
        toast.success('Reindirizzamento al checkout per HostGPT + Guardian...')
        router.push('/checkout/combined')
        return
      }
      
      // Se abbiamo un client_secret, reindirizza al checkout Guardian personalizzato
      if (response.data.client_secret) {
        router.push('/checkout/guardian')
      } else if (response.data.checkout_url) {
        // Fallback per checkout Stripe tradizionale
        window.location.href = response.data.checkout_url
      } else {
        throw new Error('URL di checkout non ricevuto')
      }
    } catch (error: any) {
      console.error('Error subscribing to guardian:', error)
      const errorMessage = error.response?.data?.detail || t.guardian.errors.subscriptionError
      toast.error(errorMessage)
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  const handleResolveAlert = async (alertId: number) => {
    try {
      console.log('Risolvendo alert:', alertId)
      await guardian.resolveAlert(alertId)
      
      // Remove alert from list immediately for better UX
      setAlerts(alerts.filter(alert => alert.id !== alertId))
      
      // Refresh data from server to ensure consistency
      console.log('Aggiornando dati dal server...')
      await fetchGuardianData()
      
      toast.success(t.guardian.success.alertResolved)
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error(t.guardian.errors.alertResolutionError)
    }
  }

  const handleCancelGuardian = async () => {
    setShowCancelModal(false)
    setIsCancellingSubscription(true)
    try {
      const response = await guardian.cancel()
      toast.success(response.data.message)
      // Ricarica lo stato e aggiorna lo store
      await fetchGuardianStatus()
    } catch (error: any) {
      console.error('Error cancelling guardian subscription:', error)
      toast.error(error.response?.data?.detail || t.guardian.errors.cancellationError)
    } finally {
      setIsCancellingSubscription(false)
    }
  }

  const handleReactivateGuardian = async () => {
    try {
      const response = await guardian.reactivate()
      toast.success(response.data.message)
      // Ricarica lo stato e aggiorna lo store
      await fetchGuardianStatus()
    } catch (error: any) {
      console.error('Error reactivating guardian subscription:', error)
      toast.error(error.response?.data?.detail || t.guardian.errors.reactivationError)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />
      case 'high': return <AlertTriangle className="w-5 h-5" />
      case 'medium': return <AlertTriangle className="w-5 h-5" />
      case 'low': return <CheckCircle className="w-5 h-5" />
      default: return <CheckCircle className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
        <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
        <p className="text-gray-600">{t.guardian.loading}</p>
      </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/guardian" onLogout={handleLogout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content Wrapper */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold">{t.guardian.title}</h1>
            </div>
          </div>
        </div>

                <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Se non abbonato, mostra animazione (ma non se è in cancellazione) */}
            {!guardianStatus?.is_active ? (
              <div className="max-w-4xl mx-auto">
                {/* Animazione esempio */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 mb-8">
                  <div className="bg-white rounded-xl p-6 relative overflow-hidden">
                    <div className="text-left min-h-[280px]">
                      {/* Fase 1: Chat normale con messaggi che arrivano uno per volta (0-6s) */}
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }}
                        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
                        className="space-y-4"
                      >
                        {/* Messaggio 1 - User (0-1s) */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }}
                          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
                          className="flex items-start justify-end"
                        >
                          <div className="flex items-start max-w-[70%] flex-row-reverse">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-rose-500 to-pink-600 text-white ml-3">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="rounded-2xl px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-sm">
                              <p className="whitespace-pre-wrap">{t.guardian.demo.messages.guest}</p>
                              <p className="text-xs mt-1 text-white/70">{t.guardian.demo.messages.time}</p>
                            </div>
                          </div>
                        </motion.div>
                        
                        {/* Messaggio 2 - Assistant (1-2s) */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }}
                          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
                          className="flex items-start justify-start"
                        >
                          <div className="flex items-start max-w-[70%]">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 text-gray-600 mr-3">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="rounded-2xl px-4 py-3 bg-gray-100 text-gray-900 rounded-bl-sm">
                              <p className="whitespace-pre-wrap">{t.guardian.demo.messages.assistant}</p>
                              <p className="text-xs mt-1 text-gray-400">14:33</p>
                            </div>
                          </div>
                        </motion.div>
                        
                        {/* Messaggio 3 - User frustrato (2-3s) */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }}
                          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
                          className="flex items-start justify-end"
                        >
                          <div className="flex items-start max-w-[70%] flex-row-reverse">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-rose-500 to-pink-600 text-white ml-3">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="rounded-2xl px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-sm">
                              <p className="whitespace-pre-wrap">{t.guardian.demo.messages.guestFrustrated}</p>
                              <p className="text-xs mt-1 text-white/70">14:34</p>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                      
                      {/* Fase 2: Alert Critico (7-12s) */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                          scale: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 1, 1, 1, 1, 1, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8]
                        }}
                        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center z-10"
                      >
                        <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white px-10 py-8 rounded-3xl shadow-2xl flex items-center space-x-6 animate-pulse border-4 border-red-300 transform rotate-1">
                          <div className="relative">
                            <div className="absolute inset-0 bg-red-400 rounded-full blur-lg opacity-50 animate-ping"></div>
                            <AlertTriangle className="w-10 h-10 relative z-10" />
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-black tracking-wider">{t.guardian.demo.alert.title}</p>
                            <p className="text-lg font-semibold mt-1">{t.guardian.demo.alert.subtitle}</p>
                            <div className="flex space-x-2 mt-3 justify-center">
                              <div className="w-2 h-2 bg-red-300 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-red-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-red-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* Fase 3: Telefono Host (13-20s) */}
                      <motion.div
                        initial={{ opacity: 0, x: -100, scale: 0.8 }}
                        animate={{ 
                          opacity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                          x: [-100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, -100, 0, 0, 0, 0, 0, 0, 0, 0, -100, -100, -100],
                          scale: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 1, 1, 1, 1, 1, 1, 1, 1, 0.8, 0.8, 0.8]
                        }}
                        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center z-10"
                      >
                        <div className="bg-gradient-to-br from-white via-green-50 to-emerald-50 rounded-3xl p-8 shadow-2xl max-w-lg border-4 border-green-200 transform -rotate-1">
                          <div className="flex items-center space-x-6">
                            <div className="relative">
                              <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                              <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-full flex items-center justify-center relative z-10 shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-xl font-black text-gray-800">{t.guardian.demo.phoneCall}</p>
                              </div>
                              <div className="bg-white rounded-2xl p-4 shadow-inner border-l-4 border-green-500">
                                <p className="text-gray-700 italic">"Mi scusi per il problema! Le mando subito il tecnico e le offro uno sconto del 20% sul soggiorno"</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* Fase 4: Problema Risolto (21-24s) */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
                          scale: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 1, 1, 0.8]
                        }}
                        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center z-10"
                      >
                        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 text-white px-12 py-10 rounded-3xl shadow-2xl flex items-center space-x-6 border-4 border-green-300 transform rotate-1">
                          <div className="relative">
                            <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-50 animate-ping"></div>
                            <CheckCircle className="w-12 h-12 relative z-10" />
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-black tracking-wider">{t.guardian.demo.problemSolved}</p>
                            <p className="text-xl font-semibold mt-2">{t.guardian.demo.negativeReviewAvoided}</p>
                            <div className="flex space-x-3 mt-4 justify-center">
                              <div className="w-3 h-3 bg-green-300 rounded-full animate-bounce"></div>
                              <div className="w-3 h-3 bg-green-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-3 h-3 bg-green-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              <div className="w-3 h-3 bg-green-300 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="text-center">
                  <button
                    onClick={handleSubscribe}
                    disabled={isCheckoutLoading}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckoutLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t.guardian.redirecting}</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        <span>
                          {guardianStatus?.guardian_subscription_status === 'cancelling' 
                            ? t.guardian.reactivate 
                            : t.guardian.activateWithPrice
                          }
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Se abbonato, mostra dashboard */
              <div className="space-y-6">
                {/* Statistiche */}
                {guardianStats && (
                  <div className="grid grid-cols-4 gap-2 md:grid-cols-4 md:gap-6 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="stats-card p-2 md:p-6"
                    >
                      <div className="flex items-center justify-between mb-1 md:mb-2">
                        <Users className="w-4 h-4 md:w-8 md:h-8 text-primary" />
                        <span className="text-sm md:text-3xl font-bold">{guardianStats.total_guests}</span>
                      </div>
                      <p className="text-gray-600 text-xs md:text-base">
                        <span className="md:hidden">{t.guardian.stats.totalGuestsShort}</span>
                        <span className="hidden md:inline">{t.guardian.stats.totalGuests}</span>
                      </p>
                      <p className="text-xs md:text-sm text-green-600 mt-1">
                        <span className="md:hidden">{t.guardian.stats.monitored}</span>
                        <span className="hidden md:inline">{t.guardian.stats.monitored}</span>
                      </p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="stats-card p-2 md:p-6"
                    >
                      <div className="flex items-center justify-between mb-1 md:mb-2">
                        <AlertTriangle className="w-4 h-4 md:w-8 md:h-8 text-red-500" />
                        <span className="text-sm md:text-3xl font-bold text-red-600">{guardianStats.high_risk_guests}</span>
                      </div>
                      <p className="text-gray-600 text-xs md:text-base">
                        <span className="md:hidden">{t.guardian.stats.highRiskGuestsShort}</span>
                        <span className="hidden md:inline">{t.guardian.stats.highRiskGuests}</span>
                      </p>
                      <p className="text-xs md:text-sm text-red-600 mt-1">
                        <span className="md:hidden">{t.guardian.stats.detected}</span>
                        <span className="hidden md:inline">{t.guardian.stats.detected}</span>
                      </p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="stats-card p-2 md:p-6"
                    >
                      <div className="flex items-center justify-between mb-1 md:mb-2">
                        <CheckCircle className="w-4 h-4 md:w-8 md:h-8 text-green-500" />
                        <span className="text-sm md:text-3xl font-bold text-green-600">{guardianStats.resolved_issues}</span>
                      </div>
                      <p className="text-gray-600 text-xs md:text-base">
                        <span className="md:hidden">{t.guardian.stats.resolvedIssuesShort}</span>
                        <span className="hidden md:inline">{t.guardian.stats.resolvedIssues}</span>
                      </p>
                      <p className="text-xs md:text-sm text-green-600 mt-1">
                        <span className="md:hidden">{t.guardian.stats.managed}</span>
                        <span className="hidden md:inline">{t.guardian.stats.managed}</span>
                      </p>
                    </motion.div>
                    
                  </div>
                )}

                {/* Alert Attivi */}
                <div className="bg-white rounded-2xl shadow-lg">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-dark flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span>{t.guardian.alerts.activeAlerts} ({alerts.length})</span>
                    </h2>
                  </div>
                 
                  <div className="p-6">
                    {alerts.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="text-gray-600">{t.guardian.alerts.allUnderControl}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {alerts.map((alert) => (
                          <div key={alert.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div 
                              className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  <div className="flex-shrink-0 mt-1">
                                    {getSeverityIcon(alert.severity)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h3 className="font-semibold text-gray-900">{t.guardian.alerts.guest} #{alert.guest_id}</h3>
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                        {alert.severity.toUpperCase()}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{alert.message}</p>
                                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                      <span>{t.guardian.alerts.created}: {new Date(alert.created_at).toLocaleString('it-IT')}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 ml-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleResolveAlert(alert.id)
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                  >
{t.guardian.alerts.resolve}
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {expandedAlert === alert.id && (
                              <div className="border-t bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                  <MessageSquare className="w-4 h-4 mr-2" />
{t.guardian.alerts.fullConversation}
                                </h4>
                                <div className="space-y-4 max-h-80 overflow-y-auto bg-white rounded-lg p-4 border">
                                  {alert.conversation.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-xs p-4 rounded-2xl shadow-sm ${
                                        msg.role === 'user' 
                                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                                      }`}>
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                        <p className={`text-xs mt-2 ${
                                          msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                          {new Date(msg.timestamp).toLocaleTimeString('it-IT')}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                  <div className="flex items-start space-x-3">
                                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-sm font-semibold text-blue-800 mb-1">{t.guardian.alerts.resolutionSuggestion}</p>
                                      <p className="text-sm text-blue-700 leading-relaxed">{alert.suggested_action}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gestione Abbonamento - Stile come in settings */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t.guardian.subscription.title}</h2>
                    <CreditCard className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t.guardian.subscription.status}: <span className={
                          guardianStatus?.guardian_subscription_status === 'active' ? 'text-green-600' : 
                          guardianStatus?.guardian_subscription_status === 'cancelling' ? 'text-orange-600' : 
                          'text-red-600'
                        }>{guardianStatus?.guardian_subscription_status || 'inactive'}</span></p>
                        {guardianStatus?.guardian_subscription_end_date && (
                          <p className="text-sm text-gray-500">
                            {guardianStatus?.guardian_subscription_status === 'cancelling' ? t.guardian.subscription.endDate + ': ' : t.guardian.subscription.nextRenewal + ': '}
                            {new Date(guardianStatus.guardian_subscription_end_date).toLocaleDateString('it-IT')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {guardianStatus?.guardian_subscription_status === 'active' && (
                      <div className="border-t pt-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-medium text-red-800 mb-1">{t.guardian.subscription.cancelSection.title}</h3>
                              <p className="text-sm text-red-700 mb-3">
                                {t.guardian.subscription.cancelSection.description}
                              </p>
                              <button 
                                onClick={() => setShowCancelModal(true)} 
                                disabled={isCancellingSubscription}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                              >
                                {isCancellingSubscription ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
{t.guardian.subscription.cancelSection.cancelling}
                                  </>
                                ) : (
                                  t.guardian.subscription.cancelSection.button
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {guardianStatus?.guardian_subscription_status === 'cancelling' && (
                      <div className="border-t pt-4">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-medium text-orange-800 mb-1">{t.guardian.subscription.cancellingSection.title}</h3>
                              <p className="text-sm text-orange-700 mb-3">
                                {t.guardian.subscription.cancellingSection.description}
                              </p>
                              <button 
                                onClick={handleReactivateGuardian} 
                                disabled={isCheckoutLoading}
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                              >
                                {isCheckoutLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
{t.guardian.subscription.cancellingSection.reactivating}
                                  </>
                                ) : (
                                  t.guardian.subscription.cancellingSection.button
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal di conferma annullamento Guardian */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t.guardian.subscription.cancelModal.title}</h3>
                <p className="text-sm text-gray-600">
                  {t.guardian.subscription.cancelModal.message}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
              >
                {t.guardian.subscription.cancelModal.cancel}
              </button>
              <button
                onClick={handleCancelGuardian}
                disabled={isCancellingSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {isCancellingSubscription ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    {t.guardian.subscription.cancelModal.cancelling}
                  </>
                ) : (
                  t.guardian.subscription.cancelModal.confirm
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente di fallback per il loading
function GuardianFallback() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
        <p className="text-gray-600">{t.guardian.loading}</p>
      </div>
    </div>
  )
}

// Componente principale avvolto in Suspense
export default function GuardianPage() {
  return (
    <Suspense fallback={<GuardianFallback />}>
      <GuardianContent />
    </Suspense>
  )
}

