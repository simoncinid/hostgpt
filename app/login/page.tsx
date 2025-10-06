'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import api, { subscription } from '@/lib/api'

interface LoginForm {
  email: string
  password: string
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, setLanguage } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth } = useAuthStore()
  
  // Gestione token di invito
  const inviteToken = searchParams.get('invite_token')
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<LoginForm>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  })
  
  // Debug: log errors and form values
  console.log('Form errors:', errors)
  console.log('Form values:', watch())

  // Gestione autocomplete del browser
  const handleAutocomplete = (field: 'email' | 'password', value: string) => {
    setValue(field, value)
  }

  // Gestione click sui suggerimenti
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }

  // Gestione focus per prevenire perdita di focus
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  // Gestione blur per prevenire perdita di dati
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name && value) {
      setValue(name as 'email' | 'password', value)
    }
  }

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
    console.log('Form submitted with data:', data)
    setIsLoading(true)
    try {
      // Controlla se c'è un token dalla verifica email
      const tokenFromUrl = searchParams.get('token')
      
      if (tokenFromUrl) {
        // Se c'è un token dalla verifica email, è già stato gestito nell'useEffect
        // Non fare nulla qui
        console.log('Token from URL found, skipping login')
      } else {
        // Altrimenti fai il login normale
        console.log('Attempting login with:', { email: data.email, password: data.password ? '***' : 'empty' })
        const response = await api.post('/auth/login', data)
        const { access_token } = response.data
        
        // Salva token e user info
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', access_token)
        }
        setAuth(access_token)
        console.log('Login successful')
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
        const userLanguage = me.data?.language
        
        // Imposta la lingua corretta se disponibile
        if (userLanguage && (userLanguage === 'en' || userLanguage === 'it')) {
          const frontendLanguage = userLanguage === 'en' ? 'ENG' : 'IT'
          setLanguage(frontendLanguage)
        }
        
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
          // Se c'è un token di invito, accettalo
          if (inviteToken) {
            try {
              await api.post('/api/collaborators/accept-invite', {
                invite_token: inviteToken
              })
              toast.success('Invito accettato! Ora puoi collaborare su questo chatbot.')
            } catch (error: any) {
              console.error('Error accepting invite:', error)
              // Non bloccare il login se l'invito non può essere accettato
              toast.error('Errore nell\'accettazione dell\'invito, ma il login è stato effettuato.')
            }
          }
          
          toast.success('Accesso effettuato con successo!')
          router.push('/dashboard')
        }
      } catch {
        // fallback sicuro - accetta l'invito se presente
        if (inviteToken) {
          try {
            await api.post('/api/collaborators/accept-invite', {
              invite_token: inviteToken
            })
            toast.success('Invito accettato! Ora puoi collaborare su questo chatbot.')
          } catch (error: any) {
            console.error('Error accepting invite:', error)
            toast.error('Errore nell\'accettazione dell\'invito, ma il login è stato effettuato.')
          }
        }
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Errore durante il login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 h-auto md:h-auto flex flex-col">
          {/* Header con freccetta per tornare indietro */}
          <div className="flex justify-between items-start mb-6 flex-shrink-0">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">{t.auth.login.title}</h1>
              <p className="text-gray-600 text-sm md:text-base">{t.auth.login.subtitle}</p>
            </div>
            <Link 
              href="/" 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 ml-4"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
          </div>

          {/* Form Content */}
          <div className="flex-1 flex flex-col">
            <form 
              onSubmit={handleSubmit(onSubmit, (errors) => {
                console.log('Form validation failed:', errors)
              })} 
              className="flex-1 flex flex-col"
              autoComplete="on"
              noValidate
            >
              {/* Layout desktop */}
              <div className="hidden md:block space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.login.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      {...register('email', {
                        required: t.auth.login.email + ' richiesta',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email non valida'
                        }
                      })}
                      className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                      placeholder="nome@esempio.com"
                      autoComplete="email"
                      onClick={handleInputClick}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onChange={(e) => {
                        setValue('email', e.target.value)
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement
                        handleAutocomplete('email', target.value)
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.login.password}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: t.auth.login.password + ' richiesta',
                        minLength: {
                          value: 6,
                          message: 'La password deve essere almeno 6 caratteri'
                        }
                      })}
                      className="w-full px-4 py-2.5 pl-10 pr-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      onClick={handleInputClick}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onChange={(e) => {
                        setValue('password', e.target.value)
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement
                        handleAutocomplete('password', target.value)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-600">{t.auth.login.rememberMe}</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:text-secondary">
                    {t.auth.login.forgotPassword}
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.preventDefault()
                    console.log('Desktop button clicked')
                    const formData = getValues()
                    console.log('Form data on submit:', formData)
                    handleSubmit(onSubmit)()
                  }}
                  className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      {t.auth.login.loginButton}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Layout mobile riorganizzato */}
              <div className="md:hidden flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.auth.login.email}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="email"
                        {...register('email', {
                          required: t.auth.login.email + ' richiesta',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email non valida'
                          }
                        })}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                        placeholder="nome@esempio.com"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.auth.login.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password', {
                          required: t.auth.login.password + ' richiesta',
                          minLength: {
                            value: 6,
                            message: 'La password deve essere almeno 6 caratteri'
                          }
                        })}
                        className="w-full px-3 py-2 pl-9 pr-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        ) : (
                          <Eye className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-xs text-gray-600">{t.auth.login.rememberMe}</span>
                    </label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:text-secondary">
                      {t.auth.login.forgotPassword}
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      onClick={() => console.log('Mobile button clicked')}
                      className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center text-sm"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          {t.auth.login.loginButton}
                          <ArrowRight className="ml-2 w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Sign Up Link */}
            <div className="text-center mt-4 pt-4 border-t border-gray-100 flex-shrink-0">
              <p className="text-gray-600 text-xs md:text-sm">
                {t.auth.login.noAccount}{' '}
                <Link href="/#pricing" className="text-primary hover:text-secondary font-semibold">
                  {t.auth.login.registerLink}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente di fallback per il loading
function LoginFallback() {
  const { t } = useLanguage()
  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-dark mb-2">{t.common.loading}</h1>
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
