'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Cookie, Mail, Phone, MapPin } from 'lucide-react'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar semplificata */}
      <nav className="fixed top-4 left-0 right-0 z-50 safe-top">
        <div className="px-4">
          <div className="flex justify-between items-center py-3 px-4 bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg rounded-2xl mx-2">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-dark">HostGPT</span>
            </Link>
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-primary transition">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Torna alla Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 md:pt-36 pb-16 px-4">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mb-6 mx-auto">
              <Cookie className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-dark mb-6">
              Cookie Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Scopri come utilizziamo i cookie per migliorare la tua esperienza su HostGPT e come puoi gestire le tue preferenze.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-gray-50">
        <div className="container-max max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Cookie Policy Content */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="prose prose-lg max-w-none text-gray-600">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Gestione Cookie</h3>
                  <p className="text-blue-700 text-sm">
                    Questa pagina utilizza CookieYes per gestire le tue preferenze sui cookie. 
                    Puoi modificare le tue impostazioni in qualsiasi momento utilizzando il banner cookie.
                  </p>
                </div>

                {/* CookieYes Script Container */}
                <div className="cookie-policy-container">
                  {/* Start CookieYes cookie policy */}
                  <script 
                    id="cky-cookie-policy" 
                    type="text/javascript" 
                    src="https://cdn-cookieyes.com/client_data/65fd15cbd6f7bed8d5de4f08/cookie-policy/script.js"
                  ></script>
                  {/* End CookieYes cookie policy */}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-dark mb-4">Informazioni sui Cookie</h3>
                  <p className="text-gray-600 mb-4">
                    I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti il nostro sito web. 
                    Utilizziamo i cookie per:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
                    <li>Migliorare le prestazioni del sito</li>
                    <li>Personalizzare la tua esperienza</li>
                    <li>Analizzare come utilizzi il nostro servizio</li>
                    <li>Fornire funzionalità di marketing e pubblicità</li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-dark mb-4">Tipi di Cookie</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-dark mb-2">Cookie Essenziali</h4>
                      <p className="text-sm text-gray-600">
                        Necessari per il funzionamento del sito. Non possono essere disabilitati.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-dark mb-2">Cookie di Performance</h4>
                      <p className="text-sm text-gray-600">
                        Ci aiutano a capire come i visitatori interagiscono con il sito.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-dark mb-2">Cookie Funzionali</h4>
                      <p className="text-sm text-gray-600">
                        Permettono al sito di ricordare le tue scelte e preferenze.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-dark mb-2">Cookie di Marketing</h4>
                      <p className="text-sm text-gray-600">
                        Utilizzati per mostrare annunci pertinenti e misurare l'efficacia delle campagne.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-dark mb-4">Gestione delle Preferenze</h3>
                  <p className="text-gray-600 mb-4">
                    Puoi gestire le tue preferenze sui cookie in qualsiasi momento:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-600">
                    <li>Clicca sul banner cookie che appare quando visiti il sito</li>
                    <li>Seleziona "Impostazioni Cookie" per personalizzare le tue preferenze</li>
                    <li>Attiva o disattiva le categorie di cookie secondo le tue preferenze</li>
                    <li>Salva le tue impostazioni</li>
                  </ol>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-dark mb-4">Contatti</h3>
                  <p className="text-gray-600 mb-4">
                    Per domande sui cookie o per esercitare i tuoi diritti, contattaci:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-2 text-gray-700">
                      <p><strong>Simoncini Diego</strong></p>
                      <p>Via Enrico Capecchi, 28</p>
                      <p>PI 56025, Italy</p>
                      <p>Email: simoncinidiego10@gmail.com</p>
                      <p>Phone: 3391797616</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">
                    Cookie Policy powered by <a target="_blank" href="https://www.cookieyes.com/?utm_source=CP&utm_medium=footer&utm_campaign=UW" className="text-primary hover:underline">CookieYes</a>.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-12">
        <div className="container-max px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo e descrizione */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Home className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">HostGPT</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Crea chatbot intelligenti per i tuoi affitti vacanza. Offri ai tuoi ospiti assistenza 24/7 con informazioni sulla casa e sulla zona.
              </p>
            </div>

            {/* Link rapidi */}
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Link Rapidi</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Termini e Condizioni</Link></li>
                <li><Link href="/cookiepolicy" className="hover:text-white transition">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* Contatti */}
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Contatti</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>simoncinidiego10@gmail.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>3391797616</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Via Enrico Capecchi, 28<br />PI 56025, Italy</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Separatore */}
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400 text-sm">&copy; 2024 HostGPT. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
