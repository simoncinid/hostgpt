'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Errore del Server
          </h2>
          <p className="text-gray-600 mb-8">
            Si è verificato un errore interno del server. Riprova tra qualche minuto.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
          >
            Riprova
          </button>
          
          <Link 
            href="/"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Torna alla Homepage
          </Link>
          
          <div className="text-sm text-gray-500 mt-6">
            <p>Se il problema persiste, contatta il supporto.</p>
            <div className="mt-2 space-x-4">
              <Link href="/chatbots" className="text-blue-600 hover:underline">
                Gestisci Chatbot
              </Link>
              <Link href="/dashboard" className="text-blue-600 hover:underline">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
