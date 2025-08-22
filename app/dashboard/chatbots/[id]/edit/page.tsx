'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { chatbots as chatbotsApi } from '@/lib/api'
import { useChatbotStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface FormValues {
  name?: string
  property_description?: string
  neighborhood_description?: string
  house_rules?: string
  special_instructions?: string
  welcome_message?: string
  faq?: { question: string; answer: string }[]
}

export default function EditChatbotPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const { currentChatbot, setCurrentChatbot, updateChatbot } = useChatbotStore()

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await chatbotsApi.get(id)
        setCurrentChatbot(res.data)
        reset({
          name: res.data.name,
          property_description: res.data.property_description,
          neighborhood_description: res.data.neighborhood_description,
          house_rules: res.data.house_rules,
          special_instructions: res.data.special_instructions,
          welcome_message: res.data.welcome_message,
          faq: res.data.faq || []
        })
      } catch (e: any) {
        toast.error(e.response?.data?.detail || 'Errore nel caricamento')
        router.replace(`/dashboard/chatbots/${id}`)
      }
    }
    load()
  }, [id])

  const onSubmit = async (data: FormValues) => {
    try {
      await chatbotsApi.update(id, data)
      updateChatbot(id, data as any)
      toast.success('Chatbot aggiornato')
      router.push(`/dashboard/chatbots/${id}`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Errore nell\'aggiornamento')
    }
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
            <div>
              <label className="label">Nome</label>
              <input {...register('name')} className="input-field" />
            </div>

            <div>
              <label className="label">Messaggio di Benvenuto</label>
              <textarea {...register('welcome_message')} className="input-field min-h-24" />
            </div>

            <div>
              <label className="label">Descrizione della Proprietà</label>
              <textarea {...register('property_description')} className="input-field min-h-24" />
            </div>

            <div>
              <label className="label">Descrizione del Quartiere</label>
              <textarea {...register('neighborhood_description')} className="input-field min-h-24" />
            </div>

            <div>
              <label className="label">Regole della Casa</label>
              <textarea {...register('house_rules')} className="input-field min-h-24" />
            </div>

            <div>
              <label className="label">Istruzioni Speciali</label>
              <textarea {...register('special_instructions')} className="input-field min-h-24" />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salva Modifiche
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


