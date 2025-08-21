'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, Mail, User, Loader2, LogOut, AlertTriangle } from 'lucide-react'
import { auth, subscription } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

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
      
      // Controlla se l'abbonamento è stato riattivato
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
      
      // Altrimenti reindirizza al checkout
      window.location.href = (res.data as any).checkout_url
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Errore nell\'avvio del checkout')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setShowCancelModal(false)
    setIsCancellingSubscription(true)
    try {
      await subscription.cancel()
      toast.success('Abbonamento annullato con successo')
      // Ricarica i dati utente per aggiornare lo stato
      const me = await auth.me()
      setUser(me.data)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Errore nell\'annullamento dell\'abbonamento')
    } finally {
      setIsCancellingSubscription(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Caricamento...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/settings" onLogout={handleLogout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content Wrapper */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} p-4 md:p-8`}>
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Impostazioni</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Profilo</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{user?.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Abbonamento</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stato: <span className={user?.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'}>{user?.subscription_status || 'inactive'}</span></p>
                  {user?.subscription_end_date && (
                    <p className="text-sm text-gray-500">Prossimo rinnovo: {new Date(user.subscription_end_date).toLocaleDateString('it-IT')}</p>
                  )}
                </div>
                {user?.subscription_status !== 'active' && (
                  <button onClick={handleStartCheckout} disabled={isCheckoutLoading} className="btn-primary inline-flex items-center">
                    {isCheckoutLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Reindirizzamento...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Attiva Abbonamento
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
                        <h3 className="font-medium text-red-800 mb-1">Annulla Abbonamento</h3>
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
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Sicurezza</h2>
            <button onClick={() => { logout(); router.push('/login') }} className="btn-secondary inline-flex items-center">
              <LogOut className="w-5 h-5 mr-2" />
              Esci
            </button>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Conferma Annullamento</h3>
                <p className="text-sm text-gray-600">
                  Sei sicuro di voler annullare l'abbonamento? Il servizio verrà disattivato ma tutti i tuoi dati (chatbot, conversazioni, messaggi) rimarranno nel database.
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
                    Annullamento...
                  </>
                ) : (
                  'Conferma Annullamento'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


