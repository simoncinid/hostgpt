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
}

const steps = [
  { id: 1, name: 'Informazioni Base', icon: Home },
  { id: 2, name: 'Dettagli Proprietà', icon: MapPin },
  { id: 3, name: 'Servizi e Regole', icon: Wifi },
  { id: 4, name: 'Zona e Trasporti', icon: Car },
  { id: 5, name: 'Luoghi di Interesse', icon: Coffee },
  { id: 6, name: 'Contatti e FAQ', icon: Phone },
  { id: 7, name: 'Configurazione Bot', icon: MessageSquare },
]

// Amenities list will be created dynamically from translations

export default function CreateChatbotPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  
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

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Verifica che sia un'immagine
      if (!file.type.startsWith('image/')) {
        toast.error('Seleziona un file immagine (PNG o JPG)')
        return
      }
      
      // Verifica dimensione (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'immagine non può superare i 5MB')
        return
      }
      
      setIconFile(file)
      
      // Crea preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: ChatbotFormData) => {
    setIsSubmitting(true)
    try {
      const response = await chatbots.create(data, iconFile || undefined)
      addChatbot(response.data)
      toast.success(t.chatbots.create.messages.created)
      router.push(`/dashboard/chatbots/${response.data.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t.chatbots.create.messages.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Informazioni Base</h2>
            
            <div>
              <label className="label">Nome del Chatbot</label>
              <input
                {...register('name', { required: 'Nome richiesto' })}
                className="input-field"
                placeholder="Es. Assistente Casa Bella Vista"
              />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.icon} (opzionale)</label>
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
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Rimuovi
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Formati supportati: PNG, JPG. Dimensione massima: 5MB
                </p>
              </div>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.propertyName}</label>
              <input
                {...register('property_name', { required: 'Nome proprietà richiesto' })}
                className="input-field"
                placeholder="Es. Casa Bella Vista"
              />
              {errors.property_name && <p className="error-text">{errors.property_name.message}</p>}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.propertyType}</label>
              <select
                {...register('property_type', { required: 'Tipo richiesto' })}
                className="input-field"
              >
                <option value="">Seleziona...</option>
                <option value="appartamento">Appartamento</option>
                <option value="casa">Casa</option>
                <option value="villa">Villa</option>
                <option value="stanza">Stanza</option>
                <option value="loft">Loft</option>
                <option value="monolocale">Monolocale</option>
                <option value="bed_breakfast">Bed & Breakfast</option>
              </select>
              {errors.property_type && <p className="error-text">{errors.property_type.message}</p>}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.propertyAddress}</label>
              <input
                {...register('property_address', { required: 'Indirizzo richiesto' })}
                className="input-field"
                placeholder="Es. Via Roma 123"
              />
              {errors.property_address && <p className="error-text">{errors.property_address.message}</p>}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.propertyCity}</label>
              <input
                {...register('property_city', { required: 'Città richiesta' })}
                className="input-field"
                placeholder="Es. Roma"
              />
              {errors.property_city && <p className="error-text">{errors.property_city.message}</p>}
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
                {...register('property_description', { required: 'Descrizione richiesta' })}
                className="input-field min-h-32"
                placeholder="Descrivi la tua proprietà, gli spazi, le camere, etc..."
              />
              {errors.property_description && <p className="error-text">{errors.property_description.message}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t.chatbots.create.form.checkInTime}</label>
                <input
                  {...register('check_in_time', { required: 'Orario check-in richiesto' })}
                  className="input-field"
                  placeholder="Es. 15:00 - 20:00"
                />
                {errors.check_in_time && <p className="error-text">{errors.check_in_time.message}</p>}
              </div>

              <div>
                <label className="label">{t.chatbots.create.form.checkOutTime}</label>
                <input
                  {...register('check_out_time', { required: 'Orario check-out richiesto' })}
                  className="input-field"
                  placeholder="Es. 10:00"
                />
                {errors.check_out_time && <p className="error-text">{errors.check_out_time.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.houseRules}</label>
              <textarea
                {...register('house_rules', { required: 'Regole richieste' })}
                className="input-field min-h-24"
                placeholder="Es. Non fumatori, no party, rispettare il vicinato..."
              />
              {errors.house_rules && <p className="error-text">{errors.house_rules.message}</p>}
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
                  placeholder="Es. CasaBellaVista_WiFi"
                />
              </div>

              <div>
                <label className="label">{t.chatbots.create.form.wifiPassword}</label>
                <input
                  {...register('wifi_info.password')}
                  className="input-field"
                  placeholder="Es. password123"
                />
              </div>
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.parkingInfo}</label>
              <textarea
                {...register('parking_info')}
                className="input-field"
                placeholder="Descrivi le opzioni di parcheggio disponibili..."
              />
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.specialInstructions}</label>
              <textarea
                {...register('special_instructions')}
                className="input-field"
                placeholder="Es. Come usare gli elettrodomestici, dove trovare le cose..."
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
                {...register('neighborhood_description', { required: 'Descrizione quartiere richiesta' })}
                className="input-field min-h-24"
                placeholder="Descrivi il quartiere, l'atmosfera, cosa c'è nelle vicinanze..."
              />
              {errors.neighborhood_description && <p className="error-text">{errors.neighborhood_description.message}</p>}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.transportationInfo}</label>
              <textarea
                {...register('transportation_info', { required: 'Info trasporti richieste' })}
                className="input-field min-h-24"
                placeholder="Come muoversi: metro, bus, taxi, noleggio auto..."
              />
              {errors.transportation_info && <p className="error-text">{errors.transportation_info.message}</p>}
            </div>

            <div>
              <label className="label">{t.chatbots.create.form.shoppingInfo}</label>
              <textarea
                {...register('shopping_info')}
                className="input-field"
                placeholder="Supermercati, negozi, centri commerciali nelle vicinanze..."
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
                      placeholder="Nome attrazione"
                    />
                    <input
                      {...register(`nearby_attractions.${index}.distance`)}
                      className="input-field"
                      placeholder="Distanza (es. 500m)"
                    />
                    <input
                      {...register(`nearby_attractions.${index}.description`)}
                      className="input-field"
                      placeholder="Breve descrizione"
                    />
                  </div>
                  {attractionFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAttraction(index)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Rimuovi
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
                      placeholder="Nome locale"
                    />
                    <input
                      {...register(`restaurants_bars.${index}.type`)}
                      className="input-field"
                      placeholder="Tipo (es. Pizzeria)"
                    />
                    <input
                      {...register(`restaurants_bars.${index}.distance`)}
                      className="input-field"
                      placeholder="Distanza"
                    />
                  </div>
                  {restaurantFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRestaurant(index)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Rimuovi
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
                Aggiungi Locale
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
                      placeholder="Nome/Servizio"
                    />
                    <input
                      {...register(`emergency_contacts.${index}.number`)}
                      className="input-field"
                      placeholder="Numero"
                    />
                    <input
                      {...register(`emergency_contacts.${index}.type`)}
                      className="input-field"
                      placeholder="Tipo (es. Polizia)"
                    />
                  </div>
                  {contactFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Rimuovi
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
                Aggiungi Contatto
              </button>
            </div>

            <div>
              <label className="label">Domande Frequenti (FAQ)</label>
              {faqFields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <input
                    {...register(`faq.${index}.question`)}
                    className="input-field mb-2"
                    placeholder="Domanda"
                  />
                  <textarea
                    {...register(`faq.${index}.answer`)}
                    className="input-field"
                    placeholder="Risposta"
                  />
                  {faqFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Rimuovi
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
                Aggiungi FAQ
              </button>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">{t.chatbots.create.steps.final}</h2>
            
            <div>
              <label className="label">{t.chatbots.create.form.welcomeMessage}</label>
              <textarea
                {...register('welcome_message', { required: 'Messaggio di benvenuto richiesto' })}
                className="input-field min-h-24"
                placeholder="Es. Ciao! Sono l'assistente virtuale di Casa Bella Vista. Come posso aiutarti?"
              />
              {errors.welcome_message && <p className="error-text">{errors.welcome_message.message}</p>}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 mb-2">Tutto pronto!</h3>
              <p className="text-green-700">
                Hai inserito tutte le informazioni necessarie. Il tuo chatbot sarà creato e allenato
                con questi dati. Potrai sempre modificarli in seguito dalla dashboard.
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
              Torna alla Dashboard
            </Link>
            <h1 className="text-xl font-semibold">Crea Nuovo Chatbot</h1>
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
