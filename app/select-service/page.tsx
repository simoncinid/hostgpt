'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Star,
  Zap,
  Users,
  Gift
} from 'lucide-react'
import HostGPTLogo from '../components/HostGPTLogo'
import { useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import api from '@/lib/api'

function SelectServiceContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { language, setLanguage, t } = useLanguage()

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      try {
        const me = await api.get('/auth/me')
        const subscriptionStatus = me.data?.subscription_status
        
        // Solo utenti in free trial possono accedere a questa pagina
        if (subscriptionStatus !== 'free_trial') {
          router.push('/dashboard')
          return
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/login')
      }
    }

    checkUser()
  }, [isAuthenticated, router])

  const handleServiceSelection = (service: 'hostgpt' | 'guardian' | 'combined') => {
    if (service === 'hostgpt') {
      router.push('/checkout')
    } else if (service === 'guardian') {
      router.push('/checkout/guardian')
    } else if (service === 'combined') {
      router.push('/checkout/combined')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <HostGPTLogo className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900">HostGPT</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {t.selectService.freeTrialStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Gift className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t.selectService.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.selectService.subtitle}
            </p>
          </motion.div>
        </div>

        {/* Service Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* HostGPT Only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-200 transition-all duration-300"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t.selectService.hostgpt.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.selectService.hostgpt.description}
              </p>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                29€<span className="text-lg font-normal text-gray-500">/mese</span>
              </div>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t.selectService.hostgpt.features.conversations}
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t.selectService.hostgpt.features.chatbots}
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t.selectService.hostgpt.features.support}
                </li>
              </ul>
              <button
                onClick={() => handleServiceSelection('hostgpt')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {t.selectService.hostgpt.button}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </motion.div>

          {/* Guardian Only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-purple-200 transition-all duration-300"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t.selectService.guardian.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.selectService.guardian.description}
              </p>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                9€<span className="text-lg font-normal text-gray-500">/mese</span>
              </div>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t.selectService.guardian.features.analysis}
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t.selectService.guardian.features.reports}
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t.selectService.guardian.features.alerts}
                </li>
              </ul>
              <button
                onClick={() => handleServiceSelection('guardian')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {t.selectService.guardian.button}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </motion.div>

          {/* Combined Package */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-200 relative"
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {t.selectService.combined.badge}
              </span>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t.selectService.combined.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.selectService.combined.description}
              </p>
              <div className="text-3xl font-bold text-green-600 mb-2">
                38€<span className="text-lg font-normal text-gray-500">/mese</span>
              </div>
              <div className="text-sm text-gray-500 mb-4 line-through">
                {t.selectService.combined.originalPrice}
              </div>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t.selectService.combined.features.hostgpt}
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t.selectService.combined.features.guardian}
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t.selectService.combined.features.savings}
                </li>
              </ul>
              <button
                onClick={() => handleServiceSelection('combined')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {t.selectService.combined.button}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6 text-center"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t.selectService.benefits.title}
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              {t.selectService.benefits.cancelAnytime}
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              {t.selectService.benefits.securePayment}
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              {t.selectService.benefits.support}
            </div>
          </div>
        </motion.div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← {t.selectService.backToDashboard}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SelectServicePage() {
  return <SelectServiceContent />
}
