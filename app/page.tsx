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

  // Stati per le animazioni "Come funziona"
  const [howItWorksInView, setHowItWorksInView] = useState([false, false, false])
  const howItWorksRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]

  // Stati per il feedback form
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

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

  // Intersection Observer per le animazioni "Come funziona"
  useEffect(() => {
    const observers = howItWorksRefs.map((ref, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setHowItWorksInView(prev => {
              const newState = [...prev]
              newState[index] = true
              return newState
            })
          }
        },
        { threshold: 0.3 }
      )
      
      if (ref.current) {
        observer.observe(ref.current)
      }
      
      return observer
    })

    return () => {
      observers.forEach((observer, index) => {
        if (howItWorksRefs[index].current) {
          observer.unobserve(howItWorksRefs[index].current)
        }
      })
    }
  }, [])



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

  // Funzione per gestire l'invio del feedback
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Qui normalmente invieresti i dati al server
    console.log('Feedback inviato:', {
      rating: feedbackRating,
      name: feedbackName,
      email: feedbackEmail,
      category: feedbackCategory,
      message: feedbackMessage
    })
    
    setFeedbackSubmitted(true)
    
    // Reset form dopo 3 secondi
    setTimeout(() => {
      setFeedbackSubmitted(false)
      setFeedbackRating(0)
      setFeedbackName('')
      setFeedbackEmail('')
      setFeedbackCategory('')
      setFeedbackMessage('')
    }, 3000)
  }





  // Componenti per le animazioni "Come funziona"
  const RegistrationAnimation = ({ isActive }: { isActive: boolean }) => {
    return (
      <div className="w-full max-w-sm bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 relative" style={{height: '24rem'}}>
        <div className="bg-white rounded-lg shadow-lg p-3 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-2 py-1 bg-gray-100 rounded-t-lg border-b">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-xs text-gray-600">hostgpt.it/register</div>
          </div>
          <div className="flex-1 flex flex-col justify-start space-y-2 p-2 min-h-0">
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={isActive ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.5, type: "spring", repeat: Infinity, repeatDelay: 8 }}
                className="w-6 h-6 bg-primary rounded mx-auto mb-2 flex items-center justify-center"
              >
                <Home className="w-3 h-3 text-white" />
              </motion.div>
              <h3 className="text-xs font-bold">Registrati</h3>
            </div>
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: 1, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="h-6 bg-blue-50 rounded border flex items-center px-2"
              >
                <div className="text-xs text-gray-700">mario.rossi@email.com</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: 2, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="h-6 bg-blue-50 rounded border flex items-center px-2"
              >
                <div className="text-xs text-gray-700">••••••••</div>
              </motion.div>
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                transition={{ delay: 3, duration: 0.5, repeat: Infinity, repeatDelay: 8 }}
                className="w-full h-8 rounded text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition"
              >
                Registrati
              </motion.button>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 4, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="text-center mt-1"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                <p className="text-xs text-green-600 font-medium">Account creato!</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CustomizationAnimation = ({ isActive }: { isActive: boolean }) => {
    return (
      <div className="w-full max-w-sm bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 relative" style={{height: '24rem'}}>
        <div className="bg-white rounded-lg shadow-lg p-3 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-2 py-1 bg-gray-900 rounded-t-lg text-white">
            <div className="flex items-center space-x-1">
              <Home className="w-2 h-2 text-primary" />
              <span className="text-xs font-bold">Dashboard</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-start p-2 min-h-0">
            <div className="text-center mb-4">
              <h3 className="text-xs font-bold">Crea Chatbot</h3>
            </div>
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.5, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="p-2 rounded border-2 border-green-400 bg-green-50"
              >
                <div className="text-xs text-gray-600">Nome proprietà</div>
                <div className="text-xs font-medium">Casa Bella Vista</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="p-2 rounded border-2 border-green-400 bg-green-50"
              >
                <div className="text-xs text-gray-600">Check-in</div>
                <div className="text-xs font-medium">15:00-20:00</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 2.5, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="p-2 rounded border-2 border-green-400 bg-green-50"
              >
                <div className="text-xs text-gray-600">Consigli</div>
                <div className="text-xs font-medium">Ristorante Roma...</div>
              </motion.div>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 3.5, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="w-full h-8 rounded text-xs font-semibold text-white bg-green-500 hover:bg-green-600 transition mt-2"
              >
                Chatbot Creato!
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const SharingAnimation = ({ isActive }: { isActive: boolean }) => {
    return (
      <div className="w-full max-w-sm bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 relative" style={{height: '24rem'}}>
        <div className="bg-white rounded-lg shadow-lg p-3 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-center px-2 py-1 bg-gradient-to-r from-primary to-accent rounded-t-lg text-white">
            <span className="text-xs font-bold">Chatbot Pronto!</span>
          </div>
          <div className="flex-1 flex flex-col justify-start items-center text-center p-2 min-h-0" style={{marginTop: '1rem'}}>
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={isActive ? { scale: 1, rotate: 360 } : { scale: 0, rotate: 0 }}
              transition={{ delay: 0.5, duration: 1.2, repeat: Infinity, repeatDelay: 8 }}
              className="flex justify-center mb-3"
            >
              <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded relative shadow-sm">
                <div className="absolute inset-1 grid grid-cols-4 gap-px">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className={`${Math.random() > 0.3 ? 'bg-gray-900' : 'bg-transparent'} rounded-sm`} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary rounded flex items-center justify-center">
                    <Home className="w-1.5 h-1.5 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="space-y-2 w-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="text-xs text-gray-600"
              >
                Link del chatbot:
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 2.5, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="bg-gray-100 rounded px-2 py-1 text-xs text-primary font-mono"
              >
                hostgpt.it/chat/abc123
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 3.5, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="flex justify-center space-x-2 mt-2"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Share2 className="w-3 h-3 text-white" />
                </div>
                <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-3 h-3 text-white" />
                </div>
                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                  <QrCode className="w-3 h-3 text-white" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 4.5, duration: 1, repeat: Infinity, repeatDelay: 8 }}
                className="text-xs text-green-600 font-medium mt-2"
              >
                ✅ Condividi con gli ospiti!
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    )
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
              <Link href="#feedback" className="text-gray-600 hover:text-primary transition">
                Feedback
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
              <Link href="#feedback" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Feedback</Link>
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

      {/* FEATURES SECTION - Ultra Luxurious Airbnb Style */}
      <section id="features" className="relative overflow-hidden section-padding">
        {/* Background ultra-elegante bianco e rosa */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-25/20 to-pink-25/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,207,232,0.12),transparent_60%)] opacity-70"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(244,63,94,0.06),transparent_70%)] opacity-60"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_135deg_at_20%_80%,transparent_0deg,rgba(251,207,232,0.08)_120deg,transparent_240deg)] opacity-50"></div>

        {/* Particelle fluttuanti eleganti */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-[12%] left-[8%] w-3 h-3 bg-rose-200/30 rounded-full"
            animate={{
              y: [0, -50, 0],
              x: [0, 25, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.6, 1]
            }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-[20%] right-[12%] w-2.5 h-2.5 bg-pink-300/25 rounded-full"
            animate={{
              y: [0, -40, 0],
              x: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 2, 1]
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2.5
            }}
          />
          <motion.div 
            className="absolute top-[75%] left-[85%] w-2 h-2 bg-rose-400/20 rounded-full"
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.4, 1]
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5
            }}
          />
          <motion.div 
            className="absolute top-[65%] left-[15%] w-1.5 h-1.5 bg-pink-200/35 rounded-full"
            animate={{
              y: [0, -35, 0],
              x: [0, 15, 0],
              opacity: [0.15, 0.4, 0.15]
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 7.5
            }}
          />
        </div>

        {/* Pattern geometrici sottili */}
        <div className="absolute inset-0 opacity-15">
          <svg className="absolute top-16 left-16 w-28 h-28 text-rose-300" viewBox="0 0 100 100">
            <motion.circle
              cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="0.4"
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle
              cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="0.25"
              animate={{ rotate: -360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            />
          </svg>
          <svg className="absolute bottom-24 right-24 w-20 h-20 text-pink-200" viewBox="0 0 100 100">
            <motion.rect
              x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="0.4"
              animate={{ rotate: 360 }}
              transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>

        <div className="relative container-max">
          {/* Header cinematografico */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                <span className="text-gray-900 block mb-2">Tutto Quello</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 block">
                  che Ti Serve
                </span>
            </h2>
          </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto"
            >
              Funzionalità potenti e raffinate per trasformare completamente
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600 font-semibold">
                l'esperienza dei tuoi ospiti
              </span>
            </motion.p>
          </motion.div>

          {/* Grid delle features ultra-lussuose */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
             {features.map((feature, index) => (
               <motion.div
                 key={index}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.12,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  boxShadow: "0 25px 50px rgba(244, 63, 94, 0.12)"
                }}
                className="relative group"
              >
                {/* Glow effect esterno */}
                <motion.div
                  className="absolute -inset-3 bg-gradient-to-r from-rose-200/20 via-pink-200/25 to-rose-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    opacity: [0, 0.3, 0],
                    scale: [0.9, 1.05, 0.9]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.8
                  }}
                />

                {/* Card principale */}
                <div className="relative bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-rose-100/40 overflow-hidden text-center group-hover:shadow-2xl transition-all duration-500"
                     style={{ 
                       boxShadow: "0 10px 25px rgba(244, 63, 94, 0.04), 0 0 0 1px rgba(251, 207, 232, 0.08)"
                     }}>
                  
                  {/* Background pattern interno */}
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-50/20 via-transparent to-pink-50/15"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100/25 to-transparent rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-100/20 to-transparent rounded-full blur-xl"></div>

                  {/* Icona ultra-stilizzata */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.3 + (index * 0.1),
                      type: "spring",
                      stiffness: 200
                    }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: 5,
                      boxShadow: "0 15px 30px rgba(244, 63, 94, 0.2)"
                    }}
                    className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 flex items-center justify-center mb-6 mx-auto shadow-lg overflow-hidden"
                  >
                    {/* Shimmer effect sull'icona */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                      animate={{
                        x: ["-100%", "200%"]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut"
                      }}
                    />
                    <div className="relative text-white">
                   {feature.icon}
                 </div>
                  </motion.div>

                  {/* Titolo con animazione */}
                  <motion.h3 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1), duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-xl lg:text-2xl font-bold mb-4 text-gray-900 group-hover:text-gray-800 transition-colors duration-300"
                  >
                    {feature.title}
                  </motion.h3>

                  {/* Descrizione (solo desktop) */}
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.7 + (index * 0.1), duration: 0.6 }}
                    viewport={{ once: true }}
                    className="hidden lg:block text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300"
                  >
                    {feature.description}
                  </motion.p>

                  {/* Lista features ultra-stilizzata */}
                  <motion.ul 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8 + (index * 0.1), duration: 0.7 }}
                    viewport={{ once: true }}
                    className="space-y-3"
                  >
                   {feature.features.map((item, i) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: -15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: 1 + (index * 0.1) + (i * 0.1), 
                          duration: 0.5 
                        }}
                        viewport={{ once: true }}
                        whileHover={{ x: 2 }}
                        className="flex items-center justify-center lg:justify-start text-sm text-gray-600 group"
                      >
                        <motion.div
                          className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center mr-3 shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <Check className="w-2.5 h-2.5 text-white font-bold" strokeWidth={3} />
                        </motion.div>
                        <span className="text-center lg:text-left group-hover:text-gray-700 transition-colors duration-200 font-medium">
                          {item}
                        </span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  {/* Decorazioni angolari sottili */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-rose-200/50 rounded-tl-lg"></div>
                  <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-rose-200/50 rounded-tr-lg"></div>
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-rose-200/50 rounded-bl-lg"></div>
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-rose-200/50 rounded-bl-lg"></div>

                  {/* Linea decorativa bottom */}
                  <motion.div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ delay: 1.2 + (index * 0.1), duration: 0.8 }}
                    viewport={{ once: true }}
                  />
                </div>


               </motion.div>
             ))}
          </div>


        </div>
      </section>

      {/* How It Works - Animazioni Interactive */}
      <section id="how-it-works" className="section-padding bg-pink-50">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
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
                   ref={howItWorksRefs[index]}
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Numero del passo - floating */}
                <div className="absolute -top-4 left-4 md:left-1/2 md:transform md:-translate-x-1/2 z-20">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    viewport={{ once: true }}
                    className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center shadow-lg"
                  >
                    <span className="text-sm font-bold text-white">{step.step}</span>
                  </motion.div>
                   </div>
                   
                                {/* Card con animazione statica */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 h-auto md:h-[36rem] relative overflow-hidden flex flex-col">
                  
                  {/* Titolo e descrizione con spazio ridotto */}
                  <div className="text-center mb-3">
                    <h3 className="text-xl font-bold mb-2 text-dark">{step.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed px-2">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Animazioni dinamiche - posizionamento ottimizzato */}
                  <div className="flex-1 flex items-center justify-center">
                    {index === 0 && <RegistrationAnimation isActive={howItWorksInView[0]} />}
                    {index === 1 && <CustomizationAnimation isActive={howItWorksInView[1]} />}
                    {index === 2 && <SharingAnimation isActive={howItWorksInView[2]} />}
                  </div>
                  
                  {/* Gradiente decorativo */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    index === 0 ? 'from-blue-400 to-blue-600' :
                    index === 1 ? 'from-green-400 to-green-600' :
                    'from-purple-400 to-purple-600'
                  } rounded-t-2xl z-10`}></div>
                </div>
                

                 </motion.div>
               ))}
           </div>
        </div>
      </section>

      {/* PRICING SECTION - Ultra Luxurious Airbnb Style */}
      <section id="pricing" className="relative overflow-hidden section-padding">
        {/* Background ultra-elegante bianco e rosa */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-50/30 to-pink-50/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,207,232,0.15),transparent_50%)] opacity-80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(244,63,94,0.08),transparent_60%)] opacity-70"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_30%_70%,transparent_0deg,rgba(251,207,232,0.1)_90deg,transparent_180deg)] opacity-60"></div>

        {/* Particelle fluttuanti eleganti */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-[15%] left-[10%] w-4 h-4 bg-rose-200/40 rounded-full"
            animate={{
              y: [0, -60, 0],
              x: [0, 30, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.8, 1]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-[25%] right-[15%] w-3 h-3 bg-pink-300/35 rounded-full"
            animate={{
              y: [0, -45, 0],
              x: [0, -25, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 2.2, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          />
          <motion.div 
            className="absolute top-[70%] left-[80%] w-2 h-2 bg-rose-400/30 rounded-full"
            animate={{
              y: [0, -35, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 6
            }}
          />
          <motion.div 
            className="absolute top-[60%] left-[20%] w-1.5 h-1.5 bg-pink-200/50 rounded-full"
            animate={{
              y: [0, -40, 0],
              x: [0, 20, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 8
            }}
          />
        </div>

        {/* Pattern geometrici sottili */}
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute top-10 left-10 w-32 h-32 text-rose-300" viewBox="0 0 100 100">
            <motion.circle
              cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle
              cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.3"
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            />
          </svg>
          <svg className="absolute bottom-20 right-20 w-24 h-24 text-pink-200" viewBox="0 0 100 100">
            <motion.polygon
              points="50,15 85,85 15,85" fill="none" stroke="currentColor" strokeWidth="0.5"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>

        <div className="relative container-max">
          {/* Header cinematografico */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                <span className="text-gray-900 block">Un Solo</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 block">
                  Abbonamento
                </span>
              </h2>
          </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="text-2xl text-gray-700 max-w-4xl mx-auto"
            >
              Tutto ciò che ti serve per trasformare la tua attività
              <br />
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">
                €29/mese
              </span>
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
            {pricingPlans.map((plan, index) => (
              plan.highlighted ? (
                <div key={index} className="relative w-full h-auto" style={{ perspective: '1200px' }}>
                  {/* Glow effect esterno ultra-elegante */}
                  <motion.div
                    className="absolute -inset-8 bg-gradient-to-r from-rose-200/30 via-pink-200/40 to-rose-300/30 rounded-[3rem] blur-2xl opacity-0"
                    animate={{
                      opacity: [0, 0.8, 0],
                      scale: [0.8, 1.1, 0.8]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Anelli concentrici animati */}
                  <motion.div
                    className="absolute -inset-6 rounded-[2.5rem] border border-rose-200/40"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                  />
                  <motion.div
                    className="absolute -inset-4 rounded-[2rem] border border-pink-300/30"
                    animate={{
                      scale: [1, 1.03, 1],
                      opacity: [0.4, 0.7, 0.4]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                  />

              <motion.div
                    initial={false}
                    animate={{ rotateY: pricingFlipped ? 180 : 0 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.23, 1, 0.320, 1],
                      type: "spring",
                      stiffness: 100
                    }}
                    className="relative w-full"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Fronte della card - ULTRA LUXURIOUS */}
                                        <motion.div 
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      onViewportEnter={() => handlePricingFlip()}
                      transition={{ 
                        duration: 0.8, 
                        delay: index * 0.2,
                        type: "spring",
                        stiffness: 80
                      }}
                      viewport={{ once: true }}
                      whileHover={{ 
                        y: -8,
                        boxShadow: "0 40px 80px rgba(244, 63, 94, 0.15)"
                      }}
                      className="relative bg-white rounded-[2rem] p-10 md:p-12 overflow-hidden shadow-2xl border border-rose-100/50"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        boxShadow: "0 25px 50px rgba(244, 63, 94, 0.08), 0 0 0 1px rgba(251, 207, 232, 0.1)"
                      }}
                    >
                      {/* Background pattern interno */}
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 via-transparent to-pink-50/20"></div>
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-rose-100/40 to-transparent rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-100/30 to-transparent rounded-full blur-2xl"></div>

                      {/* Badge "Più Popolare" ultra-stilizzato */}
                      <motion.div 
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20"
                        initial={{ y: -20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                        viewport={{ once: true }}
                      >
                        <div className="relative">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full blur-md opacity-60"
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.6, 0.8, 0.6]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          <span className="relative bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center">
                            <motion.div
                              className="w-2 h-2 bg-white rounded-full mr-2"
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [1, 0.7, 1]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                      Più Popolare
                    </span>
                  </div>
                      </motion.div>

                      {/* Header del piano */}
                      <div className="relative text-center mb-8">
                        <motion.h3 
                          className="text-3xl md:text-4xl font-black text-gray-900 mb-4"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1, duration: 0.6 }}
                          viewport={{ once: true }}
                        >
                          {plan.name}
                        </motion.h3>
                        
                        <motion.div 
                          className="mb-8"
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 1.2, duration: 0.8, type: "spring", stiffness: 100 }}
                          viewport={{ once: true }}
                        >
                          <span className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700">
                            {plan.price}
                          </span>
                          <span className="text-2xl text-gray-500 font-medium">{plan.period}</span>
                        </motion.div>
                </div>

                      {/* Lista features ultra-stilizzata */}
                      <motion.ul 
                        className="space-y-4 mb-10"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 1.4, duration: 0.8 }}
                        viewport={{ once: true }}
                      >
                  {plan.features.map((feature, i) => (
                          <motion.li 
                            key={i} 
                            className="flex items-start group"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.6 + (i * 0.1), duration: 0.5 }}
                            viewport={{ once: true }}
                            whileHover={{ x: 4 }}
                          >
                            <motion.div
                              className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center mr-4 mt-0.5 shadow-lg"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <Check className="w-3.5 h-3.5 text-white font-bold" strokeWidth={3} />
                            </motion.div>
                            <span className="text-gray-700 text-lg font-medium group-hover:text-gray-900 transition-colors duration-200">
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </motion.ul>

                      {/* Bottone CTA spettacolare */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2, duration: 0.6 }}
                        viewport={{ once: true }}
                        className="relative"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                          whileHover={{ scale: 1.05 }}
                        />
                <Link
                  href="/register"
                          className="relative block group"
                        >
                          <motion.div
                            whileHover={{ 
                              scale: 1.02,
                              boxShadow: "0 20px 40px rgba(244, 63, 94, 0.2)"
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white py-4 px-8 rounded-2xl font-bold text-lg text-center shadow-lg overflow-hidden relative"
                          >
                            {/* Shimmer effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                              animate={{
                                x: ["-100%", "200%"]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3,
                                ease: "easeInOut"
                              }}
                            />
                            <span className="relative flex items-center justify-center">
                              Inizia Subito
                              <motion.div
                                className="ml-2"
                                animate={{ x: [0, 4, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <ArrowRight className="w-5 h-5" />
                              </motion.div>
                            </span>
                          </motion.div>
                </Link>
              </motion.div>

                      {/* Decorazioni angolari */}
                      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-rose-200 rounded-tl-lg"></div>
                      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-rose-200 rounded-tr-lg"></div>
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-rose-200 rounded-bl-lg"></div>
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-rose-200 rounded-br-lg"></div>
                    </motion.div>

                    {/* Retro della card - DEMO CHAT MIGLIORATA */}
                    <motion.div 
                      className="absolute inset-0 bg-white rounded-[2rem] shadow-2xl border border-rose-100/50 p-10 md:p-12 overflow-hidden"
                      style={{ 
                        backfaceVisibility: 'hidden', 
                        transform: 'rotateY(180deg)',
                        boxShadow: "0 25px 50px rgba(244, 63, 94, 0.08), 0 0 0 1px rgba(251, 207, 232, 0.1)"
                      }}
                    >
                      {/* Background pattern interno retro */}
                      <div className="absolute inset-0 bg-gradient-to-bl from-rose-50/30 via-transparent to-pink-50/20"></div>
                      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-rose-100/40 to-transparent rounded-full blur-3xl"></div>

                      {/* Badge "Più Popolare" anche sul retro */}
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                        <span className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                          Più Popolare
                        </span>
                      </div>

                      {/* Demo chat potenziata */}
                      <div className="relative h-full">
                      <PricingChatAnimation isActive={pricingAnimationStarted} />
                        
                        {/* Decorazioni angolari retro */}
                        <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-pink-200 rounded-tl-lg"></div>
                        <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-pink-200 rounded-tr-lg"></div>
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-pink-200 rounded-bl-lg"></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-pink-200 rounded-br-lg"></div>
                    </div>
                    </motion.div>
                  </motion.div>
                </div>
              ) : null
            ))}
          </div>

          {/* Sezione bottom con garanzie e benefici */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { icon: Shield, text: "Garanzia 30 giorni", subtext: "Rimborso completo" },
                  { icon: Zap, text: "Setup istantaneo", subtext: "Attivo in 5 minuti" },
                  { icon: Heart, text: "Supporto dedicato", subtext: "Sempre al tuo fianco" }
                ].map((item, index) => (
                                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + (index * 0.1), duration: 0.5 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -2 }}
                    className="text-center"
                  >
                    <motion.div
                      className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-rose-100 to-pink-100 rounded-2xl mb-4 shadow-sm"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <item.icon className="w-6 h-6 text-rose-600" />
                </motion.div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{item.text}</h4>
                    <p className="text-gray-600">{item.subtext}</p>
                  </motion.div>
            ))}
          </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* FEEDBACK SECTION - Ultra Modern & Cinematic */}
      <section id="feedback" className="relative overflow-hidden">
        {/* Background con gradiente dinamico e pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)] opacity-40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,107,107,0.2),transparent_50%)] opacity-30"></div>
        
        {/* Animated background particles */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-300/30 rounded-full"
            animate={{
              y: [0, -30, 0],
              x: [0, 10, 0],
              opacity: [0.1, 0.6, 0.1]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div 
            className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-blue-300/25 rounded-full"
            animate={{
              x: [0, -15, 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 2, 1]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>

        <div className="relative section-padding">
        <div className="container-max">
            {/* Header con animazione cinematografica */}
          <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                viewport={{ once: true }}
                className="inline-block"
              >
                <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 mb-6 leading-tight">
                  Il Tuo Feedback
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
                    È Prezioso
                  </span>
            </h2>
          </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
              >
                Condividi la tua esperienza e aiutaci a rendere HostGPT ancora più straordinario.
                <br />
                <span className="text-purple-300 font-semibold">Ogni opinione conta per costruire il futuro insieme.</span>
              </motion.p>
            </motion.div>

            {/* Grid principale con layout cinematografico */}
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
              
              {/* Colonna sinistra - Form di feedback ultra-moderno */}
                          <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Glow effect dietro il form */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-3xl blur-xl opacity-60"></div>
                
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                  {/* Header del form */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg"
                    >
                      <MessageSquare className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Raccontaci Tutto</h3>
                    <p className="text-gray-300">La tua voce è il nostro motore di miglioramento</p>
                  </div>

                  {/* Form con gestione stato */}
                  <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                    {/* Rating con stelle interattive */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      viewport={{ once: true }}
                      className="text-center"
                    >
                      <label className="block text-white font-semibold mb-4 text-lg">Come valuti HostGPT?</label>
                      <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            whileHover={{ scale: 1.2, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            className="group relative"
                          >
                            <Star className={`w-10 h-10 transition-colors duration-200 drop-shadow-lg ${
                              star <= feedbackRating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-500 hover:text-yellow-300'
                            }`} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg"
                            >
                              {star} {star === 1 ? 'stella' : 'stelle'}
                            </motion.div>
                          </motion.button>
                ))}
              </div>
                    </motion.div>

                    {/* Campo nome con effetti glassmorphism */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      viewport={{ once: true }}
                      className="relative group"
                    >
                      <label className="block text-white font-semibold mb-2">Il Tuo Nome</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={feedbackName}
                          onChange={(e) => setFeedbackName(e.target.value)}
                          placeholder="Come ti chiami?"
                          className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15"
                          required
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                    </motion.div>

                    {/* Campo email */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      viewport={{ once: true }}
                      className="relative group"
                    >
                      <label className="block text-white font-semibold mb-2">Email (Opzionale)</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={feedbackEmail}
                          onChange={(e) => setFeedbackEmail(e.target.value)}
                          placeholder="per ricevere aggiornamenti"
                          className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                    </motion.div>

                    {/* Categoria feedback */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      viewport={{ once: true }}
                      className="relative group"
                    >
                      <label className="block text-white font-semibold mb-2">Categoria</label>
                      <div className="relative">
                        <select 
                          value={feedbackCategory}
                          onChange={(e) => setFeedbackCategory(e.target.value)}
                          className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15 appearance-none"
                          required
                        >
                          <option value="" className="bg-gray-800">Seleziona una categoria</option>
                          <option value="bug" className="bg-gray-800">🐛 Bug Report</option>
                          <option value="feature" className="bg-gray-800">✨ Nuova Funzionalità</option>
                          <option value="improvement" className="bg-gray-800">🚀 Miglioramento</option>
                          <option value="compliment" className="bg-gray-800">💝 Complimento</option>
                          <option value="other" className="bg-gray-800">💬 Altro</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </motion.div>

                    {/* Messaggio principale con counter */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      viewport={{ once: true }}
                      className="relative group"
                    >
                      <label className="block text-white font-semibold mb-2">Il Tuo Messaggio</label>
                      <div className="relative">
                        <textarea
                          rows={6}
                          value={feedbackMessage}
                          onChange={(e) => setFeedbackMessage(e.target.value.slice(0, 500))}
                          placeholder="Condividi i tuoi pensieri, suggerimenti o esperienze con HostGPT..."
                          className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15 resize-none"
                          required
                        />
                        <div className={`absolute bottom-3 right-3 text-xs transition-colors duration-200 ${
                          feedbackMessage.length > 450 ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {feedbackMessage.length}/500
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </motion.div>

                    {/* Bottone di invio con effetti spettacolari */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      viewport={{ once: true }}
                      className="pt-4"
                    >
                      {!feedbackSubmitted ? (
                        <motion.button
                          type="submit"
                          disabled={!feedbackRating || !feedbackName || !feedbackCategory || !feedbackMessage}
                          whileHover={{ 
                            scale: 1.05,
                            boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)"
                          }}
                          whileTap={{ scale: 0.95 }}
                          className="relative w-full group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {/* Background animato del bottone */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl"></div>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            animate={{
                              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                          
                          {/* Contenuto del bottone */}
                          <div className="relative px-8 py-4 flex items-center justify-center space-x-3">
                            <span className="text-white font-bold text-lg">Invia Feedback</span>
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ArrowRight className="w-5 h-5 text-white" />
                            </motion.div>
                          </div>

                          {/* Effetto shimmer */}
                          <motion.div
                            className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: ["-100%", "200%"]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                              ease: "easeInOut"
                            }}
                          />
                        </motion.button>
                      ) : (
                        /* Messaggio di successo */
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative w-full"
                        >
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl px-8 py-4 text-center">
                            <div className="flex items-center justify-center space-x-3">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                              >
                                <Check className="w-6 h-6 text-white" />
                              </motion.div>
                              <span className="text-white font-bold text-lg">Feedback Inviato!</span>
            </div>
                            <p className="text-green-100 text-sm mt-2">Grazie per il tuo contributo prezioso 🙏</p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </form>
                </div>
              </motion.div>

              {/* Colonna destra - Statistiche e feedback visivi */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                {/* Card statistiche feedback */}
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-50"></div>
                  <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg"
                      >
                        <BarChart3 className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-2">Feedback Ricevuti</h3>
                      <p className="text-gray-300">La community cresce ogni giorno</p>
                    </div>

                    {/* Statistiche animate */}
                    <div className="grid grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 1, delay: 0.8 }}
                          viewport={{ once: true }}
                          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2"
                        >
                          2,847
                        </motion.div>
                        <div className="text-gray-300 text-sm">Feedback Totali</div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        viewport={{ once: true }}
                        className="text-center p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 1, delay: 0.9 }}
                          viewport={{ once: true }}
                          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2"
                        >
                          4.9
                        </motion.div>
                        <div className="text-gray-300 text-sm">Rating Medio</div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 1, delay: 1 }}
                          viewport={{ once: true }}
                          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2"
                        >
                          98%
                        </motion.div>
                        <div className="text-gray-300 text-sm">Soddisfazione</div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.9 }}
                        className="text-center p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 1, delay: 1.1 }}
                          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2"
                        >
                          156
                        </motion.div>
                        <div className="text-gray-300 text-sm">Nuove Feature</div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Card video testimonianze */}
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-yellow-600/20 via-orange-600/20 to-red-600/20 rounded-3xl blur-xl opacity-50"></div>
                  <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl mb-4 shadow-lg"
                      >
                        <Sparkles className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-4">Video Testimonianze</h3>
                      
                      {/* Placeholder per video */}
                      <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-white/10 overflow-hidden group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30"
                          >
                            <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
                          </motion.div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                            <div className="text-white text-sm font-semibold">Marco ci racconta la sua esperienza</div>
                            <div className="text-gray-300 text-xs">Host da Roma • 2:34</div>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mt-4">
                        Guarda come i nostri host utilizzano HostGPT nella vita reale
                      </p>
                    </div>
                  </div>
                </div>


              </motion.div>
            </div>


          </div>
        </div>
      </section>

      {/* STATS SECTION - Ultra Modern & Spectacular */}
      <section className="relative overflow-hidden section-padding">
        {/* Background ultra-moderno */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(99,102,241,0.4),transparent_50%)] opacity-60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(236,72,153,0.3),transparent_50%)] opacity-50"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(147,51,234,0.1)_60deg,transparent_120deg,rgba(59,130,246,0.1)_240deg,transparent_300deg)] opacity-40"></div>

        {/* Particelle animate di background */}
        <div className="absolute inset-0 overflow-hidden">
            <motion.div
            className="absolute top-[20%] left-[15%] w-3 h-3 bg-blue-400/30 rounded-full"
            animate={{
              y: [0, -40, 0],
              x: [0, 20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-[60%] right-[20%] w-2 h-2 bg-pink-400/40 rounded-full"
            animate={{
              y: [0, -25, 0],
              x: [0, -15, 0],
              opacity: [0.2, 0.7, 0.2]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div 
            className="absolute top-[40%] left-[70%] w-1.5 h-1.5 bg-purple-300/35 rounded-full"
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 2, 1]
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
        </div>

        <div className="relative container-max">
          {/* Header spettacolare */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-center mb-16"
            >
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="inline-block"
            >
              <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200 mb-4 leading-tight">
                Numeri che
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-yellow-300">
                  Parlano Chiaro
                </span>
              </h2>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto"
            >
              I risultati straordinari che stiamo costruendo insieme alla nostra community
            </motion.p>
            </motion.div>

          {/* Grid delle statistiche ultra-moderne */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Stat 1 - Host Attivi */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl"></div>
                
                {/* Icona animata */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg"
                >
                  <Users className="w-6 h-6 text-white" />
            </motion.div>

                {/* Numero principale */}
            <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2"
                >
                  500+
                </motion.div>

                {/* Label */}
                <div className="text-gray-300 text-sm md:text-base font-semibold">Host Attivi</div>
                
                {/* Indicatore di crescita */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex items-center mt-2 text-green-400 text-xs"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+23% questo mese</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Stat 2 - Conversazioni */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl"></div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg"
                >
                  <MessageSquare className="w-6 h-6 text-white" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2"
                >
                  50K+
                </motion.div>

                <div className="text-gray-300 text-sm md:text-base font-semibold">Conversazioni</div>
                
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="flex items-center mt-2 text-green-400 text-xs"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+156% questo anno</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Stat 3 - Uptime */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl"></div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg"
                >
                  <Shield className="w-6 h-6 text-white" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2"
                >
                  99.9%
                </motion.div>

                <div className="text-gray-300 text-sm md:text-base font-semibold">Uptime</div>
                
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="flex items-center mt-2 text-green-400 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  <span>Sempre disponibile</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Stat 4 - Valutazione */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-2xl"></div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl mb-4 shadow-lg"
                >
                  <Star className="w-6 h-6 text-white fill-current" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2"
                >
                  4.9
                </motion.div>

                <div className="text-gray-300 text-sm md:text-base font-semibold">Valutazione</div>
                
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  className="flex items-center mt-2 text-yellow-400 text-xs"
                >
                  <div className="flex mr-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                  <span>da 2,847 recensioni</span>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Sezione bottom con insight */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mt-16"
          >
            <div className="relative inline-block">
              <div className="absolute -inset-6 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-full blur-2xl opacity-60"></div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-6 shadow-2xl"
              >
                <p className="text-gray-300 text-lg">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-bold">
                    Crescita del 300%
                  </span>{" "}
                  negli ultimi 6 mesi
                  <br />
                  <span className="text-sm text-gray-400">
                    La fiducia dei nostri host è la nostra forza motrice
                  </span>
                </p>
            </motion.div>
          </div>
          </motion.div>
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
