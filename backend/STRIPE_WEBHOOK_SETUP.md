# 🔗 Configurazione Webhook Stripe

## 📋 Panoramica

Il sistema ora utilizza i **webhook di Stripe** per gestire automaticamente i reset delle conversazioni, eliminando la necessità di controlli manuali ad ogni richiesta.

## 🎯 Vantaggi del Sistema Webhook

### ✅ **Prima (Controlli Manuali):**
- ❌ Controllo ad ogni messaggio/conversazione
- ❌ Overhead di database ad ogni richiesta
- ❌ Possibili inconsistenze temporali
- ❌ Logica complessa nel codice

### ✅ **Ora (Webhook Stripe):**
- ✅ Reset automatico al rinnovo
- ✅ Zero overhead durante l'uso
- ✅ Sincronizzazione perfetta con Stripe
- ✅ Logica centralizzata e pulita

## 🔧 Configurazione Webhook

### 1. **Endpoint Webhook**
```
URL: https://your-backend.com/api/webhooks/stripe
Metodo: POST
```

### 2. **Eventi da Ascoltare**
- `invoice.payment_succeeded` - Rinnovo mensile
- `customer.subscription.updated` - Cambio piano
- `customer.subscription.deleted` - Cancellazione

### 3. **Configurazione in Stripe Dashboard**

1. Vai su **Developers > Webhooks**
2. Clicca **"Add endpoint"**
3. Inserisci l'URL del tuo backend
4. Seleziona gli eventi:
   - `invoice.payment_succeeded`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
5. Copia il **Signing Secret** (inizia con `whsec_`)

### 4. **Variabile d'Ambiente**
```env
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
```

## 🔄 Come Funziona

### **Rinnovo Mensile (invoice.payment_succeeded)**
```python
# Quando Stripe conferma il pagamento mensile
user.conversations_used = 0          # Reset contatore
user.conversations_reset_date = now  # Nuova data reset
user.messages_used = 0               # Reset anche messaggi
user.messages_reset_date = now       # Nuova data reset
```

### **Cambio Piano (customer.subscription.updated)**
```python
# Quando l'utente cambia piano (es. Standard → Premium)
new_limit = get_conversations_limit_by_price_id(price_id)
user.conversations_limit = new_limit     # Nuovo limite
user.conversations_used = 0              # Reset contatore
user.conversations_reset_date = now      # Nuova data
```

### **Cancellazione (customer.subscription.deleted)**
```python
# Quando l'abbonamento viene cancellato
user.subscription_status = 'cancelled'
user.subscription_end_date = now
```

## 🚀 Test del Sistema

### **Test Locale con Stripe CLI**
```bash
# Installa Stripe CLI
stripe listen --forward-to localhost:8000/api/webhooks/stripe

# In un altro terminale, simula un evento
stripe trigger invoice.payment_succeeded
```

### **Test in Produzione**
1. Crea un abbonamento di test
2. Simula un rinnovo
3. Verifica che `conversations_used` si resetti a 0

## 📊 Monitoraggio

### **Log da Controllare**
```bash
# Reset al rinnovo
"Reset conversations for user {user_id} on invoice payment"

# Cambio piano
"Updated limits for user {user_id}: {new_limit} conversations"

# Cancellazione
"Cancelled subscription for user {user_id}"
```

### **Database da Verificare**
```sql
-- Controlla che i reset funzionino
SELECT 
    id, 
    conversations_used, 
    conversations_reset_date,
    subscription_status
FROM users 
WHERE subscription_status = 'active';
```

## ⚠️ Troubleshooting

### **Webhook Non Ricevuti**
1. Verifica l'URL dell'endpoint
2. Controlla i log di Stripe Dashboard
3. Verifica la firma del webhook

### **Reset Non Funzionanti**
1. Controlla che gli eventi siano abilitati
2. Verifica i log del backend
3. Testa con Stripe CLI

### **Errori di Firma**
```python
# Verifica che STRIPE_WEBHOOK_SECRET sia corretto
# Deve iniziare con 'whsec_'
```

## 🎉 Risultato Finale

Con questo sistema:
- **Zero controlli manuali** durante l'uso
- **Reset automatici** al rinnovo
- **Sincronizzazione perfetta** con Stripe
- **Performance ottimali** per l'utente
- **Logica centralizzata** e manutenibile

Il sistema è ora **completamente automatico** e **efficiente**! 🚀
