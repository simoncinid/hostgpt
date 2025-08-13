'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { subscription } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()

  const [status, setStatus] = useState<'idle' | 'processing' | 'error' | 'cancelled'>('idle')
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

        const resp = await subscription.createCheckout()
        const url: string | undefined = resp?.data?.checkout_url
        if (url) {
          window.location.href = url
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
        {status === 'processing' && (
          <>
            <h1 className="text-2xl font-semibold mb-2">Reindirizzamento al pagamento…</h1>
            <p className="text-gray-600">Attendi qualche secondo mentre prepariamo la sessione di checkout.</p>
          </>
        )}

        {status === 'cancelled' && (
          <>
            <h1 className="text-2xl font-semibold mb-2">Pagamento annullato</h1>
            <p className="text-gray-600 mb-6">Puoi riprovare quando vuoi.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard" className="btn-secondary">Torna alla dashboard</Link>
              <button
                className="btn-primary"
                onClick={() => router.replace('/checkout')}
              >
                Riprova pagamento
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-semibold mb-2">Si è verificato un problema</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="btn-secondary">Accedi</Link>
              <button className="btn-primary" onClick={() => router.refresh()}>Riprova</button>
            </div>
          </>
        )}

        {status === 'idle' && (
          <>
            <h1 className="text-2xl font-semibold mb-2">Preparazione pagamento…</h1>
            <p className="text-gray-600">Un istante.</p>
          </>
        )}
      </div>
    </div>
  )
}


