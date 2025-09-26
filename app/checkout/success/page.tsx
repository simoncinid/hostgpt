'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { subscription } from '@/lib/api'
import { useLanguage } from '@/lib/languageContext'
import SEOHead from '@/components/SEOHead'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setAuth, user, setUser } = useAuthStore()
  const { t } = useLanguage()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id')
    if (!sessionIdParam) {
      setStatus('error')
      setMessage('Session ID mancante')
      return
    }

    setSessionId(sessionIdParam)
    confirmSubscription(sessionIdParam)
  }, [searchParams])

  const confirmSubscription = async (sessionId: string) => {
    try {
      setStatus('loading')
      
      // Conferma la sottoscrizione
      const response = await subscription.confirm(sessionId)
      
      if (response.data.success) {
        setStatus('success')
        setMessage('Abbonamento attivato con successo!')
        
        // Aggiorna i dati dell'utente
        if (response.data.user) {
          setUser(response.data.user)
        }
        
        // Redirect alla dashboard dopo 3 secondi
        setTimeout(() => {
          router.push('/dashboard?subscription=success')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(response.data.message || 'Errore durante l\'attivazione dell\'abbonamento')
      }
    } catch (error: any) {
      console.error('Errore conferma abbonamento:', error)
      setStatus('error')
      setMessage(error?.response?.data?.detail || 'Errore durante la conferma del pagamento')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <SEOHead 
        title="Pagamento Completato - HostGPT"
        description="Il tuo abbonamento HostGPT è stato attivato con successo"
      />
      
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Conferma Pagamento
            </h1>
            <p className="text-gray-600">
              Stiamo verificando il tuo pagamento...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pagamento Completato!
            </h1>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500">
              Verrai reindirizzato alla dashboard tra qualche secondo...
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Vai alla Dashboard
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Errore
            </h1>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="mt-6 space-x-4">
              <button
                onClick={() => router.push('/checkout')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Riprova
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </>
        )}

        {sessionId && (
          <div className="mt-6 text-xs text-gray-400">
            Session ID: {sessionId}
          </div>
        )}
      </div>
    </div>
  )
}
