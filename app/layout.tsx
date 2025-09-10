import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from '../lib/languageContext'

export const metadata: Metadata = {
  title: 'HostGPT - Chatbot Intelligenti per Host',
  description: 'Crea chatbot personalizzati per i tuoi affitti vacanza. Offri ai tuoi ospiti assistenza 24/7 con informazioni sulla casa e sulla zona.',
  keywords: 'chatbot, host, affitti, vacanze, assistente virtuale, AI, intelligenza artificiale',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="font-sans">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
        {/* Start cookieyes banner */}
        <script id="cookieyes" type="text/javascript" src="https://cdn-cookieyes.com/client_data/9bd4c4de7a79f5e4c219078d/script.js"></script>
        {/* End cookieyes banner */}
      </body>
    </html>
  )
}
