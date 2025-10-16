'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  QrCode,
  ArrowLeft,
  Plus,
  Minus,
  Send,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuthStore, useChatbotStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import { chatbots as chatbotsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'

interface StickerSize {
  id: string
  name: string
  dimensions: string
  dimensionsCm: string
}

const stickerSizes: StickerSize[] = [
  {
    id: 'size_5x8',
    name: '5.83″×8.27″',
    dimensions: '5.83″×8.27″',
    dimensionsCm: '(14.8×21 cm)'
  },
  {
    id: 'size_3x3',
    name: '3″×3″',
    dimensions: '3″×3″',
    dimensionsCm: '(7.6×7.6 cm)'
  },
  {
    id: 'size_4x4',
    name: '4″×4″',
    dimensions: '4″×4″',
    dimensionsCm: '(10.2×10.2 cm)'
  },
  {
    id: 'size_5x5',
    name: '5.5″×5.5″',
    dimensions: '5.5″×5.5″',
    dimensionsCm: '(14×14 cm)'
  }
]

function StampeContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { chatbots } = useChatbotStore()
  const { t } = useLanguage()
  
  const [selectedChatbot, setSelectedChatbot] = useState<any>(null)
  const [plasticSupports, setPlasticSupports] = useState(0)
  const [stickerQuantities, setStickerQuantities] = useState<{[key: string]: number}>({
    size_5x8: 0,
    size_3x3: 0,
    size_4x4: 0,
    size_5x5: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
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
      toast.error('Errore nel caricamento dei chatbot')
      setIsLoading(false)
    }
  }

  const handleStickerQuantityChange = (sizeId: string, change: number) => {
    setStickerQuantities(prev => ({
      ...prev,
      [sizeId]: Math.max(0, prev[sizeId] + change)
    }))
  }

  const getTotalItems = () => {
    let total = plasticSupports
    Object.values(stickerQuantities).forEach(qty => total += qty)
    return total
  }

  // Funzioni per la paginazione chatbot
  const chatbotsPerPage = 1
  const totalChatbotPages = Math.ceil(chatbots.length / chatbotsPerPage)
  const currentChatbot = chatbots[currentChatbotPage]

  const goToNextChatbot = () => {
    if (currentChatbotPage < totalChatbotPages - 1) {
      setCurrentChatbotPage(currentChatbotPage + 1)
      setSelectedChatbot(null)
    }
  }

  const goToPrevChatbot = () => {
    if (currentChatbotPage > 0) {
      setCurrentChatbotPage(currentChatbotPage - 1)
      setSelectedChatbot(null)
    }
  }

  const handleSendRequest = async () => {
    if (!selectedChatbot) {
      toast.error('Seleziona un chatbot')
      return
    }
    
    if (getTotalItems() === 0) {
      toast.error('Seleziona almeno un prodotto')
      return
    }

    setIsSending(true)
    
    try {
      const response = await fetch('/api/print-orders/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          chatbot_id: selectedChatbot.id,
          plastic_supports: plasticSupports,
          stickers: stickerQuantities
        })
      })

      if (response.ok) {
        setRequestSent(true)
        toast.success(t.stampe.simplified.requestSent)
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Errore nell\'invio della richiesta')
      }
    } catch (error) {
      console.error('Error sending request:', error)
      toast.error('Errore nell\'invio della richiesta')
    } finally {
      setIsSending(false)
    }
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

  if (requestSent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar currentPath="/stampe" onLogout={() => {}} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
        <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} p-4 md:p-8`}>
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-green-600" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{t.stampe.simplified.requestSent}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{t.stampe.simplified.requestSentMessage}</p>
            <Link href="/dashboard" className="btn-primary">
              {t.stampe.simplified.backToDashboard}
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
            {t.stampe.simplified.title}
          </h1>
          <p className="text-gray-600">
            {t.stampe.simplified.subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Selezione Chatbot */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-dark mb-4">{t.stampe.selectChatbot}</h2>
              
              {currentChatbot && (
                <motion.div
                  key={currentChatbot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border rounded-lg p-4 cursor-pointer transition mb-4 ${
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
                <div className="flex items-center justify-between mb-4">
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

              {/* Anteprima QR-Code */}
              {selectedChatbot && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-dark mb-3">{t.stampe.qrPreview}</h3>
                  <div className="bg-white p-3 rounded text-center">
                    <img
                      src={`data:image/png;base64,${selectedChatbot.qr_code}`}
                      alt="QR Code"
                      className="w-24 h-24 mx-auto mb-2"
                    />
                    <p className="text-xs text-gray-600">{selectedChatbot.property_name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Selezione Prodotti */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-dark mb-6">Prodotti</h2>
              
              {/* Supporti di Plastica */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-dark mb-3">{t.stampe.simplified.plasticSupports}</h3>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-dark">{t.stampe.products.plasticSupport.name}</div>
                    <div className="text-sm text-gray-600">{t.stampe.products.plasticSupport.description}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setPlasticSupports(Math.max(0, plasticSupports - 1))}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      disabled={plasticSupports === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{plasticSupports}</span>
                    <button
                      onClick={() => setPlasticSupports(plasticSupports + 1)}
                      className="w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Adesivi */}
              <div>
                <h3 className="text-lg font-semibold text-dark mb-3">{t.stampe.simplified.stickers}</h3>
                <div className="space-y-3">
                  {stickerSizes.map((size, index) => (
                    <motion.div
                      key={size.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-dark">{size.dimensions}</div>
                        <div className="text-sm text-gray-600">{size.dimensionsCm}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleStickerQuantityChange(size.id, -1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                          disabled={stickerQuantities[size.id] === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{stickerQuantities[size.id]}</span>
                        <button
                          onClick={() => handleStickerQuantityChange(size.id, 1)}
                          className="w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottone Invio Richiesta */}
          <div className="mt-8 text-center">
            <motion.button
              onClick={handleSendRequest}
              disabled={!selectedChatbot || getTotalItems() === 0 || isSending}
              className="bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center space-x-3 mx-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSending ? (
                <>
                  <div className="loading-spinner w-5 h-5"></div>
                  <span>Invio in corso...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{t.stampe.simplified.sendRequest}</span>
                </>
              )}
            </motion.button>
            
            {getTotalItems() > 0 && (
              <p className="text-sm text-gray-600 mt-3">
                Totale prodotti selezionati: {getTotalItems()}
              </p>
            )}
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