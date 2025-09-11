'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Package,
  ArrowRight,
  Home,
  Truck
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import Sidebar from '@/app/components/Sidebar'

// Componente di loading per il fallback di Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
        <p className="text-gray-600">Caricamento...</p>
      </div>
    </div>
  )
}

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const { t } = useLanguage()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      router.push('/stampe')
      return
    }

    // Simula il caricamento dei dati dell'ordine
    // In una implementazione reale, faresti una chiamata API per ottenere i dettagli
    const savedOrder = localStorage.getItem('printOrder')
    if (savedOrder) {
      setOrderData(JSON.parse(savedOrder))
      // Pulisci i dati dall'localStorage
      localStorage.removeItem('printOrder')
    }
  }, [isAuthenticated, searchParams])

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.stampe.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/stampe/success" onLogout={() => {}} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} p-4 md:p-8`}>
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t.stampe.success.title}
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              {t.stampe.success.subtitle}
            </p>
            <p className="text-gray-500">
              {t.stampe.success.emailConfirmation}
            </p>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t.stampe.success.orderSummary}</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t.stampe.success.chatbot}</span>
                <span className="font-semibold">{orderData.chatbot.property_name}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t.stampe.success.products}</span>
                <span className="font-semibold">{orderData.totalItems} articoli</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Subtotale</span>
                <span>€{orderData.totalPrice.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Spedizione</span>
                <span>€4.99</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t.stampe.success.total}</span>
                <span className="font-bold text-lg text-primary">€{(orderData.totalPrice + 4.99).toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t.stampe.success.nextSteps}</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.stampe.success.production}</h3>
                  <p className="text-sm text-gray-600">
                    {t.stampe.success.productionDescription}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-green-600" />
                </div>
                <div>
                                   <h3 className="font-semibold text-gray-900">{t.stampe.success.shipping}</h3>
                  <p className="text-sm text-gray-600">
                    {t.stampe.success.shippingDescription}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.stampe.success.delivery}</h3>
                  <p className="text-sm text-gray-600">
                    {t.stampe.success.deliveryDescription}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/dashboard"
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-xl font-semibold transition flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>{t.stampe.success.backToDashboard}</span>
            </Link>
            
            <Link
              href="/stampe"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition flex items-center justify-center space-x-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span>{t.stampe.success.orderMore}</span>
            </Link>
          </motion.div>

          {/* Support Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-500 mb-2">
              {t.stampe.success.supportQuestion}
            </p>
            <a
              href="mailto:support@hostgpt.it"
              className="text-primary hover:text-primary/80 font-medium"
            >
              {t.stampe.success.contactSupport}
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  )
}

// Disabilita prerendering per questa pagina
export const dynamic = 'force-dynamic'
