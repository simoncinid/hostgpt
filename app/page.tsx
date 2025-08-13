'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Home, 
  Globe, 
  BarChart3, 
  Clock, 
  Shield, 
  Zap,
  Check,
  ArrowRight,
  Menu,
  X,
  Star,
  Users,
  Smartphone
} from 'lucide-react'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Messaggi demo dinamici
  const demoMessages: { role: 'user' | 'assistant'; text: string }[] = [
    { role: 'user', text: 'Ciao! A che ora è il check-in?' },
    { role: 'assistant', text: 'Ciao! Il check-in è dalle 15:00 alle 20:00. Ti invieremo il codice della cassetta di sicurezza il giorno dell’arrivo.' },
    { role: 'user', text: 'Posso fare check-in dopo le 22?' },
    { role: 'assistant', text: 'Certo! È previsto un self check-in 24/7. Facci sapere l’orario stimato e ti assistiamo noi.' },
    { role: 'user', text: 'Com’è il parcheggio in zona?' },
    { role: 'assistant', text: 'C’è parcheggio gratuito in strada nei dintorni. In alternativa, a 300m trovi il Garage Verdi a 15€/giorno.' },
    { role: 'user', text: 'Wifi e ristoranti consigliati?' },
    { role: 'assistant', text: 'Wifi fibra 200Mbps, password: CASA2024. Per cenare ti consiglio Trattoria Roma (5 min a piedi) e Osteria Bella Vista.' }
  ]
  const [demoVisible, setDemoVisible] = useState<typeof demoMessages>([])
  const [demoRunId, setDemoRunId] = useState(0)
  const demoScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDemoVisible([])
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setDemoVisible(demoMessages.slice(0, i))
      if (i >= demoMessages.length) {
        clearInterval(interval)
      }
    }, 1400)
    return () => clearInterval(interval)
  }, [demoRunId])

  useEffect(() => {
    const el = demoScrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [demoVisible])

  const features = [
    {
      icon: <MessageSquare className="w-8 h-8 text-primary" />,
      title: "Chatbot Personalizzato",
      description: "Crea un assistente virtuale su misura per la tua proprietà con pochi click"
    },
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: "Assistenza 24/7",
      description: "I tuoi ospiti ricevono risposte immediate a qualsiasi ora del giorno e della notte"
    },
    {
      icon: <Globe className="w-8 h-8 text-primary" />,
      title: "Informazioni Locali",
      description: "Fornisci consigli su ristoranti, attrazioni e servizi della zona"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      title: "Statistiche Dettagliate",
      description: "Monitora le conversazioni e ottieni insights sui bisogni dei tuoi ospiti"
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Sicuro e Affidabile",
      description: "Tecnologia OpenAI all'avanguardia per risposte accurate e sicure"
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Setup Veloce",
      description: "Attiva il tuo chatbot in meno di 10 minuti con la nostra procedura guidata"
    }
  ]

  const testimonials = [
    {
      name: "Marco Rossi",
      role: "Host a Roma",
      content: "HostGPT ha rivoluzionato il modo in cui gestisco gli ospiti. Risparmio ore ogni settimana!",
      rating: 5
    },
    {
      name: "Laura Bianchi",
      role: "Host a Firenze",
      content: "I miei ospiti adorano avere risposte immediate. Le recensioni sono migliorate notevolmente.",
      rating: 5
    },
    {
      name: "Giuseppe Verdi",
      role: "Host a Milano",
      content: "Facile da configurare e utilissimo. Non posso più farne a meno!",
      rating: 5
    }
  ]

  const pricingPlans = [
    {
      name: "Abbonamento",
      price: "€29",
      period: "/mese",
      features: [
        "1 Chatbot personalizzato",
        "Conversazioni illimitate",
        "Assistenza 24/7",
        "Statistiche essenziali",
        "QR Code e link di condivisione"
      ],
      highlighted: true
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - glass, staccata dai bordi con angoli arrotondati */}
      <nav className="fixed top-2 md:top-4 left-0 right-0 z-50 safe-top">
        <div className="container-max px-4">
          <div className="flex justify-between items-center py-3 px-4 bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg rounded-2xl">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-dark">HostGPT</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-primary transition">
                Funzionalità
              </Link>
              <Link href="#demo" className="text-gray-600 hover:text-primary transition">
                Demo
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-primary transition">
                Come Funziona
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-primary transition">
                Prezzi
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-primary transition">
                Testimonianze
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-primary transition">
                Accedi
              </Link>
              <Link href="/register" className="btn-primary">
                Registrati
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2"
          >
            <div className="container-max px-4">
              <div className="px-4 py-4 space-y-4 bg-white/70 backdrop-blur-lg border border-white/30 shadow-lg rounded-2xl">
                <Link href="#features" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Funzionalità</Link>
                <Link href="#demo" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Demo</Link>
                <Link href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Come Funziona</Link>
                <Link href="#pricing" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Prezzi</Link>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block text-gray-600">Accedi</Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="btn-primary block text-center">
                  Registrati
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-36 pb-16 md:pb-20 px-4">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-dark mb-6">
              Risparmia Tempo con <span className="text-gradient">HostGPT</span><br />
              L’assistente H24 per i tuoi ospiti
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Rispondi automaticamente, in modo completo e immediato, alle richieste dei guest 24/7. 
              Meno messaggi per te, più soddisfazione per loro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-4">
                Registrati per iniziare
                <ArrowRight className="inline ml-2 w-5 h-5" />
              </Link>
              <Link href="#features" className="btn-outline text-lg px-8 py-4">
                Scopri Funzionalità
              </Link>
            </div>
          </motion.div>

          {/* Hero Image/Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8">
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="ml-3 font-semibold">Casa Bella Vista Bot</span>
                </div>
                <div
                  ref={demoScrollRef}
                  className="space-y-4 h-64 overflow-y-auto pr-2 scrollbar-left"
                >
                  {demoVisible.map((m, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}
                    >
                      {m.text}
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button onClick={() => setDemoRunId((v) => v + 1)} className="btn-outline px-6 py-3">Replica demo</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding bg-gray-50">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">
              Tutto Quello che Ti Serve
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Funzionalità potenti per migliorare l'esperienza dei tuoi ospiti
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="feature-card"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">
              Come Funziona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tre semplici passi per attivare il tuo assistente virtuale
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Registrati</h3>
              <p className="text-gray-600">
                Crea il tuo account e scegli il piano più adatto alle tue esigenze
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Personalizza</h3>
              <p className="text-gray-600">
                Rispondi alle domande guidate per creare la knowledge base del tuo chatbot
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Condividi</h3>
              <p className="text-gray-600">
                Ricevi il QR code e il link da condividere con i tuoi ospiti
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-padding bg-gray-50">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">Un Solo Abbonamento</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Tutto ciò che ti serve a <span className="font-semibold">€29/mese</span></p>
          </motion.div>

          <div className="grid md:grid-cols-1 gap-8 max-w-xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${plan.highlighted ? 'ring-2 ring-primary transform scale-105' : ''} bg-white rounded-2xl p-8 relative`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm">
                      Più Popolare
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 px-6 rounded-lg font-semibold transition ${
                    plan.highlighted
                      ? 'bg-primary text-white hover:bg-secondary'
                      : 'bg-gray-100 text-dark hover:bg-gray-200'
                  }`}
                >
                  Registrati ora
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">
              Cosa Dicono i Nostri Host
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unisciti a centinaia di host soddisfatti
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-gradient-to-r from-primary to-accent text-white">
        <div className="container-max">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-white/80">Host Attivi</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-white/80">Conversazioni</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-4xl font-bold mb-2">99%</div>
              <div className="text-white/80">Uptime</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-4xl font-bold mb-2">4.9</div>
              <div className="text-white/80">Valutazione</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-max text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-12"
          >
            <h2 className="text-4xl font-bold text-dark mb-4">
              Pronto a Rivoluzionare l'Esperienza dei Tuoi Ospiti?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Unisciti a centinaia di host che hanno già migliorato il loro servizio con HostGPT
            </p>
            <Link href="/register" className="btn-primary text-lg px-10 py-4">
              Registrati per iniziare
              <ArrowRight className="inline ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-12">
        <div className="container-max">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Home className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">HostGPT</span>
              </div>
              <p className="text-gray-400">
                Il tuo assistente virtuale per affitti vacanza
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition">Funzionalità</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Prezzi</Link></li>
                <li><Link href="#" className="hover:text-white transition">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Azienda</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Chi Siamo</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contatti</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legale</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Termini</Link></li>
                <li><Link href="#" className="hover:text-white transition">Cookie</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HostGPT. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
