'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Mail, Send, Loader2, User } from 'lucide-react'
import { useLanguage } from '@/lib/languageContext'
import { chatbots } from '@/lib/api'
import toast from 'react-hot-toast'

interface CollaboratorInviteModalProps {
  isOpen: boolean
  onClose: () => void
  chatbotId: number
  chatbotName: string
  onInviteSent: () => void
}

interface EmailInput {
  id: string
  value: string
  isValid: boolean
  isExistingCollaborator?: boolean
}

interface Collaborator {
  id: number
  user: {
    email: string
    name: string
  }
  role: string
  joined_at: string
}

export default function CollaboratorInviteModal({
  isOpen,
  onClose,
  chatbotId,
  chatbotName,
  onInviteSent
}: CollaboratorInviteModalProps) {
  const { t, language } = useLanguage()
  const [emails, setEmails] = useState<EmailInput[]>([
    { id: '1', value: '', isValid: false }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isExistingCollaborator = (email: string): boolean => {
    return collaborators.some(collaborator => 
      collaborator.user.email.toLowerCase() === email.toLowerCase()
    )
  }

  const loadCollaborators = async () => {
    setIsLoadingCollaborators(true)
    try {
      const response = await chatbots.getCollaborators(chatbotId)
      setCollaborators(response.data)
    } catch (error) {
      console.error('Error loading collaborators:', error)
    } finally {
      setIsLoadingCollaborators(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCollaborators()
    }
  }, [isOpen, chatbotId])

  const handleEmailChange = (id: string, value: string) => {
    setEmails(prev => prev.map(email => 
      email.id === id 
        ? { 
            ...email, 
            value, 
            isValid: validateEmail(value),
            isExistingCollaborator: validateEmail(value) ? isExistingCollaborator(value) : false
          }
        : email
    ))
  }

  const addEmailField = () => {
    if (emails.length < 3) {
      const newId = (emails.length + 1).toString()
      setEmails(prev => [...prev, { id: newId, value: '', isValid: false }])
    }
  }

  const removeEmailField = (id: string) => {
    if (emails.length > 1) {
      setEmails(prev => prev.filter(email => email.id !== id))
    }
  }

  const getValidEmails = (): string[] => {
    return emails
      .filter(email => email.isValid && email.value.trim() !== '' && !email.isExistingCollaborator)
      .map(email => email.value.trim())
  }

  const getInvalidEmails = (): EmailInput[] => {
    return emails.filter(email => 
      email.value.trim() !== '' && 
      (email.isExistingCollaborator || !email.isValid)
    )
  }

  const handleSubmit = async () => {
    const validEmails = getValidEmails()
    const invalidEmails = getInvalidEmails()
    
    if (validEmails.length === 0) {
      if (invalidEmails.some(email => email.isExistingCollaborator)) {
        toast.error(language === 'ENG' ? 'Some emails are already collaborators' : 'Alcune email sono già collaboratori')
      } else {
        toast.error(language === 'ENG' ? 'Enter at least one valid email address' : 'Inserisci almeno un indirizzo email valido')
      }
      return
    }

    setIsLoading(true)
    try {
      console.log('Inviting collaborators:', { chatbotId, validEmails })
      const response = await chatbots.inviteCollaborators(chatbotId, validEmails)
      console.log('Invite response:', response)
      toast.success(language === 'ENG' 
        ? `Invites sent to ${response.data.invited_count} collaborators`
        : `Inviti inviati a ${response.data.invited_count} collaboratori`
      )
      onInviteSent()
      onClose()
      
      // Reset form
      setEmails([{ id: '1', value: '', isValid: false }])
    } catch (error: any) {
      console.error('Error inviting collaborators:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      // Don't close modal on error, show error message
      const errorMessage = error.response?.data?.detail || error.message || 
        (language === 'ENG' ? 'Error sending invites' : 'Errore nell\'invio degli inviti')
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const validEmailsCount = getValidEmails().length

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {language === 'ENG' ? 'Invite Collaborators' : 'Invita Collaborators'}
                  </h3>
                  <p className="text-sm text-gray-500">{chatbotName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                {language === 'ENG' 
                  ? 'Invite up to 3 collaborators to manage this chatbot. They will receive an email with a link to access.'
                  : 'Invita fino a 3 collaboratori a gestire questo chatbot. Riceveranno un\'email con un link per accedere.'
                }
              </p>
            </div>

            {/* Existing Collaborators */}
            {isLoadingCollaborators ? (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'ENG' ? 'Loading collaborators...' : 'Caricamento collaboratori...'}
                </div>
              </div>
            ) : collaborators.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {language === 'ENG' ? 'Current Collaborators' : 'Collaboratori Attuali'}
                </h4>
                <div className="space-y-2">
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {collaborator.user.name || collaborator.user.email}
                        </p>
                        <p className="text-xs text-gray-500">{collaborator.user.email}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(collaborator.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email inputs */}
            <div className="space-y-3 mb-6">
              {emails.map((email, index) => (
                <div key={email.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email.value}
                        onChange={(e) => handleEmailChange(email.id, e.target.value)}
                        placeholder={language === 'ENG' ? 'email@example.com' : 'email@esempio.com'}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          email.value && (email.isExistingCollaborator || !email.isValid)
                            ? 'border-red-300 bg-red-50' 
                            : email.isValid 
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-300'
                        }`}
                      />
                      {email.value && email.isExistingCollaborator && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      {email.isValid && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    {emails.length > 1 && (
                      <button
                        onClick={() => removeEmailField(email.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {email.value && email.isExistingCollaborator && (
                    <div className="text-xs text-red-600 ml-10">
                      {language === 'ENG' ? 'This email is already a collaborator' : 'Questa email è già collaboratore'}
                    </div>
                  )}
                </div>
              ))}
              
              {emails.length < 3 && (
                <button
                  onClick={addEmailField}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-500 transition"
                >
                  + {language === 'ENG' ? 'Add another collaborator' : 'Aggiungi altro collaboratore'}
                </button>
              )}
            </div>

            {/* Summary */}
            {validEmailsCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  {language === 'ENG' 
                    ? `You will invite ${validEmailsCount} collaborator${validEmailsCount > 1 ? 's' : ''}`
                    : `Inviterai ${validEmailsCount} collaboratore${validEmailsCount > 1 ? 'i' : ''}`
                  }
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                disabled={isLoading}
              >
                {language === 'ENG' ? 'Cancel' : 'Annulla'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={validEmailsCount === 0 || isLoading}
                className={`flex-1 py-2 px-4 rounded-lg text-white transition flex items-center justify-center gap-2 ${
                  validEmailsCount === 0 || isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'ENG' ? 'Sending...' : 'Invio...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {language === 'ENG' ? 'Send Invites' : 'Invia Inviti'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
