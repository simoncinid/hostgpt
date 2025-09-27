interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  ogImage?: string
  ogType?: string
  noindex?: boolean
}

export default function SEOHead({
  title = 'HostGPT - Assistente AI per Proprietà in Affitto Breve | Gestione Ospiti Airbnb',
  description = 'HostGPT è il miglior assistente AI per gestire le proprietà in affitto breve e gli ospiti Airbnb. Chatbot intelligenti 24/7 per host, risposte automatiche, gestione prenotazioni e supporto multilingue.',
  keywords = 'hostgpt, assistente AI, proprietà affitto breve, gestione ospiti airbnb, chatbot host, AI airbnb, assistente virtuale proprietà, gestione affitti vacanza, chatbot intelligente, AI ospitalità, host assistant, airbnb management, short term rental AI, property management AI, guest management, automated responses, 24/7 support, multilingue, italiano, inglese',
  canonical = 'https://ospiterai.it',
  ogImage = '/icons/logohostgpt.png',
  ogType = 'website',
  noindex = false
}: SEOHeadProps) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="HostGPT" />
      <meta property="og:locale" content="it_IT" />
      <meta property="og:locale:alternate" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@hostgpt" />
      
      {/* Additional SEO */}
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="googlebot" content="index,follow" />
      <meta name="bingbot" content="index,follow" />
      
      {/* Mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="HostGPT" />
      
      {/* Favicon */}
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/logohostgpt.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icons/logohostgpt.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/logohostgpt.png" />
      <link rel="shortcut icon" href="/icons/logohostgpt.png" />
      
      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </>
  )
}