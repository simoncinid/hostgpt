export const pageSEOConfig = {
  chatbots: {
    it: {
      title: 'Chatbot per Host - Crea il Tuo Assistente AI | HostGPT',
      description: 'Crea chatbot personalizzati per i tuoi affitti vacanza. Automatizza le risposte agli ospiti con AI intelligente. Supporto 24/7 multilingue per host Airbnb.',
      keywords: 'chatbot host, crea chatbot, assistente AI host, chatbot airbnb, automazione ospiti, risposte automatiche, AI ospitalità, chatbot proprietario, gestione ospiti automatica',
      canonical: 'https://hostgpt.it/chatbots'
    },
    en: {
      title: 'Host Chatbots - Create Your AI Assistant | HostGPT',
      description: 'Create personalized chatbots for your vacation rentals. Automate guest responses with intelligent AI. 24/7 multilingual support for Airbnb hosts.',
      keywords: 'host chatbot, create chatbot, AI host assistant, airbnb chatbot, guest automation, automated responses, AI hospitality, owner chatbot, automatic guest management',
      canonical: 'https://hostgpt.it/chatbots'
    }
  },
  conversations: {
    it: {
      title: 'Conversazioni Chatbot - Monitora le Interazioni | HostGPT',
      description: 'Monitora tutte le conversazioni dei tuoi chatbot con gli ospiti. Analizza le domande più frequenti e migliora il servizio offerto.',
      keywords: 'conversazioni chatbot, monitoraggio ospiti, analisi conversazioni, chatbot analytics, gestione ospiti, statistiche chatbot',
      canonical: 'https://hostgpt.it/conversations'
    },
    en: {
      title: 'Chatbot Conversations - Monitor Interactions | HostGPT',
      description: 'Monitor all your chatbot conversations with guests. Analyze the most frequent questions and improve the service offered.',
      keywords: 'chatbot conversations, guest monitoring, conversation analysis, chatbot analytics, guest management, chatbot statistics',
      canonical: 'https://hostgpt.it/conversations'
    }
  },
  dashboard: {
    it: {
      title: 'Dashboard HostGPT - Gestisci i Tuoi Chatbot | HostGPT',
      description: 'Dashboard completa per gestire i tuoi chatbot, monitorare le conversazioni e ottimizzare l\'esperienza degli ospiti nelle tue proprietà.',
      keywords: 'dashboard hostgpt, gestione chatbot, monitoraggio ospiti, analytics host, gestione proprietà, ottimizzazione ospitalità',
      canonical: 'https://hostgpt.it/dashboard'
    },
    en: {
      title: 'HostGPT Dashboard - Manage Your Chatbots | HostGPT',
      description: 'Complete dashboard to manage your chatbots, monitor conversations and optimize guest experience in your properties.',
      keywords: 'hostgpt dashboard, chatbot management, guest monitoring, host analytics, property management, hospitality optimization',
      canonical: 'https://hostgpt.it/dashboard'
    }
  },
  login: {
    it: {
      title: 'Accedi a HostGPT - Gestisci i Tuoi Chatbot | HostGPT',
      description: 'Accedi al tuo account HostGPT per gestire i chatbot delle tue proprietà in affitto breve e monitorare le conversazioni con gli ospiti.',
      keywords: 'login hostgpt, accedi hostgpt, account host, gestione chatbot, dashboard host',
      canonical: 'https://hostgpt.it/login'
    },
    en: {
      title: 'Login to HostGPT - Manage Your Chatbots | HostGPT',
      description: 'Login to your HostGPT account to manage your short-term rental chatbots and monitor guest conversations.',
      keywords: 'hostgpt login, hostgpt sign in, host account, chatbot management, host dashboard',
      canonical: 'https://hostgpt.it/login'
    }
  },
  register: {
    it: {
      title: 'Registrati su HostGPT - Inizia Gratis | HostGPT',
      description: 'Registrati gratuitamente su HostGPT e inizia a creare chatbot intelligenti per le tue proprietà in affitto breve. Prova gratis per 7 giorni.',
      keywords: 'registrati hostgpt, iscriviti hostgpt, prova gratuita, chatbot gratis, assistente AI host, inizia gratis',
      canonical: 'https://hostgpt.it/register'
    },
    en: {
      title: 'Sign Up for HostGPT - Start Free | HostGPT',
      description: 'Sign up for free on HostGPT and start creating intelligent chatbots for your short-term rental properties. Free trial for 7 days.',
      keywords: 'hostgpt sign up, hostgpt register, free trial, free chatbot, AI host assistant, start free',
      canonical: 'https://hostgpt.it/register'
    }
  }
}

export const getPageSEO = (page: keyof typeof pageSEOConfig, language: 'it' | 'en' = 'it') => {
  return pageSEOConfig[page]?.[language] || pageSEOConfig[page]?.it
}
