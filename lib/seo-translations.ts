export const seoTranslations = {
  it: {
    title: 'OspiterAI - Assistente AI per Proprietà in Affitto Breve | Gestione Ospiti Airbnb',
    description: 'OspiterAI è il miglior assistente AI per gestire le proprietà in affitto breve e gli ospiti Airbnb. Chatbot intelligenti 24/7 per host, risposte automatiche, gestione prenotazioni e supporto multilingue.',
    keywords: 'OspiterAI, assistente AI, proprietà affitto breve, gestione ospiti airbnb, chatbot host, AI airbnb, assistente virtuale proprietà, gestione affitti vacanza, chatbot intelligente, AI ospitalità, host assistant, airbnb management, short term rental AI, property management AI, guest management, automated responses, 24/7 support, multilingue, italiano, inglese, affitto vacanze, gestione proprietà, ospitalità, turismo, booking, prenotazioni automatiche, risposte automatiche ospiti, chatbot proprietario, AI host, assistente proprietario, gestione booking, automazione ospitalità',
    h1: 'OspiterAI - Il Miglior Assistente AI per Proprietà in Affitto Breve',
    h2: 'Gestisci i Tuoi Ospiti Airbnb con l\'Intelligenza Artificiale',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "OspiterAI",
      "description": "Assistente AI per gestire le proprietà in affitto breve e gli ospiti Airbnb",
      "url": "https://ospiterai.it",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "creator": {
        "@type": "Organization",
        "name": "OspiterAI",
        "url": "https://ospiterai.it"
      },
      "keywords": "OspiterAI, assistente AI, proprietà affitto breve, gestione ospiti airbnb, chatbot host, AI airbnb",
      "inLanguage": "it"
    }
  },
  en: {
    title: 'OspiterAI - AI Assistant for Short-term Rental Properties | Airbnb Guest Management',
    description: 'OspiterAI is the best AI assistant for managing short-term rental properties and Airbnb guests. Intelligent 24/7 chatbots for hosts, automated responses, booking management and multilingual support.',
    keywords: 'OspiterAI, AI assistant, short term rental, airbnb guest management, host chatbot, AI airbnb, virtual assistant property, vacation rental management, intelligent chatbot, AI hospitality, host assistant, airbnb management, short term rental AI, property management AI, guest management, automated responses, 24/7 support, multilingual, italian, english, vacation rental, property management, hospitality, tourism, booking, automated bookings, guest automated responses, owner chatbot, AI host, owner assistant, booking management, hospitality automation',
    h1: 'OspiterAI - The Best AI Assistant for Short-term Rental Properties',
    h2: 'Manage Your Airbnb Guests with Artificial Intelligence',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "OspiterAI",
      "description": "AI assistant for managing short-term rental properties and Airbnb guests",
      "url": "https://ospiterai.it",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "creator": {
        "@type": "Organization",
        "name": "OspiterAI",
        "url": "https://ospiterai.it"
      },
      "keywords": "OspiterAI, AI assistant, short term rental, airbnb guest management, host chatbot, AI airbnb",
      "inLanguage": "en"
    }
  }
}

export const getSEOData = (language: 'it' | 'en' = 'it') => {
  return seoTranslations[language]
}
