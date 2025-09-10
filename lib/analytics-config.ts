export const analyticsConfig = {
  googleAnalytics: {
    measurementId: 'G-XXXXXXXXXX', // Da configurare con il tuo ID
    enabled: process.env.NODE_ENV === 'production'
  },
  googleSearchConsole: {
    verificationCode: 'your-google-search-console-verification-code' // Da configurare
  },
  bingWebmaster: {
    verificationCode: 'your-bing-webmaster-verification-code' // Da configurare
  },
  facebookPixel: {
    pixelId: 'your-facebook-pixel-id' // Da configurare
  }
}

// Eventi personalizzati per il tracking
export const trackEvents = {
  chatbotCreated: 'chatbot_created',
  conversationStarted: 'conversation_started',
  userRegistered: 'user_registered',
  userLoggedIn: 'user_logged_in',
  pageViewed: 'page_viewed',
  demoStarted: 'demo_started',
  pricingViewed: 'pricing_viewed'
}

// Configurazione per il tracking delle conversioni
export const conversionGoals = {
  registration: {
    name: 'User Registration',
    value: 1,
    currency: 'EUR'
  },
  chatbotCreation: {
    name: 'Chatbot Creation',
    value: 5,
    currency: 'EUR'
  },
  subscription: {
    name: 'Subscription',
    value: 29,
    currency: 'EUR'
  }
}
