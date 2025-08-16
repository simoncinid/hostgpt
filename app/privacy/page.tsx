'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Shield, Lock, Eye, Database, Mail, Calendar } from 'lucide-react'

export default function PrivacyPage() {
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-dark mb-6">
              Informativa sulla Privacy
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La tua privacy è importante per noi. Questa informativa spiega come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Ultimo aggiornamento: 15 Novembre 2024
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
            className="space-y-12"
          >
            {/* Sezione 1: Raccolta Dati */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-dark">Raccolta dei Dati</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Raccogliamo i seguenti tipi di informazioni quando utilizzi HostGPT:
                </p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Informazioni di registrazione:</strong> Nome, email, password crittografata</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Dati della proprietà:</strong> Nome, descrizione, informazioni locali che inserisci</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Conversazioni:</strong> Messaggi scambiati tra ospiti e chatbot per migliorare il servizio</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Dati di utilizzo:</strong> Statistiche anonime per ottimizzare la piattaforma</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Sezione 2: Utilizzo Dati */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-dark">Come Utilizziamo i Tuoi Dati</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Utilizziamo i tuoi dati personali per:
                </p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Fornirti il servizio di chatbot personalizzato</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Migliorare la qualità delle risposte del tuo assistente virtuale</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Inviarti aggiornamenti importanti sul servizio</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Fornire supporto tecnico quando necessario</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Analizzare l'utilizzo per migliorare la piattaforma</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Sezione 3: Protezione Dati */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-dark">Protezione dei Dati</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Implementiamo misure di sicurezza avanzate per proteggere i tuoi dati:
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2">Crittografia</h4>
                    <p className="text-sm">Tutti i dati sono crittografati in transito e a riposo utilizzando standard industriali</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2">Accesso Limitato</h4>
                    <p className="text-sm">Solo il personale autorizzato ha accesso ai dati, con controlli rigidi</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2">Backup Sicuri</h4>
                    <p className="text-sm">Backup regolari in server sicuri con ridondanza geografica</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2">Monitoraggio</h4>
                    <p className="text-sm">Monitoraggio continuo per rilevare e prevenire accessi non autorizzati</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sezione 4: I Tuoi Diritti */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-dark">I Tuoi Diritti</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  In conformità al GDPR, hai i seguenti diritti:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold text-dark">Accesso</h4>
                    <p className="text-sm">Richiedere una copia dei tuoi dati personali</p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold text-dark">Rettifica</h4>
                    <p className="text-sm">Correggere dati inesatti o incompleti</p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold text-dark">Cancellazione</h4>
                    <p className="text-sm">Richiedere la cancellazione dei tuoi dati</p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold text-dark">Portabilità</h4>
                    <p className="text-sm">Ricevere i tuoi dati in formato strutturato</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sezione 5: Condivisione */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-dark mb-6">Condivisione dei Dati</h2>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Non vendiamo né affittiamo i tuoi dati personali a terze parti. Condividiamo i dati solo in questi casi:
                </p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Con fornitori di servizi fidati che ci aiutano a operare (es. OpenAI per l'AI, provider cloud)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Quando richiesto dalla legge o dalle autorità competenti</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Per proteggere i nostri diritti legali o la sicurezza degli utenti</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contatti */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-dark">Contattaci</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Per domande sulla privacy o per esercitare i tuoi diritti, contattaci:
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> privacy@hostgpt.it</p>
                <p><strong>Indirizzo:</strong> Via Roma 123, 00100 Roma, Italia</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer semplificato */}
      <footer className="bg-dark text-white py-8">
        <div className="container-max px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Home className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">HostGPT</span>
          </div>
          <p className="text-gray-400 text-sm">&copy; 2024 HostGPT. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  )
}
