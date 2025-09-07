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
    titlePrefix: string
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
      priceId?: string
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
    copied: string
    seeAll: string
    share: string
    download: string
    upload: string
    refresh: string
    redirecting: string
    settings: string
    security: string
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
    done: string
  }
  
  // Services
  services: {
    wifi: string
    airConditioning: string
    heating: string
    tv: string
    netflix: string
    kitchen: string
    dishwasher: string
    washingMachine: string
    dryer: string
    iron: string
    parking: string
    pool: string
    gym: string
    balcony: string
    garden: string
    elevator: string
    safe: string
    alarm: string
    petsAllowed: string
    smokingAllowed: string
  }
  
  // Conversations translations
  conversations: {
    title: string
    chatbot: string
    searchGuest: string
    searchPlaceholder: string
    loading: string
    selectChatbot: string
    noConversations: string
    loadingConversations: string
    selectOption: string
    conversations: string
    messages: string
    guest: string
    startedAt: string
    messageCount: string
    lastMessage: string
    viewConversation: string
    noMessages: string
    emptyState: string
  }
  
  // Checkout translations
  checkout: {
    title: string
    loading: string
    processing: string
    success: string
    error: string
    monthly: {
      title: string
      subtitle: string
      headerTitle: string
      paymentTitle: string
      summaryTitle: string
      planName: string
      billing: string
      billingType: string
      total: string
      includes: string
      features: {
        messages: string
        chatbots: string
        responses: string
        support: string
      }
      button: string
      processing: string
      referralCode: string
      referralCodeOptional: string
      referralCodePlaceholder: string
      referralCodeHelp: string
      termsText: string
      termsLink: string
      privacyLink: string
      successMessage: string
      successMessageWithBonus: string
      errorMessages: {
        missingToken: string
        checkoutError: string
        paymentError: string
        cardNotFound: string
        paymentNotCompleted: string
      }
      statusMessages: {
        preparing: string
        wait: string
        cancelled: string
        tryAgain: string
        completed: string
        goToDashboard: string
      }
    }
    combined: {
      title: string
      subtitle: string
      headerTitle: string
      paymentTitle: string
      summaryTitle: string
      hostgptPro: string
      guardian: string
      billing: string
      billingType: string
      total: string
      includes: string
      features: {
        messages: string
        chatbots: string
        monitoring: string
        alerts: string
      }
      button: string
      processing: string
      referralCode: string
      referralCodeOptional: string
      referralCodePlaceholder: string
      referralCodeHelp: string
      termsText: string
      termsLink: string
      privacyLink: string
      successMessage: string
      successMessageWithBonus: string
      errorMessages: {
        missingToken: string
        checkoutError: string
        paymentError: string
        cardNotFound: string
        paymentNotCompleted: string
      }
      statusMessages: {
        preparing: string
        wait: string
        cancelled: string
        tryAgain: string
        completed: string
        goToDashboard: string
      }
    }
    guardian: {
      title: string
      subtitle: string
      headerTitle: string
      paymentTitle: string
      summaryTitle: string
      planName: string
      billing: string
      billingType: string
      total: string
      includes: string
      features: {
        monitoring: string
        alerts: string
        detection: string
        suggestions: string
      }
      button: string
      processing: string
      termsText: string
      termsLink: string
      privacyLink: string
      successMessage: string
      errorMessages: {
        missingToken: string
        checkoutError: string
        paymentError: string
        cardNotFound: string
        paymentNotCompleted: string
      }
      statusMessages: {
        preparing: string
        wait: string
        cancelled: string
        tryAgain: string
        completed: string
        goToDashboard: string
      }
    }
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
        totalHistorical: string
        allChatbots: string
        alwaysOnline: string
    }
    quickActions: {
      createChatbot: string
      viewAnalytics: string
      manageSettings: string
      getSupport: string
    }
      freeTrial: {
        title: string
        description: string
        activateButton: string
      }
      chatbots: {
        title: string
        seeAll: string
        noChatbots: string
        createFirst: string
      }
      moreStructures: {
        title: string
        description: string
        whatsappButton: string
      }
      qrModal: {
        title: string
        description: string
        copyButton: string
        downloadButton: string
        closeButton: string
      }
      status: {
        hostgptActive: string
        hostgptCancelling: string
        hostgptCancelled: string
        hostgptFreeTrial: string
        guardianActive: string
        guardianCancelling: string
        guardianInactive: string
    }
  }
  
  // Chatbots
  chatbots: {
    title: string
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
    conversations: string
    active: string
    guest: string
    performance: {
      title: string
      conversations: string
      messages: string
      dailyDetail: string
    }
    preview: {
      title: string
      chatUrl: string
      messages: string
      conversations: string
      averagePerChat: string
    }
    alert: {
      critical: string
      dissatisfiedGuest: string
      negativeReviewRisk: string
      sentiment: string
    }
    create: {
      title: string
      subtitle: string
      steps: {
        basic: string
        property: string
        amenities: string
        location: string
        services: string
        final: string
      }
      form: {
        name: string
        propertyName: string
        propertyType: string
        propertyAddress: string
        propertyCity: string
        propertyDescription: string
        checkInTime: string
        checkOutTime: string
        houseRules: string
        amenities: string
        neighborhoodDescription: string
        transportationInfo: string
        shoppingInfo: string
        parkingInfo: string
        specialInstructions: string
        welcomeMessage: string
        nearbyAttractions: string
        restaurantsBars: string
        emergencyContacts: string
        wifiInfo: string
        faq: string
        addAttraction: string
        addRestaurant: string
        addContact: string
        addFaq: string
        customFaq: string
        attractionName: string
        attractionDistance: string
        attractionDescription: string
        restaurantName: string
        restaurantType: string
        restaurantDistance: string
        contactName: string
        contactNumber: string
        contactType: string
        wifiNetwork: string
        wifiPassword: string
        question: string
        answer: string
        remove: string
      }
      amenities: {
        wifi: string
        airConditioning: string
        heating: string
        tv: string
        netflix: string
        kitchen: string
        dishwasher: string
        washingMachine: string
        dryer: string
        iron: string
        parking: string
        pool: string
        gym: string
        balcony: string
        garden: string
        elevator: string
        safe: string
        alarm: string
        petsAllowed: string
        smokingAllowed: string
      }
      buttons: {
        next: string
        previous: string
        create: string
        save: string
        cancel: string
        add: string
      }
      messages: {
        creating: string
        created: string
        error: string
        saved: string
        saving: string
      }
    }
         edit: {
       title: string
       subtitle: string
       form: {
         name: string
         propertyName: string
         propertyType: string
         selectType: string
         apartment: string
         villa: string
         house: string
         room: string
         loft: string
         propertyAddress: string
         propertyCity: string
         propertyDescription: string
         checkInTime: string
         checkOutTime: string
         houseRules: string
         amenities: string
         neighborhoodDescription: string
         transportationInfo: string
         shoppingInfo: string
         parkingInfo: string
         specialInstructions: string
         welcomeMessage: string
         nearbyAttractions: string
         restaurantsBars: string
         emergencyContacts: string
         wifiInfo: string
         faq: string
         addAttraction: string
         addRestaurant: string
         addContact: string
         addFaq: string
         customFaq: string
         attractionName: string
         attractionDistance: string
         attractionDescription: string
         restaurantName: string
         restaurantType: string
         restaurantDistance: string
         contactName: string
         contactNumber: string
         contactType: string
         wifiNetwork: string
         wifiPassword: string
         question: string
         answer: string
         remove: string
         selectServices: string
         manageAttractions: string
         manageRestaurants: string
          manageFaq: string
          host: string
          emergency: string
          maintenance: string
          cleaning: string
          emergencyContactsTitle: string
          addContactTitle: string
          manageFaqTitle: string
          welcomeMessageTitle: string
          initialMessage: string
          welcomeMessagePlaceholder: string
       }
       amenities: {
         wifi: string
         airConditioning: string
         heating: string
         tv: string
         netflix: string
         kitchen: string
         dishwasher: string
         washingMachine: string
         dryer: string
         iron: string
         parking: string
         pool: string
         gym: string
         balcony: string
         garden: string
         elevator: string
         safe: string
         alarm: string
         petsAllowed: string
         smokingAllowed: string
       }
       buttons: {
         save: string
         cancel: string
         add: string
       }
       messages: {
         saving: string
         saved: string
         error: string
       }
     }
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
    redirecting: string
    reactivate: string
    activateWithPrice: string
    stats: {
      totalGuests: string
      totalGuestsShort: string
      monitored: string
      highRiskGuests: string
      highRiskGuestsShort: string
      detected: string
      resolvedIssues: string
      resolvedIssuesShort: string
      managed: string
      avgSatisfaction: string
      avgSatisfactionShort: string
      score: string
      negativeReviewsPrevented: string
    }
    alerts: {
      title: string
      activeAlerts: string
      noAlerts: string
      allUnderControl: string
      resolve: string
      guest: string
      created: string
      fullConversation: string
      resolutionSuggestion: string
      severity: {
        critical: string
        high: string
        medium: string
        low: string
      }
    }
    subscription: {
      title: string
      status: string
      active: string
      inactive: string
      cancelling: string
      cancel: string
      reactivate: string
      reactivateFree: string
      endDate: string
      nextRenewal: string
      cancelSection: {
        title: string
        description: string
        button: string
        cancelling: string
      }
      cancellingSection: {
        title: string
        description: string
        button: string
        reactivating: string
      }
      cancelModal: {
        title: string
        message: string
        confirm: string
        cancel: string
        cancelling: string
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
      phoneCall: string
      problemSolved: string
      negativeReviewAvoided: string
    }
    success: {
      subscriptionActivated: string
      alertResolved: string
      subscriptionCancelled: string
      subscriptionReactivated: string
    }
    errors: {
      subscriptionError: string
      alertResolutionError: string
      cancellationError: string
      reactivationError: string
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
    personalInfo: string
    fullName: string
    email: string
    phone: string
    company: string
    updateProfile: string
    changePassword: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
    updatePassword: string
    subscriptionStatus: string
    plan: string
    nextBilling: string
    cancelSubscription: string
    reactivateSubscription: string
    notificationSettings: string
    emailNotifications: string
    smsNotifications: string
    pushNotifications: string
    privacySettings: string
    dataProcessing: string
    marketingEmails: string
    analytics: string
    deleteAccount: string
    deleteAccountWarning: string
    deleteAccountConfirm: string
    cancelSubscriptionTitle: string
    cancelSubscriptionMessage: string
    confirmCancellation: string
    cancelling: string
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
      title: "L'assistente H24 per i tuoi ospiti",
      titlePrefix: "Risparmia ore di tempo prezioso con",
      subtitle: "Risponde automaticamente, in modo completo e immediato, alle richieste degli ospiti.",
      subtitleHighlight: "Meno messaggi per te, più soddisfazione per loro.",
      freeTrialButton: "🎉 14 Giorni Gratis",
      registerButton: "Registrati per iniziare",
      demoButton: "PROVA DEMO"
    },
    demo: {
      title: "Casa Bella Vista Bot",
      assistant: "Assistente Virtuale",
      suggestedMessages: [
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
          title: "Stop alle Domande Ripetitive",
          description: "Non perdere più tempo a rispondere alle stesse domande sui check-in, WiFi e attrazioni locali",
          features: ["Risposte automatiche 24/7", "Zero interruzioni", "Tempo recuperato"]
        },
        {
          title: "Ospiti Più Soddisfatti",
          description: "Risposte immediate e complete aumentano la soddisfazione e le recensioni positive",
          features: ["Risposte istantanee", "Informazioni complete", "Recensioni migliori"]
        },
        {
          title: "Setup in 5 Minuti",
          description: "Attiva il tuo assistente virtuale in pochi minuti, senza competenze tecniche",
          features: ["Configurazione guidata", "Nessuna programmazione", "Pronto subito"]
        },
        {
          title: "Costa Meno di un Caffè",
          description: "Investi meno di quello che spendi per un caffè al giorno e risparmia ore di lavoro",
          features: ["Prezzo accessibile", "ROI immediato", "Risparmio garantito"]
        }
      ]
    },
    howItWorks: {
      title: "Come Funziona",
      subtitle: "Ogni giorno perdi <span class='text-pink-600 font-bold'>ore preziose</span> a rispondere alle stesse domande dei tuoi ospiti.<br><br>Con <span class='text-pink-600 font-bold'>HostGPT</span> risparmi tutto quel tempo per <span class='text-pink-600 font-bold'>meno di un caffè al giorno</span>.<br><br>Il tuo assistente virtuale risponde <span class='text-pink-600 font-bold'>automaticamente 24/7</span>, mentre tu ti concentri su ciò che conta davvero.",
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
          name: "Mensile",
          price: "€29",
          period: "/mese",
          features: [
            "1 Chatbot personalizzato",
            "1000 messaggi/mese",
            "Supporto 24/7"
          ],
          freeTrialButton: "🎉 14 Giorni Gratis",
          ctaButton: "Inizia Ora"
        },
        {
          name: "Annuale",
          price: "€299",
          period: "/anno",
          features: [
            "1 Chatbot personalizzato",
            "1000 messaggi/mese",
            "Supporto 24/7"
          ],
          freeTrialButton: "🎉 14 Giorni Gratis",
          ctaButton: "Inizia Ora",
          priceId: "price_1S3dNUClR9LCJ8qEX2DEK4SE"
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
      copied: "Copiato!",
      seeAll: "Vedi tutte",
      share: "Condividi",
      download: "Scarica",
      upload: "Carica",
      refresh: "Aggiorna",
      redirecting: "Reindirizzamento...",
      settings: "Impostazioni",
      security: "Sicurezza",
      profile: "Profilo",
      logout: "Esci",
      dashboard: "Dashboard",
      notifications: "Notifiche",
      help: "Aiuto",
      support: "Supporto",
      about: "Chi siamo",
      privacy: "Privacy",
      terms: "Termini",
      contact: "Contatti",
      done: "Fatto"
    },
    
    // Services
    services: {
      wifi: "WiFi",
      airConditioning: "Aria Condizionata",
      heating: "Riscaldamento",
      tv: "TV",
      netflix: "Netflix",
      kitchen: "Cucina",
      dishwasher: "Lavastoviglie",
      washingMachine: "Lavatrice",
      dryer: "Asciugatrice",
      iron: "Ferro da stiro",
      parking: "Parcheggio",
      pool: "Piscina",
      gym: "Palestra",
      balcony: "Balcone",
      garden: "Giardino",
      elevator: "Ascensore",
      safe: "Cassaforte",
      alarm: "Allarme",
      petsAllowed: "Animali ammessi",
      smokingAllowed: "Fumatori ammessi"
    },
    
    // Conversations translations
    conversations: {
      title: "Conversazioni",
      chatbot: "Chatbot",
      searchGuest: "Cerca per ospite",
      searchPlaceholder: "Es. Marco",
      loading: "Caricamento...",
      selectChatbot: "Seleziona un chatbot per vedere le conversazioni",
      noConversations: "Nessuna conversazione trovata",
      loadingConversations: "Caricamento conversazioni...",
      selectOption: "Seleziona...",
      conversations: "conversazioni",
      messages: "messaggi",
      guest: "Ospite",
      startedAt: "Iniziata il",
      messageCount: "Messaggi",
      lastMessage: "Ultimo messaggio",
      viewConversation: "Visualizza conversazione",
      noMessages: "Nessun messaggio",
      emptyState: "Nessuna conversazione disponibile"
    },
    
    // Checkout translations
    checkout: {
      title: "Checkout",
      loading: "Caricamento...",
      processing: "Elaborazione pagamento...",
      success: "Pagamento completato con successo!",
      error: "Errore durante il pagamento",
      monthly: {
        title: "Completa l'abbonamento",
        subtitle: "Inizia subito a creare chatbot intelligenti",
        headerTitle: "HostGPT",
        paymentTitle: "Pagamento",
        summaryTitle: "Riepilogo",
        planName: "HostGPT Pro",
        billing: "Fatturazione",
        billingType: "Mensile",
        total: "Totale",
        includes: "Include",
        features: {
          messages: "1000 messaggi/mese",
          chatbots: "Chatbot illimitati",
          responses: "Risposte istantanee",
          support: "Supporto prioritario"
        },
        button: "Paga 29€/mese",
        processing: "Elaborazione...",
        referralCode: "Codice Referral (opzionale)",
        referralCodeOptional: "Codice Referral (opzionale)",
        referralCodePlaceholder: "Inserisci il codice referral",
        referralCodeHelp: "Inserisci un codice referral valido per ricevere messaggi bonus al mese",
        termsText: "Cliccando su \"Paga\" accetti i nostri",
        termsLink: "Termini",
        privacyLink: "Privacy",
        successMessage: "Abbonamento attivato! Reindirizzamento alla dashboard...",
        successMessageWithBonus: "Abbonamento attivato con messaggi bonus! Reindirizzamento alla dashboard...",
        errorMessages: {
          missingToken: "Token mancante. Accedi nuovamente per continuare.",
          checkoutError: "Errore durante il reindirizzamento al pagamento",
          paymentError: "Errore durante il pagamento",
          cardNotFound: "Elemento carta non trovato",
          paymentNotCompleted: "Pagamento non completato"
        },
        statusMessages: {
          preparing: "Preparazione...",
          wait: "Attendi qualche secondo.",
          cancelled: "Pagamento annullato",
          tryAgain: "Riprova",
          completed: "Completato!",
          goToDashboard: "Vai alla Dashboard"
        }
      },
      combined: {
        title: "Pacchetto Completo",
        subtitle: "HostGPT Pro + Guardian per la massima efficienza",
        headerTitle: "HostGPT Pro + Guardian",
        paymentTitle: "Pagamento",
        summaryTitle: "Riepilogo",
        hostgptPro: "HostGPT Pro",
        guardian: "Guardian",
        billing: "Fatturazione",
        billingType: "Mensile",
        total: "Totale",
        includes: "Include",
        features: {
          messages: "1000 messaggi/mese",
          chatbots: "Chatbot illimitati",
          monitoring: "Monitoraggio automatico",
          alerts: "Alert ospiti insoddisfatti"
        },
        button: "Attiva Pacchetto Completo - 38€/mese",
        processing: "Elaborazione...",
        referralCode: "Codice Referral (opzionale)",
        referralCodeOptional: "Codice Referral (opzionale)",
        referralCodePlaceholder: "Inserisci il codice referral",
        referralCodeHelp: "Inserisci un codice referral valido per ricevere messaggi bonus al mese",
        termsText: "Cliccando su \"Attiva Pacchetto Completo\" accetti i nostri",
        termsLink: "Termini",
        privacyLink: "Privacy",
        successMessage: "Pacchetto completo attivato! Reindirizzamento alla dashboard...",
        successMessageWithBonus: "Pacchetto completo attivato con messaggi bonus! Reindirizzamento alla dashboard...",
        errorMessages: {
          missingToken: "Token mancante. Accedi nuovamente per continuare.",
          checkoutError: "Errore durante il reindirizzamento al pagamento",
          paymentError: "Errore durante il pagamento",
          cardNotFound: "Elemento carta non trovato",
          paymentNotCompleted: "Pagamento non completato"
        },
        statusMessages: {
          preparing: "Preparazione...",
          wait: "Attendi qualche secondo.",
          cancelled: "Pagamento annullato",
          tryAgain: "Riprova",
          completed: "Completato!",
          goToDashboard: "Vai alla Dashboard"
        }
      },
      guardian: {
        title: "Attiva Guardian",
        subtitle: "Proteggi la soddisfazione dei tuoi ospiti",
        headerTitle: "HostGPT Guardian",
        paymentTitle: "Pagamento",
        summaryTitle: "Riepilogo",
        planName: "HostGPT Guardian",
        billing: "Fatturazione",
        billingType: "Mensile",
        total: "Totale",
        includes: "Include",
        features: {
          monitoring: "Monitoraggio automatico",
          alerts: "Alert ospiti insoddisfatti",
          detection: "Rilevamento in tempo reale",
          suggestions: "Suggerimenti di azione"
        },
        button: "Attiva Guardian - 9€/mese",
        processing: "Elaborazione...",
        termsText: "Cliccando su \"Attiva Guardian\" accetti i nostri",
        termsLink: "Termini",
        privacyLink: "Privacy",
        successMessage: "Guardian attivato! Reindirizzamento alla dashboard...",
        errorMessages: {
          missingToken: "Token mancante. Accedi nuovamente per continuare.",
          checkoutError: "Errore durante il reindirizzamento al pagamento",
          paymentError: "Errore durante il pagamento",
          cardNotFound: "Elemento carta non trovato",
          paymentNotCompleted: "Pagamento non completato"
        },
        statusMessages: {
          preparing: "Preparazione...",
          wait: "Attendi qualche secondo.",
          cancelled: "Pagamento annullato",
          tryAgain: "Riprova",
          completed: "Completato!",
          goToDashboard: "Vai alla Dashboard Guardian"
        }
      }
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
        activeChatbots: "Attivi",
        totalGuests: "Ospiti Totali",
        totalHistorical: "Totale storico",
        allChatbots: "Tutti i chatbot",
        alwaysOnline: "Sempre online"
      },
      quickActions: {
        createChatbot: "Crea Chatbot",
        viewAnalytics: "Visualizza Analisi",
        manageSettings: "Gestisci Impostazioni",
        getSupport: "Ottieni Supporto"
      },
      freeTrial: {
        title: "Periodo di prova gratuito attivo",
        description: "Hai {messages} messaggi rimanenti su {limit} • Scade il {date}",
        activateButton: "Attiva Abbonamento"
      },
      chatbots: {
        title: "I Tuoi Chatbot",
        seeAll: "Vedi tutti →",
        noChatbots: "Non hai ancora creato nessun chatbot",
        createFirst: "Crea il tuo primo chatbot"
      },
      moreStructures: {
        title: "Hai più strutture?",
        description: "Ogni account può avere un solo chatbot. Se ti servono più chatbot perché gestisci più strutture, contattami al 3391797616.",
        whatsappButton: "Scrivimi su WhatsApp"
      },
      qrModal: {
        title: "QR Code Chatbot",
        description: "Scansiona questo QR code per accedere al chatbot",
        copyButton: "Copia",
        downloadButton: "Scarica QR",
        closeButton: "Chiudi"
      },
      status: {
        hostgptActive: "HostGPT Attivo",
        hostgptCancelling: "HostGPT In Annullamento",
        hostgptCancelled: "HostGPT Annullato",
        hostgptFreeTrial: "HostGPT Prova Gratuita",
        guardianActive: "Guardian Attivo",
        guardianCancelling: "Guardian In Annullamento",
        guardianInactive: "Guardian Inattivo"
      }
    },
    chatbots: {
      title: "I Miei Chatbot",
      delete: "Elimina",
      name: "Nome",
      description: "Descrizione",
      status: "Stato",
      messages: "Messaggi",
      guests: "Ospiti",
      lastActivity: "Ultima Attività",
      actions: "Azioni",
      noChatbots: "Non hai ancora creato nessun chatbot",
      createFirst: "Crea il tuo primo chatbot",
      conversations: "conversazioni",
      active: "Attivo",
      guest: "Ospite",
      performance: {
        title: "Andamento Ultimi 30gg",
        conversations: "Conversazioni",
        messages: "Messaggi",
        dailyDetail: "Dettaglio giornaliero"
      },
      preview: {
        title: "Anteprima & Azioni",
        chatUrl: "URL chat",
        messages: "Messaggi",
        conversations: "Conversazioni",
        averagePerChat: "Media per chat"
      },
      alert: {
        critical: "🚨 ALERT CRITICO",
        dissatisfiedGuest: "Ospite insoddisfatto rilevato nella conversazione",
        negativeReviewRisk: "Rischio recensione negativa",
        sentiment: "Sentiment"
      },
      create: {
        title: "Crea Nuovo Chatbot",
        subtitle: "Configura il tuo chatbot per la tua proprietà",
        steps: {
          basic: "Informazioni Base",
          property: "Proprietà",
          amenities: "Servizi",
          location: "Posizione",
          services: "Servizi Locali",
          final: "Finalizzazione"
        },
        form: {
          name: "Nome Chatbot",
          propertyName: "Nome Proprietà",
          propertyType: "Tipo di Proprietà",
          propertyAddress: "Indirizzo",
          propertyCity: "Città",
          propertyDescription: "Descrizione Proprietà",
          checkInTime: "Orario Check-in",
          checkOutTime: "Orario Check-out",
          houseRules: "Regole della Casa",
          amenities: "Servizi Disponibili",
          neighborhoodDescription: "Descrizione Quartiere",
          transportationInfo: "Informazioni Trasporti",
          shoppingInfo: "Informazioni Shopping",
          parkingInfo: "Informazioni Parcheggio",
          specialInstructions: "Istruzioni Speciali",
          welcomeMessage: "Messaggio di Benvenuto",
          nearbyAttractions: "Attrazioni Vicine",
          restaurantsBars: "Ristoranti e Bar",
          emergencyContacts: "Contatti di Emergenza",
          wifiInfo: "Informazioni WiFi",
          faq: "Domande Frequenti",
          addAttraction: "Aggiungi Attrazione",
          addRestaurant: "Aggiungi Ristorante",
          addContact: "Aggiungi Contatto",
          addFaq: "Aggiungi FAQ",
          customFaq: "FAQ Personalizzate",
          attractionName: "Nome Attrazione",
          attractionDistance: "Distanza",
          attractionDescription: "Descrizione",
          restaurantName: "Nome Ristorante",
          restaurantType: "Tipo",
          restaurantDistance: "Distanza",
          contactName: "Nome Contatto",
          contactNumber: "Numero",
          contactType: "Tipo",
          wifiNetwork: "Nome Rete",
          wifiPassword: "Password",
          question: "Domanda",
          answer: "Risposta",
          remove: "Rimuovi"
        },
        amenities: {
          wifi: "WiFi",
          airConditioning: "Aria Condizionata",
          heating: "Riscaldamento",
          tv: "TV",
          netflix: "Netflix",
          kitchen: "Cucina",
          dishwasher: "Lavastoviglie",
          washingMachine: "Lavatrice",
          dryer: "Asciugatrice",
          iron: "Ferro da stiro",
          parking: "Parcheggio",
          pool: "Piscina",
          gym: "Palestra",
          balcony: "Balcone",
          garden: "Giardino",
          elevator: "Ascensore",
          safe: "Cassaforte",
          alarm: "Allarme",
          petsAllowed: "Animali ammessi",
          smokingAllowed: "Fumatori ammessi"
        },
        buttons: {
          next: "Avanti",
          previous: "Indietro",
          create: "Crea Chatbot",
          save: "Salva",
          cancel: "Annulla",
          add: "Aggiungi"
        },
        messages: {
          creating: "Creazione chatbot in corso...",
          created: "Chatbot creato con successo!",
          error: "Errore nella creazione del chatbot",
          saved: "Chatbot salvato con successo!",
          saving: "Salvataggio in corso..."
        }
      },
      edit: {
        title: "Modifica Chatbot",
        subtitle: "Aggiorna le informazioni del tuo chatbot",
        form: {
          name: "Nome Chatbot",
          propertyName: "Nome Proprietà",
          propertyType: "Tipo di Proprietà",
          selectType: "Seleziona tipo",
          apartment: "Appartamento",
          villa: "Villa",
          house: "Casa",
          room: "Stanza",
          loft: "Loft",
          propertyAddress: "Indirizzo",
          propertyCity: "Città",
          propertyDescription: "Descrizione Proprietà",
          checkInTime: "Orario Check-in",
          checkOutTime: "Orario Check-out",
          houseRules: "Regole della Casa",
          amenities: "Servizi Disponibili",
          neighborhoodDescription: "Descrizione Quartiere",
          transportationInfo: "Informazioni Trasporti",
          shoppingInfo: "Informazioni Shopping",
          parkingInfo: "Informazioni Parcheggio",
          specialInstructions: "Istruzioni Speciali",
          welcomeMessage: "Messaggio di Benvenuto",
          nearbyAttractions: "Attrazioni Vicine",
          restaurantsBars: "Ristoranti e Bar",
          emergencyContacts: "Contatti di Emergenza",
          wifiInfo: "Informazioni WiFi",
          faq: "Domande Frequenti",
          addAttraction: "Aggiungi Attrazione",
          addRestaurant: "Aggiungi Ristorante",
          addContact: "Aggiungi Contatto",
          addFaq: "Aggiungi FAQ",
          customFaq: "FAQ Personalizzate",
          attractionName: "Nome Attrazione",
          attractionDistance: "Distanza",
          attractionDescription: "Descrizione",
          restaurantName: "Nome Ristorante",
          restaurantType: "Tipo",
          restaurantDistance: "Distanza",
          contactName: "Nome Contatto",
          contactNumber: "Numero",
          contactType: "Tipo",
          wifiNetwork: "Nome Rete",
          wifiPassword: "Password",
          question: "Domanda",
          answer: "Risposta",
          remove: "Rimuovi",
          selectServices: "Seleziona Servizi",
          manageAttractions: "Gestisci Attrazioni",
          manageRestaurants: "Gestisci Ristoranti e Bar",
          manageFaq: "Gestisci FAQ",
          host: "Host",
          emergency: "Emergenza",
          maintenance: "Manutenzione",
          cleaning: "Pulizie",
          emergencyContactsTitle: "Contatti di Emergenza",
          addContactTitle: "Aggiungi Contatto",
          manageFaqTitle: "Gestisci FAQ",
          welcomeMessageTitle: "Messaggio di Benvenuto",
          initialMessage: "Messaggio Iniziale",
          welcomeMessagePlaceholder: "Messaggio di benvenuto che apparirà quando un ospite inizia la chat..."
        },
        amenities: {
          wifi: "WiFi",
          airConditioning: "Aria Condizionata",
          heating: "Riscaldamento",
          tv: "TV",
          netflix: "Netflix",
          kitchen: "Cucina",
          dishwasher: "Lavastoviglie",
          washingMachine: "Lavatrice",
          dryer: "Asciugatrice",
          iron: "Ferro da stiro",
          parking: "Parcheggio",
          pool: "Piscina",
          gym: "Palestra",
          balcony: "Balcone",
          garden: "Giardino",
          elevator: "Ascensore",
          safe: "Cassaforte",
          alarm: "Allarme",
          petsAllowed: "Animali ammessi",
          smokingAllowed: "Fumatori ammessi"
        },
        buttons: {
          save: "Salva Modifiche",
          cancel: "Annulla",
          add: "Aggiungi"
        },
        messages: {
          saving: "Salvataggio modifiche...",
          saved: "Modifiche salvate con successo!",
          error: "Errore nel salvataggio delle modifiche"
        }
      }
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
      redirecting: "Reindirizzamento...",
      reactivate: "Riattiva Guardian",
      activateWithPrice: "Attiva Guardian - 9€/mese",
      stats: {
        totalGuests: "Ospiti Totali",
        totalGuestsShort: "Ospiti",
        monitored: "Monitorati",
        highRiskGuests: "Ospiti a Rischio",
        highRiskGuestsShort: "A Rischio",
        detected: "Rilevati",
        resolvedIssues: "Problemi Risolti",
        resolvedIssuesShort: "Risolti",
        managed: "Gestiti",
        avgSatisfaction: "Soddisfazione Media",
        avgSatisfactionShort: "Soddisf.",
        score: "Punteggio",
        negativeReviewsPrevented: "Recensioni Negative Evitate"
      },
      alerts: {
        title: "Alert Attivi",
        activeAlerts: "Alert Attivi",
        noAlerts: "Nessun alert attivo",
        allUnderControl: "Nessun alert attivo. Tutto sotto controllo! 🎉",
        resolve: "Risolvi",
        guest: "Ospite",
        created: "Creato",
        fullConversation: "Conversazione Completa",
        resolutionSuggestion: "Suggerimento per la Risoluzione:",
        severity: {
          critical: "Critico",
          high: "Alto",
          medium: "Medio",
          low: "Basso"
        }
      },
      subscription: {
        title: "Abbonamento Guardian",
        status: "Stato",
        active: "Attivo",
        inactive: "Inattivo",
        cancelling: "In Annullamento",
        cancel: "Cancella Abbonamento",
        reactivate: "Riattiva Abbonamento",
        reactivateFree: "Riattiva Abbonamento (Gratis)",
        endDate: "Fine abbonamento",
        nextRenewal: "Prossimo rinnovo",
        cancelSection: {
          title: "Annulla Abbonamento Guardian",
          description: "Annullando l'abbonamento il servizio verrà disattivato, ma tutti i tuoi dati rimarranno nel database.",
          button: "Annulla Abbonamento",
          cancelling: "Annullamento..."
        },
        cancellingSection: {
          title: "Abbonamento Guardian in Fase di Annullamento",
          description: "Il tuo abbonamento è in fase di annullamento e rimarrà attivo fino alla fine del periodo corrente. Puoi riattivarlo in qualsiasi momento.",
          button: "Riattiva Abbonamento (Gratis)",
          reactivating: "Riattivazione..."
        },
        cancelModal: {
          title: "Conferma Annullamento Guardian",
          message: "Sei sicuro di voler annullare l'abbonamento Guardian? Il servizio rimarrà attivo fino alla fine del periodo corrente, ma non riceverai più alert per le conversazioni problematiche.",
          confirm: "Conferma Annullamento",
          cancel: "Annulla",
          cancelling: "Annullamento..."
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
        },
        phoneCall: "📞 Host chiama l'ospite",
        problemSolved: "🎉 Problema risolto!",
        negativeReviewAvoided: "Recensione negativa evitata"
      },
      success: {
        subscriptionActivated: "🎉 Abbonamento Guardian attivato con successo!",
        alertResolved: "Alert risolto con successo!",
        subscriptionCancelled: "Abbonamento Guardian cancellato con successo",
        subscriptionReactivated: "Abbonamento Guardian riattivato con successo"
      },
      errors: {
        subscriptionError: "Errore durante la sottoscrizione",
        alertResolutionError: "Errore durante la risoluzione dell'alert",
        cancellationError: "Errore durante la cancellazione",
        reactivationError: "Errore durante la riattivazione"
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
      theme: "Tema",
      personalInfo: "Informazioni Personali",
      fullName: "Nome Completo",
      email: "Email",
      phone: "Telefono",
      company: "Azienda",
      updateProfile: "Aggiorna Profilo",
      changePassword: "Cambia Password",
      currentPassword: "Password Attuale",
      newPassword: "Nuova Password",
      confirmPassword: "Conferma Password",
      updatePassword: "Aggiorna Password",
      subscriptionStatus: "Stato Abbonamento",
      plan: "Piano",
      nextBilling: "Prossimo Addebito",
      cancelSubscription: "Cancella Abbonamento",
      reactivateSubscription: "Riattiva Abbonamento",
      notificationSettings: "Impostazioni Notifiche",
      emailNotifications: "Notifiche Email",
      smsNotifications: "Notifiche SMS",
      pushNotifications: "Notifiche Push",
      privacySettings: "Impostazioni Privacy",
      dataProcessing: "Elaborazione Dati",
      marketingEmails: "Email Marketing",
      analytics: "Analytics",
      deleteAccount: "Elimina Account",
      deleteAccountWarning: "Questa azione non può essere annullata",
      deleteAccountConfirm: "Conferma Eliminazione",
      cancelSubscriptionTitle: "Conferma Annullamento",
      cancelSubscriptionMessage: "Sei sicuro di voler annullare l'abbonamento? Il servizio verrà disattivato ma tutti i tuoi dati (chatbot, conversazioni, messaggi) rimarranno nel database.",
      confirmCancellation: "Conferma Annullamento",
      cancelling: "Annullamento..."
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
      title: "24/7 Assistant for Your Guests",
      titlePrefix: "Save precious hours of time with",
      subtitle: "Automatically respond completely and immediately to guest requests 24/7.",
      subtitleHighlight: "Less messages for you, more satisfaction for them.",
      freeTrialButton: "🎉 14 Days Free",
      registerButton: "Sign Up to Start",
      demoButton: "TRY DEMO"
    },
    demo: {
      title: "Casa Bella Vista Bot",
      assistant: "Virtual Assistant",
      suggestedMessages: [
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
          title: "Stop Repetitive Questions",
          description: "No more wasting time answering the same questions about check-in, WiFi and local attractions",
          features: ["Automatic responses 24/7", "Zero interruptions", "Time recovered"]
        },
        {
          title: "Happier Guests",
          description: "Immediate and complete responses increase satisfaction and positive reviews",
          features: ["Instant responses", "Complete information", "Better reviews"]
        },
        {
          title: "Setup in 5 Minutes",
          description: "Activate your virtual assistant in minutes, without technical skills",
          features: ["Guided configuration", "No programming", "Ready immediately"]
        },
        {
          title: "Costs Less than Coffee",
          description: "Invest less than what you spend on coffee per day and save hours of work",
          features: ["Affordable price", "Immediate ROI", "Guaranteed savings"]
        }
      ]
    },
    howItWorks: {
      title: "How It Works",
      subtitle: "Every day you lose <span class='text-pink-600 font-bold'>precious hours</span> answering the same questions from your guests.<br><br>With <span class='text-pink-600 font-bold'>HostGPT</span> you save all that time for <span class='text-pink-600 font-bold'>less than a coffee a day</span>.<br><br>Your virtual assistant responds <span class='text-pink-600 font-bold'>automatically 24/7</span>, while you focus on what really matters.",
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
          name: "Monthly",
          price: "€29",
          period: "/month",
          features: [
            "1 Custom chatbot",
            "1000 messages/month",
            "24/7 Support"
          ],
          freeTrialButton: "🎉 14 Days Free",
          ctaButton: "Start Now"
        },
        {
          name: "Annual",
          price: "€299",
          period: "/year",
          features: [
            "1 Custom chatbot",
            "1000 messages/month",
            "24/7 Support"
          ],
          freeTrialButton: "🎉 14 Days Free",
          ctaButton: "Start Now",
          priceId: "price_1S3dNUClR9LCJ8qEX2DEK4SE"
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
      copied: "Copied!",
      seeAll: "See all",
      share: "Share",
      download: "Download",
      upload: "Upload",
      refresh: "Refresh",
      redirecting: "Redirecting...",
      settings: "Settings",
      security: "Security",
      profile: "Profile",
      logout: "Logout",
      dashboard: "Dashboard",
      notifications: "Notifications",
      help: "Help",
      support: "Support",
      about: "About",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
      done: "Done"
    },
    
    // Services
    services: {
      wifi: "WiFi",
      airConditioning: "Air Conditioning",
      heating: "Heating",
      tv: "TV",
      netflix: "Netflix",
      kitchen: "Kitchen",
      dishwasher: "Dishwasher",
      washingMachine: "Washing Machine",
      dryer: "Dryer",
      iron: "Iron",
      parking: "Parking",
      pool: "Pool",
      gym: "Gym",
      balcony: "Balcony",
      garden: "Garden",
      elevator: "Elevator",
      safe: "Safe",
      alarm: "Alarm",
      petsAllowed: "Pets Allowed",
      smokingAllowed: "Smoking Allowed"
    },
    
    // Conversations translations
    conversations: {
      title: "Conversations",
      chatbot: "Chatbot",
      searchGuest: "Search by guest",
      searchPlaceholder: "E.g. Marco",
      loading: "Loading...",
      selectChatbot: "Select a chatbot to view conversations",
      noConversations: "No conversations found",
      loadingConversations: "Loading conversations...",
      selectOption: "Select...",
      conversations: "conversations",
      messages: "messages",
      guest: "Guest",
      startedAt: "Started on",
      messageCount: "Messages",
      lastMessage: "Last message",
      viewConversation: "View conversation",
      noMessages: "No messages",
      emptyState: "No conversations available"
    },
    
    // Checkout translations
    checkout: {
      title: "Checkout",
      loading: "Loading...",
      processing: "Processing payment...",
      success: "Payment completed successfully!",
      error: "Error during payment",
      monthly: {
        title: "Complete Subscription",
        subtitle: "Start creating intelligent chatbots right away",
        headerTitle: "HostGPT",
        paymentTitle: "Payment",
        summaryTitle: "Summary",
        planName: "HostGPT Pro",
        billing: "Billing",
        billingType: "Monthly",
        total: "Total",
        includes: "Includes",
        features: {
          messages: "1000 messages/month",
          chatbots: "Unlimited chatbots",
          responses: "Instant responses",
          support: "Priority support"
        },
        button: "Pay €29/month",
        processing: "Processing...",
        referralCode: "Referral Code (optional)",
        referralCodeOptional: "Referral Code (optional)",
        referralCodePlaceholder: "Enter referral code",
        referralCodeHelp: "Enter a valid referral code to receive bonus messages per month",
        termsText: "By clicking \"Pay\" you accept our",
        termsLink: "Terms",
        privacyLink: "Privacy",
        successMessage: "Subscription activated! Redirecting to dashboard...",
        successMessageWithBonus: "Subscription activated with bonus messages! Redirecting to dashboard...",
        errorMessages: {
          missingToken: "Missing token. Please log in again to continue.",
          checkoutError: "Error during payment redirection",
          paymentError: "Error during payment",
          cardNotFound: "Card element not found",
          paymentNotCompleted: "Payment not completed"
        },
        statusMessages: {
          preparing: "Preparing...",
          wait: "Please wait a moment.",
          cancelled: "Payment cancelled",
          tryAgain: "Try again",
          completed: "Completed!",
          goToDashboard: "Go to Dashboard"
        }
      },
      combined: {
        title: "Complete Package",
        subtitle: "HostGPT Pro + Guardian for maximum efficiency",
        headerTitle: "HostGPT Pro + Guardian",
        paymentTitle: "Payment",
        summaryTitle: "Summary",
        hostgptPro: "HostGPT Pro",
        guardian: "Guardian",
        billing: "Billing",
        billingType: "Monthly",
        total: "Total",
        includes: "Includes",
        features: {
          messages: "1000 messages/month",
          chatbots: "Unlimited chatbots",
          monitoring: "Automatic monitoring",
          alerts: "Dissatisfied guest alerts"
        },
        button: "Activate Complete Package - €38/month",
        processing: "Processing...",
        referralCode: "Referral Code (optional)",
        referralCodeOptional: "Referral Code (optional)",
        referralCodePlaceholder: "Enter referral code",
        referralCodeHelp: "Enter a valid referral code to receive bonus messages per month",
        termsText: "By clicking \"Activate Complete Package\" you accept our",
        termsLink: "Terms",
        privacyLink: "Privacy",
        successMessage: "Complete package activated! Redirecting to dashboard...",
        successMessageWithBonus: "Complete package activated with bonus messages! Redirecting to dashboard...",
        errorMessages: {
          missingToken: "Missing token. Please log in again to continue.",
          checkoutError: "Error during payment redirection",
          paymentError: "Error during payment",
          cardNotFound: "Card element not found",
          paymentNotCompleted: "Payment not completed"
        },
        statusMessages: {
          preparing: "Preparing...",
          wait: "Please wait a moment.",
          cancelled: "Payment cancelled",
          tryAgain: "Try again",
          completed: "Completed!",
          goToDashboard: "Go to Dashboard"
        }
      },
      guardian: {
        title: "Activate Guardian",
        subtitle: "Protect your guests' satisfaction",
        headerTitle: "HostGPT Guardian",
        paymentTitle: "Payment",
        summaryTitle: "Summary",
        planName: "HostGPT Guardian",
        billing: "Billing",
        billingType: "Monthly",
        total: "Total",
        includes: "Includes",
        features: {
          monitoring: "Automatic monitoring",
          alerts: "Dissatisfied guest alerts",
          detection: "Real-time detection",
          suggestions: "Action suggestions"
        },
        button: "Activate Guardian - €9/month",
        processing: "Processing...",
        termsText: "By clicking \"Activate Guardian\" you accept our",
        termsLink: "Terms",
        privacyLink: "Privacy",
        successMessage: "Guardian activated! Redirecting to dashboard...",
        errorMessages: {
          missingToken: "Missing token. Please log in again to continue.",
          checkoutError: "Error during payment redirection",
          paymentError: "Error during payment",
          cardNotFound: "Card element not found",
          paymentNotCompleted: "Payment not completed"
        },
        statusMessages: {
          preparing: "Preparing...",
          wait: "Please wait a moment.",
          cancelled: "Payment cancelled",
          tryAgain: "Try again",
          completed: "Completed!",
          goToDashboard: "Go to Guardian Dashboard"
        }
      }
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
        activeChatbots: "Active",
        totalGuests: "Total Guests",
        totalHistorical: "Total historical",
        allChatbots: "All chatbots",
        alwaysOnline: "Always online"
      },
      quickActions: {
        createChatbot: "Create Chatbot",
        viewAnalytics: "View Analytics",
        manageSettings: "Manage Settings",
        getSupport: "Get Support"
      },
      freeTrial: {
        title: "Free trial period active",
        description: "You have {messages} messages remaining out of {limit} • Expires on {date}",
        activateButton: "Activate Subscription"
      },
      chatbots: {
        title: "Your Chatbots",
        seeAll: "See all →",
        noChatbots: "You haven't created any chatbots yet",
        createFirst: "Create your first chatbot"
      },
      moreStructures: {
        title: "Have more properties?",
        description: "Each account can have only one chatbot. If you need more chatbots because you manage multiple properties, contact me at 3391797616.",
        whatsappButton: "Write me on WhatsApp"
      },
      qrModal: {
        title: "Chatbot QR Code",
        description: "Scan this QR code to access the chatbot",
        copyButton: "Copy",
        downloadButton: "Download QR",
        closeButton: "Close"
      },
      status: {
        hostgptActive: "HostGPT Active",
        hostgptCancelling: "HostGPT Cancelling",
        hostgptCancelled: "HostGPT Cancelled",
        hostgptFreeTrial: "HostGPT Free Trial",
        guardianActive: "Guardian Active",
        guardianCancelling: "Guardian Cancelling",
        guardianInactive: "Guardian Inactive"
      }
    },
    chatbots: {
      title: "My Chatbots",
      delete: "Delete",
      name: "Name",
      description: "Description",
      status: "Status",
      messages: "Messages",
      guests: "Guests",
      lastActivity: "Last Activity",
      actions: "Actions",
      noChatbots: "You haven't created any chatbots yet",
      createFirst: "Create your first chatbot",
      conversations: "conversations",
      active: "Active",
      guest: "Guest",
      performance: {
        title: "Performance Last 30 Days",
        conversations: "Conversations",
        messages: "Messages",
        dailyDetail: "Daily detail"
      },
      preview: {
        title: "Preview & Actions",
        chatUrl: "Chat URL",
        messages: "Messages",
        conversations: "Conversations",
        averagePerChat: "Average per chat"
      },
      alert: {
        critical: "🚨 CRITICAL ALERT",
        dissatisfiedGuest: "Dissatisfied guest detected in conversation",
        negativeReviewRisk: "Negative review risk",
        sentiment: "Sentiment"
      },
      create: {
        title: "Create New Chatbot",
        subtitle: "Configure your chatbot for your property",
        steps: {
          basic: "Basic Information",
          property: "Property",
          amenities: "Amenities",
          location: "Location",
          services: "Local Services",
          final: "Finalization"
        },
        form: {
          name: "Chatbot Name",
          propertyName: "Property Name",
          propertyType: "Property Type",
          propertyAddress: "Address",
          propertyCity: "City",
          propertyDescription: "Property Description",
          checkInTime: "Check-in Time",
          checkOutTime: "Check-out Time",
          houseRules: "House Rules",
          amenities: "Available Amenities",
          neighborhoodDescription: "Neighborhood Description",
          transportationInfo: "Transportation Information",
          shoppingInfo: "Shopping Information",
          parkingInfo: "Parking Information",
          specialInstructions: "Special Instructions",
          welcomeMessage: "Welcome Message",
          nearbyAttractions: "Nearby Attractions",
          restaurantsBars: "Restaurants and Bars",
          emergencyContacts: "Emergency Contacts",
          wifiInfo: "WiFi Information",
          faq: "Frequently Asked Questions",
          addAttraction: "Add Attraction",
          addRestaurant: "Add Restaurant",
          addContact: "Add Contact",
          addFaq: "Add FAQ",
          customFaq: "Custom FAQ",
          attractionName: "Attraction Name",
          attractionDistance: "Distance",
          attractionDescription: "Description",
          restaurantName: "Restaurant Name",
          restaurantType: "Type",
          restaurantDistance: "Distance",
          contactName: "Contact Name",
          contactNumber: "Number",
          contactType: "Type",
          wifiNetwork: "Network Name",
          wifiPassword: "Password",
          question: "Question",
          answer: "Answer",
          remove: "Remove"
        },
        amenities: {
          wifi: "WiFi",
          airConditioning: "Air Conditioning",
          heating: "Heating",
          tv: "TV",
          netflix: "Netflix",
          kitchen: "Kitchen",
          dishwasher: "Dishwasher",
          washingMachine: "Washing Machine",
          dryer: "Dryer",
          iron: "Iron",
          parking: "Parking",
          pool: "Pool",
          gym: "Gym",
          balcony: "Balcony",
          garden: "Garden",
          elevator: "Elevator",
          safe: "Safe",
          alarm: "Alarm",
          petsAllowed: "Pets Allowed",
          smokingAllowed: "Smoking Allowed"
        },
        buttons: {
          next: "Next",
          previous: "Previous",
          create: "Create Chatbot",
          save: "Save",
          cancel: "Cancel",
          add: "Add"
        },
        messages: {
          creating: "Creating chatbot...",
          created: "Chatbot created successfully!",
          error: "Error creating chatbot",
          saved: "Chatbot saved successfully!",
          saving: "Saving..."
        }
      },
      edit: {
        title: "Edit Chatbot",
        subtitle: "Update your chatbot information",
        form: {
          name: "Chatbot Name",
          propertyName: "Property Name",
          propertyType: "Property Type",
          selectType: "Select type",
          apartment: "Apartment",
          villa: "Villa",
          house: "House",
          room: "Room",
          loft: "Loft",
          propertyAddress: "Address",
          propertyCity: "City",
          propertyDescription: "Property Description",
          checkInTime: "Check-in Time",
          checkOutTime: "Check-out Time",
          houseRules: "House Rules",
          amenities: "Available Amenities",
          neighborhoodDescription: "Neighborhood Description",
          transportationInfo: "Transportation Information",
          shoppingInfo: "Shopping Information",
          parkingInfo: "Parking Information",
          specialInstructions: "Special Instructions",
          welcomeMessage: "Welcome Message",
          nearbyAttractions: "Nearby Attractions",
          restaurantsBars: "Restaurants and Bars",
          emergencyContacts: "Emergency Contacts",
          wifiInfo: "WiFi Information",
          faq: "Frequently Asked Questions",
          addAttraction: "Add Attraction",
          addRestaurant: "Add Restaurant",
          addContact: "Add Contact",
          addFaq: "Add FAQ",
          customFaq: "Custom FAQ",
          attractionName: "Attraction Name",
          attractionDistance: "Distance",
          attractionDescription: "Description",
          restaurantName: "Restaurant Name",
          restaurantType: "Type",
          restaurantDistance: "Distance",
          contactName: "Contact Name",
          contactNumber: "Number",
          contactType: "Type",
          wifiNetwork: "Network Name",
          wifiPassword: "Password",
          question: "Question",
          answer: "Answer",
          remove: "Remove",
          selectServices: "Select Services",
          manageAttractions: "Manage Attractions",
          manageRestaurants: "Manage Restaurants and Bars",
          manageFaq: "Manage FAQ",
          host: "Host",
          emergency: "Emergency",
          maintenance: "Maintenance",
          cleaning: "Cleaning",
          emergencyContactsTitle: "Emergency Contacts",
          addContactTitle: "Add Contact",
          manageFaqTitle: "Manage FAQ",
          welcomeMessageTitle: "Welcome Message",
          initialMessage: "Initial Message",
          welcomeMessagePlaceholder: "Welcome message that will appear when a guest starts the chat..."
        },
        amenities: {
          wifi: "WiFi",
          airConditioning: "Air Conditioning",
          heating: "Heating",
          tv: "TV",
          netflix: "Netflix",
          kitchen: "Kitchen",
          dishwasher: "Dishwasher",
          washingMachine: "Washing Machine",
          dryer: "Dryer",
          iron: "Iron",
          parking: "Parking",
          pool: "Pool",
          gym: "Gym",
          balcony: "Balcony",
          garden: "Garden",
          elevator: "Elevator",
          safe: "Safe",
          alarm: "Alarm",
          petsAllowed: "Pets Allowed",
          smokingAllowed: "Smoking Allowed"
        },
        buttons: {
          save: "Save Changes",
          cancel: "Cancel",
          add: "Add"
        },
        messages: {
          saving: "Saving changes...",
          saved: "Changes saved successfully!",
          error: "Error saving changes"
        }
      }
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
      redirecting: "Redirecting...",
      reactivate: "Reactivate Guardian",
      activateWithPrice: "Activate Guardian - €9/month",
      stats: {
        totalGuests: "Total Guests",
        totalGuestsShort: "Guests",
        monitored: "Monitored",
        highRiskGuests: "High Risk Guests",
        highRiskGuestsShort: "At Risk",
        detected: "Detected",
        resolvedIssues: "Resolved Issues",
        resolvedIssuesShort: "Resolved",
        managed: "Managed",
        avgSatisfaction: "Average Satisfaction",
        avgSatisfactionShort: "Satisf.",
        score: "Score",
        negativeReviewsPrevented: "Negative Reviews Prevented"
      },
      alerts: {
        title: "Active Alerts",
        activeAlerts: "Active Alerts",
        noAlerts: "No active alerts",
        allUnderControl: "No active alerts. Everything under control! 🎉",
        resolve: "Resolve",
        guest: "Guest",
        created: "Created",
        fullConversation: "Full Conversation",
        resolutionSuggestion: "Resolution Suggestion:",
        severity: {
          critical: "Critical",
          high: "High",
          medium: "Medium",
          low: "Low"
        }
      },
      subscription: {
        title: "Guardian Subscription",
        status: "Status",
        active: "Active",
        inactive: "Inactive",
        cancelling: "Cancelling",
        cancel: "Cancel Subscription",
        reactivate: "Reactivate Subscription",
        reactivateFree: "Reactivate Subscription (Free)",
        endDate: "End date",
        nextRenewal: "Next renewal",
        cancelSection: {
          title: "Cancel Guardian Subscription",
          description: "By cancelling the subscription the service will be deactivated, but all your data will remain in the database.",
          button: "Cancel Subscription",
          cancelling: "Cancelling..."
        },
        cancellingSection: {
          title: "Guardian Subscription Being Cancelled",
          description: "Your subscription is being cancelled and will remain active until the end of the current period. You can reactivate it at any time.",
          button: "Reactivate Subscription (Free)",
          reactivating: "Reactivating..."
        },
        cancelModal: {
          title: "Confirm Guardian Cancellation",
          message: "Are you sure you want to cancel your Guardian subscription? The service will remain active until the end of the current period, but you will no longer receive alerts for problematic conversations.",
          confirm: "Confirm Cancellation",
          cancel: "Cancel",
          cancelling: "Cancelling..."
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
        },
        phoneCall: "📞 Host calls guest",
        problemSolved: "🎉 Problem solved!",
        negativeReviewAvoided: "Negative review avoided"
      },
      success: {
        subscriptionActivated: "🎉 Guardian subscription activated successfully!",
        alertResolved: "Alert resolved successfully!",
        subscriptionCancelled: "Guardian subscription cancelled successfully",
        subscriptionReactivated: "Guardian subscription reactivated successfully"
      },
      errors: {
        subscriptionError: "Error during subscription",
        alertResolutionError: "Error during alert resolution",
        cancellationError: "Error during cancellation",
        reactivationError: "Error during reactivation"
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
      theme: "Theme",
      personalInfo: "Personal Information",
      fullName: "Full Name",
      email: "Email",
      phone: "Phone",
      company: "Company",
      updateProfile: "Update Profile",
      changePassword: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      updatePassword: "Update Password",
      subscriptionStatus: "Subscription Status",
      plan: "Plan",
      nextBilling: "Next Billing",
      cancelSubscription: "Cancel Subscription",
      reactivateSubscription: "Reactivate Subscription",
      notificationSettings: "Notification Settings",
      emailNotifications: "Email Notifications",
      smsNotifications: "SMS Notifications",
      pushNotifications: "Push Notifications",
      privacySettings: "Privacy Settings",
      dataProcessing: "Data Processing",
      marketingEmails: "Marketing Emails",
      analytics: "Analytics",
      deleteAccount: "Delete Account",
      deleteAccountWarning: "This action cannot be undone",
      deleteAccountConfirm: "Confirm Deletion",
      cancelSubscriptionTitle: "Confirm Cancellation",
      cancelSubscriptionMessage: "Are you sure you want to cancel your subscription? The service will be deactivated but all your data (chatbots, conversations, messages) will remain in the database.",
      confirmCancellation: "Confirm Cancellation",
      cancelling: "Cancelling..."
    }
  }
}
