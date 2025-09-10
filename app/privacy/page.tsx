'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Shield, Mail, Phone, MapPin } from 'lucide-react'

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
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500 mt-4">
              Last Updated On 10-Sep-2025 | Effective Date 10-Sep-2025
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
            {/* Privacy Policy Content */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="prose prose-lg max-w-none text-gray-600">
                <p className="text-gray-600 mb-6">
                  This Privacy Policy describes the policies of
                </p>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Simoncini Diego</strong></p>
                    <p>Via Enrico Capecchi, 28</p>
                    <p>PI 56025, Italy</p>
                    <p>Email: simoncinidiego10@gmail.com</p>
                    <p>Phone: 3391797616</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  on the collection, use and disclosure of your information that we collect
                  when you use our website ( https://www.hostgpt.it ).
                  (the "Service"). By accessing or using
                  the Service, you are consenting to the collection, use and
                  disclosure of your information in accordance with this
                  Privacy Policy. If you do not consent to the same,
                  please do not access or use the Service.
                </p>

                <p className="text-gray-600 mb-8">
                  We may modify this Privacy Policy at any time without
                  any prior notice to you and will post the revised
                  Privacy Policy on the Service. The revised Policy will
                  be effective 180 days from when the
                  revised Policy is posted in the Service and your
                  continued access or use of the Service after such time
                  will constitute your acceptance of the revised Privacy
                  Policy. We therefore recommend that you periodically
                  review this page.
                </p>

                <ol className="space-y-8">
                  <li>
                    <h2 className="text-2xl font-bold text-dark mb-4">Information We Collect:</h2>
                    <p className="text-gray-600 mb-4">
                      We will collect and process the following
                      personal information about you:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-600">
                      <li>Name</li>
                      <li>Email</li>
                      <li>Mobile</li>
                    </ol>
                  </li>

                  <li>
                    <h2 className="text-2xl font-bold text-dark mb-4">How We Collect Your Information:</h2>
                    <p className="text-gray-600 mb-4">
                      We collect/receive information about you in the
                      following manner:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-600">
                      <li>When a user fills up the registration form or otherwise submits personal information</li>
                      <li>Interacts with the website</li>
                      <li>From public sources</li>
                    </ol>
                  </li>

                  <li>
                    <h2 className="text-2xl font-bold text-dark mb-4">How We Use Your Information:</h2>
                    <p className="text-gray-600 mb-4">
                      We will use the information that we collect
                      about you for the following purposes:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-600">
                      <li>Marketing/ Promotional</li>
                      <li>Creating user account</li>
                      <li>Testimonials</li>
                      <li>Customer feedback collection</li>
                      <li>Enforce T&C</li>
                      <li>Processing payment</li>
                      <li>Support</li>
                      <li>Administration info</li>
                      <li>Targeted advertising</li>
                      <li>Dispute resolution</li>
                      <li>Manage user account</li>
                    </ol>
                    <p className="text-gray-600 mt-4">
                      If we want to use your information for any other
                      purpose, we will ask you for consent and will
                      use your information only on receiving your
                      consent and then, only for the purpose(s) for
                      which grant consent unless we are required to do
                      otherwise by law.
                    </p>
                  </li>

                  <li>
                    <h2 className="text-2xl font-bold text-dark mb-4">How We Share Your Information:</h2>
                    <p className="text-gray-600 mb-4">
                      We will not transfer your personal information
                      to any third party without seeking your consent,
                      except in limited circumstances as described
                      below:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-600">
                      <li>Ad service</li>
                      <li>Marketing agencies</li>
                      <li>Analytics</li>
                      <li>Payment recovery services</li>
                    </ol>
                    <p className="text-gray-600 mt-4">
                      We require such third party's to use the
                      personal information we transfer to them only
                      for the purpose for which it was transferred and
                      not to retain it for longer than is required for
                      fulfilling the said purpose.
                    </p>
                    <p className="text-gray-600 mt-4">
                      We may also disclose your personal information
                      for the following: (1) to comply with applicable
                      law, regulation, court order or other legal
                      process; (2) to enforce your agreements with us,
                      including this Privacy Policy; or (3) to respond
                      to claims that your use of the Service violates
                      any third-party rights. If the Service or our
                      company is merged or acquired with another
                      company, your information will be one of the
                      assets that is transferred to the new owner.
                    </p>
                  </li>

                  <li>
                    <h2 className="text-2xl font-bold text-dark mb-4">Retention Of Your Information:</h2>
                    <p className="text-gray-600">
                      We will retain your personal information with us
                      for 90 days to 2 years after users terminate their accounts
                      or for as long as we need it to fulfill the purposes for
                      which it was collected as detailed in this
                      Privacy Policy. We may need to retain certain
                      information for longer periods such as
                      record-keeping / reporting in accordance with
                      applicable law or for other legitimate reasons
                      like enforcement of legal rights, fraud
                      prevention, etc. Residual anonymous information
                      and aggregate information, neither of which
                      identifies you (directly or indirectly), may be
                      stored indefinitely.
                    </p>
                  </li>

                  <li>
                    <h2 className="text-2xl font-bold text-dark mb-4">Your Rights:</h2>
                    <p className="text-gray-600 mb-4">
                      Depending on the law that applies, you may have
                      a right to access and rectify or erase your
                      personal data or receive a copy of your personal
                      data, restrict or object to the active
                      processing of your data, ask us to share (port)
                      your personal information to another entity,
                      withdraw any consent you provided to us to
                      process your data, a right to lodge a complaint
                      with a statutory authority and such other rights
                      as may be relevant under applicable laws. To
                      exercise these rights, you can write to us at
                      simoncinidiego10@gmail.com.
                      We will respond to your
                      request in accordance with applicable law.
                    </p>
                    <p className="text-gray-600">
                      Do note that if you do not allow us to collect
                      or process the required personal information or
                      withdraw the consent to process the same for the
                      required purposes, you may not be able to access
                      or use the services for which your information
                      was sought.
                    </p>
                  </li>

                  <li>
                    <h2 className="text-2xl font-bold text-dark mb-4">Cookies Etc.</h2>
                    <p className="text-gray-600">
                      To learn more about how we use these
                      and your choices in relation to these tracking
                      technologies, please refer to our
                      <a href="https://www.hostgpt.it/cookiepolicy" className="text-primary hover:underline ml-1">Cookie Policy.</a>
                    </p>
                  </li>

                  <li>
                    <h2 className="text-2xl font-bold text-dark mb-4">Security:</h2>
                    <p className="text-gray-600">
                      The security of your information is important to
                      us and we will use reasonable security measures
                      to prevent the loss, misuse or unauthorized
                      alteration of your information under our
                      control. However, given the inherent risks, we
                      cannot guarantee absolute security and
                      consequently, we cannot ensure or warrant the
                      security of any information you transmit to us
                      and you do so at your own risk.
                    </p>
                  </li>

                  <li>
                    <h2 className="text-2xl font-bold text-dark mb-4">Grievance / Data Protection Officer:</h2>
                    <p className="text-gray-600">
                      If you have any queries or concerns about the
                      processing of your information that is available
                      with us, you may email our Grievance Officer at
                      Simoncini Diego,
                      Via Enrico Capecchi, 28,
                      email: simoncinidiego10@gmail.com.
                      We will address your concerns in accordance with applicable law.
                    </p>
                  </li>
                </ol>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">
                    Privacy Policy generated with <a target="_blank" href="https://www.cookieyes.com/?utm_source=PP&utm_medium=footer&utm_campaign=UW" className="text-primary hover:underline">CookieYes</a>.
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
