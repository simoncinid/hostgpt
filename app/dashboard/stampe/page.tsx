'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Package,
  ArrowLeft,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ExternalLink
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { printOrders } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/app/components/Sidebar'

interface PrintOrder {
  id: number
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  shipped_at?: string
  tracking_number?: string
  chatbot_name: string
}

function StampeDashboardContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<PrintOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    loadOrders()
  }, [isAuthenticated])

  const loadOrders = async () => {
    try {
      const response = await printOrders.getOrders()
      setOrders(response.data)
    } catch (error) {
      toast.error('Errore nel caricamento degli ordini')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'processing':
        return <Package className="w-5 h-5 text-blue-500" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-green-500" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'In Attesa'
      case 'processing':
        return 'In Produzione'
      case 'shipped':
        return 'Spedito'
      case 'delivered':
        return 'Consegnato'
      case 'cancelled':
        return 'Annullato'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-green-100 text-green-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento ordini...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard/stampe" onLogout={() => {}} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} p-4 md:p-8`}>
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-dark mb-2">
            I Miei Ordini di Stampa
          </h1>
          <p className="text-gray-600">
            Gestisci e monitora i tuoi ordini di QR-Code personalizzati
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            href="/stampe"
            className="inline-flex items-center bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            <Package className="w-5 h-5 mr-2" />
            Nuovo Ordine
          </Link>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Nessun Ordine Trovato</h2>
            <p className="text-gray-600 mb-6">
              Non hai ancora effettuato ordini di stampa. Inizia ora a personalizzare i tuoi QR-Code!
            </p>
            <Link href="/stampe" className="btn-primary">
              Crea il Primo Ordine
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Ordine #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Chatbot: {order.chatbot_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="text-lg font-bold text-primary mt-1">
                      €{order.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Data Ordine</p>
                    <p className="font-semibold">
                      {new Date(order.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  
                  {order.shipped_at && (
                    <div>
                      <p className="text-sm text-gray-500">Data Spedizione</p>
                      <p className="font-semibold">
                        {new Date(order.shipped_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  )}
                  
                  {order.tracking_number && (
                    <div>
                      <p className="text-sm text-gray-500">Tracking</p>
                      <p className="font-semibold text-primary">
                        {order.tracking_number}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment_status === 'paid' ? 'Pagato' : 'In Attesa Pagamento'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/dashboard/stampe/${order.id}`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="Visualizza Dettagli"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {order.tracking_number && (
                      <a
                        href={`https://www.17track.net/it/track?nums=${order.tracking_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Traccia Spedizione"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">Informazioni Importanti</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Tempi di produzione:</strong> 1-2 giorni lavorativi</p>
            <p>• <strong>Tempi di spedizione:</strong> 3-5 giorni lavorativi in Italia</p>
            <p>• <strong>Spedizione:</strong> Gratuita per tutti gli ordini</p>
            <p>• <strong>Supporto:</strong> Contattaci per qualsiasi domanda sui tuoi ordini</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StampeDashboardPage() {
  return <StampeDashboardContent />
}

// Disabilita prerendering per questa pagina
export const dynamic = 'force-dynamic'
