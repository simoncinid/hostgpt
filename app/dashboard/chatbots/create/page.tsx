'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Home,
  MapPin,
  Wifi,
  Car,
  Coffee,
  ShoppingBag,
  Phone,
  HelpCircle,
  MessageSquare,
  Check,
  Plus,
  X,
  Loader2
} from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { chatbots, address } from '@/lib/api'
import { useChatbotStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'

interface ChatbotFormData {
  property_name: string
  property_type: string
  property_address: string
  property_street_number: string
  property_city: string
  property_state: string
  property_postal_code: string
  property_country: string
  property_description: string
  check_in_time: string
  check_out_time: string
  house_rules: string
  amenities: string[]
  hotel_services?: string
  neighborhood_description: string
  nearby_attractions: { name: string; note: string }[]
  transportation_info: string
  restaurants_bars: { name: string; note: string }[]
  shopping_info: string
  emergency_contacts: { name: string; number: string; type: string }[]
  wifi_info: { network: string; password: string }
  parking_info: string
  special_instructions: string
  faq: { question: string; answer: string }[]
  welcome_message: string
  property_url: string
  reviews_link: string
}

// Steps will be created dynamically from translations

// Amenities list will be created dynamically from translations

export default function CreateChatbotPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  
  // Create steps list from translations
  const steps = [
    { id: 1, name: t.chatbots.create.steps.basic, icon: Home },
    { id: 2, name: t.chatbots.create.steps.property, icon: MapPin },
    { id: 3, name: t.chatbots.create.steps.amenities, icon: Wifi },
    { id: 4, name: t.chatbots.create.steps.location, icon: Car },
    { id: 5, name: t.chatbots.create.steps.services, icon: Coffee },
    { id: 6, name: t.chatbots.create.steps.final, icon: Phone },
  ]
  
  // Create amenities list from translations
  const amenitiesList = [
    t.chatbots.create.amenities.wifi,
    t.chatbots.create.amenities.airConditioning,
    t.chatbots.create.amenities.heating,
    t.chatbots.create.amenities.tv,
    t.chatbots.create.amenities.netflix,
    t.chatbots.create.amenities.kitchen,
    t.chatbots.create.amenities.dishwasher,
    t.chatbots.create.amenities.washingMachine,
    t.chatbots.create.amenities.dryer,
    t.chatbots.create.amenities.iron,
    t.chatbots.create.amenities.parking,
    t.chatbots.create.amenities.pool,
    t.chatbots.create.amenities.gym,
    t.chatbots.create.amenities.balcony,
    t.chatbots.create.amenities.garden,
    t.chatbots.create.amenities.elevator,
    t.chatbots.create.amenities.safe,
    t.chatbots.create.amenities.alarm,
    t.chatbots.create.amenities.petsAllowed,
    t.chatbots.create.amenities.smokingAllowed
  ]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [iconError, setIconError] = useState<string | null>(null)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [addressInputValue, setAddressInputValue] = useState('')
  const addressInputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [rulesFile, setRulesFile] = useState<File | null>(null)
  const [isLoadingRules, setIsLoadingRules] = useState(false)
  const [rulesError, setRulesError] = useState<string | null>(null)
  const { addChatbot } = useChatbotStore()
  
  // Controlla il limite di chatbot
  useEffect(() => {
    const checkLimits = async () => {
      try {
        const res = await chatbots.list()
        const response = res.data
        
        if (response.chatbots && response.limits) {
          // Nuovo formato con limiti
          if (!response.limits.can_create_new) {
            toast.error(`Hai raggiunto il limite massimo di ${response.limits.max_allowed} chatbot`)
            router.replace('/dashboard/chatbots')
            return
          }
        } else {
          // Formato vecchio - controlla se esiste già un chatbot
          const bots = response || []
          if (bots.length >= 1) {
            router.replace(`/dashboard/chatbots/${bots[0].id}`)
          }
        }
      } catch {}
    }
    checkLimits()
  }, [])

  // Cleanup del timeout quando il componente viene unmountato
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])
  
  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm<ChatbotFormData>({
    defaultValues: {
      amenities: [],
      nearby_attractions: [
        { name: 'Farmacia', note: 'Farmacia locale' },
        { name: 'Supermercato', note: 'Supermercato nelle vicinanze' }
      ],
      restaurants_bars: [{ name: 'Ristorante locale', note: 'Ristorante consigliato' }],
      emergency_contacts: [{ name: '', number: '', type: '' }],
      faq: [{ question: '', answer: '' }],
      wifi_info: { network: '', password: '' }
    }
  })

  const { fields: attractionFields, append: appendAttraction, remove: removeAttraction } = useFieldArray({
    control,
    name: 'nearby_attractions'
  })

  const { fields: restaurantFields, append: appendRestaurant, remove: removeRestaurant } = useFieldArray({
    control,
    name: 'restaurants_bars'
  })

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: 'emergency_contacts'
  })

  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({
    control,
    name: 'faq'
  })

  const selectedAmenities = watch('amenities')
  const selectedPropertyType = watch('property_type')

  const toggleAmenity = (amenity: string) => {
    const current = selectedAmenities || []
    if (current.includes(amenity)) {
      setValue('amenities', current.filter(a => a !== amenity))
    } else {
      setValue('amenities', [...current, amenity])
    }
  }

  // Funzione per pulire gli errori quando l'utente inizia a digitare
  const clearFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  // Funzioni per autocompletamento indirizzo
  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setIsLoadingAddress(true)
      const response = await address.autocomplete(query, 'IT') // Default Italia
      if (response.data?.predictions) {
        setAddressSuggestions(response.data.predictions)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error searching addresses:', error)
    } finally {
      setIsLoadingAddress(false)
    }
  }

  // Funzione debounced per evitare troppe chiamate API
  const debouncedSearchAddresses = useCallback((query: string) => {
    // Cancella il timeout precedente
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Imposta un nuovo timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchAddresses(query)
    }, 800) // 800ms di delay per evitare perdita focus
  }, [])

  // Gestione del cambio valore input
  const handleAddressInputChange = (value: string) => {
    setAddressInputValue(value)
    debouncedSearchAddresses(value)
  }

  const selectAddress = async (suggestion: any) => {
    try {
      setIsLoadingAddress(true)
      const response = await address.getDetails(suggestion.place_id)
      
      if (response.data.address) {
        // Aggiorna tutti i campi indirizzo
        setValue('property_address', response.data.route || response.data.address)
        setValue('property_street_number', response.data.street_number || '')
        setValue('property_city', response.data.city || '')
        setValue('property_state', response.data.state || '')
        setValue('property_postal_code', response.data.postal_code || '')
        setValue('property_country', response.data.country || 'IT')
        
        // Aggiorna anche il valore dell'input di ricerca
        setAddressInputValue(suggestion.description || suggestion.main_text || '')
        
        setShowSuggestions(false)
        setAddressSuggestions([])
        
        // Pulisci errori relativi all'indirizzo
        clearFieldError('property_address')
        clearFieldError('property_city')
        
        toast.success(language === 'IT' ? 'Indirizzo compilato automaticamente' : 'Address filled automatically')
      } else {
        toast.error(language === 'IT' ? 'Errore nel recuperare i dettagli dell\'indirizzo' : 'Error retrieving address details')
      }
    } catch (error) {
      console.error('Error getting address details:', error)
      toast.error(language === 'IT' ? 'Errore nel recuperare i dettagli dell\'indirizzo' : 'Error retrieving address details')
    } finally {
      setIsLoadingAddress(false)
    }
  }

  // Funzione per gestire upload file regole
  const handleRulesFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setRulesError(null)
    
    if (file) {
      // Verifica tipo file
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/vnd.oasis.opendocument.text', // ODT
        'text/plain' // TXT
      ]
      
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = language === 'IT' 
          ? 'Formato file non supportato. Usa PDF, DOCX, ODT o TXT'
          : 'File format not supported. Use PDF, DOCX, ODT or TXT'
        setRulesError(errorMsg)
        return
      }
      
      // Verifica dimensione (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        const errorMsg = language === 'IT' 
          ? 'Il file non può superare i 10MB'
          : 'File cannot exceed 10MB'
        setRulesError(errorMsg)
        return
      }
      
      setRulesFile(file)
      setIsLoadingRules(true)
      
      try {
        // Crea FormData per l'upload
        const formData = new FormData()
        formData.append('file', file)
        
        // Chiama l'endpoint per estrarre il contenuto
        const response = await fetch('/api/extract-document', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('Errore nell\'estrazione del contenuto')
        }
        
        const result = await response.json()
        
        // Imposta il contenuto estratto nel campo regole
        setValue('house_rules', result.content)
        
      } catch (error) {
        console.error('Error extracting document content:', error)
        setRulesError(language === 'IT' 
          ? 'Errore nell\'elaborazione del file. Riprova o inserisci il testo manualmente.'
          : 'Error processing file. Please try again or enter text manually.'
        )
      } finally {
        setIsLoadingRules(false)
      }
    } else {
      setRulesFile(null)
    }
  }

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setIconError(null) // Reset error
    
    if (file) {
      // Verifica tipo file
      if (!file.type.startsWith('image/')) {
        const errorMsg = language === 'IT' 
          ? 'Seleziona un file immagine valido (PNG, JPG)'
          : 'Please select a valid image file (PNG, JPG)'
        setIconError(errorMsg)
        return
      }
      
      // Verifica tipo specifico
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        const errorMsg = language === 'IT' 
          ? 'Formato non supportato. Usa PNG o JPG'
          : 'Unsupported format. Use PNG or JPG'
        setIconError(errorMsg)
        return
      }
      
      // Verifica dimensione (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const errorMsg = language === 'IT' 
          ? 'L\'immagine non può superare i 5MB'
          : 'Image cannot exceed 5MB'
        setIconError(errorMsg)
        return
      }
      
      setIconFile(file)
      
      // Crea preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setIconFile(null)
      setIconPreview(null)
    }
  }

  const handleAutoFill = async () => {
    console.log('🚀 FRONTEND: handleAutoFill chiamato')
    
    const propertyUrl = watch('property_url')
    console.log('🚀 FRONTEND: URL letto:', propertyUrl)
    
    if (!propertyUrl) {
      console.log('❌ FRONTEND: URL vuoto')
      toast.error(language === 'IT' ? 'Inserisci un URL valido' : 'Please enter a valid URL')
      return
    }

    // Valida che sia un URL valido
    try {
      new URL(propertyUrl)
    } catch {
      console.log('❌ FRONTEND: URL non valido')
      toast.error(language === 'IT' ? 'URL non valido. Inserisci un URL completo (es. https://esempio.com)' : 'Invalid URL. Please enter a complete URL (e.g. https://example.com)')
      return
    }

    // Accetta qualsiasi URL valido
    console.log('✅ FRONTEND: URL valido accettato:', propertyUrl)

    console.log('🚀 FRONTEND: Iniziando auto-fill per URL:', propertyUrl)
    setIsAutoFilling(true)
    
    try {
      console.log('🚀 FRONTEND: Chiamando /api/analyze-property')
      
      const response = await fetch('/api/analyze-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: propertyUrl }),
      })

      console.log('🚀 FRONTEND: Risposta ricevuta, status:', response.status)
      console.log('🚀 FRONTEND: Response ok:', response.ok)

      if (!response.ok) {
        console.log('❌ FRONTEND: Response non ok, status:', response.status)
        let errorMessage = language === 'IT' ? 'Errore nell\'analisi della proprietà' : 'Error analyzing property'
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch {
          // Se non riesce a parsare il JSON, usa il messaggio di default
        }
        
        console.log('❌ FRONTEND: Error message:', errorMessage)
        throw new Error(errorMessage)
      }

      console.log('🚀 FRONTEND: Parsing JSON response')
      const data = await response.json()
      console.log('🚀 FRONTEND: Dati ricevuti:', data)
      
      // Riempie i campi con i dati ricevuti
      if (data.property_name) setValue('property_name', data.property_name)
      if (data.property_type) {
        // Mappa il tipo di proprietà dall'API ai valori del frontend
        const propertyTypeMap: { [key: string]: string } = {
          'albergo': 'albergo',
          'hotel': 'albergo',
          'bed_breakfast': 'bed_breakfast',
          'bed&breakfast': 'bed_breakfast',
          'campeggio': 'campeggio',
          'camping': 'campeggio',
          'appartamento': 'appartamento',
          'apartment': 'appartamento',
          'stanza': 'stanza',
          'room': 'stanza'
        }
        const mappedType = propertyTypeMap[data.property_type] || data.property_type
        setValue('property_type', mappedType)
      }
      // Auto-compila l'indirizzo se trovato dall'IA
      if (data.property_address) setValue('property_address', data.property_address)
      if (data.property_street_number) setValue('property_street_number', data.property_street_number)
      if (data.property_city) setValue('property_city', data.property_city)
      if (data.property_state) setValue('property_state', data.property_state)
      if (data.property_postal_code) setValue('property_postal_code', data.property_postal_code)
      if (data.property_country) setValue('property_country', data.property_country)
      if (data.property_description) setValue('property_description', data.property_description)
      if (data.check_in_time) setValue('check_in_time', data.check_in_time)
      if (data.check_out_time) setValue('check_out_time', data.check_out_time)
      if (data.house_rules) setValue('house_rules', data.house_rules)
      if (data.amenities && Array.isArray(data.amenities)) {
        // Mappa i valori degli amenities dall'API ai valori del frontend
        const mappedAmenities = data.amenities.map((amenity: string) => {
          const amenityMap: { [key: string]: string } = {
            'wifi': t.chatbots.create.amenities.wifi,
            'aria_condizionata': t.chatbots.create.amenities.airConditioning,
            'riscaldamento': t.chatbots.create.amenities.heating,
            'tv': t.chatbots.create.amenities.tv,
            'netflix': t.chatbots.create.amenities.netflix,
            'cucina': t.chatbots.create.amenities.kitchen,
            'lavastoviglie': t.chatbots.create.amenities.dishwasher,
            'lavatrice': t.chatbots.create.amenities.washingMachine,
            'asciugatrice': t.chatbots.create.amenities.dryer,
            'ferro': t.chatbots.create.amenities.iron,
            'parcheggio': t.chatbots.create.amenities.parking,
            'piscina': t.chatbots.create.amenities.pool,
            'palestra': t.chatbots.create.amenities.gym,
            'balcone': t.chatbots.create.amenities.balcony,
            'giardino': t.chatbots.create.amenities.garden,
            'ascensore': t.chatbots.create.amenities.elevator,
            'cassaforte': t.chatbots.create.amenities.safe,
            'allarme': t.chatbots.create.amenities.alarm,
            'animali_ammessi': t.chatbots.create.amenities.petsAllowed,
            'fumatori_ammessi': t.chatbots.create.amenities.smokingAllowed
          }
          return amenityMap[amenity] || amenity
        })
        setValue('amenities', mappedAmenities)
      }
      if (data.neighborhood_description) setValue('neighborhood_description', data.neighborhood_description)
      if (data.transportation_info) setValue('transportation_info', data.transportation_info)
      if (data.shopping_info) setValue('shopping_info', data.shopping_info)
      if (data.parking_info) setValue('parking_info', data.parking_info)
      if (data.special_instructions) setValue('special_instructions', data.special_instructions)
      if (data.welcome_message) setValue('welcome_message', data.welcome_message)
      
      // Gestisce le attrazioni vicine
      if (data.nearby_attractions && Array.isArray(data.nearby_attractions)) {
        data.nearby_attractions.forEach((attraction: any, index: number) => {
          if (index === 0) {
            setValue('nearby_attractions.0.name', attraction.name || '')
            setValue('nearby_attractions.0.note', attraction.description || attraction.note || '')
          } else {
            appendAttraction({
              name: attraction.name || '',
              note: attraction.description || attraction.note || ''
            })
          }
        })
      }
      
      // Gestisce i ristoranti e bar
      if (data.restaurants_bars && Array.isArray(data.restaurants_bars)) {
        data.restaurants_bars.forEach((restaurant: any, index: number) => {
          if (index === 0) {
            setValue('restaurants_bars.0.name', restaurant.name || '')
            setValue('restaurants_bars.0.note', restaurant.type || restaurant.note || '')
          } else {
            appendRestaurant({
              name: restaurant.name || '',
              note: restaurant.type || restaurant.note || ''
            })
          }
        })
      }
      
      // Gestisce i contatti di emergenza
      if (data.emergency_contacts && Array.isArray(data.emergency_contacts)) {
        data.emergency_contacts.forEach((contact: any, index: number) => {
          if (index === 0) {
            setValue('emergency_contacts.0.name', contact.name || '')
            setValue('emergency_contacts.0.number', contact.number || '')
            setValue('emergency_contacts.0.type', contact.type || '')
          } else {
            appendContact({
              name: contact.name || '',
              number: contact.number || '',
              type: contact.type || ''
            })
          }
        })
      }
      
      // Gestisce le FAQ
      if (data.faq && Array.isArray(data.faq)) {
        data.faq.forEach((faq: any, index: number) => {
          if (index === 0) {
            setValue('faq.0.question', faq.question || '')
            setValue('faq.0.answer', faq.answer || '')
          } else {
            appendFaq({
              question: faq.question || '',
              answer: faq.answer || ''
            })
          }
        })
      }
      
      // Gestisce le informazioni WiFi
      if (data.wifi_info) {
        if (data.wifi_info.network) setValue('wifi_info.network', data.wifi_info.network)
        if (data.wifi_info.password) setValue('wifi_info.password', data.wifi_info.password)
      }

      console.log('✅ FRONTEND: Auto-fill completato con successo!')
      const filledFields = Object.keys(data).filter(key => data[key] && data[key] !== '').length
      
      // Controlla se l'indirizzo è stato trovato
      const hasAddress = data.property_address || data.property_city
      const addressMessage = hasAddress 
        ? (language === 'IT' ? ' Incluso l\'indirizzo!' : ' Including address!')
        : ''
      
      toast.success(
        language === 'IT' 
          ? `Analisi completata! ${filledFields} campi compilati automaticamente.${addressMessage} Puoi modificare le informazioni se necessario.`
          : `Analysis completed! ${filledFields} fields filled automatically.${addressMessage} You can modify the information if needed.`
      )
    } catch (error) {
      console.error('❌ FRONTEND: Auto-fill error completo:', error)
      console.error('❌ FRONTEND: Error type:', typeof error)
      console.error('❌ FRONTEND: Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('❌ FRONTEND: Error stack:', error instanceof Error ? error.stack : 'No stack')
      toast.error(t.chatbots.create.form.autoFillError)
    } finally {
      console.log('🚀 FRONTEND: Auto-fill completato, disabilitando loading')
      setIsAutoFilling(false)
    }
  }

  const onSubmit = async (data: ChatbotFormData) => {
    // Verifica se c'è un errore di validazione dell'icona
    if (iconError) {
      toast.error(iconError)
      return
    }
    
    // Validazione finale prima del submit
    
    // Verifica che ci sia almeno un contatto di emergenza
    const validContacts = data.emergency_contacts?.filter(contact => 
      contact.name?.trim() && contact.number?.trim()
    ) || []
    
    if (validContacts.length === 0) {
      toast.error(language === 'IT' 
        ? 'È richiesto almeno un contatto di emergenza (nome e numero). Aggiungi il tuo numero di telefono come host.'
        : 'At least one emergency contact is required (name and number). Add your phone number as the host.'
      )
      setCurrentStep(6) // Vai all'ultimo step
      return
    }
    
    setIsSubmitting(true)
    try {
      // Pulisce e valida i dati prima dell'invio
      let amenitiesWithHotelServices = data.amenities || []
      
      // Se è un albergo e ci sono servizi alberghieri, li concatena agli amenities
      if (data.property_type === 'albergo' && data.hotel_services?.trim()) {
        amenitiesWithHotelServices = [...amenitiesWithHotelServices, data.hotel_services.trim()]
      }
      
      const cleanData = {
        // Campi obbligatori (sempre presenti)
        property_name: data.property_name || '',
        property_type: data.property_type || '',
        property_address: data.property_address || '',
        property_street_number: data.property_street_number || '',
        property_city: data.property_city || '',
        property_state: data.property_state || '',
        property_postal_code: data.property_postal_code || '',
        property_country: data.property_country || '',
        property_description: data.property_description || '',
        check_in_time: data.check_in_time || '',
        check_out_time: data.check_out_time || '',
        house_rules: data.house_rules || '',
        neighborhood_description: data.neighborhood_description || '',
        transportation_info: data.transportation_info || '',
        welcome_message: data.welcome_message || '',
        // Campi opzionali (con valori di default)
        amenities: amenitiesWithHotelServices,
        nearby_attractions: data.nearby_attractions || [],
        restaurants_bars: data.restaurants_bars || [],
        emergency_contacts: data.emergency_contacts || [],
        faq: data.faq || [],
        wifi_info: data.wifi_info || { network: '', password: '' },
        shopping_info: data.shopping_info || '',
        parking_info: data.parking_info || '',
        special_instructions: data.special_instructions || '',
        property_url: data.property_url || '',
        reviews_link: data.reviews_link || ''
      }
      
      console.log('🚀 Invio dati chatbot:', cleanData)
      const response = await chatbots.create(cleanData, iconFile || undefined)
      
      if (response?.data) {
        addChatbot(response.data)
        toast.success(t.chatbots.create.messages.created)
        router.push(`/dashboard/chatbots/${response.data.id}`)
      } else {
        throw new Error('Risposta non valida dal server')
      }
    } catch (error: any) {
      console.error('❌ Errore creazione chatbot:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      
      let errorMessage = t.chatbots.create.messages.error
      
      if (error.response?.status === 422) {
        // Errore di validazione
        if (error.response?.data?.detail) {
          if (Array.isArray(error.response.data.detail)) {
            // Lista di errori di validazione
            const validationErrors = error.response.data.detail.map((err: any) => err.msg || err.message).join(', ')
            errorMessage = language === 'IT' 
              ? `Errore di validazione: ${validationErrors}`
              : `Validation error: ${validationErrors}`
          } else {
            errorMessage = error.response.data.detail
          }
        } else {
          errorMessage = language === 'IT' 
            ? 'Errore di validazione dei dati. Controlla che tutti i campi obbligatori siano compilati.'
            : 'Data validation error. Check that all required fields are filled.'
        }
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    if (currentStep < steps.length) {
      // Validazione specifica per ogni step
      const isValid = await validateCurrentStep()
      if (isValid) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    const currentData = watch()
    let hasErrors = false
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 1: // Step 1 - Informazioni Base
        if (!currentData.property_name?.trim()) {
          newErrors.property_name = language === 'IT' ? 'Nome proprietà richiesto' : 'Property name required'
          hasErrors = true
        }
        if (!currentData.property_type?.trim()) {
          newErrors.property_type = language === 'IT' ? 'Tipo richiesto' : 'Type required'
          hasErrors = true
        }
        
        // Validazione rigorosa dell'indirizzo - TUTTI i campi obbligatori devono essere presenti
        if (!currentData.property_address?.trim()) {
          newErrors.property_address = language === 'IT' 
            ? 'Seleziona un indirizzo dai suggerimenti per compilare automaticamente tutti i campi'
            : 'Select an address from the suggestions to automatically fill all fields'
          hasErrors = true
        }
        if (!currentData.property_street_number?.trim()) {
          newErrors.property_street_number = language === 'IT' ? 'Numero civico richiesto' : 'Street number required'
          hasErrors = true
        }
        if (!currentData.property_city?.trim()) {
          newErrors.property_city = language === 'IT' ? 'Città richiesta' : 'City required'
          hasErrors = true
        }
        if (!currentData.property_postal_code?.trim()) {
          newErrors.property_postal_code = language === 'IT' ? 'CAP richiesto' : 'Postal code required'
          hasErrors = true
        }
        if (!currentData.property_country?.trim()) {
          newErrors.property_country = language === 'IT' ? 'Paese richiesto' : 'Country required'
          hasErrors = true
        }
        
        // Se mancano campi dell'indirizzo, mostra un messaggio più specifico
        if (!currentData.property_address?.trim() || !currentData.property_street_number?.trim() || 
            !currentData.property_city?.trim() || !currentData.property_postal_code?.trim() || 
            !currentData.property_country?.trim()) {
          newErrors.property_address = language === 'IT' 
            ? 'Indirizzo incompleto. Seleziona un indirizzo dai suggerimenti Google per compilare automaticamente tutti i campi richiesti (via, numero civico, città, CAP, paese).'
            : 'Incomplete address. Select an address from Google suggestions to automatically fill all required fields (street, street number, city, postal code, country).'
          hasErrors = true
        }
        break

      case 2: // Step 2 - Proprietà
        if (!currentData.property_description?.trim()) {
          newErrors.property_description = language === 'IT' ? 'Descrizione richiesta' : 'Description required'
          hasErrors = true
        }
        if (!currentData.check_in_time?.trim()) {
          newErrors.check_in_time = language === 'IT' ? 'Orario check-in richiesto' : 'Check-in time required'
          hasErrors = true
        }
        if (!currentData.check_out_time?.trim()) {
          newErrors.check_out_time = language === 'IT' ? 'Orario check-out richiesto' : 'Check-out time required'
          hasErrors = true
        }
        if (!currentData.house_rules?.trim()) {
          newErrors.house_rules = language === 'IT' ? 'Regole richieste' : 'Rules required'
          hasErrors = true
        }
        break

      case 3: // Step 3 - Servizi (tutti opzionali)
        // Nessun campo obbligatorio in questo step
        break

      case 4: // Step 4 - Posizione
        if (!currentData.neighborhood_description?.trim()) {
          newErrors.neighborhood_description = language === 'IT' ? 'Descrizione quartiere richiesta' : 'Neighborhood description required'
          hasErrors = true
        }
        // Le informazioni sui trasporti sono ora opzionali
        break

      case 5: // Step 5 - Servizi Locali (tutti opzionali)
        // Nessun campo obbligatorio in questo step
        break

      case 6: // Step 6 - Finalizzazione
        if (!currentData.welcome_message?.trim()) {
          newErrors.welcome_message = language === 'IT' ? 'Messaggio di benvenuto richiesto' : 'Welcome message required'
          hasErrors = true
        }
        
        // Validazione lunghezza reviews_link
        if (currentData.reviews_link && currentData.reviews_link.length > 1000) {
          newErrors.reviews_link = language === 'IT' 
            ? 'Il link delle recensioni è troppo lungo. Massimo 1000 caratteri consentiti.'
            : 'Reviews link is too long. Maximum 1000 characters allowed.'
          hasErrors = true
        }
        
        // Verifica che ci sia almeno un contatto di emergenza con nome e numero
        const validContacts = currentData.emergency_contacts?.filter(contact => 
          contact.name?.trim() && contact.number?.trim()
        ) || []
        
        if (validContacts.length === 0) {
          newErrors.emergency_contacts = language === 'IT' 
            ? 'È richiesto almeno un contatto di emergenza (nome e numero)'
            : 'At least one emergency contact is required (name and number)'
          hasErrors = true
        }
        break
    }

    // Aggiorna gli errori del form
    if (hasErrors) {
      setFormErrors(newErrors)
      
      // Focus automatico basato sul tipo di errore
      const hasAddressErrors = newErrors.property_address || newErrors.property_street_number || 
                              newErrors.property_city || newErrors.property_postal_code || 
                              newErrors.property_country
      const hasEmergencyContactErrors = newErrors.emergency_contacts
      
      if (hasAddressErrors && addressInputRef.current) {
        // Focus sul campo indirizzo se ci sono errori di indirizzo
        setTimeout(() => {
          addressInputRef.current?.focus()
          addressInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      } else if (hasEmergencyContactErrors) {
        // Auto-compila "host" nel primo contatto se non è già impostato
        const currentData = watch()
        if (currentData.emergency_contacts && currentData.emergency_contacts[0] && !currentData.emergency_contacts[0].type?.trim()) {
          setValue('emergency_contacts.0.type', 'host')
        }
        
        // Focus sul campo nome del primo contatto se ci sono errori di contatti di emergenza
        setTimeout(() => {
          const firstContactNameField = document.querySelector('input[name="emergency_contacts.0.name"]') as HTMLElement
          if (firstContactNameField) {
            firstContactNameField.focus()
            firstContactNameField.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 200) // Aumentato timeout per permettere al setValue di fare effetto
      } else {
        // Focus sul primo campo con errore per altri casi
        const firstErrorField = Object.keys(newErrors)[0]
        if (firstErrorField) {
          setTimeout(() => {
            const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
            if (element) {
              element.focus()
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 100)
        }
      }
      
      // Mostra toast di errore
      const errorCount = Object.keys(newErrors).length
      const errorMessage = language === 'IT' 
        ? `Compila ${errorCount} campo${errorCount > 1 ? 'i' : ''} obbligatorio${errorCount > 1 ? 'i' : ''} per continuare`
        : `Fill in ${errorCount} required field${errorCount > 1 ? 's' : ''} to continue`
      toast.error(errorMessage)
    }

    return !hasErrors
  }

  const prevStep = () => {
    if (currentStep > 1) {
      // Pulisce gli errori quando si torna indietro
      setFormErrors({})
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">{t.chatbots.create.steps.basic}</h2>
            

            <div>
              <label className="label">{t.chatbots.create.form.icon} ({language === 'IT' ? 'opzionale' : 'optional'})</label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleIconChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {iconPreview && (
                  <div className="flex items-center space-x-3">
                    <img 
                      src={iconPreview} 
                      alt="Preview icona" 
                      className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIconFile(null)
                        setIconPreview(null)
                        setIconError(null)
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t.chatbots.create.form.remove}
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {t.chatbots.create.form.supportedFormats}
                </p>
                {iconError && (
                  <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded border border-red-200">
                    {iconError}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.propertyName}</label>
              <input
                {...register('property_name', { required: language === 'IT' ? 'Nome proprietà richiesto' : 'Property name required' })}
                className={`input-field ${formErrors.property_name ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Es. Casa Bella Vista" : "E.g. Bella Vista House"}
                onChange={(e) => {
                  register('property_name').onChange(e)
                  clearFieldError('property_name')
                }}
              />
              {(errors.property_name || formErrors.property_name) && (
                <p className="error-text">{errors.property_name?.message || formErrors.property_name}</p>
              )}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.propertyType}</label>
              <select
                {...register('property_type', { required: language === 'IT' ? 'Tipo richiesto' : 'Type required' })}
                className={`input-field ${formErrors.property_type ? 'border-red-500' : ''}`}
                onChange={(e) => {
                  register('property_type').onChange(e)
                  clearFieldError('property_type')
                }}
              >
                <option value="">{t.chatbots.create.form.select}</option>
                <option value="albergo">{t.chatbots.create.form.propertyTypes.hotel}</option>
                <option value="bed_breakfast">{t.chatbots.create.form.propertyTypes.bedBreakfast}</option>
                <option value="campeggio">{t.chatbots.create.form.propertyTypes.camping}</option>
                <option value="appartamento">{t.chatbots.create.form.propertyTypes.apartment}</option>
                <option value="stanza">{t.chatbots.create.form.propertyTypes.room}</option>
              </select>
              {(errors.property_type || formErrors.property_type) && (
                <p className="error-text">{errors.property_type?.message || formErrors.property_type}</p>
              )}
            </div>

            <div>
              <label className="label">{language === 'IT' ? 'Indirizzo Proprietà' : 'Property Address'}</label>
              <p className="text-sm text-gray-600 mb-2">
                {language === 'IT' 
                  ? '💡 Inizia a digitare l\'indirizzo e seleziona dai suggerimenti per compilare automaticamente tutti i campi'
                  : '💡 Start typing the address and select from suggestions to automatically fill all fields'
                }
              </p>
              <div className="relative">
                <input
                  ref={addressInputRef}
                  type="text"
                  value={addressInputValue}
                  className="input-field"
                  placeholder={language === 'IT' ? "Inizia a digitare l'indirizzo..." : "Start typing the address..."}
                  onChange={(e) => {
                    handleAddressInputChange(e.target.value)
                  }}
                  disabled={isLoadingAddress}
                />
                {isLoadingAddress && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        onClick={() => selectAddress(suggestion)}
                      >
                        <div className="font-medium text-sm">{suggestion.main_text}</div>
                        <div className="text-xs text-gray-500">{suggestion.secondary_text}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">
                {language === 'IT' ? 'Dettagli Indirizzo (compilati automaticamente)' : 'Address Details (filled automatically)'}
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
            <div>
                  <label className="label">{language === 'IT' ? 'Via' : 'Street'}</label>
              <input
                    {...register('property_address')}
                    className={`input-field bg-gray-100 cursor-not-allowed ${formErrors.property_address ? 'border-red-500' : ''}`}
                    placeholder={language === 'IT' ? "Compilato automaticamente" : "Filled automatically"}
                    readOnly
                    tabIndex={-1}
                  />
                </div>

                <div>
                  <label className="label">{language === 'IT' ? 'Numero Civico' : 'Street Number'}</label>
                  <input
                    {...register('property_street_number')}
                    className={`input-field bg-gray-100 cursor-not-allowed ${formErrors.property_street_number ? 'border-red-500' : ''}`}
                    placeholder={language === 'IT' ? "Compilato automaticamente" : "Filled automatically"}
                    readOnly
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="label">{language === 'IT' ? 'Città' : 'City'}</label>
                  <input
                    {...register('property_city')}
                    className={`input-field bg-gray-100 cursor-not-allowed ${formErrors.property_city ? 'border-red-500' : ''}`}
                    placeholder={language === 'IT' ? "Compilato automaticamente" : "Filled automatically"}
                    readOnly
                    tabIndex={-1}
                  />
                </div>

                <div>
                  <label className="label">{language === 'IT' ? 'Provincia/Stato' : 'State/Province'}</label>
                  <input
                    {...register('property_state')}
                    className="input-field bg-gray-100 cursor-not-allowed"
                    placeholder={language === 'IT' ? "Compilato automaticamente" : "Filled automatically"}
                    readOnly
                    tabIndex={-1}
                  />
                </div>

                <div>
                  <label className="label">{language === 'IT' ? 'CAP' : 'Postal Code'}</label>
                  <input
                    {...register('property_postal_code')}
                    className={`input-field bg-gray-100 cursor-not-allowed ${formErrors.property_postal_code ? 'border-red-500' : ''}`}
                    placeholder={language === 'IT' ? "Compilato automaticamente" : "Filled automatically"}
                    readOnly
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="label">{language === 'IT' ? 'Paese' : 'Country'}</label>
                <input
                  {...register('property_country')}
                  className={`input-field bg-gray-100 cursor-not-allowed ${formErrors.property_country ? 'border-red-500' : ''}`}
                  placeholder={language === 'IT' ? "Compilato automaticamente" : "Filled automatically"}
                  readOnly
                  tabIndex={-1}
                />
              </div>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.propertyUrl}</label>
              <div className="space-y-3">
                <input
                  {...register('property_url')}
                  className="input-field"
                  placeholder={t.chatbots.create.form.propertyUrlPlaceholder}
                  type="url"
                />
                <p className="text-sm text-gray-600">
                  {language === 'IT' 
                    ? 'Incolla l\'URL della pagina della proprietà (sito web, airbnb, booking, ecc.). L\'AI analizzerà automaticamente la pagina e compilerà i campi del form.'
                    : 'Paste the URL of the property page (website, airbnb, booking, etc.). The AI will automatically analyze the page and fill in the form fields.'
                  }
                </p>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isAutoFilling}
                  className={`btn-primary flex items-center justify-center ${isAutoFilling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isAutoFilling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'IT' ? 'Analizzando...' : 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {language === 'IT' ? 'Auto-fill con AI' : 'AI Auto-fill'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">{t.chatbots.create.steps.property}</h2>
            
            <div>
              <label className="label">{t.chatbots.create.form.propertyDescription}</label>
              <textarea
                {...register('property_description', { required: language === 'IT' ? 'Descrizione richiesta' : 'Description required' })}
                className={`input-field min-h-32 ${formErrors.property_description ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Descrivi la tua proprietà, gli spazi, le camere, etc..." : "Describe your property, spaces, rooms, etc..."}
                onChange={(e) => {
                  register('property_description').onChange(e)
                  clearFieldError('property_description')
                }}
              />
              {(errors.property_description || formErrors.property_description) && (
                <p className="error-text">{errors.property_description?.message || formErrors.property_description}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t.chatbots.create.form.checkInTime}</label>
                <input
                  {...register('check_in_time', { required: language === 'IT' ? 'Orario check-in richiesto' : 'Check-in time required' })}
                  className={`input-field ${formErrors.check_in_time ? 'border-red-500' : ''}`}
                  placeholder={language === 'IT' ? "Es. 15:00 - 20:00" : "E.g. 3:00 PM - 8:00 PM"}
                  onChange={(e) => {
                    register('check_in_time').onChange(e)
                    clearFieldError('check_in_time')
                  }}
                />
                {(errors.check_in_time || formErrors.check_in_time) && (
                  <p className="error-text">{errors.check_in_time?.message || formErrors.check_in_time}</p>
                )}
              </div>

              <div>
                <label className="label">{t.chatbots.create.form.checkOutTime}</label>
                <input
                  {...register('check_out_time', { required: language === 'IT' ? 'Orario check-out richiesto' : 'Check-out time required' })}
                  className={`input-field ${formErrors.check_out_time ? 'border-red-500' : ''}`}
                  placeholder={language === 'IT' ? "Es. 10:00" : "E.g. 10:00 AM"}
                  onChange={(e) => {
                    register('check_out_time').onChange(e)
                    clearFieldError('check_out_time')
                  }}
                />
                {(errors.check_out_time || formErrors.check_out_time) && (
                  <p className="error-text">{errors.check_out_time?.message || formErrors.check_out_time}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.houseRules}</label>
              
              {/* Upload file option */}
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    {language === 'IT' ? '📁 Carica documento regole' : '📁 Upload rules document'}
                  </span>
                  {rulesFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setRulesFile(null)
                        setRulesError(null)
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕ {language === 'IT' ? 'Rimuovi' : 'Remove'}
                    </button>
                  )}
                </div>
                
                <input
                  type="file"
                  accept=".pdf,.docx,.odt,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,text/plain"
                  onChange={handleRulesFileChange}
                  disabled={isLoadingRules}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50"
                />
                
                {isLoadingRules && (
                  <div className="flex items-center mt-2 text-blue-600">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="text-sm">
                      {language === 'IT' ? 'Elaborazione documento...' : 'Processing document...'}
                    </span>
                  </div>
                )}
                
                
                <p className="text-xs text-blue-600 mt-1">
                  {language === 'IT' 
                    ? 'Formati supportati: PDF, DOCX, ODT, TXT (max 10MB). Il contenuto verrà estratto e inserito automaticamente nel campo sottostante.'
                    : 'Supported formats: PDF, DOCX, ODT, TXT (max 10MB). Content will be extracted and automatically inserted in the field below.'
                  }
                </p>
                
                {rulesError && (
                  <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded border border-red-200">
                    {rulesError}
                  </div>
                )}
              </div>

              <textarea
                {...register('house_rules', { required: language === 'IT' ? 'Regole richieste' : 'Rules required' })}
                className={`input-field min-h-32 ${formErrors.house_rules ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Es. Non fumatori, no party, rispettare il vicinato... (oppure carica un documento sopra)" : "E.g. No smoking, no parties, respect neighbors... (or upload a document above)"}
                onChange={(e) => {
                  register('house_rules').onChange(e)
                  clearFieldError('house_rules')
                }}
              />
              {(errors.house_rules || formErrors.house_rules) && (
                <p className="error-text">{errors.house_rules?.message || formErrors.house_rules}</p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">{t.chatbots.create.steps.amenities}</h2>
            
            <div>
              <label className="label">{t.chatbots.create.form.amenities}</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesList.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedAmenities?.includes(amenity)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-center">
                      {selectedAmenities?.includes(amenity) && <Check className="w-4 h-4 mr-2" />}
                      {amenity}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t.chatbots.create.form.wifiNetwork}</label>
                <input
                  {...register('wifi_info.network')}
                  className="input-field"
                  placeholder={language === 'IT' ? "Es. CasaBellaVista_WiFi" : "E.g. BellaVista_WiFi"}
                />
              </div>

              <div>
                <label className="label">{t.chatbots.create.form.wifiPassword}</label>
                <input
                  {...register('wifi_info.password')}
                  className="input-field"
                  placeholder={language === 'IT' ? "Es. password123" : "E.g. password123"}
                />
              </div>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.parkingInfo}</label>
              <textarea
                {...register('parking_info')}
                className="input-field"
                placeholder={language === 'IT' ? "Descrivi le opzioni di parcheggio disponibili..." : "Describe available parking options..."}
              />
            </div>

            {selectedPropertyType === 'albergo' && (
              <div>
                <label className="label">{t.chatbots.create.form.hotelServices}</label>
                <textarea
                  {...register('hotel_services')}
                  className="input-field min-h-24"
                  placeholder={t.chatbots.create.form.hotelServicesPlaceholder}
                />
              </div>
            )}

            <div>
              <label className="label">{t.chatbots.create.form.specialInstructions}</label>
              <textarea
                {...register('special_instructions')}
                className="input-field"
                placeholder={language === 'IT' ? "Es. Come usare gli elettrodomestici, dove trovare le cose..." : "E.g. How to use appliances, where to find things..."}
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">{t.chatbots.create.steps.location}</h2>
            
            <div>
              <label className="label">{t.chatbots.create.form.neighborhoodDescription}</label>
              <textarea
                {...register('neighborhood_description', { required: language === 'IT' ? 'Descrizione quartiere richiesta' : 'Neighborhood description required' })}
                className={`input-field min-h-24 ${formErrors.neighborhood_description ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Descrivi il quartiere, l'atmosfera, cosa c'è nelle vicinanze..." : "Describe the neighborhood, atmosphere, what's nearby..."}
                onChange={(e) => {
                  register('neighborhood_description').onChange(e)
                  clearFieldError('neighborhood_description')
                }}
              />
              {(errors.neighborhood_description || formErrors.neighborhood_description) && (
                <p className="error-text">{errors.neighborhood_description?.message || formErrors.neighborhood_description}</p>
              )}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.transportationInfo} ({language === 'IT' ? 'opzionale' : 'optional'})</label>
              <textarea
                {...register('transportation_info')}
                className="input-field min-h-24"
                placeholder={language === 'IT' ? "Come muoversi: metro, bus, taxi, noleggio auto..." : "How to get around: metro, bus, taxi, car rental..."}
              />
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.shoppingInfo}</label>
              <textarea
                {...register('shopping_info')}
                className="input-field"
                placeholder={language === 'IT' ? "Supermercati, negozi, centri commerciali nelle vicinanze..." : "Supermarkets, shops, shopping centers nearby..."}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">{t.chatbots.create.steps.services}</h2>
            
            <div>
              <label className="label">{t.chatbots.create.form.nearbyAttractions}</label>
              {attractionFields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      {...register(`nearby_attractions.${index}.name`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Nome attrazione" : "Attraction name"}
                    />
                    <input
                      {...register(`nearby_attractions.${index}.note`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Note (opzionali)" : "Notes (optional)"}
                    />
                  </div>
                  {attractionFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAttraction(index)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      {t.chatbots.create.form.remove}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendAttraction({ name: '', note: '' })}
                className="text-primary hover:text-secondary"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                {t.chatbots.create.form.addAttraction}
              </button>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.restaurantsBars}</label>
              {restaurantFields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      {...register(`restaurants_bars.${index}.name`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Nome locale" : "Venue name"}
                    />
                    <input
                      {...register(`restaurants_bars.${index}.note`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Note (opzionali)" : "Notes (optional)"}
                    />
                  </div>
                  {restaurantFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRestaurant(index)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      {t.chatbots.create.form.remove}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendRestaurant({ name: '', note: '' })}
                className="text-primary hover:text-secondary"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                {language === 'IT' ? 'Aggiungi Locale' : 'Add Venue'}
              </button>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">{t.chatbots.create.steps.final}</h2>
            
            <div>
              <label className="label">{t.chatbots.create.form.emergencyContacts} <span className="text-red-500">*</span></label>
              <p className="text-sm text-gray-600 mb-3">
                {language === 'IT' 
                  ? 'È richiesto almeno un contatto di emergenza (nome e numero). Aggiungi il tuo numero di telefono come host.'
                  : 'At least one emergency contact is required (name and number). Add your phone number as the host.'
                }
              </p>
              {formErrors.emergency_contacts && (
                <p className="error-text mb-3">{formErrors.emergency_contacts}</p>
              )}
              {contactFields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      {...register(`emergency_contacts.${index}.name`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Nome/Servizio" : "Name/Service"}
                      onChange={(e) => {
                        register(`emergency_contacts.${index}.name`).onChange(e)
                        clearFieldError('emergency_contacts')
                      }}
                    />
                    <input
                      {...register(`emergency_contacts.${index}.number`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Numero" : "Number"}
                      onChange={(e) => {
                        register(`emergency_contacts.${index}.number`).onChange(e)
                        clearFieldError('emergency_contacts')
                      }}
                    />
                    <input
                      {...register(`emergency_contacts.${index}.type`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Tipo (es. Host, Polizia)" : "Type (e.g. Host, Police)"}
                      onChange={(e) => {
                        register(`emergency_contacts.${index}.type`).onChange(e)
                        clearFieldError('emergency_contacts')
                      }}
                    />
                  </div>
                  {contactFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      {t.chatbots.create.form.remove}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendContact({ name: '', number: '', type: '' })}
                className="text-primary hover:text-secondary"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                {t.chatbots.create.form.addContact}
              </button>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.faq}</label>
              {faqFields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <input
                    {...register(`faq.${index}.question`)}
                    className="input-field mb-2"
                    placeholder={language === 'IT' ? "Domanda" : "Question"}
                  />
                  <textarea
                    {...register(`faq.${index}.answer`)}
                    className="input-field"
                    placeholder={language === 'IT' ? "Risposta" : "Answer"}
                  />
                  {faqFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      {t.chatbots.create.form.remove}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendFaq({ question: '', answer: '' })}
                className="text-primary hover:text-secondary"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                {t.chatbots.create.form.addFaq}
              </button>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.welcomeMessage}</label>
              <textarea
                {...register('welcome_message', { required: language === 'IT' ? 'Messaggio di benvenuto richiesto' : 'Welcome message required' })}
                className={`input-field min-h-24 ${formErrors.welcome_message ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Es. Ciao! Sono l'assistente virtuale di Casa Bella Vista. Come posso aiutarti?" : "E.g. Hi! I'm the virtual assistant of Bella Vista House. How can I help you?"}
                onChange={(e) => {
                  register('welcome_message').onChange(e)
                  clearFieldError('welcome_message')
                }}
              />
              {(errors.welcome_message || formErrors.welcome_message) && (
                <p className="error-text">{errors.welcome_message?.message || formErrors.welcome_message}</p>
              )}
            </div>

            <div>
              <label className="label">{language === 'IT' ? 'Link per recensioni (opzionale)' : 'Reviews Link (optional)'}</label>
              <input
                {...register('reviews_link', {
                  validate: (value) => {
                    if (value && value.length > 1000) {
                      return language === 'IT' 
                        ? 'Il link è troppo lungo. Massimo 1000 caratteri consentiti.'
                        : 'Link is too long. Maximum 1000 characters allowed.'
                    }
                    return true
                  }
                })}
                className={`input-field ${formErrors.reviews_link ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Es. https://www.google.com/maps/place/..." : "E.g. https://www.google.com/maps/place/..."}
                type="url"
                onChange={(e) => {
                  register('reviews_link').onChange(e)
                  clearFieldError('reviews_link')
                  
                  // Validazione in tempo reale
                  if (e.target.value.length > 1000) {
                    setFormErrors(prev => ({
                      ...prev,
                      reviews_link: language === 'IT' 
                        ? 'Il link è troppo lungo. Massimo 1000 caratteri consentiti.'
                        : 'Link is too long. Maximum 1000 characters allowed.'
                    }))
                  }
                }}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-600">
                  {language === 'IT' 
                    ? 'Link dove gli ospiti possono lasciare recensioni (Google Maps, TripAdvisor, ecc.)'
                    : 'Link where guests can leave reviews (Google Maps, TripAdvisor, etc.)'
                  }
                </p>
                <p className={`text-xs ${watch('reviews_link')?.length > 1000 ? 'text-red-500' : 'text-gray-400'}`}>
                  {watch('reviews_link')?.length || 0}/1000
                </p>
              </div>
              {(errors.reviews_link || formErrors.reviews_link) && (
                <p className="error-text">{errors.reviews_link?.message || formErrors.reviews_link}</p>
              )}
            </div>


            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 mb-2">{t.chatbots.create.form.allReady}</h3>
              <p className="text-green-700">
                {t.chatbots.create.form.allInfoEntered}
              </p>
            </div>
          </div>
        )


      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-primary">
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t.chatbots.create.form.backToDashboard}
            </Link>
            <h1 className="text-xl font-semibold">{t.chatbots.create.form.createNewChatbot}</h1>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar -mx-4 px-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={`flex items-center ${index < steps.length - 1 ? 'flex-1 min-w-[160px]' : 'min-w-[140px]'}`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep >= step.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`ml-2 text-sm hidden sm:block ${
                        currentStep >= step.id ? 'text-primary font-semibold' : 'text-gray-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 hidden md:block ${
                        currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  {t.chatbots.create.buttons.previous}
                </button>
              )}
              
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary flex items-center sm:ml-auto"
                >
                  {t.chatbots.create.buttons.next}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center sm:ml-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t.chatbots.create.messages.creating}
                    </>
                  ) : (
                    <>
                      {t.chatbots.create.buttons.create}
                      <Check className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
