export type Language = 'IT' | 'ENG'

export interface Translations {
  // Navbar
  navbar: {
    features: string
    demo: string
    howItWorks: string
    pricing: string
    feedback: string
    login: string
    register: string
  }
  
  // Hero Section
  hero: {
    title: string
    subtitle: string
    subtitleHighlight: string
    freeTrialButton: string
    registerButton: string
    demoButton: string
  }
  
  // Demo Chat
  demo: {
    title: string
    assistant: string
    suggestedMessages: string[]
    placeholder: string
    welcome: string
    welcomeSubtitle: string
    startChat: string
    namePlaceholder: string
    writing: string
    howCanIHelp: string
    helpItems: string[]
    contactHost: string
    attractions: string
    checkInOut: string
    fullMessages: {
      contactHost: string
      attractions: string
      checkInOut: string
    }
  }
  
  // Features Section
  features: {
    title: string
    subtitle: string
    subtitleHighlight: string
    items: Array<{
      title: string
      description: string
      features: string[]
    }>
  }
  
  // How It Works Section
  howItWorks: {
    title: string
    subtitle: string
    steps: Array<{
      title: string
      description: string
    }>
    animations: {
      register: {
        title: string
        email: string
        password: string
        button: string
        success: string
      }
      customize: {
        title: string
        propertyName: string
        propertyValue: string
        checkIn: string
        checkInValue: string
        tips: string
        tipsValue: string
        button: string
      }
      share: {
        title: string
        qrCode: string
        link: string
        success: string
      }
    }
  }
  
  // Pricing Section
  pricing: {
    title: string
    subtitle: string
    plans: Array<{
      name: string
      price: string
      period: string
      features: string[]
      freeTrialButton: string
      ctaButton: string
    }>
  }
  
  // Demo Messages
  demoMessages: Array<{
    role: 'user' | 'assistant'
    text: string
  }>
  
  // Demo Chat Static
  demoChatStatic: {
    title: string
    subtitle: string
    messages: {
      user1: string
      assistant1: string
      user2: string
    }
  }
  
  // Testimonials
  testimonials: Array<{
    name: string
    role: string
    content: string
    rating: number
    avatar: string
  }>
  
  // Common
  common: {
    loading: string
    error: string
    retry: string
    close: string
    save: string
    cancel: string
    edit: string
    delete: string
    confirm: string
    back: string
    next: string
    previous: string
    submit: string
    search: string
    filter: string
    sort: string
    view: string
    add: string
    remove: string
    copy: string
    share: string
    download: string
    upload: string
    refresh: string
    settings: string
    profile: string
    logout: string
    dashboard: string
    notifications: string
    help: string
    support: string
    about: string
    privacy: string
    terms: string
    contact: string
  }
  
  // Auth Pages
  auth: {
    login: {
      title: string
      subtitle: string
      email: string
      password: string
      rememberMe: string
      forgotPassword: string
      loginButton: string
      noAccount: string
      registerLink: string
    }
    register: {
      title: string
      subtitle: string
      name: string
      email: string
      password: string
      confirmPassword: string
      agreeTerms: string
      termsLink: string
      registerButton: string
      haveAccount: string
      loginLink: string
    }
  }
  
  // Dashboard
  dashboard: {
    title: string
    welcome: string
    stats: {
      totalChatbots: string
      totalMessages: string
      activeChatbots: string
      totalGuests: string
    }
    quickActions: {
      createChatbot: string
      viewAnalytics: string
      manageSettings: string
      getSupport: string
    }
  }
  
  // Chatbots
  chatbots: {
    title: string
    create: string
    edit: string
    delete: string
    name: string
    description: string
    status: string
    messages: string
    guests: string
    lastActivity: string
    actions: string
    noChatbots: string
    createFirst: string
  }
  
  // Guardian
  guardian: {
    title: string
    subtitle: string
    features: string[]
    pricing: string
    activate: string
    deactivate: string
    loading: string
    stats: {
      totalGuests: string
      highRiskGuests: string
      resolvedIssues: string
      avgSatisfaction: string
      negativeReviewsPrevented: string
    }
    alerts: {
      title: string
      noAlerts: string
      resolve: string
      severity: {
        critical: string
        high: string
        medium: string
        low: string
      }
    }
    subscription: {
      active: string
      inactive: string
      cancel: string
      reactivate: string
      cancelModal: {
        title: string
        message: string
        confirm: string
        cancel: string
      }
    }
    demo: {
      title: string
      subtitle: string
      messages: {
        guest: string
        assistant: string
        guestFrustrated: string
        time: string
      }
      alert: {
        title: string
        subtitle: string
      }
    }
  }
  
    // Settings
  settings: {
    title: string
    profile: string
    account: string
    notifications: string
    security: string
    billing: string
    language: string
    theme: string
  }
  
  // Statistics Section
  statistics: {
    title: string
    subtitle: string
    stats: Array<{
      number: string
      label: string
      growth: string
    }>
  }
  
  // CTA Section
  cta: {
    title: string
    titleHighlight: string
    subtitle: string
    subtitleHighlight: string
    button: string
  }
  
  // Footer
  footer: {
    description: string
    sections: {
      product: {
        title: string
        features: string
        pricing: string
        api: string
      }
      company: {
        title: string
        about: string
        blog: string
        contact: string
      }
      legal: {
        title: string
        privacy: string
        terms: string
        cookies: string
      }
    }
    copyright: string
  }
  
  // Register Page
  register: {
    title: string
    subtitle: string
    freeTrialSubtitle: string
    paidSubtitle: string
    freeTrialBanner: string
    paidBanner: string
    fullName: string
    email: string
    phone: string
    phoneOptional: string
    password: string
    confirmPassword: string
    createAccount: string
    termsAccept: string
    termsLink: string
    privacyLink: string
    alreadyHaveAccount: string
    loginNow: string
    passwordRequirements: string
    passwordMinLength: string
    passwordUppercase: string
    passwordLowercase: string
    passwordNumber: string
    errors: {
      nameRequired: string
      nameMinLength: string
      emailRequired: string
      emailInvalid: string
      passwordRequired: string
      passwordMinLength: string
      passwordPattern: string
      confirmPasswordRequired: string
      passwordsNotMatch: string
      termsRequired: string
    }
    success: {
      freeTrial: string
      paid: string
    }
  }
}

export const translations: Record<Language, Translations> = {
  IT: {
    navbar: {
      features: "Funzionalità",
      demo: "Demo",
      howItWorks: "Come Funziona",
      pricing: "Prezzi",
      feedback: "Feedback",
      login: "Accedi",
      register: "Registrati"
    },
    hero: {
      title: "Risparmia Tempo con",
      subtitle: "Rispondi automaticamente, in modo completo e immediato, alle richieste dei guest 24/7.",
      subtitleHighlight: "Meno messaggi per te, più soddisfazione per loro.",
      freeTrialButton: "🎉 Prova Gratis 14 giorni",
      registerButton: "Registrati per iniziare",
      demoButton: "PROVA DEMO"
    },
    demo: {
      title: "Casa Bella Vista Bot",
      assistant: "Assistente Virtuale",
      suggestedMessages: [
        "Contatta Host",
        "Attrazioni",
        "Check-in/Check-out"
      ],
      placeholder: "Scrivi un messaggio...",
      welcome: "Benvenuto!",
      welcomeSubtitle: "Sono qui per aiutarti con qualsiasi domanda sulla casa e sulla zona. Come posso esserti utile?",
      startChat: "Inizia la Chat",
      namePlaceholder: "Il tuo nome (opzionale)",
      writing: "Sto scrivendo...",
      howCanIHelp: "Come posso aiutarti:",
      helpItems: [
        "Informazioni sulla casa e i servizi",
        "Orari di check-in e check-out",
        "Consigli su ristoranti e attrazioni",
        "Informazioni sui trasporti",
        "Contatti di emergenza"
      ],
      contactHost: "Contatta Host",
      attractions: "Attrazioni",
      checkInOut: "Check-in/Check-out",
      fullMessages: {
        contactHost: "Voglio contattare l'host. Come faccio?",
        attractions: "Vorrei visitare la zona, che attrazioni ci sono e come posso raggiungerle?",
        checkInOut: "Quali sono gli orari di check-in e check-out?"
      }
    },
    features: {
      title: "Tutto Quello che Ti Serve",
      subtitle: "Funzionalità potenti e raffinate per trasformare completamente",
      subtitleHighlight: "l'esperienza dei tuoi ospiti",
      items: [
        {
          title: "Chatbot Personalizzato",
          description: "Crea un assistente virtuale su misura per la tua proprietà con pochi clic",
          features: ["Risposte personalizzate", "Lingua italiana", "Conoscenza locale"]
        },
        {
          title: "Informazioni Locali",
          description: "Fornisci raccomandazioni per ristoranti, attrazioni e servizi locali",
          features: ["Ristoranti consigliati", "Attrazioni turistiche", "Trasporti locali"]
        },
        {
          title: "Statistiche Dettagliate",
          description: "Monitora le conversazioni e ottieni insight sui bisogni dei tuoi ospiti",
          features: ["Analisi conversazioni", "Metriche performance", "Report dettagliati"]
        },
        {
          title: "Setup Rapido",
          description: "Attiva il tuo chatbot in meno di 10 minuti con la nostra procedura guidata",
          features: ["Configurazione rapida", "Setup guidato", "Pronto in 10 minuti"]
        },
        {
          title: "Supporto 24/7",
          description: "Supporto tecnico sempre disponibile per aiutarti a sfruttarlo al massimo",
          features: ["Supporto dedicato", "Risposte rapide", "Assistenza continua"]
        },
        {
          title: "Sicuro e Affidabile",
          description: "I tuoi dati sono protetti con i più alti standard di sicurezza",
          features: ["Crittografia avanzata", "Backup automatici", "Conformità GDPR"]
        }
      ]
    },
    howItWorks: {
      title: "Come Funziona",
      subtitle: "Tre semplici passi per attivare il tuo assistente virtuale",
      steps: [
        {
          title: "Registrati",
          description: "Crea il tuo account e scegli il piano che meglio si adatta alle tue esigenze"
        },
        {
          title: "Personalizza",
          description: "Rispondi a domande guidate per creare la base di conoscenza del tuo chatbot"
        },
        {
          title: "Condividi",
          description: "Ricevi il QR code e il link da condividere con i tuoi ospiti"
        }
      ],
      animations: {
        register: {
          title: "Registrati",
          email: "mario.rossi@email.com",
          password: "••••••••",
          button: "Registrati",
          success: "Account creato!"
        },
        customize: {
          title: "Crea Chatbot",
          propertyName: "Nome proprietà",
          propertyValue: "Casa Bella Vista",
          checkIn: "Check-in",
          checkInValue: "15:00-20:00",
          tips: "Consigli",
          tipsValue: "Ristorante Roma, attrazioni locali...",
          button: "Chatbot Creato!"
        },
        share: {
          title: "Chatbot Pronto!",
          qrCode: "QR Code",
          link: "hostgpt.it/register",
          success: "Condivisione attiva!"
        }
      }
    },
    pricing: {
      title: "Una Sola Sottoscrizione",
      subtitle: "Tutto quello che ti serve per trasformare completamente l'esperienza dei tuoi ospiti",
      plans: [
        {
          name: "Sottoscrizione",
          price: "€29",
          period: "/mese",
          features: [
            "1 Chatbot personalizzato",
            "1000 messaggi/mese",
            "Supporto 24/7",
            "Statistiche avanzate",
            "QR Code e link di condivisione",
            "Accesso a Guardian (€9/mese)"
          ],
          freeTrialButton: "🎉 Prova gratis per 14 giorni",
          ctaButton: "Inizia Ora"
        }
      ]
    },
    demoMessages: [
      { role: 'user', text: 'Ciao! A che ora è il check-in?' },
      { role: 'assistant', text: 'Ciao! Il check-in è dalle 15:00 alle 20:00. Ti invieremo il codice della cassetta di sicurezza il giorno dell\'arrivo.' },
      { role: 'user', text: 'Posso fare check-in dopo le 22?' },
      { role: 'assistant', text: 'Certo! È previsto un self check-in 24/7. Facci sapere l\'orario stimato e ti assistiamo noi.' },
      { role: 'user', text: 'Com\'è il parcheggio in zona?' },
      { role: 'assistant', text: 'C\'è parcheggio gratuito in strada nei dintorni. In alternativa, a 300m trovi il Garage Verdi a 15€/giorno.' },
      { role: 'user', text: 'Wifi e ristoranti consigliati?' },
      { role: 'assistant', text: 'Wifi fibra 200Mbps, password: CASA2024. Per cenare ti consiglio Trattoria Roma (5 min a piedi) e Osteria Bella Vista.' }
    ],
    demoChatStatic: {
      title: "Demo Chat Live",
      subtitle: "Vedi HostGPT in azione!",
      messages: {
        user1: "Ciao! A che ora è il check-in?",
        assistant1: "Il check-in è dalle 15:00 alle 20:00. Ti invio il codice!",
        user2: "Perfetto! Grazie mille! 🙏"
      }
    },
    testimonials: [
      {
        name: "Marco Rossi",
        role: "Host in Rome",
        content: "HostGPT ha rivoluzionato il modo in cui gestisco gli ospiti. Risparmio ore ogni settimana!",
        rating: 5,
        avatar: "MR"
      },
      {
        name: "Laura Bianchi",
        role: "Host in Florence",
        content: "I miei ospiti adorano avere risposte immediate. Le recensioni sono migliorate notevolmente.",
        rating: 5,
        avatar: "LB"
      },
      {
        name: "Giuseppe Verdi",
        role: "Host in Milan",
        content: "Facile da configurare e utilissimo. Non posso più farne a meno!",
        rating: 5,
        avatar: "GV"
      }
    ],
    common: {
      loading: "Caricamento...",
      error: "Errore",
      retry: "Riprova",
      close: "Chiudi",
      save: "Salva",
      cancel: "Annulla",
      edit: "Modifica",
      delete: "Elimina",
      confirm: "Conferma",
      back: "Indietro",
      next: "Avanti",
      previous: "Precedente",
      submit: "Invia",
      search: "Cerca",
      filter: "Filtra",
      sort: "Ordina",
      view: "Visualizza",
      add: "Aggiungi",
      remove: "Rimuovi",
      copy: "Copia",
      share: "Condividi",
      download: "Scarica",
      upload: "Carica",
      refresh: "Aggiorna",
      settings: "Impostazioni",
      profile: "Profilo",
      logout: "Esci",
      dashboard: "Dashboard",
      notifications: "Notifiche",
      help: "Aiuto",
      support: "Supporto",
      about: "Chi siamo",
      privacy: "Privacy",
      terms: "Termini",
      contact: "Contatti"
    },
    auth: {
      login: {
        title: "Accedi",
        subtitle: "Accedi al tuo account HostGPT",
        email: "Email",
        password: "Password",
        rememberMe: "Ricordami",
        forgotPassword: "Password dimenticata?",
        loginButton: "Accedi",
        noAccount: "Non hai un account?",
        registerLink: "Registrati"
      },
      register: {
        title: "Registrati",
        subtitle: "Crea il tuo account HostGPT",
        name: "Nome",
        email: "Email",
        password: "Password",
        confirmPassword: "Conferma Password",
        agreeTerms: "Accetto i termini e condizioni",
        termsLink: "Termini e Condizioni",
        registerButton: "Registrati",
        haveAccount: "Hai già un account?",
        loginLink: "Accedi"
      }
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Benvenuto",
      stats: {
        totalChatbots: "Chatbot Totali",
        totalMessages: "Messaggi Totali",
        activeChatbots: "Chatbot Attivi",
        totalGuests: "Ospiti Totali"
      },
      quickActions: {
        createChatbot: "Crea Chatbot",
        viewAnalytics: "Visualizza Analisi",
        manageSettings: "Gestisci Impostazioni",
        getSupport: "Ottieni Supporto"
      }
    },
    chatbots: {
      title: "I Miei Chatbot",
      create: "Crea Chatbot",
      edit: "Modifica",
      delete: "Elimina",
      name: "Nome",
      description: "Descrizione",
      status: "Stato",
      messages: "Messaggi",
      guests: "Ospiti",
      lastActivity: "Ultima Attività",
      actions: "Azioni",
      noChatbots: "Non hai ancora creato nessun chatbot",
      createFirst: "Crea il tuo primo chatbot"
    },
    guardian: {
      title: "Guardian",
      subtitle: "Proteggi la tua proprietà con l'AI avanzata",
      features: [
        "Monitoraggio 24/7",
        "Rilevamento anomalie",
        "Notifiche immediate",
        "Report dettagliati"
      ],
      pricing: "€9/mese",
      activate: "Attiva Guardian",
      deactivate: "Disattiva Guardian",
      loading: "Caricamento Guardian...",
      stats: {
        totalGuests: "Ospiti Totali",
        highRiskGuests: "Ospiti ad Alto Rischio",
        resolvedIssues: "Problemi Risolti",
        avgSatisfaction: "Soddisfazione Media",
        negativeReviewsPrevented: "Recensioni Negative Evitate"
      },
      alerts: {
        title: "Alert Attivi",
        noAlerts: "Nessun alert attivo",
        resolve: "Risolve",
        severity: {
          critical: "Critico",
          high: "Alto",
          medium: "Medio",
          low: "Basso"
        }
      },
      subscription: {
        active: "Attivo",
        inactive: "Inattivo",
        cancel: "Cancella Abbonamento",
        reactivate: "Riattiva Abbonamento",
        cancelModal: {
          title: "Cancella Abbonamento Guardian",
          message: "Sei sicuro di voler cancellare il tuo abbonamento Guardian? Non riceverai più notifiche sugli ospiti problematici.",
          confirm: "Sì, Cancella",
          cancel: "Annulla"
        }
      },
      demo: {
        title: "Esempio di Conversazione Guardian",
        subtitle: "Guardian rileva automaticamente i problemi e ti avvisa",
        messages: {
          guest: "Ciao! Ho un problema con il WiFi, non riesco a connettermi",
          assistant: "Ciao! Mi dispiace per il problema. Prova a riavviare il router",
          guestFrustrated: "Ho già provato, ma non funziona. Sono molto frustrato!",
          time: "14:32"
        },
        alert: {
          title: "🚨 ALERT CRITICO",
          subtitle: "Ospite insoddisfatto rilevato"
        }
      }
    },
    statistics: {
      title: "Numeri che Parlano Chiaro",
      subtitle: "I risultati straordinari che stiamo costruendo insieme alla nostra community",
      stats: [
        {
          number: "50+",
          label: "Host Attivi",
          growth: "In crescita"
        },
        {
          number: "10K+",
          label: "Conversazioni",
          growth: "Al mese"
        },
        {
          number: "98%",
          label: "Soddisfazione",
          growth: "Media"
        },
        {
          number: "24/7",
          label: "Supporto",
          growth: "Disponibile"
        }
      ]
    },
    cta: {
      title: "Pronto a Rivoluzionare",
      titleHighlight: "l'Esperienza dei Tuoi Ospiti?",
      subtitle: "Unisciti a",
      subtitleHighlight: "centinaia di host",
      button: "Registrati per iniziare"
    },
    footer: {
      description: "Il tuo assistente virtuale per affitti vacanza",
      sections: {
        product: {
          title: "Prodotto",
          features: "Funzionalità",
          pricing: "Prezzi",
          api: "API"
        },
        company: {
          title: "Azienda",
          about: "Chi Siamo",
          blog: "Blog",
          contact: "Contatti"
        },
        legal: {
          title: "Legale",
          privacy: "Privacy",
          terms: "Termini",
          cookies: "Cookie"
        }
      },
      copyright: "© 2024 HostGPT. Tutti i diritti riservati."
    },
    register: {
      title: "Crea il tuo Account",
      subtitle: "Inizia subito con HostGPT",
      freeTrialSubtitle: "Inizia la prova gratuita di 14 giorni",
      paidSubtitle: "Inizia subito con HostGPT",
      freeTrialBanner: "🎉 Hai selezionato la prova gratuita! Dopo la registrazione potrai iniziare subito a creare il tuo chatbot.",
      paidBanner: "💳 Dopo la registrazione completerai il pagamento per attivare il tuo abbonamento.",
      fullName: "Nome Completo",
      email: "Email",
      phone: "Telefono",
      phoneOptional: "Telefono (opzionale)",
      password: "Password",
      confirmPassword: "Conferma Password",
      createAccount: "Crea Account",
      termsAccept: "Accetto i",
      termsLink: "Termini e Condizioni",
      privacyLink: "Privacy Policy",
      alreadyHaveAccount: "Hai già un account?",
      loginNow: "Accedi ora",
      passwordRequirements: "Requisiti password:",
      passwordMinLength: "Almeno 8 caratteri",
      passwordUppercase: "Una lettera maiuscola",
      passwordLowercase: "Una lettera minuscola",
      passwordNumber: "Un numero",
      errors: {
        nameRequired: "Nome richiesto",
        nameMinLength: "Il nome deve essere almeno 2 caratteri",
        emailRequired: "Email richiesta",
        emailInvalid: "Email non valida",
        passwordRequired: "Password richiesta",
        passwordMinLength: "La password deve essere almeno 8 caratteri",
        passwordPattern: "La password deve contenere maiuscole, minuscole e numeri",
        confirmPasswordRequired: "Conferma la password",
        passwordsNotMatch: "Le password non corrispondono",
        termsRequired: "Devi accettare i termini e condizioni"
      },
      success: {
        freeTrial: "Registrazione completata! Controlla la tua email per il link di verifica e inizia la prova gratuita.",
        paid: "Registrazione completata! Controlla la tua email per il link di verifica e completa il pagamento."
      }
    },
    settings: {
      title: "Impostazioni",
      profile: "Profilo",
      account: "Account",
      notifications: "Notifiche",
      security: "Sicurezza",
      billing: "Fatturazione",
      language: "Lingua",
      theme: "Tema"
    }
  },
  ENG: {
    navbar: {
      features: "Features",
      demo: "Demo",
      howItWorks: "How It Works",
      pricing: "Pricing",
      feedback: "Feedback",
      login: "Login",
      register: "Sign Up"
    },
    hero: {
      title: "Save Time with",
      subtitle: "Automatically respond completely and immediately to guest requests 24/7.",
      subtitleHighlight: "Less messages for you, more satisfaction for them.",
      freeTrialButton: "🎉 Free Trial 14 Days",
      registerButton: "Sign Up to Start",
      demoButton: "TRY DEMO"
    },
    demo: {
      title: "Casa Bella Vista Bot",
      assistant: "Virtual Assistant",
      suggestedMessages: [
        "Contact Host",
        "Attractions",
        "Check-in/Check-out"
      ],
      placeholder: "Write a message...",
      welcome: "Welcome!",
      welcomeSubtitle: "I'm here to help you with any questions about the house and the area. How can I be useful?",
      startChat: "Start Chat",
      namePlaceholder: "Your name (optional)",
      writing: "I'm writing...",
      howCanIHelp: "How can I help you:",
      helpItems: [
        "Information about the house and services",
        "Check-in and check-out times",
        "Restaurant and attraction recommendations",
        "Transportation information",
        "Emergency contacts"
      ],
      contactHost: "Contact Host",
      attractions: "Attractions",
      checkInOut: "Check-in/Check-out",
      fullMessages: {
        contactHost: "I want to contact the host. How can I do it?",
        attractions: "I'd like to visit the area, what attractions are there and how can I reach them?",
        checkInOut: "What are the check-in and check-out times?"
      }
    },
    features: {
      title: "Everything You Need",
      subtitle: "Powerful and refined features to completely transform",
      subtitleHighlight: "your guests' experience",
      items: [
        {
          title: "Custom Chatbot",
          description: "Create a virtual assistant tailored to your property with just a few clicks",
          features: ["Personalized responses", "Italian language", "Local knowledge"]
        },
        {
          title: "Local Information",
          description: "Provide recommendations for restaurants, attractions and local services",
          features: ["Recommended restaurants", "Tourist attractions", "Local transportation"]
        },
        {
          title: "Detailed Statistics",
          description: "Monitor conversations and get insights into your guests' needs",
          features: ["Conversation analysis", "Performance metrics", "Detailed reports"]
        },
        {
          title: "Quick Setup",
          description: "Activate your chatbot in less than 10 minutes with our guided procedure",
          features: ["Quick configuration", "Guided setup", "Ready in 10 minutes"]
        },
        {
          title: "24/7 Support",
          description: "Technical support always available to help you get the most out of it",
          features: ["Dedicated support", "Quick responses", "Continuous assistance"]
        },
        {
          title: "Secure & Reliable",
          description: "Your data is protected with the highest security standards",
          features: ["Advanced encryption", "Automatic backups", "GDPR compliance"]
        }
      ]
    },
    howItWorks: {
      title: "How It Works",
      subtitle: "Three simple steps to activate your virtual assistant",
      steps: [
        {
          title: "Sign Up",
          description: "Create your account and choose the plan that best suits your needs"
        },
        {
          title: "Customize",
          description: "Answer guided questions to create your chatbot's knowledge base"
        },
        {
          title: "Share",
          description: "Receive the QR code and link to share with your guests"
        }
      ],
      animations: {
        register: {
          title: "Sign Up",
          email: "mario.rossi@email.com",
          password: "••••••••",
          button: "Sign Up",
          success: "Account created!"
        },
        customize: {
          title: "Create Chatbot",
          propertyName: "Property name",
          propertyValue: "Bella Vista House",
          checkIn: "Check-in",
          checkInValue: "3:00 PM - 8:00 PM",
          tips: "Tips",
          tipsValue: "Restaurant Roma, local attractions...",
          button: "Chatbot Created!"
        },
        share: {
          title: "Chatbot Ready!",
          qrCode: "QR Code",
          link: "hostgpt.it/register",
          success: "Sharing active!"
        }
      }
    },
    pricing: {
      title: "One Subscription Only",
      subtitle: "Everything you need to completely transform your guests' experience",
      plans: [
        {
          name: "Subscription",
          price: "€29",
          period: "/month",
          features: [
            "1 Custom chatbot",
            "1000 messages/month",
            "24/7 Support",
            "Advanced statistics",
            "QR Code and sharing link",
            "Access to Guardian (€9/month)"
          ],
          freeTrialButton: "🎉 Free trial for 14 days",
          ctaButton: "Start Now"
        }
      ]
    },
    demoMessages: [
      { role: 'user', text: 'Hi! What time is check-in?' },
      { role: 'assistant', text: 'Hi! Check-in is from 3:00 PM to 8:00 PM. I\'ll send you the safe box code on arrival day.' },
      { role: 'user', text: 'Can I check-in after 10 PM?' },
      { role: 'assistant', text: 'Sure! Self check-in is available 24/7. Let us know your estimated time and we\'ll assist you.' },
      { role: 'user', text: 'How is parking in the area?' },
      { role: 'assistant', text: 'There\'s free street parking nearby. Alternatively, 300m away you\'ll find Garage Verdi at €15/day.' },
      { role: 'user', text: 'WiFi and recommended restaurants?' },
      { role: 'assistant', text: 'WiFi fiber 200Mbps, password: CASA2024. For dinner I recommend Trattoria Roma (5 min walk) and Osteria Bella Vista.' }
    ],
    demoChatStatic: {
      title: "Demo Chat Live",
      subtitle: "See HostGPT in action!",
      messages: {
        user1: "Hi! What time is check-in?",
        assistant1: "Check-in is from 3:00 PM to 8:00 PM. I'll send you the code!",
        user2: "Perfect! Thank you so much! 🙏"
      }
    },
    testimonials: [
      {
        name: "Marco Rossi",
        role: "Host in Rome",
        content: "HostGPT has revolutionized the way I manage guests. I save hours every week!",
        rating: 5,
        avatar: "MR"
      },
      {
        name: "Laura Bianchi",
        role: "Host in Florence",
        content: "My guests love getting immediate responses. Reviews have improved significantly.",
        rating: 5,
        avatar: "LB"
      },
      {
        name: "Giuseppe Verdi",
        role: "Host in Milan",
        content: "Easy to configure and very useful. I can't do without it anymore!",
        rating: 5,
        avatar: "GV"
      }
    ],
    common: {
      loading: "Loading...",
      error: "Error",
      retry: "Retry",
      close: "Close",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      previous: "Previous",
      submit: "Submit",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      view: "View",
      add: "Add",
      remove: "Remove",
      copy: "Copy",
      share: "Share",
      download: "Download",
      upload: "Upload",
      refresh: "Refresh",
      settings: "Settings",
      profile: "Profile",
      logout: "Logout",
      dashboard: "Dashboard",
      notifications: "Notifications",
      help: "Help",
      support: "Support",
      about: "About",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact"
    },
    auth: {
      login: {
        title: "Login",
        subtitle: "Login to your HostGPT account",
        email: "Email",
        password: "Password",
        rememberMe: "Remember me",
        forgotPassword: "Forgot password?",
        loginButton: "Login",
        noAccount: "Don't have an account?",
        registerLink: "Sign Up"
      },
      register: {
        title: "Sign Up",
        subtitle: "Create your HostGPT account",
        name: "Name",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password",
        agreeTerms: "I agree to the terms and conditions",
        termsLink: "Terms & Conditions",
        registerButton: "Sign Up",
        haveAccount: "Already have an account?",
        loginLink: "Login"
      }
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome",
      stats: {
        totalChatbots: "Total Chatbots",
        totalMessages: "Total Messages",
        activeChatbots: "Active Chatbots",
        totalGuests: "Total Guests"
      },
      quickActions: {
        createChatbot: "Create Chatbot",
        viewAnalytics: "View Analytics",
        manageSettings: "Manage Settings",
        getSupport: "Get Support"
      }
    },
    chatbots: {
      title: "My Chatbots",
      create: "Create Chatbot",
      edit: "Edit",
      delete: "Delete",
      name: "Name",
      description: "Description",
      status: "Status",
      messages: "Messages",
      guests: "Guests",
      lastActivity: "Last Activity",
      actions: "Actions",
      noChatbots: "You haven't created any chatbots yet",
      createFirst: "Create your first chatbot"
    },
    guardian: {
      title: "Guardian",
      subtitle: "Protect your property with advanced AI",
      features: [
        "24/7 Monitoring",
        "Anomaly Detection",
        "Instant Notifications",
        "Detailed Reports"
      ],
      pricing: "€9/month",
      activate: "Activate Guardian",
      deactivate: "Deactivate Guardian",
      loading: "Loading Guardian...",
      stats: {
        totalGuests: "Total Guests",
        highRiskGuests: "High Risk Guests",
        resolvedIssues: "Resolved Issues",
        avgSatisfaction: "Average Satisfaction",
        negativeReviewsPrevented: "Negative Reviews Prevented"
      },
      alerts: {
        title: "Active Alerts",
        noAlerts: "No active alerts",
        resolve: "Resolve",
        severity: {
          critical: "Critical",
          high: "High",
          medium: "Medium",
          low: "Low"
        }
      },
      subscription: {
        active: "Active",
        inactive: "Inactive",
        cancel: "Cancel Subscription",
        reactivate: "Reactivate Subscription",
        cancelModal: {
          title: "Cancel Guardian Subscription",
          message: "Are you sure you want to cancel your Guardian subscription? You will no longer receive notifications about problematic guests.",
          confirm: "Yes, Cancel",
          cancel: "Cancel"
        }
      },
      demo: {
        title: "Guardian Conversation Example",
        subtitle: "Guardian automatically detects issues and alerts you",
        messages: {
          guest: "Hi! I have a problem with WiFi, I can't connect",
          assistant: "Hi! I'm sorry for the problem. Try restarting the router",
          guestFrustrated: "I already tried, but it doesn't work. I'm very frustrated!",
          time: "14:32"
        },
        alert: {
          title: "🚨 CRITICAL ALERT",
          subtitle: "Dissatisfied guest detected"
        }
      }
    },
    statistics: {
      title: "Numbers That Speak Clearly",
      subtitle: "The extraordinary results we're building together with our community",
      stats: [
        {
          number: "50+",
          label: "Active Hosts",
          growth: "Growing"
        },
        {
          number: "10K+",
          label: "Conversations",
          growth: "Per month"
        },
        {
          number: "98%",
          label: "Satisfaction",
          growth: "Average"
        },
        {
          number: "24/7",
          label: "Support",
          growth: "Available"
        }
      ]
    },
    cta: {
      title: "Ready to Revolutionize",
      titleHighlight: "Your Guests' Experience?",
      subtitle: "Join",
      subtitleHighlight: "hundreds of hosts",
      button: "Sign Up to Start"
    },
    footer: {
      description: "Your virtual assistant for vacation rentals",
      sections: {
        product: {
          title: "Product",
          features: "Features",
          pricing: "Pricing",
          api: "API"
        },
        company: {
          title: "Company",
          about: "About Us",
          blog: "Blog",
          contact: "Contact"
        },
        legal: {
          title: "Legal",
          privacy: "Privacy",
          terms: "Terms",
          cookies: "Cookies"
        }
      },
      copyright: "© 2024 HostGPT. All rights reserved."
    },
    register: {
      title: "Create your Account",
      subtitle: "Start with HostGPT",
      freeTrialSubtitle: "Start your 14-day free trial",
      paidSubtitle: "Start with HostGPT",
      freeTrialBanner: "🎉 You selected the free trial! After registration you can start creating your chatbot immediately.",
      paidBanner: "💳 After registration you will complete the payment to activate your subscription.",
      fullName: "Full Name",
      email: "Email",
      phone: "Phone",
      phoneOptional: "Phone (optional)",
      password: "Password",
      confirmPassword: "Confirm Password",
      createAccount: "Create Account",
      termsAccept: "I accept the",
      termsLink: "Terms & Conditions",
      privacyLink: "Privacy Policy",
      alreadyHaveAccount: "Already have an account?",
      loginNow: "Login now",
      passwordRequirements: "Password requirements:",
      passwordMinLength: "At least 8 characters",
      passwordUppercase: "One uppercase letter",
      passwordLowercase: "One lowercase letter",
      passwordNumber: "One number",
      errors: {
        nameRequired: "Name required",
        nameMinLength: "Name must be at least 2 characters",
        emailRequired: "Email required",
        emailInvalid: "Invalid email",
        passwordRequired: "Password required",
        passwordMinLength: "Password must be at least 8 characters",
        passwordPattern: "Password must contain uppercase, lowercase and numbers",
        confirmPasswordRequired: "Confirm password",
        passwordsNotMatch: "Passwords do not match",
        termsRequired: "You must accept the terms and conditions"
      },
      success: {
        freeTrial: "Registration completed! Check your email for the verification link and start your free trial.",
        paid: "Registration completed! Check your email for the verification link and complete the payment."
      }
    },
    settings: {
      title: "Settings",
      profile: "Profile",
      account: "Account",
      notifications: "Notifications",
      security: "Security",
      billing: "Billing",
      language: "Language",
      theme: "Theme"
    }
  }
}
