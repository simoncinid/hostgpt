'use client'

import { useState, useEffect } from 'react'
import { chatbots } from '@/lib/api'
import { MessageSquare } from 'lucide-react'

interface ChatbotIconProps {
  chatbotId?: number
  chatbotUuid?: string
  hasIcon: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ChatbotIcon({ chatbotId, chatbotUuid, hasIcon, size = 'md', className = '' }: ChatbotIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Prova sempre a caricare l'icona se abbiamo un ID o UUID
    // Il backend restituirà 404 se l'icona non esiste
    if (chatbotId || chatbotUuid) {
      setIsLoading(true)
      
      // Scegli l'endpoint corretto
      const endpoint = chatbotUuid 
        ? `/api/chat/${chatbotUuid}/icon`
        : `/api/chatbots/${chatbotId}/icon`
      
      console.log('DEBUG ChatbotIcon: Fetching icon from:', endpoint)
      console.log('DEBUG ChatbotIcon: chatbotId:', chatbotId, 'chatbotUuid:', chatbotUuid, 'hasIcon:', hasIcon)
      
      const headers: HeadersInit = {}
      
      // Aggiungi il token solo se necessario e disponibile
      // Per l'endpoint /api/chatbots/{id}/icon serve autenticazione
      if (chatbotId) {
        const token = localStorage.getItem('token')
        console.log('DEBUG ChatbotIcon: Token found:', token ? 'YES' : 'NO')
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
          console.log('DEBUG ChatbotIcon: Authorization header added')
        }
      }
      // Per l'endpoint /api/chat/{uuid}/icon non serve autenticazione (è pubblico)
      
      fetch(endpoint, { headers })
        .then(response => {
          console.log('DEBUG ChatbotIcon: Response status:', response.status, response.statusText)
          if (!response.ok) {
            console.log('DEBUG ChatbotIcon: Icon fetch failed:', response.status, response.statusText)
            throw new Error(`Failed to fetch icon: ${response.status} ${response.statusText}`)
          }
          return response.blob()
        })
        .then(blob => {
          console.log('DEBUG ChatbotIcon: Icon loaded successfully, blob size:', blob.size)
          const url = URL.createObjectURL(blob)
          setIconUrl(url)
        })
        .catch((error) => {
          console.log('DEBUG ChatbotIcon: Icon fetch error:', error)
          // Se c'è un errore, non mostrare nulla (fallback all'icona di default)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [chatbotId, chatbotUuid, hasIcon])

  // Cleanup dell'URL quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (iconUrl) {
        URL.revokeObjectURL(iconUrl)
      }
    }
  }, [iconUrl])

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  // Se viene passata una className personalizzata, usa quella invece delle dimensioni predefinite
  const finalClassName = className.includes('w-') && className.includes('h-') 
    ? className 
    : `${sizeClasses[size]} ${className}`

  if (isLoading) {
    return (
      <div className={`${finalClassName} bg-gray-100 rounded-lg flex items-center justify-center animate-pulse`}>
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
      </div>
    )
  }

  if (iconUrl) {
    return (
      <img 
        src={iconUrl} 
        alt="Chatbot icon" 
        className={`${finalClassName} rounded-lg object-cover border-2 border-gray-200`}
      />
    )
  }

  // Icona di default
  return (
    <div className={`${finalClassName} bg-blue-100 rounded-lg flex items-center justify-center`}>
      <MessageSquare className="w-6 h-6 text-blue-600" />
    </div>
  )
}
