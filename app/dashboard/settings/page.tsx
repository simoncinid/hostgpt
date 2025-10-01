'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, Mail, User, Loader2, LogOut, AlertTriangle, ChevronDown, Check, Settings, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { auth, subscription } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuthStore()
  const { t, language } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [isDeletingProfile, setIsDeletingProfile] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [isUpgrading, setIsUpgrading] = useState(false)
  
  // Stati per l'integrazione API Hostaway
  const [hostawayAccountId, setHostawayAccountId] = useState('')
  const [hostawayApiKey, setHostawayApiKey] = useState('')
  const [isSavingApiKey, setIsSavingApiKey] = useState(false)
  const [showApartmentsModal, setShowApartmentsModal] = useState(false)
  const [apartments, setApartments] = useState<any[]>([])
  const [chatbots, setChatbots] = useState<any[]>([])
  const [isLoadingApartments, setIsLoadingApartments] = useState(false)
  const [apartmentMappings, setApartmentMappings] = useState<{[key: string]: number | null}>({})
  const [expandedApartments, setExpandedApartments] = useState<Set<string>>(new Set())
  const [isSavingMapping, setIsSavingMapping] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const me = await auth.me()
        setUser(me.data)
      } catch {
        router.replace('/login')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleStartCheckout = async () => {
    setIsCheckoutLoading(true)
    try {
      const res = await subscription.createCheckout()
      
      // Controlla se l'abbonamento è stato riattivato automaticamente
      if (res.data.status === 'reactivated') {
        toast.success(
          'Abbonamento riattivato con successo! Riprenderai a pagare regolarmente dal prossimo rinnovo.',
          { duration: 5000 }
        )
        // Ricarica i dati utente per aggiornare lo stato
        const me = await auth.me()
        setUser(me.data)
        return
      }
      
      // Se abbiamo un client_secret, reindirizza al checkout personalizzato
      if (res.data.client_secret) {
        router.push('/checkout')
      } else if (res.data.checkout_url) {
        // Fallback per checkout Stripe tradizionale
        window.location.href = res.data.checkout_url
      } else {
        throw new Error('URL di checkout non ricevuto')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Errore nell\'avvio del checkout')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    console.log('=== FRONTEND: Cancellation started ===')
    setShowCancelModal(false)
    setIsCancellingSubscription(true)
    try {
      console.log('=== FRONTEND: Calling subscription.cancel() ===')
      const response = await subscription.cancel()
      console.log('=== FRONTEND: Response received ===', response.data)
      
      if (response.data.status === 'already_cancelling') {
        toast.success('Il tuo abbonamento è già in fase di annullamento')
      } else {
        toast.success('Abbonamento annullato con successo')
      }
      // Ricarica i dati utente per aggiornare lo stato
      console.log('=== FRONTEND: Reloading user data ===')
      const me = await auth.me()
      setUser(me.data)
    } catch (e: any) {
      console.error('=== FRONTEND: Error during cancellation ===', e)
      toast.error(e.response?.data?.detail || 'Errore nell\'annullamento dell\'abbonamento')
    } finally {
      setIsCancellingSubscription(false)
      console.log('=== FRONTEND: Cancellation completed ===')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleDeleteProfile = async () => {
    const confirmationTexts = [
      'voglio eliminare il profilo',
      'i want to delete my profile'
    ]
    
    if (!confirmationTexts.includes(deleteConfirmationText.toLowerCase().trim())) {
      toast.error((t.settings as any).deleteProfileModal.confirmationText)
      return
    }

    setIsDeletingProfile(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/delete-profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Errore nell\'eliminazione del profilo')
      }

      toast.success('Profilo eliminato con successo')
      logout()
      router.push('/')
    } catch (e: any) {
      toast.error(e.message || 'Errore nell\'eliminazione del profilo')
    } finally {
      setIsDeletingProfile(false)
      setShowDeleteProfileModal(false)
      setDeleteConfirmationText('')
    }
  }

  // Piani disponibili per l'upgrade
  const availablePlans = [
    {
      id: 'STANDARD',
      name: 'Standard',
      price: '19€',
      period: '/mese',
      conversations: 20,
      features: ['20 conversazioni/mese', 'Chatbot illimitati', 'Supporto email']
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: '39€',
      period: '/mese',
      conversations: 50,
      features: ['50 conversazioni/mese', 'Chatbot illimitati', 'Supporto prioritario']
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '79€',
      period: '/mese',
      conversations: 150,
      features: ['150 conversazioni/mese', 'Chatbot illimitati', 'Supporto prioritario']
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: '199€',
      period: '/mese',
      conversations: 500,
      features: ['500 conversazioni/mese', 'Chatbot illimitati', 'Supporto dedicato']
    }
  ]

  // Ottieni il piano attuale
  const getCurrentPlan = () => {
    // Usa conversations_limit se disponibile, altrimenti conversation_limit
    const limit = (user as any)?.conversations_limit || user?.conversation_limit
    if (!limit) return null
    return availablePlans.find(plan => plan.conversations === limit) || availablePlans[0]
  }

  const currentPlan = getCurrentPlan()

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      toast.error('Seleziona un piano per continuare')
      return
    }

    setIsUpgrading(true)
    try {
      // Mappa i piani ai price_id (questi sono i veri price_id di Stripe)
      const priceIdMap: { [key: string]: string } = {
        'STANDARD': 'STANDARD_PRICE_ID',
        'PREMIUM': 'PREMIUM_PRICE_ID', 
        'PRO': 'PRO_PRICE_ID',
        'ENTERPRISE': 'ENTERPRISE_PRICE_ID'
      }

      const priceId = priceIdMap[selectedPlan]
      if (!priceId) {
        throw new Error('Piano non valido')
      }

      const res = await subscription.createCheckout(priceId, 'monthly')
      
      // Controlla se è un upgrade di abbonamento esistente
      if (res.data.status === 'upgraded') {
        toast.success(
          `Abbonamento aggiornato con successo! Nuovo limite: ${res.data.new_limit} conversazioni/mese`,
          { duration: 5000 }
        )
        // Ricarica i dati utente per aggiornare lo stato
        const me = await auth.me()
        setUser(me.data)
        return
      }
      
      if (res.data.client_secret) {
        router.push('/checkout')
      } else if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url
      } else {
        throw new Error('URL di checkout non ricevuto')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Errore nell\'avvio dell\'upgrade')
    } finally {
      setIsUpgrading(false)
      setShowUpgradeModal(false)
    }
  }

  // Funzioni per l'integrazione Hostaway
  const handleSaveApiKey = async () => {
    if (!hostawayAccountId.trim() || !hostawayApiKey.trim()) {
      toast.error('Inserisci sia Account ID che API Key')
      return
    }

    setIsSavingApiKey(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hostaway/save-api-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          account_id: hostawayAccountId,
          api_key: hostawayApiKey 
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Errore nel salvare le credenziali')
      }

      toast.success((t.settings as any).apiIntegration.apiKey.success)
      setHostawayAccountId('')
      setHostawayApiKey('')
    } catch (e: any) {
      toast.error(e.message || (t.settings as any).apiIntegration.apiKey.error)
    } finally {
      setIsSavingApiKey(false)
    }
  }

  const handleLoadApartments = async () => {
    if (!hostawayAccountId.trim() || !hostawayApiKey.trim()) {
      toast.error('Inserisci sia Account ID che API Key')
      return
    }

    setIsLoadingApartments(true)
    setShowApartmentsModal(true)
    
    try {
      // Prima salva le credenziali
      const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hostaway/save-api-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          account_id: hostawayAccountId,
          api_key: hostawayApiKey 
        })
      })

      if (!saveResponse.ok) {
        const error = await saveResponse.json()
        throw new Error(error.detail || 'Errore nel salvare le credenziali')
      }

      // Poi recupera gli appartamenti
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hostaway/apartments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Errore nel recuperare gli appartamenti')
      }

      const data = await response.json()
      setApartments(data.apartments || [])
      setChatbots(data.chatbots || [])
      
      // Inizializza i mapping esistenti
      const mappings: {[key: string]: number | null} = {}
      data.apartments.forEach((apt: any) => {
        mappings[apt.id] = apt.chatbot_id || null
      })
      setApartmentMappings(mappings)
      
      // Pulisci i campi dopo il successo
      setHostawayAccountId('')
      setHostawayApiKey('')
      
    } catch (e: any) {
      toast.error(e.message || 'Errore nel recuperare gli appartamenti')
      setShowApartmentsModal(false)
    } finally {
      setIsLoadingApartments(false)
    }
  }

  const handleToggleApartment = (apartmentId: string) => {
    const newExpanded = new Set(expandedApartments)
    if (newExpanded.has(apartmentId)) {
      newExpanded.delete(apartmentId)
    } else {
      newExpanded.add(apartmentId)
    }
    setExpandedApartments(newExpanded)
  }

  const handleMappingChange = (apartmentId: string, chatbotId: number | null) => {
    setApartmentMappings(prev => ({
      ...prev,
      [apartmentId]: chatbotId
    }))
  }

  const getAvailableChatbots = (currentApartmentId: string) => {
    // Filtra i chatbot che non sono già mappati ad altri appartamenti
    const usedChatbotIds = Object.entries(apartmentMappings)
      .filter(([aptId, chatbotId]) => aptId !== currentApartmentId && chatbotId !== null)
      .map(([, chatbotId]) => chatbotId)
    
    return chatbots.filter(cb => !usedChatbotIds.includes(cb.id))
  }

  const handleSaveMapping = async () => {
    setIsSavingMapping(true)
    try {
      const mappings = Object.entries(apartmentMappings).map(([apartmentId, chatbotId]) => ({
        apartment_id: apartmentId,
        chatbot_id: chatbotId
      }))

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hostaway/save-mapping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mappings })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Errore nel salvare il mapping')
      }

      toast.success((t.settings as any).apiIntegration.apartments.success)
      setShowApartmentsModal(false)
    } catch (e: any) {
      toast.error(e.message || (t.settings as any).apiIntegration.apartments.error)
    } finally {
      setIsSavingMapping(false)
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> {t.common.loading}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/settings" onLogout={handleLogout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content Wrapper */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{t.settings.title}</h1>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">{t.settings.profile}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-500">{t.settings.fullName}</p>
                    <p className="font-medium">{user?.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-500">{t.settings.email}</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t.settings.billing}</h2>
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.settings.subscriptionStatus}: <span className={
                      user?.subscription_status === 'active' ? 'text-secondary' : 
                      user?.subscription_status === 'cancelling' ? 'text-orange-600' : 
                      'text-red-600'
                    }>{user?.subscription_status || 'inactive'}</span></p>
                    {user?.subscription_end_date && (
                      <p className="text-sm text-gray-500">
                        {user?.subscription_status === 'cancelling' ? t.settings.nextBilling + ': ' : t.settings.nextBilling + ': '}
                        {new Date(user.subscription_end_date).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                  {!['active', 'cancelling', 'free_trial'].includes(user?.subscription_status || '') && (
                    <button onClick={handleStartCheckout} disabled={isCheckoutLoading} className="btn-primary inline-flex items-center">
                      {isCheckoutLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t.guardian.redirecting}
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          {t.settings.reactivateSubscription}
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                {user?.subscription_status === 'active' && (
                  <div className="border-t pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-medium text-red-800 mb-1">{t.settings.cancelSubscription}</h3>
                          <p className="text-sm text-red-700 mb-3">
                            Annullando l'abbonamento il servizio verrà disattivato, ma tutti i tuoi dati (chatbot, conversazioni, messaggi) rimarranno nel database.
                          </p>
                          <button 
                            onClick={() => setShowCancelModal(true)} 
                            disabled={isCancellingSubscription}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                          >
                            {isCancellingSubscription ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Annullamento...
                              </>
                            ) : (
                              'Annulla Abbonamento'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {user?.subscription_status === 'cancelling' && (
                  <div className="border-t pt-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-medium text-orange-800 mb-1">Abbonamento in Fase di Annullamento</h3>
                          <p className="text-sm text-orange-700 mb-3">
                            Il tuo abbonamento è in fase di annullamento e rimarrà attivo fino alla fine del periodo corrente. Puoi riattivarlo in qualsiasi momento.
                          </p>
                          <button 
                            onClick={handleStartCheckout} 
                            disabled={isCheckoutLoading}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                          >
                            {isCheckoutLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Riattivazione...
                              </>
                            ) : (
                              'Riattiva Abbonamento (Gratis)'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sezione Upgrade Piano */}
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Upgrade Piano</h2>
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              
              <div className="space-y-4">
                {/* Piano Attuale */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Piano Attuale</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentPlan?.name || 'Standard'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(user as any)?.conversations_used || 0} / {(user as any)?.conversations_limit || 20} conversazioni usate
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Limite mensile</p>
                      <p className="font-medium">{(user as any)?.conversations_limit || 20} conversazioni</p>
                    </div>
                  </div>
                  
                  {/* Barra di progresso */}
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Utilizzo</span>
                      <span>{Math.round((((user as any)?.conversations_used || 0) / ((user as any)?.conversations_limit || 20)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          ((user as any)?.conversations_used || 0) >= ((user as any)?.conversations_limit || 20)
                            ? 'bg-red-500' 
                            : ((user as any)?.conversations_used || 0) >= ((user as any)?.conversations_limit || 20) * 0.8
                            ? 'bg-yellow-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ 
                          width: `${Math.min((((user as any)?.conversations_used || 0) / ((user as any)?.conversations_limit || 20)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    {((user as any)?.conversations_used || 0) >= ((user as any)?.conversations_limit || 20) && (
                      <p className="text-sm text-red-600 mt-2 font-medium">
                        ⚠️ Hai raggiunto il limite mensile. Considera un upgrade!
                      </p>
                    )}
                  </div>
                </div>

                {/* Pulsante Upgrade */}
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Cambia Piano
                </button>
              </div>
            </div>

            {/* Sezione Integrazione API */}
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{(t.settings as any).apiIntegration?.title || 'Integrazione API'}</h2>
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {(t.settings as any).apiIntegration?.description || 'Collega i tuoi appartamenti Hostaway ai chatbot di OspiterAI per una gestione integrata.'}
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-700">
                    {String(language) === 'it' ? 'Hai bisogno di Account ID e API Key?' : 'Need Account ID and API Key?'}
                  </span>
                  <a 
                    href="https://support.hostaway.com/hc/en-us/articles/360002576293-Hostaway-Public-API-Account-Secret-Key"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                  >
                    {String(language) === 'it' ? 'Guida Hostaway' : 'Hostaway Guide'}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Input credenziali Hostaway */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account ID Hostaway
                    </label>
                    <input
                      type="text"
                      value={hostawayAccountId}
                      onChange={(e) => setHostawayAccountId(e.target.value)}
                      placeholder="Inserisci il tuo Account ID Hostaway..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSavingApiKey}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {(t.settings as any).apiIntegration?.apiKey?.label || 'API Key Hostaway'}
                    </label>
                    <input
                      type="password"
                      value={hostawayApiKey}
                      onChange={(e) => setHostawayApiKey(e.target.value)}
                      placeholder={(t.settings as any).apiIntegration?.apiKey?.placeholder || 'Inserisci la tua API key Hostaway...'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSavingApiKey}
                    />
                  </div>
                  
                </div>
                
                {/* Pulsante per caricare appartamenti */}
                <div className="border-t pt-4">
                  <button
                    onClick={handleLoadApartments}
                    disabled={isLoadingApartments || !hostawayAccountId.trim() || !hostawayApiKey.trim()}
                    className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  >
                    {isLoadingApartments ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {(t.settings as any).apiIntegration?.apartments?.loading || 'Caricamento appartamenti...'}
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5 mr-2" />
                        {(t.settings as any).apiIntegration?.apartments?.title || 'Gestisci Appartamenti Hostaway'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">{t.common.security || 'Sicurezza'}</h2>
              <div className="space-y-4">
                <button onClick={() => { logout(); router.push('/login') }} className="btn-secondary inline-flex items-center">
                  <LogOut className="w-5 h-5 mr-2" />
                  {t.common.logout || 'Esci'}
                </button>
                
                <div className="border-t pt-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium text-red-800 mb-1">{(t.settings as any).deleteProfile}</h3>
                        <p className="text-sm text-red-700 mb-3">
                          {(t.settings as any).deleteProfileWarning}
                        </p>
                        <button 
                          onClick={() => setShowDeleteProfileModal(true)} 
                          disabled={isDeletingProfile}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                        >
                          {isDeletingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {(t.settings as any).deleteProfileModal.deleting}
                            </>
                          ) : (
                            (t.settings as any).deleteProfile
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal di conferma annullamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t.settings.cancelSubscriptionTitle || 'Conferma Annullamento'}</h3>
                <p className="text-sm text-gray-600">
                  {t.settings.cancelSubscriptionMessage || "Sei sicuro di voler annullare l'abbonamento? Il servizio verrà disattivato ma tutti i tuoi dati (chatbot, conversazioni, messaggi) rimarranno nel database."}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isCancellingSubscription}
              >
                Annulla
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancellingSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {isCancellingSubscription ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.settings.cancelling || 'Annullamento...'}
                  </>
                ) : (
                  t.settings.confirmCancellation || 'Conferma Annullamento'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal di conferma eliminazione profilo */}
      {showDeleteProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{(t.settings as any).deleteProfileModal.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {(t.settings as any).deleteProfileModal.description}
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside mb-4 space-y-1">
                  {(t.settings as any).deleteProfileModal.items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <p className="text-sm text-red-600 font-medium mb-4">
                  {(t.settings as any).deleteProfileModal.warning}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  {(t.settings as any).deleteProfileModal.confirmationText}
                </p>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder={(t.settings as any).deleteProfileModal.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isDeletingProfile}
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteProfileModal(false)
                  setDeleteConfirmationText('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isDeletingProfile}
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleDeleteProfile}
                disabled={isDeletingProfile || !deleteConfirmationText}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {isDeletingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {(t.settings as any).deleteProfileModal.deleting}
                  </>
                ) : (
                  (t.settings as any).deleteProfileModal.button
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upgrade Piano */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Scegli il tuo piano</h3>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false)
                    setSelectedPlan('')
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {availablePlans.map((plan) => {
                  const isCurrentPlan = currentPlan?.id === plan.id
                  const isSelected = selectedPlan === plan.id
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                        isCurrentPlan 
                          ? 'border-green-300 bg-green-50' 
                          : isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => !isCurrentPlan && setSelectedPlan(plan.id)}
                    >
                      {isCurrentPlan && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            Piano Attuale
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                            <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                            <span className="text-gray-600">{plan.period}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {plan.conversations} conversazioni al mese
                          </p>
                          <ul className="mt-2 space-y-1">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center text-sm text-gray-600">
                                <Check className="w-4 h-4 text-secondary mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {!isCurrentPlan && (
                          <div className="ml-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false)
                    setSelectedPlan('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isUpgrading}
                >
                  Annulla
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={!selectedPlan || isUpgrading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Elaborazione...
                    </>
                  ) : (
                    'Procedi al Pagamento'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Appartamenti Hostaway */}
      {showApartmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {(t.settings as any).apiIntegration?.apartments?.title || 'Appartamenti Hostaway'}
                </h3>
                <button
                  onClick={() => setShowApartmentsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {isLoadingApartments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">
                    {(t.settings as any).apiIntegration?.apartments?.loading || 'Caricamento appartamenti...'}
                  </span>
                </div>
              ) : apartments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    {(t.settings as any).apiIntegration?.apartments?.noApartments || 'Nessun appartamento trovato'}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-6">
                    {(t.settings as any).apiIntegration?.apartments?.clickToMap || 'Clicca su un appartamento per collegarlo a un assistente'}
                  </p>

                  <div className="space-y-3">
                    {apartments.map((apartment) => {
                      const isExpanded = expandedApartments.has(apartment.id)
                      const isMapped = apartmentMappings[apartment.id] !== null
                      const availableChatbots = getAvailableChatbots(apartment.id)
                      
                      return (
                        <div
                          key={apartment.id}
                          className={`border rounded-lg transition-all ${
                            isMapped ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="p-4 cursor-pointer flex items-center justify-between"
                            onClick={() => handleToggleApartment(apartment.id)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium text-gray-900">{apartment.name}</h4>
                                {isMapped && (
                                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                    {(t.settings as any).apiIntegration?.apartments?.mapped || 'Collegato'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{apartment.address}</p>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                          
                          {isExpanded && (
                            <div className="border-t p-4 bg-gray-50">
                              <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                  {(t.settings as any).apiIntegration?.apartments?.selectAssistant || (String(language) === 'it' ? 'Seleziona assistente' : 'Select assistant')}
                                </label>
                                
                                {availableChatbots.length === 0 ? (
                                  <p className="text-sm text-gray-500">
                                    {(t.settings as any).apiIntegration?.apartments?.noAvailableAssistants || (String(language) === 'it' ? 'Nessun assistente disponibile' : 'No available assistants')}
                                  </p>
                                ) : (
                                  <select
                                    value={apartmentMappings[apartment.id] || ''}
                                    onChange={(e) => handleMappingChange(apartment.id, e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">{String(language) === 'it' ? '-- Seleziona un assistente --' : '-- Select an assistant --'}</option>
                                    {availableChatbots.map((chatbot) => (
                                      <option key={chatbot.id} value={chatbot.id}>
                                        {chatbot.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                
                                {apartmentMappings[apartment.id] && (
                                  <button
                                    onClick={() => handleMappingChange(apartment.id, null)}
                                    className="text-sm text-red-600 hover:text-red-700"
                                  >
                                    {String(language) === 'it' ? 'Rimuovi collegamento' : 'Remove connection'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      onClick={() => setShowApartmentsModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={isSavingMapping}
                    >
                      {String(language) === 'it' ? 'Annulla' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleSaveMapping}
                      disabled={isSavingMapping}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                    >
                      {isSavingMapping ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {(t.settings as any).apiIntegration?.apartments?.saving || 'Salvando...'}
                        </>
                      ) : (
                        (t.settings as any).apiIntegration?.apartments?.save || 'Salva Mapping'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


