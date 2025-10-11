'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Check, 
  ArrowRight,
  Gift,
  Shield
} from 'lucide-react'
import OspiterAILogo from '../components/OspiterAILogo'
import { useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import api from '@/lib/api'

function SelectServiceCombinedContent() {
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

  // Genera i piani di pricing con i costi Guardian inclusi
  const pricingPlans = t.pricing.plans.map((plan: any, index: number) => {
    // Calcola il prezzo annuale (mensile * 10)
    const monthlyPrice = parseInt(plan.price.replace('€', ''))
    const annualPrice = monthlyPrice * 10
    
    // Calcola il prezzo Guardian basato sul piano (sempre mensile)
    let guardianPrice = 9 // Standard
    if (monthlyPrice >= 199) guardianPrice = 89 // Enterprise
    else if (monthlyPrice >= 79) guardianPrice = 36 // Pro
    else if (monthlyPrice >= 39) guardianPrice = 18 // Premium
    
    // Per il totale: se annuale = prezzo annuale OspiterAI + primo mese Guardian
    // Se mensile = prezzo mensile OspiterAI + prezzo mensile Guardian
    const totalPrice = isAnnualBilling ? annualPrice + guardianPrice : monthlyPrice + guardianPrice
    
    return {
      name: plan.name,
      price: `€${totalPrice}`,
      period: isAnnualBilling ? "/anno" : "/mese",
      ospiteraiPrice: isAnnualBilling ? `€${annualPrice}` : plan.price,
      guardianPrice: `€${guardianPrice}`, // Sempre mensile
      guardianPriceMonthly: guardianPrice, // Per i calcoli
      features: plan.features,
      hasFreeTrial: true,
      ctaButton: plan.ctaButton,
      priceId: plan.priceId,
      guardianPriceId: getGuardianPriceId(monthlyPrice),
      isAnnualBilling: isAnnualBilling
    }
  })

  function getGuardianPriceId(monthlyPrice: number): string {
    if (monthlyPrice >= 199) return 'ENTERPRISE_GUARDIAN_PRICE_ID'
    else if (monthlyPrice >= 79) return 'PRO_GUARDIAN_PRICE_ID'
    else if (monthlyPrice >= 39) return 'PREMIUM_GUARDIAN_PRICE_ID'
    else return 'STANDARD_GUARDIAN_PRICE_ID'
  }

  const handlePlanSelection = (priceId: string, guardianPriceId: string) => {
    // Per il billing annuale, dobbiamo gestire diversamente:
    // - OspiterAI: annuale
    // - Guardian: sempre mensile
    if (isAnnualBilling) {
      // Per il billing annuale, passiamo un flag speciale
      router.push(`/checkout?plan=${priceId}&guardian=${guardianPriceId}&billing=annual&guardian_billing=monthly`)
    } else {
      // Per il billing mensile, tutto normale
      router.push(`/checkout?plan=${priceId}&guardian=${guardianPriceId}&billing=monthly`)
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
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-purple-100/40">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(111,51,223,0.15),transparent_50%)] opacity-80"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(56,135,83,0.08),transparent_60%)] opacity-70"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_30%_70%,transparent_0deg,rgba(111,51,223,0.1)_90deg,transparent_180deg)] opacity-60"></div>

      {/* Particelle fluttuanti eleganti */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-300 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-green-300 rounded-full animate-pulse opacity-40" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse opacity-50" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/6 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-pulse opacity-30" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-green-300 rounded-full animate-pulse opacity-40" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-sm border-b border-white/20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <OspiterAILogo />
              
              {/* Language Selector */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLanguage('IT')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    language === 'IT' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  IT
                </button>
                <button
                  onClick={() => setLanguage('ENG')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    language === 'ENG' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  ENG
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Gift className="w-4 h-4 mr-2" />
              {t.selectService.freeTrialStatus}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.selectService.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t.selectService.subtitle}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className={`text-sm font-medium ${!isAnnualBilling ? 'text-gray-900' : 'text-gray-500'}`}>
                Mensile
              </span>
              <button
                onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnualBilling ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnualBilling ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isAnnualBilling ? 'text-gray-900' : 'text-gray-500'}`}>
                Annuale
              </span>
              {isAnnualBilling && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Risparmia 2 mesi
                </span>
              )}
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {pricingPlans.map((plan, index) => {
              const isPopular = plan.name === "Premium"
              
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                    isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Più Popolare
                      </span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600 ml-1">{plan.period}</span>
                      </div>
                      
                      {/* Breakdown dei prezzi */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600">OspiterAI:</span>
                          <span className="font-medium">{plan.ospiteraiPrice}{isAnnualBilling ? '/anno' : '/mese'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            Guardian:
                          </span>
                          <span className="font-medium">{plan.guardianPrice}/mese</span>
                        </div>
                        {isAnnualBilling && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              <strong>Nota:</strong> Il totale include solo il primo mese di Guardian. 
                              Pagherai {plan.guardianPriceMonthly}€/mese per Guardian nei mesi successivi.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature: string, featureIndex: number) => (
                        <li key={featureIndex} className="flex items-center text-gray-600">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      <li className="flex items-center text-gray-600">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="flex items-center">
                          <Shield className="w-4 h-4 mr-1" />
                          Guardian incluso
                        </span>
                      </li>
                    </ul>
                    
                    <button
                      onClick={() => handlePlanSelection(plan.priceId, plan.guardianPriceId)}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        isPopular
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {plan.ctaButton}
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </button>
                  </div>
                  
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-6 h-6">
                    <div className={`absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 rounded-tl-lg ${
                      isPopular ? 'border-purple-200' : 'border-gray-200'
                    }`}></div>
                    <div className={`absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 rounded-br-lg ${
                      isPopular ? 'border-purple-200' : 'border-gray-200'
                    }`}></div>
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
    </div>
  )
}

export default function SelectServiceCombinedPage() {
  return <SelectServiceCombinedContent />
}
