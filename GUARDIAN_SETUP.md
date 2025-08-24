# 🛡️ HostGPT Guardian - Setup e Configurazione

## 📋 Panoramica

**HostGPT Guardian** è un servizio aggiuntivo che monitora la soddisfazione degli ospiti in tempo reale e previene recensioni negative. Il servizio costa **9€/mese** ed è disponibile solo per utenti con abbonamento HostGPT attivo.

## 🚀 Funzionalità

- **Monitoraggio soddisfazione** in tempo reale
- **Alert automatici** per ospiti insoddisfatti
- **Analisi sentiment** delle conversazioni
- **Dashboard statistiche** avanzate
- **Gestione alert** con risoluzione problemi
- **Prevenzione recensioni negative**

## ⚙️ Configurazione Stripe

### 1. Crea il Prodotto Guardian su Stripe

1. Vai su [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Clicca "Add product"
3. Configura:
   - **Name**: "HostGPT Guardian"
   - **Description**: "Servizio di monitoraggio soddisfazione ospiti"
   - **Pricing**: €9.00/month (recurring)
   - **Billing**: Monthly

### 2. Ottieni il Price ID

1. Dopo aver creato il prodotto, copia il **Price ID**
2. Sarà nel formato: `price_xxxxxxxxxxxxx`

### 3. Aggiorna il Backend

Modifica il file `backend/main.py` e sostituisci:

```python
# Per ora usa un price ID placeholder - dovrai crearlo su Stripe
guardian_price_id = "price_guardian_monthly_9eur"  # Sostituisci con il tuo Price ID
```

Con il tuo Price ID reale:

```python
guardian_price_id = "price_xxxxxxxxxxxxx"  # Il tuo Price ID di Stripe
```

## 🗄️ Database

Le tabelle sono state create automaticamente:

### Tabelle Guardian
- `guest_satisfaction`: Profili soddisfazione ospiti
- `satisfaction_alerts`: Alert di problemi rilevati

### Campi User Aggiunti
- `guardian_subscription_status`: Stato abbonamento Guardian
- `guardian_subscription_end_date`: Data fine abbonamento
- `guardian_stripe_subscription_id`: ID sottoscrizione Stripe

## 🔧 API Endpoints

### Status e Gestione
- `GET /api/guardian/status` - Stato abbonamento
- `POST /api/guardian/create-checkout` - Crea checkout Stripe
- `POST /api/guardian/cancel` - Annulla abbonamento
- `POST /api/guardian/reactivate` - Riattiva abbonamento

### Dashboard (solo abbonati)
- `GET /api/guardian/statistics` - Statistiche Guardian
- `GET /api/guardian/alerts` - Alert attivi
- `POST /api/guardian/alerts/{id}/resolve` - Risolve alert

## 🎯 Flusso Utente

### 1. Accesso alla Pagina Guardian
- L'utente clicca su "Guardian" nella sidebar
- Se non abbonato: vede animazione e button "Attiva Guardian - 9€/mese"
- Se abbonato: vede dashboard completa

### 2. Sottoscrizione
- Clicca "Attiva Guardian"
- Reindirizzato a Stripe Checkout
- Dopo pagamento: torna alla dashboard Guardian

### 3. Gestione Abbonamento
- **Attivo**: Può annullare l'abbonamento
- **In Annullamento**: Può riattivare l'abbonamento
- **Cancellato**: Può sottoscrivere di nuovo

## 🧪 Test del Sistema

Esegui il test per verificare il funzionamento:

```bash
cd backend
python test_guardian.py
```

## 📱 Frontend

### Pagina Guardian
- **Non abbonato**: Animazione + button sottoscrizione
- **Abbonato**: Dashboard con statistiche e alert

### Sidebar
- Mostra stato abbonamenti HostGPT e Guardian
- Icona verde per Guardian

### Gestione Abbonamento
- Sezione dedicata nella dashboard Guardian
- Pulsanti per annullare/riattivare

## 🔄 Webhook Stripe

Il webhook gestisce automaticamente:
- **checkout.session.completed**: Attiva abbonamento Guardian
- **customer.subscription.updated**: Aggiorna stato abbonamento
- **customer.subscription.deleted**: Cancella abbonamento

## 💡 Prossimi Passi

1. **Configura Stripe** con il Price ID corretto
2. **Testa il sistema** con utenti reali
3. **Implementa analisi sentiment** avanzata
4. **Aggiungi notifiche** email/SMS per alert critici
5. **Integra con piattaforme** di prenotazione

## 🆘 Supporto

Per problemi o domande:
- Controlla i log del backend
- Verifica configurazione Stripe
- Testa con `test_guardian.py`

---

**HostGPT Guardian** - Proteggi la tua reputazione, massimizza la soddisfazione degli ospiti! 🛡️✨
