'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Send,
  Bot,
  User,
  Home,
  Loader2,
  MessageSquare,
  Info,
  X,
  RefreshCw,
  Moon,
  Sun,
  Clock,
  FileText,
  Mic,
  MicOff,
  Square
} from 'lucide-react'
import { chat } from '@/lib/api'
import toast from 'react-hot-toast'
import ChatbotIcon from '@/app/components/ChatbotIcon'
import MarkdownText from '@/app/components/MarkdownText'
import HostGPTLogo from '@/app/components/HostGPTLogo'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInfo {
  name: string
  property_name: string
  welcome_message: string
  has_icon: boolean
  id: number
  house_rules: string
}

export default function ChatWidgetPage() {
  const params = useParams()
  const uuid = params.uuid as string
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [showWelcome, setShowWelcome] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [subscriptionCancelled, setSubscriptionCancelled] = useState(false)
  const [freeTrialLimitReached, setFreeTrialLimitReached] = useState(false)
  const [freeTrialExpired, setFreeTrialExpired] = useState(false)
  const [language, setLanguage] = useState<'IT' | 'ENG'>('IT')
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Stati per registrazione audio
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingAudio, setIsProcessingAudio] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Testi multilingua
  const texts = {
    IT: {
      assistant: 'Assistente Virtuale',
      suggestedMessages: [
        "Contatta Host",
        "Attrazioni", 
        "Check-in/out"
      ],
      placeholder: "Scrivi un messaggio...",
      welcome: "Benvenuto!",
      welcomeSubtitle: "Sono qui per aiutarti con qualsiasi domanda sulla casa e sulla zona. Come posso esserti utile?",
      startChat: "Inizia la Chat",
      namePlaceholder: "Il tuo nome (opzionale)",
      writing: "Sto scrivendo...",
      loading: "Caricamento chatbot...",
      error: "Errore nell'invio del messaggio",
      notFound: "Chatbot non trovato",
      serviceUnavailable: "Servizio Non Disponibile",
      serviceUnavailableDesc: "L'host di questa struttura non utilizza più il servizio HostGPT. Il chatbot non è più disponibile.",
      contactHost: "Per assistenza, contatta direttamente l'host della struttura.",
      howCanIHelp: "Come posso aiutarti:",
      helpItems: [
        "Informazioni sulla casa e i servizi",
        "Orari di check-in e check-out", 
        "Consigli su ristoranti e attrazioni",
        "Informazioni sui trasporti",
        "Contatti di emergenza"
      ],
      freeTrialLimitReached: "Limite messaggi free trial raggiunto",
      freeTrialLimitReachedDesc: "L'host ha raggiunto il limite di messaggi del periodo di prova gratuito. Il servizio sarà ripristinato con l'abbonamento completo.",
      freeTrialExpired: "Periodo di prova scaduto",
      freeTrialExpiredDesc: "Il periodo di prova gratuito dell'host è scaduto. Il servizio sarà ripristinato con l'abbonamento completo."
    },
    ENG: {
      assistant: 'Virtual Assistant',
      suggestedMessages: [
        "Contact Host",
        "Attractions",
        "Check-in/out"
      ],
      placeholder: "Write a message...",
      welcome: "Welcome!",
      welcomeSubtitle: "I'm here to help you with any questions about the house and the area. How can I be useful?",
      startChat: "Start Chat",
      namePlaceholder: "Your name (optional)",
      writing: "I'm writing...",
      loading: "Loading chatbot...",
      error: "Error sending message",
      notFound: "Chatbot not found",
      serviceUnavailable: "Service Unavailable",
      serviceUnavailableDesc: "The host of this property no longer uses the HostGPT service. The chatbot is no longer available.",
      contactHost: "For assistance, contact the property host directly.",
      howCanIHelp: "How can I help you:",
      helpItems: [
        "Information about the house and services",
        "Check-in and check-out times",
        "Restaurant and attraction recommendations", 
        "Transportation information",
        "Emergency contacts"
      ],
      freeTrialLimitReached: "Free trial message limit reached",
      freeTrialLimitReachedDesc: "The host has reached the free trial message limit. Service will be restored with a complete subscription.",
      freeTrialExpired: "Free trial expired",
      freeTrialExpiredDesc: "The host's free trial period has expired. Service will be restored with a complete subscription."
    }
  }

  const currentTexts = texts[language]

  // Messaggi completi per i suggerimenti
  const fullMessages = {
    IT: {
      "Contatta Host": "Voglio contattare l'host. Come faccio?",
      "Attrazioni": "Vorrei visitare la zona, che attrazioni ci sono e come posso raggiungerle?",
      "Check-in/out": "Quali sono gli orari di check-in e check-out?"
    },
    ENG: {
      "Contact Host": "I want to contact the host. How can I do it?",
      "Attractions": "I'd like to visit the area, what attractions are there and how can I reach them?",
      "Check-in/out": "What are the check-in and check-out times?"
    }
  }

  const handleSuggestedMessage = async (suggestionKey: string) => {
    const fullMessage = fullMessages[language][suggestionKey as keyof typeof fullMessages[typeof language]]
    
    // Invia direttamente il messaggio
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: fullMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await chat.sendMessage(uuid, {
        content: fullMessage,
        thread_id: threadId,
        guest_name: guestName || undefined
      })

      if (!threadId) {
        setThreadId(response.data.thread_id)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      if (error.response?.status === 403) {
        const errorDetail = error.response?.data?.detail || ''
        if (errorDetail.includes('free trial') || errorDetail.includes('periodo di prova')) {
          if (errorDetail.includes('scaduto') || errorDetail.includes('expired')) {
            setFreeTrialExpired(true)
          } else {
            setFreeTrialLimitReached(true)
          }
        } else {
          setSubscriptionCancelled(true)
        }
      } else if (error.response?.status === 429) {
        const errorDetail = error.response?.data?.detail || ''
        if (errorDetail.includes('free trial') || errorDetail.includes('periodo di prova')) {
          setFreeTrialLimitReached(true)
        } else {
          toast.error(currentTexts.error)
        }
      } else {
        toast.error(currentTexts.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === 'IT' ? 'ENG' : 'IT')
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleNewConversation = () => {
    setMessages([])
    setThreadId(null)
    setInputMessage('')
    setShowWelcome(true)
    // Ricarica il messaggio di benvenuto
    if (chatInfo?.welcome_message) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: chatInfo.welcome_message,
        timestamp: new Date()
      }])
    }
  }

  const downloadHouseRulesPDF = async () => {
    if (!chatInfo?.house_rules || !chatInfo.house_rules.trim()) {
      toast.error(language === 'IT' ? 'Nessuna regola della casa disponibile' : 'No house rules available')
      return
    }

    try {
      // Chiama l'endpoint backend per generare il PDF usando l'API centralizzata
      console.log('📄 Calling PDF endpoint for UUID:', uuid, 'Language:', language)
      const response = await chat.downloadHouseRulesPDF(uuid, language)
      
      console.log('📄 PDF response received successfully')

      // Ottieni il blob del PDF dalla risposta
      const blob = response.data
      
      // Nome del file dalla header della risposta o default
      const contentDisposition = response.headers['content-disposition']
      let fileName = language === 'IT' 
        ? `REGOLE_${chatInfo.property_name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}.pdf`
        : `${chatInfo.property_name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_RULES.pdf`
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=(.+)/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1].replace(/"/g, '')
        }
      }

      // Crea un link temporaneo per il download (come per il QR code)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(language === 'IT' ? 'PDF delle regole scaricato' : 'House rules PDF downloaded')
    } catch (error) {
      console.error('Error downloading house rules PDF:', error)
      toast.error(language === 'IT' ? 'Errore nel download del PDF' : 'Error downloading PDF')
    }
  }

  useEffect(() => {
    loadChatInfo()
  }, [uuid])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatInfo = async () => {
    try {
      const response = await chat.getInfo(uuid)
      setChatInfo(response.data)
      
      // Aggiungi messaggio di benvenuto
      if (response.data.welcome_message) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: response.data.welcome_message,
          timestamp: new Date()
        }])
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setSubscriptionCancelled(true)
      } else {
        toast.error(currentTexts.notFound)
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await chat.sendMessage(uuid, {
        content: inputMessage,
        thread_id: threadId,
        guest_name: guestName || undefined
      })

      if (!threadId) {
        setThreadId(response.data.thread_id)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      if (error.response?.status === 403) {
        setSubscriptionCancelled(true)
      } else {
        toast.error(currentTexts.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Funzioni per registrazione audio
  const startRecording = async () => {
    try {
      // Verifica se siamo in un contesto sicuro (HTTPS o localhost)
      const isSecureContext = window.isSecureContext || location.hostname === 'localhost'
      if (!isSecureContext) {
        throw new Error('Registrazione audio richiede HTTPS. Usa https:// invece di http://')
      }
      
      // Verifica se MediaRecorder è supportato
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder non supportato da questo browser')
      }
      
      // Verifica se getUserMedia è supportato
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia non supportato da questo browser')
      }
      
      // Richiedi esplicitamente i permessi del microfono
      console.log('🎤 Richiesta permessi microfono...')
      console.log('🎤 Contesto sicuro:', window.isSecureContext)
      console.log('🎤 Hostname:', location.hostname)
      console.log('🎤 Protocollo:', location.protocol)
      console.log('🎤 User Agent:', navigator.userAgent)
      
      // Su mobile, forziamo il popup con un timeout
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      if (isMobile) {
        console.log('🎤 Rilevato dispositivo mobile, forzando popup permessi...')
        // Su mobile, il popup appare solo dopo un piccolo delay
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Controlla se i permessi sono già stati negati
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        console.log('🎤 Stato permessi microfono:', permissionStatus.state)
        if (permissionStatus.state === 'denied') {
          throw new Error('Permessi microfono negati in precedenza. Abilitali nelle impostazioni del browser.')
        }
      } catch (e) {
        console.log('🎤 Impossibile controllare stato permessi:', e)
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      console.log('🎤 Permessi microfono concessi')
      console.log('🎤 Stream attivo:', stream.active)
      console.log('🎤 Track audio:', stream.getAudioTracks().length)
      
      // Verifica che ci sia almeno un track audio
      if (stream.getAudioTracks().length === 0) {
        throw new Error('Nessun track audio disponibile')
      }
      
      // Prova diversi formati audio supportati
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4'
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav'
          }
        }
      }
      
      console.log('🎤 Usando formato audio:', mimeType)
      const recorder = new MediaRecorder(stream, { mimeType })
      
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        console.log('🎤 Chunk ricevuto:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = async () => {
        console.log('🎤 Registrazione fermata, chunks totali:', chunks.length)
        const audioBlob = new Blob(chunks, { type: mimeType })
        console.log('🎤 Blob creato:', audioBlob.size, 'bytes, tipo:', audioBlob.type)
        
        if (audioBlob.size === 0) {
          console.error('🎤 ERRORE: File audio vuoto!')
          console.error('🎤 Chunks ricevuti:', chunks.length)
          console.error('🎤 Dimensione chunks:', chunks.map(c => c.size))
          toast.error('Errore nella registrazione audio. Assicurati di parlare durante la registrazione.')
          stream.getTracks().forEach(track => track.stop())
          return
        }
        
        await sendVoiceMessage(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      setMediaRecorder(recorder)
      recorder.start(100) // Raccoglie dati ogni 100ms
      setIsRecording(true)
      console.log('🎤 Registrazione iniziata')
      
      // Mostra istruzioni all'utente
      toast.success('🎤 Registrazione iniziata! Parla ora e clicca di nuovo per fermare.', { duration: 3000 })
    } catch (error: any) {
      console.error('Errore accesso microfono:', error)
      
      if (error.name === 'NotAllowedError') {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (isMobile) {
          // Su mobile, mostra un toast semplice
          toast.error('🚫 Permessi microfono negati. Vai in Impostazioni > Privacy > Microfono e abilita l\'accesso per questo sito.', { 
            duration: 8000
          })
        } else {
          // Su desktop, mostra un toast semplice
          toast.error('🚫 Permessi microfono negati. Clicca sull\'icona del microfono nella barra degli indirizzi e abilita l\'accesso.', { 
            duration: 8000
          })
        }
      } else if (error.name === 'NotFoundError') {
        toast.error('🎤 Microfono non trovato. Verifica che sia collegato e funzionante.')
      } else if (error.name === 'NotSupportedError') {
        toast.error('❌ Registrazione audio non supportata da questo browser. Prova con Chrome, Firefox o Safari.')
      } else if (error.message.includes('HTTPS')) {
        toast.error('🔒 Registrazione audio richiede HTTPS. Usa https:// invece di http://')
      } else if (error.message.includes('negati in precedenza')) {
        // Mostra un toast semplice
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (isMobile) {
          toast.error('🚫 Permessi microfono negati in precedenza. Vai in Impostazioni > Privacy > Microfono e abilita l\'accesso per questo sito.', { 
            duration: 8000
          })
        } else {
          toast.error('🚫 Permessi microfono negati in precedenza. Clicca sull\'icona del microfono nella barra degli indirizzi e abilita l\'accesso.', { 
            duration: 8000
          })
        }
      } else {
        toast.error(`❌ Errore microfono: ${error.message}`)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      console.log('🎤 Fermando registrazione...')
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const sendVoiceMessage = async (audioBlob: Blob) => {
    setIsProcessingAudio(true)
    
    try {
      console.log('🎤 Inizio invio messaggio vocale...')
      
      const response = await chat.sendVoiceMessage(uuid, audioBlob, threadId || undefined, guestName || undefined)
      
      console.log('🎤 Response data:', response.data)
      
      if (!threadId) {
        setThreadId(response.data.thread_id)
      }

      // Aggiungi messaggio utente (testo trascritto)
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: response.data.transcribed_text,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])

      // Aggiungi risposta assistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      toast.success('Messaggio vocale inviato!')
    } catch (error: any) {
      console.error('Errore invio messaggio vocale:', error)
      if (error.response?.status === 403) {
        setSubscriptionCancelled(true)
      } else {
        toast.error('Errore nel processare il messaggio vocale')
      }
    } finally {
      setIsProcessingAudio(false)
    }
  }

  const handleStartChat = () => {
    setShowWelcome(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  if (!chatInfo && !subscriptionCancelled) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{currentTexts.loading}</p>
        </div>
      </div>
    )
  }

  if (subscriptionCancelled) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentTexts.serviceUnavailable}</h1>
            <p className="text-gray-600 mb-6">
              {currentTexts.serviceUnavailableDesc}
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">
                {currentTexts.contactHost}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-primary/5 to-accent/5'
    }`} style={{ overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Header - FISSO */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm flex-shrink-0 border-b transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto px-2 py-2 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {chatInfo ? (
                <ChatbotIcon 
                  chatbotUuid={uuid} 
                  hasIcon={chatInfo.has_icon} 
                  size="md" 
                  className="mr-3"
                  noBorder={true}
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <HostGPTLogo size="sm" className="text-white" />
                </div>
              )}
              <div>
                <h1 className={`font-semibold text-lg transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{chatInfo?.name}</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>{currentTexts.assistant}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewConversation}
                className={`p-2 rounded-lg transition-colors duration-200 group ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title="Nuova conversazione"
              >
                <RefreshCw className={`w-5 h-5 transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-300 group-hover:text-primary' : 'text-gray-600 group-hover:text-primary'
                }`} />
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:from-primary/20 hover:to-accent/20 hover:border-primary/40 transition-all duration-200"
              >
                {language}
              </button>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors duration-200 group ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title={isDarkMode ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
              >
                {isDarkMode ? (
                  <Sun className={`w-5 h-5 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-300 group-hover:text-primary' : 'text-gray-600 group-hover:text-primary'
                  }`} />
                ) : (
                  <Moon className={`w-5 h-5 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-300 group-hover:text-primary' : 'text-gray-600 group-hover:text-primary'
                  }`} />
                )}
              </button>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={`p-2 rounded-lg transition ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <Info className={`w-5 h-5 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel - FISSO */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-b border-blue-200 flex-shrink-0"
        >
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-blue-800 mb-2">
                  <strong>{currentTexts.howCanIHelp}</strong>
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {currentTexts.helpItems.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Chat Area - FISSA */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-[6vh] md:pt-6 md:pb-6 overflow-hidden justify-start">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden flex flex-col h-[68vh] md:h-full transition-colors duration-300`}>
          {/* Error States */}
          {subscriptionCancelled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center flex-1 flex flex-col justify-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-10 h-10 text-red-500" />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                {currentTexts.serviceUnavailable}
              </h2>
              <p className={`mb-6 max-w-md mx-auto transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentTexts.serviceUnavailableDesc}
              </p>
              <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentTexts.contactHost}
              </p>
            </motion.div>
          )}

          {freeTrialLimitReached && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center flex-1 flex flex-col justify-center"
            >
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                {currentTexts.freeTrialLimitReached}
              </h2>
              <p className={`mb-6 max-w-md mx-auto transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentTexts.freeTrialLimitReachedDesc}
              </p>
            </motion.div>
          )}

          {freeTrialExpired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center flex-1 flex flex-col justify-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-red-500" />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                {currentTexts.freeTrialExpired}
              </h2>
              <p className={`mb-6 max-w-md mx-auto transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentTexts.freeTrialExpiredDesc}
              </p>
            </motion.div>
          )}

          {/* Welcome Screen */}
          {showWelcome && messages.length <= 1 && !subscriptionCancelled && !freeTrialLimitReached && !freeTrialExpired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center flex-1 flex flex-col justify-center"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{currentTexts.welcome}</h2>
              <p className={`mb-6 max-w-md mx-auto transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentTexts.welcomeSubtitle}
              </p>
              <div className="mb-6">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={currentTexts.namePlaceholder}
                  className={`max-w-xs mx-auto px-4 py-3 rounded-lg border transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  } outline-none`}
                />
              </div>
              <button
                onClick={handleStartChat}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold hover:from-secondary hover:to-accent transition-all duration-200"
              >
                {currentTexts.startChat}
              </button>
            </motion.div>
          )}

          {/* Messages Area - FISSA */}
          {(!showWelcome || messages.length > 1) && !subscriptionCancelled && !freeTrialLimitReached && !freeTrialExpired && (
            <>
              <div className="flex-1 overflow-y-auto chat-scrollbar p-2 md:p-6 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
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
                          : chatInfo && chatInfo.has_icon 
                            ? 'bg-transparent text-gray-600 mr-3' 
                            : 'bg-gray-200 text-gray-600 mr-3'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          chatInfo && chatInfo.has_icon ? (
                            <ChatbotIcon 
                              chatbotUuid={uuid} 
                              hasIcon={chatInfo.has_icon} 
                              size="sm" 
                              className="w-8 h-8" 
                              noBorder={true}
                            />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )
                        )}
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}>
                        <MarkdownText content={message.content} />
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
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-gray-600">{currentTexts.writing}</span>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Messaggi Suggeriti - SU UNA RIGA SOLA - Disabilitati durante il caricamento */}
              <div className={`border-t p-2 transition-colors duration-300 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <div className="flex justify-center items-center gap-2 md:gap-3 overflow-x-auto">
                  {/* Pulsante Download Regole Casa - Blu e nella sezione suggerimenti */}
                  {chatInfo?.house_rules && (
                    <button
                      onClick={downloadHouseRulesPDF}
                      className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors duration-200 flex-shrink-0"
                      title={language === 'IT' ? 'Scarica regole della casa' : 'Download house rules'}
                    >
                      <FileText className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {currentTexts.suggestedMessages.map((message: string, index: number) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => !isLoading && handleSuggestedMessage(message)}
                      disabled={isLoading}
                      className={`px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0 ${
                        isLoading 
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
              <div className={`border-t p-3 md:p-4 pb-12 md:pb-2 mb-[2vh] md:mb-0 safe-bottom flex-shrink-0 transition-colors duration-300 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={currentTexts.placeholder}
                    disabled={isLoading || isProcessingAudio}
                    className={`flex-1 px-3 md:px-4 py-1.5 md:py-2.5 rounded-full border outline-none transition text-sm md:text-base ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  
                  {/* Pulsante microfono */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || isProcessingAudio}
                    className={`w-8 h-8 md:w-11 md:h-11 rounded-full flex items-center justify-center transition ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    } ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isRecording ? 'Ferma registrazione' : 'Inizia registrazione vocale'}
                  >
                    {isRecording ? (
                      <Square className="w-3 h-3 md:w-5 md:h-5" />
                    ) : (
                      <Mic className="w-3 h-3 md:w-5 md:h-5" />
                    )}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading || isProcessingAudio || !inputMessage.trim()}
                    className="w-8 h-8 md:w-11 md:h-11 bg-gradient-to-r from-primary to-secondary text-white rounded-full flex items-center justify-center hover:from-secondary hover:to-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingAudio ? (
                      <Loader2 className="w-3 h-3 md:w-5 md:h-5 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3 md:w-5 md:h-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>


      </div>
    </div>
  )
}
