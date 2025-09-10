# 📊 Sistema Report Mensili HostGPT

## Panoramica

Il sistema di report mensili invia automaticamente ogni mese un'email dettagliata a tutti gli utenti attivi con le statistiche dei loro chatbot e del sistema Guardian.

## Caratteristiche

### 📧 Email Report
- **Template compatto e brandizzato** con design HostGPT
- **Supporto multilingua** (ITA/ENG) basato su `user.language`
- **Dati completi** per ogni chatbot dell'utente
- **Statistiche Guardian** (se abbonamento attivo)

### 📊 Dati Inclusi

#### Per ogni Chatbot:
- Nome del chatbot
- Numero di conversazioni del mese
- Numero di messaggi del mese
- Media messaggi per conversazione

#### Statistiche Guardian (se attivo):
- Ospiti monitorati totali
- Ospiti ad alto rischio rilevati
- Problemi risolti
- Soddisfazione media (1-5)
- Recensioni negative prevenute

#### Riepilogo Generale:
- Conversazioni totali
- Messaggi totali
- Chatbot attivi
- Interventi Guardian

## API Endpoints

### 1. Ottieni Report Mensile
```http
GET /api/reports/monthly
Authorization: Bearer <token>
```

**Risposta:**
```json
{
  "period": "01/12/2024 - 31/12/2024",
  "chatbots": [
    {
      "name": "Hotel Roma Centro",
      "conversations": 45,
      "messages": 180,
      "avg_messages": 4.0
    }
  ],
  "total_conversations": 45,
  "total_messages": 180,
  "active_chatbots": 1,
  "guardian_stats": {
    "total_guests": 45,
    "high_risk_guests": 3,
    "resolved_issues": 2,
    "avg_satisfaction": 4.2,
    "negative_reviews_prevented": 2
  }
}
```

### 2. Invia Report a Utente Corrente
```http
POST /api/reports/monthly/send
Authorization: Bearer <token>
```

### 3. Invia Report a Tutti gli Utenti
```http
POST /api/reports/monthly/send-all
```

### 4. Test Report (per debugging)
```http
GET /api/reports/monthly/test/{user_id}
```

## Sistema di Scheduling

### Configurazione Cron Job

1. **Aggiungi al crontab:**
```bash
crontab -e
```

2. **Aggiungi questa riga:**
```bash
# Report mensili - ogni primo del mese alle 9:00
0 9 1 * * /usr/bin/python3 /path/to/host-gpt/backend/monthly_reports_cron.py
```

### Script Cron Job

Il file `monthly_reports_cron.py` contiene lo script che:
- Chiama l'endpoint `/api/reports/monthly/send-all`
- Gestisce errori e logging
- Registra i risultati in `monthly_reports.log`

### Logging

I log vengono salvati in:
- **File:** `backend/monthly_reports.log`
- **Console:** Output standard
- **Formato:** `YYYY-MM-DD HH:MM:SS - LEVEL - MESSAGE`

## Configurazione

### Variabili d'Ambiente

Assicurati che siano configurate:
- `SMTP_HOST` - Server SMTP
- `SMTP_USERNAME` - Username SMTP
- `SMTP_PASSWORD` - Password SMTP
- `FROM_EMAIL` - Email mittente

### Database

Il sistema utilizza le tabelle esistenti:
- `users` - Informazioni utenti
- `chatbots` - Dati chatbot
- `conversations` - Conversazioni
- `messages` - Messaggi
- `guardian_alerts` - Alert Guardian

## Test e Debugging

### Test Manuale

1. **Test singolo utente:**
```bash
curl -X POST http://localhost:8000/api/reports/monthly/send \
  -H "Authorization: Bearer <token>"
```

2. **Test tutti gli utenti:**
```bash
curl -X POST http://localhost:8000/api/reports/monthly/send-all
```

3. **Test dati report:**
```bash
curl http://localhost:8000/api/reports/monthly/test/1
```

### Debugging

- Controlla i log in `monthly_reports.log`
- Usa l'endpoint di test per verificare i dati
- Verifica la configurazione SMTP
- Controlla che gli utenti abbiano abbonamenti attivi

## Personalizzazione

### Modifica Template Email

Il template si trova in `email_templates_simple.py`:
```python
def create_monthly_report_email_simple(user_name: str, report_data: dict, language: str = "it") -> str:
```

### Modifica Periodo Report

Per cambiare il periodo (es. ultimi 7 giorni):
```python
# In generate_monthly_report_data()
start_date = end_date - timedelta(days=7)  # Invece di 30
```

### Filtri Utenti

Per inviare solo a utenti specifici, modifica in `send_monthly_reports_to_all_users()`:
```python
# Esempio: solo utenti con Guardian attivo
active_users = db.query(User).filter(
    User.subscription_status.in_(['active', 'cancelling']),
    User.guardian_subscription_status == 'active'
).all()
```

## Monitoraggio

### Metriche da Monitorare

- Numero di report inviati
- Errori di invio email
- Tempo di esecuzione
- Utenti senza attività

### Alert

Configura alert per:
- Fallimento invio report
- Errori SMTP
- Utenti con 0 attività

## Sicurezza

- Gli endpoint richiedono autenticazione
- I dati sono filtrati per utente
- Logging sicuro senza dati sensibili
- Rate limiting consigliato per endpoint pubblici

## Manutenzione

### Pulizia Log

Aggiungi al crontab:
```bash
# Pulizia log vecchi - ogni domenica alle 3:00
0 3 * * 0 find /path/to/logs -name "*.log" -mtime +30 -delete
```

### Backup

Assicurati che i log e i dati siano inclusi nel backup regolare.

## Supporto

Per problemi o domande:
1. Controlla i log
2. Verifica la configurazione
3. Testa con endpoint di debug
4. Contatta il team di sviluppo
