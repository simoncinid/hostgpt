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
  Gift
} from 'lucide-react'
import OspiterAILogo from '../components/OspiterAILogo'
import api, { subscription, referral } from '@/lib/api'
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

// Mappa i piani ai dettagli e price_id
const getPlanDetails = (planName: string, billing: string) => {
  const plans = {
    'STANDARD': {
      name: 'Standard',
      monthly: {
        price: '19€',
        period: '/mese',
        priceId: 'STANDARD_PRICE_ID'
      },
      annual: {
        price: '190€',
        period: '/anno', 
        priceId: 'ANNUAL_STANDARD_PRICE_ID'
      },
      conversations: '20 conversazioni/mese',
      features: ['20 conversazioni/mese', 'Chatbot illimitati', 'Supporto email']
    },
    'PREMIUM': {
      name: 'Premium',
      monthly: {
        price: '39€',
        period: '/mese',
        priceId: 'PREMIUM_PRICE_ID'
      },
      annual: {
        price: '390€',
        period: '/anno',
        priceId: 'ANNUAL_PREMIUM_PRICE_ID'
      },
      conversations: '50 conversazioni/mese',
      features: ['50 conversazioni/mese', 'Chatbot illimitati', 'Supporto prioritario']
    },
    'PRO': {
      name: 'Pro',
      monthly: {
        price: '79€',
        period: '/mese',
        priceId: 'PRO_PRICE_ID'
      },
      annual: {
        price: '790€',
        period: '/anno',
        priceId: 'ANNUAL_PRO_PRICE_ID'
      },
      conversations: '150 conversazioni/mese',
      features: ['150 conversazioni/mese', 'Chatbot illimitati', 'Supporto prioritario']
    },
    'ENTERPRISE': {
      name: 'Enterprise',
      monthly: {
        price: '199€',
        period: '/mese',
        priceId: 'ENTERPRISE_PRICE_ID'
      },
      annual: {
        price: '1990€',
        period: '/anno',
        priceId: 'ANNUAL_ENTERPRISE_PRICE_ID'
      },
      conversations: '500 conversazioni/mese',
      features: ['500 conversazioni/mese', 'Chatbot illimitati', 'Supporto dedicato']
    }
  }
  
  const plan = plans[planName as keyof typeof plans]
  if (!plan) {
    // Fallback al piano Standard
    const fallback = plans.STANDARD
    const billingType = billing === 'annual' ? 'annual' : 'monthly'
    return {
      ...fallback,
      price: fallback[billingType].price,
      period: fallback[billingType].period,
      priceId: fallback[billingType].priceId
    }
  }
  
  const billingType = billing === 'annual' ? 'annual' : 'monthly'
  return {
    ...plan,
    price: plan[billingType].price,
    period: plan[billingType].period,
    priceId: plan[billingType].priceId
  }
}

// Componente per il form di pagamento
function CheckoutForm({ clientSecret, onSuccess, selectedPlan, t }: { clientSecret: string, onSuccess: (referralCode?: string) => void, selectedPlan: any, t: any }) {
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
      setReferralCodeMessage('Errore nella validazione del codice')
      toast.error('Errore nella validazione del codice')
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
        setError(stripeError.message || 'Errore durante il pagamento')
        toast.error(stripeError.message || 'Errore durante il pagamento')
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Pagamento completato con successo!')
        onSuccess(referralCodeValid && referralCode.trim() ? referralCode.toUpperCase() : undefined)
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
      {/* Campo Referral Code */}
      <div className="space-y-2">
        <label htmlFor="referralCode" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Gift className="w-4 h-4" />
          <span>{t.checkout.monthly.referralCode}</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="referralCode"
            value={referralCode}
            onChange={handleReferralCodeChange}
            placeholder={t.checkout.monthly.referralCodePlaceholder}
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
            {t.checkout.monthly.referralCodeHelp}
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
        className="w-full bg-gradient-to-r from-primary to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t.checkout.monthly.processing}</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>
              {selectedPlan 
                ? `${t.checkout.monthly.button} - ${selectedPlan.price}${selectedPlan.period}`
                : t.checkout.monthly.button
              }
            </span>
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
  const { t, setLanguage } = useLanguage()

  const [status, setStatus] = useState<'idle' | 'processing' | 'error' | 'cancelled' | 'success' | 'checkout'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [clientSecret, setClientSecret] = useState<string>('')
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')
  const [selectedPlan, setSelectedPlan] = useState<any>(null)

  useEffect(() => {
    const cancelled = searchParams.get('subscription') === 'cancelled'
    if (cancelled) {
      setStatus('cancelled')
      return
    }

    const tokenFromUrl = searchParams.get('token')
    const existingToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    // Leggi i parametri del piano dall'URL
    const planParam = searchParams.get('plan')
    const billingParam = searchParams.get('billing')

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
          setErrorMessage(t.checkout.monthly.errorMessages.missingToken)
          return
        }

        // Ottieni le informazioni dell'utente per impostare la lingua corretta e il piano
        let userDesiredPlan = null
        try {
          const me = await api.get('/auth/me')
          const userLanguage = me.data?.language
          userDesiredPlan = me.data?.desired_plan
          
          if (userLanguage && (userLanguage === 'en' || userLanguage === 'it')) {
            // Converti la lingua dal backend al formato del frontend
            const frontendLanguage = userLanguage === 'en' ? 'ENG' : 'IT'
            setLanguage(frontendLanguage)
          }
        } catch (error) {
          console.warn('Could not fetch user language:', error)
        }

        // Determina il piano e il billing
        let planName = 'STANDARD'
        let billing = 'monthly'
        
        if (planParam) {
          // Caso 1: Arrivo da selezione servizi con parametri URL
          // Costruisci il price_id corretto basandosi sui parametri
          let priceIdToUse = planParam
          
          if (billingParam === 'annual' && !planParam.startsWith('ANNUAL_')) {
            // Se è annuale ma il price_id non ha il prefisso ANNUAL_, aggiungilo
            priceIdToUse = `ANNUAL_${planParam}`
          } else if (billingParam === 'monthly' && planParam.startsWith('ANNUAL_')) {
            // Se è mensile ma il price_id ha il prefisso ANNUAL_, rimuovilo
            priceIdToUse = planParam.replace('ANNUAL_', '')
          }
          
          // Mappa i price_id ai nomi dei piani
          const planMapping: { [key: string]: string } = {
            'STANDARD_PRICE_ID': 'STANDARD',
            'PREMIUM_PRICE_ID': 'PREMIUM', 
            'PRO_PRICE_ID': 'PRO',
            'ENTERPRISE_PRICE_ID': 'ENTERPRISE',
            'ANNUAL_STANDARD_PRICE_ID': 'STANDARD',
            'ANNUAL_PREMIUM_PRICE_ID': 'PREMIUM',
            'ANNUAL_PRO_PRICE_ID': 'PRO',
            'ANNUAL_ENTERPRISE_PRICE_ID': 'ENTERPRISE'
          }
          
          planName = planMapping[priceIdToUse] || 'STANDARD'
          
          // Determina se è annuale basandosi sul price_id finale
          if (priceIdToUse.startsWith('ANNUAL_')) {
            billing = 'annual'
          }
        } else if (userDesiredPlan) {
          // Caso 2: Arrivo da email di verifica, usa il desired_plan dell'utente
          const planMapping: { [key: string]: string } = {
            'STANDARD_PRICE_ID': 'STANDARD',
            'PREMIUM_PRICE_ID': 'PREMIUM', 
            'PRO_PRICE_ID': 'PRO',
            'ENTERPRISE_PRICE_ID': 'ENTERPRISE',
            'ANNUAL_STANDARD_PRICE_ID': 'STANDARD',
            'ANNUAL_PREMIUM_PRICE_ID': 'PREMIUM',
            'ANNUAL_PRO_PRICE_ID': 'PRO',
            'ANNUAL_ENTERPRISE_PRICE_ID': 'ENTERPRISE'
          }
          
          planName = planMapping[userDesiredPlan] || 'STANDARD'
          
          // Determina se è annuale basandosi sul price_id
          if (userDesiredPlan.startsWith('ANNUAL_')) {
            billing = 'annual'
          }
        }
        
        if (billingParam) {
          billing = billingParam
        }

        // Imposta il piano selezionato
        const planDetails = getPlanDetails(planName, billing)
        setSelectedPlan(planDetails)

        // Crea il checkout con il price_id corretto
        let priceIdToSend = planDetails.priceId
        
        if (planParam) {
          // Caso 1: Arrivo da selezione servizi, usa il price_id costruito
          let constructedPriceId = planParam
          if (billingParam === 'annual' && !planParam.startsWith('ANNUAL_')) {
            constructedPriceId = `ANNUAL_${planParam}`
          } else if (billingParam === 'monthly' && planParam.startsWith('ANNUAL_')) {
            constructedPriceId = planParam.replace('ANNUAL_', '')
          }
          priceIdToSend = constructedPriceId
        } else if (userDesiredPlan) {
          // Caso 2: Arrivo da email di verifica, usa il desired_plan dell'utente
          priceIdToSend = userDesiredPlan
        }
        
        const resp = await subscription.createCheckout(priceIdToSend, billingParam || 'monthly')
        
        // Controlla se l'abbonamento è stato riattivato
        if (resp.data.status === 'reactivated') {
          setStatus('success')
          setErrorMessage('Abbonamento riattivato con successo!')
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000)
          return
        }
        
        // Redirect alla checkout session di Stripe nella stessa pagina
        if (resp.data.checkout_url) {
          window.location.href = resp.data.checkout_url
        } else if (resp.data.client_secret) {
          // Fallback al checkout personalizzato se non abbiamo checkout_url
          setClientSecret(resp.data.client_secret)
          setPaymentIntentId(resp.data.payment_intent_id)
          setStatus('checkout')
        } else {
          throw new Error('URL di checkout non ricevuto')
        }
      } catch (err: any) {
        const backendMsg = err?.response?.data?.detail
        setErrorMessage(backendMsg || err?.message || t.checkout.monthly.errorMessages.checkoutError)
        setStatus('error')
      }
    }

    ensureTokenAndCheckout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handlePaymentSuccess = async (referralCode?: string) => {
    try {
      // Conferma il pagamento con il backend, includendo il referral code se presente
      const confirmData = referralCode 
        ? { payment_intent_id: paymentIntentId, referral_code: referralCode }
        : { payment_intent_id: paymentIntentId }
      
      await subscription.confirmPayment(paymentIntentId, confirmData)
      
      // Aggiorna lo stato utente per mostrare abbonamento attivo
      const auth = (await import('@/lib/api')).auth
      const me = await auth.me()
      setUser(me.data)
      
      setStatus('success')
      const successMessage = referralCode
        ? t.checkout.monthly.successMessageWithBonus
        : t.checkout.monthly.successMessage
      setErrorMessage(successMessage)
      
      // Reindirizza immediatamente alla dashboard con parametro di refresh
      setTimeout(() => {
        router.push('/dashboard?refresh=true&subscription=success')
      }, 1500)
    } catch (error: any) {
      console.error('Errore nella conferma del pagamento:', error)
      toast.error('Errore nella conferma del pagamento. Contatta il supporto.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header migliorato */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <OspiterAILogo size="lg" className="text-primary" />
            <span className="text-xl font-bold text-dark">OspiterAI</span>
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
                  {t.checkout.monthly.title}
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                  {t.checkout.monthly.subtitle}
                </p>
              </motion.div>

              {/* Piano selezionato */}

              {status === 'checkout' && clientSecret && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white rounded-xl shadow-lg p-6 border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">{t.checkout.monthly.paymentTitle}</h2>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>

                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      clientSecret={clientSecret} 
                      onSuccess={handlePaymentSuccess}
                      selectedPlan={selectedPlan}
                      t={t}
                    />
                  </Elements>

                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                      {t.checkout.monthly.termsText}{' '}
                      <Link href="/terms" className="text-primary hover:underline">{t.checkout.monthly.termsLink}</Link>
                      {' '}e la{' '}
                      <Link href="/privacy" className="text-primary hover:underline">{t.checkout.monthly.privacyLink}</Link>
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
                  <h2 className="text-xl font-semibold mb-2">{t.checkout.monthly.statusMessages.preparing}</h2>
                  <p className="text-gray-600">{t.checkout.monthly.statusMessages.wait}</p>
                </motion.div>
              )}

              {status === 'cancelled' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 text-center"
                >
                  <h2 className="text-xl font-semibold mb-2">{t.checkout.monthly.statusMessages.cancelled}</h2>
                  <p className="text-gray-600 mb-6">Puoi riprovare quando vuoi.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/dashboard" className="btn-secondary">Dashboard</Link>
                    <button
                      className="btn-primary"
                      onClick={() => router.replace('/checkout')}
                    >
{t.checkout.monthly.statusMessages.tryAgain}
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
                  <h2 className="text-xl font-semibold mb-2">{t.common.error}</h2>
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
                  <h2 className="text-xl font-semibold mb-2 text-green-600">{t.checkout.monthly.statusMessages.completed}</h2>
                  <p className="text-gray-600 mb-6">{errorMessage}</p>
                  <Link href="/dashboard" className="btn-primary">{t.checkout.monthly.statusMessages.goToDashboard}</Link>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.checkout.monthly.summaryTitle}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">OspiterAI {selectedPlan?.name || 'Standard'}</span>
                    <span className="font-semibold">{selectedPlan?.price || '19€'}{selectedPlan?.period || '/mese'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.checkout.monthly.billing}</span>
                    <span className="text-sm text-gray-500">{selectedPlan?.period === '/anno' ? 'Annuale' : 'Mensile'}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>{t.checkout.monthly.total}</span>
                    <span>{selectedPlan?.price || '19€'}{selectedPlan?.period || '/mese'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-xl p-6 border border-primary/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.checkout.monthly.includes}</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span className="text-gray-700">{selectedPlan?.conversations || '20 conversazioni/mese'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-gray-700">{t.checkout.monthly.features.chatbots}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="text-gray-700">{t.checkout.monthly.features.responses}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-primary" />
                    <span className="text-gray-700">{t.checkout.monthly.features.support}</span>
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
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2">{t.checkout.loading}</h1>
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


