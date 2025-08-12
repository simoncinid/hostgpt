# HostGPT - Piattaforma Chatbot per Host 🏠🤖

HostGPT è una piattaforma completa che permette agli host di affitti vacanza di creare chatbot personalizzati per assistere i loro ospiti 24/7.

## 🚀 Funzionalità Principali

- **Creazione Guidata Chatbot**: Procedura step-by-step per configurare il chatbot
- **Knowledge Base Personalizzata**: Informazioni su casa, zona, servizi e FAQ
- **Assistente AI 24/7**: Powered by OpenAI GPT-4
- **Dashboard Analytics**: Statistiche complete su conversazioni e utilizzo
- **QR Code & Link Condivisibili**: Facile accesso per gli ospiti
- **Sistema di Abbonamento**: Integrazione con Stripe per pagamenti mensili
- **Multi-lingua**: Supporto per italiano, inglese, spagnolo, francese e tedesco

## 📋 Prerequisiti

- Node.js 18+ e npm
- Python 3.9+
- MySQL Database (DigitalOcean o locale)
- Account OpenAI con API Key
- Account Stripe (per pagamenti)
- Account email SMTP (Gmail o altro)

## 🔑 Configurazione API Keys

### 1. OpenAI API Key
- Vai su [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Crea una nuova API key
- **IMPORTANTE**: Assicurati di avere crediti sufficienti per GPT-4

### 2. Stripe Keys
- Registrati su [https://stripe.com](https://stripe.com)
- Vai su Dashboard → Developers → API keys
- Copia le chiavi Test (per sviluppo) o Live (per produzione)
- Crea un prodotto con prezzo mensile e copia il Price ID

### 3. Database MySQL
- Crea un database MySQL su DigitalOcean o usa uno locale
- Ottieni l'URL di connessione nel formato:
  ```
  mysql+pymysql://username:password@host:port/database_name?charset=utf8mb4
  ```

### 4. Email SMTP (Gmail)
- Per Gmail: abilita l'autenticazione a 2 fattori
- Crea una App Password: Account Google → Security → App passwords
- Usa questa password per SMTP_PASSWORD

## 🛠️ Installazione

### Backend (Python/FastAPI)

1. Naviga nella cartella backend:
```bash
cd backend
```

2. Crea ambiente virtuale:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

3. Installa dipendenze:
```bash
pip install -r requirements.txt
```

4. Crea file `.env` con le tue configurazioni:
```env
# Database
DATABASE_URL=mysql+pymysql://user:password@your-db-host:25060/hostgpt?charset=utf8mb4

# JWT Secret (genera una stringa casuale sicura)
SECRET_KEY=your-super-secret-key-change-this-in-production

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID=price_your-monthly-price-id

# Email (esempio Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@hostgpt.com

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Environment
ENVIRONMENT=development
```

5. Avvia il server:
```bash
python main.py
# oppure
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Il backend sarà disponibile su `http://localhost:8000`

### Frontend (Next.js)

1. Dalla root del progetto, installa dipendenze:
```bash
npm install
```

2. Crea file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

3. Avvia il development server:
```bash
npm run dev
```

Il frontend sarà disponibile su `http://localhost:3000`

## 🚀 Deploy su Produzione

### Backend su Render.com

1. Crea un nuovo Web Service su Render
2. Connetti il tuo repository GitHub
3. Configura:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**: Aggiungi tutte le variabili del `.env`

### Frontend su Vercel

1. Importa il progetto su [Vercel](https://vercel.com)
2. Configura le variabili d'ambiente:
   - `NEXT_PUBLIC_API_URL`: URL del tuo backend su Render
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: La tua chiave Stripe pubblica

### Database su DigitalOcean

1. Crea un MySQL Database Cluster
2. Configura le connection pools
3. Aggiungi il tuo IP alla whitelist
4. Usa l'URL di connessione nel backend

## 📱 Come Funziona

### Per gli Host:
1. **Registrazione**: Crea account e attiva abbonamento
2. **Creazione Chatbot**: Compila il form guidato con info su casa e zona
3. **Personalizzazione**: Aggiungi FAQ, contatti emergenza, etc.
4. **Condivisione**: Ottieni QR code e link da dare agli ospiti
5. **Monitoraggio**: Visualizza conversazioni e statistiche

### Per gli Ospiti:
1. Scansiona QR code o apri link
2. Inizia chat con nome (opzionale)
3. Fai domande su casa, zona, servizi
4. Ricevi risposte immediate 24/7

## 🔧 Configurazione Stripe Webhook

Per ricevere eventi da Stripe in locale:

1. Installa Stripe CLI
2. Esegui:
```bash
stripe listen --forward-to localhost:8000/api/subscription/webhook
```
3. Copia il webhook secret e aggiungilo al `.env`

## 📊 Struttura Database

Il sistema usa le seguenti tabelle principali:
- `users`: Utenti host registrati
- `chatbots`: Configurazioni chatbot
- `conversations`: Conversazioni con ospiti
- `messages`: Singoli messaggi
- `knowledge_base`: Knowledge base editabile
- `analytics`: Statistiche aggregate

## 🐛 Troubleshooting

### Errore OpenAI API
- Verifica di avere crediti sufficienti
- Controlla che l'API key sia valida
- Assicurati di avere accesso a GPT-4

### Errore Database Connection
- Verifica l'URL di connessione
- Controlla che il database sia raggiungibile
- Verifica username e password

### Errore Stripe
- Usa chiavi Test per sviluppo
- Verifica di aver creato un prodotto con prezzo

### Email non inviate
- Per Gmail: usa App Password, non la password normale
- Verifica le impostazioni SMTP
- Controlla spam folder

## 📝 Note Importanti

- **Sicurezza**: Non committare mai il file `.env` su Git
- **Backup**: Fai backup regolari del database
- **Monitoraggio**: Monitora l'uso delle API OpenAI per controllare i costi
- **GDPR**: Implementa policy privacy per conformità GDPR

## 🤝 Supporto

Per problemi o domande:
- Email: support@hostgpt.com
- Documentation: [docs.hostgpt.com](https://docs.hostgpt.com)

## 📄 Licenza

Copyright © 2024 HostGPT. Tutti i diritti riservati.

---

**Creato con ❤️ per semplificare la vita degli host**
