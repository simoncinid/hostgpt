# 🚀 QUICK START - HostGPT

## Avvio Rapido in 5 Minuti

### 1️⃣ Setup Automatico

**Windows:**
```bash
setup.bat
# Scegli opzione 1 per setup completo
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
# Scegli opzione 1 per setup completo
```

### 2️⃣ Configura le API Keys

Modifica `backend/.env` con:

```env
# OBBLIGATORI per funzionare:
OPENAI_API_KEY=sk-... # Da https://platform.openai.com/api-keys
DATABASE_URL=mysql+pymysql://user:pass@host:port/db # Il tuo database MySQL

# Per pagamenti (opzionale per test):
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3️⃣ Inizializza Database

**Windows:**
```bash
setup.bat
# Scegli opzione 5
```

**Mac/Linux:**
```bash
./setup.sh
# Scegli opzione 5
```

### 4️⃣ Avvia l'Applicazione

**Windows:**
```bash
setup.bat
# Scegli opzione 4
```

**Mac/Linux:**
```bash
./setup.sh
# Scegli opzione 4
```

### 5️⃣ Accedi all'App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

---

## 🔥 Test Rapido (senza configurazione completa)

Se vuoi solo vedere l'interfaccia senza configurare tutto:

### Solo Frontend (modalità demo):

```bash
# Installa dipendenze
npm install

# Avvia frontend
npm run dev
```

Vai su http://localhost:3000 per vedere la landing page e le schermate (senza funzionalità backend).

---

## ⚡ Comandi Utili

### Backend
```bash
cd backend
python -m venv venv          # Crea ambiente virtuale
venv\Scripts\activate         # Windows
source venv/bin/activate      # Mac/Linux
pip install -r requirements.txt
python main.py                # Avvia server
```

### Frontend
```bash
npm install                   # Installa dipendenze
npm run dev                   # Modalità sviluppo
npm run build                 # Build produzione
npm start                     # Avvia produzione
```

### Database
```bash
cd backend
python init_db.py             # Crea tabelle
python test_config.py         # Verifica configurazione
```

---

## 🆘 Problemi Comuni

### "OPENAI_API_KEY non valida"
→ Registrati su OpenAI e crea una API key: https://platform.openai.com/api-keys

### "Cannot connect to database"
→ Installa MySQL o usa un servizio cloud come DigitalOcean

### "Module not found"
→ Assicurati di aver attivato il virtual environment Python

### "Port already in use"
→ Cambia le porte in `backend/main.py` (8000) o `package.json` (3000)

---

## 📱 Primo Chatbot

1. Registrati su http://localhost:3000/register
2. Vai alla Dashboard
3. Clicca "Crea Nuovo Chatbot"
4. Compila il form guidato
5. Ottieni QR code e link per i tuoi ospiti!

---

## 💡 Suggerimenti

- Usa database MySQL locale per sviluppo
- OpenAI offre $5 di crediti gratuiti per nuovi account
- Stripe ha modalità Test gratuita
- Per email, usa Gmail con App Password

---

**Hai bisogno di aiuto?** Consulta il [README completo](README.md) per istruzioni dettagliate.
