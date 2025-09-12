'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Phone, ArrowRight, ArrowLeft, Shield, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useLanguage } from '@/lib/languageContext'

interface ForgotPasswordForm {
  phone: string
}

interface VerifyOTPForm {
  phone: string
  otp_code: string
}

interface ResetPasswordForm {
  phone: string
  otp_code: string
  new_password: string
  confirm_password: string
}

type Step = 'phone' | 'verify' | 'reset' | 'success'

function ForgotPasswordContent() {
  const router = useRouter()
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState<Step>('phone')
  const [isLoading, setIsLoading] = useState(false)
  
  const [phoneForm, setPhoneForm] = useState<ForgotPasswordForm>({
    phone: ''
  })
  
  const [otpForm, setOtpForm] = useState<VerifyOTPForm>({
    phone: '',
    otp_code: ''
  })
  
  const [resetForm, setResetForm] = useState<ResetPasswordForm>({
    phone: '',
    otp_code: '',
    new_password: '',
    confirm_password: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validatePhone = (phone: string): boolean => {
    if (!phone) {
      setErrors({ phone: 'Il numero di telefono è obbligatorio' })
      return false
    }
    if (!/^\+[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
      setErrors({ phone: 'Inserisci un numero di telefono valido con prefisso internazionale (es. +39 123 456 7890)' })
      return false
    }
    setErrors({})
    return true
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePhone(phoneForm.phone)) return
    
    setIsLoading(true)
    try {
      await api.post('/auth/forgot-password', {
        phone: phoneForm.phone
      })
      
      toast.success('SMS inviato! Controlla il tuo telefono.')
      setOtpForm({ phone: phoneForm.phone, otp_code: '' })
      setCurrentStep('verify')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Errore nell\'invio del SMS')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otpForm.otp_code || otpForm.otp_code.length !== 6) {
      setErrors({ otp_code: 'Inserisci un codice OTP valido di 6 cifre' })
      return
    }
    
    setIsLoading(true)
    try {
      await api.post('/auth/verify-otp', {
        phone: otpForm.phone,
        otp_code: otpForm.otp_code
      })
      
      toast.success('Codice verificato! Ora puoi impostare una nuova password.')
      setResetForm({ 
        phone: otpForm.phone, 
        otp_code: otpForm.otp_code,
        new_password: '',
        confirm_password: ''
      })
      setCurrentStep('reset')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Codice OTP non valido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    if (!resetForm.new_password || resetForm.new_password.length < 8) {
      newErrors.new_password = 'La password deve essere almeno 8 caratteri'
    }
    
    if (resetForm.new_password !== resetForm.confirm_password) {
      newErrors.confirm_password = 'Le password non coincidono'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', {
        phone: resetForm.phone,
        otp_code: resetForm.otp_code,
        new_password: resetForm.new_password
      })
      
      toast.success('Password aggiornata con successo!')
      setCurrentStep('success')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Errore nell\'aggiornamento della password')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'phone':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recupera Password</h2>
              <p className="text-gray-600">Inserisci il tuo numero di telefono per ricevere un codice di verifica</p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero di telefono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneForm.phone}
                    onChange={(e) => setPhoneForm({ phone: e.target.value })}
                    className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                    placeholder="+39 123 456 7890"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    Invia Codice
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )

      case 'verify':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifica Codice</h2>
              <p className="text-gray-600">
                Inserisci il codice a 6 cifre inviato al numero<br />
                <span className="font-semibold">{otpForm.phone}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice di verifica
                </label>
                <input
                  type="text"
                  value={otpForm.otp_code}
                  onChange={(e) => setOtpForm({ ...otpForm, otp_code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200 text-center text-2xl font-mono tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                />
                {errors.otp_code && (
                  <p className="text-red-500 text-xs mt-1">{errors.otp_code}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpForm.otp_code.length !== 6}
                className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    Verifica Codice
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep('phone')}
                className="text-sm text-gray-600 hover:text-primary"
              >
                Cambia numero di telefono
              </button>
            </div>
          </motion.div>
        )

      case 'reset':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuova Password</h2>
              <p className="text-gray-600">Imposta una nuova password per il tuo account</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuova password
                </label>
                <input
                  type="password"
                  value={resetForm.new_password}
                  onChange={(e) => setResetForm({ ...resetForm, new_password: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
                {errors.new_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.new_password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conferma password
                </label>
                <input
                  type="password"
                  value={resetForm.confirm_password}
                  onChange={(e) => setResetForm({ ...resetForm, confirm_password: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
                {errors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    Aggiorna Password
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Aggiornata!</h2>
              <p className="text-gray-600">La tua password è stata aggiornata con successo.</p>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              Vai al Login
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
                {currentStep === 'success' ? 'Completato!' : 'Recupera Password'}
              </h1>
            </div>
            {currentStep !== 'success' && (
              <Link 
                href="/login" 
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 ml-4"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </Link>
            )}
          </div>

          {/* Content */}
          {renderStep()}

          {/* Footer */}
          {currentStep !== 'success' && (
            <div className="text-center mt-6 pt-4 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                Ricordi la tua password?{' '}
                <Link href="/login" className="text-primary hover:text-secondary font-semibold">
                  Accedi
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading component
function ForgotPasswordLoading() {
  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-dark mb-2">Caricamento...</h1>
            <p className="text-gray-600">Preparazione della pagina di recupero password.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordLoading />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
