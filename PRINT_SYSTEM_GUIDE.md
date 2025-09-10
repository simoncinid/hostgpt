# Sistema di Stampa QR-Code - Guida Completa

## Panoramica

Il sistema di stampa QR-Code permette agli utenti di ordinare adesivi e placche personalizzate con i QR-Code dei loro chatbot, spediti direttamente a casa tramite Printful.

## Funzionalità Implementate

### ✅ Completate

1. **Banner Dashboard** - Banner giallo nella dashboard che appare quando l'utente ha chatbot
2. **Pagina Selezione Prodotti** (`/stampe`) - Selezione chatbot, prodotti e quantità
3. **Checkout Completo** (`/stampe/checkout`) - Form indirizzo e pagamento Stripe
4. **Gestione Ordini** (`/dashboard/stampe`) - Visualizzazione ordini dell'utente
5. **API Backend** - Endpoint per creazione ordini e pagamenti
6. **Database Schema** - Tabelle per ordini e item
7. **Integrazione Printful** - Servizio per stampa on-demand
8. **Webhook Stripe** - Gestione pagamenti completati

### 🎯 Prodotti Disponibili

- **Adesivi QR-Code** - €2.50 (5x5 cm, resistenti all'acqua e UV)
- **Placche da Scrivania** - €8.90 (10x7 cm, acrilico premium)

## Configurazione

### 1. Variabili d'Ambiente

Aggiungi al file `.env` del backend:

```env
# Printful API
PRINTFUL_API_KEY=your-printful-api-key

# Stripe (già configurato)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Setup Printful

1. **Registrati su Printful**: https://www.printful.com/
2. **Ottieni API Key**: Dashboard → Settings → API
3. **Configura Prodotti**:
   - Sticker 5x5 cm (Variant ID: 4011)
   - Acrylic Desk Plate (Variant ID: 4012)

### 3. Database Migration

Esegui la migrazione per creare le tabelle:

```bash
cd backend
python -m alembic upgrade head
```

### 4. Webhook Stripe

Configura il webhook Stripe per `/api/print-orders/webhook`:
- Eventi: `checkout.session.completed`

## Flusso Utente

### 1. Selezione Prodotti
- L'utente accede a `/stampe`
- Seleziona un chatbot
- Sceglie prodotti e quantità
- Visualizza anteprima QR-Code

### 2. Checkout
- Compila indirizzo di spedizione
- Procede al pagamento Stripe
- Riceve conferma ordine

### 3. Produzione e Spedizione
- Ordine inviato automaticamente a Printful
- Produzione 1-2 giorni lavorativi
- Spedizione 3-5 giorni lavorativi
- Tracking automatico

## API Endpoints

### Ordini
- `POST /api/print-orders/create` - Crea nuovo ordine
- `POST /api/print-orders/create-payment` - Crea sessione pagamento
- `GET /api/print-orders` - Lista ordini utente
- `GET /api/print-orders/{id}` - Dettagli ordine
- `POST /api/print-orders/webhook` - Webhook Stripe

### Frontend
- `/stampe` - Selezione prodotti
- `/stampe/checkout` - Checkout
- `/stampe/success` - Conferma pagamento
- `/stampe/cancel` - Pagamento annullato
- `/dashboard/stampe` - Gestione ordini

## Database Schema

### print_orders
```sql
- id (PK)
- user_id (FK)
- chatbot_id (FK)
- order_number (unique)
- total_amount
- status (pending/processing/shipped/delivered/cancelled)
- payment_status (pending/paid/failed/refunded)
- shipping_address (JSON)
- tracking_number
- tracking_url
- printful_order_id
- created_at, updated_at, shipped_at, delivered_at
```

### print_order_items
```sql
- id (PK)
- order_id (FK)
- product_type (sticker/desk_plate)
- product_name
- quantity
- unit_price
- total_price
- qr_code_data (base64)
- design_data (JSON)
- printful_variant_id
- created_at
```

## Integrazione Printful

### Servizio
Il file `backend/printful_service.py` gestisce:
- Creazione design con QR-Code
- Invio ordini a Printful
- Tracking automatico
- Aggiornamento stati

### Mapping Prodotti
```python
product_mapping = {
    "sticker": {
        "variant_id": 4011,  # Sticker 5x5 cm
        "product_id": 71
    },
    "desk_plate": {
        "variant_id": 4012,  # Acrylic desk plate
        "product_id": 72
    }
}
```

## Monitoraggio

### Stati Ordine
- `pending` - In attesa pagamento
- `processing` - In produzione
- `shipped` - Spedito
- `delivered` - Consegnato
- `cancelled` - Annullato

### Log
Tutti gli eventi sono loggati per debugging e monitoraggio.

## Personalizzazione

### Prezzi
Modifica i prezzi in `app/stampe/page.tsx`:
```typescript
const products: Product[] = [
  {
    id: 'sticker',
    price: 2.50, // Modifica qui
    // ...
  }
]
```

### Prodotti
Aggiungi nuovi prodotti:
1. Aggiorna `products` array in `/stampe/page.tsx`
2. Aggiungi mapping in `printful_service.py`
3. Aggiorna database schema se necessario

### Design
Personalizza il design QR-Code in `backend/main.py`:
```python
def generate_qr_code(url: str, icon_data: bytes = None):
    # Modifica qui per personalizzare il design
```

## Troubleshooting

### Problemi Comuni

1. **Ordine non inviato a Printful**
   - Verifica `PRINTFUL_API_KEY`
   - Controlla log per errori API

2. **Pagamento non processato**
   - Verifica webhook Stripe
   - Controlla `STRIPE_WEBHOOK_SECRET`

3. **QR-Code non generato**
   - Verifica `OPENAI_API_KEY`
   - Controlla generazione QR in `main.py`

### Log
```bash
# Backend logs
tail -f backend/logs/app.log

# Printful API logs
grep "Printful" backend/logs/app.log
```

## Sicurezza

- Tutti i pagamenti gestiti da Stripe
- Indirizzi validati lato client e server
- API protette con autenticazione JWT
- QR-Code generati dinamicamente per ogni ordine

## Supporto

Per problemi o domande:
- Email: support@hostgpt.it
- Documentazione: Questo file
- Log: `backend/logs/app.log`

---

**Nota**: Questo sistema è progettato per essere scalabile e facilmente estendibile. Per aggiungere nuovi prodotti o funzionalità, segui la struttura esistente e aggiorna la documentazione di conseguenza.
