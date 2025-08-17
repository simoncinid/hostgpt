'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import CookieBanner from '../components/CookieBanner'
import { 
  MessageSquare, 
  Home, 
  Globe, 
  BarChart3, 
  Clock, 
  Shield, 
  Zap,
  Check,
  ArrowRight,
  Menu,
  X,
  Star,
  Users,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Wifi,
  MapPin,
  Car,
  Utensils,
  Heart,
  Sparkles,
  Target,
  Award,
  TrendingUp,
  UserCheck,
  Settings,
  Smartphone as PhoneIcon,
  QrCode,
  Share2
} from 'lucide-react'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Messaggi demo dinamici
  const demoMessages: { role: 'user' | 'assistant'; text: string }[] = [
    { role: 'user', text: 'Ciao! A che ora è il check-in?' },
    { role: 'assistant', text: 'Ciao! Il check-in è dalle 15:00 alle 20:00. Ti invieremo il codice della cassetta di sicurezza il giorno dell\'arrivo.' },
    { role: 'user', text: 'Posso fare check-in dopo le 22?' },
    { role: 'assistant', text: 'Certo! È previsto un self check-in 24/7. Facci sapere l\'orario stimato e ti assistiamo noi.' },
    { role: 'user', text: 'Com\'è il parcheggio in zona?' },
    { role: 'assistant', text: 'C\'è parcheggio gratuito in strada nei dintorni. In alternativa, a 300m trovi il Garage Verdi a 15€/giorno.' },
    { role: 'user', text: 'Wifi e ristoranti consigliati?' },
    { role: 'assistant', text: 'Wifi fibra 200Mbps, password: CASA2024. Per cenare ti consiglio Trattoria Roma (5 min a piedi) e Osteria Bella Vista.' }
  ]
  const [demoVisible, setDemoVisible] = useState<typeof demoMessages>([])
  const [demoRunId, setDemoRunId] = useState(0)
  const demoScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDemoVisible([])
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setDemoVisible(demoMessages.slice(0, i))
      if (i >= demoMessages.length) {
        clearInterval(interval)
      }
    }, 1400)
    return () => clearInterval(interval)
  }, [demoRunId])

  useEffect(() => {
    const el = demoScrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [demoVisible])

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      bgGradient: "from-blue-500 to-blue-600",
      title: "Chatbot Personalizzato",
      description: "Crea un assistente virtuale su misura per la tua proprietà con pochi click",
      features: ["Risposte personalizzate", "Lingua italiana", "Conoscenza locale"]
    },
    {
      icon: <Clock className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      bgGradient: "from-green-500 to-green-600",
      title: "Assistenza 24/7",
      description: "I tuoi ospiti ricevono risposte immediate a qualsiasi ora del giorno e della notte",
      features: ["Disponibilità continua", "Risposte istantanee", "Nessun ritardo"]
    },
    {
      icon: <Globe className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      bgGradient: "from-purple-500 to-purple-600",
      title: "Informazioni Locali",
      description: "Fornisci consigli su ristoranti, attrazioni e servizi della zona",
      features: ["Ristoranti consigliati", "Attrazioni turistiche", "Trasporti locali"]
    },
    {
      icon: <BarChart3 className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      bgGradient: "from-orange-500 to-orange-600",
      title: "Statistiche Dettagliate",
      description: "Monitora le conversazioni e ottieni insights sui bisogni dei tuoi ospiti",
      features: ["Analisi conversazioni", "Metriche performance", "Report dettagliati"]
    },
    {
      icon: <Shield className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      bgGradient: "from-red-500 to-red-600",
      title: "Sicuro e Affidabile",
      description: "Tecnologia OpenAI all'avanguardia per risposte accurate e sicure",
      features: ["Tecnologia avanzata", "Sicurezza garantita", "Risposte accurate"]
    },
    {
      icon: <Zap className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      bgGradient: "from-yellow-500 to-yellow-600",
      title: "Setup Veloce",
      description: "Attiva il tuo chatbot in meno di 10 minuti con la nostra procedura guidata",
      features: ["Configurazione rapida", "Setup guidato", "Pronto in 10 minuti"]
    }
  ]

  const testimonials = [
    {
      name: "Marco Rossi",
      role: "Host a Roma",
      content: "HostGPT ha rivoluzionato il modo in cui gestisco gli ospiti. Risparmio ore ogni settimana!",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Laura Bianchi",
      role: "Host a Firenze",
      content: "I miei ospiti adorano avere risposte immediate. Le recensioni sono migliorate notevolmente.",
      rating: 5,
      avatar: "LB"
    },
    {
      name: "Giuseppe Verdi",
      role: "Host a Milano",
      content: "Facile da configurare e utilissimo. Non posso più farne a meno!",
      rating: 5,
      avatar: "GV"
    }
  ]

  // Stati per l'animazione flip della card pricing
  const [pricingFlipped, setPricingFlipped] = useState(false)
  const [pricingAnimationStarted, setPricingAnimationStarted] = useState(false)
  const [pricingAnimationComplete, setPricingAnimationComplete] = useState(false)
  const [pricingTriggered, setPricingTriggered] = useState(false)

  // Gestione flip della card pricing - una sola volta
  const handlePricingFlip = () => {
    if (!pricingTriggered) {
      setPricingTriggered(true)
      // Flippa la card
      setPricingFlipped(true)
      
      // Avvia animazione dopo 600ms (tempo del flip)
      setTimeout(() => {
        setPricingAnimationStarted(true)
      }, 600)
      
      // L'animazione dura 5 secondi totali (include i 3 secondi di blur finale)
      // Dopo questi 5 secondi, flip immediato
      setTimeout(() => {
        setPricingAnimationComplete(true)
        setPricingFlipped(false) // Flip immediato dopo l'animazione
      }, 5600) // 600ms flip + 5000ms animazione
    }
  }



  const howItWorksSteps = [
    {
      step: 1,
      title: "Registrati",
      description: "Crea il tuo account e scegli il piano più adatto alle tue esigenze"
    },
    {
      step: 2,
      title: "Personalizza",
      description: "Rispondi alle domande guidate per creare la knowledge base del tuo chatbot"
    },
    {
      step: 3,
      title: "Condividi",
      description: "Ricevi il QR code e il link da condividere con i tuoi ospiti"
    }
  ]

  const pricingPlans = [
    {
      name: "Abbonamento",
      price: "€29",
      period: "/mese",
      features: [
        "1 Chatbot personalizzato",
        "Conversazioni illimitate",
        "Assistenza 24/7",
        "Statistiche essenziali",
        "QR Code e link di condivisione"
      ],
      highlighted: true
    }
  ]

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  // Gestori per il swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      nextTestimonial()
    }
    if (isRightSwipe) {
      prevTestimonial()
    }
  }





  // Componente per l'animazione della chat nella sezione pricing
  const PricingChatAnimation = ({ isActive }: { isActive: boolean }) => {
    return (
      <div className="h-full flex flex-col relative">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-primary mb-2">Demo Chat Live</h3>
          <p className="text-sm text-gray-600">Vedi HostGPT in azione!</p>
        </div>
        
        <div className="flex-1 bg-gray-50 rounded-xl p-4 relative">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: isActive ? 0.2 : 0, duration: 0.5 }}
              className="flex justify-start"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm max-w-xs">
                <p className="text-sm">Ciao! A che ora è il check-in?</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ delay: isActive ? 1 : 0, duration: 0.5 }}
              className="flex justify-end"
            >
              <div className="bg-primary text-white p-2 rounded-lg shadow-sm max-w-xs">
                <p className="text-sm">Il check-in è dalle 15:00 alle 20:00. Ti invio il codice!</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: isActive ? 1.8 : 0, duration: 0.5 }}
              className="flex justify-start"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm max-w-xs">
                <p className="text-sm">Perfetto! Grazie mille! 🙏</p>
              </div>
            </motion.div>
          </div>
          
          {/* Effetto blur che appare alla fine - dura 3 secondi */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isActive ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: isActive ? 2 : 0, duration: 0.8 }}
            className="absolute inset-x-0 bottom-0 top-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ delay: isActive ? 2.2 : 0, duration: 0.6 }}
              className="text-center"
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-lg font-bold text-green-600 mb-1">
                Più bella di così!
              </div>
              <p className="text-sm text-gray-600">
                Host rilassato, ospite felice
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Fix per mobile: rimuovo padding/margin problematici */}
      <nav className="fixed top-4 left-0 right-0 z-50 safe-top">
        <div className="px-4">
          <div className="flex justify-between items-center py-3 px-4 bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg rounded-2xl mx-2">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-dark">HostGPT</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-primary transition">
                Funzionalità
              </Link>
              <Link href="#demo" className="text-gray-600 hover:text-primary transition">
                Demo
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-primary transition">
                Come Funziona
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-primary transition">
                Prezzi
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-primary transition">
                Testimonianze
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-primary transition">
                Accedi
              </Link>
              <Link href="/register" className="btn-primary">
                Registrati
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 px-4"
          >
            <div className="px-4 py-4 space-y-4 bg-white/70 backdrop-blur-lg border border-white/30 shadow-lg rounded-2xl mx-2">
              <Link href="#features" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Funzionalità</Link>
              <Link href="#demo" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Demo</Link>
              <Link href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Come Funziona</Link>
              <Link href="#pricing" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Prezzi</Link>
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Accedi</Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)} className="btn-primary block text-center">
                Registrati
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-36 pb-16 md:pb-20 px-4">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-dark mb-6">
              Risparmia Tempo con <span className="text-gradient">HostGPT</span><br />
              L'assistente H24 per i tuoi ospiti
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Rispondi automaticamente, in modo completo e immediato, alle richieste dei guest 24/7. 
              Meno messaggi per te, più soddisfazione per loro.
            </p>
                         <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Link href="/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center">
                 Registrati per iniziare
                 <ArrowRight className="ml-2 w-5 h-5" />
               </Link>
               <Link href="#features" className="btn-outline text-lg px-8 py-4">
                 Scopri Funzionalità
               </Link>
             </div>
          </motion.div>

          {/* Hero Image/Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8">
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="ml-3 font-semibold">Casa Bella Vista Bot</span>
                </div>
                <div
                  ref={demoScrollRef}
                  className="space-y-4 h-64 overflow-y-auto pr-2 scrollbar-left"
                >
                  {demoVisible.map((m, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}
                    >
                      {m.text}
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button onClick={() => setDemoRunId((v) => v + 1)} className="btn-outline px-6 py-3">Replica demo</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Migliorata con più elementi e colori */}
      <section id="features" className="section-padding bg-gray-50">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">
              Tutto Quello che Ti Serve
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Funzionalità potenti per migliorare l'esperienza dei tuoi ospiti
            </p>
          </motion.div>

                               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
             {features.map((feature, index) => (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: index * 0.1 }}
                 className="bg-white rounded-2xl p-4 md:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 text-center"
               >
                 <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-r ${feature.bgGradient} flex items-center justify-center mb-4 md:mb-6 mx-auto`}>
                   {feature.icon}
                 </div>
                 <h3 className="text-xl font-semibold mb-4 md:mb-3 text-dark">{feature.title}</h3>
                 {/* Descrizione solo su desktop */}
                 <p className="hidden md:block text-gray-600 mb-6">{feature.description}</p>
                 <ul className="space-y-2">
                   {feature.features.map((item, i) => (
                     <li key={i} className="flex items-center justify-center text-sm text-gray-600">
                       <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                       <span className="text-center md:text-left">{item}</span>
                     </li>
                   ))}
                 </ul>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* How It Works - Animazioni Interactive */}
      <section id="how-it-works" className="section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">
              Come Funziona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tre semplici passi per attivare il tuo assistente virtuale
            </p>
          </motion.div>

          {/* Steps con animazioni */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
               {howItWorksSteps.map((step, index) => (
                 <motion.div
                   key={index}
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {/* Numero del passo - floating */}
                <div className="absolute -top-4 left-4 md:left-1/2 md:transform md:-translate-x-1/2 z-20">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center shadow-lg"
                  >
                    <span className="text-sm font-bold text-white">{step.step}</span>
                  </motion.div>
                   </div>
                   
                                {/* Card con animazione statica */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 h-auto md:h-[32rem] relative overflow-hidden flex flex-col">
                  
                  {/* Titolo e descrizione con spazio bilanciato */}
                  <div className="text-center mb-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${
                      index === 0 ? 'from-blue-500 to-blue-600' :
                      index === 1 ? 'from-green-500 to-green-600' :
                      'from-purple-500 to-purple-600'
                    } flex items-center justify-center mb-4 mx-auto`}>
                      {index === 0 && <Home className="w-7 h-7 text-white" />}
                      {index === 1 && <Settings className="w-7 h-7 text-white" />}
                      {index === 2 && <Share2 className="w-7 h-7 text-white" />}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-dark">{step.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed px-2">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Animazione statica - con altezza fissa per evitare troppo spazio vuoto */}
                  <div className="flex-1 flex items-center justify-center">
                    {index === 0 && (
                      <div className="w-full max-w-sm bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 relative overflow-hidden">
                        <div className="bg-white rounded-lg shadow-lg p-3">
                          <div className="flex items-center justify-between px-2 py-1 bg-gray-100 rounded-t-lg border-b">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="text-xs text-gray-600">hostgpt.it/register</div>
                          </div>
                          <div className="p-2 space-y-2">
                            <div className="text-center mb-2">
                              <div className="w-4 h-4 bg-primary rounded mx-auto mb-1 flex items-center justify-center">
                                <Home className="w-2 h-2 text-white" />
                              </div>
                              <h3 className="text-xs font-bold">Registrati</h3>
                            </div>
                            <div className="space-y-1">
                              <div className="h-3 bg-blue-50 rounded border">
                                <div className="text-xs px-1 text-gray-700">mario.rossi@email.com</div>
                              </div>
                              <div className="h-3 bg-blue-50 rounded border">
                                <div className="text-xs px-1 text-gray-700">••••••••</div>
                              </div>
                              <button className="w-full h-4 rounded text-xs font-semibold text-white bg-primary">
                                Registrati
                              </button>
                              <div className="text-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-0.5"></div>
                                <p className="text-xs text-green-600">Account creato!</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {index === 1 && (
                      <div className="w-full max-w-sm bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 relative overflow-hidden">
                        <div className="bg-white rounded-lg shadow-lg p-3">
                          <div className="flex items-center justify-between px-2 py-1 bg-gray-900 rounded-t-lg text-white">
                            <div className="flex items-center space-x-1">
                              <Home className="w-2 h-2 text-primary" />
                              <span className="text-xs font-bold">Dashboard</span>
                            </div>
                          </div>
                          <div className="p-2">
                            <div className="text-center mb-2">
                              <h3 className="text-xs font-bold">Crea Chatbot</h3>
                            </div>
                            <div className="space-y-1">
                              <div className="p-1 rounded border-2 border-green-400 bg-green-50">
                                <div className="text-xs text-gray-600">Nome proprietà</div>
                                <div className="text-xs font-medium">Casa Bella Vista</div>
                              </div>
                              <div className="p-1 rounded border-2 border-green-400 bg-green-50">
                                <div className="text-xs text-gray-600">Check-in</div>
                                <div className="text-xs font-medium">15:00-20:00</div>
                              </div>
                              <div className="p-1 rounded border-2 border-green-400 bg-green-50">
                                <div className="text-xs text-gray-600">Consigli</div>
                                <div className="text-xs font-medium">Ristorante Roma...</div>
                              </div>
                              <button className="w-full h-4 rounded text-xs font-semibold text-white bg-green-500">
                                Chatbot Creato!
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {index === 2 && (
                      <div className="w-full max-w-sm bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 relative overflow-hidden">
                        <div className="bg-white rounded-lg shadow-lg p-3">
                          <div className="flex items-center justify-center px-2 py-1 bg-gradient-to-r from-primary to-accent rounded-t-lg text-white">
                            <span className="text-xs font-bold">Chatbot Pronto!</span>
                          </div>
                          <div className="p-2 text-center">
                            <div className="flex justify-center mb-2">
                              <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded relative">
                                <div className="absolute inset-0.5 grid grid-cols-4 gap-px">
                                  {[...Array(16)].map((_, i) => (
                                    <div key={i} className={`${Math.random() > 0.3 ? 'bg-gray-900' : 'bg-transparent'} rounded-sm`} />
                                  ))}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-primary rounded flex items-center justify-center">
                                    <Home className="w-1 h-1 text-white" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600">Link:</div>
                              <div className="bg-gray-100 rounded px-1 py-0.5 text-xs text-primary">
                                hostgpt.it/chat/abc123
                              </div>
                              <div className="flex justify-center space-x-1">
                                <div className="w-3 h-3 bg-blue-500 rounded flex items-center justify-center">
                                  <Share2 className="w-1.5 h-1.5 text-white" />
                                </div>
                                <div className="w-3 h-3 bg-green-500 rounded flex items-center justify-center">
                                  <MessageSquare className="w-1.5 h-1.5 text-white" />
                                </div>
                                <div className="w-3 h-3 bg-purple-500 rounded flex items-center justify-center">
                                  <QrCode className="w-1.5 h-1.5 text-white" />
                                </div>
                              </div>
                              <div className="text-xs text-green-600 font-medium">
                                ✅ Condividi con gli ospiti!
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Gradiente decorativo */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    index === 0 ? 'from-blue-400 to-blue-600' :
                    index === 1 ? 'from-green-400 to-green-600' :
                    'from-purple-400 to-purple-600'
                  } rounded-t-2xl z-10`}></div>
                </div>
                
                {/* Linea di connessione solo desktop */}
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 lg:-right-6 w-8 lg:w-12 h-0.5 bg-gradient-to-r from-gray-300 to-transparent transform -translate-y-1/2 z-10"></div>
                )}
                 </motion.div>
               ))}
           </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-padding bg-gray-50">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">Un Solo Abbonamento</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Tutto ciò che ti serve a <span className="font-semibold">€29/mese</span></p>
          </motion.div>

          <div className="grid md:grid-cols-1 gap-8 max-w-xl mx-auto">
            {pricingPlans.map((plan, index) => (
              /* Card con flip animation solo se highlighted */
              plan.highlighted ? (
                <div key={index} className="relative w-full h-auto" style={{ perspective: '1000px' }}>
              <motion.div
                    initial={false}
                    animate={{ rotateY: pricingFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="relative w-full"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Fronte della card - contenuto prezzo */}
                                        <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      onViewportEnter={() => handlePricingFlip()}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="ring-2 ring-primary transform scale-105 bg-white rounded-2xl p-8 relative overflow-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2" style={{ zIndex: 100 }}>
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Più Popolare
                    </span>
                  </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                        className="block text-center py-3 px-6 rounded-lg font-semibold transition bg-primary text-white hover:bg-secondary"
                >
                  Registrati ora
                </Link>
              </motion.div>

                    {/* Retro della card - demo chat */}
                    <div 
                      className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-gray-100 ring-2 ring-primary transform scale-105 p-8"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      {/* Badge "Più Popolare" anche sul retro */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2" style={{ zIndex: 100 }}>
                        <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                          Più Popolare
                        </span>
                      </div>
                      <PricingChatAnimation isActive={pricingAnimationStarted} />
                    </div>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 relative overflow-hidden"
                >
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="block text-center py-3 px-6 rounded-lg font-semibold transition bg-gray-100 text-dark hover:bg-gray-200"
                  >
                    Registrati ora
                  </Link>
                </motion.div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Gallery con frecce */}
      <section id="testimonials" className="section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">
              Cosa Dicono i Nostri Host
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unisciti a centinaia di host soddisfatti
            </p>
          </motion.div>

          {/* Gallery di testimonianze */}
          <div 
            className="testimonial-gallery"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="testimonial-card"
            >
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-8 italic text-lg">"{testimonials[currentTestimonial].content}"</p>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <div>
                  <p className="font-semibold text-lg">{testimonials[currentTestimonial].name}</p>
                  <p className="text-sm text-gray-500">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
            </motion.div>

            {/* Frecce di navigazione - Solo desktop */}
            <button
              onClick={prevTestimonial}
              className="testimonial-nav-button left-4 hidden md:flex"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={nextTestimonial}
              className="testimonial-nav-button right-4 hidden md:flex"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>

            {/* Indicatori */}
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`testimonial-indicator ${
                    index === currentTestimonial ? 'active' : 'inactive'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Organizzata in orizzontale su mobile */}
      <section className="section-padding bg-gradient-to-r from-primary to-accent text-white">
        <div className="container-max">
          <div className="mobile-stats-grid">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
              <div className="text-white/80 text-sm md:text-base">Host Attivi</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="text-3xl md:text-4xl font-bold mb-2">50K+</div>
              <div className="text-white/80 text-sm md:text-base">Conversazioni</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="text-3xl md:text-4xl font-bold mb-2">99%</div>
              <div className="text-white/80 text-sm md:text-base">Uptime</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="text-3xl md:text-4xl font-bold mb-2">4.9</div>
              <div className="text-white/80 text-sm md:text-base">Valutazione</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-max text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-12"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">
              Pronto a Rivoluzionare l'Esperienza dei Tuoi Ospiti?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Unisciti a centinaia di host che hanno già migliorato il loro servizio con HostGPT
            </p>
                         <Link href="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center">
               Registrati per iniziare
               <ArrowRight className="ml-2 w-5 h-5" />
             </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer - Ripensato per mobile */}
      <footer className="bg-dark text-white py-8">
        <div className="container-max px-4">
          {/* Footer layout: mobile compatto, desktop normale */}
          <div className="md:grid md:grid-cols-4 md:gap-8 mb-8">
            {/* Logo e descrizione - Layout differente per mobile/desktop */}
            <div className="md:col-span-1">
              {/* Logo desktop */}
              <div className="hidden md:block text-left mb-8">
                <div className="flex items-center space-x-2 mb-3">
                <Home className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">HostGPT</span>
              </div>
              <p className="text-gray-400 text-sm">
                Il tuo assistente virtuale per affitti vacanza
              </p>
            </div>
            
              {/* Logo mobile */}
              <div className="md:hidden text-center mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Home className="w-6 h-6 text-primary" />
                  <span className="text-lg font-bold">HostGPT</span>
                </div>
                <p className="text-gray-400 text-xs">
                  Il tuo assistente virtuale per affitti vacanza
                </p>
              </div>
            </div>

            {/* Sezioni - Layout diverso per mobile/desktop */}
            <div className="grid grid-cols-3 gap-4 md:col-span-3 md:grid-cols-3 md:gap-8">
              <div className="text-center md:text-left">
                <h4 className="font-semibold mb-3 text-sm md:text-base">Prodotto</h4>
                <ul className="space-y-1 md:space-y-2 text-gray-400 text-xs md:text-sm">
                <li><Link href="#features" className="hover:text-white transition">Funzionalità</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Prezzi</Link></li>
                <li><Link href="#" className="hover:text-white transition">API</Link></li>
              </ul>
            </div>
            
              <div className="text-center md:text-left">
                <h4 className="font-semibold mb-3 text-sm md:text-base">Azienda</h4>
                <ul className="space-y-1 md:space-y-2 text-gray-400 text-xs md:text-sm">
                <li><Link href="#" className="hover:text-white transition">Chi Siamo</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contatti</Link></li>
              </ul>
            </div>
            
              <div className="text-center md:text-left">
                <h4 className="font-semibold mb-3 text-sm md:text-base">Legale</h4>
                <ul className="space-y-1 md:space-y-2 text-gray-400 text-xs md:text-sm">
                  <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition">Termini</Link></li>
                <li><Link href="#" className="hover:text-white transition">Cookie</Link></li>
              </ul>
              </div>
            </div>
          </div>
          
          {/* Separatore */}
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400 text-sm">&copy; 2024 HostGPT. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  )
}
