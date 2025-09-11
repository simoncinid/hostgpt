'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { printOrders } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import PaymentForm from '@/app/components/PaymentForm'

interface ShippingAddress {
  firstName: string
  lastName: string
  company: string
  address: string
  city: string
  postalCode: string
  country: string
  state: string
  phone: string
}

interface OrderData {
  chatbot: any
  products: any[]
  totalPrice: number
  totalItems: number
}

function CheckoutContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'IT',
    state: '',
    phone: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  
  // Stati per autocompletamento indirizzo
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Carica i dati dell'ordine dal localStorage
    const savedOrder = localStorage.getItem('printOrder')
    if (!savedOrder) {
      router.push('/stampe')
      return
    }

    try {
      const order = JSON.parse(savedOrder)
      setOrderData(order)
      
      // Pre-compila l'indirizzo con i dati dell'utente se disponibili
      if (user) {
        setShippingAddress(prev => ({
          ...prev,
          firstName: user.full_name?.split(' ')[0] || '',
          lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
        }))
      }
    } catch (error) {
      console.error('Error parsing order data:', error)
      router.push('/stampe')
    }
  }, [isAuthenticated, user])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!shippingAddress.firstName.trim()) {
      newErrors.firstName = 'Nome è obbligatorio'
    }
    if (!shippingAddress.lastName.trim()) {
      newErrors.lastName = 'Cognome è obbligatorio'
    }
    if (!shippingAddress.address.trim()) {
      newErrors.address = 'Indirizzo è obbligatorio'
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'Città è obbligatoria'
    }
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = 'CAP è obbligatorio'
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'Telefono è obbligatorio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Rimuovi errore quando l'utente inizia a digitare
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
    
    // Autocompletamento per il campo indirizzo
    if (field === 'address' && value.length >= 3) {
      searchAddresses(value)
    } else if (field === 'address' && value.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
    }
  }

  const searchAddresses = async (query: string) => {
    try {
      setIsLoadingAddress(true)
      const response = await fetch(`/api/address/autocomplete?query=${encodeURIComponent(query)}&country=${shippingAddress.country}`)
      const data = await response.json()
      
      if (data.predictions) {
        setAddressSuggestions(data.predictions)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error searching addresses:', error)
    } finally {
      setIsLoadingAddress(false)
    }
  }

  const selectAddress = async (suggestion: any) => {
    try {
      setIsLoadingAddress(true)
      const response = await fetch(`/api/address/details/${suggestion.place_id}`)
      const data = await response.json()
      
      if (data.address) {
        setShippingAddress(prev => ({
          ...prev,
          address: data.address,
          city: data.city,
          postalCode: data.postal_code,
          country: data.country,
          state: data.state
        }))
        setShowSuggestions(false)
        setAddressSuggestions([])
      }
    } catch (error) {
      console.error('Error getting address details:', error)
    } finally {
      setIsLoadingAddress(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!validateForm() || !orderData) {
      toast.error('Compila tutti i campi obbligatori')
      return
    }

    setIsProcessing(true)

    try {
      console.log('Creando ordine nel database...')
      console.log('Dati ordine:', orderData)
      console.log('Indirizzo spedizione:', shippingAddress)

      // Crea l'ordine nel database
      const orderResponse = await printOrders.create({
        chatbot_id: orderData.chatbot.id,
        products: orderData.products,
        shipping_address: shippingAddress,
        total_amount: orderData.totalPrice
      })

      const order = orderResponse.data
      console.log('Ordine creato:', order)
      setCreatedOrder(order)
      toast.success('Ordine creato! Ora puoi procedere con il pagamento.')

    } catch (error) {
      console.error('Errore creazione ordine:', error)
      toast.error(`Errore durante la creazione dell'ordine: ${error instanceof Error ? error.message : 'Riprova.'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Pagamento completato:', paymentIntentId)
    setPaymentCompleted(true)
    
    // Salva i dati dell'ordine per la pagina di successo
    const successData = {
      chatbot: orderData?.chatbot,
      products: orderData?.products,
      totalPrice: orderData?.totalPrice,
      totalItems: orderData?.totalItems,
      order: createdOrder,
      paymentIntentId
    }
    
    localStorage.setItem('printOrderSuccess', JSON.stringify(successData))
    
    // Reindirizza alla pagina di successo
    setTimeout(() => {
      router.push('/stampe/success')
    }, 2000)
  }

  const handlePaymentError = (error: string) => {
    console.error('Errore pagamento:', error)
    toast.error(`Errore nel pagamento: ${error}`)
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento ordine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/stampe/checkout" onLogout={() => {}} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} p-4 md:p-8`}>
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/stampe"
            className="inline-flex items-center text-gray-600 hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Selezione Prodotti
          </Link>
          <h1 className="text-3xl font-bold text-dark mb-2">
            Checkout
          </h1>
          <p className="text-gray-600">
            Completa il tuo ordine di QR-Code personalizzati
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Indirizzo */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center space-x-3 mb-6">
                <MapPin className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-dark">Indirizzo di Spedizione</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mario"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Rossi"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Azienda (opzionale)
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Nome Azienda"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indirizzo *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) {
                          setShowSuggestions(true)
                        }
                      }}
                      onBlur={() => {
                        // Delay per permettere il click sui suggerimenti
                        setTimeout(() => setShowSuggestions(false), 200)
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Inizia a digitare l'indirizzo..."
                    />
                    {isLoadingAddress && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    )}
                    
                    {/* Dropdown suggerimenti */}
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => selectAddress(suggestion)}
                          >
                            <div className="font-medium text-gray-900">
                              {suggestion.main_text}
                            </div>
                            <div className="text-sm text-gray-500">
                              {suggestion.secondary_text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Città *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Milano"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CAP *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.postalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="20100"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paese
                  </label>
                  <select
                    value={shippingAddress.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="IT">Italia</option>
                    <option value="CH">Svizzera</option>
                    <option value="AT">Austria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono *
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+39 123 456 7890"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Metodo di Pagamento */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-dark">Metodo di Pagamento</h2>
              </div>

              {!createdOrder ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">Pagamento con Carta</p>
                        <p className="text-sm text-gray-600">Gestito in modo sicuro da Stripe</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Come funziona:</p>
                        <p>1. Compila l'indirizzo di spedizione</p>
                        <p>2. Clicca "Crea Ordine" per procedere</p>
                        <p>3. Inserisci i dati della tua carta di credito</p>
                        <p>4. Completa il pagamento in modo sicuro</p>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleCreateOrder}
                    disabled={isProcessing}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creazione Ordine...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Crea Ordine</span>
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    amount={orderData.totalPrice}
                    orderId={createdOrder.id}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              )}

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    Il pagamento è protetto con crittografia SSL e gestito da Stripe
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Riepilogo Ordine */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-dark mb-4">Riepilogo Ordine</h3>
              
              {/* Chatbot */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Chatbot selezionato:</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-semibold">{orderData.chatbot.property_name}</p>
                  <p className="text-sm text-gray-600">{orderData.chatbot.property_city}</p>
                </div>
              </div>

              {/* Prodotti */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Prodotti:</p>
                <div className="space-y-2">
                  {orderData.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{product.name} x{product.quantity}</span>
                      <span className="text-sm font-semibold">€{(product.price * product.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totale */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotale</span>
                  <span>€{orderData.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Spedizione</span>
                  <span className="text-green-600">Gratuita</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Totale</span>
                  <span className="text-primary">€{orderData.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Stato Ordine */}
              {createdOrder && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-semibold">Ordine Creato</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Numero ordine: {createdOrder.order_number}
                  </p>
                </div>
              )}

              {/* Note */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">Tempi di consegna:</p>
                    <p>3-5 giorni lavorativi in Italia</p>
                    <p>5-7 giorni lavorativi in Europa</p>
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

export default function CheckoutPage() {
  return <CheckoutContent />
}

// Disabilita prerendering per questa pagina
export const dynamic = 'force-dynamic'
