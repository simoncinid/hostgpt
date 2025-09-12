'use client'

import { useEffect, useState } from 'react'
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
import { chatbots } from '@/lib/api'
import { useChatbotStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'

interface ChatbotFormData {
  name: string
  property_name: string
  property_type: string
  property_address: string
  property_city: string
  property_description: string
  check_in_time: string
  check_out_time: string
  house_rules: string
  amenities: string[]
  neighborhood_description: string
  nearby_attractions: { name: string; distance: string; description: string }[]
  transportation_info: string
  restaurants_bars: { name: string; type: string; distance: string }[]
  shopping_info: string
  emergency_contacts: { name: string; number: string; type: string }[]
  wifi_info: { network: string; password: string }
  parking_info: string
  special_instructions: string
  faq: { question: string; answer: string }[]
  welcome_message: string
  property_url: string
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
  const { addChatbot } = useChatbotStore()
  
  // Se esiste già un chatbot, reindirizza ai dettagli (limite 1 per account)
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const res = await chatbots.list()
        const bots = res.data || []
        if (bots.length >= 1) {
          router.replace(`/dashboard/chatbots/${bots[0].id}`)
        }
      } catch {}
    }
    checkExisting()
  }, [])
  
  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm<ChatbotFormData>({
    defaultValues: {
      amenities: [],
      nearby_attractions: [{ name: '', distance: '', description: '' }],
      restaurants_bars: [{ name: '', type: '', distance: '' }],
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
        const errorText = await response.text()
        console.log('❌ FRONTEND: Error response body:', errorText)
        throw new Error('Failed to analyze property')
      }

      console.log('🚀 FRONTEND: Parsing JSON response')
      const data = await response.json()
      console.log('🚀 FRONTEND: Dati ricevuti:', data)
      
      // Riempie i campi con i dati ricevuti
      if (data.property_name) setValue('property_name', data.property_name)
      if (data.property_type) {
        // Mappa il tipo di proprietà dall'API ai valori del frontend
        const propertyTypeMap: { [key: string]: string } = {
          'appartamento': 'appartamento',
          'villa': 'villa',
          'casa': 'casa',
          'stanza': 'stanza',
          'loft': 'loft',
          'monolocale': 'monolocale',
          'bed_breakfast': 'bed_breakfast'
        }
        const mappedType = propertyTypeMap[data.property_type] || data.property_type
        setValue('property_type', mappedType)
      }
      if (data.property_address) setValue('property_address', data.property_address)
      if (data.property_city) setValue('property_city', data.property_city)
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
            setValue('nearby_attractions.0.distance', attraction.distance || '')
            setValue('nearby_attractions.0.description', attraction.description || '')
          } else {
            appendAttraction({
              name: attraction.name || '',
              distance: attraction.distance || '',
              description: attraction.description || ''
            })
          }
        })
      }
      
      // Gestisce i ristoranti e bar
      if (data.restaurants_bars && Array.isArray(data.restaurants_bars)) {
        data.restaurants_bars.forEach((restaurant: any, index: number) => {
          if (index === 0) {
            setValue('restaurants_bars.0.name', restaurant.name || '')
            setValue('restaurants_bars.0.type', restaurant.type || '')
            setValue('restaurants_bars.0.distance', restaurant.distance || '')
          } else {
            appendRestaurant({
              name: restaurant.name || '',
              type: restaurant.type || '',
              distance: restaurant.distance || ''
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
      toast.success(t.chatbots.create.form.autoFillSuccess)
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
    
    setIsSubmitting(true)
    try {
      // Pulisce e valida i dati prima dell'invio
      const cleanData = {
        // Campi obbligatori (sempre presenti)
        name: data.name || '',
        property_name: data.property_name || '',
        property_type: data.property_type || '',
        property_address: data.property_address || '',
        property_city: data.property_city || '',
        property_description: data.property_description || '',
        check_in_time: data.check_in_time || '',
        check_out_time: data.check_out_time || '',
        house_rules: data.house_rules || '',
        neighborhood_description: data.neighborhood_description || '',
        transportation_info: data.transportation_info || '',
        welcome_message: data.welcome_message || '',
        // Campi opzionali (con valori di default)
        amenities: data.amenities || [],
        nearby_attractions: data.nearby_attractions || [],
        restaurants_bars: data.restaurants_bars || [],
        emergency_contacts: data.emergency_contacts || [],
        faq: data.faq || [],
        wifi_info: data.wifi_info || { network: '', password: '' },
        shopping_info: data.shopping_info || '',
        parking_info: data.parking_info || '',
        special_instructions: data.special_instructions || '',
        property_url: data.property_url || ''
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
        if (!currentData.name?.trim()) {
          newErrors.name = language === 'IT' ? 'Nome richiesto' : 'Name required'
          hasErrors = true
        }
        if (!currentData.property_name?.trim()) {
          newErrors.property_name = language === 'IT' ? 'Nome proprietà richiesto' : 'Property name required'
          hasErrors = true
        }
        if (!currentData.property_type?.trim()) {
          newErrors.property_type = language === 'IT' ? 'Tipo richiesto' : 'Type required'
          hasErrors = true
        }
        if (!currentData.property_address?.trim()) {
          newErrors.property_address = language === 'IT' ? 'Indirizzo richiesto' : 'Address required'
          hasErrors = true
        }
        if (!currentData.property_city?.trim()) {
          newErrors.property_city = language === 'IT' ? 'Città richiesta' : 'City required'
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
        if (!currentData.transportation_info?.trim()) {
          newErrors.transportation_info = language === 'IT' ? 'Info trasporti richieste' : 'Transportation info required'
          hasErrors = true
        }
        break

      case 5: // Step 5 - Servizi Locali (tutti opzionali)
        // Nessun campo obbligatorio in questo step
        break

      case 6: // Step 6 - Finalizzazione
        if (!currentData.welcome_message?.trim()) {
          newErrors.welcome_message = language === 'IT' ? 'Messaggio di benvenuto richiesto' : 'Welcome message required'
          hasErrors = true
        }
        break
    }

    // Aggiorna gli errori del form
    if (hasErrors) {
      setFormErrors(newErrors)
      
      // Focus sul primo campo con errore
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
              <label className="label">{t.chatbots.create.form.name}</label>
              <input
                {...register('name', { required: language === 'IT' ? 'Nome richiesto' : 'Name required' })}
                className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Es. Assistente Casa Bella Vista" : "E.g. Bella Vista House Assistant"}
                onChange={(e) => {
                  register('name').onChange(e)
                  clearFieldError('name')
                }}
              />
              {(errors.name || formErrors.name) && (
                <p className="error-text">{errors.name?.message || formErrors.name}</p>
              )}
            </div>

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
                <option value="appartamento">{t.chatbots.create.form.propertyTypes.apartment}</option>
                <option value="casa">{t.chatbots.create.form.propertyTypes.house}</option>
                <option value="villa">{t.chatbots.create.form.propertyTypes.villa}</option>
                <option value="stanza">{t.chatbots.create.form.propertyTypes.room}</option>
                <option value="loft">{t.chatbots.create.form.propertyTypes.loft}</option>
                <option value="monolocale">{t.chatbots.create.form.propertyTypes.studio}</option>
                <option value="bed_breakfast">{t.chatbots.create.form.propertyTypes.bedBreakfast}</option>
              </select>
              {(errors.property_type || formErrors.property_type) && (
                <p className="error-text">{errors.property_type?.message || formErrors.property_type}</p>
              )}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.propertyAddress}</label>
              <input
                {...register('property_address', { required: language === 'IT' ? 'Indirizzo richiesto' : 'Address required' })}
                className={`input-field ${formErrors.property_address ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Es. Via Roma 123" : "E.g. 123 Main Street"}
                onChange={(e) => {
                  register('property_address').onChange(e)
                  clearFieldError('property_address')
                }}
              />
              {(errors.property_address || formErrors.property_address) && (
                <p className="error-text">{errors.property_address?.message || formErrors.property_address}</p>
              )}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.propertyCity}</label>
              <input
                {...register('property_city', { required: language === 'IT' ? 'Città richiesta' : 'City required' })}
                className={`input-field ${formErrors.property_city ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Es. Roma" : "E.g. Rome"}
                onChange={(e) => {
                  register('property_city').onChange(e)
                  clearFieldError('property_city')
                }}
              />
              {(errors.property_city || formErrors.property_city) && (
                <p className="error-text">{errors.property_city?.message || formErrors.property_city}</p>
              )}
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
                  {t.chatbots.create.form.propertyUrlHelp}
                </p>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={true}
                  className="btn-primary flex items-center justify-center opacity-50 cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'IT' ? 'Auto-fill (Temporaneamente disabilitato)' : 'Auto-fill (Temporarily disabled)'}
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
              <textarea
                {...register('house_rules', { required: language === 'IT' ? 'Regole richieste' : 'Rules required' })}
                className={`input-field min-h-24 ${formErrors.house_rules ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Es. Non fumatori, no party, rispettare il vicinato..." : "E.g. No smoking, no parties, respect neighbors..."}
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
              <label className="label">{t.chatbots.create.form.transportationInfo}</label>
              <textarea
                {...register('transportation_info', { required: language === 'IT' ? 'Info trasporti richieste' : 'Transportation info required' })}
                className={`input-field min-h-24 ${formErrors.transportation_info ? 'border-red-500' : ''}`}
                placeholder={language === 'IT' ? "Come muoversi: metro, bus, taxi, noleggio auto..." : "How to get around: metro, bus, taxi, car rental..."}
                onChange={(e) => {
                  register('transportation_info').onChange(e)
                  clearFieldError('transportation_info')
                }}
              />
              {(errors.transportation_info || formErrors.transportation_info) && (
                <p className="error-text">{errors.transportation_info?.message || formErrors.transportation_info}</p>
              )}
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
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      {...register(`nearby_attractions.${index}.name`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Nome attrazione" : "Attraction name"}
                    />
                    <input
                      {...register(`nearby_attractions.${index}.distance`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Distanza (es. 500m)" : "Distance (e.g. 500m)"}
                    />
                    <input
                      {...register(`nearby_attractions.${index}.description`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Breve descrizione" : "Brief description"}
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
                onClick={() => appendAttraction({ name: '', distance: '', description: '' })}
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
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      {...register(`restaurants_bars.${index}.name`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Nome locale" : "Venue name"}
                    />
                    <input
                      {...register(`restaurants_bars.${index}.type`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Tipo (es. Pizzeria)" : "Type (e.g. Pizzeria)"}
                    />
                    <input
                      {...register(`restaurants_bars.${index}.distance`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Distanza" : "Distance"}
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
                onClick={() => appendRestaurant({ name: '', type: '', distance: '' })}
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
              <label className="label">{t.chatbots.create.form.emergencyContacts}</label>
              {contactFields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      {...register(`emergency_contacts.${index}.name`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Nome/Servizio" : "Name/Service"}
                    />
                    <input
                      {...register(`emergency_contacts.${index}.number`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Numero" : "Number"}
                    />
                    <input
                      {...register(`emergency_contacts.${index}.type`)}
                      className="input-field"
                      placeholder={language === 'IT' ? "Tipo (es. Polizia)" : "Type (e.g. Police)"}
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
