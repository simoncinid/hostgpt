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
    if (hasIcon && (chatbotId || chatbotUuid)) {
      setIsLoading(true)
      
      // Scegli l'endpoint corretto
      const endpoint = chatbotUuid 
        ? `/api/chat/${chatbotUuid}/icon`
        : `/api/chatbots/${chatbotId}/icon`
      
      fetch(endpoint, {
        headers: {
          'Authorization': chatbotId ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch icon')
          return response.blob()
        })
        .then(blob => {
          const url = URL.createObjectURL(blob)
          setIconUrl(url)
        })
        .catch(() => {
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

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-100 rounded-lg flex items-center justify-center animate-pulse`}>
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
      </div>
    )
  }

  if (iconUrl) {
    return (
      <img 
        src={iconUrl} 
        alt="Chatbot icon" 
        className={`${sizeClasses[size]} ${className} rounded-lg object-cover border-2 border-gray-200`}
      />
    )
  }

  // Icona di default
  return (
    <div className={`${sizeClasses[size]} ${className} bg-blue-100 rounded-lg flex items-center justify-center`}>
      <MessageSquare className="w-6 h-6 text-blue-600" />
    </div>
  )
}
