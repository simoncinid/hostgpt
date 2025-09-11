'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  QrCode,
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  Star,
  Truck,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuthStore, useChatbotStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import { chatbots as chatbotsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  features: string[]
  type: 'sticker'
}

const products: Product[] = [
  {
    id: 'sticker',
    name: 'Adesivi QR-Code', // This will be replaced by t.stampe.products.sticker.name in the component
    description: 'Adesivi resistenti all\'acqua e ai raggi UV, perfetti per interni ed esterni', // This will be replaced by t.stampe.products.sticker.description in the component
    price: 5.99,
    image: '/icons/sticker-placeholder.png',
    features: [
      'Resistenti all\'acqua',
      'Adesivi ai raggi UV',
      'Dimensioni 5.83″×8.27″',
      'Spedizione worldwide €4.99'
    ], // This will be replaced by t.stampe.products.sticker.features in the component
    type: 'sticker'
  }
]

function StampeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const { chatbots } = useChatbotStore()
  const { t } = useLanguage()
  
  const [selectedChatbot, setSelectedChatbot] = useState<any>(null)
  const [quantities, setQuantities] = useState<{[key: string]: number}>({
    sticker: 0,
    desk_plate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentChatbotPage, setCurrentChatbotPage] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    // Carica chatbot se non sono già caricati
    if (chatbots.length === 0) {
      loadChatbots()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, chatbots.length])

  const loadChatbots = async () => {
    try {
      const response = await chatbotsApi.list()
      setIsLoading(false)
    } catch (error) {
      toast.error(t.stampe.toasts.errorLoadingChatbots)
      setIsLoading(false)
    }
  }

  const handleQuantityChange = (productId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, prev[productId] + change)
    }))
  }

  const getTotalPrice = () => {
    return products.reduce((total, product) => {
      return total + (product.price * quantities[product.id])
    }, 0)
  }

  const getTotalItems = () => {
    return Object.values(quantities).reduce((total, qty) => total + qty, 0)
  }

  // Funzioni per la paginazione chatbot
  const chatbotsPerPage = 1
  const totalChatbotPages = Math.ceil(chatbots.length / chatbotsPerPage)
  const currentChatbot = chatbots[currentChatbotPage]

  const goToNextChatbot = () => {
    if (currentChatbotPage < totalChatbotPages - 1) {
      setCurrentChatbotPage(currentChatbotPage + 1)
      setSelectedChatbot(null) // Reset selezione quando si cambia pagina
    }
  }

  const goToPrevChatbot = () => {
    if (currentChatbotPage > 0) {
      setCurrentChatbotPage(currentChatbotPage - 1)
      setSelectedChatbot(null) // Reset selezione quando si cambia pagina
    }
  }

  const handleProceedToCheckout = () => {
    if (!selectedChatbot) {
      toast.error(t.stampe.toasts.selectChatbot)
      return
    }
    
    if (getTotalItems() === 0) {
      toast.error(t.stampe.toasts.selectProduct)
      return
    }

    // Salva i dati dell'ordine nel localStorage per il checkout
    const orderData = {
      chatbot: selectedChatbot,
      products: products.map(product => ({
        ...product,
        quantity: quantities[product.id]
      })).filter(item => item.quantity > 0),
      totalPrice: getTotalPrice(),
      totalItems: getTotalItems()
    }
    
    localStorage.setItem('printOrder', JSON.stringify(orderData))
    router.push('/stampe/checkout')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.stampe.loading}</p>
        </div>
      </div>
    )
  }

  if (chatbots.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar currentPath="/stampe" onLogout={() => {}} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
        <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} p-4 md:p-8`}>
          <div className="text-center py-12">
            <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.stampe.noChatbots}</h2>
            <p className="text-gray-600 mb-6">{t.stampe.noChatbotsMessage}</p>
            <Link href="/dashboard/chatbots/create" className="btn-primary">
              {t.stampe.createFirstChatbot}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/stampe" onLogout={() => {}} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} p-4 md:p-8`}>
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.stampe.backToDashboard}
          </Link>
          <h1 className="text-3xl font-bold text-dark mb-2">
            {t.stampe.title}
          </h1>
          <p className="text-gray-600">
            {t.stampe.subtitle}
          </p>
        </div>

        {/* Layout Mobile - Invariato */}
        <div className="block lg:hidden">
          <div className="grid grid-cols-1 gap-8">
            {/* Selezione Chatbot */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-dark">{t.stampe.selectChatbot}</h2>
                  {totalChatbotPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {currentChatbotPage + 1} / {totalChatbotPages}
                      </span>
                    </div>
                  )}
                </div>
                
                {currentChatbot && (
                  <motion.div
                    key={currentChatbot.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      selectedChatbot?.id === currentChatbot.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedChatbot(currentChatbot)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedChatbot?.id === currentChatbot.id 
                          ? 'border-primary bg-primary' 
                          : 'border-gray-300'
                      }`}>
                        {selectedChatbot?.id === currentChatbot.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{currentChatbot.property_name}</h3>
                        <p className="text-sm text-gray-500">{currentChatbot.property_city}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navigazione paginazione */}
                {totalChatbotPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={goToPrevChatbot}
                      disabled={currentChatbotPage === 0}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-primary disabled:text-gray-300 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Precedente</span>
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: totalChatbotPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setCurrentChatbotPage(i)
                            setSelectedChatbot(null)
                          }}
                          className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                            i === currentChatbotPage
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={goToNextChatbot}
                      disabled={currentChatbotPage === totalChatbotPages - 1}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-primary disabled:text-gray-300 disabled:cursor-not-allowed transition"
                    >
                      <span>Successivo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Anteprima QR-Code */}
              {selectedChatbot && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-dark mb-4">{t.stampe.qrPreview}</h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <img
                      src={`data:image/png;base64,${selectedChatbot.qr_code}`}
                      alt="QR Code"
                      className="w-32 h-32 mx-auto mb-3"
                    />
                    <p className="text-sm text-gray-600">{selectedChatbot.property_name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Prodotti */}
            <div>
              <div className="grid grid-cols-1 gap-6 mb-8 max-w-md mx-auto">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="text-center mb-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-dark">{t.stampe.products.sticker.name}</h3>
                      <p className="text-gray-600 text-sm mt-2">{t.stampe.products.sticker.description}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {t.stampe.products.sticker.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">€{product.price.toFixed(2)}</span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(product.id, -1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                          disabled={quantities[product.id] === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{quantities[product.id]}</span>
                        <button
                          onClick={() => handleQuantityChange(product.id, 1)}
                          className="w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Riepilogo Ordine */}
              {getTotalItems() > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                >
                  <h3 className="text-lg font-bold text-dark mb-4">{t.stampe.orderSummary}</h3>
                  <div className="space-y-3">
                    {products.map(product => {
                      if (quantities[product.id] === 0) return null
                      return (
                        <div key={product.id} className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {product.name} x{quantities[product.id]}
                          </span>
                          <span className="font-semibold">
                            €{(product.price * quantities[product.id]).toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-dark">{t.stampe.total}</span>
                        <span className="text-xl font-bold text-primary">€{getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Bottone Checkout */}
              <motion.button
                onClick={handleProceedToCheckout}
                disabled={!selectedChatbot || getTotalItems() === 0}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{t.stampe.proceedToCheckout} - €{getTotalPrice().toFixed(2)}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Layout Desktop - Compattato per 70vh */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl shadow-lg p-6" style={{ height: '70vh', overflow: 'hidden' }}>
            <div className="h-full flex flex-col">
              {/* Header con titoli */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center space-x-3">
                  <QrCode className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-dark">{t.stampe.selectChatbot}</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-dark">{t.stampe.products.sticker.name}</h2>
                </div>
              </div>

              {/* Contenuto principale in 3 colonne */}
              <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
                {/* Colonna 1: Selezione Chatbot */}
                <div className="flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-3">
                      {currentChatbot && (
                        <motion.div
                          key={currentChatbot.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`border rounded-lg p-3 cursor-pointer transition ${
                            selectedChatbot?.id === currentChatbot.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedChatbot(currentChatbot)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full border-2 ${
                              selectedChatbot?.id === currentChatbot.id 
                                ? 'border-primary bg-primary' 
                                : 'border-gray-300'
                            }`}>
                              {selectedChatbot?.id === currentChatbot.id && (
                                <Check className="w-2 h-2 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold">{currentChatbot.property_name}</h3>
                              <p className="text-xs text-gray-500">{currentChatbot.property_city}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Navigazione paginazione */}
                      {totalChatbotPages > 1 && (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={goToPrevChatbot}
                            disabled={currentChatbotPage === 0}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-primary disabled:text-gray-300 disabled:cursor-not-allowed transition"
                          >
                            <ChevronLeft className="w-3 h-3" />
                            <span>Prec</span>
                          </button>
                          
                          <div className="flex space-x-1">
                            {Array.from({ length: totalChatbotPages }, (_, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setCurrentChatbotPage(i)
                                  setSelectedChatbot(null)
                                }}
                                className={`w-6 h-6 rounded-full text-xs font-medium transition ${
                                  i === currentChatbotPage
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                          
                          <button
                            onClick={goToNextChatbot}
                            disabled={currentChatbotPage === totalChatbotPages - 1}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-primary disabled:text-gray-300 disabled:cursor-not-allowed transition"
                          >
                            <span>Succ</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Anteprima QR-Code */}
                      {selectedChatbot && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h3 className="text-sm font-bold text-dark mb-2">{t.stampe.qrPreview}</h3>
                          <div className="bg-white p-2 rounded text-center">
                            <img
                              src={`data:image/png;base64,${selectedChatbot.qr_code}`}
                              alt="QR Code"
                              className="w-16 h-16 mx-auto mb-1"
                            />
                            <p className="text-xs text-gray-600">{selectedChatbot.property_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Colonna 2: Prodotti */}
                <div className="flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-3">
                      {products.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50 rounded-lg p-3"
                        >
                          <div className="text-center mb-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <QrCode className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-bold text-dark">{t.stampe.products.sticker.name}</h3>
                            <p className="text-gray-600 text-xs mt-1">{t.stampe.products.sticker.description}</p>
                          </div>

                          <div className="space-y-2 mb-3">
                            {t.stampe.products.sticker.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <Check className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-gray-600">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">€{product.price.toFixed(2)}</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleQuantityChange(product.id, -1)}
                                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                disabled={quantities[product.id] === 0}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-semibold text-sm">{quantities[product.id]}</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, 1)}
                                className="w-6 h-6 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colonna 3: Riepilogo e Checkout */}
                <div className="flex flex-col">
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Riepilogo Ordine */}
                    {getTotalItems() > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-lg p-3 mb-4"
                      >
                        <h3 className="text-sm font-bold text-dark mb-3">{t.stampe.orderSummary}</h3>
                        <div className="space-y-2">
                          {products.map(product => {
                            if (quantities[product.id] === 0) return null
                            return (
                              <div key={product.id} className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">
                                  {product.name} x{quantities[product.id]}
                                </span>
                                <span className="font-semibold">
                                  €{(product.price * quantities[product.id]).toFixed(2)}
                                </span>
                              </div>
                            )
                          })}
                          <div className="border-t pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-dark">{t.stampe.total}</span>
                              <span className="text-lg font-bold text-primary">€{getTotalPrice().toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Bottone Checkout */}
                    <motion.button
                      onClick={handleProceedToCheckout}
                      disabled={!selectedChatbot || getTotalItems() === 0}
                      className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold text-sm transition flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t.stampe.proceedToCheckout} - €{getTotalPrice().toFixed(2)}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StampeFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export default function StampePage() {
  return (
    <Suspense fallback={<StampeFallback />}>
      <StampeContent />
    </Suspense>
  )
}

// Disabilita prerendering per questa pagina
export const dynamic = 'force-dynamic'
