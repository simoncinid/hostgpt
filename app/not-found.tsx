import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pagina Non Trovata - OspiterAI',
  description: 'La pagina che stai cercando non esiste. Torna alla homepage di OspiterAI per continuare a gestire i tuoi chatbot per affitti vacanza.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Pagina Non Trovata
          </h2>
          <p className="text-gray-600 mb-8">
            La pagina che stai cercando non esiste o è stata spostata.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Homepage
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>Oppure prova a:</p>
            <div className="mt-2 space-x-4">
              <Link href="/chatbots" className="text-blue-600 hover:underline">
                Gestisci Chatbot
              </Link>
              <Link href="/conversations" className="text-blue-600 hover:underline">
                Visualizza Conversazioni
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
