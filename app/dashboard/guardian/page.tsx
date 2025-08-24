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
  Heart
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'
import { guardian } from '@/lib/api'

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
  const { user, logout } = useAuthStore()
  const [guardianStatus, setGuardianStatus] = useState<GuardianStatus | null>(null)
  const [guardianStats, setGuardianStats] = useState<GuardianStats | null>(null)
  const [alerts, setAlerts] = useState<GuardianAlert[]>([])
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Controlla se c'è un parametro di successo nell'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const subscription = urlParams.get('subscription')
    const sessionId = urlParams.get('session_id')
    
    if (subscription === 'success' && sessionId) {
      // Conferma la sottoscrizione
      confirmGuardianSubscription(sessionId)
    }
  }, [])

  useEffect(() => {
    fetchGuardianStatus()
  }, [])

  const fetchGuardianStatus = async () => {
    try {
      const response = await guardian.getStatus()
      const status = response.data
      setGuardianStatus(status)
      
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
      // Fetch statistics
      const statsResponse = await guardian.getStatistics()
      setGuardianStats(statsResponse.data)

      // Fetch alerts
      const alertsResponse = await guardian.getAlerts()
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
      toast.success('🎉 Abbonamento Guardian attivato con successo!')
    } catch (error) {
      console.error('Error confirming guardian subscription:', error)
    }
  }

  const handleSubscribe = async () => {
    try {
      const response = await guardian.createCheckout()
      
      // Se la risposta indica riattivazione, gestiscila
      if (response.data.status === 'reactivated') {
        toast.success(response.data.message)
        await fetchGuardianStatus()
        return
      }
      
      // Altrimenti, reindirizza al checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url
      }
    } catch (error: any) {
      console.error('Error subscribing to guardian:', error)
      toast.error(error.response?.data?.detail || 'Errore durante la sottoscrizione')
    }
  }

  const handleResolveAlert = async (alertId: number) => {
    try {
      await guardian.resolveAlert(alertId)
      // Remove alert from list
      setAlerts(alerts.filter(alert => alert.id !== alertId))
      // Refresh stats
      fetchGuardianData()
      toast.success('Alert risolto con successo!')
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error('Errore durante la risoluzione dell\'alert')
    }
  }

  const handleCancelGuardian = async () => {
    if (confirm('Sei sicuro di voler annullare l\'abbonamento Guardian? Il servizio rimarrà attivo fino alla fine del periodo corrente.')) {
      try {
        const response = await guardian.cancel()
        toast.success(response.data.message)
        // Ricarica lo stato
        await fetchGuardianStatus()
      } catch (error: any) {
        console.error('Error cancelling guardian subscription:', error)
        toast.error(error.response?.data?.detail || 'Errore durante la cancellazione')
      }
    }
  }

  const handleReactivateGuardian = async () => {
    try {
      const response = await guardian.reactivate()
      toast.success(response.data.message)
      // Ricarica lo stato
      await fetchGuardianStatus()
    } catch (error: any) {
      console.error('Error reactivating guardian subscription:', error)
      toast.error(error.response?.data?.detail || 'Errore durante la riattivazione')
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
          <p className="text-gray-600">Caricamento Guardian...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/guardian" onLogout={handleLogout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} p-4 md:p-8`}>
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark">Guardian</h1>
              <p className="text-gray-600">Proteggi la tua reputazione, massimizza la soddisfazione degli ospiti</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center text-gray-600 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5 mr-2" />
            ESCI
          </button>
        </div>

        {/* Se non abbonato o in cancellazione, mostra animazione */}
        {!guardianStatus?.is_active || guardianStatus?.guardian_subscription_status === 'cancelling' ? (
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
                          <p className="whitespace-pre-wrap">Ciao! Ho un problema con il WiFi, non riesco a connettermi</p>
                          <p className="text-xs mt-1 text-white/70">14:32</p>
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
                          <p className="whitespace-pre-wrap">Ciao! Mi dispiace per il problema. Prova a riavviare il router</p>
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
                          <p className="whitespace-pre-wrap">Ho già provato, ma non funziona. Sono molto frustrato!</p>
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
                         <p className="text-2xl font-black tracking-wider">🚨 ALERT CRITICO</p>
                         <p className="text-lg font-semibold mt-1">Ospite insoddisfatto rilevato</p>
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
                             <p className="text-xl font-black text-gray-800">📞 Host chiama l'ospite</p>
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
                         <p className="text-3xl font-black tracking-wider">🎉 Problema risolto!</p>
                         <p className="text-xl font-semibold mt-2">Recensione negativa evitata</p>
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
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
              >
                <Shield className="w-5 h-5" />
                <span>
                  {guardianStatus?.guardian_subscription_status === 'cancelling' 
                    ? 'Riattiva Guardian' 
                    : 'Attiva Guardian - 9€/mese'
                  }
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Se abbonato, mostra dashboard */
          <div className="space-y-6">
            {/* Statistiche */}
            {guardianStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="stats-card p-6 border-l-4 border-blue-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-blue-500" />
                    <span className="text-3xl font-bold text-blue-600">{guardianStats.total_guests}</span>
                  </div>
                  <p className="text-gray-600">Ospiti Totali</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="stats-card p-6 border-l-4 border-red-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <span className="text-3xl font-bold text-red-600">{guardianStats.high_risk_guests}</span>
                  </div>
                  <p className="text-gray-600">Ospiti a Rischio</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="stats-card p-6 border-l-4 border-green-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <span className="text-3xl font-bold text-green-600">{guardianStats.resolved_issues}</span>
                  </div>
                  <p className="text-gray-600">Problemi Risolti</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="stats-card p-6 border-l-4 border-yellow-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Star className="w-8 h-8 text-yellow-500" />
                    <span className="text-3xl font-bold text-yellow-600">{guardianStats.avg_satisfaction}/5</span>
                  </div>
                  <p className="text-gray-600">Soddisfazione Media</p>
                </motion.div>
              </div>
            )}

            {/* Gestione Abbonamento */}
            <div className="bg-white rounded-2xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-dark flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Gestione Abbonamento Guardian</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Stato abbonamento:</p>
                    <p className={`font-medium ${
                      guardianStatus?.guardian_subscription_status === 'active' ? 'text-green-600' : 
                      guardianStatus?.guardian_subscription_status === 'cancelling' ? 'text-orange-600' : 
                      'text-red-600'
                    }`}>
                      {guardianStatus?.guardian_subscription_status === 'active' ? 'Attivo' : 
                       guardianStatus?.guardian_subscription_status === 'cancelling' ? 'In Annullamento' : 
                       'Inattivo'}
                    </p>
                    {guardianStatus?.guardian_subscription_end_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Scade il: {new Date(guardianStatus.guardian_subscription_end_date).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {guardianStatus?.guardian_subscription_status === 'active' && (
                      <button
                        onClick={handleCancelGuardian}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Annulla Abbonamento
                      </button>
                    )}
                    {guardianStatus?.guardian_subscription_status === 'cancelling' && (
                      <button
                        onClick={handleReactivateGuardian}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Riattiva Abbonamento
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Attivi */}
            <div className="bg-white rounded-2xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-dark flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Alert Attivi ({alerts.length})</span>
                </h2>
              </div>
             
              <div className="p-6">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Nessun alert attivo. Tutto sotto controllo! 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="border rounded-lg overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getSeverityIcon(alert.severity)}
                              <div>
                                <p className="font-medium text-gray-800">Ospite #{alert.guest_id}</p>
                                <p className="text-sm text-gray-600">{alert.message}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                                {alert.severity.toUpperCase()}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResolveAlert(alert.id)
                                }}
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                              >
                                Risolvi
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {expandedAlert === alert.id && (
                          <div className="border-t bg-gray-50 p-4">
                            <h4 className="font-medium text-gray-800 mb-3">Conversazione Completa:</h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {alert.conversation.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                  <div className={`max-w-xs p-3 rounded-lg ${
                                    msg.role === 'user' 
                                      ? 'bg-white border border-gray-200' 
                                      : 'bg-blue-500 text-white'
                                  }`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(msg.timestamp).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-800">Suggerimento:</p>
                              <p className="text-sm text-blue-700">{alert.suggested_action}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente di fallback per il loading
function GuardianFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
        <p className="text-gray-600">Caricamento Guardian...</p>
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
