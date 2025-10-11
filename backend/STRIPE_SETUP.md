# Configurazione Stripe per HostGPT

## Configurazione Abbonamento Mensile 29€

### 1. Crea il Prodotto su Stripe

1. Accedi alla [Dashboard Stripe](https://dashboard.stripe.com)
2. Vai su **Prodotti** → **Aggiungi prodotto**
3. Configura il prodotto:
   - **Nome**: HostGPT Monthly Subscription
   - **Descrizione**: Abbonamento mensile HostGPT - 1000 messaggi/mese
   - **Prezzo**: 29.00 EUR
   - **Tipo di fatturazione**: Ricorrente
   - **Intervallo di fatturazione**: Mensile
   - **ID prezzo**: Copia questo ID (inizia con `price_`)

### 2. Configura il Webhook

1. Vai su **Sviluppatori** → **Webhook**
2. Clicca **Aggiungi endpoint**
3. **URL endpoint**: `https://tuodominio.com/api/subscription/webhook`
4. **Eventi da ascoltare**:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
   - `customer.subscription.created`
5. Copia il **Signing secret** (inizia con `whsec_`)

### 3. Configura le Variabili d'Ambiente

Crea o aggiorna il file `.env` nella cartella backend:

```env
# Stripe Configuration - PRODUZIONE
STRIPE_SECRET_KEY=sk_live_tuachiave
STRIPE_PUBLISHABLE_KEY=pk_live_tuachiave
STRIPE_WEBHOOK_SECRET=whsec_tuosecret
STRIPE_PRICE_ID=price_iddelprezzo29euro
# Guardian Price IDs per i diversi livelli
STRIPE_STANDARD_GUARDIAN_PRICE_ID=price_standard_guardian_9eur
STRIPE_PREMIUM_GUARDIAN_PRICE_ID=price_premium_guardian_18eur
STRIPE_PRO_GUARDIAN_PRICE_ID=price_pro_guardian_36eur
STRIPE_ENTERPRISE_GUARDIAN_PRICE_ID=price_enterprise_guardian_89eur

# Per TEST usa le chiavi test
# STRIPE_SECRET_KEY=sk_test_tuachiave
# STRIPE_PUBLISHABLE_KEY=pk_test_tuachiave
# STRIPE_WEBHOOK_SECRET=whsec_tuosecrettest
# STRIPE_PRICE_ID=price_iddelprezzo29eurotest
# STRIPE_STANDARD_GUARDIAN_PRICE_ID=price_test_standard_guardian
# STRIPE_PREMIUM_GUARDIAN_PRICE_ID=price_test_premium_guardian
# STRIPE_PRO_GUARDIAN_PRICE_ID=price_test_pro_guardian
# STRIPE_ENTERPRISE_GUARDIAN_PRICE_ID=price_test_enterprise_guardian
```

### 4. Verifica Configurazione

Esegui lo script di test:
```bash
cd backend
python test_config.py
```

### 5. Note Importanti

- **NO PERIODO DI PROVA**: Il sistema non prevede periodo di prova gratuito
- **PAGAMENTO IMMEDIATO**: L'utente deve pagare subito dopo la verifica email
- **LIMITE MESSAGGI**: 1000 messaggi/mese per ogni account
- **RESET MENSILE**: I messaggi si resettano automaticamente ogni 30 giorni
- **BLOCCO DASHBOARD**: Senza abbonamento attivo, la dashboard è completamente bloccata

### 6. Test del Flusso

1. **Registrazione**: L'utente si registra
2. **Verifica Email**: Riceve email con link di verifica
3. **Redirect a Pagamento**: Dopo verifica, redirect automatico a Stripe Checkout
4. **Attivazione**: Dopo pagamento, abbonamento attivo e accesso completo
5. **Monitoraggio**: Dashboard mostra messaggi rimanenti (max 1000/mese)

### 7. Gestione Abbonamenti

- **Cancellazione**: Gli utenti possono cancellare da Stripe Customer Portal
- **Riabbonamento**: Quando un utente riabbona dopo aver annullato completamente, il sistema:
  - Resetta automaticamente tutti i campi dell'abbonamento (`stripe_subscription_id`, `subscription_end_date`, `messages_used`, `messages_reset_date`)
  - Aggiorna il database con il nuovo subscription ID
  - Mantiene la cronologia dei dati dell'utente (chatbot, conversazioni, etc.)
- **Aggiornamento Carte**: Gestito tramite Stripe Customer Portal
- **Fatture**: Inviate automaticamente da Stripe

### 8. Troubleshooting

Se il webhook non funziona:
1. Verifica che l'URL sia raggiungibile pubblicamente
2. Controlla i log in Stripe Dashboard → Webhook → Eventi
3. Verifica che il `STRIPE_WEBHOOK_SECRET` sia corretto
4. Assicurati che il server accetti POST requests su `/api/subscription/webhook`
