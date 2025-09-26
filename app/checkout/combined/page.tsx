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
  MessageSquare,
  Users,
  Zap,
  Star,
  AlertTriangle,
  Eye,
  Gift
} from 'lucide-react'
import HostGPTLogo from '../../components/HostGPTLogo'
import { subscription, referral } from '@/lib/api'
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
function CheckoutForm({ clientSecret, onSuccess, t }: { clientSecret: string, onSuccess: (referralCode?: string) => void, t: any }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null)
  const [referralCodeMessage, setReferralCodeMessage] = useState('')
  const [validatingCode, setValidatingCode] = useState(false)

  // Funzione per validare il referral code
  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralCodeValid(null)
      setReferralCodeMessage('')
      return
    }

    setValidatingCode(true)
    try {
      const response = await referral.validate(code.toUpperCase())
      const result = response.data
      
      if (result.valid) {
        setReferralCodeValid(true)
        setReferralCodeMessage(result.message)
        toast.success(result.message)
      } else {
        setReferralCodeValid(false)
        setReferralCodeMessage(result.message)
        toast.error(result.message)
      }
    } catch (error) {
      setReferralCodeValid(false)
      setReferralCodeMessage(t.checkout.combined.errorMessages.validationError)
      toast.error(t.checkout.combined.errorMessages.validationError)
    } finally {
      setValidatingCode(false)
    }
  }

  // Gestisce il cambio del referral code
  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value
    setReferralCode(code)
    
    // Valida il codice dopo un breve delay
    if (code.trim()) {
      const timeoutId = setTimeout(() => {
        validateReferralCode(code)
      }, 500)
      
      return () => clearTimeout(timeoutId)
    } else {
      setReferralCodeValid(null)
      setReferralCodeMessage('')
    }
  }

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
        setError(stripeError.message || t.checkout.combined.errorMessages.paymentError)
        toast.error(stripeError.message || t.checkout.combined.errorMessages.paymentError)
      } else if (paymentIntent.status === 'succeeded') {
        toast.success(t.checkout.combined.paymentSuccess)
        onSuccess(referralCodeValid && referralCode.trim() ? referralCode.toUpperCase() : undefined)
      } else {
        setError(t.checkout.combined.errorMessages.paymentNotCompleted)
        toast.error(t.checkout.combined.errorMessages.paymentNotCompleted)
      }
    } catch (err: any) {
      setError(err.message || t.checkout.combined.errorMessages.paymentError)
      toast.error(err.message || t.checkout.combined.errorMessages.paymentError)
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
      {/* Campo Referral Code */}
      <div className="space-y-2">
        <label htmlFor="referralCode" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Gift className="w-4 h-4" />
          <span>{t.checkout.combined.referralCode}</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="referralCode"
            value={referralCode}
            onChange={handleReferralCodeChange}
            placeholder={t.checkout.combined.referralCodePlaceholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              referralCodeValid === true 
                ? 'border-green-300 bg-green-50' 
                : referralCodeValid === false 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
          />
          {validatingCode && (
            <div className="absolute right-3 top-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}
          {referralCodeValid === true && (
            <div className="absolute right-3 top-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          )}
          {referralCodeValid === false && (
            <div className="absolute right-3 top-2">
              <div className="w-5 h-5 text-red-500">✕</div>
            </div>
          )}
        </div>
        {referralCodeMessage && (
          <p className={`text-sm ${
            referralCodeValid === true ? 'text-green-600' : 'text-red-600'
          }`}>
            {referralCodeMessage}
          </p>
        )}
        {!referralCodeMessage && (
          <p className="text-xs text-gray-500">
            {t.checkout.combined.referralCodeHelp}
          </p>
        )}
      </div>

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
        className="w-full bg-gradient-to-r from-primary via-purple-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-primary/90 hover:via-purple-600/90 hover:to-indigo-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t.checkout.combined.processing}</span>
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            <span>{t.checkout.combined.button}</span>
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

        const resp = await subscription.createCombinedCheckout()
        
        // Controlla se l'abbonamento è stato riattivato
        if (resp.data.status === 'reactivated') {
          setStatus('success')
          setErrorMessage('Abbonamento riattivato con successo!')
          setTimeout(() => {
            router.push('/dashboard?refresh=true&subscription=success')
          }, 2000)
          return
        }
        
        // Se abbiamo un client_secret, mostra il checkout personalizzato
        if (resp.data.client_secret) {
          setClientSecret(resp.data.client_secret)
          setPaymentIntentId(resp.data.payment_intent_id)
          setStatus('checkout')
        } else if (resp.data.checkout_url) {
          // Fallback al redirect Stripe se non abbiamo client_secret - redirect nella stessa pagina
          window.location.href = resp.data.checkout_url
        } else {
          throw new Error('URL di checkout non ricevuto')
        }
      } catch (err: any) {
        const backendMsg = err?.response?.data?.detail
        setErrorMessage(backendMsg || err?.message || t.checkout.combined.errorMessages.checkoutError)
        setStatus('error')
      }
    }

    ensureTokenAndCheckout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handlePaymentSuccess = async (referralCode?: string) => {
    try {
      // Conferma il pagamento combinato con il backend, includendo il referral code se presente
      const confirmData = referralCode 
        ? { payment_intent_id: paymentIntentId, referral_code: referralCode }
        : { payment_intent_id: paymentIntentId }
      
      await subscription.confirmCombinedPayment(paymentIntentId, confirmData)
      
      // Aggiorna lo stato utente per mostrare abbonamento attivo
      const auth = (await import('@/lib/api')).auth
      const me = await auth.me()
      setUser(me.data)
      
      setStatus('success')
      const successMessage = referralCode
        ? 'Pacchetto completo attivato con messaggi bonus! Reindirizzamento alla dashboard...'
        : 'Pacchetto completo attivato! Reindirizzamento alla dashboard...'
      setErrorMessage(successMessage)
      
      // Reindirizza immediatamente alla dashboard con parametro di refresh
      setTimeout(() => {
        router.push('/dashboard?refresh=true&subscription=success')
      }, 1500)
    } catch (error: any) {
      console.error('Errore nella conferma del pagamento:', error)
      toast.error(t.checkout.combined.errorMessages.paymentConfirmationError)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex flex-col">
      {/* Header migliorato */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <HostGPTLogo size="lg" className="text-primary" />
            <span className="text-xl font-bold text-dark">{t.checkout.combined.headerTitle}</span>
          </Link>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">{t.checkout.combined.securePayment}</span>
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
                  {t.checkout.combined.title}
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                  {t.checkout.combined.subtitle}
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
                    <h2 className="text-lg font-semibold text-gray-900">{t.checkout.combined.paymentTitle}</h2>
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
                      {t.checkout.combined.termsText}{' '}
                      <Link href="/terms" className="text-primary hover:underline">{t.checkout.combined.termsLink}</Link>
                      {' '}e la{' '}
                      <Link href="/privacy" className="text-primary hover:underline">{t.checkout.combined.privacyLink}</Link>
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
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">{t.checkout.combined.statusMessages.preparing}</h2>
                  <p className="text-gray-600">{t.checkout.combined.statusMessages.wait}</p>
                </motion.div>
              )}

              {status === 'cancelled' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center"
                >
                  <h2 className="text-xl font-semibold mb-2">{t.checkout.combined.statusMessages.cancelled}</h2>
                  <p className="text-gray-600 mb-6">{t.checkout.combined.statusMessages.youCanTryAgain}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/dashboard" className="btn-secondary">{t.checkout.combined.statusMessages.goToDashboard}</Link>
                    <button
                      className="btn-primary"
                      onClick={() => router.replace('/checkout/combined')}
                    >
                      {t.checkout.combined.statusMessages.tryAgain}
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
                  <h2 className="text-xl font-semibold mb-2">{t.checkout.combined.statusMessages.error}</h2>
                  <p className="text-gray-600 mb-6">{errorMessage}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/login" className="btn-secondary">{t.checkout.combined.statusMessages.login}</Link>
                    <button className="btn-primary" onClick={() => router.refresh()}>{t.checkout.combined.statusMessages.tryAgain}</button>
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
                  <h2 className="text-xl font-semibold mb-2 text-green-600">{t.checkout.combined.statusMessages.completed}</h2>
                  <p className="text-gray-600 mb-6">{errorMessage}</p>
                  <Link href="/dashboard" className="btn-primary">{t.checkout.combined.statusMessages.goToDashboard}</Link>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.checkout.combined.summaryTitle}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.checkout.combined.hostgptPro}</span>
                    <span className="font-semibold">19€/mese</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.checkout.combined.guardian}</span>
                    <span className="font-semibold">9€/mese</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.checkout.combined.billing}</span>
                    <span className="text-sm text-gray-500">{t.checkout.combined.billingType}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>{t.checkout.combined.total}</span>
                    <span>38€/mese</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-xl p-6 border border-primary/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.checkout.combined.includes}</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span className="text-gray-700">{t.checkout.combined.features.messages}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-gray-700">{t.checkout.combined.features.chatbots}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{t.checkout.combined.features.monitoring}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{t.checkout.combined.features.alerts}</span>
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
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Caricamento…</h1>
        <p className="text-gray-600">Preparazione della pagina di checkout combinato.</p>
      </div>
    </div>
  )
}

// Componente principale avvolto in Suspense
export default function CombinedCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  )
}
