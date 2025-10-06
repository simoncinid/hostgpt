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
  Square,
  Upload,
  Camera,
  Check,
  AlertCircle,
  Wifi,
  Phone
} from 'lucide-react'
import { chat } from '@/lib/api'
import toast from 'react-hot-toast'
import ChatbotIcon from '@/app/components/ChatbotIcon'
import MarkdownText from '@/app/components/MarkdownText'
import OspiterAILogo from '@/app/components/OspiterAILogo'
import CountrySelector from '@/app/components/CountrySelector'

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
  reviews_link?: string
  wifi_info?: {
    network?: string
    name?: string
    password?: string
  }
  has_wifi_qr_code?: boolean
}

export default function ChatWidgetPage() {
  const params = useParams()
  const uuid = params.uuid as string
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [showWelcome, setShowWelcome] = useState(true)
  
  // Stati per identificazione ospite
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [selectedCountryCode, setSelectedCountryCode] = useState('+39')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [guestData, setGuestData] = useState<{
    id?: number
    phone?: string
    email?: string
    first_name?: string
    last_name?: string
    is_first_time_guest?: boolean
  } | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [subscriptionCancelled, setSubscriptionCancelled] = useState(false)
  const [freeTrialLimitReached, setFreeTrialLimitReached] = useState(false)
  const [freeTrialExpired, setFreeTrialExpired] = useState(false)
  const [language, setLanguage] = useState<'IT' | 'ENG'>('IT')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspensionMessage, setSuspensionMessage] = useState('')
  
  // Stati per WiFi e emergenza
  const [wifiInfo, setWifiInfo] = useState<{
    network?: string
    password?: string
    qr_code?: string
  } | null>(null)
  
  // Stati per registrazione audio
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingAudio, setIsProcessingAudio] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  
  // Stati per check-in automatico
  const [showCheckinPopup, setShowCheckinPopup] = useState(false)
  const [checkinFiles, setCheckinFiles] = useState<File[]>([])
  const [checkinConsent, setCheckinConsent] = useState(false)
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Testi multilingua
  const texts = {
    IT: {
      assistant: 'Assistente Virtuale',
      suggestedMessages: [
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
      serviceUnavailableDesc: "L'host di questa struttura non utilizza più il servizio OspiterAI. Il chatbot non è più disponibile.",
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
      freeTrialExpiredDesc: "Il periodo di prova gratuito dell'host è scaduto. Il servizio sarà ripristinato con l'abbonamento completo.",
      welcomeMessage: "Ciao! Sono qui per aiutarti con qualsiasi domanda sulla casa e sulla zona. Come posso esserti utile?",
      checkinButton: "Check-in Automatico",
      checkinTitle: "Check-in Automatico",
      checkinDescription: "Carica fino a 10 immagini (JPEG/PNG) per il check-in automatico",
      checkinUploadLabel: "Seleziona immagini JPEG/PNG o scatta foto",
      checkinConsentText: "Acconsento all'invio di questi documenti via email alla struttura ricettiva per il check-in. I dati non verranno salvati da OspiterAI.",
      checkinSubmit: "Invia Documenti",
      checkinSuccess: "Documenti inviati con successo!",
      checkinError: "Errore nell'invio dei documenti",
      checkinMaxFiles: "Massimo 10 file consentiti"
    },
    ENG: {
      assistant: 'Virtual Assistant',
      suggestedMessages: [
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
      serviceUnavailableDesc: "The host of this property no longer uses the OspiterAI service. The chatbot is no longer available.",
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
      freeTrialExpiredDesc: "The host's free trial period has expired. Service will be restored with a complete subscription.",
      welcomeMessage: "Hello! I'm here to help you with any questions about the house and the area. How can I be useful?",
      checkinButton: "Automatic Check-in",
      checkinTitle: "Automatic Check-in",
      checkinDescription: "Upload up to 10 images (JPEG/PNG) for automatic check-in",
      checkinUploadLabel: "Select JPEG/PNG images or take photos",
      checkinConsentText: "I consent to sending these documents via email to the accommodation for check-in purposes. Data will not be saved by OspiterAI.",
      checkinSubmit: "Send Documents",
      checkinSuccess: "Documents sent successfully!",
      checkinError: "Error sending documents",
      checkinMaxFiles: "Maximum 10 files allowed"
    }
  }

  const currentTexts = texts[language]

  // Messaggi completi per i suggerimenti
  const fullMessages = {
    IT: {
      "Attrazioni": "Vorrei visitare la zona, che attrazioni ci sono e come posso raggiungerle?",
      "Check-in/out": "Quali sono gli orari di check-in e check-out?"
    },
    ENG: {
      "Attractions": "I'd like to visit the area, what attractions are there and how can I reach them?",
      "Check-in/out": "What are the check-in and check-out times?"
    }
  }

  const handleSuggestedMessage = async (suggestionKey: string) => {
    const fullMessage = fullMessages[language][suggestionKey as keyof typeof fullMessages[typeof language]]
    
    // Verifica se la chat è sospesa
    if (isSuspended) {
      toast.error('La chat è temporaneamente sospesa. L\'host risponderà presto.')
      return
    }
    
    // IMPORTANTE: Verifica che i dati guest siano presenti
    if (!guestData?.id) {
      console.error('❌ [ERROR] Dati guest mancanti, impossibile inviare messaggio suggerito')
      toast.error(language === 'IT' ? 'Errore: dati ospite non trovati. Ricarica la pagina.' : 'Error: guest data not found. Please refresh the page.')
      return
    }
    
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
        guest_name: guestName || undefined,
        // IMPORTANTE: Passa sempre il guest_id!
        guest_id: guestData?.id,
        phone: guestData?.phone,
        email: guestData?.email,
        first_name: guestData?.first_name,
        last_name: guestData?.last_name,
        force_new_conversation: false
      })

      // Se non abbiamo ancora un thread_id, lo salviamo
      if (!threadId) {
        setThreadId(response.data.thread_id)
        // Salva il threadId nel localStorage
        localStorage.setItem(`thread_id_${uuid}`, response.data.thread_id)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Controlla se la conversazione è stata sospesa dopo l'invio del messaggio suggerito
      try {
        const statusResponse = await chat.getStatus(uuid, response.data.thread_id)
        if (statusResponse.data.suspended) {
          setIsSuspended(true)
          setSuspensionMessage(statusResponse.data.message)
        }
      } catch (error) {
        console.error('Errore nel controllo dello stato dopo invio messaggio suggerito:', error)
      }
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
      } else if (error.response?.status === 423) {
        // Chat sospesa per alert Guardian
        const errorDetail = error.response?.data?.detail || ''
        setIsSuspended(true)
        setSuspensionMessage(errorDetail)
        toast.error(errorDetail)
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

  // Funzione per gestire l'emergenza (si comporta come "contatta host")
  const handleEmergency = async () => {
    const emergencyMessage = language === 'IT' 
      ? "Voglio contattare l'host. Come faccio?"
      : "I want to contact the host. How can I do it?"
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: emergencyMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await chat.sendMessage(uuid, {
        content: emergencyMessage,
        thread_id: threadId,
        guest_name: guestName || undefined,
        guest_id: guestData?.id,
        phone: guestData?.phone,
        email: guestData?.email,
        first_name: guestData?.first_name,
        last_name: guestData?.last_name,
        force_new_conversation: false
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

  // Funzione per mostrare le informazioni WiFi
  const handleWifiInfo = async () => {
    if (!chatInfo?.wifi_info && !chatInfo?.has_wifi_qr_code) {
      toast.error(language === 'IT' ? 'Informazioni WiFi non disponibili' : 'WiFi information not available')
      return
    }

    const wifiData = chatInfo.wifi_info || {}
    const networkName = wifiData.network || wifiData.name || ''
    const password = wifiData.password || ''
    
    // Crea il messaggio base con le informazioni WiFi
    let wifiMessage = language === 'IT' 
      ? `**Informazioni WiFi**\n\n` +
        (networkName ? `**Nome rete:** ${networkName}\n` : '') +
        (password ? `**Password:** ${password}\n` : '')
      : `**WiFi Information**\n\n` +
        (networkName ? `**Network name:** ${networkName}\n` : '') +
        (password ? `**Password:** ${password}\n` : '')
    
    // Se c'è un QR code, lo scarichiamo e lo includiamo nel messaggio
    if (chatInfo.has_wifi_qr_code) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const qrResponse = await fetch(`${API_URL}/api/chat/${uuid}/wifi-qr-code`)
        if (qrResponse.ok) {
          const qrBlob = await qrResponse.blob()
          
          // Converti il blob in base64
          const reader = new FileReader()
          reader.onload = () => {
            const base64String = reader.result as string
            
            // Aggiungi il QR code al messaggio
            wifiMessage += language === 'IT' 
              ? `\n**QR Code:**\n\n<img src="${base64String}" alt="QR Code WiFi" style="max-width: 200px; height: auto; border-radius: 8px;" />`
              : `\n**QR Code:**\n\n<img src="${base64String}" alt="WiFi QR Code" style="max-width: 200px; height: auto; border-radius: 8px;" />`
            
            const assistantMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: wifiMessage,
              timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
          }
          reader.readAsDataURL(qrBlob)
          return // Esci dalla funzione, il messaggio verrà aggiunto nel callback
        }
      } catch (error) {
        console.error('Errore nel caricamento del QR code WiFi:', error)
      }
    }
    
    // Se non c'è QR code o se c'è stato un errore, aggiungi solo il messaggio base
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: wifiMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, assistantMessage])
  }


  const downloadHouseRulesPDF = async () => {
    if (isDownloadingPDF) return // Evita doppi click
    
    setIsDownloadingPDF(true)
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
        ? `INFO_${chatInfo?.property_name?.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() || 'PROPRIETA'}.pdf`
        : `${chatInfo?.property_name?.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() || 'PROPERTY'}_INFO.pdf`
      
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

      toast.success(language === 'IT' ? 'PDF delle informazioni scaricato' : 'Property information PDF downloaded')
    } catch (error) {
      console.error('Error downloading property info PDF:', error)
      toast.error(language === 'IT' ? 'Errore nel download del PDF' : 'Error downloading PDF')
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  useEffect(() => {
    // Reset dello stato al cambio di UUID (refresh)
    setMessages([])
    setInputMessage('')
    setShowWelcome(true)
    setGuestData(null)
    setGuestPhone('')
    setGuestEmail('')
    setPhoneNumber('')
    setSelectedCountryCode('+39')
    
    // Controlla se c'è una conversazione esistente salvata
    const savedGuestId = localStorage.getItem(`guest_id_${uuid}`)
    const savedConversationId = localStorage.getItem(`conversation_id_${uuid}`)
    const savedThreadId = localStorage.getItem(`thread_id_${uuid}`)
    
    console.log('🔄 [DEBUG] useEffect - savedGuestId:', savedGuestId)
    console.log('🔄 [DEBUG] useEffect - savedConversationId:', savedConversationId)
    console.log('🔄 [DEBUG] useEffect - savedThreadId:', savedThreadId)
    
    if (savedGuestId && savedConversationId) {
      // Ripristina la conversazione esistente
      console.log('🔄 [DEBUG] Ripristinando conversazione esistente')
      setConversationId(parseInt(savedConversationId))
      setThreadId(savedThreadId || null)
      
      // Carica i messaggi della conversazione esistente
      loadExistingConversation(parseInt(savedConversationId))
    } else {
      // Nessuna conversazione salvata, reset completo
      setConversationId(null)
      setThreadId(null)
      loadChatInfo(null)
    }
  }, [uuid])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Controlla lo stato della chat (se è sospesa)
  useEffect(() => {
    const checkChatStatus = async () => {
      if (threadId) {
        try {
          const response = await chat.getStatus(uuid, threadId)
          if (response.data.suspended) {
            setIsSuspended(true)
            setSuspensionMessage(response.data.message)
          } else {
            setIsSuspended(false)
            setSuspensionMessage('')
          }
        } catch (error) {
          console.error('Errore nel controllo dello stato della chat:', error)
        }
      }
    }

    checkChatStatus()
  }, [threadId, uuid])

  // Controllo periodico dello stato della chat quando è sospesa
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    if (isSuspended && threadId) {
      // Controlla ogni 10 secondi se la chat è stata sbloccata
      intervalId = setInterval(async () => {
        try {
          const statusResponse = await chat.getStatus(uuid, threadId)
          if (!statusResponse.data.suspended) {
            // La chat è stata sbloccata!
            setIsSuspended(false)
            setSuspensionMessage('')
            toast.success(language === 'IT' ? 'Chat sbloccata! Puoi continuare la conversazione.' : 'Chat unlocked! You can continue the conversation.')
            
            // Pulisci l'interval
            if (intervalId) {
              clearInterval(intervalId)
            }
          }
        } catch (error) {
          console.error('Errore nel controllo dello stato della chat:', error)
        }
      }, 10000) // Controlla ogni 10 secondi
    }
    
    // Cleanup dell'interval quando il componente si smonta o la chat non è più sospesa
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isSuspended, threadId, uuid, language])

  const loadExistingConversation = async (conversationId: number) => {
    try {
      console.log('🔄 [DEBUG] Caricando conversazione esistente:', conversationId)
      
      // Carica le informazioni del chatbot
      const response = await chat.getInfo(uuid)
      setChatInfo(response.data)
      
      // IMPORTANTE: Carica i dati guest dal localStorage
      const savedGuestId = localStorage.getItem(`guest_id_${uuid}`)
      const savedGuestPhone = localStorage.getItem(`guest_phone_${uuid}`)
      const savedGuestEmail = localStorage.getItem(`guest_email_${uuid}`)
      const savedGuestFirstName = localStorage.getItem(`guest_first_name_${uuid}`)
      const savedGuestLastName = localStorage.getItem(`guest_last_name_${uuid}`)
      
      if (savedGuestId) {
        setGuestData({
          id: parseInt(savedGuestId),
          phone: savedGuestPhone || undefined,
          email: savedGuestEmail || undefined,
          first_name: savedGuestFirstName || undefined,
          last_name: savedGuestLastName || undefined,
          is_first_time_guest: false
        })
        console.log('🔄 [DEBUG] Dati guest caricati dal localStorage:', {
          id: savedGuestId,
          phone: savedGuestPhone,
          email: savedGuestEmail
        })
      }
      
      // Carica i messaggi della conversazione esistente
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const messagesResponse = await fetch(`${API_URL}/api/chat/${uuid}/conversation/${conversationId}/messages`)
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        const formattedMessages = messagesData.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          id: msg.id || Date.now() + Math.random(),
          role: (msg.role || 'assistant') as 'assistant' | 'user',
          content: msg.content || ''
        }))
        setMessages(formattedMessages || [])
        console.log('🔄 [DEBUG] Messaggi caricati per conversazione esistente:', formattedMessages.length)
        
        // Non mostrare la schermata di identificazione se abbiamo messaggi
        if (formattedMessages.length > 0) {
          setShowWelcome(false)
        }
        
        // Controlla se la conversazione è sospesa per alert Guardian
        // Usa threadId se disponibile, altrimenti usa conversationId
        const statusThreadId = threadId || `conv_${conversationId}`
        try {
          const statusResponse = await chat.getStatus(uuid, statusThreadId)
          if (statusResponse.data.suspended) {
            setIsSuspended(true)
            setSuspensionMessage(statusResponse.data.message)
          } else {
            setIsSuspended(false)
            setSuspensionMessage('')
          }
        } catch (error) {
          console.error('Errore nel controllo dello stato della conversazione esistente:', error)
        }
      } else {
        console.error('Errore nel caricamento messaggi conversazione esistente')
        // Se non riusciamo a caricare i messaggi, mostra la schermata di identificazione
        setShowWelcome(true)
      }
      
    } catch (error) {
      console.error('Errore nel caricamento conversazione esistente:', error)
      // In caso di errore, mostra la schermata di identificazione
      setShowWelcome(true)
    }
  }

  const loadChatInfo = async (savedGuestId?: number | null) => {
    try {
      const response = await chat.getInfo(uuid)
      setChatInfo(response.data)
      
      // NUOVO FLUSSO: Se c'è un guest_id salvato, crea immediatamente una nuova conversazione
      if (savedGuestId) {
        console.log('🔄 [DEBUG] Refresh con guest_id salvato:', savedGuestId)
        try {
          // Crea SEMPRE una nuova conversazione con il guest_id salvato (per refresh)
          const welcomeResponse = await chat.createFreshConversation(uuid, savedGuestId)
          console.log('🔄 [DEBUG] Nuova conversazione FRESCA creata al refresh:', welcomeResponse.data)
          
          // Salva l'ID della nuova conversazione MA NON caricare i messaggi ancora
          setConversationId(welcomeResponse.data.conversation_id)
          setThreadId(null) // Nessun thread ancora
          
          // NON caricare i messaggi ora - li caricheremo dopo l'identificazione
          // Mantieni la lista messaggi vuota per mostrare solo la schermata di identificazione
          setMessages([])
          
          console.log('🔄 [DEBUG] Conversazione creata, ID salvato, messaggi nascosti per identificazione')
          toast.success(language === 'IT' ? 'Nuova conversazione creata al refresh' : 'New conversation created on refresh')
        } catch (error: any) {
          console.error('Errore nel creare conversazione al refresh:', error)
          
          // Gestisci errore limite conversazioni
          if (error.response?.status === 429) {
            const errorDetail = error.response?.data?.detail || ''
            toast.error(errorDetail || (language === 'IT' ? 'Limite conversazioni raggiunto' : 'Conversation limit reached'))
            // NON rimuovere il guest_id, l'utente può ancora identificarsi per vedere conversazioni esistenti
            setMessages([])
          } else {
            // Altri errori - rimuovi il guest_id salvato e procedi normalmente
            localStorage.removeItem(`guest_id_${uuid}`)
            setMessages([])
          }
        }
      } else {
        // Nessun guest salvato, inizializza normalmente
        setMessages([])
      }
      
      // Mostra sempre la schermata di identificazione dopo il refresh
      setShowWelcome(true)
      
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

    // Verifica se la chat è sospesa
    if (isSuspended) {
      toast.error('La chat è temporaneamente sospesa. L\'host risponderà presto.')
      return
    }

    // IMPORTANTE: Verifica che i dati guest siano presenti
    if (!guestData?.id) {
      console.error('❌ [ERROR] Dati guest mancanti, impossibile inviare messaggio')
      toast.error(language === 'IT' ? 'Errore: dati ospite non trovati. Ricarica la pagina.' : 'Error: guest data not found. Please refresh the page.')
      return
    }

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
        guest_name: guestName || undefined,
        // IMPORTANTE: Passa sempre il guest_id!
        guest_id: guestData?.id,
        phone: guestData?.phone,
        email: guestData?.email,
        first_name: guestData?.first_name,
        last_name: guestData?.last_name,
        force_new_conversation: false
      })

      // Se non abbiamo ancora un thread_id, lo salviamo
      if (!threadId) {
        setThreadId(response.data.thread_id)
        // Salva il threadId nel localStorage
        localStorage.setItem(`thread_id_${uuid}`, response.data.thread_id)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Controlla se la conversazione è stata sospesa dopo l'invio del messaggio
      try {
        const statusResponse = await chat.getStatus(uuid, response.data.thread_id)
        if (statusResponse.data.suspended) {
          setIsSuspended(true)
          setSuspensionMessage(statusResponse.data.message)
        }
      } catch (error) {
        console.error('Errore nel controllo dello stato dopo invio messaggio:', error)
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setSubscriptionCancelled(true)
      } else if (error.response?.status === 423) {
        // Chat sospesa per alert Guardian
        const errorDetail = error.response?.data?.detail || ''
        setIsSuspended(true)
        setSuspensionMessage(errorDetail)
        toast.error(errorDetail)
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
    
    // IMPORTANTE: Verifica che i dati guest siano presenti
    if (!guestData?.id) {
      console.error('❌ [ERROR] Dati guest mancanti, impossibile inviare messaggio vocale')
      toast.error(language === 'IT' ? 'Errore: dati ospite non trovati. Ricarica la pagina.' : 'Error: guest data not found. Please refresh the page.')
      setIsProcessingAudio(false)
      return
    }
    
    try {
      console.log('🎤 Inizio invio messaggio vocale...')
      
      const response = await chat.sendVoiceMessage(uuid, audioBlob, threadId || undefined, guestName || undefined, {
        guest_id: guestData.id,
        phone: guestData?.phone,
        email: guestData?.email,
        first_name: guestData?.first_name,
        last_name: guestData?.last_name,
        force_new_conversation: false
      })
      
      console.log('🎤 Response data:', response.data)
      
      // Se non abbiamo ancora un thread_id, lo salviamo
      if (!threadId) {
        setThreadId(response.data.thread_id)
        // Salva il threadId nel localStorage
        localStorage.setItem(`thread_id_${uuid}`, response.data.thread_id)
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

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value)
    // Non aggiornare guestPhone qui, lo faremo in handleStartChat
  }

  const handleStartChat = async () => {
    // Costruisci il numero completo con il prefisso corretto
    const fullPhoneNumber = phoneNumber ? selectedCountryCode + phoneNumber : ''
    
    // Validazione base - almeno uno tra telefono ed email deve essere fornito
    if (!fullPhoneNumber && !guestEmail) {
      toast.error(language === 'IT' ? 'È necessario fornire almeno il numero di telefono o l\'email' : 'At least phone number or email is required')
      return
    }

    try {
      // Identifica l'ospite
      const response = await chat.identifyGuest(uuid, {
        phone: fullPhoneNumber || undefined,
        email: guestEmail || undefined
      })
      
      const guestInfo = response.data
      
      setGuestData({
        id: guestInfo.guest_id,
        phone: fullPhoneNumber,
        email: guestInfo.email,
        first_name: guestInfo.first_name,
        last_name: guestInfo.last_name,
        is_first_time_guest: guestInfo.is_first_time_guest
      })
      
      // IMPORTANTE: Salva tutti i dati guest nel localStorage per i refresh futuri
      console.log('💾 [DEBUG] Salvando dati guest nel localStorage:', guestInfo.guest_id, 'key:', `guest_id_${uuid}`)
      localStorage.setItem(`guest_id_${uuid}`, guestInfo.guest_id.toString())
      localStorage.setItem(`guest_phone_${uuid}`, fullPhoneNumber)
      localStorage.setItem(`guest_email_${uuid}`, guestInfo.email || '')
      localStorage.setItem(`guest_first_name_${uuid}`, guestInfo.first_name || '')
      localStorage.setItem(`guest_last_name_${uuid}`, guestInfo.last_name || '')
      console.log('💾 [DEBUG] Verifico salvataggio localStorage:', localStorage.getItem(`guest_id_${uuid}`))
      
      // Controlla se esiste una conversazione esistente
      console.log('🔍 [DEBUG] guestInfo:', guestInfo)
      console.log('🔍 [DEBUG] has_existing_conversation:', guestInfo.has_existing_conversation)
      console.log('🔍 [DEBUG] existing_conversation_id:', guestInfo.existing_conversation_id)
      
      // Controlla se abbiamo già una conversazione creata al refresh
      if (conversationId) {
        // Abbiamo già una conversazione creata al refresh, mantienila e carica i messaggi
        console.log('🔄 [DEBUG] Usando conversazione creata al refresh:', conversationId)
        
        // Salva lo stato della conversazione nel localStorage
        localStorage.setItem(`conversation_id_${uuid}`, conversationId.toString())
        if (threadId) {
          localStorage.setItem(`thread_id_${uuid}`, threadId)
        }
        
        // Ora carica i messaggi della conversazione creata al refresh
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          const messagesResponse = await fetch(`${API_URL}/api/chat/${uuid}/conversation/${conversationId}/messages`)
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
            const formattedMessages = messagesData.messages.map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              id: msg.id || Date.now() + Math.random(),
              role: (msg.role || 'assistant') as 'assistant' | 'user',
              content: msg.content || ''
            }))
            setMessages(formattedMessages || [])
            console.log('🔄 [DEBUG] Messaggi caricati per conversazione refresh:', formattedMessages.length)
          }
        } catch (error) {
          console.error('Errore nel caricamento messaggi conversazione refresh:', error)
        }
        
        toast.success(language === 'IT' ? 'Conversazione corrente confermata' : 'Current conversation confirmed')
      } else if (guestInfo.has_existing_conversation && guestInfo.existing_conversation_id && guestInfo.existing_thread_id) {
        // Riutilizza la conversazione esistente
        setConversationId(guestInfo.existing_conversation_id)
        setThreadId(guestInfo.existing_thread_id)
        
        // Salva lo stato della conversazione nel localStorage
        localStorage.setItem(`conversation_id_${uuid}`, guestInfo.existing_conversation_id.toString())
        localStorage.setItem(`thread_id_${uuid}`, guestInfo.existing_thread_id || '')
        
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          const messagesResponse = await fetch(`${API_URL}/api/chat/${uuid}/conversation/${guestInfo.existing_conversation_id}/messages`)
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
            const formattedMessages = messagesData.messages.map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              id: msg.id || Date.now() + Math.random(),
              role: (msg.role || 'assistant') as 'assistant' | 'user',
              content: msg.content || ''
            }))
            setMessages(formattedMessages || [])
          }
        } catch (error) {
          console.error('Errore nel caricamento della conversazione esistente:', error)
        }
        
        toast.success(language === 'IT' ? 'Conversazione esistente ripristinata' : 'Existing conversation restored')
      } else {
        // Nessuna conversazione esistente, CREA una nuova con il guest_id
        console.log('🆕 [DEBUG] Creando nuova conversazione per guest_id:', guestInfo.guest_id)
        try {
          const welcomeResponse = await chat.createWelcomeConversation(uuid, guestInfo.guest_id)
          console.log('🆕 [DEBUG] welcomeResponse:', welcomeResponse.data)
          
          // Salva l'ID della nuova conversazione
          setConversationId(welcomeResponse.data.conversation_id)
          setThreadId(null) // Nessun thread ancora
          
          // Salva lo stato della conversazione nel localStorage
          localStorage.setItem(`conversation_id_${uuid}`, welcomeResponse.data.conversation_id.toString())
          localStorage.setItem(`thread_id_${uuid}`, '')
          
          // Carica i messaggi della nuova conversazione
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          const messagesResponse = await fetch(`${API_URL}/api/chat/${uuid}/conversation/${welcomeResponse.data.conversation_id}/messages`)
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
            const formattedMessages = messagesData.messages.map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              id: msg.id || Date.now() + Math.random(),
              role: (msg.role || 'assistant') as 'assistant' | 'user',
              content: msg.content || ''
            }))
            setMessages(formattedMessages || [])
          }
        } catch (error: any) {
          console.error('Errore nel caricamento del messaggio di benvenuto:', error)
          
          // Gestisci errore limite conversazioni
          if (error.response?.status === 429) {
            const errorDetail = error.response?.data?.detail || ''
            toast.error(errorDetail || (language === 'IT' ? 'Limite conversazioni raggiunto' : 'Conversation limit reached'))
            // NON procedere con setShowWelcome(false) - mantieni la schermata di identificazione
            return
          }
        }
        
        toast.success(language === 'IT' ? 'Nuova conversazione iniziata' : 'New conversation started')
      }
      
      setShowWelcome(false)
      setTimeout(() => inputRef.current?.focus(), 100)
      
    } catch (error: any) {
      console.error('Errore identificazione ospite:', error)
      
      // Gestisci errori specifici
      if (error.response?.data?.detail?.includes('Per i nuovi ospiti sono richiesti')) {
        toast.error(language === 'IT' ? 'Per i nuovi ospiti sono richiesti sia il telefono che l\'email' : 'Both phone and email are required for new guests')
      } else if (error.response?.data?.detail?.includes('Formato numero di telefono non valido')) {
        toast.error(language === 'IT' ? 'Formato numero di telefono non valido' : 'Invalid phone number format')
      } else if (error.response?.data?.detail?.includes('Formato email non valido')) {
        toast.error(language === 'IT' ? 'Formato email non valido' : 'Invalid email format')
      } else {
        toast.error(language === 'IT' ? 'Errore nell\'identificazione' : 'Identification error')
      }
    }
  }

  const handleNewConversation = async () => {
    // Reset completo dello stato
    setMessages([])
    setConversationId(null)
    setThreadId(null)
    setInputMessage('')
    setGuestData(null)
    setGuestPhone('')
    setGuestEmail('')
    setPhoneNumber('')
    setSelectedCountryCode('+39')
    setShowWelcome(true)
    
    // Pulisci il localStorage per forzare la creazione di una nuova conversazione
    localStorage.removeItem(`conversation_id_${uuid}`)
    localStorage.removeItem(`thread_id_${uuid}`)
    
    // NUOVO: Controlla se c'è un guest_id salvato per creare nuova conversazione
    const savedGuestId = localStorage.getItem(`guest_id_${uuid}`)
    
    // Se c'è un guest salvato, crea una nuova conversazione con quel guest_id
    await loadChatInfo(savedGuestId ? parseInt(savedGuestId) : null)
    
    toast.success(language === 'IT' ? 'Nuova conversazione creata' : 'New conversation created')
  }

  // Funzioni per check-in automatico
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Controlla che tutti i file siano JPEG o PNG
    const allowedTypes = ['image/jpeg', 'image/png']
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      toast.error(language === 'IT' ? 'Solo file JPEG e PNG sono consentiti' : 'Only JPEG and PNG files are allowed')
      return
    }
    
    if (checkinFiles.length + files.length > 10) {
      toast.error(currentTexts.checkinMaxFiles)
      return
    }
    
    setCheckinFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setCheckinFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      
      // Crea un elemento video temporaneo per catturare l'immagine
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
              
              if (checkinFiles.length >= 10) {
                toast.error(currentTexts.checkinMaxFiles)
                return
              }
              
              setCheckinFiles(prev => [...prev, file])
            }
          }, 'image/jpeg')
        }
        
        // Ferma lo stream
        stream.getTracks().forEach(track => track.stop())
      })
    } catch (error) {
      console.error('Errore accesso fotocamera:', error)
      toast.error('Errore nell\'accesso alla fotocamera')
    }
  }

  const handleCheckinSubmit = async () => {
    if (checkinFiles.length === 0) {
      toast.error(language === 'IT' ? 'Seleziona almeno un file' : 'Select at least one file')
      return
    }
    
    if (!checkinConsent) {
      toast.error(language === 'IT' ? 'Devi accettare il consenso' : 'You must accept the consent')
      return
    }
    
    setIsSubmittingCheckin(true)
    
    try {
      // Prepara i dati per l'API
      const formData = new FormData()
      checkinFiles.forEach((file) => {
        formData.append('files', file)
      })
      formData.append('guest_id', guestData?.id?.toString() || '')
      formData.append('guest_email', guestData?.email || '')
      formData.append('guest_phone', guestData?.phone || '')
      formData.append('guest_first_name', guestData?.first_name || '')
      formData.append('guest_last_name', guestData?.last_name || '')
      
      // Chiama l'API per inviare i documenti
      await chat.submitCheckin(uuid, formData)
      
      toast.success(currentTexts.checkinSuccess)
      setShowCheckinPopup(false)
      setCheckinFiles([])
      setCheckinConsent(false)
    } catch (error) {
      console.error('Errore invio check-in:', error)
      toast.error(currentTexts.checkinError)
    } finally {
      setIsSubmittingCheckin(false)
    }
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
            {/* Desktop: mostra icona, nome e assistente virtuale */}
            <div className="hidden md:flex items-center">
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
                  <OspiterAILogo size="sm" className="text-white" />
                </div>
              )}
              <div>
                <h1 className={`font-semibold text-lg transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={chatInfo?.property_name}>
                  {chatInfo?.property_name}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>{currentTexts.assistant}</p>
              </div>
            </div>
            
            {/* Mobile: solo controlli a sinistra */}
            <div className="flex md:hidden items-center gap-2">
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
            </div>
            
            {/* Desktop: controlli a destra */}
            <div className="hidden md:flex items-center gap-2">
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
            
            {/* Mobile: button emergenza a destra */}
            <div className="flex md:hidden items-center">
              <button
                onClick={handleEmergency}
                disabled={!guestData}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  guestData 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                title={language === 'IT' ? 'Emergenza - Contatta Host' : 'Emergency - Contact Host'}
              >
                <span>{language === 'IT' ? 'Emergenza' : 'Emergency'}</span>
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
          {showWelcome && !subscriptionCancelled && !freeTrialLimitReached && !freeTrialExpired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center flex-1 flex flex-col justify-center"
            >
              <div className="mx-auto mb-6">
                {chatInfo ? (
                  <ChatbotIcon 
                    chatbotUuid={uuid} 
                    hasIcon={chatInfo.has_icon} 
                    size="xl" 
                    className="w-20 h-20"
                    noBorder={true}
                  />
                ) : (
                  <MessageSquare className="w-20 h-20 text-purple-500" />
                )}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                {language === 'IT' ? `Benvenuto da ${chatInfo?.property_name || 'questa struttura'}` : `Welcome from ${chatInfo?.property_name || 'this property'}`}
              </h2>
              <p className={`mb-6 max-w-2xl mx-auto text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {language === 'IT' 
                  ? 'Inserisci i tuoi dati di contatto per accedere alla chat e mantenere sempre salvata la conversazione.' 
                  : 'Enter your contact details to access the chat and keep your conversation always saved.'
                }
              </p>
              
              {/* Form identificazione ospite */}
              <div className="max-w-md mx-auto space-y-4 mb-6">
                {/* Telefono */}
                <div>
                  <label className={`block text-sm font-medium mb-2 text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'IT' ? 'Numero di telefono' : 'Phone number'}
                  </label>
                  <div className="flex gap-2">
                    <div className="w-[120px] md:w-40">
                      <CountrySelector
                        value={selectedCountryCode}
                        onChange={setSelectedCountryCode}
                        isDarkMode={isDarkMode}
                        language={language}
                        className="text-sm h-10"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder={language === 'IT' ? 'Numero telefono' : 'Phone number'}
                        className={`w-full px-3 py-2 h-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium mb-2 text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'IT' ? 'Email' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder={language === 'IT' ? 'Inserisci la tua email' : 'Enter your email'}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              <button
                onClick={handleStartChat}
                className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition-all duration-200"
              >
                {currentTexts.startChat}
              </button>
            </motion.div>
          )}

          {/* Messages Area - FISSA */}
          {(!showWelcome || messages.length > 0) && !subscriptionCancelled && !freeTrialLimitReached && !freeTrialExpired && (
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
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white ml-3' 
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
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}>
                        <MarkdownText content={message.content} />
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                        }`}>
                          {message.timestamp ? message.timestamp.toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : new Date().toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        
                        {/* Bottone check-in automatico - solo per il primo messaggio dell'assistente se è la prima volta */}
                        {message.role === 'assistant' && 
                         index === 0 && 
                         guestData?.is_first_time_guest && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => setShowCheckinPopup(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors duration-200"
                            >
                              <Upload className="w-4 h-4" />
                              {currentTexts.checkinButton}
                            </button>
                          </div>
                        )}
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
                  {/* Pulsante Download Informazioni Proprietà - Blu e nella sezione suggerimenti */}
                  <button
                    onClick={downloadHouseRulesPDF}
                    disabled={isDownloadingPDF}
                    className={`p-2 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      isDownloadingPDF 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    title={language === 'IT' ? 'Scarica informazioni della proprietà' : 'Download property information'}
                  >
                    <FileText className="w-4 h-4 text-white" />
                  </button>
                  
                  {/* Pulsante WiFi - Verde e nella sezione suggerimenti */}
                  <button
                    onClick={handleWifiInfo}
                    disabled={isLoading || (!chatInfo?.wifi_info && !chatInfo?.has_wifi_qr_code)}
                    className={`p-2 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      isLoading || (!chatInfo?.wifi_info && !chatInfo?.has_wifi_qr_code)
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                    title={language === 'IT' ? 'Informazioni WiFi' : 'WiFi Information'}
                  >
                    <Wifi className="w-4 h-4 text-white" />
                  </button>
                  
                  {!isSuspended && currentTexts.suggestedMessages.map((message: string, index: number) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => !isLoading && !isSuspended && handleSuggestedMessage(message)}
                      disabled={isLoading || isSuspended}
                      className={`px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0 ${
                        isLoading 
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 hover:from-primary/20 hover:to-accent/20 hover:border-primary/40'
                      }`}
                    >
                      {message}
                    </motion.button>
                  ))}
                  
                  {/* Messaggio di sospensione */}
                  {isSuspended && (
                    <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-2 rounded-full text-xs font-medium">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {language === 'IT' ? 'In attesa della risposta dell\'host' : 'Waiting for host response'}
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area - FISSA */}
              {!isSuspended && (
                <div className={`border-t p-3 md:p-4 pb-12 md:pb-2 mb-[2vh] md:mb-0 safe-bottom flex-shrink-0 transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isSuspended ? (language === 'IT' ? "In attesa della risposta dell'host..." : "Waiting for host response...") : currentTexts.placeholder}
                    disabled={isLoading || isProcessingAudio || isSuspended}
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
                    disabled={isLoading || isProcessingAudio || isSuspended}
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
                    disabled={isLoading || isProcessingAudio || !inputMessage.trim() || isSuspended}
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
              )}
            </>
          )}
        </div>

        {/* Popup Check-in Automatico */}
        {showCheckinPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              {/* Header */}
              <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentTexts.checkinTitle}
                  </h2>
                  <button
                    onClick={() => setShowCheckinPopup(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                </div>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {currentTexts.checkinDescription}
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* File Upload */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentTexts.checkinUploadLabel}
                  </label>
                  <div className="flex gap-2 mb-4">
                    <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                      <Upload className="w-5 h-5 text-blue-500" />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {language === 'IT' ? 'Seleziona immagini' : 'Select images'}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleCameraCapture}
                      className="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 transition-colors"
                    >
                      <Camera className="w-5 h-5 text-green-500" />
                    </button>
                  </div>

                  {/* File List */}
                  {checkinFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'IT' ? `File selezionati (${checkinFiles.length}/10):` : `Selected files (${checkinFiles.length}/10):`}
                      </p>
                      {checkinFiles.map((file, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <span className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {file.name}
                          </span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="checkinConsent"
                    checked={checkinConsent}
                    onChange={(e) => setCheckinConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="checkinConsent" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentTexts.checkinConsentText}
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleCheckinSubmit}
                  disabled={checkinFiles.length === 0 || !checkinConsent || isSubmittingCheckin}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  {isSubmittingCheckin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === 'IT' ? 'Invio in corso...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {currentTexts.checkinSubmit}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  )
}
