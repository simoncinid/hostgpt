'use client'

import { useState, useEffect, Suspense } from 'react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Check, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import { useLanguage } from '@/lib/languageContext'
import { translations } from '@/lib/translations'

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
  const { language } = useLanguage()
  const t = translations[language].register
  
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
      const message = isFreeTrial ? t.success.freeTrial : t.success.paid
      toast.success(message)
      router.push('/login?registered=1')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Errore durante la registrazione')
    } finally {
      setIsLoading(false)
    }
  }

  const passwordRequirements = [
    { text: t.passwordMinLength, check: password?.length >= 8 },
    { text: t.passwordUppercase, check: /[A-Z]/.test(password || '') },
    { text: t.passwordLowercase, check: /[a-z]/.test(password || '') },
    { text: t.passwordNumber, check: /[0-9]/.test(password || '') },
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 h-[98vh] md:h-[90vh] flex flex-col">
          {/* Header */}
          <div className="text-center mb-4 flex-shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">{t.title}</h1>
                <p className="text-gray-600 text-sm md:text-base mb-3">
                  {isFreeTrial ? t.freeTrialSubtitle : t.paidSubtitle}
                </p>
              </div>
              <Link 
                href="/" 
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 ml-4"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </Link>
            </div>
            {isFreeTrial && (
              <div className="p-2 md:p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-xs md:text-sm font-medium">
                  {t.freeTrialBanner}
                </p>
              </div>
            )}
            {!isFreeTrial && (
              <div className="p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-xs md:text-sm font-medium">
                  {t.paidBanner}
                </p>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="flex-1 flex flex-col">
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
              {/* Layout desktop con grid template per allineamento perfetto */}
              <div className="hidden md:grid md:grid-cols-2 md:gap-6 flex-1" style={{gridTemplateRows: 'auto auto auto auto auto auto'}}>
                {/* Colonna sinistra */}
                <div className="space-y-3">
                  {/* Nome Completo - ROW 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        {...register('full_name', {
                          required: t.errors.nameRequired,
                          minLength: {
                            value: 2,
                            message: t.errors.nameMinLength
                          }
                        })}
                        className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                        placeholder="Mario Rossi"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Telefono - ROW 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.phoneOptional}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                        placeholder="+39 123 456 7890"
                      />
                    </div>
                  </div>

                  {/* Password - ROW 3 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password', {
                          required: t.errors.passwordRequired,
                          minLength: {
                            value: 8,
                            message: t.errors.passwordMinLength
                          },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: t.errors.passwordPattern
                          }
                        })}
                        className="w-full px-4 py-2.5 pl-10 pr-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                        placeholder="••••••••"
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
                </div>

                {/* Colonna destra */}
                <div className="space-y-3">
                  {/* Email - ROW 1 - allineato con Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        {...register('email', {
                          required: t.errors.emailRequired,
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: t.errors.emailInvalid
                          }
                        })}
                        className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                        placeholder="nome@esempio.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Conferma Password - ROW 2 - allineato con Telefono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPassword}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword', {
                          required: t.errors.confirmPasswordRequired,
                          validate: value => value === password || t.errors.passwordsNotMatch
                        })}
                        className="w-full px-4 py-2.5 pl-10 pr-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* BUTTON - ROW 3 - PERFETTAMENTE ALLINEATO CON PASSWORD! */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 invisible">Pulsante</label>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        <>
                          {t.createAccount}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms - ROW 4 - sopra il link "Accedi ora" */}
                <div className="col-span-2 mt-3 text-center">
                  <label className="flex items-start justify-center">
                    <input
                      type="checkbox"
                      {...register('terms', {
                        required: t.errors.termsRequired
                      })}
                      className="mt-0.5 mr-2 flex-shrink-0"
                    />
                    <span className="text-xs text-gray-600">
                      {t.termsAccept}{' '}
                      <Link href="/terms" className="text-primary hover:text-secondary">
                        {t.termsLink}
                      </Link>
                      {' '}e la{' '}
                      <Link href="/privacy" className="text-primary hover:text-secondary">
                        {t.privacyLink}
                      </Link>
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="text-red-500 text-xs mt-1">{errors.terms.message}</p>
                  )}
                </div>

                {/* Sign In Link - ROW 5 - sotto i termini */}
                <div className="col-span-2 text-center mb-3">
                  <p className="text-gray-600 text-sm">
                    {t.alreadyHaveAccount}{' '}
                    <Link href="/login" className="text-primary hover:text-secondary font-semibold">
                      {t.loginNow}
                    </Link>
                  </p>
                </div>

                {/* Password Requirements - ROW 6 - solo se c'è password */}
                {password && (
                  <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">{t.passwordRequirements}</h4>
                    <div className="space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center text-xs">
                          <Check className={`w-3 h-3 mr-1 flex-shrink-0 ${req.check ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className={req.check ? 'text-green-600' : 'text-gray-400'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Layout mobile COMPLETAMENTE RIFATTO DA ZERO */}
              <div className="md:hidden flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.fullName}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        {...register('full_name', {
                          required: t.errors.nameRequired,
                          minLength: {
                            value: 2,
                            message: t.errors.nameMinLength
                          }
                        })}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                        placeholder="Mario Rossi"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.email}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="email"
                        {...register('email', {
                          required: t.errors.emailRequired,
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: t.errors.emailInvalid
                          }
                        })}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                        placeholder="nome@esempio.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Telefono */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.phoneOptional}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                        placeholder="+39 123 456 7890"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password', {
                          required: t.errors.passwordRequired,
                          minLength: {
                            value: 8,
                            message: t.errors.passwordMinLength
                          },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: t.errors.passwordPattern
                          }
                        })}
                        className="w-full px-3 py-2 pl-9 pr-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                        placeholder="••••••••"
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

                  {/* Conferma Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.confirmPassword}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword', {
                          required: t.errors.confirmPasswordRequired,
                          validate: value => value === password || t.errors.passwordsNotMatch
                        })}
                        className="w-full px-3 py-2 pl-9 pr-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        ) : (
                          <Eye className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  {password && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">{t.passwordRequirements}</h4>
                      <div className="space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center text-xs">
                            <Check className={`w-3 h-3 mr-1 flex-shrink-0 ${req.check ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className={req.check ? 'text-green-600' : 'text-gray-400'}>
                              {req.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center text-sm"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          {t.createAccount}
                          <ArrowRight className="ml-2 w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Terms */}
                  <div className="pt-1">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        {...register('terms', {
                          required: t.errors.termsRequired
                        })}
                        className="mt-0.5 mr-2 flex-shrink-0"
                      />
                      <span className="text-xs text-gray-600">
                        {t.termsAccept}{' '}
                        <Link href="/terms" className="text-primary hover:text-secondary">
                          {t.termsLink}
                        </Link>
                        {' '}e la{' '}
                        <Link href="/privacy" className="text-primary hover:text-secondary">
                          {t.privacyLink}
                        </Link>
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.terms.message}</p>
                    )}
                  </div>

                  {/* Sign In Link */}
                  <div className="text-center pt-2 border-t border-gray-100">
                    <p className="text-gray-600 text-xs">
                      {t.alreadyHaveAccount}{' '}
                      <Link href="/login" className="text-primary hover:text-secondary font-semibold">
                        {t.loginNow}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
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
