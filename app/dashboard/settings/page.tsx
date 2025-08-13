'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, Mail, User, Loader2, LogOut } from 'lucide-react'
import { auth, subscription } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const me = await auth.me()
        setUser(me.data)
      } catch {
        router.replace('/login')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleStartCheckout = async () => {
    setIsCheckoutLoading(true)
    try {
      const res = await subscription.createCheckout()
      window.location.href = (res.data as any).checkout_url
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Errore nell\'avvio del checkout')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  if (isLoading) {
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
          <Link href="/dashboard" className="text-gray-600 hover:text-primary flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
          <h1 className="text-xl font-semibold">Impostazioni</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Profilo</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium">{user?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Abbonamento</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Stato: <span className={user?.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'}>{user?.subscription_status || 'inactive'}</span></p>
              {user?.subscription_end_date && (
                <p className="text-sm text-gray-500">Prossimo rinnovo: {new Date(user.subscription_end_date).toLocaleDateString('it-IT')}</p>
              )}
            </div>
            {user?.subscription_status !== 'active' && (
              <button onClick={handleStartCheckout} disabled={isCheckoutLoading} className="btn-primary inline-flex items-center">
                {isCheckoutLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Reindirizzamento...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Attiva Abbonamento
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Sicurezza</h2>
          <button onClick={() => { logout(); router.push('/login') }} className="btn-secondary inline-flex items-center">
            <LogOut className="w-5 h-5 mr-2" />
            Esci
          </button>
        </div>
      </div>
    </div>
  )
}


