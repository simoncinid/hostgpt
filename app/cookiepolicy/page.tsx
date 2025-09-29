'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Cookie, Mail, Phone, MapPin } from 'lucide-react'
import OspiterAILogo from '../components/OspiterAILogo'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar semplificata */}
      <nav className="fixed top-4 left-0 right-0 z-50 safe-top">
        <div className="px-4">
          <div className="flex justify-between items-center py-3 px-4 bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg rounded-2xl mx-2">
            <Link href="/" className="flex items-center space-x-2">
              <OspiterAILogo size="lg" className="text-primary" />
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
                {/* Start CookieYes cookie policy */}
                <style jsx>{`
                  a.cky-banner-element {
                    padding: 8px 30px;
                    background: #f8f9fa;
                    color: #858a8f;
                    border: 1px solid #dee2e6;
                    box-sizing: border-box;
                    border-radius: 2px;
                    cursor: pointer;
                    display: inline-block;
                    text-decoration: none;
                    margin: 10px 0;
                    transition: all 0.3s ease;
                  }
                  a.cky-banner-element:hover {
                    background: #e9ecef;
                    color: #495057;
                  }
                  .cookie-policy-h1 {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #1a1a1a;
                    margin-bottom: 1rem;
                  }
                  .cookie-policy-date-container {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                    border-left: 4px solid #007bff;
                  }
                  .cookie-policy-p {
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                  }
                  .cky-audit-table-element {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 1rem;
                    margin: 1rem 0;
                    min-height: 100px;
                  }
                `}</style>
                
                <h1 className="cookie-policy-h1">Cookie Policy</h1>
                <div className="cookie-policy-date-container">
                  <p>Effective date: September 10, 2025</p>
                  <p>Last updated: September 10, 2025</p>
                </div>
                
                <h2 className="text-2xl font-bold text-dark mb-4">What are cookies?</h2>
                <div className="cookie-policy-p">
                  <p>This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.</p>
                  <p>Cookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.</p>
                </div>
                
                <h2 className="text-2xl font-bold text-dark mb-4">How do we use cookies?</h2>
                <div className="cookie-policy-p">
                  <p>Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.</p>
                  <p>The third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.</p>
                </div>
                
                <h2 className="text-2xl font-bold text-dark mb-4">Types of cookies we use</h2>
                <div className="cky-audit-table-element"></div>
                
                <h2 className="text-2xl font-bold text-dark mb-4" style={{marginBottom: '20px'}}>Manage cookie preferences</h2>
                <a className="cky-banner-element">Consent Preferences</a>
                <br />
                <div>
                  <p>You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.</p>
                  <p>Additionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers.</p>
                  <p>Chrome: <a target="_blank" rel="noopener noreferrer" href="https://support.google.com/accounts/answer/32050" className="text-primary hover:underline">https://support.google.com/accounts/answer/32050</a></p>
                  <p>Safari: <a target="_blank" rel="noopener noreferrer" href="https://support.apple.com/en-in/guide/safari/sfri11471/mac" className="text-primary hover:underline">https://support.apple.com/en-in/guide/safari/sfri11471/mac</a></p>
                  <p>Firefox: <a target="_blank" rel="noopener noreferrer" href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox?redirectslug=delete-cookies-remove-info-websites-stored&redirectlocale=en-US" className="text-primary hover:underline">https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox?redirectslug=delete-cookies-remove-info-websites-stored&redirectlocale=en-US</a></p>
                  <p>Internet Explorer: <a target="_blank" rel="noopener noreferrer" href="https://support.microsoft.com/en-us/topic/how-to-delete-cookie-files-in-internet-explorer-bca9446f-d873-78de-77ba-d42645fa52fc" className="text-primary hover:underline">https://support.microsoft.com/en-us/topic/how-to-delete-cookie-files-in-internet-explorer-bca9446f-d873-78de-77ba-d42645fa52fc</a></p>
                  <p>If you are using a different web browser, please refer to its official support documentation.</p>
                </div>
                
                <p className="cookie-policy-p">Cookie Policy generated by <a target="_blank" rel="noopener noreferrer" href="https://www.cookieyes.com/?utm_source=CP&utm_medium=footer&utm_campaign=UW" className="text-primary hover:underline">CookieYes - Cookie Policy Generator</a></p>
                {/* End CookieYes cookie policy */}
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
                <OspiterAILogo size="lg" className="text-primary" />
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
            <p className="text-gray-400 text-sm">&copy; 2025 HostGPT. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
