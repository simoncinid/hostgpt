'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Check, 
  ArrowRight,
  Gift
} from 'lucide-react'
import OspiterAILogo from '../components/OspiterAILogo'
import { useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import api from '@/lib/api'

function SelectServiceContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { language, setLanguage, t } = useLanguage()

  const [isLoading, setIsLoading] = useState(true)
  const [isAnnualBilling, setIsAnnualBilling] = useState(false)

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

  // Genera i piani di pricing come nella landing page
  const pricingPlans = t.pricing.plans.map((plan: any, index: number) => {
    // Calcola il prezzo annuale (mensile * 10)
    const monthlyPrice = parseInt(plan.price.replace('€', ''))
    const annualPrice = monthlyPrice * 10
    
    return {
      name: plan.name,
      price: isAnnualBilling ? `€${annualPrice}` : plan.price,
      period: isAnnualBilling ? "/anno" : plan.period,
      features: plan.features,
      hasFreeTrial: true,
      ctaButton: plan.ctaButton,
      priceId: plan.priceId
    }
  })

  const handlePlanSelection = (priceId: string) => {
    router.push(`/checkout?plan=${priceId}&billing=${isAnnualBilling ? 'annual' : 'monthly'}`)
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
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-purple-100/40">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,207,232,0.15),transparent_50%)] opacity-80"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(244,63,94,0.08),transparent_60%)] opacity-70"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_30%_70%,transparent_0deg,rgba(251,207,232,0.1)_90deg,transparent_180deg)] opacity-60"></div>

      {/* Particelle fluttuanti eleganti */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-[15%] left-[10%] w-4 h-4 bg-purple-200/40 rounded-full"
          animate={{
            y: [0, -60, 0],
            x: [0, 30, 0],
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.8, 1]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-[25%] right-[15%] w-3 h-3 bg-purple-300/35 rounded-full"
          animate={{
            y: [0, -45, 0],
            x: [0, -25, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 2.2, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
        <motion.div 
          className="absolute top-[70%] left-[80%] w-2 h-2 bg-purple-400/30 rounded-full"
          animate={{
            y: [0, -35, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 6
          }}
        />
      </div>

      {/* Pattern geometrici sottili */}
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute top-10 left-10 w-32 h-32 text-purple-300" viewBox="0 0 100 100">
          <motion.circle
            cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle
            cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.3"
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        <svg className="absolute bottom-20 right-20 w-24 h-24 text-purple-200" viewBox="0 0 100 100">
          <motion.polygon
            points="50,15 85,85 15,85" fill="none" stroke="currentColor" strokeWidth="0.5"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <OspiterAILogo className="h-8 w-8" />
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header cinematografico */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="inline-block"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="text-gray-900 block">{t.selectService.title}</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto"
          >
            {t.selectService.subtitle}
          </motion.p>
        </motion.div>

        {/* Toggle Mensile/Annuale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50">
            <div className="flex items-center space-x-4">
              <span className={`text-sm font-medium transition-colors ${!isAnnualBilling ? 'text-gray-900' : 'text-gray-500'}`}>
                Mensile
              </span>
              <button
                onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isAnnualBilling ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                    isAnnualBilling ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${isAnnualBilling ? 'text-gray-900' : 'text-gray-500'}`}>
                Annuale
              </span>
              {isAnnualBilling && (
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Risparmia 2 mesi
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => {
            const isPopular = plan.name === "Premium"
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="relative w-full h-auto"
                style={{ perspective: '1200px' }}
              >
                <div className="relative w-full">
                  {/* Card quasi quadrata - ULTRA LUXURIOUS */}
                  <div 
                    className={`relative rounded-[2rem] p-4 md:p-8 overflow-hidden shadow-2xl flex flex-col ${
                      isPopular 
                        ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200/60 aspect-[3/2] md:aspect-[4/5]' 
                        : 'bg-white border border-gray-100/50 aspect-[3/2] md:aspect-[4/5]'
                    }`}
                    style={{ 
                      backfaceVisibility: 'hidden',
                      boxShadow: isPopular 
                        ? "0 25px 50px rgba(244, 63, 94, 0.15), 0 0 0 1px rgba(251, 207, 232, 0.2)"
                        : "0 25px 50px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)"
                    }}
                  >
                    {/* Background pattern interno */}
                    <div className={`absolute inset-0 ${
                      isPopular 
                        ? 'bg-gradient-to-br from-purple-50/40 via-transparent to-purple-100/30' 
                        : 'bg-gradient-to-br from-gray-50/20 via-transparent to-gray-50/10'
                    }`}></div>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${
                      isPopular 
                        ? 'bg-gradient-to-br from-purple-100/50 to-transparent' 
                        : 'bg-gradient-to-br from-gray-100/30 to-transparent'
                    }`}></div>
                    <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl ${
                      isPopular 
                        ? 'bg-gradient-to-tr from-purple-200/40 to-transparent' 
                        : 'bg-gradient-to-tr from-gray-100/20 to-transparent'
                    }`}></div>

                    {/* Header del piano */}
                    <div className="relative text-center mb-3 md:mb-6 flex-shrink-0">
                      <h3 className="text-xl md:text-3xl font-black text-gray-900 mb-2 md:mb-3">
                        {plan.name}
                      </h3>
                      
                      <div className="mb-3 md:mb-6">
                        <div className="text-3xl md:text-5xl font-black mb-1 md:mb-2">
                          <span className={`text-transparent bg-clip-text ${
                            isPopular 
                              ? 'bg-gradient-to-r from-purple-600 to-purple-700' 
                              : 'bg-gradient-to-r from-gray-700 to-gray-600'
                          }`}>
                            {plan.price}
                          </span>
                          <span className="text-base md:text-xl font-medium text-gray-600">
                            {plan.period}
                          </span>
                        </div>
                        
                        {/* Badge popolare per Premium */}
                        {isPopular && (
                          <div className="mb-1 md:mb-2">
                            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                              Più Popolare
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lista features ultra-stilizzata */}
                    <div className="flex-1 flex flex-col justify-center mb-3 md:mb-6">
                      <div className="space-y-2 md:space-y-3">
                        {plan.features.map((feature: string, i: number) => (
                          <div 
                            key={i} 
                            className="flex items-start group"
                          >
                            <div className={`flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center mr-2 md:mr-3 mt-0.5 shadow-lg ${
                              isPopular 
                                ? 'bg-gradient-to-r from-purple-600 to-purple-700' 
                                : 'bg-gradient-to-r from-gray-500 to-gray-600'
                            }`}>
                              <Check className="w-2 h-2 md:w-3 md:h-3 text-white font-bold" strokeWidth={3} />
                            </div>
                            <span className="text-gray-700 text-xs md:text-sm font-medium group-hover:text-gray-900 transition-colors duration-200">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottone CTA principale */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => handlePlanSelection(plan.priceId)}
                        className="block group w-full"
                      >
                        <div className={`text-white py-3 px-4 md:py-4 md:px-6 rounded-xl font-bold text-xs md:text-sm text-center shadow-lg overflow-hidden relative ${
                          isPopular 
                            ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700' 
                            : 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800'
                        }`}>
                          <span className="relative flex items-center justify-center">
                            {plan.ctaButton}
                            <div className="ml-1 md:ml-2">
                              <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                            </div>
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Decorazioni angolari */}
                    <div className={`absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 rounded-tl-lg ${
                      isPopular ? 'border-purple-200' : 'border-gray-200'
                    }`}></div>
                    <div className={`absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 rounded-tr-lg ${
                      isPopular ? 'border-purple-200' : 'border-gray-200'
                    }`}></div>
                    <div className={`absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 rounded-bl-lg ${
                      isPopular ? 'border-purple-200' : 'border-gray-200'
                    }`}></div>
                    <div className={`absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 rounded-br-lg ${
                      isPopular ? 'border-purple-200' : 'border-gray-200'
                    }`}></div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Back to Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center mt-12"
        >
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center"
          >
            ← {t.selectService.backToDashboard}
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default function SelectServicePage() {
  return <SelectServiceContent />
}
