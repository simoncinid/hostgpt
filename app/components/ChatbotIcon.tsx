'use client'

import { useState, useEffect } from 'react'
import { chatbots } from '@/lib/api'
import { MessageSquare } from 'lucide-react'
import axios from 'axios'

// Importa l'istanza di axios configurata
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

interface ChatbotIconProps {
  chatbotId?: number
  chatbotUuid?: string
  hasIcon: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  noBorder?: boolean // Nuova prop per rimuovere il bordo
}

export default function ChatbotIcon({ chatbotId, chatbotUuid, hasIcon, size = 'md', className = '', noBorder = false }: ChatbotIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Prova sempre a caricare l'icona se abbiamo un ID o UUID
    // Il backend restituirà 404 se l'icona non esiste
    if (chatbotId || chatbotUuid) {
      setIsLoading(true)
      
      // Se abbiamo chatbotUuid, usa direttamente l'endpoint pubblico
      if (chatbotUuid) {
        const endpoint = `/chat/${chatbotUuid}/icon`
        console.log('DEBUG ChatbotIcon: Using public endpoint:', endpoint)
        
        api.get(endpoint, { responseType: 'blob' })
          .then(response => {
            console.log('DEBUG ChatbotIcon: Response status:', response.status, response.statusText)
            console.log('DEBUG ChatbotIcon: Icon loaded successfully, blob size:', response.data.size)
            const url = URL.createObjectURL(response.data)
            setIconUrl(url)
          })
          .catch((error) => {
            console.log('DEBUG ChatbotIcon: Icon fetch error:', error)
            console.log('DEBUG ChatbotIcon: UUID che ha causato errore:', chatbotUuid)
            // Fallback: prova l'endpoint autenticato se disponibile
            if (chatbotId) {
              console.log('DEBUG ChatbotIcon: Trying authenticated endpoint as fallback...')
              const token = localStorage.getItem('token')
              if (token) {
                const authEndpoint = `/chatbots/${chatbotId}/icon`
                api.get(authEndpoint, { 
                  headers: { 'Authorization': `Bearer ${token}` },
                  responseType: 'blob'
                })
                .then(response => {
                  console.log('DEBUG ChatbotIcon: Icon loaded via auth endpoint')
                  const url = URL.createObjectURL(response.data)
                  setIconUrl(url)
                })
                .catch(authError => {
                  console.log('DEBUG ChatbotIcon: Auth endpoint also failed:', authError)
                })
              }
            }
          })
          .finally(() => {
            setIsLoading(false)
          })
      } else if (chatbotId) {
        // Se abbiamo solo chatbotId, dobbiamo prima recuperare l'UUID
        // Per ora, prova l'endpoint autenticato come fallback
        const endpoint = `/chatbots/${chatbotId}/icon`
        console.log('DEBUG ChatbotIcon: Using authenticated endpoint:', endpoint)
        
        const token = localStorage.getItem('token')
        const headers: HeadersInit = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        api.get(endpoint, { headers, responseType: 'blob' })
          .then(response => {
            console.log('DEBUG ChatbotIcon: Response status:', response.status, response.statusText)
            console.log('DEBUG ChatbotIcon: Icon loaded successfully, blob size:', response.data.size)
            const url = URL.createObjectURL(response.data)
            setIconUrl(url)
          })
          .catch((error) => {
            console.log('DEBUG ChatbotIcon: Icon fetch error:', error)
            // Se l'endpoint autenticato fallisce, prova a recuperare l'UUID e usare l'endpoint pubblico
            console.log('DEBUG ChatbotIcon: Trying to get UUID for public endpoint...')
            // TODO: Implementare il recupero dell'UUID
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
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
    const borderClass = noBorder ? '' : 'border-2 border-gray-200'
    const roundedClass = noBorder ? 'rounded-full' : 'rounded-lg'
    
    return (
      <img 
        src={iconUrl} 
        alt="Chatbot icon" 
        className={`${finalClassName} ${roundedClass} object-cover ${borderClass}`}
      />
    )
  }

  // Icona di default
  return (
    <div className={`${finalClassName} bg-red-100 rounded-lg flex items-center justify-center`} title="Icona non caricata - problema backend">
      <MessageSquare className="w-6 h-6 text-red-600" />
    </div>
  )
}
