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
  Shield,
  Clock
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
    name: 'Adesivi QR-Code',
    description: 'Adesivi resistenti all\'acqua e ai raggi UV, perfetti per interni ed esterni',
    price: 5.99,
    image: '/icons/sticker-placeholder.png',
    features: [
      'Resistenti all\'acqua',
      'Adesivi ai raggi UV',
      'Dimensioni 5.83″×8.27″',
      'Spedizione gratuita'
    ],
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
      toast.error('Errore nel caricamento dei chatbot')
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

  const handleProceedToCheckout = () => {
    if (!selectedChatbot) {
      toast.error('Seleziona un chatbot')
      return
    }
    
    if (getTotalItems() === 0) {
      toast.error('Seleziona almeno un prodotto')
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
          <p className="text-gray-600">Caricamento...</p>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Nessun Chatbot Trovato</h2>
            <p className="text-gray-600 mb-6">Devi creare almeno un chatbot prima di poter ordinare i QR-Code stampati.</p>
            <Link href="/dashboard/chatbots/create" className="btn-primary">
              Crea il tuo primo Chatbot
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
            Torna alla Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-dark mb-2">
            Stampa QR-Code Personalizzati
          </h1>
          <p className="text-gray-600">
            Ordina adesivi e placche con il QR-Code del tuo chatbot, spediti direttamente a casa tua.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selezione Chatbot */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-dark mb-4">Seleziona Chatbot</h2>
              <div className="space-y-3">
                {chatbots.map((bot) => (
                  <motion.div
                    key={bot.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      selectedChatbot?.id === bot.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedChatbot(bot)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedChatbot?.id === bot.id 
                          ? 'border-primary bg-primary' 
                          : 'border-gray-300'
                      }`}>
                        {selectedChatbot?.id === bot.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{bot.property_name}</h3>
                        <p className="text-sm text-gray-500">{bot.property_city}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Anteprima QR-Code */}
            {selectedChatbot && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-dark mb-4">Anteprima QR-Code</h3>
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
          <div className="lg:col-span-2">
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
                    <h3 className="text-xl font-bold text-dark">{product.name}</h3>
                    <p className="text-gray-600 text-sm mt-2">{product.description}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {product.features.map((feature, idx) => (
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
                <h3 className="text-lg font-bold text-dark mb-4">Riepilogo Ordine</h3>
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
                      <span className="text-lg font-bold text-dark">Totale</span>
                      <span className="text-xl font-bold text-primary">€{getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Vantaggi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 text-center">
                <Truck className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Spedizione Gratuita</h4>
                <p className="text-xs text-gray-600">In tutta Italia</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Pagamento Sicuro</h4>
                <p className="text-xs text-gray-600">Con Stripe</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Consegna Veloce</h4>
                <p className="text-xs text-gray-600">3-5 giorni lavorativi</p>
              </div>
            </div>

            {/* Bottone Checkout */}
            <motion.button
              onClick={handleProceedToCheckout}
              disabled={!selectedChatbot || getTotalItems() === 0}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Procedi al Checkout - €{getTotalPrice().toFixed(2)}</span>
            </motion.button>
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
        <p className="text-gray-600">Caricamento...</p>
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
