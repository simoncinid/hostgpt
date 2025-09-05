'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Loader2,
  Home,
  AlertTriangle,
  Eye,
  Zap,
  Star
} from 'lucide-react'
import { guardian } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// Inizializza Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Componente per il form di pagamento
function CheckoutForm({ clientSecret, onSuccess, t }: { clientSecret: string, onSuccess: () => void, t: any }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Elemento carta non trovato')
      setIsProcessing(false)
      return
    }

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (stripeError) {
        setError(stripeError.message || 'Errore durante il pagamento')
        toast.error(stripeError.message || 'Errore durante il pagamento')
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Pagamento completato con successo!')
        onSuccess()
      } else {
        setError('Pagamento non completato')
        toast.error('Pagamento non completato')
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante il pagamento')
      toast.error(err.message || 'Errore durante il pagamento')
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600/90 hover:to-indigo-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t.checkout.guardian.processing}</span>
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            <span>{t.checkout.guardian.button}</span>
          </>
        )}
      </button>
    </form>
  )
}

// Componente separato che utilizza useSearchParams
function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth, user, setUser } = useAuthStore()
  const { t } = useLanguage()

  const [status, setStatus] = useState<'idle' | 'processing' | 'error' | 'cancelled' | 'success' | 'checkout'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [clientSecret, setClientSecret] = useState<string>('')
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')

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
        
        // Se abbiamo un client_secret, mostra il checkout personalizzato
        if (resp.data.client_secret) {
          setClientSecret(resp.data.client_secret)
          setPaymentIntentId(resp.data.payment_intent_id)
          setStatus('checkout')
        } else if (resp.data.checkout_url) {
          // Fallback al redirect Stripe se non abbiamo client_secret
          window.location.href = resp.data.checkout_url
        } else {
          throw new Error('URL di checkout non ricevuto')
        }
      } catch (err: any) {
        const backendMsg = err?.response?.data?.detail
        setErrorMessage(backendMsg || err?.message || 'Errore durante il reindirizzamento al pagamento')
        setStatus('error')
      }
    }

    ensureTokenAndCheckout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handlePaymentSuccess = async () => {
    try {
      // Conferma il pagamento con il backend
      await guardian.confirmPayment(paymentIntentId)
      
      // Aggiorna lo stato utente per mostrare Guardian attivo
      const auth = (await import('@/lib/api')).auth
      const me = await auth.me()
      setUser(me.data)
      
      setStatus('success')
      setErrorMessage('Guardian attivato! Reindirizzamento alla dashboard...')
      
      // Reindirizza immediatamente alla dashboard Guardian con parametro di refresh
      setTimeout(() => {
        router.push('/dashboard/guardian?refresh=true&subscription=success')
      }, 1500)
    } catch (error: any) {
      console.error('Errore nella conferma del pagamento:', error)
      toast.error('Errore nella conferma del pagamento. Contatta il supporto.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
      {/* Header migliorato */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Home className="w-8 h-8 text-purple-600" />
            <span className="text-xl font-bold text-dark">HostGPT Guardian</span>
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
                  Attiva Guardian
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                  Proteggi la soddisfazione dei tuoi ospiti
                </p>
              </motion.div>

              {status === 'checkout' && clientSecret && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white rounded-xl shadow-lg p-6 border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">{t.checkout.guardian.paymentTitle}</h2>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>

                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      clientSecret={clientSecret} 
                      onSuccess={handlePaymentSuccess}
                      t={t}
                    />
                  </Elements>

                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                      {t.checkout.guardian.termsText}{' '}
                      <Link href="/terms" className="text-purple-600 hover:underline">{t.checkout.guardian.termsLink}</Link>
                      {' '}e la{' '}
                      <Link href="/privacy" className="text-purple-600 hover:underline">{t.checkout.guardian.privacyLink}</Link>
                    </p>
                  </div>
                </motion.div>
              )}

              {status === 'processing' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center"
                >
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Preparazione...</h2>
                  <p className="text-gray-600">Attendi qualche secondo.</p>
                </motion.div>
              )}

              {status === 'cancelled' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center"
                >
                  <h2 className="text-xl font-semibold mb-2">Pagamento annullato</h2>
                  <p className="text-gray-600 mb-6">Puoi riprovare quando vuoi.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/dashboard/guardian" className="btn-secondary">Dashboard</Link>
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
                  <h2 className="text-xl font-semibold mb-2 text-green-600">Completato!</h2>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.checkout.guardian.summaryTitle}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.checkout.guardian.planName}</span>
                    <span className="font-semibold">9€/mese</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.checkout.guardian.billing}</span>
                    <span className="text-sm text-gray-500">{t.checkout.guardian.billingType}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>{t.checkout.guardian.total}</span>
                    <span>9€/mese</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-xl p-6 border border-purple-600/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.checkout.guardian.includes}</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{t.checkout.guardian.features.monitoring}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{t.checkout.guardian.features.alerts}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{t.checkout.guardian.features.detection}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{t.checkout.guardian.features.suggestions}</span>
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
        <p className="text-gray-600">Preparazione della pagina di checkout Guardian.</p>
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
