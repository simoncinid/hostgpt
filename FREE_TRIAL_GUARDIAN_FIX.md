# Fix per Free Trial e Guardian

## Problemi Risolti

### 1. Display "HostGPT Annullato" invece di "HostGPT Prova Gratuita"

**Problema**: Quando un utente era in free trial, nella sidebar veniva mostrato "HostGPT Annullato" invece di "HostGPT Prova Gratuita".

**Soluzione**: Modificato il componente `Sidebar.tsx` per controllare prima se l'utente è in free trial attivo (`user?.is_free_trial_active`) prima di controllare lo stato dell'abbonamento.

```typescript
// Prima
{user?.subscription_status === 'active' ? 'HostGPT Attivo' : 
 user?.subscription_status === 'cancelling' ? 'HostGPT In Annullamento' : 
 'HostGPT Annullato'}

// Dopo
{user?.is_free_trial_active ? 'HostGPT Prova Gratuita' : 
 user?.subscription_status === 'active' ? 'HostGPT Attivo' : 
 user?.subscription_status === 'cancelling' ? 'HostGPT In Annullamento' : 
 'HostGPT Annullato'}
```

### 2. Attivazione Guardian durante Free Trial

**Problema**: Gli utenti in free trial non potevano attivare Guardian e ricevevano un errore.

**Soluzione**: Implementato un sistema di checkout combinato che permette agli utenti in free trial di sottoscrivere sia HostGPT che Guardian in un'unica transazione.

#### Modifiche Backend:

1. **Nuova funzione `create_combined_checkout_session`**: Crea una sessione di checkout Stripe con entrambi i prodotti (HostGPT 29€ + Guardian 9€).

2. **Aggiornamento webhook**: Il webhook principale ora gestisce il checkout combinato identificando le sottoscrizioni create e aggiornando sia HostGPT che Guardian.

3. **Logica di reindirizzamento**: Quando un utente in free trial prova ad attivare Guardian, viene automaticamente reindirizzato al checkout combinato.

#### Modifiche Frontend:

1. **Gestione checkout combinato**: La pagina Guardian ora mostra un messaggio informativo quando viene reindirizzato al checkout combinato.

### 3. Loop SQL

**Problema**: Il server andava in loop con query SQL ripetute.

**Soluzione**: Rimossi i riferimenti a campi inesistenti nel modello User (`guardian_messages_used` e `guardian_messages_reset_date`) che causavano errori e potenziali loop.

## Flusso Utente Aggiornato

### Utente in Free Trial che vuole attivare Guardian:

1. L'utente clicca su "Attiva Guardian" nella pagina Guardian
2. Il sistema rileva che è in free trial
3. Viene creata una sessione di checkout combinata (HostGPT + Guardian)
4. L'utente viene reindirizzato a Stripe per pagare 38€ (29€ HostGPT + 9€ Guardian)
5. Dopo il pagamento, il webhook aggiorna entrambi gli abbonamenti
6. L'utente torna alla dashboard con entrambi i servizi attivi

### Utente con Abbonamento HostGPT che vuole attivare Guardian:

1. L'utente clicca su "Attiva Guardian"
2. Viene creata una sessione di checkout solo per Guardian (9€)
3. L'utente paga solo per Guardian
4. Il webhook aggiorna solo l'abbonamento Guardian

## File Modificati

### Backend:
- `backend/main.py`: Aggiunta funzione checkout combinato e aggiornamento webhook
- Rimossi riferimenti a campi inesistenti nel modello

### Frontend:
- `app/components/Sidebar.tsx`: Corretto display stato free trial
- `app/dashboard/guardian/page.tsx`: Gestione checkout combinato

## Test

Per testare le modifiche:

1. **Free Trial Display**: Verificare che utenti in free trial vedano "HostGPT Prova Gratuita" in verde nella sidebar
2. **Guardian Activation**: Testare l'attivazione di Guardian per utenti in free trial
3. **Combined Checkout**: Verificare che il checkout combinato funzioni correttamente
4. **Webhook**: Controllare che i webhook gestiscano correttamente entrambi i tipi di checkout

## Note Importanti

- Non è necessario creare un terzo prodotto su Stripe
- Il sistema utilizza i prodotti esistenti (HostGPT e Guardian) in una sessione di checkout combinata
- Gli utenti in free trial vengono automaticamente convertiti ad abbonamento completo quando attivano Guardian
- Il sistema mantiene la retrocompatibilità per utenti con abbonamento HostGPT esistente
