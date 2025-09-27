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
import { useLanguage } from '@/lib/languageContext'
import Sidebar from '@/app/components/Sidebar'

function CancelContent() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { t } = useLanguage()

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
              {t.stampe.cancel.title}
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              {t.stampe.cancel.subtitle}
            </p>
            <p className="text-gray-500">
              {t.stampe.cancel.noCharge}
            </p>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t.stampe.cancel.whatHappened}</h2>
            
            <div className="space-y-3 text-gray-600">
              <p>{t.stampe.cancel.whatHappened1}</p>
              <p>{t.stampe.cancel.whatHappened2}</p>
              <p>{t.stampe.cancel.whatHappened3}</p>
              <p>{t.stampe.cancel.whatHappened4}</p>
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
              <span>{t.stampe.cancel.retryOrder}</span>
            </Link>
            
            <Link
              href="/dashboard"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>{t.stampe.cancel.backToDashboard}</span>
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
              {t.stampe.cancel.needHelp}
            </p>
            <a
              href="mailto:support@ospiterai.it"
              className="text-primary hover:text-primary/80 font-medium"
            >
              {t.stampe.cancel.contactSupport}
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

// Disabilita prerendering per questa pagina
export const dynamic = 'force-dynamic'
