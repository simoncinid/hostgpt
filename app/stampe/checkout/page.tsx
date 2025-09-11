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
import { useLanguage } from '@/lib/languageContext'
import { printOrders, address } from '@/lib/api'
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
  streetNumber: string
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
  const { t } = useLanguage()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    streetNumber: '',
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
      newErrors.firstName = `${t.stampe.checkout.form.firstName} ${t.stampe.checkout.form.required}`
    }
    if (!shippingAddress.lastName.trim()) {
      newErrors.lastName = `${t.stampe.checkout.form.lastName} ${t.stampe.checkout.form.required}`
    }
    if (!shippingAddress.address.trim()) {
      newErrors.address = `${t.stampe.checkout.form.address} ${t.stampe.checkout.form.required}`
    }
    if (!shippingAddress.streetNumber.trim()) {
      newErrors.streetNumber = `${t.stampe.checkout.form.streetNumber} ${t.stampe.checkout.form.required}`
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = `${t.stampe.checkout.form.city} ${t.stampe.checkout.form.required}`
    }
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = `${t.stampe.checkout.form.postalCode} ${t.stampe.checkout.form.required}`
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = `${t.stampe.checkout.form.phone} ${t.stampe.checkout.form.required}`
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
    
    // Se l'utente modifica l'indirizzo, resetta il numero civico
    if (field === 'address') {
      setShippingAddress(prev => ({
        ...prev,
        streetNumber: ''
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
      
      const response = await address.autocomplete(query, shippingAddress.country)
      console.log('Address search response:', response.data)
      
      if (response.data.predictions) {
        setAddressSuggestions(response.data.predictions)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error searching addresses:', error)
      
      // Fallback temporaneo per test
      if (query.toLowerCase().includes('roma')) {
        setAddressSuggestions([
          {
            description: "Via del Corso, Roma, RM, Italia",
            place_id: "test_roma_1",
            main_text: "Via del Corso",
            secondary_text: "Roma, RM, Italia"
          }
        ])
        setShowSuggestions(true)
        toast(t.stampe.toasts.demoMode, { icon: 'ℹ️' })
      } else {
        toast.error(t.stampe.toasts.addressError)
      }
    } finally {
      setIsLoadingAddress(false)
    }
  }

  const selectAddress = async (suggestion: any) => {
    try {
      setIsLoadingAddress(true)
      
      // Fallback per test
      if (suggestion.place_id === 'test_roma_1') {
        setShippingAddress(prev => ({
          ...prev,
          address: 'Via del Corso',
          streetNumber: '123',
          city: 'Roma',
          postalCode: '00186',
          country: 'IT',
          state: 'RM'
        }))
        setShowSuggestions(false)
        setAddressSuggestions([])
        toast.success(t.stampe.toasts.addressAutoFilled)
        return
      }
      
      const response = await address.getDetails(suggestion.place_id)
      console.log('Address details response:', response.data)
      
      if (response.data.address) {
        setShippingAddress(prev => ({
          ...prev,
          address: response.data.route || response.data.address,
          streetNumber: response.data.street_number || '',
          city: response.data.city || '',
          postalCode: response.data.postal_code || '',
          country: response.data.country || 'IT',
          state: response.data.state || ''
        }))
        setShowSuggestions(false)
        setAddressSuggestions([])
        
        // Mostra messaggio di successo
        toast.success(t.stampe.toasts.addressAutoFilled)
      } else {
        toast.error(t.stampe.toasts.addressDetailsError)
      }
    } catch (error) {
      console.error('Error getting address details:', error)
      toast.error('Errore nel recuperare i dettagli dell\'indirizzo')
    } finally {
      setIsLoadingAddress(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!validateForm() || !orderData) {
      toast.error(t.stampe.toasts.fillRequiredFields)
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
        total_amount: orderData.totalPrice + 4.99 // Aggiungi spedizione al totale
      })

      const order = orderResponse.data
      console.log('Ordine creato:', order)
      setCreatedOrder(order)
      toast.success(t.stampe.toasts.orderCreated)

    } catch (error) {
      console.error('Errore creazione ordine:', error)
      toast.error(`${t.stampe.toasts.orderCreatedError}: ${error instanceof Error ? error.message : 'Riprova.'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Pagamento completato:', paymentIntentId)
    setPaymentCompleted(true)
    
    // Reindirizza direttamente alla dashboard stampe
    setTimeout(() => {
      router.push('/dashboard/stampe')
    }, 2000)
  }

  const handlePaymentError = (error: string) => {
    console.error('Errore pagamento:', error)
    toast.error(`${t.stampe.toasts.paymentError}: ${error}`)
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.stampe.loadingOrder}</p>
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
            {t.stampe.checkout.backToProducts}
          </Link>
          <h1 className="text-3xl font-bold text-dark mb-2">
            {t.stampe.checkout.title}
          </h1>
          <p className="text-gray-600">
            {t.stampe.checkout.subtitle}
          </p>
        </div>

        {/* Layout Mobile - Invariato */}
        <div className="block lg:hidden">
          <div className="grid grid-cols-1 gap-8">
            {/* Form Indirizzo */}
            <div>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center space-x-3 mb-6">
                <MapPin className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-dark">{t.stampe.checkout.shippingAddress}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.stampe.checkout.form.firstName} {t.stampe.checkout.form.required}
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
                    {t.stampe.checkout.form.lastName} {t.stampe.checkout.form.required}
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
                    {t.stampe.checkout.form.companyOptional}
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
                    {t.stampe.checkout.form.address} {t.stampe.checkout.form.required}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    {t.stampe.checkout.form.addressHint}
                  </p>
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
                      placeholder={t.stampe.checkout.form.addressPlaceholder}
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
                    {t.stampe.checkout.form.streetNumber} {t.stampe.checkout.form.required}
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.streetNumber}
                    onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.streetNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123"
                  />
                  {errors.streetNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.streetNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.stampe.checkout.form.city} {t.stampe.checkout.form.required}
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder={t.stampe.checkout.form.autoFillHint}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.stampe.checkout.form.state} {t.stampe.checkout.form.required}
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder={t.stampe.checkout.form.autoFillHint}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.stampe.checkout.form.postalCode} {t.stampe.checkout.form.required}
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.postalCode}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder={t.stampe.checkout.form.autoFillHint}
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.stampe.checkout.form.country} {t.stampe.checkout.form.required}
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.country}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder={t.stampe.checkout.form.autoFillHint}
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.stampe.checkout.form.phone} {t.stampe.checkout.form.required}
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
                <h2 className="text-xl font-bold text-dark">{t.stampe.checkout.paymentMethod}</h2>
              </div>

              {!createdOrder ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{t.stampe.checkout.payment.cardPayment}</p>
                        <p className="text-sm text-gray-600">{t.stampe.checkout.payment.stripeSecure}</p>
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
                        <span>{t.stampe.checkout.payment.creatingOrder}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>{t.stampe.checkout.payment.createOrder}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    amount={orderData.totalPrice + 4.99} // Aggiungi spedizione al totale
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
                    {t.stampe.checkout.payment.sslProtected}
                  </p>
                </div>
              </div>
            </div>
          </div>

            {/* Riepilogo Ordine Mobile */}
            <div>
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-dark mb-4">{t.stampe.checkout.orderSummary}</h3>
              
              {/* Chatbot */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">{t.stampe.checkout.selectedChatbot}</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-semibold">{orderData.chatbot.property_name}</p>
                  <p className="text-sm text-gray-600">{orderData.chatbot.property_city}</p>
                </div>
              </div>

              {/* Prodotti */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">{t.stampe.checkout.products}</p>
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
                  <span className="text-gray-600">{t.stampe.checkout.subtotal}</span>
                  <span>€{orderData.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{t.stampe.checkout.shipping}</span>
                  <span>€4.99</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>{t.stampe.checkout.total}</span>
                  <span className="text-primary">€{(orderData.totalPrice + 4.99).toFixed(2)}</span>
                </div>
              </div>

              {/* Stato Ordine */}
              {createdOrder && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-semibold">{t.stampe.checkout.orderCreated}</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {t.stampe.checkout.orderNumber} {createdOrder.order_number}
                  </p>
                </div>
              )}

              {/* Note */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">{t.stampe.checkout.deliveryTimes}</p>
                    <p>Circa 7 giorni per la produzione e spedizione worldwide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Layout Desktop - Originale */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Indirizzo e Pagamento */}
            <div className="space-y-8">
              {/* Form Indirizzo */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <MapPin className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold text-dark">{t.stampe.checkout.shippingAddress}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.stampe.checkout.form.firstName} {t.stampe.checkout.form.required}
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
                      {t.stampe.checkout.form.lastName} {t.stampe.checkout.form.required}
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
                      {t.stampe.checkout.form.companyOptional}
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
                      {t.stampe.checkout.form.address} {t.stampe.checkout.form.required}
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      {t.stampe.checkout.form.addressHint}
                    </p>
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
                        placeholder={t.stampe.checkout.form.addressPlaceholder}
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
                      {t.stampe.checkout.form.streetNumber} {t.stampe.checkout.form.required}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.streetNumber}
                      onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.streetNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="123"
                    />
                    {errors.streetNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.streetNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.stampe.checkout.form.city} {t.stampe.checkout.form.required}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder={t.stampe.checkout.form.autoFillHint}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.stampe.checkout.form.state} {t.stampe.checkout.form.required}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder={t.stampe.checkout.form.autoFillHint}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.stampe.checkout.form.postalCode} {t.stampe.checkout.form.required}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder={t.stampe.checkout.form.autoFillHint}
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.stampe.checkout.form.country} {t.stampe.checkout.form.required}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder={t.stampe.checkout.form.autoFillHint}
                    />
                    {errors.country && (
                      <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.stampe.checkout.form.phone} {t.stampe.checkout.form.required}
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
                  <h2 className="text-xl font-bold text-dark">{t.stampe.checkout.paymentMethod}</h2>
                </div>

                {!createdOrder ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{t.stampe.checkout.payment.cardPayment}</p>
                          <p className="text-sm text-gray-600">{t.stampe.checkout.payment.stripeSecure}</p>
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
                          <span>{t.stampe.checkout.payment.creatingOrder}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>{t.stampe.checkout.payment.createOrder}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                ) : (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      amount={orderData.totalPrice + 4.99} // Aggiungi spedizione al totale
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
                      {t.stampe.checkout.payment.sslProtected}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Riepilogo Ordine Desktop */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h3 className="text-lg font-bold text-dark mb-4">{t.stampe.checkout.orderSummary}</h3>
                
                {/* Chatbot */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{t.stampe.checkout.selectedChatbot}</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-semibold">{orderData.chatbot.property_name}</p>
                    <p className="text-sm text-gray-600">{orderData.chatbot.property_city}</p>
                  </div>
                </div>

                {/* Prodotti */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{t.stampe.checkout.products}</p>
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
                    <span className="text-gray-600">{t.stampe.checkout.subtotal}</span>
                    <span>€{orderData.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">{t.stampe.checkout.shipping}</span>
                    <span>€4.99</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{t.stampe.checkout.total}</span>
                    <span className="text-primary">€{(orderData.totalPrice + 4.99).toFixed(2)}</span>
                  </div>
                </div>

                {/* Stato Ordine */}
                {createdOrder && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-semibold">{t.stampe.checkout.orderCreated}</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      {t.stampe.checkout.orderNumber} {createdOrder.order_number}
                    </p>
                  </div>
                )}

                {/* Note */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-semibold mb-1">{t.stampe.checkout.deliveryTimes}</p>
                      <p>Circa 7 giorni per la produzione e spedizione worldwide</p>
                    </div>
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
