'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Settings, Check } from 'lucide-react'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // sempre attivi
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    // Controlla se l'utente ha già dato il consenso
    const cookieConsent = localStorage.getItem('hostgpt-cookie-consent')
    if (!cookieConsent) {
      // Mostra il banner dopo un piccolo delay per non essere invasivo
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('hostgpt-cookie-consent', JSON.stringify(consent))
    setShowBanner(false)
    setShowSettings(false)
    
    // Qui potresti inizializzare i servizi di analytics, ecc.
    if (consent.analytics) {
      // Inizializza Google Analytics o altri strumenti di analisi
      console.log('Analytics enabled')
    }
  }

  const acceptSelected = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('hostgpt-cookie-consent', JSON.stringify(consent))
    setShowBanner(false)
    setShowSettings(false)
    
    // Inizializza solo i servizi consentiti
    if (consent.analytics) {
      console.log('Analytics enabled')
    }
  }

  const rejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('hostgpt-cookie-consent', JSON.stringify(consent))
    setShowBanner(false)
    setShowSettings(false)
  }

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === 'necessary') return // Non può essere disabilitato
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (!showBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      >
        <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl">
          <div className="container-max px-4 py-6">
            {!showSettings ? (
              // Banner principale
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-start flex-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <Cookie className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark mb-2">Utilizziamo i Cookie</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Utilizziamo cookie essenziali per il funzionamento del sito e cookie opzionali per migliorare la tua esperienza. 
                      Puoi gestire le tue preferenze in qualsiasi momento. 
                      <Link href="/privacy" className="text-primary hover:underline ml-1">
                        Scopri di più
                      </Link>
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-dark transition text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Gestisci
                  </button>
                  <button
                    onClick={rejectAll}
                    className="px-6 py-2 text-gray-600 hover:text-dark transition text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Rifiuta
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-6 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition text-sm"
                  >
                    Accetta Tutti
                  </button>
                </div>
              </div>
            ) : (
              // Pannello impostazioni dettagliate
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center mr-3">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-dark">Preferenze Cookie</h3>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-600 hover:text-dark transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {/* Cookie Necessari */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-dark">Cookie Necessari</h4>
                      <div className="w-12 h-6 bg-primary rounded-full flex items-center px-1">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Essenziali per il funzionamento del sito. Non possono essere disabilitati.
                    </p>
                  </div>

                  {/* Cookie Analitici */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-dark">Cookie Analitici</h4>
                      <button
                        onClick={() => togglePreference('analytics')}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
                          preferences.analytics ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition ${
                          preferences.analytics ? 'ml-auto' : ''
                        }`}></div>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ci aiutano a capire come utilizzi il sito per migliorare l'esperienza utente.
                    </p>
                  </div>

                  {/* Cookie Marketing */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-dark">Cookie Marketing</h4>
                      <button
                        onClick={() => togglePreference('marketing')}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
                          preferences.marketing ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition ${
                          preferences.marketing ? 'ml-auto' : ''
                        }`}></div>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Utilizzati per mostrarti contenuti e pubblicità pertinenti.
                    </p>
                  </div>

                  {/* Cookie Funzionali */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-dark">Cookie Funzionali</h4>
                      <button
                        onClick={() => togglePreference('functional')}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
                          preferences.functional ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition ${
                          preferences.functional ? 'ml-auto' : ''
                        }`}></div>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Abilitano funzionalità avanzate e personalizzazione dell'esperienza.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    onClick={rejectAll}
                    className="px-6 py-2 text-gray-600 hover:text-dark transition text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Rifiuta Tutti
                  </button>
                  <button
                    onClick={acceptSelected}
                    className="flex items-center justify-center px-6 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition text-sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Salva Preferenze
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
