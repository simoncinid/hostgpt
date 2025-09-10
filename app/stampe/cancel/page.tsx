'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  XCircle,
  ArrowLeft,
  ShoppingCart,
  Home
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import Sidebar from '@/app/components/Sidebar'

function CancelContent() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/stampe/cancel" onLogout={() => {}} isSidebarCollapsed={false} setIsSidebarCollapsed={() => {}} />
      
      <div className="md:ml-64 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Cancel Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Ordine Annullato
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Il pagamento è stato annullato.
            </p>
            <p className="text-gray-500">
              Non è stato addebitato alcun importo. Puoi riprovare quando vuoi.
            </p>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cosa è successo?</h2>
            
            <div className="space-y-3 text-gray-600">
              <p>• Hai annullato il processo di pagamento</p>
              <p>• Non è stato effettuato alcun addebito</p>
              <p>• I tuoi dati sono stati salvati e puoi riprovare</p>
              <p>• Il tuo carrello è ancora disponibile</p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/stampe"
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-xl font-semibold transition flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Riprova l'Ordine</span>
            </Link>
            
            <Link
              href="/dashboard"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Torna alla Dashboard</span>
            </Link>
          </motion.div>

          {/* Support Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-500 mb-2">
              Hai bisogno di aiuto?
            </p>
            <a
              href="mailto:support@hostgpt.it"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Contatta il Supporto
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function CancelPage() {
  return <CancelContent />
}
