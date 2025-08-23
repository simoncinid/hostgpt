'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Save, Plus, X } from 'lucide-react'
import { chatbots as chatbotsApi } from '@/lib/api'
import { useChatbotStore } from '@/lib/store'
import toast from 'react-hot-toast'

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
  wifi_info?: { network_name: string; password: string }
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
          wifi_info: res.data.wifi_info || { network_name: '', password: '' },
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
      await chatbotsApi.update(id, data)
      updateChatbot(id, data as any)
      toast.success('Chatbot aggiornato e riallenato con successo')
      router.push(`/dashboard/chatbots/${id}`)
    } catch (e: any) {
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
                {watchedAmenities.map((amenity, index) => (
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
                  onClick={addAmenity}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Servizio
                </button>
              </div>
            </div>

            {/* WiFi */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Informazioni WiFi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nome Rete</label>
                  <input {...register('wifi_info.network_name')} className="input-field" />
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
                {watchedAttractions.map((attraction, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Nome</label>
                        <input {...register(`nearby_attractions.${index}.name`)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Distanza</label>
                        <input {...register(`nearby_attractions.${index}.distance`)} className="input-field" placeholder="es. 500m" />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeAttraction(index)}
                          className="btn-secondary text-sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Rimuovi
                        </button>
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
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Attrazione
                </button>
              </div>
            </div>

            {/* Ristoranti e Bar */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Ristoranti e Bar</h2>
              <div className="space-y-4">
                {watchedRestaurants.map((restaurant, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Nome</label>
                        <input {...register(`restaurants_bars.${index}.name`)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Distanza</label>
                        <input {...register(`restaurants_bars.${index}.distance`)} className="input-field" placeholder="es. 300m" />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeRestaurant(index)}
                          className="btn-secondary text-sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Rimuovi
                        </button>
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
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Ristorante/Bar
                </button>
              </div>
            </div>

            {/* Contatti Emergenza */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Contatti di Emergenza</h2>
              <div className="space-y-4">
                {watchedContacts.map((contact, index) => (
                  <div key={index} className="border rounded-lg p-4">
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
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="btn-secondary text-sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rimuovi
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addContact}
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Contatto
                </button>
              </div>
            </div>

            {/* FAQ */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">FAQ Personalizzate</h2>
              <div className="space-y-4">
                {watchedFaq.map((faq, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <label className="label">Domanda {index + 1}</label>
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="btn-secondary text-sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rimuovi
                      </button>
                    </div>
                    <input {...register(`faq.${index}.question`)} className="input-field mb-2" placeholder="Domanda..." />
                    <textarea {...register(`faq.${index}.answer`)} className="input-field min-h-16" placeholder="Risposta..." />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFaq}
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi FAQ
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
    </div>
  )
}


