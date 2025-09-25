# Sistema Gestione Ospiti - Frontend (SEMPLIFICATO)

## 🎯 Implementazione Semplificata

### 1. **Form Unico nella Schermata di Benvenuto**
- **Un solo form**: Telefono ed email nella schermata di benvenuto
- **Validazione**: Formato telefono internazionale e email
- **Menu a tendina**: Selezione paese con bandiere
- **Niente passaggi multipli**: Tutto in un unico step

### 2. **Ricaricamento Automatico Conversazioni**
- **Identificazione**: Sistema riconosce l'ospite tramite telefono/email
- **Riprendi conversazione**: Automaticamente carica l'ultima conversazione
- **Nuova conversazione**: Solo se l'ospite clicca "Nuova Conversazione"

### 3. **Componenti Creati**

#### **CountrySelector.tsx**
```typescript
// Menu a tendina con tutti i prefissi internazionali
<CountrySelector
  value={selectedCountryCode}
  onChange={setSelectedCountryCode}
  isDarkMode={isDarkMode}
/>
```

#### **Form Integrato nella Schermata di Benvenuto**
```typescript
// Form direttamente nella schermata di benvenuto
<div className="max-w-md mx-auto space-y-4 mb-6">
  {/* Telefono con menu a tendina paese */}
  <div className="flex gap-2">
    <CountrySelector value={selectedCountryCode} onChange={setSelectedCountryCode} />
    <input type="tel" value={phoneNumber} onChange={handlePhoneChange} />
  </div>
  
  {/* Email */}
  <input type="email" value={guestEmail} onChange={setGuestEmail} />
</div>
```

### 4. **API Aggiornate**

#### **Nuove Funzioni in lib/api.ts**
```typescript
// Identifica ospite
chat.identifyGuest(uuid, { phone, email, first_name, last_name })

// Ottieni conversazioni ospite
chat.getGuestConversations(uuid, guestId)

// Crea nuova conversazione
chat.createNewConversation(uuid, guestId)

// Valida telefono
chat.validatePhone(phone)

// Lista paesi
chat.getCountryCodes()
```

### 5. **Flusso di Lavoro SEMPLIFICATO**

#### **Tutti i Casi (Semplificato)**
1. Utente apre chat → **Schermata di benvenuto con form**
2. Inserisce telefono ed email (almeno uno dei due)
3. Clicca "Inizia Chat"
4. Sistema identifica ospite e carica conversazione
5. **Automaticamente** riprende ultima conversazione se esiste
6. Altrimenti crea nuova conversazione

#### **Nuova Conversazione Forzata**
1. Da chat esistente, clicca "Nuova Conversazione"
2. Sistema crea nuova conversazione per l'ospite
3. Marca come `is_forced_new = true`
4. Inizio chat fresca

### 6. **Validazioni Implementate**

#### **Telefono**
- Formato: `+[prefisso][numero]` (es. +393401234567)
- Prefissi supportati: Tutti i paesi del mondo
- Validazione in tempo reale
- Menu a tendina con bandiere

#### **Email**
- Formato standard RFC 5322
- Validazione regex
- Controllo in tempo reale

### 7. **Stati del Componente**

```typescript
// Nuovi stati aggiunti
const [showGuestForm, setShowGuestForm] = useState(false)
const [guestData, setGuestData] = useState<{
  id?: number
  phone?: string
  email?: string
  first_name?: string
  last_name?: string
} | null>(null)
const [isFirstTime, setIsFirstTime] = useState(false)
const [hasExistingConversation, setHasExistingConversation] = useState(false)
```

### 8. **Messaggi Aggiornati**

#### **Invio Messaggi**
```typescript
// Include dati ospite in ogni messaggio
const response = await chat.sendMessage(uuid, {
  content: inputMessage,
  thread_id: threadId,
  phone: guestData?.phone,
  email: guestData?.email,
  first_name: guestData?.first_name,
  last_name: guestData?.last_name,
  force_new_conversation: false
})
```

#### **Messaggi Vocali**
```typescript
// Include dati ospite anche per messaggi vocali
const response = await chat.sendVoiceMessage(uuid, audioBlob, threadId, guestName, {
  phone: guestData?.phone,
  email: guestData?.email,
  first_name: guestData?.first_name,
  last_name: guestData?.last_name,
  force_new_conversation: false
})
```

### 9. **UI/UX Miglioramenti**

#### **Form Responsive**
- Design mobile-first
- Validazione in tempo reale
- Messaggi di errore chiari
- Supporto dark mode

#### **Menu Paesi**
- Lista completa con bandiere
- Ricerca in tempo reale
- Ordinamento alfabetico
- Prefissi internazionali

#### **Feedback Utente**
- Indicatori di caricamento
- Messaggi di successo/errore
- Conferma identificazione
- Stato conversazione esistente

### 10. **Compatibilità**

#### **Retrocompatibilità**
- Mantiene funzionalità esistenti
- Fallback per ospiti anonimi
- Supporto vecchi thread_id

#### **Multilingua**
- Testi in italiano e inglese
- Form adattivo per lingua
- Messaggi di errore localizzati

## 🚀 Come Testare

### **Test Scenario 1: Ospite Nuovo**
1. Apri chat per la prima volta
2. Clicca "Inizia Chat"
3. Inserisci telefono + email
4. Verifica creazione conversazione

### **Test Scenario 2: Ospite Esistente**
1. Apri chat con stesso telefono/email
2. Verifica caricamento conversazione esistente
3. Continua chat normalmente

### **Test Scenario 3: Nuova Conversazione**
1. Da chat esistente, clicca "Nuova Conversazione"
2. Verifica creazione nuova conversazione
3. Verifica che sia marcata come `is_forced_new`

### **Test Scenario 4: Validazioni**
1. Testa telefono con formato sbagliato
2. Testa email con formato sbagliato
3. Verifica messaggi di errore
4. Testa menu a tendina paesi

## 📱 Responsive Design

- **Mobile**: Form ottimizzato per touch
- **Tablet**: Layout adattivo
- **Desktop**: Esperienza completa
- **Dark Mode**: Supporto completo

## 🔧 Configurazione

### **Variabili d'Ambiente**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### **Dipendenze**
- `framer-motion`: Animazioni
- `lucide-react`: Icone
- `react-hot-toast`: Notifiche
- `axios`: API calls

## 🎨 Personalizzazione

### **Temi**
- Supporto dark/light mode
- Colori personalizzabili
- Animazioni fluide

### **Lingue**
- Italiano (default)
- Inglese
- Facilmente estendibile

## 🐛 Debug

### **Console Logs**
- Identificazione ospite
- Caricamento conversazioni
- Errori validazione
- Stato form

### **Network Tab**
- Chiamate API ospite
- Validazione telefono
- Caricamento paesi
- Creazione conversazioni

Il sistema è ora completamente implementato e pronto per l'uso! 🎉
