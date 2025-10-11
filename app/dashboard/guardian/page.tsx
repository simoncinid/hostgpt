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
import { useAuthInit } from '@/lib/useAuthInit'
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
  
  // Inizializza automaticamente l'autenticazione
  const { isHydrated } = useAuthInit()
  const [guardianStatus, setGuardianStatus] = useState<GuardianStatus | null>(null)
  const [guardianStats, setGuardianStats] = useState<GuardianStats | null>(null)
  const [alerts, setAlerts] = useState<GuardianAlert[]>([])
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [resolvingAlertId, setResolvingAlertId] = useState<number | null>(null)
  const [hostResponse, setHostResponse] = useState('')
  const [hostResponseRef, setHostResponseRef] = useState<HTMLTextAreaElement | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
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
    if (isHydrated && user) {
      // Evita chiamate multiple se i dati sono stati caricati di recente (entro 30 secondi)
      const now = Date.now()
      if (now - lastFetchTime > 30000) { // 30 secondi di cache
        fetchGuardianStatus()
      } else {
        setLoading(false)
      }
    }
  }, [isHydrated, user, lastFetchTime])

  // Focus automatico sul textarea quando si apre il modal di risoluzione
  useEffect(() => {
    if (resolvingAlertId && hostResponseRef) {
      // Piccolo delay per assicurarsi che il modal sia completamente renderizzato
      setTimeout(() => {
        hostResponseRef.focus()
      }, 100)
    }
  }, [resolvingAlertId, hostResponseRef])

  const fetchGuardianStatus = async () => {
    try {
      setIsRefreshing(true)
      const response = await guardian.getStatus()
      const status = response.data
      setGuardianStatus(status)
      
      // Aggiorna lo stato utente solo se necessario (evita chiamata /api/auth/me)
      if (user && user.guardian_subscription_status !== status.guardian_subscription_status) {
        try {
          const auth = (await import('@/lib/api')).auth
          const me = await auth.me()
          setUser(me.data)
        } catch (error) {
          console.error('Error updating user data:', error)
        }
      }
      
      if (status.is_active) {
        await fetchGuardianData()
      }
      
      setLastFetchTime(Date.now())
    } catch (error) {
      console.error('Error fetching guardian status:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchGuardianData = async () => {
    try {
      console.log('Fetching guardian data...')
      
      // Fetch statistics e alerts in parallelo per ridurre il tempo di risposta
      const [statsResponse, alertsResponse] = await Promise.all([
        guardian.getStatistics(),
        guardian.getAlerts()
      ])
      
      setGuardianStats(statsResponse.data)
      setAlerts(alertsResponse.data)
      console.log('Stats e alerts aggiornati:', statsResponse.data, alertsResponse.data)
    } catch (error) {
      console.error('Error fetching guardian data:', error)
    }
  }

  const confirmGuardianSubscription = async (sessionId: string) => {
    try {
      // Rimuovi i parametri dall'URL
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Ricarica i dati Guardian forzando il refresh
      setLastFetchTime(0) // Reset cache
      await fetchGuardianStatus()
      
      // Mostra messaggio di successo
      toast.success(t.guardian.success.subscriptionActivated)
    } catch (error) {
      console.error('Error confirming guardian subscription:', error)
    }
  }

  // Funzione per refresh manuale
  const handleManualRefresh = async () => {
    setLastFetchTime(0) // Reset cache per forzare il refresh
    await fetchGuardianStatus()
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
      
      // Se è un checkout combinato, reindirizza alla pagina di selezione combinata
      if (response.data.is_combined) {
        toast.success('Reindirizzamento alla selezione di OspiterAI + Guardian...')
        router.push('/select-service-ospiteraiandguardian')
        return
      }
      
      // Reindirizza a Stripe Checkout
      if (response.data.checkout_url) {
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

  const handleResolveAlert = async (alertId: number, hostResponse: string) => {
    try {
      console.log('Risolvendo alert:', alertId, 'con risposta:', hostResponse)
      await guardian.resolveAlert(alertId, hostResponse)
      
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

  const startResolvingAlert = (alertId: number) => {
    setResolvingAlertId(alertId)
    setHostResponse('')
    // Apri automaticamente la conversazione se è collassata
    setExpandedAlert(alertId)
  }

  const cancelResolvingAlert = () => {
    setResolvingAlertId(null)
    setHostResponse('')
  }

  const submitHostResponse = async () => {
    if (!resolvingAlertId || !hostResponse.trim()) {
      toast.error('Inserisci una risposta per l\'ospite')
      return
    }

    await handleResolveAlert(resolvingAlertId, hostResponse.trim())
    setResolvingAlertId(null)
    setHostResponse('')
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
              {/* Nascondi scudo e titolo su mobile, mostra solo su desktop */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold">{t.guardian.title}</h1>
                {/* Pulsante refresh */}
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Aggiorna dati"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Su mobile mostra solo il titolo senza scudo */}
              <div className="flex items-center space-x-3 md:hidden">
                <h1 className="text-xl font-semibold">{t.guardian.title}</h1>
                {/* Pulsante refresh mobile */}
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Aggiorna dati"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

                <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Se non abbonato, mostra informazioni sui benefici del Guardian */}
            {!guardianStatus?.is_active ? (
              <div className="max-w-4xl mx-auto">
                {/* Sezione Benefici Guardian */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 mb-8">
                  <div className="text-center mb-6 relative">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.guardian.benefits.title}</h2>
                    <p className="text-lg text-gray-600">{t.guardian.benefits.subtitle}</p>
                    
                    {/* Bottone di acquisto per desktop - in alto a destra nel div verde */}
                    <div className="hidden md:block absolute top-0 right-0">
                      <button
                        onClick={handleSubscribe}
                        disabled={isCheckoutLoading}
                        className="bg-secondary hover:bg-secondary/80 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 shadow-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCheckoutLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Attivazione...</span>
                          </>
                        ) : (
                          <span>Attiva Guardian</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Main Statistic */}
                  <div className="bg-white rounded-xl p-6 mb-6 text-center shadow-sm">
                    <div className="text-4xl font-bold text-secondary mb-2">{t.guardian.benefits.statistic.percentage}</div>
                    <p className="text-lg text-gray-800 font-semibold">{t.guardian.benefits.statistic.description}</p>
                    
                    {/* Bottone di acquisto per mobile - centrato nel div bianco */}
                    <div className="mt-6 md:hidden">
                      <button
                        onClick={handleSubscribe}
                        disabled={isCheckoutLoading}
                        className="bg-secondary hover:bg-secondary/80 text-white font-bold py-3 px-6 rounded-xl text-base transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCheckoutLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t.guardian.redirecting}</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
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

                  {/* Essential Benefits */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                        <Target className="w-5 h-5 text-secondary mr-2" />
                        {t.guardian.benefits.whatIs.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {t.guardian.benefits.whatIs.description}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                        <TrendingUp className="w-5 h-5 text-secondary mr-2" />
                        {t.guardian.benefits.keyBenefits.title}
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        {t.guardian.benefits.keyBenefits.items.map((item, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-secondary mr-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Button rimosso - ora posizionato diversamente per mobile e desktop */}
              </div>
            ) : (
              /* Se abbonato, mostra dashboard */
              <div className="space-y-6">
                {/* Statistiche */}
                {guardianStats && (
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-3 md:gap-6 mb-8">
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
                      <p className="text-xs md:text-sm text-secondary mt-1">
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
                        <CheckCircle className="w-4 h-4 md:w-8 md:h-8 text-secondary" />
                        <span className="text-sm md:text-3xl font-bold text-secondary">{guardianStats.resolved_issues}</span>
                      </div>
                      <p className="text-gray-600 text-xs md:text-base">
                        <span className="md:hidden">{t.guardian.stats.resolvedIssuesShort}</span>
                        <span className="hidden md:inline">{t.guardian.stats.resolvedIssues}</span>
                      </p>
                      <p className="text-xs md:text-sm text-secondary mt-1">
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
                        <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
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
                                      <h3 className="font-semibold text-gray-900">{t.guardian.alerts.guest} {alert.guest_id}</h3>
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
                                      startResolvingAlert(alert.id)
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-secondary to-secondary/80 text-white rounded-full text-sm font-medium hover:from-secondary/80 hover:to-secondary/60 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
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
                                
                                {/* Form di risposta host */}
                                {resolvingAlertId === alert.id && (
                                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                    <h5 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Scrivi la tua risposta per l'ospite
                                    </h5>
                                    <textarea
                                      ref={setHostResponseRef}
                                      value={hostResponse}
                                      onChange={(e) => setHostResponse(e.target.value)}
                                      placeholder="Scrivi qui la tua risposta che verrà inviata all'ospite..."
                                      className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                      rows={4}
                                    />
                                    <div className="flex justify-end space-x-2 mt-3">
                                      <button
                                        onClick={cancelResolvingAlert}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                      >
                                        Annulla
                                      </button>
                                      <button
                                        onClick={submitHostResponse}
                                        disabled={!hostResponse.trim()}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        Invia Risposta
                                      </button>
                                    </div>
                                  </div>
                                )}
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
                          guardianStatus?.guardian_subscription_status === 'active' ? 'text-secondary' : 
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

