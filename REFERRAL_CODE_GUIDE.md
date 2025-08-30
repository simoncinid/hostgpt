# 🎁 Sistema Referral Code - HostGPT

## Panoramica

Il sistema di referral codes permette agli utenti di ottenere **100 messaggi bonus al mese** quando sottoscrivono un abbonamento utilizzando un codice valido.

## Funzionalità Implementate

### ✅ Modello Database
- **Tabella `referral_codes`**: Gestisce i codici referral
- **Colonne aggiunte a `users`**: `referral_code_id` e `referral_code_used_at`
- **Relazioni**: Un utente può usare un solo referral code

### ✅ API Endpoints

#### 1. Validazione Referral Code
```http
POST /api/referral/validate
Content-Type: application/json

{
  "code": "RUZZIPRIV"
}
```

**Risposta:**
```json
{
  "valid": true,
  "bonus_messages": 100,
  "message": "Codice valido! Riceverai 100 messaggi bonus al mese"
}
```

#### 2. Statistiche Referral Codes
```http
GET /api/referral/stats
```

**Risposta:**
```json
{
  "total_codes": 1,
  "active_codes": 1,
  "users_with_referral": 0,
  "top_codes": [
    {
      "code": "RUZZIPRIV",
      "description": "Codice referral speciale",
      "bonus_messages": 100,
      "current_uses": 0,
      "max_uses": null,
      "is_active": true
    }
  ]
}
```

#### 3. Informazioni Utente Aggiornate
```http
GET /api/auth/me
```

**Nuovi campi nella risposta:**
```json
{
  // ... altri campi ...
  "referral_code_used": "RUZZIPRIV",
  "referral_code_used_at": "2024-01-15T10:30:00"
}
```

### ✅ Integrazione Pagamenti

Il referral code viene applicato automaticamente durante la conferma del pagamento:

1. **Validazione**: Il codice viene validato prima dell'applicazione
2. **Controllo duplicati**: Un utente può usare un solo referral code
3. **Bonus applicato**: I messaggi bonus vengono aggiunti al limite mensile
4. **Tracking**: Viene registrato quando e quale codice è stato utilizzato

## Codice di Default

**Codice**: `RUZZIPRIV`
- **Bonus**: 100 messaggi al mese
- **Utilizzi massimi**: Illimitato
- **Stato**: Attivo
- **Scadenza**: Nessuna

## Come Funziona

### 1. Validazione
```python
# L'utente inserisce il codice durante il checkout
referral_code = "RUZZIPRIV"

# Il sistema valida il codice
is_valid, code_obj, message = validate_referral_code(referral_code, db)
```

### 2. Applicazione durante il pagamento
```python
# Durante la conferma del pagamento
if request.referral_code and not current_user.referral_code_id:
    # Applica il bonus
    bonus_messages = referral_code_obj.bonus_messages
    current_user.messages_limit += bonus_messages
    
    # Registra l'utilizzo
    current_user.referral_code_id = referral_code_obj.id
    current_user.referral_code_used_at = datetime.utcnow()
    
    # Incrementa il contatore
    referral_code_obj.current_uses += 1
```

### 3. Risultato
- **Prima**: Limite mensile 1000 messaggi
- **Dopo**: Limite mensile 1100 messaggi (+100 bonus)

## Gestione Amministrativa

### Aggiungere Nuovi Codici

```sql
INSERT INTO referral_codes (
    code, 
    description, 
    bonus_messages, 
    is_active, 
    max_uses, 
    current_uses
) VALUES (
    'NUOVOCODICE', 
    'Descrizione del codice', 
    150, 
    TRUE, 
    50, 
    0
);
```

### Modificare Codici Esistenti

```sql
UPDATE referral_codes 
SET bonus_messages = 200, 
    max_uses = 100 
WHERE code = 'RUZZIPRIV';
```

### Disattivare Codici

```sql
UPDATE referral_codes 
SET is_active = FALSE 
WHERE code = 'CODICEDISATTIVATO';
```

## Sicurezza e Validazioni

### ✅ Controlli Implementati

1. **Codice valido**: Il codice deve esistere nel database
2. **Codice attivo**: Il codice deve essere marcato come attivo
3. **Non scaduto**: Verifica della data di scadenza
4. **Limite utilizzi**: Controllo del numero massimo di utilizzi
5. **Un solo utilizzo**: Un utente può usare un solo referral code
6. **Case insensitive**: I codici sono convertiti in maiuscolo

### ✅ Logging

Tutte le operazioni vengono loggate:
```python
logger.info(f"Referral code {code} applied to user {user_id}, bonus: {bonus_messages} messages")
logger.warning(f"Invalid referral code {code} for user {user_id}: {message}")
```

## Test e Verifica

### Script di Test
```bash
cd backend
python test_referral.py
```

### Test Manuali

1. **Validazione codice valido**:
   ```bash
   curl -X POST http://localhost:8000/api/referral/validate \
        -H "Content-Type: application/json" \
        -d '{"code": "RUZZIPRIV"}'
   ```

2. **Validazione codice non valido**:
   ```bash
   curl -X POST http://localhost:8000/api/referral/validate \
        -H "Content-Type: application/json" \
        -d '{"code": "CODICEINVALIDO"}'
   ```

3. **Statistiche**:
   ```bash
   curl http://localhost:8000/api/referral/stats
   ```

## Frontend Integration

### Esempio di Implementazione

```javascript
// Validazione referral code
async function validateReferralCode(code) {
  const response = await fetch('/api/referral/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  const result = await response.json();
  
  if (result.valid) {
    showSuccess(`Codice valido! +${result.bonus_messages} messaggi bonus`);
  } else {
    showError(result.message);
  }
}

// Durante il checkout
async function confirmPayment(paymentIntentId, referralCode = null) {
  const response = await fetch('/api/subscription/confirm-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      payment_intent_id: paymentIntentId,
      referral_code: referralCode 
    })
  });
  
  const result = await response.json();
  
  if (result.bonus_messages > 0) {
    showSuccess(`Abbonamento attivato + ${result.bonus_messages} messaggi bonus!`);
  }
}
```

## Monitoraggio e Analytics

### Metriche Disponibili

- **Codici totali**: Numero di codici referral creati
- **Codici attivi**: Codici attualmente utilizzabili
- **Utenti con referral**: Numero di utenti che hanno usato un codice
- **Top codici**: Codici più utilizzati
- **Utilizzi per codice**: Contatore di utilizzi per ogni codice

### Dashboard Admin (Futuro)

```python
@app.get("/api/admin/referral-dashboard")
async def get_referral_dashboard():
    # Statistiche dettagliate per admin
    # Grafici di utilizzo nel tempo
    # Performance dei codici
    pass
```

## Troubleshooting

### Problemi Comuni

1. **Codice non riconosciuto**
   - Verifica che il codice sia in maiuscolo
   - Controlla che sia attivo nel database

2. **Bonus non applicato**
   - Verifica che l'utente non abbia già usato un referral code
   - Controlla i log per errori durante l'applicazione

3. **Errore database**
   - Verifica che le tabelle siano state create correttamente
   - Controlla la connessione al database

### Log di Debug

```python
# Abilita logging dettagliato
logging.getLogger().setLevel(logging.DEBUG)
```

## Roadmap Futura

### 🚀 Funzionalità Pianificate

1. **Codici temporanei**: Scadenza automatica
2. **Codici personalizzati**: Generazione automatica
3. **Sistema di inviti**: Invio automatico di codici
4. **Analytics avanzati**: Grafici e report
5. **Dashboard admin**: Interfaccia di gestione
6. **Codici multipli**: Possibilità di usare più codici
7. **Bonus progressivi**: Bonus crescenti per utilizzi multipli

### 🔧 Miglioramenti Tecnici

1. **Cache Redis**: Per validazioni veloci
2. **Rate limiting**: Per prevenire abusi
3. **Webhook**: Notifiche per nuovi utilizzi
4. **API versioning**: Per compatibilità futura

---

## 📞 Supporto

Per domande o problemi con il sistema referral code, contatta il team di sviluppo.

**Ultimo aggiornamento**: 30 Agosto 2024
**Versione**: 1.0.0
