# 🚀 Guida Deployment Render per HostGPT

## Opzioni per il Sistema di Report Mensili

### **OPZIONE 1: SCHEDULER INTERNO (CONSIGLIATO) ✅**

**Vantaggi:**
- ✅ **Un solo servizio** - tutto integrato nell'app principale
- ✅ **Nessun costo aggiuntivo** - usa il servizio web esistente
- ✅ **Gestione automatica** - si avvia e ferma con l'app
- ✅ **Logs centralizzati** - tutto nei log dell'app principale

**Come funziona:**
- L'app include un scheduler interno (APScheduler)
- Si avvia automaticamente all'avvio dell'app
- Invia i report ogni primo del mese alle 9:00
- Non richiede servizi aggiuntivi

**Deployment:**
1. Fai il deploy normale dell'app su Render
2. Il scheduler si attiva automaticamente
3. I report vengono inviati ogni mese

---

### **OPZIONE 2: CRON JOB SEPARATO**

**Vantaggi:**
- ✅ **Servizio dedicato** - separato dall'app principale
- ✅ **Logs separati** - debugging più facile
- ✅ **Controllo indipendente** - può essere riavviato separatamente

**Svantaggi:**
- ❌ **Costo aggiuntivo** - servizio cron separato
- ❌ **Complessità** - due servizi da gestire

**Deployment:**
1. Crea un servizio "Cron Job" su Render
2. Usa il file `monthly_reports_cron.py`
3. Configura lo schedule: `0 9 1 * *`

---

### **OPZIONE 3: CRON ESTERNO**

**Vantaggi:**
- ✅ **Gratuito** - servizi esterni gratuiti
- ✅ **Nessun costo Render** - usa solo l'endpoint

**Svantaggi:**
- ❌ **Dipendenze esterne** - dipendi da servizi terzi
- ❌ **Meno controllo** - limitazioni dei servizi gratuiti

**Servizi consigliati:**
- **Cron-job.org** (gratuito)
- **EasyCron** (gratuito)
- **UptimeRobot** (gratuito)

---

## 🎯 **RACCOMANDAZIONE: OPZIONE 1**

Per HostGPT consiglio l'**Opzione 1 (Scheduler Interno)** perché:

1. **Semplicità:** Un solo servizio da gestire
2. **Costo:** Nessun costo aggiuntivo
3. **Affidabilità:** Si avvia automaticamente con l'app
4. **Manutenzione:** Meno complessità operativa

## 📋 **DEPLOYMENT STEP-BY-STEP**

### **1. Preparazione**

Assicurati che questi file siano nel repository:
- ✅ `main.py` (con scheduler integrato)
- ✅ `requirements.txt` (con apscheduler)
- ✅ `email_templates_simple.py`
- ✅ Variabili d'ambiente configurate

### **2. Deploy su Render**

1. **Vai su Render Dashboard**
2. **Crea nuovo servizio "Web Service"**
3. **Connetti il repository GitHub**
4. **Configura:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3

### **3. Variabili d'Ambiente**

Configura queste variabili su Render:
```
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@hostgpt.it
FRONTEND_URL=https://your-frontend.onrender.com
BACKEND_URL=https://your-backend.onrender.com
```

### **4. Test del Scheduler**

Dopo il deploy, controlla i logs:
```bash
# Nei logs di Render dovresti vedere:
"Scheduler started - Monthly reports will be sent on the 1st of each month at 9:00 AM"
```

### **5. Test Manuale**

Puoi testare il sistema chiamando:
```bash
# Test endpoint
curl -X POST https://your-app.onrender.com/api/reports/monthly/send-all

# Test singolo utente (con auth)
curl -X POST https://your-app.onrender.com/api/reports/monthly/send \
  -H "Authorization: Bearer <token>"
```

## 🔧 **CONFIGURAZIONE AVANZATA**

### **Modifica Orario Invio**

Per cambiare l'orario, modifica in `main.py`:
```python
# Cambia da 9:00 a 10:00
trigger=CronTrigger(day=1, hour=10, minute=0)
```

### **Modifica Frequenza**

Per inviare ogni settimana invece che ogni mese:
```python
# Ogni lunedì alle 9:00
trigger=CronTrigger(day_of_week=0, hour=9, minute=0)
```

### **Aggiungi Altri Job**

Per aggiungere altri job schedulati:
```python
# Esempio: pulizia log ogni domenica
scheduler.add_job(
    cleanup_logs_job,
    trigger=CronTrigger(day_of_week=6, hour=3, minute=0),
    id='cleanup_logs',
    name='Cleanup Old Logs'
)
```

## 📊 **MONITORAGGIO**

### **Logs Render**

I logs del scheduler appaiono nei logs dell'app principale:
- ✅ Avvio scheduler
- ✅ Esecuzione job mensile
- ✅ Errori e successi
- ✅ Numero report inviati

### **Metriche da Monitorare**

- **Uptime dell'app** - se l'app è down, i report non vengono inviati
- **Logs di errore** - per problemi SMTP o database
- **Numero report inviati** - per verificare il successo

### **Alert Consigliati**

Configura alert su Render per:
- App down per più di 5 minuti
- Errori critici nei logs
- Fallimento invio email

## 🚨 **TROUBLESHOOTING**

### **Scheduler Non Si Avvia**

**Sintomi:** Non vedi il log "Scheduler started"
**Soluzioni:**
1. Controlla che `apscheduler` sia in requirements.txt
2. Verifica che non ci siano errori di import
3. Controlla i logs di avvio dell'app

### **Report Non Vengono Inviati**

**Sintomi:** Nessun log di invio il primo del mese
**Soluzioni:**
1. Verifica che l'app sia attiva il primo del mese
2. Controlla la configurazione SMTP
3. Testa manualmente l'endpoint `/api/reports/monthly/send-all`

### **Errori SMTP**

**Sintomi:** Log di errore nell'invio email
**Soluzioni:**
1. Verifica credenziali SMTP
2. Controlla limiti del provider email
3. Testa con un utente singolo

## 💡 **BEST PRACTICES**

1. **Test in Staging:** Testa sempre su un ambiente di staging prima del production
2. **Backup:** Assicurati che i dati siano backupati
3. **Monitoring:** Configura alert per monitorare il sistema
4. **Documentation:** Mantieni aggiornata la documentazione
5. **Versioning:** Usa tag Git per versioni stabili

## 🎉 **RISULTATO FINALE**

Con questa configurazione:
- ✅ I report vengono inviati automaticamente ogni mese
- ✅ Nessun costo aggiuntivo
- ✅ Gestione semplice e centralizzata
- ✅ Logs e monitoring integrati
- ✅ Facile da mantenere e aggiornare

Il sistema è pronto per il production! 🚀
