'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useLanguage } from '../lib/languageContext'
import { Language } from '../lib/translations'

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage()

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ENG', name: 'English', flag: '🇬🇧' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  const handleToggleLanguage = () => {
    const newLanguage = language === 'IT' ? 'ENG' : 'IT'
    setLanguage(newLanguage)
  }

  return (
    <motion.button
      onClick={handleToggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-gray-700 font-medium hover:text-gray-900 transition-all duration-300 rounded-lg hover:bg-white/40 group text-sm"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={`Switch to ${language === 'IT' ? 'English' : 'Italiano'}`}
    >
      <Globe className="w-4 h-4" />
      <motion.span 
        key={language}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-lg"
      >
        {currentLanguage?.flag}
      </motion.span>
      <span className="text-xs font-medium">
        {currentLanguage?.code}
      </span>
    </motion.button>
  )
}

export default LanguageSelector
