'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Save, Plus, X, Check } from 'lucide-react'
import { chatbots as chatbotsApi } from '@/lib/api'
import { useChatbotStore } from '@/lib/store'
import toast from 'react-hot-toast'

const amenitiesList = [
  'WiFi', 'Aria Condizionata', 'Riscaldamento', 'TV', 'Netflix',
  'Cucina', 'Lavastoviglie', 'Lavatrice', 'Asciugatrice', 'Ferro da stiro',
  'Parcheggio', 'Piscina', 'Palestra', 'Balcone', 'Giardino',
  'Ascensore', 'Cassaforte', 'Allarme', 'Animali ammessi', 'Fumatori ammessi'
]

interface FormValues {
  name?: string
  property_name?: string
  property_type?: string
  property_address?: string
  property_city?: string
  property_description?: string
  check_in_time?: string
  check_out_time?: string
  house_rules?: string
  amenities?: string[]
  neighborhood_description?: string
  nearby_attractions?: { name: string; description: string; distance: string }[]
  transportation_info?: string
  restaurants_bars?: { name: string; description: string; distance: string }[]
  shopping_info?: string
  emergency_contacts?: { name: string; phone: string; type: string }[]
  wifi_info?: { network: string; password: string }
  parking_info?: string
  special_instructions?: string
  faq?: { question: string; answer: string }[]
  welcome_message?: string
  language?: string
}

export default function EditChatbotPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const { currentChatbot, setCurrentChatbot, updateChatbot } = useChatbotStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showServicesModal, setShowServicesModal] = useState(false)
  const [showAttractionsModal, setShowAttractionsModal] = useState(false)
  const [showRestaurantsModal, setShowRestaurantsModal] = useState(false)
  const [showFaqModal, setShowFaqModal] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>()
  const watchedAmenities = watch('amenities') || []
  const watchedAttractions = watch('nearby_attractions') || []
  const watchedRestaurants = watch('restaurants_bars') || []
  const watchedContacts = watch('emergency_contacts') || []
  const watchedFaq = watch('faq') || []

  useEffect(() => {
    const load = async () => {
      try {
        const res = await chatbotsApi.get(id)
        setCurrentChatbot(res.data)
        reset({
          name: res.data.name,
          property_name: res.data.property_name,
          property_type: res.data.property_type,
          property_address: res.data.property_address,
          property_city: res.data.property_city,
          property_description: res.data.property_description,
          check_in_time: res.data.check_in_time,
          check_out_time: res.data.check_out_time,
          house_rules: res.data.house_rules,
          amenities: res.data.amenities || [],
          neighborhood_description: res.data.neighborhood_description,
          nearby_attractions: res.data.nearby_attractions || [],
          transportation_info: res.data.transportation_info,
          restaurants_bars: res.data.restaurants_bars || [],
          shopping_info: res.data.shopping_info,
          emergency_contacts: res.data.emergency_contacts || [],
          wifi_info: res.data.wifi_info || { network: '', password: '' },
          parking_info: res.data.parking_info,
          special_instructions: res.data.special_instructions,
          faq: res.data.faq || [],
          welcome_message: res.data.welcome_message,
          language: res.data.language || 'it'
        })
      } catch (e: any) {
        toast.error(e.response?.data?.detail || 'Errore nel caricamento')
        router.replace(`/dashboard/chatbots/${id}`)
      }
    }
    load()
  }, [id])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      console.log('Dati da inviare:', data)
      console.log('Property name:', data.property_name)
      console.log('Name:', data.name)
      await chatbotsApi.update(id, data)
      updateChatbot(id, data as any)
      toast.success('Chatbot aggiornato e riallenato con successo')
      router.push(`/dashboard/chatbots/${id}`)
    } catch (e: any) {
      console.error('Errore aggiornamento:', e)
      console.error('Response data:', e.response?.data)
      toast.error(e.response?.data?.detail || 'Errore nell\'aggiornamento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addAmenity = () => {
    const newAmenity = prompt('Inserisci un nuovo servizio:')
    if (newAmenity) {
      setValue('amenities', [...watchedAmenities, newAmenity])
    }
  }

  const removeAmenity = (index: number) => {
    setValue('amenities', watchedAmenities.filter((_, i) => i !== index))
  }

  const addAttraction = () => {
    setValue('nearby_attractions', [...watchedAttractions, { name: '', description: '', distance: '' }])
  }

  const removeAttraction = (index: number) => {
    setValue('nearby_attractions', watchedAttractions.filter((_, i) => i !== index))
  }

  const addRestaurant = () => {
    setValue('restaurants_bars', [...watchedRestaurants, { name: '', description: '', distance: '' }])
  }

  const removeRestaurant = (index: number) => {
    setValue('restaurants_bars', watchedRestaurants.filter((_, i) => i !== index))
  }

  const addContact = () => {
    setValue('emergency_contacts', [...watchedContacts, { name: '', phone: '', type: '' }])
  }

  const removeContact = (index: number) => {
    setValue('emergency_contacts', watchedContacts.filter((_, i) => i !== index))
  }

  const addFaq = () => {
    setValue('faq', [...watchedFaq, { question: '', answer: '' }])
  }

  const removeFaq = (index: number) => {
    setValue('faq', watchedFaq.filter((_, i) => i !== index))
  }

  const selectedAmenities = watch('amenities') || []

  const toggleAmenity = (amenity: string) => {
    const current = selectedAmenities || []
    if (current.includes(amenity)) {
      setValue('amenities', current.filter(a => a !== amenity))
    } else {
      setValue('amenities', [...current, amenity])
    }
  }

  const openServicesModal = () => {
    setShowServicesModal(true)
  }

  const closeServicesModal = () => {
    setShowServicesModal(false)
  }

  const openAttractionsModal = () => {
    setShowAttractionsModal(true)
  }

  const closeAttractionsModal = () => {
    setShowAttractionsModal(false)
  }

  const openRestaurantsModal = () => {
    setShowRestaurantsModal(true)
  }

  const closeRestaurantsModal = () => {
    setShowRestaurantsModal(false)
  }

  const openFaqModal = () => {
    setShowFaqModal(true)
  }

  const closeFaqModal = () => {
    setShowFaqModal(false)
  }

  if (!currentChatbot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Caricamento...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/dashboard/chatbots/${id}`} className="text-gray-600 hover:text-primary flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Indietro
          </Link>
          <h1 className="text-xl font-semibold hidden md:block">Modifica Chatbot</h1>
        </div>
      </div>

      <div className="bg-white shadow-sm md:hidden">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold">Modifica Chatbot</h1>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-2xl shadow p-6 space-y-6"
          >
            {/* Informazioni Base */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Informazioni Base</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nome Chatbot</label>
                  <input {...register('name')} className="input-field" />
                </div>
                <div>
                  <label className="label">Nome Proprietà</label>
                  <input {...register('property_name')} className="input-field" />
                </div>
                <div>
                  <label className="label">Tipo Proprietà</label>
                  <select {...register('property_type')} className="input-field">
                    <option value="">Seleziona tipo</option>
                    <option value="appartamento">Appartamento</option>
                    <option value="villa">Villa</option>
                    <option value="casa">Casa</option>
                    <option value="stanza">Stanza</option>
                    <option value="loft">Loft</option>
                  </select>
                </div>
                <div>
                  <label className="label">Città</label>
                  <input {...register('property_city')} className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Indirizzo</label>
                  <input {...register('property_address')} className="input-field" />
                </div>
                <div>
                  <label className="label">Check-in</label>
                  <input {...register('check_in_time')} className="input-field" placeholder="es. 15:00-20:00" />
                </div>
                <div>
                  <label className="label">Check-out</label>
                  <input {...register('check_out_time')} className="input-field" placeholder="es. 10:00" />
                </div>
              </div>
            </div>

            {/* Descrizione Proprietà */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Descrizione Proprietà</h2>
              <div>
                <label className="label">Descrizione Dettagliata</label>
                <textarea {...register('property_description')} className="input-field min-h-24" placeholder="Descrivi la proprietà, le stanze, i servizi disponibili..." />
              </div>
            </div>

            {/* Servizi */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Servizi Disponibili</h2>
              <div className="space-y-2">
                {watchedAmenities.filter(amenity => amenity && amenity.trim()).map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      {...register(`amenities.${index}`)}
                      className="input-field flex-1"
                      placeholder="Nome servizio"
                    />
                    <button
                      type="button"
                      onClick={() => removeAmenity(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={openServicesModal}
                  className="w-full py-3 px-4 border-2 border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Gestisci Servizi
                </button>
              </div>
            </div>

            {/* WiFi */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Informazioni WiFi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nome Rete</label>
                  <input {...register('wifi_info.network')} className="input-field" />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input {...register('wifi_info.password')} className="input-field" />
                </div>
              </div>
            </div>

            {/* Parcheggio */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Informazioni Parcheggio</h2>
              <div>
                <label className="label">Dettagli Parcheggio</label>
                <textarea {...register('parking_info')} className="input-field min-h-20" placeholder="Informazioni su parcheggio gratuito, a pagamento, garage..." />
              </div>
            </div>

            {/* Regole Casa */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Regole della Casa</h2>
              <div>
                <label className="label">Regole e Norme</label>
                <textarea {...register('house_rules')} className="input-field min-h-24" placeholder="Regole della casa, orari, divieti..." />
              </div>
            </div>

            {/* Istruzioni Speciali */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Istruzioni Speciali</h2>
              <div>
                <label className="label">Istruzioni Aggiuntive</label>
                <textarea {...register('special_instructions')} className="input-field min-h-24" placeholder="Istruzioni per check-in, accesso, problemi comuni..." />
              </div>
            </div>

            {/* Zona e Quartiere */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Zona e Quartiere</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Descrizione Quartiere</label>
                  <textarea {...register('neighborhood_description')} className="input-field min-h-20" placeholder="Descrizione della zona, atmosfera, caratteristiche..." />
                </div>
                <div>
                  <label className="label">Trasporti</label>
                  <textarea {...register('transportation_info')} className="input-field min-h-20" placeholder="Metro, bus, taxi, stazioni..." />
                </div>
                <div>
                  <label className="label">Shopping</label>
                  <textarea {...register('shopping_info')} className="input-field min-h-20" placeholder="Centri commerciali, negozi, mercati..." />
                </div>
              </div>
            </div>

            {/* Attrazioni Vicine */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Attrazioni Vicine</h2>
              <div className="space-y-4">
                {watchedAttractions
                  .filter(attraction => 
                    attraction.name?.trim() || 
                    attraction.distance?.trim() || 
                    attraction.description?.trim()
                  )
                  .map((attraction, index) => (
                  <div key={index} className="border rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeAttraction(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Nome</label>
                        <input {...register(`nearby_attractions.${index}.name`)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Distanza</label>
                        <input {...register(`nearby_attractions.${index}.distance`)} className="input-field" placeholder="es. 500m" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="label">Descrizione</label>
                      <textarea {...register(`nearby_attractions.${index}.description`)} className="input-field min-h-16" />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={openAttractionsModal}
                  className="w-full py-3 px-4 border-2 border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Gestisci Attrazioni
                </button>
              </div>
            </div>

            {/* Ristoranti e Bar */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Ristoranti e Bar</h2>
              <div className="space-y-4">
                {watchedRestaurants
                  .filter(restaurant => 
                    restaurant.name?.trim() || 
                    restaurant.distance?.trim() || 
                    restaurant.description?.trim()
                  )
                  .map((restaurant, index) => (
                  <div key={index} className="border rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeRestaurant(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Nome</label>
                        <input {...register(`restaurants_bars.${index}.name`)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Distanza</label>
                        <input {...register(`restaurants_bars.${index}.distance`)} className="input-field" placeholder="es. 300m" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="label">Descrizione</label>
                      <textarea {...register(`restaurants_bars.${index}.description`)} className="input-field min-h-16" />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={openRestaurantsModal}
                  className="w-full py-3 px-4 border-2 border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Gestisci Ristoranti/Bar
                </button>
              </div>
            </div>

            {/* Contatti Emergenza */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Contatti di Emergenza</h2>
              <div className="space-y-4">
                {watchedContacts
                  .filter(contact => 
                    contact.name?.trim() || 
                    contact.phone?.trim() || 
                    contact.type?.trim()
                  )
                  .map((contact, index) => (
                  <div key={index} className="border rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Nome</label>
                        <input {...register(`emergency_contacts.${index}.name`)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Telefono</label>
                        <input {...register(`emergency_contacts.${index}.phone`)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Tipo</label>
                        <select {...register(`emergency_contacts.${index}.type`)} className="input-field">
                          <option value="">Seleziona tipo</option>
                          <option value="host">Host</option>
                          <option value="emergency">Emergenza</option>
                          <option value="maintenance">Manutenzione</option>
                          <option value="cleaning">Pulizie</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addContact}
                  className="w-full py-3 px-4 border-2 border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Aggiungi Contatto
                </button>
              </div>
            </div>

            {/* FAQ */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">FAQ Personalizzate</h2>
              <div className="space-y-4">
                {watchedFaq
                  .filter(faq => 
                    faq.question?.trim() || 
                    faq.answer?.trim()
                  )
                  .map((faq, index) => (
                  <div key={index} className="border rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="mb-2">
                      <label className="label">Domanda {index + 1}</label>
                    </div>
                    <input {...register(`faq.${index}.question`)} className="input-field mb-2" placeholder="Domanda..." />
                    <textarea {...register(`faq.${index}.answer`)} className="input-field min-h-16" placeholder="Risposta..." />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={openFaqModal}
                  className="w-full py-3 px-4 border-2 border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Gestisci FAQ
                </button>
              </div>
            </div>

            {/* Messaggio di Benvenuto */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Messaggio di Benvenuto</h2>
              <div>
                <label className="label">Messaggio Iniziale</label>
                <textarea {...register('welcome_message')} className="input-field min-h-24" placeholder="Messaggio di benvenuto che apparirà quando un ospite inizia la chat..." />
              </div>
            </div>

            {/* Lingua */}
            <div className="pb-6">
              <h2 className="text-lg font-semibold mb-4">Lingua</h2>
              <div>
                <label className="label">Lingua del Chatbot</label>
                <select {...register('language')} className="input-field">
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Salvataggio e Riallenamento...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salva e Riallena Chatbot
                  </>
                )}
              </button>
                         </div>
           </motion.form>
         </div>
       </div>

               {/* Modal Servizi */}
        {showServicesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Seleziona Servizi</h2>
                  <button
                    onClick={closeServicesModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {amenitiesList.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-3 rounded-lg border-2 transition ${
                        selectedAmenities?.includes(amenity)
                          ? 'border-rose-500 bg-rose-50 text-rose-600'
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
                
                <div className="flex justify-end">
                  <button
                    onClick={closeServicesModal}
                    className="btn-primary"
                  >
                    Fatto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Attrazioni */}
        {showAttractionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Gestisci Attrazioni</h2>
                  <button
                    onClick={closeAttractionsModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  {watchedAttractions.map((attraction, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Nome</label>
                          <input {...register(`nearby_attractions.${index}.name`)} className="input-field" />
                        </div>
                        <div>
                          <label className="label">Distanza</label>
                          <input {...register(`nearby_attractions.${index}.distance`)} className="input-field" placeholder="es. 500m" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="label">Descrizione</label>
                        <textarea {...register(`nearby_attractions.${index}.description`)} className="input-field min-h-16" />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAttraction}
                    className="w-full py-3 px-4 border-2 border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Aggiungi Attrazione
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={closeAttractionsModal}
                    className="btn-primary"
                  >
                    Fatto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ristoranti */}
        {showRestaurantsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Gestisci Ristoranti e Bar</h2>
                  <button
                    onClick={closeRestaurantsModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  {watchedRestaurants.map((restaurant, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Nome</label>
                          <input {...register(`restaurants_bars.${index}.name`)} className="input-field" />
                        </div>
                        <div>
                          <label className="label">Distanza</label>
                          <input {...register(`restaurants_bars.${index}.distance`)} className="input-field" placeholder="es. 300m" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="label">Descrizione</label>
                        <textarea {...register(`restaurants_bars.${index}.description`)} className="input-field min-h-16" />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRestaurant}
                    className="w-full py-3 px-4 border-2 border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Aggiungi Ristorante/Bar
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={closeRestaurantsModal}
                    className="btn-primary"
                  >
                    Fatto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal FAQ */}
        {showFaqModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Gestisci FAQ</h2>
                  <button
                    onClick={closeFaqModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  {watchedFaq.map((faq, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="mb-2">
                        <label className="label">Domanda {index + 1}</label>
                      </div>
                      <input {...register(`faq.${index}.question`)} className="input-field mb-2" placeholder="Domanda..." />
                      <textarea {...register(`faq.${index}.answer`)} className="input-field min-h-16" placeholder="Risposta..." />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFaq}
                    className="w-full py-3 px-4 border-2 border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Aggiungi FAQ
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={closeFaqModal}
                    className="btn-primary"
                  >
                    Fatto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
     </div>
   )
 }


