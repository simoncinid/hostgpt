# Sistema di Traduzione HostGPT

## Panoramica

Il sistema di traduzione implementato permette di cambiare dinamicamente la lingua dell'intera applicazione HostGPT tra Italiano (IT) e Inglese (ENG). Il sistema è completamente integrato e funziona in tempo reale senza necessità di ricaricare la pagina.

## Struttura del Sistema

### 1. File delle Traduzioni (`lib/translations.ts`)

Contiene tutte le traduzioni organizzate per sezioni:

- **Navbar**: Menu di navigazione
- **Hero**: Sezione principale della landing page
- **Demo**: Testi per la demo chat
- **Features**: Sezione funzionalità
- **How It Works**: Sezione "Come funziona"
- **Pricing**: Sezione prezzi
- **Auth**: Pagine di autenticazione (login/register)
- **Dashboard**: Dashboard utente
- **Chatbots**: Gestione chatbot
- **Guardian**: Sezione Guardian
- **Settings**: Impostazioni
- **Common**: Testi comuni utilizzati in tutta l'app

### 2. Context Provider (`lib/languageContext.tsx`)

Gestisce lo stato della lingua e fornisce le traduzioni a tutti i componenti:

- Mantiene la lingua selezionata nel localStorage
- Fornisce il hook `useLanguage()` per accedere alle traduzioni
- Aggiorna automaticamente tutti i componenti quando cambia la lingua

### 3. Selettore Lingua (`components/LanguageSelector.tsx`)

Componente per cambiare lingua con:
- Bandiere delle nazioni
- Animazioni fluide
- Design coerente con il resto dell'app

## Utilizzo

### Hook useLanguage

```typescript
import { useLanguage } from '@/lib/languageContext'

function MyComponent() {
  const { t, language, setLanguage } = useLanguage()
  
  return (
    <div>
      <h1>{t.hero.title}</h1>
      <p>Lingua attuale: {language}</p>
      <button onClick={() => setLanguage('ENG')}>
        Cambia in Inglese
      </button>
    </div>
  )
}
```

### Aggiungere Nuove Traduzioni

1. Aggiungi la nuova sezione nell'interfaccia `Translations` in `lib/translations.ts`
2. Aggiungi le traduzioni per entrambe le lingue (IT e ENG)
3. Usa `t.nuovaSezione.testo` nei componenti

### Esempio di Aggiunta Traduzione

```typescript
// In lib/translations.ts
export interface Translations {
  // ... altre sezioni
  nuovaSezione: {
    titolo: string
    descrizione: string
  }
}

export const translations: Record<Language, Translations> = {
  IT: {
    // ... altre traduzioni
    nuovaSezione: {
      titolo: "Il Mio Titolo",
      descrizione: "La mia descrizione"
    }
  },
  ENG: {
    // ... altre traduzioni
    nuovaSezione: {
      titolo: "My Title",
      descrizione: "My description"
    }
  }
}
```

## Pagine Tradotte

### ✅ Completamente Tradotte
- **Landing Page** (`app/page.tsx`)
  - Navbar con selettore lingua
  - Hero section
  - Features section
  - How it works section
  - Pricing section
  - Demo chat
  - Testimonials

- **Login Page** (`app/login/page.tsx`)
  - Tutti i testi del form
  - Messaggi di errore
  - Link di navigazione

### 🔄 Da Tradurre
- **Register Page** (`app/register/page.tsx`)
- **Dashboard** (`app/dashboard/page.tsx`)
- **Chatbots** (`app/dashboard/chatbots/page.tsx`)
- **Guardian** (`app/dashboard/guardian/page.tsx`)
- **Settings** (`app/dashboard/settings/page.tsx`)
- **Chat Pages** (`app/chat/[uuid]/page.tsx`)

## Test

È disponibile una pagina di test all'indirizzo `/test` per verificare che tutte le traduzioni funzionino correttamente.

## Caratteristiche Tecniche

- **TypeScript**: Tipizzazione completa per prevenire errori
- **React Context**: Gestione stato globale della lingua
- **localStorage**: Persistenza della scelta dell'utente
- **Framer Motion**: Animazioni fluide per il cambio lingua
- **Responsive**: Funziona su desktop e mobile
- **Performance**: Aggiornamento istantaneo senza ricaricamento

## Best Practices

1. **Usa sempre il hook `useLanguage()`** invece di importare direttamente le traduzioni
2. **Mantieni la struttura delle traduzioni organizzata** per sezioni logiche
3. **Aggiungi sempre le traduzioni per entrambe le lingue**
4. **Usa nomi descrittivi** per le chiavi delle traduzioni
5. **Testa sempre** che le traduzioni funzionino in entrambe le lingue

## Estensibilità

Il sistema è progettato per essere facilmente estendibile:

- **Nuove lingue**: Aggiungi semplicemente una nuova chiave nel record `translations`
- **Nuove sezioni**: Estendi l'interfaccia `Translations`
- **Traduzioni dinamiche**: Supporto per traduzioni con parametri (da implementare)

## Troubleshooting

### Problemi Comuni

1. **Errore "useLanguage must be used within a LanguageProvider"**
   - Assicurati che il componente sia avvolto nel `LanguageProvider` nel layout

2. **Traduzioni non aggiornate**
   - Verifica che stia usando `t.sezione.testo` invece di testo hardcoded

3. **TypeScript errors**
   - Controlla che l'interfaccia `Translations` sia aggiornata con tutte le sezioni

### Debug

Usa la pagina di test `/test` per verificare che tutte le traduzioni siano caricate correttamente.
