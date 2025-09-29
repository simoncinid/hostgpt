import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from '../lib/languageContext'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  metadataBase: new URL('https://ospiterai.it'),
  title: 'OspiterAI - Assistente AI per Proprietà in Affitto Breve | Gestione Ospiti Airbnb',
  description: 'OspiterAI è il miglior assistente AI per gestire le proprietà in affitto breve e gli ospiti Airbnb. Chatbot intelligenti 24/7 per host, risposte automatiche, gestione prenotazioni e supporto multilingue.',
  keywords: 'hostgpt, assistente AI, proprietà affitto breve, gestione ospiti airbnb, chatbot host, AI airbnb, assistente virtuale proprietà, gestione affitti vacanza, chatbot intelligente, AI ospitalità, host assistant, airbnb management, short term rental AI, property management AI, guest management, automated responses, 24/7 support, multilingue, italiano, inglese',
  authors: [{ name: 'OspiterAI Team' }],
  creator: 'OspiterAI',
  publisher: 'OspiterAI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    alternateLocale: ['en_US'],
    url: 'https://ospiterai.it',
    siteName: 'OspiterAI',
    title: 'OspiterAI - Assistente AI per Proprietà in Affitto Breve',
    description: 'Il miglior assistente AI per gestire le proprietà in affitto breve e gli ospiti Airbnb. Chatbot intelligenti 24/7 per host.',
    images: [
      {
        url: '/icons/logohostgpt.png',
        width: 1200,
        height: 630,
        alt: 'OspiterAI - Assistente AI per Proprietà in Affitto Breve',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OspiterAI - Assistente AI per Proprietà in Affitto Breve',
    description: 'Il miglior assistente AI per gestire le proprietà in affitto breve e gli ospiti Airbnb.',
    images: ['/icons/logohostgpt.png'],
    creator: '@hostgpt',
  },
  icons: {
    icon: [
      { url: '/icons/logohostgpt.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/logohostgpt.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/logohostgpt.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/logohostgpt.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://hostgpt.com',
      languages: {
        'it-IT': 'https://ospiterai.it',
        'en-US': 'https://ospiterai.it/en',
      },
  },
  category: 'technology',
  classification: 'AI Assistant for Short-term Rental Management',
  other: {
    // Performance optimizations
    'preload': '/icons/logohostgpt.png',
  },
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
      <head>
        <link rel="canonical" href="https://ospiterai.it" />
        <meta name="google-site-verification" content="your-google-verification-code" />
        <meta name="msvalidate.01" content="your-bing-verification-code" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OspiterAI" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "OspiterAI",
              "description": "Assistente AI per gestire le proprietà in affitto breve e gli ospiti Airbnb",
              "url": "https://ospiterai.it",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
              },
              "creator": {
                "@type": "Organization",
                "name": "OspiterAI",
                "url": "https://ospiterai.it"
              },
              "keywords": "hostgpt, assistente AI, proprietà affitto breve, gestione ospiti airbnb, chatbot host, AI airbnb",
              "inLanguage": ["it", "en"]
            })
          }}
        />
      </head>
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
        <Analytics />
        {/* Start cookieyes banner */}
        <script id="cookieyes" type="text/javascript" src="https://cdn-cookieyes.com/client_data/65fd15cbd6f7bed8d5de4f08/script.js"></script>
        {/* End cookieyes banner */}
      </body>
    </html>
  )
}
