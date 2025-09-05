'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import CookieBanner from '../components/CookieBanner'
import LanguageSelector from '../components/LanguageSelector'
import { useLanguage } from '../lib/languageContext'
import api from '../lib/api'
import { chat } from '../lib/api'
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
  Send,
  Target,
  Award,
  TrendingUp,
  UserCheck,
  Settings,
  Smartphone as PhoneIcon,
  QrCode,
  Share2,
  Headphones,
  RefreshCw,
  Sun,
  Moon,
  Info,
  User,
  Bot,
  Loader2
} from 'lucide-react'

export default function LandingPage() {
  const { t, language } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Messaggi demo dinamici
  const demoChatMessages: { role: 'user' | 'assistant'; text: string }[] = t.demoMessages
  const [demoVisible, setDemoVisible] = useState<typeof demoChatMessages>([])
  const [demoRunId, setDemoRunId] = useState(0)
  const demoScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDemoVisible([])
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setDemoVisible(demoChatMessages.slice(0, i))
      if (i >= demoChatMessages.length) {
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

  const features = t.features.items.map((feature: any, index: number) => ({
    icon: [
      <MessageSquare className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      <Globe className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      <BarChart3 className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      <Zap className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      <Headphones className="w-6 h-6 md:w-10 md:h-10 text-white" />,
      <Shield className="w-6 h-6 md:w-10 md:h-10 text-white" />
    ][index],
    bgGradient: [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-orange-500 to-orange-600",
      "from-yellow-500 to-yellow-600",
      "from-green-500 to-green-600",
      "from-red-500 to-red-600"
    ][index],
    title: feature.title,
    description: feature.description,
    features: feature.features
  }))

  const testimonials = t.testimonials

  // Stati per l'animazione flip della card pricing
  const [pricingFlipped, setPricingFlipped] = useState(false)
  const [pricingAnimationStarted, setPricingAnimationStarted] = useState(false)
  const [pricingAnimationComplete, setPricingAnimationComplete] = useState(false)
  const [pricingTriggered, setPricingTriggered] = useState(false)

  // Stati per le animazioni "Come funziona"
  const [howItWorksInView, setHowItWorksInView] = useState([false, false, false])
  const [howItWorksCompleted, setHowItWorksCompleted] = useState([false, false, false])
  const [activeStep, setActiveStep] = useState(0)
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

  // Demo Chat State
  const [demoMessages, setDemoMessages] = useState<Array<{id?: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([])
  const [demoInput, setDemoInput] = useState('')
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [demoThreadId, setDemoThreadId] = useState<string | null>(null)
  const [demoGuestName, setDemoGuestName] = useState('')
  const [demoShowWelcome, setDemoShowWelcome] = useState(true)
  const [demoShowInfo, setDemoShowInfo] = useState(false)
  const [demoLanguage, setDemoLanguage] = useState<'IT' | 'ENG'>('IT')
  const [demoIsDarkMode, setDemoIsDarkMode] = useState(false)
  
  const demoInputRef = useRef<HTMLInputElement>(null)

  // Testi multilingua per demo - dinamici basati sulla lingua demo
  const demoTexts = {
    IT: {
      assistant: 'Assistente Virtuale',
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
      ]
    },
    ENG: {
      assistant: 'Virtual Assistant',
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
      ]
    }
  }

  const currentDemoTexts = demoTexts[demoLanguage]

  // Messaggi completi per i suggerimenti demo
  const demoFullMessages = {
    IT: {
      "Contatta Host": "Voglio contattare l'host. Come faccio?",
      "Attrazioni": "Vorrei visitare la zona, che attrazioni ci sono e come posso raggiungerle?",
      "Check-in/Check-out": "Quali sono gli orari di check-in e check-out?"
    },
    ENG: {
      "Contact Host": "I want to contact the host. How can I do it?",
      "Attractions": "I'd like to visit the area, what attractions are there and how can I reach them?",
      "Check-in/Check-out": "What are the check-in and check-out times?"
    }
  }

  const currentFullDemoMessages = demoFullMessages[demoLanguage]

  const handleDemoSuggestedMessage = async (suggestionKey: string) => {
    const fullMessage = currentFullDemoMessages[suggestionKey as keyof typeof currentFullDemoMessages] as string
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: fullMessage,
      timestamp: new Date()
    }

    setDemoMessages(prev => [...prev, userMessage])
    setIsDemoLoading(true)

    try {
      const response = await chat.sendMessage('5e2665c8-e243-4df3-a9fd-8e0d1e4fedcc', {
        content: fullMessage,
        thread_id: demoThreadId,
        guest_name: demoGuestName || undefined
      })

      if (!demoThreadId) {
        setDemoThreadId(response.data.thread_id)
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.data.message,
        timestamp: new Date()
      }

      setDemoMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Errore nella chat demo:', error)
      setDemoMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: 'Errore nell\'invio del messaggio',
        timestamp: new Date()
      }])
    } finally {
      setIsDemoLoading(false)
    }
  }

  const handleDemoSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!demoInput.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: demoInput,
      timestamp: new Date()
    }

    setDemoMessages(prev => [...prev, userMessage])
    setDemoInput('')
    setIsDemoLoading(true)

    try {
      const response = await chat.sendMessage('5e2665c8-e243-4df3-a9fd-8e0d1e4fedcc', {
        content: demoInput,
        thread_id: demoThreadId,
        guest_name: demoGuestName || undefined
      })

      if (!demoThreadId) {
        setDemoThreadId(response.data.thread_id)
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.data.message,
        timestamp: new Date()
      }

      setDemoMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Errore nella chat demo:', error)
      setDemoMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: 'Errore nell\'invio del messaggio',
        timestamp: new Date()
      }])
    } finally {
      setIsDemoLoading(false)
    }
  }

  const handleDemoStartChat = () => {
    setDemoShowWelcome(false)
  }

  const handleDemoNewConversation = () => {
    setDemoMessages([])
    setDemoThreadId(null)
    setDemoInput('')
    setDemoShowWelcome(true)
  }


  // Scroll automatico rimosso per evitare salti alla sezione "Come Funziona"


  // Intersection Observer per le animazioni "Come funziona"
  useEffect(() => {
    const observers = howItWorksRefs.map((ref, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !howItWorksCompleted[index]) {
            setHowItWorksInView(prev => {
              const newState = [...prev]
              newState[index] = true
              return newState
            })
            
            // Mark animation as completed immediately to prevent looping
            setTimeout(() => {
              setHowItWorksCompleted(prev => {
                const newState = [...prev]
                newState[index] = true
                return newState
              })
              // Also set inView to false to stop the animation
              setHowItWorksInView(prev => {
                const newState = [...prev]
                newState[index] = false
                return newState
              })
            }, 3000) // 3 seconds for the animation to complete
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
  }, [howItWorksCompleted])

  // Auto-switch per i passi in mobile - Gallery style
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const nextStep = (prev + 1) % 3
        
        // Scroll to the next card on mobile
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          const container = document.querySelector('.snap-x') as HTMLElement;
          if (container) {
            container.scrollTo({
              left: nextStep * container.offsetWidth,
              behavior: 'smooth'
            });
          }
        }
        
        return nextStep;
      })
    }, 6000) // Cambia ogni 6 secondi per dare tempo all'animazione (0.6s + delay + transition)

    return () => clearInterval(interval)
  }, [])

  // Sync activeStep with scroll position on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        const container = document.querySelector('.snap-x') as HTMLElement;
        if (container) {
          const scrollLeft = container.scrollLeft;
          const cardWidth = container.offsetWidth;
          const currentIndex = Math.round(scrollLeft / cardWidth);
          setActiveStep(currentIndex);
        }
      }
    };

    const container = document.querySelector('.snap-x') as HTMLElement;
    if (container && typeof window !== 'undefined' && window.innerWidth < 768) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [])



  const howItWorksSteps = t.howItWorks.steps.map((step: any, index: number) => ({
    step: index + 1,
    title: step.title,
    description: step.description
  }))

  const pricingPlans = t.pricing.plans.map((plan: any, index: number) => ({
    name: plan.name,
    price: plan.price,
    period: plan.period,
    features: plan.features,
    hasFreeTrial: true,
    freeTrialButton: plan.freeTrialButton,
    ctaButton: plan.ctaButton,
    priceId: plan.priceId
  }))

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
      <div className="w-full max-w-sm bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 relative" style={{height: '18rem'}}>
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
                transition={{ delay: 0.5, type: "spring" }}
                className="w-6 h-6 bg-primary rounded mx-auto mb-2 flex items-center justify-center"
              >
                <Home className="w-3 h-3 text-white" />
              </motion.div>
              <h3 className="text-xs font-bold">{t.howItWorks.animations.register.title}</h3>
            </div>
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: 1, duration: 1 }}
                className="h-6 bg-blue-50 rounded border flex items-center px-2"
              >
                <div className="text-xs text-gray-700">{t.howItWorks.animations.register.email}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: 2, duration: 1 }}
                className="h-6 bg-blue-50 rounded border flex items-center px-2"
              >
                <div className="text-xs text-gray-700">{t.howItWorks.animations.register.password}</div>
              </motion.div>
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                transition={{ delay: 3, duration: 0.5 }}
                className="w-full h-8 rounded text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition"
              >
                {t.howItWorks.animations.register.button}
              </motion.button>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 4, duration: 1 }}
                className="text-center mt-1"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                <p className="text-xs text-green-600 font-medium">{t.howItWorks.animations.register.success}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CustomizationAnimation = ({ isActive }: { isActive: boolean }) => {
    return (
      <div className="w-full max-w-sm bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 relative" style={{height: '18rem'}}>
        <div className="bg-white rounded-lg shadow-lg p-3 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-2 py-1 bg-gray-900 rounded-t-lg text-white">
            <div className="flex items-center space-x-1">
              <Home className="w-2 h-2 text-primary" />
              <span className="text-xs font-bold">Dashboard</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-start p-2 min-h-0">
            <div className="text-center mb-4">
              <h3 className="text-xs font-bold">{t.howItWorks.animations.customize.title}</h3>
            </div>
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="p-2 rounded border-2 border-green-400 bg-green-50"
              >
                <div className="text-xs text-gray-600">{t.howItWorks.animations.customize.propertyName}</div>
                <div className="text-xs font-medium">{t.howItWorks.animations.customize.propertyValue}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="p-2 rounded border-2 border-green-400 bg-green-50"
              >
                <div className="text-xs text-gray-600">{t.howItWorks.animations.customize.checkIn}</div>
                <div className="text-xs font-medium">{t.howItWorks.animations.customize.checkInValue}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="p-2 rounded border-2 border-green-400 bg-green-50"
              >
                <div className="text-xs text-gray-600">{t.howItWorks.animations.customize.tips}</div>
                <div className="text-xs font-medium">{t.howItWorks.animations.customize.tipsValue}</div>
              </motion.div>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 3.5, duration: 1 }}
                className="w-full h-8 rounded text-xs font-semibold text-white bg-green-500 hover:bg-green-600 transition mt-2"
              >
                {t.howItWorks.animations.customize.button}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const SharingAnimation = ({ isActive }: { isActive: boolean }) => {
    return (
      <div className="w-full max-w-sm bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 relative" style={{height: '18rem'}}>
        <div className="bg-white rounded-lg shadow-lg p-3 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-center px-2 py-1 bg-gradient-to-r from-primary to-accent rounded-t-lg text-white">
            <span className="text-xs font-bold">{t.howItWorks.animations.share.title}</span>
          </div>
          <div className="flex-1 flex flex-col justify-start items-center text-center p-2 min-h-0" style={{marginTop: '1rem'}}>
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={isActive ? { scale: 1, rotate: 360 } : { scale: 0, rotate: 0 }}
              transition={{ delay: 0.5, duration: 1.2 }}
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
                transition={{ delay: 1.5, duration: 1 }}
                className="text-xs text-gray-600"
              >
                {t.howItWorks.animations.share.link}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="bg-gray-100 rounded px-2 py-1 text-xs text-primary font-mono"
              >
                hostgpt.it/register
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 3.5, duration: 1 }}
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
                transition={{ delay: 4.5, duration: 1 }}
                className="text-xs text-green-600 font-medium mt-2"
              >
                ✅ {t.howItWorks.animations.share.success}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Componente per la chat nella sezione pricing (senza animazioni)
  const PricingChatStatic = () => {
    return (
      <div className="h-full flex flex-col relative">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-primary mb-2">{t.demoChatStatic.title}</h3>
          <p className="text-sm text-gray-600">{t.demoChatStatic.subtitle}</p>
        </div>
        
        <div className="flex-1 bg-gray-50 rounded-xl p-4 relative">
          <div className="space-y-3">
            <div className="flex justify-start">
              <div className="bg-white p-2 rounded-lg shadow-sm max-w-xs">
                <p className="text-sm">{t.demoChatStatic.messages.user1}</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="bg-primary text-white p-2 rounded-lg shadow-sm max-w-xs">
                <p className="text-sm">{t.demoChatStatic.messages.assistant1}</p>
              </div>
            </div>
            
            <div className="flex justify-start">
              <div className="bg-white p-2 rounded-lg shadow-sm max-w-xs">
                <p className="text-sm">{t.demoChatStatic.messages.user2}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR - Ultra Luxurious Liquid Glass */}
      <nav className="fixed top-4 left-0 right-0 z-50 safe-top">
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            {/* Glow esterno sottile */}
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-200/20 via-pink-200/30 to-rose-200/20 rounded-3xl blur-xl opacity-60"></div>
            
            {/* Container principale con liquid glass premium */}
            <div className="relative flex justify-between items-center py-4 px-6 bg-white/40 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-3xl mx-2">
              {/* Pattern decorativo interno */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-100/20 to-transparent rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-100/30 to-transparent rounded-full blur-xl"></div>
              </div>

              {/* Logo premium */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="relative z-10"
              >
                <Link href="/" className="flex items-center space-x-3">
                  <motion.div
                    className="relative"
                    whileHover={{ rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 to-pink-500 rounded-xl blur opacity-30"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                  <span className="text-2xl font-black text-gray-900 tracking-tight">HostGPT</span>
                </Link>
              </motion.div>

              {/* Desktop Menu premium - Ripensato per essere più pulito e organizzato */}
              <div className="hidden md:flex items-center space-x-2 relative z-10">
                {[
                  { href: "#features", label: t.navbar.features },
                  { href: "#demo", label: t.navbar.demo },
                  { href: "#how-it-works", label: t.navbar.howItWorks },
                  { href: "#pricing", label: t.navbar.pricing },
                  { href: "#feedback", label: t.navbar.feedback }
                ].map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link 
                      href={item.href} 
                      className="relative px-3 py-2 text-gray-700 font-medium hover:text-gray-900 transition-all duration-300 rounded-lg hover:bg-white/40 group text-sm"
                    >
                      <span className="relative z-10">{item.label}</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-rose-100/50 to-pink-100/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        layoutId="navbar-hover"
                      />
                    </Link>
                  </motion.div>
                ))}
                
                {/* Separatore */}
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                
                {/* Language Selector */}
                <LanguageSelector />
                
                {/* Separatore */}
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                
                {/* Bottone Login */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-all duration-300 rounded-lg hover:bg-white/40 text-sm"
                  >
                    {t.navbar.login}
                  </Link>
                </motion.div>

                {/* Bottone CTA principale */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="ml-2"
                >
                  <div className="relative group">
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-rose-400 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                      whileHover={{ scale: 1.1 }}
                    />
                    <Link
                      href="/register?free_trial=false"
                      className="relative inline-flex items-center gap-2 px-4 py-2 text-white font-semibold bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl shadow-lg transition-all duration-300 group-hover:shadow-xl overflow-hidden text-sm"
                    >
                      {/* Effetto shimmer */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3,
                          ease: "easeInOut",
                        }}
                      />
                      <span className="relative z-10">{t.navbar.register}</span>
                      <motion.div
                        animate={{ rotate: [0, 5, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "easeInOut",
                        }}
                        className="relative z-10"
                      >
                        <Sparkles className="w-3 h-3" />
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              </div>

              {/* Mobile Menu Button premium */}
              <motion.button
                className="md:hidden relative z-10 p-2 rounded-xl hover:bg-white/30 transition-colors duration-300"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: isMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6 text-gray-700" />
                  ) : (
                    <Menu className="w-6 h-6 text-gray-700" />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Mobile Menu premium */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:hidden mt-3 px-4"
          >
            <div className="relative">
              {/* Glow esterno mobile */}
              <div className="absolute -inset-1 bg-gradient-to-r from-rose-200/20 via-pink-200/30 to-rose-200/20 rounded-3xl blur-xl opacity-60"></div>
              
              {/* Container mobile con liquid glass */}
              <div className="relative bg-white/40 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-3xl mx-2 p-6">
                {/* Pattern decorativo mobile */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-100/30 to-transparent rounded-full blur-xl"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-100/40 to-transparent rounded-full blur-lg"></div>
                </div>

                <div className="space-y-2 relative z-10">
                  {[
                    { href: "#features", label: t.navbar.features },
                    { href: "#demo", label: t.navbar.demo },
                    { href: "#how-it-works", label: t.navbar.howItWorks },
                    { href: "#pricing", label: t.navbar.pricing },
                    { href: "#feedback", label: t.navbar.feedback }
                  ].map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Link 
                        href={item.href} 
                        onClick={() => setIsMenuOpen(false)} 
                        className="block px-4 py-2.5 text-gray-700 font-medium hover:text-gray-900 hover:bg-white/30 rounded-lg transition-all duration-300 text-sm"
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                  
                  {/* Separatore mobile */}
                  <div className="border-t border-white/20 my-2"></div>
                  
                  {/* Language Selector Mobile */}
                  <div className="px-4 py-2">
                    <LanguageSelector />
                  </div>
                  
                  {/* Separatore mobile */}
                  <div className="border-t border-white/20 my-2"></div>
                  
                  {/* Bottone mobile Login */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <Link 
                      href="/login" 
                      onClick={() => setIsMenuOpen(false)} 
                      className="block w-full text-center px-4 py-2.5 text-gray-700 font-medium hover:text-gray-900 hover:bg-white/30 rounded-lg transition-all duration-300 text-sm"
                    >
                      {t.navbar.login}
                    </Link>
                  </motion.div>

                  {/* Bottone mobile CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="pt-2"
                  >
                    <Link 
                      href="/register?free_trial=false" 
                      onClick={() => setIsMenuOpen(false)} 
                      className="block w-full text-center px-4 py-3 text-white font-semibold bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                    >
                      {t.navbar.register}
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* HERO SECTION - Ultra Luxurious Airbnb Style */}
      <section className="relative pt-32 md:pt-36 pb-16 md:pb-20 px-4 overflow-hidden">
        {/* Background ultra-elegante bianco e rosa */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-25/30 to-pink-25/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,207,232,0.15),transparent_50%)] opacity-80"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.8)_0deg,rgba(251,207,232,0.1)_120deg,rgba(255,255,255,0.9)_240deg,rgba(251,207,232,0.05)_360deg)]"></div>

        {/* Particelle fluttuanti eleganti */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Particelle rosa */}
          <motion.div
            className="absolute top-20 left-10 w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full opacity-30"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full opacity-25"
            animate={{
              y: [0, 15, 0],
              x: [0, -15, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          <motion.div
            className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-gradient-to-r from-rose-300 to-pink-400 rounded-full opacity-40"
            animate={{
              y: [0, -25, 0],
              x: [0, 20, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          <motion.div
            className="absolute top-60 right-1/3 w-2.5 h-2.5 bg-gradient-to-r from-pink-300 to-rose-400 rounded-full opacity-20"
            animate={{
              y: [0, 30, 0],
              x: [0, -25, 0],
              scale: [1, 0.6, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 6,
            }}
          />
        </div>

        {/* Pattern geometrici sottili */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="hero-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="url(#hero-gradient)" />
              </pattern>
              <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-dots)" />
          </svg>
        </div>

        <div className="container-max relative z-10">
          {/* Header ultra-cinematico */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.320, 1] }}
            className="text-center mb-20"
          >


            {/* Titolo principale spettacolare */}
            <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
              className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight"
            >
              <span className="text-gray-900 block text-4xl sm:text-6xl md:text-6xl">{t.hero.titlePrefix}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 block relative text-5xl sm:text-7xl md:text-8xl">
                HostGPT
                {/* Effetto shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut",
                  }}
                />
              </span>
              <span className="text-gray-900 block text-4xl sm:text-6xl md:text-6xl mt-4">
              {t.hero.title}
              </span>
            </motion.h1>

            {/* Sottotitolo elegante */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg sm:text-2xl text-gray-700 mb-12 max-w-6xl mx-auto leading-relaxed font-light"
            >
              {t.hero.subtitle} <br /><span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">{t.hero.subtitleHighlight}</span>
            </motion.p>

            {/* Bottoni CTA spettacolari */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              {/* Bottone Free Trial verde */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative group w-full sm:w-auto"
              >
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                  whileHover={{ scale: 1.1 }}
                />
                <Link
                  href="/register?free_trial=true"
                  className="relative flex items-center justify-center gap-3 px-10 py-4 text-base font-bold text-white bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-2xl shadow-2xl transition-all duration-300 group-hover:shadow-green-500/25 overflow-hidden w-[90%] mx-[5%] sm:w-96 sm:mx-0"
                >
                  {/* Effetto shimmer interno verde */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="relative z-10">{t.hero.freeTrialButton}</span>
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="relative z-10"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </motion.div>
               </Link>
              </motion.div>

              {/* Bottone principale */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative group w-full sm:w-auto"
              >
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                  whileHover={{ scale: 1.1 }}
                />
                <Link
                  href="/register?free_trial=false"
                  className="relative flex items-center justify-center gap-3 px-10 py-4 text-base font-bold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 rounded-2xl shadow-2xl transition-all duration-300 group-hover:shadow-rose-500/25 overflow-hidden w-[90%] mx-[5%] sm:w-96 sm:mx-0"
                >
                  {/* Effetto shimmer interno */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="relative z-10">{t.hero.registerButton}</span>
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="relative z-10"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </motion.div>
               </Link>
              </motion.div>



            </motion.div>
          </motion.div>

          {/* Demo Chat - COPIA ESATTA di /chat */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1, ease: [0.23, 1, 0.320, 1] }}
            className="relative max-w-4xl mx-auto"
          >
            <div className={`h-[90vh] flex flex-col overflow-hidden transition-colors duration-300 ${
              demoIsDarkMode 
                ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
                : 'bg-gradient-to-br from-primary/5 to-accent/5'
            }`}>
              {/* Header - FISSO */}
              <div className={`${demoIsDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm flex-shrink-0 border-b transition-colors duration-300`}>
                <div className="max-w-4xl mx-auto px-2 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                        <Home className="w-5 h-5 text-white" />
              </div>
                      <div>
                        <h1 className={`font-semibold text-lg transition-colors duration-300 ${demoIsDarkMode ? 'text-white' : 'text-gray-900'}`}>Demo Chat</h1>
                        <p className={`text-sm ${demoIsDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>{currentDemoTexts.assistant}</p>
                </div>
                  </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDemoNewConversation}
                        className={`p-2 rounded-lg transition-colors duration-200 group ${
                          demoIsDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        title="Nuova conversazione"
                      >
                        <RefreshCw className={`w-5 h-5 transition-colors duration-200 ${
                          demoIsDarkMode ? 'text-gray-300 group-hover:text-primary' : 'text-gray-600 group-hover:text-primary'
                        }`} />
                      </button>
                      <button
                        onClick={() => setDemoLanguage(demoLanguage === 'IT' ? 'ENG' : 'IT')}
                        className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:from-primary/20 hover:to-accent/20 hover:border-primary/40 transition-all duration-200"
                      >
                        {demoLanguage}
                      </button>
                      <button
                        onClick={() => setDemoIsDarkMode(!demoIsDarkMode)}
                        className={`p-2 rounded-lg transition-colors duration-200 group ${
                          demoIsDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        title={demoIsDarkMode ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
                      >
                        {demoIsDarkMode ? (
                          <Sun className={`w-5 h-5 transition-colors duration-200 ${
                            demoIsDarkMode ? 'text-gray-300 group-hover:text-primary' : 'text-gray-600 group-hover:text-primary'
                          }`} />
                        ) : (
                          <Moon className={`w-5 h-5 transition-colors duration-200 ${
                            demoIsDarkMode ? 'text-gray-300 group-hover:text-primary' : 'text-gray-600 group-hover:text-primary'
                          }`} />
                        )}
                      </button>
                      <button
                        onClick={() => setDemoShowInfo(!demoShowInfo)}
                        className={`p-2 rounded-lg transition ${
                          demoIsDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Info className={`w-5 h-5 transition-colors duration-300 ${
                          demoIsDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`} />
                      </button>
                        </div>
                      </div>
                </div>
              </div>

              {/* Info Panel - FISSO */}
              {demoShowInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border-b border-blue-200 flex-shrink-0"
                >
                  <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-blue-800 mb-2">
                          <strong>{currentDemoTexts.howCanIHelp}</strong>
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {currentDemoTexts.helpItems.map((item: string, index: number) => (
                            <li key={index}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => setDemoShowInfo(false)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Main Chat Area - FISSA */}
              <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4 md:py-6 overflow-hidden">
                <div className={`${demoIsDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden flex flex-col h-full transition-colors duration-300`}>
                  {/* Welcome Screen */}
                  {demoShowWelcome && demoMessages.length <= 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 text-center flex-1 flex flex-col justify-center"
                    >
                      <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-rose-500" />
                </div>
                      <h2 className={`text-2xl font-bold mb-2 ${demoIsDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{currentDemoTexts.welcome}</h2>
                      <p className={`mb-6 max-w-md mx-auto transition-colors duration-300 ${demoIsDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {currentDemoTexts.welcomeSubtitle}
                      </p>
                      <div className="mb-6">
                        <input
                          type="text"
                          value={demoGuestName}
                          onChange={(e) => setDemoGuestName(e.target.value)}
                          placeholder={currentDemoTexts.namePlaceholder}
                          className={`max-w-xs mx-auto px-4 py-3 rounded-lg border transition-all duration-200 ${
                            demoIsDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                          } outline-none`}
                        />
              </div>
                      <button
                        onClick={handleDemoStartChat}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold hover:from-secondary hover:to-accent transition-all duration-200"
                      >
                        {currentDemoTexts.startChat}
                      </button>
                    </motion.div>
                  )}

                  {/* Messages Area - FISSA */}
                  {(!demoShowWelcome || demoMessages.length > 1) && (
                    <>
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        {demoMessages.map((message, index) => (
              <motion.div
                            key={message.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-start max-w-[85%] md:max-w-[70%] ${
                              message.role === 'user' ? 'flex-row-reverse' : ''
                            }`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.role === 'user' 
                                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white ml-3' 
                                  : 'bg-gray-200 text-gray-600 mr-3'
                              }`}>
                                {message.role === 'user' ? (
                                  <User className="w-4 h-4" />
                                ) : (
                                  <Bot className="w-4 h-4" />
                                )}
                </div>
                              <div className={`rounded-2xl px-4 py-3 ${
                                message.role === 'user'
                                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-sm'
                                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                              }`}>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                                }`}>
                                  {message.timestamp.toLocaleTimeString('it-IT', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                  </div>
                </motion.div>
                        ))}

                        {isDemoLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                            className="flex justify-start"
                          >
                            <div className="flex items-center bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-gray-600">{currentDemoTexts.writing}</span>
                      </div>
                    </motion.div>
                        )}
                        
                      </div>

                      {/* Messaggi Suggeriti - SU UNA RIGA SOLA - Disabilitati durante il caricamento */}
                      <div className={`border-t p-2 transition-colors duration-300 ${
                        demoIsDarkMode ? 'border-gray-700' : 'border-gray-100'
                      }`}>
                        <div className="flex justify-center gap-2 md:gap-3 overflow-x-auto">
                          {currentDemoTexts.suggestedMessages.map((message: string, index: number) => (
                  <motion.button
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => !isDemoLoading && handleDemoSuggestedMessage(message)}
                              disabled={isDemoLoading}
                              className={`px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0 ${
                                isDemoLoading 
                                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 hover:from-primary/20 hover:to-accent/20 hover:border-primary/40'
                              }`}
                            >
                              {message}
                  </motion.button>
                          ))}
                        </div>
            </div>

                      {/* Input Area - FISSA */}
                      <div className={`border-t p-3 md:p-4 pb-6 md:pb-2 flex-shrink-0 transition-colors duration-300 ${
                        demoIsDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <form onSubmit={handleDemoSendMessage} className="flex items-center gap-2 md:gap-3">
                          <input
                            ref={demoInputRef}
                            type="text"
                            value={demoInput}
                            onChange={(e) => setDemoInput(e.target.value)}
                            placeholder={currentDemoTexts.placeholder}
                            disabled={isDemoLoading}
                            className={`flex-1 px-4 py-2.5 rounded-full border outline-none transition ${
                              demoIsDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                            }`}
                          />
                          <button
                            type="submit"
                            disabled={isDemoLoading || !demoInput.trim()}
                            className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-r from-primary to-secondary text-white rounded-full flex items-center justify-center hover:from-secondary hover:to-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stile personalizzato per scrollbar */}
        <style jsx>{`
          .scrollbar-custom::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-custom::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #f43f5e, #ec4899);
            border-radius: 10px;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #e11d48, #db2777);
          }
          
          /* Nascondi auto-switch su desktop */
          @media (min-width: 768px) {
            .mobile-auto-switch {
              transform: none !important;
              opacity: 1 !important;
              scale: 1 !important;
            }
          }

          /* Nascondi scrollbar per gallery mobile */
          .scrollbar-hide {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            overflow-x: auto !important;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .scrollbar-hide::-webkit-scrollbar-track {
            display: none !important;
          }
          .scrollbar-hide::-webkit-scrollbar-thumb {
            display: none !important;
          }
          .scrollbar-hide::-webkit-scrollbar-corner {
            display: none !important;
          }
        `}</style>
      </section>

      {/* HOW IT WORKS SECTION MOVED HERE - Animazioni Interactive */}
      <section id="how-it-works" className="section-padding bg-pink-50">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-dark mb-6 leading-tight">
              {t.howItWorks.title}
            </h2>
            <div 
              className="text-xl md:text-2xl text-gray-800 max-w-5xl mx-auto leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t.howItWorks.subtitle }}
            />
          </motion.div>

          {/* Steps con animazioni - Gallery style su mobile */}
          <div className="hidden md:grid md:grid-cols-3 gap-8 lg:gap-12">
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
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
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
                   
                                {/* Card con animazione statica - DESKTOP VERSIONE ORIGINALE */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 h-[29rem] relative overflow-hidden flex flex-col">
                  
                  {/* Titolo e descrizione */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black mb-4 text-dark leading-tight">{step.title}</h3>
                    <p className="text-gray-600 text-base leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Animazioni dinamiche - posizionamento ottimizzato */}
                  <div className="flex-1 flex items-center justify-center">
                    {index === 0 && <RegistrationAnimation isActive={true} />}
                    {index === 1 && <CustomizationAnimation isActive={true} />}
                    {index === 2 && <SharingAnimation isActive={true} />}
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

           {/* Gallery mobile - una card alla volta */}
           <div className="md:hidden relative">
             {/* Container scrollabile orizzontale */}
             <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
               {howItWorksSteps.map((step, index) => (
                 <motion.div
                   key={index}
                   ref={howItWorksRefs[index]}
                   initial={{ opacity: 0, x: 50 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   transition={{ duration: 0.6, delay: 0.2 }}
                   viewport={{ once: true }}
                   className="relative flex-shrink-0 w-full snap-center px-4"
                 >
                   {/* Card con animazione statica - MOBILE VERSIONE */}
                   <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 aspect-[9/16] relative overflow-hidden flex flex-col">
                     
                     {/* Numero del passo - dentro la card in alto a sinistra */}
                     <div className="absolute top-4 left-4 z-20">
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
                     
                     {/* Titolo e descrizione con spazio ridotto */}
                     <div className="text-center mb-4">
                       <h3 className="text-lg font-black mb-2 text-dark leading-tight">{step.title}</h3>
                       <p className="text-gray-600 text-sm leading-relaxed font-medium">
                         {step.description}
                       </p>
                     </div>
                     
                     {/* Animazioni dinamiche - posizionamento ottimizzato */}
                     <div className="flex-1 flex items-center justify-center">
                       {index === 0 && <RegistrationAnimation isActive={howItWorksCompleted[0]} />}
                       {index === 1 && <CustomizationAnimation isActive={howItWorksCompleted[1]} />}
                       {index === 2 && <SharingAnimation isActive={howItWorksCompleted[2]} />}
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

             {/* Indicatori di navigazione */}
             <div className="flex justify-center mt-6 space-x-2">
               {howItWorksSteps.map((_, index) => (
                 <motion.button
                   key={index}
                   onClick={() => {
                     const container = document.querySelector('.snap-x') as HTMLElement;
                     if (container) {
                       container.scrollTo({
                         left: index * container.offsetWidth,
                         behavior: 'smooth'
                       });
                     }
                   }}
                   className={`w-3 h-3 rounded-full transition-all duration-300 ${
                     index === activeStep ? 'bg-primary scale-125' : 'bg-gray-300'
                   }`}
                   whileHover={{ scale: 1.2 }}
                   whileTap={{ scale: 0.9 }}
                 />
               ))}
             </div>
           </div>
        </div>
      </section>

      {/* FEATURES SECTION MOVED HERE - Ultra Luxurious Purple/Blue Style */}
      <section id="features" className="relative overflow-hidden section-padding">
        {/* Background ultra-elegante viola e blu */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/90 to-indigo-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.3),transparent_50%)] opacity-60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.25),transparent_50%)] opacity-50"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_50%_50%,transparent_0deg,rgba(168,85,247,0.1)_120deg,transparent_240deg)] opacity-40"></div>

        {/* Particelle fluttuanti eleganti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-[20%] left-[15%] w-3 h-3 bg-purple-300/30 rounded-full"
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-[60%] right-[20%] w-2 h-2 bg-indigo-300/40 rounded-full"
            animate={{
              y: [0, -25, 0],
              x: [0, -10, 0],
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
            className="absolute top-[40%] left-[70%] w-1.5 h-1.5 bg-purple-400/35 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.8, 1]
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
          {/* Header spettacolare con animazioni */}
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
                <span className="text-white block mb-2">{t.features.title}</span>
            </h2>
          </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto"
            >
              {t.features.subtitle}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-semibold">
                {t.features.subtitleHighlight}
              </span>
            </motion.p>
          </motion.div>

          {/* Grid delle features ultra-lussuose */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
             {features.map((feature, index) => (
               <div key={index}>
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
                  className="absolute -inset-3 bg-gradient-to-r from-purple-200/20 via-indigo-200/25 to-purple-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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
                <div className="relative bg-white rounded-3xl p-2 md:p-3 lg:p-4 shadow-lg border border-rose-100/40 overflow-hidden text-center group-hover:shadow-2xl transition-all duration-500 h-48 md:h-72 lg:h-80 flex flex-col"
                     style={{ 
                       boxShadow: "0 10px 25px rgba(244, 63, 94, 0.04), 0 0 0 1px rgba(251, 207, 232, 0.08)"
                     }}>
                  
                  {/* Background pattern interno */}
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-50/20 via-transparent to-pink-50/15"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100/25 to-transparent rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-100/20 to-transparent rounded-full blur-xl"></div>

                  {/* Contenuto della card con spaziatura uniforme */}
                  <div className="flex flex-col h-full justify-between py-2 md:py-4">
                    {/* Sezione superiore: Icona */}
                    <div className="flex-shrink-0">
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
                        className="relative w-10 h-10 md:w-14 md:h-14 lg:w-18 lg:h-18 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg overflow-hidden"
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
                        <div className="relative text-white text-sm md:text-lg lg:text-xl">
                          {feature.icon}
                        </div>
                      </motion.div>
                    </div>

                    {/* Sezione centrale: Titolo e Descrizione */}
                    <div className="flex-1 flex flex-col justify-center px-1">
                      {/* Titolo con animazione */}
                      <motion.h3 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + (index * 0.1), duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-sm md:text-lg lg:text-xl font-bold mb-2 md:mb-3 text-gray-900 group-hover:text-gray-800 transition-colors duration-300 leading-tight"
                      >
                        {feature.title}
                      </motion.h3>

                      {/* Descrizione (solo desktop) */}
                      <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.7 + (index * 0.1), duration: 0.6 }}
                        viewport={{ once: true }}
                        className="hidden lg:block text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-sm"
                      >
                        {feature.description}
                      </motion.p>
                    </div>
                  </div>



                  {/* Decorazioni angolari sottili */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-rose-200/50 rounded-tl-lg"></div>
                  <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-rose-200/50 rounded-tr-lg"></div>
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-rose-200/50 rounded-bl-lg"></div>
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-rose-200/50 rounded-bl-lg"></div>

                  {/* Linea decorativa bottom */}
                  <motion.div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ delay: 1.2 + (index * 0.1), duration: 0.8 }}
                    viewport={{ once: true }}
                  />
                </div>


               </motion.div>
               </div>
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
                <span className="text-gray-900 block">{t.pricing.title}</span>
              </h2>
          </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto"
            >
              {t.pricing.subtitle}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => {
              const isAnnual = plan.name === "Annuale" || plan.name === "Annual"
              return (
                <div key={index} className="relative w-full h-auto" style={{ perspective: '1200px' }}>
                  <div className="relative w-full">
                    {/* Card quasi quadrata - ULTRA LUXURIOUS */}
                    <div 
                      className={`relative rounded-[2rem] p-6 md:p-8 overflow-hidden shadow-2xl aspect-square flex flex-col ${
                        isAnnual 
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/60' 
                          : 'bg-white border border-rose-100/50'
                      }`}
                      style={{ 
                        backfaceVisibility: 'hidden',
                        boxShadow: isAnnual 
                          ? "0 25px 50px rgba(245, 158, 11, 0.15), 0 0 0 1px rgba(251, 191, 36, 0.2)"
                          : "0 25px 50px rgba(244, 63, 94, 0.08), 0 0 0 1px rgba(251, 207, 232, 0.1)"
                      }}
                    >
                      {/* Badge di risparmio per piano annuale */}
                      {isAnnual && (
                        <div className="absolute top-4 right-4 z-20">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full shadow-lg">
                            <span className="text-xs font-bold">Risparmia €49</span>
                          </div>
                        </div>
                      )}

                      {/* Background pattern interno */}
                      <div className={`absolute inset-0 ${
                        isAnnual 
                          ? 'bg-gradient-to-br from-amber-50/40 via-transparent to-orange-50/30' 
                          : 'bg-gradient-to-br from-rose-50/30 via-transparent to-pink-50/20'
                      }`}></div>
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${
                        isAnnual 
                          ? 'bg-gradient-to-br from-amber-100/50 to-transparent' 
                          : 'bg-gradient-to-br from-rose-100/40 to-transparent'
                      }`}></div>
                      <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl ${
                        isAnnual 
                          ? 'bg-gradient-to-tr from-orange-100/40 to-transparent' 
                          : 'bg-gradient-to-tr from-pink-100/30 to-transparent'
                      }`}></div>

                    {/* Header del piano */}
                    <div className="relative text-center mb-6 flex-shrink-0">
                      <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
                        {plan.name}
                      </h3>
                      
                      <div className="mb-6">
                        <div className="text-4xl md:text-5xl font-black mb-2">
                          <span className={`text-transparent bg-clip-text ${
                            isAnnual 
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600' 
                              : 'bg-gradient-to-r from-rose-600 to-pink-600'
                          }`}>
                            {plan.price}
                          </span>
                          <span className="text-lg md:text-xl font-medium text-gray-600">
                            {plan.period}
                          </span>
                        </div>
                        
                      </div>
                    </div>

                    {/* Lista features ultra-stilizzata */}
                    <div className="flex-1 flex flex-col justify-center mb-6">
                      <div className="space-y-3">
                        {plan.features.map((feature: string, i: number) => (
                          <div 
                            key={i} 
                            className="flex items-start group"
                          >
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 shadow-lg ${
                              isAnnual 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600' 
                                : 'bg-gradient-to-r from-rose-500 to-pink-600'
                            }`}>
                              <Check className="w-3 h-3 text-white font-bold" strokeWidth={3} />
                            </div>
                            <span className="text-gray-700 text-sm font-medium group-hover:text-gray-900 transition-colors duration-200">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottoni affiancati */}
                    <div className="relative flex-shrink-0">
                      <div className="flex gap-3">
                        {/* Free Trial Button */}
                        {plan.hasFreeTrial && (
                          <Link
                            href="/register?free_trial=true"
                            className="flex-1 group"
                          >
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-3 rounded-xl font-bold text-xs shadow-lg overflow-hidden relative">
                              <span className="relative flex items-center justify-center">
                                {plan.freeTrialButton}
                              </span>
                            </div>
                          </Link>
                        )}
                        
                        {/* Bottone CTA principale */}
                        <Link
                          href="/register?free_trial=false"
                          className="flex-1 group"
                        >
                          <div className={`text-white py-3 px-3 rounded-xl font-bold text-xs text-center shadow-lg overflow-hidden relative ${
                            isAnnual 
                              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600' 
                              : 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600'
                          }`}>
                            <span className="relative flex items-center justify-center">
                              {plan.ctaButton}
                              <div className="ml-1">
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Decorazioni angolari */}
                    <div className={`absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 rounded-tl-lg ${
                      isAnnual ? 'border-amber-200' : 'border-rose-200'
                    }`}></div>
                    <div className={`absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 rounded-tr-lg ${
                      isAnnual ? 'border-amber-200' : 'border-rose-200'
                    }`}></div>
                    <div className={`absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 rounded-bl-lg ${
                      isAnnual ? 'border-amber-200' : 'border-rose-200'
                    }`}></div>
                    <div className={`absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 rounded-br-lg ${
                      isAnnual ? 'border-amber-200' : 'border-rose-200'
                    }`}></div>
                  </div>
                </div>
              </div>
              )
            })}
          </div>


        </div>
      </section>




      {/* FEEDBACK SECTION - Nascosta */}
      <section id="feedback" className="relative overflow-hidden hidden">
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
              className="text-center mb-12 md:mb-20"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                viewport={{ once: true }}
                className="inline-block"
              >
                <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 mb-4 md:mb-6 leading-tight">
                  Il Tuo Feedback È Prezioso
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
                <br className="hidden md:block" />
                <span className="text-purple-300 font-semibold">Ogni opinione conta per costruire il futuro insieme.</span>
              </motion.p>
            </motion.div>

            {/* Layout responsive: mobile stack, desktop grid */}
            <div className="md:grid md:grid-cols-2 md:gap-16 lg:gap-24 md:items-start space-y-8 md:space-y-0">
              
              {/* Mobile: Video testimonianze in alto */}
              <div className="md:hidden">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-yellow-600/20 via-orange-600/20 to-red-600/20 rounded-3xl blur-xl opacity-50"></div>
                  <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl mb-3 shadow-lg"
                      >
                        <Sparkles className="w-6 h-6 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-bold text-white mb-3">Video Testimonianze</h3>
                      
                      {/* Video compatto per mobile */}
                      <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-white/10 overflow-hidden group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30"
                          >
                            <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1"></div>
                          </motion.div>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
                            <div className="text-white text-xs font-semibold">Marco ci racconta la sua esperienza</div>
                            <div className="text-gray-300 text-xs">Host da Roma • 2:34</div>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-300 text-xs mt-3">
                        Guarda come i nostri host utilizzano HostGPT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form di feedback - responsive */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-3xl blur-xl opacity-60"></div>
                
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 lg:p-12 shadow-2xl">
                  {/* Header del form */}
                  <div className="text-center mb-6 md:mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-3 md:mb-4 shadow-lg"
                    >
                      <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-white mb-1 md:mb-2">Raccontaci Tutto</h3>
                    <p className="text-gray-300 text-sm md:text-base">La tua voce è il nostro motore di miglioramento</p>
                  </div>

                  {/* Form con gestione stato */}
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4 md:space-y-6">
                    {/* Rating con stelle interattive */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      viewport={{ once: true }}
                      className="text-center"
                    >
                      <label className="block text-white font-semibold mb-3 text-sm md:text-lg">Come valuti HostGPT?</label>
                      <div className="flex justify-center space-x-1 md:space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            className="group relative"
                          >
                            <Star className={`w-6 h-6 md:w-10 md:h-10 transition-colors duration-200 drop-shadow-lg ${
                              star <= feedbackRating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-500 hover:text-yellow-300'
                            }`} />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Campi del form */}
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        viewport={{ once: true }}
                        className="relative group"
                      >
                        <label className="block text-white font-semibold mb-2 text-sm md:text-base">Il Tuo Nome</label>
                        <input
                          type="text"
                          value={feedbackName}
                          onChange={(e) => setFeedbackName(e.target.value)}
                          placeholder="Come ti chiami?"
                          className="w-full px-4 py-3 md:px-6 md:py-4 bg-white/10 border border-white/20 rounded-xl md:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15 text-sm md:text-base"
                          required
                        />
                        <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        viewport={{ once: true }}
                        className="relative group"
                      >
                        <label className="block text-white font-semibold mb-2 text-sm md:text-base">Email (Opzionale)</label>
                        <input
                          type="email"
                          value={feedbackEmail}
                          onChange={(e) => setFeedbackEmail(e.target.value)}
                          placeholder="per ricevere aggiornamenti"
                          className="w-full px-4 py-3 md:px-6 md:py-4 bg-white/10 border border-white/20 rounded-xl md:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15 text-sm md:text-base"
                        />
                        <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </motion.div>
                    </div>

                    {/* Categoria feedback */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      viewport={{ once: true }}
                      className="relative group"
                    >
                      <label className="block text-white font-semibold mb-2 text-sm md:text-base">Categoria</label>
                      <div className="relative">
                        <select 
                          value={feedbackCategory}
                          onChange={(e) => setFeedbackCategory(e.target.value)}
                          className="w-full px-4 py-3 md:px-6 md:py-4 bg-white/10 border border-white/20 rounded-xl md:rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15 appearance-none text-sm md:text-base"
                          required
                        >
                          <option value="" className="bg-gray-800">Seleziona una categoria</option>
                          <option value="bug" className="bg-gray-800">🐛 Bug Report</option>
                          <option value="feature" className="bg-gray-800">✨ Nuova Funzionalità</option>
                          <option value="improvement" className="bg-gray-800">🚀 Miglioramento</option>
                          <option value="compliment" className="bg-gray-800">💝 Complimento</option>
                          <option value="other" className="bg-gray-800">💬 Altro</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 w-4 h-4 md:w-5 md:h-5 text-gray-400 pointer-events-none" />
                        <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </motion.div>

                    {/* Messaggio */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      viewport={{ once: true }}
                      className="relative group"
                    >
                      <label className="block text-white font-semibold mb-2 text-sm md:text-base">Il Tuo Messaggio</label>
                      <div className="relative">
                        <textarea
                          rows={4}
                          value={feedbackMessage}
                          onChange={(e) => setFeedbackMessage(e.target.value.slice(0, 500))}
                          placeholder="Condividi i tuoi pensieri, suggerimenti o esperienze con HostGPT..."
                          className="w-full px-4 py-3 md:px-6 md:py-4 bg-white/10 border border-white/20 rounded-xl md:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400/50 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15 resize-none text-sm md:text-base"
                          required
                        />
                        <div className={`absolute bottom-2 right-2 text-xs transition-colors duration-200 ${
                          feedbackMessage.length > 450 ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {feedbackMessage.length}/500
                        </div>
                        <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </motion.div>

                    {/* Bottone di invio */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      viewport={{ once: true }}
                      className="pt-2 md:pt-4"
                    >
                      {!feedbackSubmitted ? (
                        <motion.button
                          type="submit"
                          disabled={!feedbackRating || !feedbackName || !feedbackCategory || !feedbackMessage}
                          whileHover={{ 
                            scale: 1.02,
                            boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)"
                          }}
                          whileTap={{ scale: 0.98 }}
                          className="relative w-full group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {/* Background animato del bottone */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl md:rounded-2xl"></div>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
                          <div className="relative px-6 py-3 md:px-8 md:py-4 flex items-center justify-center space-x-2 md:space-x-3">
                            <span className="text-white font-bold text-sm md:text-lg">Invia Feedback</span>
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
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
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative w-full"
                        >
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 text-center">
                            <div className="flex items-center justify-center space-x-2 md:space-x-3">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                              >
                                <Check className="w-5 h-5 md:w-6 md:h-6 text-white" />
                              </motion.div>
                              <span className="text-white font-bold text-sm md:text-lg">Feedback Inviato!</span>
                            </div>
                            <p className="text-green-100 text-xs md:text-sm mt-1 md:mt-2">Grazie per il tuo contributo prezioso 🙏</p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </form>
                </div>
              </motion.div>

              {/* Desktop: Colonna destra - Statistiche e feedback visivi */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="hidden md:block space-y-8"
              >
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
                {t.statistics.title}
              </h2>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto"
            >
              {t.statistics.subtitle}
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
              
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-center">
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
                  {t.statistics.stats[0].number}
                </motion.div>

                {/* Label */}
                <div className="text-gray-300 text-sm md:text-base font-semibold">{t.statistics.stats[0].label}</div>
                
                {/* Indicatore di crescita */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex items-center justify-center mt-2 text-green-400 text-xs"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>{t.statistics.stats[0].growth}</span>
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
              
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-center">
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
                  {t.statistics.stats[1].number}
                </motion.div>

                <div className="text-gray-300 text-sm md:text-base font-semibold">{t.statistics.stats[1].label}</div>
                
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="flex items-center justify-center mt-2 text-green-400 text-xs"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>{t.statistics.stats[1].growth}</span>
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
              
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-center">
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
                  {t.statistics.stats[2].number}
                </motion.div>

                <div className="text-gray-300 text-sm md:text-base font-semibold">{t.statistics.stats[2].label}</div>
                
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="flex items-center justify-center mt-2 text-green-400 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  <span>{t.statistics.stats[2].growth}</span>
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
              
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-center">
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
                  {t.statistics.stats[3].number}
                </motion.div>

                <div className="text-gray-300 text-sm md:text-base font-semibold">{t.statistics.stats[3].label}</div>
                
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  className="flex items-center justify-center mt-2 text-yellow-400 text-xs"
                >
                  <div className="flex mr-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                  <span>{t.statistics.stats[3].growth}</span>
                </motion.div>
              </div>
            </motion.div>
          </div>


        </div>
      </section>

      {/* CTA SECTION - Ultra Luxurious Final Call */}
      <section className="relative section-padding overflow-hidden">
        {/* Background ultra-elegante con gradienti multipli */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-25/20 to-pink-25/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,207,232,0.12),transparent_70%)] opacity-80"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.9)_0deg,rgba(251,207,232,0.08)_120deg,rgba(255,255,255,0.95)_240deg,rgba(251,207,232,0.05)_360deg)]"></div>

        {/* Particelle fluttuanti finali */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-1/4 w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full opacity-40"
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-32 right-1/3 w-1.5 h-1.5 bg-gradient-to-r from-pink-300 to-rose-400 rounded-full opacity-30"
            animate={{
              y: [0, 20, 0],
              x: [0, -10, 0],
              scale: [1, 1.6, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>

        <div className="container-max text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.320, 1] }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Glow esterno spettacolare */}
            <div className="absolute -inset-8 bg-gradient-to-r from-rose-200/20 via-pink-300/30 to-rose-200/20 rounded-[3rem] blur-2xl opacity-60"></div>
            
            {/* Container principale con glassmorphism premium */}
            <div className="relative bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-12 md:p-16 shadow-2xl">
              {/* Pattern decorativo interno */}
              <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-rose-100/30 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-100/40 to-transparent rounded-full blur-2xl"></div>
              </div>

              {/* Badge premium */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/50 backdrop-blur-xl border border-white/30 rounded-full shadow-lg mb-8"
              >
                <motion.div
                  className="w-2 h-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <span className="text-sm font-bold text-gray-700">
                  Inizia la Rivoluzione Oggi
                </span>
                <Sparkles className="w-4 h-4 text-rose-500" />
              </motion.div>

              {/* Titolo principale spettacolare */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-2xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 leading-tight"
              >
                <span className="text-gray-900 block mb-1 md:mb-2">{t.cta.title}</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 block relative">
                  {t.cta.titleHighlight}
                  {/* Effetto shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 4,
                      ease: "easeInOut",
                    }}
                  />
                </span>
              </motion.h2>

              {/* Sottotitolo elegante */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="text-base md:text-2xl text-gray-700 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light"
              >
                {t.cta.subtitle} <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">{t.cta.subtitleHighlight}</span> che hanno già migliorato il loro servizio con HostGPT
              </motion.p>

              {/* Bottone CTA finale spettacolare */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                viewport={{ once: true }}
                className="relative"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group inline-block"
                >
                  {/* Glow esterno del bottone */}
                  <motion.div
                    className="absolute -inset-3 bg-gradient-to-r from-rose-400 to-pink-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                    whileHover={{ scale: 1.1 }}
                  />
                  
                  <Link
                    href="/register"
                    className="relative inline-flex items-center gap-2 md:gap-4 px-6 py-3 md:px-12 md:py-6 text-sm md:text-xl font-black text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 rounded-2xl md:rounded-3xl shadow-2xl transition-all duration-300 group-hover:shadow-rose-500/30 overflow-hidden"
                  >
                    {/* Effetto shimmer interno */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut",
                      }}
                    />
                    
                    <span className="relative z-10">{t.cta.button}</span>
                    <motion.div
                      whileHover={{ x: 8 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className="relative z-10"
                    >
                      <ArrowRight className="w-4 h-4 md:w-6 md:h-6" />
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>


            </div>

            {/* Decorazioni angolari eleganti */}
            <div className="absolute top-6 left-6 w-6 h-6 border-l-2 border-t-2 border-rose-300/50 rounded-tl-lg"></div>
            <div className="absolute top-6 right-6 w-6 h-6 border-r-2 border-t-2 border-pink-300/50 rounded-tr-lg"></div>
            <div className="absolute bottom-6 left-6 w-6 h-6 border-l-2 border-b-2 border-rose-300/50 rounded-bl-lg"></div>
            <div className="absolute bottom-6 right-6 w-6 h-6 border-r-2 border-b-2 border-pink-300/50 rounded-br-lg"></div>
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
                {t.footer.description}
              </p>
            </div>
            
              {/* Logo mobile */}
              <div className="md:hidden text-center mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Home className="w-6 h-6 text-primary" />
                  <span className="text-lg font-bold">HostGPT</span>
                </div>
                <p className="text-gray-400 text-xs">
                  {t.footer.description}
                </p>
              </div>
            </div>

            {/* Sezioni - Layout diverso per mobile/desktop */}
            <div className="grid grid-cols-3 gap-4 md:col-span-3 md:grid-cols-3 md:gap-8">
              <div className="text-center md:text-left">
                <h4 className="font-semibold mb-3 text-sm md:text-base">{t.footer.sections.product.title}</h4>
                <ul className="space-y-1 md:space-y-2 text-gray-400 text-xs md:text-sm">
                <li><Link href="#features" className="hover:text-white transition">{t.footer.sections.product.features}</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">{t.footer.sections.product.pricing}</Link></li>
                <li><Link href="#" className="hover:text-white transition">{t.footer.sections.product.api}</Link></li>
              </ul>
            </div>
            
              <div className="text-center md:text-left">
                <h4 className="font-semibold mb-3 text-sm md:text-base">{t.footer.sections.company.title}</h4>
                <ul className="space-y-1 md:space-y-2 text-gray-400 text-xs md:text-sm">
                <li><Link href="#" className="hover:text-white transition">{t.footer.sections.company.about}</Link></li>
                <li><Link href="#" className="hover:text-white transition">{t.footer.sections.company.blog}</Link></li>
                <li><Link href="#" className="hover:text-white transition">{t.footer.sections.company.contact}</Link></li>
              </ul>
            </div>
            
              <div className="text-center md:text-left">
                <h4 className="font-semibold mb-3 text-sm md:text-base">{t.footer.sections.legal.title}</h4>
                <ul className="space-y-1 md:space-y-2 text-gray-400 text-xs md:text-sm">
                  <li><Link href="/privacy" className="hover:text-white transition">{t.footer.sections.legal.privacy}</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition">{t.footer.sections.legal.terms}</Link></li>
                <li><Link href="#" className="hover:text-white transition">{t.footer.sections.legal.cookies}</Link></li>
              </ul>
              </div>
            </div>
          </div>
          
          {/* Separatore */}
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400 text-sm">{t.footer.copyright}</p>
          </div>
        </div>
      </footer>

      {/* Cookie Banner */}
      <CookieBanner />

    </div>
  )
}
