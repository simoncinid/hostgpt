'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, FileText, Scale, CreditCard, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function TermsPage() {
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-dark mb-6">
              Termini e Condizioni
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              I termini e condizioni che regolano l'utilizzo del servizio HostGPT e definiscono i diritti e doveri di entrambe le parti.
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
            {/* Sezione 1: Definizioni */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-dark">Definizioni e Accettazione</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Utilizzando HostGPT, accetti integralmente questi termini e condizioni. Se non accetti anche solo una parte di questi termini, non potrai utilizzare il servizio.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-dark mb-2">Definizioni:</h4>
                  <ul className="space-y-2 text-sm">
                    <li><strong>"Servizio":</strong> La piattaforma HostGPT e tutti i suoi componenti</li>
                    <li><strong>"Utente":</strong> La persona fisica o giuridica che utilizza il servizio</li>
                    <li><strong>"Chatbot":</strong> L'assistente virtuale creato tramite la piattaforma</li>
                    <li><strong>"Contenuti":</strong> Tutti i dati, testi e informazioni inseriti dall'utente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sezione 2: Descrizione del Servizio */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-dark">Descrizione del Servizio</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  HostGPT fornisce:
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Chatbot Personalizzato
                    </h4>
                    <p className="text-sm">Creazione di assistenti virtuali personalizzati per proprietà in affitto</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Assistenza 24/7
                    </h4>
                    <p className="text-sm">Risposte automatiche agli ospiti in qualsiasi momento</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Statistiche
                    </h4>
                    <p className="text-sm">Analisi delle conversazioni e performance del chatbot</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Supporto Tecnico
                    </h4>
                    <p className="text-sm">Assistenza per configurazione e risoluzione problemi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sezione 3: Obblighi dell'Utente */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mr-4">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-dark">Obblighi dell'Utente</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  L'utente si impegna a:
                </p>
                <ul className="space-y-3 mt-4">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Fornire informazioni accurate e aggiornate sulla propria proprietà</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Non utilizzare il servizio per scopi illegali o non autorizzati</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Mantenere riservate le credenziali di accesso</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Rispettare i diritti di proprietà intellettuale</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Non tentare di compromettere la sicurezza del servizio</span>
                  </li>
                </ul>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-6">
                  <div className="flex items-center">
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                    <h4 className="font-semibold text-red-800">Uso Vietato</h4>
                  </div>
                  <p className="text-red-700 text-sm mt-2">
                    È vietato utilizzare il servizio per attività illegali, spam, diffusione di contenuti offensivi o violazione dei diritti altrui.
                  </p>
                </div>
              </div>
            </div>

            {/* Sezione 4: Pagamenti e Fatturazione */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-dark">Pagamenti e Fatturazione</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-600">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-dark mb-3">Abbonamento Mensile</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Addebito automatico ogni mese</li>
                      <li>• Primo pagamento alla registrazione</li>
                      <li>• Fattura elettronica emessa automaticamente</li>
                      <li>• Pagamenti tramite carta di credito o PayPal</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark mb-3">Cancellazione</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Cancellazione possibile in qualsiasi momento</li>
                      <li>• Servizio attivo fino alla fine del periodo pagato</li>
                      <li>• Nessun rimborso per periodi parziali</li>
                      <li>• Riattivazione possibile con nuovo pagamento</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-dark mb-2">Modifiche ai Prezzi</h4>
                  <p className="text-sm">
                    I prezzi possono essere modificati con preavviso di 30 giorni. Gli utenti esistenti mantengono il prezzo corrente per almeno 3 mesi dalla notifica.
                  </p>
                </div>
              </div>
            </div>

            {/* Sezione 5: Limitazioni di Responsabilità */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-dark mb-6">Limitazioni di Responsabilità</h2>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  HostGPT fornisce il servizio "così com'è" senza garanzie esplicite o implicite:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2">Disponibilità</h4>
                    <p className="text-sm">Ci impegniamo a mantenere un uptime del 99%, ma non garantiamo disponibilità continua 24/7</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2">Accuratezza</h4>
                    <p className="text-sm">Le risposte del chatbot sono generate automaticamente e potrebbero non essere sempre accurate</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2">Danni</h4>
                    <p className="text-sm">Non siamo responsabili per danni diretti o indiretti derivanti dall'uso del servizio</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-dark mb-2">Perdita Dati</h4>
                    <p className="text-sm">Effettuiamo backup regolari ma consigliamo di mantenere copie locali dei dati importanti</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sezione 6: Risoluzione Controversie */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-dark mb-6">Risoluzione delle Controversie</h2>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  In caso di controversie, seguiamo questo processo:
                </p>
                
                <div className="space-y-4 mt-6">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-4 mt-1">1</div>
                    <div>
                      <h4 className="font-semibold text-dark">Contatto Diretto</h4>
                      <p className="text-sm">Primo tentativo di risoluzione tramite supporto clienti</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-4 mt-1">2</div>
                    <div>
                      <h4 className="font-semibold text-dark">Mediazione</h4>
                      <p className="text-sm">Tentativo di mediazione presso Camera di Commercio locale</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-4 mt-1">3</div>
                    <div>
                      <h4 className="font-semibold text-dark">Foro Competente</h4>
                      <p className="text-sm">Tribunale di Roma per controversie non risolte</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sezione 7: Modifiche */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-dark mb-6">Modifiche ai Termini</h2>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Ci riserviamo il diritto di modificare questi termini e condizioni in qualsiasi momento. Le modifiche entreranno in vigore:
                </p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>30 giorni</strong> dopo la notifica per modifiche sostanziali</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Immediatamente</strong> per modifiche di natura tecnica o legale</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Continui ad utilizzare il servizio implica accettazione delle modifiche</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contatti */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-dark mb-6">Contatti Legali</h2>
              <p className="text-gray-600 mb-6">
                Per questioni legali o chiarimenti sui termini e condizioni:
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-gray-600">
                <div>
                  <h4 className="font-semibold text-dark mb-2">Supporto Generale</h4>
                  <p className="text-sm">support@hostgpt.it</p>
                </div>
                <div>
                  <h4 className="font-semibold text-dark mb-2">Questioni Legali</h4>
                  <p className="text-sm">legal@hostgpt.it</p>
                </div>
                <div>
                  <h4 className="font-semibold text-dark mb-2">Indirizzo</h4>
                  <p className="text-sm">Via Roma 123, 00100 Roma, Italia</p>
                </div>
                <div>
                  <h4 className="font-semibold text-dark mb-2">Partita IVA</h4>
                  <p className="text-sm">IT12345678901</p>
                </div>
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
