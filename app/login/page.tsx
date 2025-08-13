'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth } = useAuthStore()
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  useEffect(() => {
    const registered = searchParams.get('registered')
    const subscriptionSuccess = searchParams.get('subscription') === 'success'
    if (registered) {
      toast.success('Controlla la tua email e clicca il link di verifica per procedere al pagamento')
    }
    if (subscriptionSuccess) {
      toast.success('Pagamento effettuato! Ora puoi accedere')
    }
  }, [searchParams])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', data)
      const { access_token } = response.data
      
      // Salva token e user info
      localStorage.setItem('token', access_token)
      setAuth(access_token)
      
      // Verifica stato abbonamento: se non attivo, porta al checkout
      try {
        const me = await api.get('/auth/me')
        const subscriptionStatus = me.data?.subscription_status
        const isVerified = me.data?.is_verified
        if (!isVerified) {
          toast.error('Devi verificare la tua email. Controlla la posta e clicca il link di verifica.')
          return
        }
        if (subscriptionStatus !== 'active') {
          toast('Completa il pagamento per continuare', { icon: '💳' })
          router.push('/checkout')
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
      {/* Logo */}
      <Link href="/" className="absolute top-8 left-8 flex items-center space-x-2">
        <Home className="w-8 h-8 text-primary" />
        <span className="text-2xl font-bold text-dark">HostGPT</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark mb-2">Bentornato!</h1>
            <p className="text-gray-600">Accedi al tuo account HostGPT</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">oppure</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continua con Google
            </button>
          </div>

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
