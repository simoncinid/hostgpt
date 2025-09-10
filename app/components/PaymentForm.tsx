'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { motion } from 'framer-motion'
import { CreditCard, Loader2, Check, AlertCircle, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaymentFormProps {
  amount: number
  orderId: number
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
}

export default function PaymentForm({ amount, orderId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const cardElement = elements.getElement(CardElement)
      
      if (!cardElement) {
        throw new Error('Elemento carta non trovato')
      }

      // Crea il Payment Intent
      const response = await fetch('/api/print-orders/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: Math.round(amount * 100), // Stripe usa centesimi
          currency: 'eur',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Errore nella creazione del pagamento')
      }

      const { client_secret } = await response.json()

      // Conferma il pagamento
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        console.error('Errore pagamento:', error)
        onError(error.message || 'Errore nel pagamento')
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Pagamento completato:', paymentIntent)
        setIsComplete(true)
        onSuccess(paymentIntent.id)
        toast.success('Pagamento completato con successo!')
      }
    } catch (error) {
      console.error('Errore checkout:', error)
      onError(error instanceof Error ? error.message : 'Errore durante il pagamento')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Pagamento Completato!</h3>
        <p className="text-green-600">Il tuo ordine è stato elaborato con successo.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-4">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Dati della Carta</h3>
        </div>
        
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        
        <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>Pagamento sicuro protetto da Stripe</span>
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Elaborazione Pagamento...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Paga €{amount.toFixed(2)}</span>
          </>
        )}
      </motion.button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Carte accettate:</p>
            <p>Visa, Mastercard, American Express, Discover</p>
          </div>
        </div>
      </div>
    </form>
  )
}
