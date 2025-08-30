'use client'

import { useState, useEffect, Suspense } from 'react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'

interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  phone?: string
  terms: boolean
}

// Componente per gestire i search params
function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFreeTrial, setIsFreeTrial] = useState(false)
  const { setAuth } = useAuthStore()
  
  // Check if user comes from landing page for free trial
  useEffect(() => {
    if (searchParams) {
      setIsFreeTrial(searchParams.get('free_trial') === 'true')
    }
  }, [searchParams])
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        wants_free_trial: isFreeTrial
      })
      
             // Dopo la registrazione, mandiamo l'utente alla pagina che spiega di verificare l'email
       const message = isFreeTrial 
         ? 'Registrazione completata! Controlla la tua email per il link di verifica e inizia la prova gratuita.'
         : 'Registrazione completata! Controlla la tua email per il link di verifica e completa il pagamento.'
       toast.success(message)
       router.push('/login?registered=1')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Errore durante la registrazione')
    } finally {
      setIsLoading(false)
    }
  }

  const passwordRequirements = [
    { text: 'Almeno 8 caratteri', check: password?.length >= 8 },
    { text: 'Una lettera maiuscola', check: /[A-Z]/.test(password || '') },
    { text: 'Una lettera minuscola', check: /[a-z]/.test(password || '') },
    { text: 'Un numero', check: /[0-9]/.test(password || '') },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      {/* Logo - nascosto su mobile */}
      <Link href="/" className="absolute top-8 left-8 hidden md:flex items-center space-x-2">
        <Home className="w-8 h-8 text-primary" />
        <span className="text-2xl font-bold text-dark">HostGPT</span>
      </Link>

      <div className="w-full max-w-md md:max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 md:min-h-fit min-h-[calc(100vh-2rem)] flex flex-col justify-center">
                   <div className="text-center mb-6 md:mb-8">
           <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">Crea il tuo Account</h1>
           <p className="text-gray-600 text-sm md:text-base">
             {isFreeTrial ? 'Inizia la prova gratuita di 14 giorni' : 'Inizia subito con HostGPT'}
           </p>
           {isFreeTrial && (
             <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
               <p className="text-green-700 text-sm font-medium">
                 🎉 Hai selezionato la prova gratuita! Dopo la registrazione potrai iniziare subito a creare il tuo chatbot.
               </p>
             </div>
           )}
           {!isFreeTrial && (
             <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
               <p className="text-blue-700 text-sm font-medium">
                 💳 Dopo la registrazione completerai il pagamento per attivare il tuo abbonamento.
               </p>
             </div>
           )}
         </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5 flex-1 flex flex-col justify-center">
          {/* Nome Completo */}
          <div>
            <label className="label">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                {...register('full_name', {
                  required: 'Nome richiesto',
                  minLength: {
                    value: 2,
                    message: 'Il nome deve essere almeno 2 caratteri'
                  }
                })}
                className="input-field pl-10"
                placeholder="Mario Rossi"
              />
            </div>
            {errors.full_name && (
              <p className="error-text">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                {...register('email', {
                  required: 'Email richiesta',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email non valida'
                  }
                })}
                className="input-field pl-10"
                placeholder="nome@esempio.com"
              />
            </div>
            {errors.email && (
              <p className="error-text">{errors.email.message}</p>
            )}
          </div>

          {/* Telefono (opzionale) */}
          <div>
            <label className="label">Telefono (opzionale)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                {...register('phone')}
                className="input-field pl-10"
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password richiesta',
                  minLength: {
                    value: 8,
                    message: 'La password deve essere almeno 8 caratteri'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'La password deve contenere maiuscole, minuscole e numeri'
                  }
                })}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="error-text">{errors.password.message}</p>
            )}
            
            {/* Password Requirements */}
            {password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <Check className={`w-4 h-4 mr-2 ${req.check ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={req.check ? 'text-green-500' : 'text-gray-400'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conferma Password */}
          <div>
            <label className="label">Conferma Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Conferma la password',
                  validate: value => value === password || 'Le password non corrispondono'
                })}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start">
              <input
                type="checkbox"
                {...register('terms', {
                  required: 'Devi accettare i termini e condizioni'
                })}
                className="mt-1 mr-2"
              />
              <span className="text-sm text-gray-600">
                Accetto i{' '}
                <Link href="/terms" className="text-primary hover:text-secondary">
                  Termini e Condizioni
                </Link>
                {' '}e la{' '}
                <Link href="/privacy" className="text-primary hover:text-secondary">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p className="error-text">{errors.terms.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {isLoading ? (
              <div className="loading-spinner w-6 h-6" />
            ) : (
              <>
                Crea Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center mt-8 text-gray-600">
          Hai già un account?{' '}
          <Link href="/login" className="text-primary hover:text-secondary font-semibold">
            Accedi ora
          </Link>
        </p>
      </div>
    </div>
  </div>
  )
}

// Loading component
function RegisterLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  )
}
