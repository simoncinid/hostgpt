'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Shield, 
  CheckCircle, 
  Loader2,
  AlertTriangle,
  Eye,
  Zap,
  Star
} from 'lucide-react'
import OspiterAILogo from '../../components/OspiterAILogo'
import { guardian } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import toast from 'react-hot-toast'

// Componente separato che utilizza useSearchParams
function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth, user, setUser } = useAuthStore()
  const { t } = useLanguage()

  const [status, setStatus] = useState<'idle' | 'processing' | 'error' | 'cancelled' | 'success'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const cancelled = searchParams.get('subscription') === 'cancelled'
    if (cancelled) {
      setStatus('cancelled')
      return
    }

    const tokenFromUrl = searchParams.get('token')
    const existingToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const ensureTokenAndCheckout = async () => {
      try {
        setStatus('processing')

        if (tokenFromUrl) {
          localStorage.setItem('token', tokenFromUrl)
          setAuth(tokenFromUrl)
        } else if (existingToken) {
          setAuth(existingToken)
        } else {
          setStatus('error')
          setErrorMessage('Token mancante. Accedi nuovamente per continuare.')
          return
        }

        const resp = await guardian.createCheckout()
        
        // Controlla se l'abbonamento è stato riattivato
        if (resp.data.status === 'reactivated') {
          setStatus('success')
          setErrorMessage('Guardian riattivato con successo!')
          setTimeout(() => {
            window.location.href = '/dashboard/guardian'
          }, 2000)
          return
        }
        
        // Reindirizza a Stripe Checkout
        if (resp.data.checkout_url) {
          window.location.href = resp.data.checkout_url
        } else {
          throw new Error('URL di checkout non ricevuto')
        }
      } catch (err: any) {
        const backendMsg = err?.response?.data?.detail
        setErrorMessage(backendMsg || err?.message || 'Errore durante la creazione della sessione di pagamento')
        setStatus('error')
      }
    }

    ensureTokenAndCheckout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
      {/* Header migliorato */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <OspiterAILogo size="lg" className="text-purple-600" />
            <span className="text-xl font-bold text-dark">Guardian Checkout</span>
          </Link>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Pagamento Sicuro</span>
          </div>
        </div>
      </div>

      {/* Contenuto principale - adattato a 100vh */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-6 h-full">
            {/* Colonna sinistra - Form di pagamento */}
            <div className="flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Attivazione Guardian
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                  Stai per essere reindirizzato alla pagina di pagamento sicura di Stripe per attivare Guardian
                </p>
              </motion.div>


              {status === 'processing' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center"
                >
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Reindirizzamento a Stripe...</h2>
                  <p className="text-gray-600">Stai per essere reindirizzato alla pagina di pagamento sicura di Stripe</p>
                </motion.div>
              )}

              {status === 'cancelled' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center"
                >
                  <h2 className="text-xl font-semibold mb-2">Pagamento Annullato</h2>
                  <p className="text-gray-600 mb-6">Il pagamento è stato annullato. Puoi riprovare in qualsiasi momento.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/dashboard/guardian" className="btn-secondary">Vai alla Dashboard</Link>
                    <button
                      className="btn-primary"
                      onClick={() => router.replace('/checkout/guardian')}
                    >
                      Riprova
                    </button>
                  </div>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center"
                >
                  <h2 className="text-xl font-semibold mb-2">Errore</h2>
                  <p className="text-gray-600 mb-6">{errorMessage}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/login" className="btn-secondary">Accedi</Link>
                    <button className="btn-primary" onClick={() => router.refresh()}>Riprova</button>
                  </div>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2 text-green-600">Guardian Attivato!</h2>
                  <p className="text-gray-600 mb-6">{errorMessage}</p>
                  <Link href="/dashboard/guardian" className="btn-primary">Vai alla Dashboard Guardian</Link>
                </motion.div>
              )}
            </div>

            {/* Colonna destra - Riepilogo compatto */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col justify-center space-y-4"
            >
              <div className="bg-white rounded-xl shadow-lg p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo Ordine</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Guardian Pro</span>
                    <span className="font-semibold">9€/mese</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fatturazione</span>
                    <span className="text-sm text-gray-500">Mensile</span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Totale</span>
                    <span>9€/mese</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-xl p-6 border border-purple-600/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cosa include Guardian</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">Monitoraggio automatico delle conversazioni</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">Alert in tempo reale per problemi</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">Rilevamento automatico di rischi</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">Suggerimenti per migliorare l'esperienza</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente di fallback per il loading
function CheckoutFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Caricamento…</h1>
        <p className="text-gray-600">Preparazione della sessione di pagamento Guardian.</p>
      </div>
    </div>
  )
}

// Componente principale avvolto in Suspense
export default function GuardianCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  )
}
