'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import CountrySelector from './CountrySelector'

interface GuestIdentificationFormProps {
  onSubmit: (data: {
    phone?: string
    email?: string
    first_name?: string
    last_name?: string
  }) => void
  onCancel: () => void
  isFirstTime: boolean
  hasExistingConversation: boolean
  existingGuestName?: string
  language: 'IT' | 'ENG'
  isDarkMode: boolean
}

export default function GuestIdentificationForm({
  onSubmit,
  onCancel,
  isFirstTime,
  hasExistingConversation,
  existingGuestName,
  language,
  isDarkMode
}: GuestIdentificationFormProps) {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedCountryCode, setSelectedCountryCode] = useState('+39')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    phone?: string
    email?: string
  }>({})

  const texts = {
    IT: {
      title: isFirstTime ? 'Benvenuto!' : `Ciao ${existingGuestName || ''}!`,
      subtitle: isFirstTime 
        ? 'Per iniziare la conversazione, inserisci il tuo numero di telefono e la tua email.'
        : 'Per continuare la conversazione, inserisci il tuo numero di telefono o la tua email.',
      phoneLabel: 'Numero di telefono',
      emailLabel: 'Email',
      firstNameLabel: 'Nome (opzionale)',
      lastNameLabel: 'Cognome (opzionale)',
      continueButton: hasExistingConversation ? 'Continua conversazione' : 'Inizia conversazione',
      cancelButton: 'Annulla',
      phonePlaceholder: 'Inserisci il numero',
      emailPlaceholder: 'Inserisci la tua email',
      validationError: 'Formato non valido',
      requiredField: 'Campo obbligatorio',
      atLeastOneRequired: 'Inserisci almeno telefono o email'
    },
    ENG: {
      title: isFirstTime ? 'Welcome!' : `Hello ${existingGuestName || ''}!`,
      subtitle: isFirstTime 
        ? 'To start the conversation, please enter your phone number and email.'
        : 'To continue the conversation, please enter your phone number or email.',
      phoneLabel: 'Phone number',
      emailLabel: 'Email',
      firstNameLabel: 'First name (optional)',
      lastNameLabel: 'Last name (optional)',
      continueButton: hasExistingConversation ? 'Continue conversation' : 'Start conversation',
      cancelButton: 'Cancel',
      phonePlaceholder: 'Enter phone number',
      emailPlaceholder: 'Enter your email',
      validationError: 'Invalid format',
      requiredField: 'Required field',
      atLeastOneRequired: 'Please enter at least phone or email'
    }
  }

  const currentTexts = texts[language]

  const validatePhone = async (phone: string) => {
    if (!phone) return true
    
    try {
      const response = await fetch('/api/validate-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phone)
      })
      const result = await response.json()
      return result.valid
    } catch {
      return false
    }
  }

  const validateEmail = (email: string) => {
    if (!email) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value)
    setPhone(selectedCountryCode + value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validazione
    const errors: { phone?: string; email?: string } = {}
    
    if (!phone && !email) {
      setValidationErrors({ phone: currentTexts.atLeastOneRequired })
      return
    }

    if (isFirstTime && (!phone || !email)) {
      if (!phone) errors.phone = currentTexts.requiredField
      if (!email) errors.email = currentTexts.requiredField
    }

    if (phone) {
      const isValidPhone = await validatePhone(phone)
      if (!isValidPhone) {
        errors.phone = currentTexts.validationError
      }
    }

    if (email) {
      const isValidEmail = validateEmail(email)
      if (!isValidEmail) {
        errors.email = currentTexts.validationError
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors({})
    onSubmit({
      phone: phone || undefined,
      email: email || undefined,
      first_name: firstName || undefined,
      last_name: lastName || undefined
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 text-center flex-1 flex flex-col justify-center"
    >
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <User className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
        {currentTexts.title}
      </h2>
      
      <p className={`mb-6 max-w-md mx-auto transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {currentTexts.subtitle}
      </p>

      {hasExistingConversation && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center text-green-700">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">
              {language === 'IT' ? 'Conversazione esistente trovata!' : 'Existing conversation found!'}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        {/* Nome e Cognome */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentTexts.firstNameLabel}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder={currentTexts.firstNameLabel}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentTexts.lastNameLabel}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder={currentTexts.lastNameLabel}
            />
          </div>
        </div>

        {/* Telefono */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {currentTexts.phoneLabel}
            {isFirstTime && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex gap-2">
            <div className="w-32">
              <CountrySelector
                value={selectedCountryCode}
                onChange={setSelectedCountryCode}
                className="text-sm"
                isDarkMode={isDarkMode}
              />
            </div>
            <div className="flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={currentTexts.phonePlaceholder}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  validationErrors.phone 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
          {validationErrors.phone && (
            <div className="flex items-center mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.phone}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {currentTexts.emailLabel}
            {isFirstTime && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={currentTexts.emailPlaceholder}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
              validationErrors.email 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          {validationErrors.email && (
            <div className="flex items-center mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.email}
            </div>
          )}
        </div>

        {/* Pulsanti */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {currentTexts.cancelButton}
          </button>
          <button
            type="submit"
            disabled={isValidating}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:from-secondary hover:to-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {language === 'IT' ? 'Validazione...' : 'Validating...'}
              </div>
            ) : (
              currentTexts.continueButton
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
