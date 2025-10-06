'use client'

import { useState, useEffect, Suspense } from 'react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, ArrowLeft, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import api, { chatbots } from '@/lib/api'
import { useLanguage } from '@/lib/languageContext'
import { translations } from '@/lib/translations'
import CountrySelector from '@/app/components/CountrySelector'

interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  phone: string  // Now required (solo numero senza prefisso)
  phonePrefix: string  // Prefisso selezionato dal menu a tendina
  language: string
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
  const [desiredPlan, setDesiredPlan] = useState<string | null>(null)
  const { setAuth } = useAuthStore()
  
  // Check if user comes from landing page for free trial and desired plan
  useEffect(() => {
    if (searchParams) {
      setIsFreeTrial(searchParams.get('free_trial') === 'true')
      setDesiredPlan(searchParams.get('plan'))
    }
  }, [searchParams])
  
  // Gestione token di invito
  const inviteToken = searchParams?.get('invite_token')
  
  // Usiamo useState invece di react-hook-form per evitare problemi
  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    phonePrefix: '+39', // Default Italia
    language: 'it',
    terms: false
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Helper function to update form data
  const updateField = (field: keyof RegisterForm, value: any) => {
    setFormData(prev => ({...prev, [field]: value}))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = {...prev}
        delete newErrors[field]
        return newErrors
      })
    }
  }
  

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validazione
    const errors: Record<string, string> = {}
    
    if (!formData.full_name || formData.full_name.length < 2) {
      errors.full_name = t.errors.nameRequired
    }
    
    if (!formData.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = t.errors.emailInvalid
    }
    
    // Phone validation - solo numero senza prefisso
    if (!formData.phone) {
      errors.phone = 'Il numero di telefono è obbligatorio'
    } else if (!/^\d{7,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Inserisci un numero di telefono valido (es. 123 456 7890)'
    }
    
    if (!formData.password || formData.password.length < 8) {
      errors.password = t.errors.passwordRequired
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = t.errors.confirmPasswordRequired
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t.errors.passwordsNotMatch
    }
    
    if (!formData.language) {
      errors.language = 'Seleziona una lingua'
    }
    
    if (!formData.terms) {
      errors.terms = t.errors.termsRequired
    }
    
    setFormErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsLoading(true)
    try {
      // Costruisci il numero completo con prefisso
      const fullPhoneNumber = formData.phonePrefix + formData.phone.replace(/\s/g, '')
      
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: fullPhoneNumber,
        wants_free_trial: isFreeTrial,
        language: formData.language,
        desired_plan: desiredPlan
      })
      
      // Dopo la registrazione, mandiamo l'utente alla pagina che spiega di verificare l'email
      const message = isFreeTrial ? t.success.freeTrial : t.success.paid
      toast.success(message)
      
      // Includi il token di invito se presente
      const loginUrl = inviteToken 
        ? `/login?registered=1&invite_token=${inviteToken}`
        : '/login?registered=1'
      router.push(loginUrl)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Errore durante la registrazione')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 h-[98vh] md:h-[90vh] flex flex-col">
          {/* Header */}
          <div className="text-center mb-4 flex-shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">{t.title}</h1>
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
            <form onSubmit={onSubmit} className="flex-1 flex flex-col">
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
                        value={formData.full_name}
                        onChange={(e) => updateField('full_name', e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                        placeholder="Mario Rossi"
                      />
                    </div>
                    {formErrors.full_name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>
                    )}
                  </div>

                  {/* Telefono - ROW 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numero di telefono *</label>
                    <div className="flex gap-2">
                      <div className="w-32">
                        <CountrySelector
                          value={formData.phonePrefix}
                          onChange={(value) => updateField('phonePrefix', value)}
                          className="h-10"
                          language={language === 'IT' ? 'IT' : 'ENG'}
                        />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => updateField('phone', e.target.value)}
                          className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                          placeholder="123 456 7890"
                        />
                      </div>
                    </div>
                    {formErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Lingua - ROW 3 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lingua per email e notifiche</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={formData.language}
                        onChange={(e) => updateField('language', e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 appearance-none bg-white"
                      >
                        <option value="it">🇮🇹 Italiano</option>
                        <option value="en">🇬🇧 English</option>
                      </select>
                    </div>
                    {formErrors.language && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.language}</p>
                    )}
                  </div>

                  {/* Password - ROW 4 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
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
                    {formErrors.password && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
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
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                        placeholder="nome@esempio.com"
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Conferma Password - ROW 2 - allineato con Telefono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPassword}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="confirmPassword-desktop"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
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
                    {formErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
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
                    
                    {/* Terms - subito sotto il pulsante */}
                    <div className="mt-3 text-center">
                      <label className="flex items-start justify-center">
                        <input
                          type="checkbox"
                          checked={formData.terms}
                          onChange={(e) => updateField('terms', e.target.checked)}
                          className="mt-0.5 mr-2 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-600">
                          {t.termsAccept}{' '}
                          <Link 
                            href="/terms" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-secondary underline"
                          >
                            termini e condizioni
                          </Link>
                          {' '}e la{' '}
                          <Link 
                            href="/privacy" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-secondary underline"
                          >
                            privacy policy
                          </Link>
                        </span>
                      </label>
                      {formErrors.terms && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.terms}</p>
                      )}
                      
                      {/* Login Link - solo per desktop, sotto i termini */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-gray-600 text-sm">
                          {t.alreadyHaveAccount}{' '}
                          <Link href="/login" className="text-primary hover:text-secondary font-semibold">
                            {t.loginNow}
                          </Link>
                        </p>
                      </div>
                    </div>

                  </div>
                </div>


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
                        value={formData.full_name}
                        onChange={(e) => updateField('full_name', e.target.value)}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                        placeholder="Mario Rossi"
                      />
                    </div>
                    {formErrors.full_name && (
                      <p className="text-red-500 text-xs mt-0.5">{formErrors.full_name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.email}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                        placeholder="nome@esempio.com"
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-0.5">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Telefono */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Numero di telefono *</label>
                    <div className="flex gap-2">
                      <div className="w-24">
                        <CountrySelector
                          value={formData.phonePrefix}
                          onChange={(value) => updateField('phonePrefix', value)}
                          className="h-8 text-xs"
                          language={language === 'IT' ? 'IT' : 'ENG'}
                        />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => updateField('phone', e.target.value)}
                          className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm"
                          placeholder="123 456 7890"
                        />
                      </div>
                    </div>
                    {formErrors.phone && (
                      <p className="text-red-500 text-xs mt-0.5">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Lingua */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Lingua per email e notifiche</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <select
                        value={formData.language}
                        onChange={(e) => updateField('language', e.target.value)}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-sm appearance-none bg-white"
                      >
                        <option value="it">🇮🇹 Italiano</option>
                        <option value="en">🇬🇧 English</option>
                      </select>
                    </div>
                    {formErrors.language && (
                      <p className="text-red-500 text-xs mt-0.5">{formErrors.language}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
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
                    {formErrors.password && (
                      <p className="text-red-500 text-xs mt-0.5">{formErrors.password}</p>
                    )}
                  </div>

                  {/* Conferma Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{t.confirmPassword}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        id="confirmPassword-mobile"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
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
                    {formErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-0.5">{formErrors.confirmPassword}</p>
                    )}
                  </div>


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
                        checked={formData.terms}
                        onChange={(e) => updateField('terms', e.target.checked)}
                        className="mt-0.5 mr-2 flex-shrink-0"
                      />
                      <span className="text-xs text-gray-600">
                        {t.termsAccept}{' '}
                        <Link 
                          href="/terms" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-secondary underline"
                        >
                          termini e condizioni
                        </Link>
                        {' '}e la{' '}
                        <Link 
                          href="/privacy" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-secondary underline"
                        >
                          privacy policy
                        </Link>
                      </span>
                    </label>
                    {formErrors.terms && (
                      <p className="text-red-500 text-xs mt-0.5">{formErrors.terms}</p>
                    )}
                    
                    {/* Login Link - solo per mobile, sotto i termini */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-gray-600 text-sm text-center">
                        {t.alreadyHaveAccount}{' '}
                        <Link href="/login" className="text-primary hover:text-secondary font-semibold">
                          {t.loginNow}
                        </Link>
                      </p>
                    </div>
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
