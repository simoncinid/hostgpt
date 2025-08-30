'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import api, { subscription } from '@/lib/api'

interface LoginForm {
  email: string
  password: string
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth } = useAuthStore()
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  useEffect(() => {
    const registered = searchParams.get('registered')
    const subscriptionSuccess = searchParams.get('subscription') === 'success'
    const freeTrialStarted = searchParams.get('free_trial_started') === 'true'
    const tokenFromUrl = searchParams.get('token')
    
    if (registered) {
      toast.success('Controlla la tua email e clicca il link di verifica per continuare')
    }
    if (subscriptionSuccess) {
      // Messaggio informativo; la conferma avverrà dopo il login con token
      toast.success('Pagamento effettuato! Ora puoi accedere')
    }
    if (freeTrialStarted) {
      toast.success('🎉 Periodo di prova gratuito avviato! Ora puoi accedere alla dashboard')
    }
    if (tokenFromUrl) {
      // Se c'è un token dalla verifica email, autentica automaticamente
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', tokenFromUrl)
      }
      setAuth(tokenFromUrl)
    }
  }, [searchParams, setAuth])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      // Controlla se c'è un token dalla verifica email
      const tokenFromUrl = searchParams.get('token')
      
      if (tokenFromUrl) {
        // Se c'è un token dalla verifica email, è già stato gestito nell'useEffect
        // Non fare nulla qui
      } else {
        // Altrimenti fai il login normale
        const response = await api.post('/auth/login', data)
        const { access_token } = response.data
        
        // Salva token e user info
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', access_token)
        }
        setAuth(access_token)
      }
      
      // Se ritorno da Stripe con successo, prova a confermare la sottoscrizione ora che siamo autenticati
      const subscriptionSuccess = searchParams.get('subscription') === 'success'
      const sessionId = searchParams.get('session_id') || undefined
      if (subscriptionSuccess) {
        try {
          await subscription.confirm(sessionId)
        } catch {}
      }

      // Verifica stato abbonamento: se non attivo, porta al checkout
      try {
        const me = await api.get('/auth/me')
        const subscriptionStatus = me.data?.subscription_status
        const isVerified = me.data?.is_verified
        const wantsFreeTrial = me.data?.wants_free_trial
        
        if (!isVerified) {
          toast.error('Devi verificare la tua email. Controlla la posta e clicca il link di verifica.')
          return
        }
        
        if (!['active', 'cancelling', 'free_trial'].includes(subscriptionStatus)) {
          // Se l'utente non ha scelto il free trial, va al checkout
          if (!wantsFreeTrial) {
            toast('Completa il pagamento per continuare', { icon: '💳' })
            router.push('/checkout')
          } else {
            // Se ha scelto il free trial ma non è attivo, c'è un problema
            toast.error('Errore nell\'avvio del periodo di prova. Contatta il supporto.')
            return
          }
        } else {
          toast.success('Accesso effettuato con successo!')
          router.push('/dashboard')
        }
      } catch {
        // fallback sicuro
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Errore durante il login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      {/* Logo - nascosto su mobile */}
      <Link href="/" className="absolute top-8 left-8 hidden md:flex items-center space-x-2">
        <Home className="w-8 h-8 text-primary" />
        <span className="text-2xl font-bold text-dark">HostGPT</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md md:max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 md:min-h-fit min-h-[calc(100vh-2rem)] flex flex-col justify-center">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">Bentornato!</h1>
            <p className="text-gray-600 text-sm md:text-base">Accedi al tuo account HostGPT</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-6 flex-1 flex flex-col justify-center">
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
                      value: 6,
                      message: 'La password deve essere almeno 6 caratteri'
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
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-gray-600">Ricordami</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary hover:text-secondary">
                Password dimenticata?
              </Link>
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
                  Accedi
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>



          {/* Sign Up Link */}
          <p className="text-center mt-8 text-gray-600">
            Non hai un account?{' '}
            <Link href="/register" className="text-primary hover:text-secondary font-semibold">
              Registrati ora
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// Componente di fallback per il loading
function LoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-dark mb-2">Caricamento...</h1>
            <p className="text-gray-600">Preparazione della pagina di accesso.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principale avvolto in Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
