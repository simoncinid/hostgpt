# Configurazione Twilio per SMS/WhatsApp

## Setup Twilio

1. **Registrati su Twilio**: Vai su [twilio.com](https://www.twilio.com) e crea un account
2. **Ottieni le credenziali**: Nel dashboard di Twilio, trova:
   - Account SID
   - Auth Token
   - Phone Number (il numero Twilio che invierà gli SMS)

## Variabili d'Ambiente

Aggiungi queste variabili al tuo file `.env`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Il tuo numero Twilio
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox WhatsApp (opzionale)
```

## Piano Gratuito Twilio

- **SMS**: $0.0075 per SMS negli USA, prezzi variabili per altri paesi
- **Credito iniziale**: $15 di credito gratuito per nuovi account
- **WhatsApp**: Disponibile tramite sandbox (limitato)

## Test

Per testare senza costi:
1. Usa il numero di telefono verificato nel tuo account Twilio
2. Gli SMS di test sono gratuiti per numeri verificati
3. Per produzione, considera un piano a pagamento

## Sicurezza

- **NON** committare mai le credenziali nel codice
- Usa variabili d'ambiente per tutte le configurazioni sensibili
- Considera l'uso di un servizio di gestione segreti in produzione

## Alternative Gratuite

Se preferisci servizi completamente gratuiti:
- **TextBelt**: 1 SMS gratuito al giorno
- **SMS Global**: Piano gratuito limitato
- **WhatsApp Business API**: Richiede approvazione ma ha opzioni economiche
