import Head from 'next/head'

export default function PerformanceOptimizer() {
  return (
    <Head>
      {/* Preload critical resources */}
      <link rel="preload" href="/icons/logohostgpt.png" as="image" type="image/png" />
      <link rel="preload" href="/fonts/apfel_grotezk/apfelGrotezk/ApfelGrotezk-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      {/* DNS prefetch for external domains */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//api.hostgpt.com" />
      
      {/* Resource hints for better performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Critical CSS inline for above-the-fold content */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Critical CSS for HostGPT branding and layout */
          .font-sans { font-family: 'Apfel Grotezk', system-ui, -apple-system, sans-serif; }
          .bg-gradient-to-r { background: linear-gradient(to right, #3B82F6, #1D4ED8); }
          .text-white { color: #ffffff; }
          .min-h-screen { min-height: 100vh; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        `
      }} />
      
      {/* Structured data for better search engine understanding */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "HostGPT",
            "url": "https://hostgpt.it",
            "description": "Assistente AI per gestire le proprietà in affitto breve e gli ospiti Airbnb",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://hostgpt.it/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "publisher": {
              "@type": "Organization",
              "name": "HostGPT",
              "logo": {
                "@type": "ImageObject",
                "url": "https://hostgpt.it/icons/logohostgpt.png"
              }
            }
          })
        }}
      />
      
      {/* Additional structured data for FAQ and services */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Cos'è HostGPT?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "HostGPT è un assistente AI specializzato nella gestione di proprietà in affitto breve e ospiti Airbnb. Offre chatbot intelligenti 24/7 per automatizzare le risposte e migliorare l'esperienza degli ospiti."
                }
              },
              {
                "@type": "Question",
                "name": "Come funziona HostGPT per la gestione degli ospiti Airbnb?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "HostGPT crea chatbot personalizzati che rispondono automaticamente alle domande degli ospiti, forniscono informazioni sulla proprietà, gestiscono check-in/check-out e offrono supporto multilingue 24 ore su 24."
                }
              },
              {
                "@type": "Question",
                "name": "HostGPT supporta più lingue?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sì, HostGPT supporta italiano e inglese, permettendo di gestire ospiti internazionali con risposte automatiche nella loro lingua preferita."
                }
              }
            ]
          })
        }}
      />
    </Head>
  )
}
