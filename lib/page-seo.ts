export const pageSEOConfig = {
  chatbots: {
    it: {
      title: 'Chatbot per Host - Crea il Tuo Assistente AI | OspiterAI',
      description: 'Crea chatbot personalizzati per i tuoi affitti vacanza. Automatizza le risposte agli ospiti con AI intelligente. Supporto 24/7 multilingue per host Airbnb.',
      keywords: 'chatbot host, crea chatbot, assistente AI host, chatbot airbnb, automazione ospiti, risposte automatiche, AI ospitalità, chatbot proprietario, gestione ospiti automatica',
      canonical: 'https://ospiterai.it/chatbots'
    },
    en: {
      title: 'Host Chatbots - Create Your AI Assistant | OspiterAI',
      description: 'Create personalized chatbots for your vacation rentals. Automate guest responses with intelligent AI. 24/7 multilingual support for Airbnb hosts.',
      keywords: 'host chatbot, create chatbot, AI host assistant, airbnb chatbot, guest automation, automated responses, AI hospitality, owner chatbot, automatic guest management',
      canonical: 'https://ospiterai.it/chatbots'
    }
  },
  conversations: {
    it: {
      title: 'Conversazioni Chatbot - Monitora le Interazioni | OspiterAI',
      description: 'Monitora tutte le conversazioni dei tuoi chatbot con gli ospiti. Analizza le domande più frequenti e migliora il servizio offerto.',
      keywords: 'conversazioni chatbot, monitoraggio ospiti, analisi conversazioni, chatbot analytics, gestione ospiti, statistiche chatbot',
      canonical: 'https://ospiterai.it/conversations'
    },
    en: {
      title: 'Chatbot Conversations - Monitor Interactions | OspiterAI',
      description: 'Monitor all your chatbot conversations with guests. Analyze the most frequent questions and improve the service offered.',
      keywords: 'chatbot conversations, guest monitoring, conversation analysis, chatbot analytics, guest management, chatbot statistics',
      canonical: 'https://ospiterai.it/conversations'
    }
  },
  dashboard: {
    it: {
      title: 'Dashboard OspiterAI - Gestisci i Tuoi Chatbot | OspiterAI',
      description: 'Dashboard completa per gestire i tuoi chatbot, monitorare le conversazioni e ottimizzare l\'esperienza degli ospiti nelle tue proprietà.',
      keywords: 'dashboard OspiterAI, gestione chatbot, monitoraggio ospiti, analytics host, gestione proprietà, ottimizzazione ospitalità',
      canonical: 'https://ospiterai.it/dashboard'
    },
    en: {
      title: 'OspiterAI Dashboard - Manage Your Chatbots | OspiterAI',
      description: 'Complete dashboard to manage your chatbots, monitor conversations and optimize guest experience in your properties.',
      keywords: 'OspiterAI dashboard, chatbot management, guest monitoring, host analytics, property management, hospitality optimization',
      canonical: 'https://ospiterai.it/dashboard'
    }
  },
  login: {
    it: {
      title: 'Accedi a OspiterAI - Gestisci i Tuoi Chatbot | OspiterAI',
      description: 'Accedi al tuo account OspiterAI per gestire i chatbot delle tue proprietà in affitto breve e monitorare le conversazioni con gli ospiti.',
      keywords: 'login OspiterAI, accedi OspiterAI, account host, gestione chatbot, dashboard host',
      canonical: 'https://ospiterai.it/login'
    },
    en: {
      title: 'Login to OspiterAI - Manage Your Chatbots | OspiterAI',
      description: 'Login to your OspiterAI account to manage your short-term rental chatbots and monitor guest conversations.',
      keywords: 'OspiterAI login, OspiterAI sign in, host account, chatbot management, host dashboard',
      canonical: 'https://ospiterai.it/login'
    }
  },
  register: {
    it: {
      title: 'Registrati su OspiterAI - Inizia Gratis | OspiterAI',
      description: 'Registrati gratuitamente su OspiterAI e inizia a creare chatbot intelligenti per le tue proprietà in affitto breve. Prova gratis per 7 giorni.',
      keywords: 'registrati OspiterAI, iscriviti OspiterAI, prova gratuita, chatbot gratis, assistente AI host, inizia gratis',
      canonical: 'https://ospiterai.it/register'
    },
    en: {
      title: 'Sign Up for OspiterAI - Start Free | OspiterAI',
      description: 'Sign up for free on OspiterAI and start creating intelligent chatbots for your short-term rental properties. Free trial for 7 days.',
      keywords: 'OspiterAI sign up, OspiterAI register, free trial, free chatbot, AI host assistant, start free',
      canonical: 'https://ospiterai.it/register'
    }
  }
}

export const getPageSEO = (page: keyof typeof pageSEOConfig, language: 'it' | 'en' = 'it') => {
  return pageSEOConfig[page]?.[language] || pageSEOConfig[page]?.it
}
