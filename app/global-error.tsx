'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Errore Critico
              </h2>
              <p className="text-gray-600 mb-8">
                Si è verificato un errore critico dell'applicazione. Riprova tra qualche minuto.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={reset}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Riprova
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
