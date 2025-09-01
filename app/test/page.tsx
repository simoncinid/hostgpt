'use client'

import { useLanguage } from '../lib/languageContext'
import LanguageSelector from '../components/LanguageSelector'

export default function TestPage() {
  const { t, language } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Test Traduzioni</h1>
            <LanguageSelector />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Lingua Attuale: {language}</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700">Navbar</h3>
                  <p>Features: {t.navbar.features}</p>
                  <p>Demo: {t.navbar.demo}</p>
                  <p>Login: {t.navbar.login}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Hero</h3>
                  <p>Title: {t.hero.title}</p>
                  <p>Subtitle: {t.hero.subtitle}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Auth</h3>
                  <p>Login Title: {t.auth.login.title}</p>
                  <p>Email: {t.auth.login.email}</p>
                  <p>Password: {t.auth.login.password}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Demo Messages</h2>
              <div className="space-y-2">
                {t.demoMessages.map((msg, index) => (
                  <div key={index} className="p-3 bg-gray-100 rounded">
                    <span className="font-medium">{msg.role}:</span> {msg.text}
                  </div>
                ))}
              </div>
              
              <h2 className="text-xl font-semibold mb-4 mt-8">Testimonials</h2>
              <div className="space-y-2">
                {t.testimonials.map((testimonial, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded">
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-sm">{testimonial.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
