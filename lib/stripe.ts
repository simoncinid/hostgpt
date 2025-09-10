import { loadStripe } from '@stripe/stripe-js'

// Carica Stripe con la chiave pubblica
// Per ora usiamo una chiave di test - in produzione dovrebbe essere in .env.local
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Q8XxHClR9LCJ8qE7OMhCmlH'
)

// Funzione per creare un Payment Intent
export const createPaymentIntent = async (amount: number, currency: string = 'eur') => {
  const response = await fetch('/api/print-orders/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Stripe usa centesimi
      currency,
    }),
  })

  if (!response.ok) {
    throw new Error('Errore nella creazione del Payment Intent')
  }

  return response.json()
}
