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
  MessageSquare,
  Users,
  Zap,
  Star,
  ArrowLeft
} from 'lucide-react'
import { subscription } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
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
function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) {
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
        // Pagamento completato con successo
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
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Dati carta</span>
            <div className="flex space-x-1">
              <div className="w-6 h-4 bg-gray-300 rounded"></div>
              <div className="w-6 h-4 bg-gray-300 rounded"></div>
              <div className="w-6 h-4 bg-gray-300 rounded"></div>
              <div className="w-6 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-primary to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Elaborazione pagamento...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Paga 29€/mese</span>
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
  const { setAuth, user } = useAuthStore()

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

        const resp = await subscription.createCheckout()
        
        // Controlla se l'abbonamento è stato riattivato
        if (resp.data.status === 'reactivated') {
          setStatus('success')
          setErrorMessage('Abbonamento riattivato con successo! Riprenderai a pagare regolarmente dal prossimo rinnovo. Reindirizzamento alla dashboard...')
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 3000)
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
      await subscription.confirmPayment(paymentIntentId)
      
      setStatus('success')
      setErrorMessage('Pagamento completato con successo! Il tuo abbonamento è ora attivo. Reindirizzamento alla dashboard...')
      
      // Reindirizza immediatamente alla dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    } catch (error: any) {
      console.error('Errore nella conferma del pagamento:', error)
      toast.error('Errore nella conferma del pagamento. Contatta il supporto.')
    }
  }

  const features = [
    { icon: <MessageSquare className="w-4 h-4" />, text: "1000 messaggi mensili" },
    { icon: <Users className="w-4 h-4" />, text: "Chatbot illimitati" },
    { icon: <Zap className="w-4 h-4" />, text: "Risposte istantanee" },
    { icon: <Star className="w-4 h-4" />, text: "Supporto prioritario" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header semplificato */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Home className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-dark">HostGPT</span>
          </Link>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Shield className="w-3 h-3" />
            <span className="hidden sm:inline">Pagamento sicuro</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Colonna sinistra - Form di pagamento */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Completa il tuo abbonamento
              </h1>
              <p className="text-gray-600 text-sm lg:text-base">
                Inizia subito a creare chatbot intelligenti
              </p>
            </motion.div>

            {status === 'checkout' && clientSecret && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Pagamento</h2>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Carta di credito</span>
                  </div>
                </div>

                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm 
                    clientSecret={clientSecret} 
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>

                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    Cliccando su "Paga" accetti i nostri{' '}
                    <Link href="/terms" className="text-primary hover:underline">Termini</Link>
                    {' '}e la{' '}
                    <Link href="/privacy" className="text-primary hover:underline">Privacy</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 lg:p-8 text-center"
              >
                <Loader2 className="w-10 h-10 lg:w-12 lg:h-12 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-lg lg:text-xl font-semibold mb-2">Preparazione pagamento…</h2>
                <p className="text-gray-600 text-sm lg:text-base">Attendi qualche secondo.</p>
              </motion.div>
            )}

            {status === 'cancelled' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 lg:p-8 text-center"
              >
                <h2 className="text-lg lg:text-xl font-semibold mb-2">Pagamento annullato</h2>
                <p className="text-gray-600 mb-6 text-sm lg:text-base">Puoi riprovare quando vuoi.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/dashboard" className="btn-secondary text-sm">Torna alla dashboard</Link>
                  <button
                    className="btn-primary text-sm"
                    onClick={() => router.replace('/checkout')}
                  >
                    Riprova pagamento
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 lg:p-8 text-center"
              >
                <h2 className="text-lg lg:text-xl font-semibold mb-2">Si è verificato un problema</h2>
                <p className="text-gray-600 mb-6 text-sm lg:text-base">{errorMessage}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/login" className="btn-secondary text-sm">Accedi</Link>
                  <button className="btn-primary text-sm" onClick={() => router.refresh()}>Riprova</button>
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 lg:p-8 text-center"
              >
                <CheckCircle className="w-12 h-12 lg:w-16 lg:h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-lg lg:text-xl font-semibold mb-2 text-green-600">Pagamento completato!</h2>
                <p className="text-gray-600 mb-6 text-sm lg:text-base">{errorMessage}</p>
                <div className="flex justify-center">
                  <Link href="/dashboard" className="btn-primary text-sm">Vai alla dashboard</Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* Colonna destra - Riepilogo semplificato */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4 lg:space-y-6"
          >
            <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Riepilogo</h3>
              
              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">HostGPT Pro</span>
                  <span className="font-semibold text-sm lg:text-base">29€/mese</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">Fatturazione</span>
                  <span className="text-xs lg:text-sm text-gray-500">Mensile</span>
                </div>
              </div>

              <div className="border-t pt-3 lg:pt-4 mt-3 lg:mt-4">
                <div className="flex items-center justify-between text-base lg:text-lg font-semibold">
                  <span>Totale</span>
                  <span>29€/mese</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-xl p-4 lg:p-6 border border-primary/20">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Cosa include</h3>
              <div className="space-y-2 lg:space-y-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className="flex items-center space-x-2 lg:space-x-3"
                  >
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <span className="text-gray-700 text-sm lg:text-base">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 lg:p-6 border border-blue-200">
              <div className="flex items-start space-x-2 lg:space-x-3">
                <Shield className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1 lg:mb-2 text-sm lg:text-base">Pagamento sicuro</h4>
                  <p className="text-xs lg:text-sm text-blue-700">
                    I tuoi dati sono protetti con crittografia SSL e gestiti da Stripe.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
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
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Caricamento…</h1>
        <p className="text-gray-600">Preparazione della pagina di checkout.</p>
      </div>
    </div>
  )
}

// Componente principale avvolto in Suspense
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  )
}


