export const socialSEOConfig = {
  facebook: {
    appId: 'your-facebook-app-id', // Da configurare
    admins: 'your-facebook-admin-id' // Da configurare
  },
  twitter: {
    site: '@hostgpt',
    creator: '@hostgpt',
    card: 'summary_large_image'
  },
  linkedin: {
    company: 'HostGPT',
    product: 'AI Assistant for Short-term Rental Management'
  },
  instagram: {
    username: '@hostgpt'
  }
}

export const generateSocialMetaTags = (page: string, language: 'it' | 'en' = 'it') => {
  const baseUrl = 'https://hostgpt.it'
  const imageUrl = `${baseUrl}/icons/logohostgpt.png`
  
  const titles = {
    it: {
      home: 'HostGPT - Assistente AI per Proprietà in Affitto Breve',
      chatbots: 'Chatbot per Host - Crea il Tuo Assistente AI',
      conversations: 'Conversazioni Chatbot - Monitora le Interazioni',
      dashboard: 'Dashboard HostGPT - Gestisci i Tuoi Chatbot'
    },
    en: {
      home: 'HostGPT - AI Assistant for Short-term Rental Properties',
      chatbots: 'Host Chatbots - Create Your AI Assistant',
      conversations: 'Chatbot Conversations - Monitor Interactions',
      dashboard: 'HostGPT Dashboard - Manage Your Chatbots'
    }
  }

  const descriptions = {
    it: {
      home: 'Il miglior assistente AI per gestire le proprietà in affitto breve e gli ospiti Airbnb. Chatbot intelligenti 24/7 per host.',
      chatbots: 'Crea chatbot personalizzati per i tuoi affitti vacanza. Automatizza le risposte agli ospiti con AI intelligente.',
      conversations: 'Monitora tutte le conversazioni dei tuoi chatbot con gli ospiti. Analizza le domande più frequenti.',
      dashboard: 'Dashboard completa per gestire i tuoi chatbot e monitorare le conversazioni con gli ospiti.'
    },
    en: {
      home: 'The best AI assistant for managing short-term rental properties and Airbnb guests. Intelligent 24/7 chatbots for hosts.',
      chatbots: 'Create personalized chatbots for your vacation rentals. Automate guest responses with intelligent AI.',
      conversations: 'Monitor all your chatbot conversations with guests. Analyze the most frequent questions.',
      dashboard: 'Complete dashboard to manage your chatbots and monitor guest conversations.'
    }
  }

  const title = titles[language][page as keyof typeof titles[typeof language]] || titles[language].home
  const description = descriptions[language][page as keyof typeof descriptions[typeof language]] || descriptions[language].home

  return {
    // Open Graph
    'og:title': title,
    'og:description': description,
    'og:image': imageUrl,
    'og:url': `${baseUrl}/${page}`,
    'og:type': 'website',
    'og:site_name': 'HostGPT',
    'og:locale': language === 'it' ? 'it_IT' : 'en_US',
    'og:locale:alternate': language === 'it' ? 'en_US' : 'it_IT',
    
    // Twitter
    'twitter:card': 'summary_large_image',
    'twitter:site': socialSEOConfig.twitter.site,
    'twitter:creator': socialSEOConfig.twitter.creator,
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': imageUrl,
    
    // Additional meta
    'article:author': 'HostGPT Team',
    'article:publisher': 'https://www.facebook.com/hostgpt',
    'article:section': 'Technology',
    'article:tag': language === 'it' ? 'AI, Chatbot, Ospitalità, Airbnb' : 'AI, Chatbot, Hospitality, Airbnb'
  }
}
