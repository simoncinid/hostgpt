'use client'

import { useState, useEffect } from 'react'
import { chat } from '@/lib/api'
import { MessageSquare } from 'lucide-react'

interface DemoChatbotIconProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function DemoChatbotIcon({ size = 'md', className = '' }: DemoChatbotIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasIcon, setHasIcon] = useState(false)

  // UUID del chatbot demo reale
  const DEMO_CHATBOT_UUID = "e413257a-f165-41f2-9f9d-2f244d11d3b4"

  useEffect(() => {
    // Prima controlla se il chatbot demo ha un'icona
    chat.getInfo(DEMO_CHATBOT_UUID)
      .then(response => {
        setHasIcon(response.data.has_icon)
        
        if (response.data.has_icon) {
          setIsLoading(true)
          return chat.getIcon(DEMO_CHATBOT_UUID)
        }
        return null
      })
      .then(response => {
        if (response) {
          const blob = new Blob([response.data], { type: 'image/png' })
          const url = URL.createObjectURL(blob)
          setIconUrl(url)
        }
      })
      .catch(() => {
        // Se c'è un errore, usa l'icona di default
        setHasIcon(false)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

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
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-100 rounded-full flex items-center justify-center animate-pulse`}>
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
      </div>
    )
  }

  if (iconUrl) {
    return (
      <img 
        src={iconUrl} 
        alt="Demo chatbot icon" 
        className={`${sizeClasses[size]} ${className} rounded-full object-cover border-2 border-white shadow-sm`}
      />
    )
  }

  // Icona di default
  return (
    <div className={`${sizeClasses[size]} ${className} bg-primary rounded-full flex items-center justify-center shadow-sm`}>
      <MessageSquare className="w-5 h-5 text-white" />
    </div>
  )
}
