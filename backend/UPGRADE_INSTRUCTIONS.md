# 🚀 Istruzioni Aggiornamento Sistema Abbonamento HostGPT

## 📋 Riepilogo Modifiche

### Sistema Precedente ❌
- Periodo di prova gratuito di 14 giorni
- Prezzo non specificato
- Nessun limite ai messaggi
- Accesso alla dashboard anche senza abbonamento

### Nuovo Sistema ✅
- **NESSUN periodo di prova**
- **Abbonamento mensile: 29€/mese**
- **Limite: 1000 messaggi/mese**
- **Dashboard bloccata senza abbonamento attivo**
- **Verifica email obbligatoria con redirect immediato al pagamento**

## 🔧 Passaggi per l'Aggiornamento

### 1. Backup Database
```bash
# IMPORTANTE: Fai sempre un backup prima di migrazioni!
mysqldump -u username -p hostgpt > backup_hostgpt_$(date +%Y%m%d).sql
```

### 2. Applica Migrazioni Database
```bash
cd backend
python run_migrations.py
```

### 3. Configura Stripe

#### A. Crea il Prodotto su Stripe Dashboard
1. Vai su [Stripe Dashboard](https://dashboard.stripe.com)
2. **Prodotti** → **Aggiungi prodotto**
3. Configura:
   - Nome: `HostGPT Monthly`
   - Prezzo: `29.00 EUR`
   - Fatturazione: `Mensile ricorrente`
4. Copia il `price_ID` (inizia con `price_`)

#### B. Configura Webhook
1. **Sviluppatori** → **Webhook** → **Aggiungi endpoint**
2. URL: `https://tuodominio.com/api/subscription/webhook`
3. Eventi:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Copia il `webhook secret` (inizia con `whsec_`)

### 4. Aggiorna File .env
```env
# Stripe - PRODUZIONE
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=price_xxxxx  # DEVE essere il price ID per 29€/mese!
# Guardian Price IDs per i diversi livelli
STRIPE_STANDARD_GUARDIAN_PRICE_ID=price_standard_guardian_9eur  # Guardian Standard: 9€/mese
STRIPE_PREMIUM_GUARDIAN_PRICE_ID=price_premium_guardian_18eur  # Guardian Premium: 18€/mese
STRIPE_PRO_GUARDIAN_PRICE_ID=price_pro_guardian_36eur  # Guardian Pro: 36€/mese
STRIPE_ENTERPRISE_GUARDIAN_PRICE_ID=price_enterprise_guardian_89eur  # Guardian Enterprise: 89€/mese
```

### 5. Riavvia il Backend
```bash
# Se usi PM2
pm2 restart hostgpt-backend

# Se usi systemd
sudo systemctl restart hostgpt-backend

# Per sviluppo
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Test del Sistema

#### Test Registrazione e Pagamento:
1. Registra un nuovo utente
2. Verifica che riceva l'email di conferma
3. Clicca sul link → deve essere reindirizzato a Stripe Checkout
4. Completa pagamento (usa carta test: `4242 4242 4242 4242`)
5. Verifica accesso alla dashboard

#### Test Limiti Messaggi:
1. Accedi con utente con abbonamento
2. Verifica nel dashboard: "Messaggi rimanenti: 1000"
3. Invia messaggi tramite chatbot
4. Verifica che il contatore diminuisca
5. Al raggiungimento di 1000 messaggi → deve bloccare

## 🔍 Verifica Post-Aggiornamento

### Check Database
```sql
-- Verifica nuove colonne
DESCRIBE users;

-- Controlla utenti con abbonamento
SELECT email, subscription_status, messages_limit, messages_used 
FROM users 
WHERE subscription_status = 'active';
```

### Test Endpoints
```bash
# Test stato abbonamento
curl -H "Authorization: Bearer TOKEN" \
  https://tuodominio.com/api/subscription/status

# Risposta attesa:
{
  "subscription_status": "active",
  "messages_limit": 1000,
  "messages_used": 0,
  "messages_remaining": 1000,
  "monthly_price": "29€"
}
```

## ⚠️ Note Importanti

### Per Utenti Esistenti
- Gli utenti esistenti mantengono il loro stato abbonamento
- Se avevano abbonamento attivo, il contatore messaggi parte da 0
- Dovranno rinnovare a 29€/mese alla scadenza

### Gestione Errori Comuni

**Problema**: Dashboard bloccata per tutti
- **Soluzione**: Verifica che gli utenti abbiano `subscription_status = 'active'`

**Problema**: Messaggi non conteggiati
- **Soluzione**: Verifica che `messages_reset_date` sia impostata

**Problema**: Webhook Stripe non funziona
- **Soluzione**: Verifica STRIPE_WEBHOOK_SECRET e che l'URL sia pubblico

## 📊 Monitoraggio

### Query Utili
```sql
-- Utenti con abbonamento attivo
SELECT COUNT(*) FROM users WHERE subscription_status = 'active';

-- Utilizzo messaggi medio
SELECT AVG(messages_used) FROM users WHERE subscription_status = 'active';

-- Utenti vicini al limite
SELECT email, messages_used 
FROM users 
WHERE subscription_status = 'active' 
AND messages_used > 900;
```

## 🆘 Supporto

In caso di problemi:
1. Controlla i log: `tail -f backend/logs/app.log`
2. Verifica Stripe Dashboard per errori webhook
3. Esegui test configurazione: `python test_config.py`

## ✅ Checklist Finale

- [ ] Backup database effettuato
- [ ] Migrazioni applicate con successo
- [ ] Stripe configurato con prezzo 29€/mese
- [ ] File .env aggiornato con nuove chiavi
- [ ] Backend riavviato
- [ ] Test registrazione completato
- [ ] Test pagamento completato
- [ ] Test limite messaggi completato
- [ ] Webhook Stripe funzionante
- [ ] Monitoraggio attivo

---
**Data Aggiornamento**: Gennaio 2024
**Versione Sistema**: 2.0 - Abbonamento Mensile
