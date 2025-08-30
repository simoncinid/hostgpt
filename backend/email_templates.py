"""
Template Email HTML di livello Enterprise per HostGPT
"""

# Palette colori HostGPT
HOSTGPT_COLORS = {
    'primary': '#667eea',
    'secondary': '#764ba2', 
    'accent': '#f093fb',
    'success': '#4facfe',
    'warning': '#f093fb',
    'error': '#ff6b6b',
    'dark': '#2d3748',
    'light': '#f7fafc',
    'white': '#ffffff',
    'gradient_primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'gradient_accent': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'gradient_success': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
}

def get_base_email_template(content: str):
    """Template base per tutte le email con stile enterprise"""
    return f"""
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HostGPT</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: {HOSTGPT_COLORS['dark']};
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
            }}
            
            .email-container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: {HOSTGPT_COLORS['white']};
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                border-radius: 16px;
                overflow: hidden;
            }}
            
            .header {{
                background: {HOSTGPT_COLORS['gradient_primary']};
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }}
            
            .header::before {{
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: float 6s ease-in-out infinite;
            }}
            
            @keyframes float {{
                0%, 100% {{ transform: translateY(0px) rotate(0deg); }}
                50% {{ transform: translateY(-20px) rotate(180deg); }}
            }}
            
            .logo {{
                font-size: 32px;
                font-weight: 700;
                color: {HOSTGPT_COLORS['white']};
                margin-bottom: 10px;
                position: relative;
                z-index: 2;
            }}
            
            .header-subtitle {{
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
                font-weight: 300;
                position: relative;
                z-index: 2;
            }}
            
            .content {{
                padding: 40px 30px;
                background: {HOSTGPT_COLORS['white']};
            }}
            
            .greeting {{
                font-size: 24px;
                font-weight: 600;
                color: {HOSTGPT_COLORS['dark']};
                margin-bottom: 20px;
            }}
            
            .message {{
                font-size: 16px;
                line-height: 1.7;
                color: #4a5568;
                margin-bottom: 25px;
            }}
            
            .highlight-box {{
                background: linear-gradient(135deg, {HOSTGPT_COLORS['light']} 0%, #edf2f7 100%);
                border-left: 4px solid {HOSTGPT_COLORS['primary']};
                padding: 25px;
                margin: 30px 0;
                border-radius: 8px;
            }}
            
            .feature-list {{
                list-style: none;
                margin: 25px 0;
            }}
            
            .feature-list li {{
                padding: 12px 0;
                border-bottom: 1px solid #e2e8f0;
                position: relative;
                padding-left: 35px;
            }}
            
            .feature-list li:last-child {{
                border-bottom: none;
            }}
            
            .feature-list li::before {{
                content: '✓';
                position: absolute;
                left: 0;
                top: 12px;
                background: {HOSTGPT_COLORS['gradient_success']};
                color: {HOSTGPT_COLORS['white']};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            }}
            
            .cta-button {{
                display: inline-block;
                background: {HOSTGPT_COLORS['gradient_primary']};
                color: {HOSTGPT_COLORS['white']};
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 25px 0;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }}
            
            .cta-button:hover {{
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
            }}
            
            .footer {{
                background: {HOSTGPT_COLORS['dark']};
                color: {HOSTGPT_COLORS['white']};
                padding: 30px;
                text-align: center;
            }}
            
            .footer-links {{
                margin-bottom: 20px;
            }}
            
            .footer-links a {{
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
                margin: 0 15px;
                font-size: 14px;
            }}
            
            .footer-links a:hover {{
                color: {HOSTGPT_COLORS['white']};
            }}
            
            .footer-text {{
                font-size: 14px;
                color: rgba(255, 255, 255, 0.6);
                line-height: 1.5;
            }}
            
            @media only screen and (max-width: 600px) {{
                .email-container {{
                    margin: 0;
                    border-radius: 0;
                }}
                
                .header, .content, .footer {{
                    padding: 20px;
                }}
                
                .cta-button {{
                    display: block;
                    width: 100%;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🏠 HostGPT</div>
                <div class="header-subtitle">Il tuo assistente virtuale per ospitalità</div>
            </div>
            
            <div class="content">
                {content}
            </div>
            
            <div class="footer">
                <div class="footer-links">
                    <a href="https://hostgpt.com">Home</a>
                    <a href="https://hostgpt.com/dashboard">Dashboard</a>
                    <a href="https://hostgpt.com/support">Supporto</a>
                    <a href="https://hostgpt.com/privacy">Privacy</a>
                </div>
                <div class="footer-text">
                    © 2024 HostGPT. Tutti i diritti riservati.<br>
                    Via dell'Innovazione 123, Milano, Italia
                </div>
            </div>
        </div>
    </body>
    </html>
    """

def create_welcome_email(user_name: str, verification_link: str) -> str:
    """Template email di benvenuto con verifica"""
    content = f"""
        <div class="greeting">🎉 Benvenuto su HostGPT, {user_name}!</div>
        
        <div class="message">
            Grazie per aver scelto HostGPT! Siamo entusiasti di averti nella nostra community di host innovativi.
        </div>
        
        <div class="highlight-box">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 15px;">🚀 Cosa ti aspetta:</h3>
            <ul class="feature-list">
                <li>Chatbot AI personalizzati per ogni proprietà</li>
                <li>Risposte automatiche 24/7 ai tuoi ospiti</li>
                <li>Gestione centralizzata di tutte le conversazioni</li>
                <li>Analytics dettagliate e insights</li>
                <li>Integrazione con i principali canali di prenotazione</li>
            </ul>
        </div>
        
        <div class="message">
            Per iniziare la tua esperienza con HostGPT, devi prima verificare il tuo indirizzo email e attivare il tuo abbonamento premium.
        </div>
        
        <div style="text-align: center;">
            <a href="{verification_link}" class="cta-button">
                ✅ Verifica Email e Attiva Abbonamento
            </a>
        </div>
        
        <div class="message" style="font-size: 14px; color: #718096;">
            <strong>Importante:</strong> Dopo la verifica, verrai reindirizzato alla pagina di pagamento per attivare il tuo abbonamento mensile a 29€/mese.
        </div>
    """
    
    return get_base_email_template(content)

def create_subscription_activation_email(user_name: str) -> str:
    """Template email per attivazione abbonamento"""
    content = f"""
        <div class="greeting">🎉 Abbonamento Attivato!</div>
        
        <div class="message">
            Congratulazioni, <strong>{user_name}</strong>! Il tuo abbonamento HostGPT è stato attivato con successo e sei ora pronto a rivoluzionare la gestione delle tue proprietà.
        </div>
        
        <div class="highlight-box">
            <h3 style="color: {HOSTGPT_COLORS['success']}; margin-bottom: 15px;">✨ Ora puoi accedere a:</h3>
            <ul class="feature-list">
                <li>Creazione di chatbot illimitati per le tue proprietà</li>
                <li>Messaggi illimitati dai tuoi ospiti</li>
                <li>Funzionalità premium avanzate</li>
                <li>Supporto prioritario dedicato</li>
                <li>Analytics e report dettagliati</li>
                <li>Integrazioni con i principali OTA</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt.com/dashboard" class="cta-button">
                🚀 Inizia a Creare i tuoi Chatbot
            </a>
        </div>
        
        <div class="message">
            Il nostro team è qui per aiutarti a ottenere il massimo da HostGPT. Non esitare a contattarci se hai bisogno di assistenza!
        </div>
    """
    
    return get_base_email_template(content)

def create_subscription_cancellation_email(user_name: str, end_date: str) -> str:
    """Template email per annullamento abbonamento"""
    content = f"""
        <div class="greeting">😔 Ci mancherai, {user_name}!</div>
        
        <div class="message">
            Abbiamo ricevuto la tua richiesta di annullamento dell'abbonamento HostGPT. Siamo dispiaciuti di vederti andare via.
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['warning']};">
            <h3 style="color: {HOSTGPT_COLORS['warning']}; margin-bottom: 15px;">📅 Informazioni importanti:</h3>
            <ul class="feature-list">
                <li><strong>Il tuo abbonamento rimarrà attivo fino al: {end_date}</strong></li>
                <li>Potrai continuare ad utilizzare tutti i servizi fino a quella data</li>
                <li>I tuoi dati e chatbot non verranno cancellati</li>
                <li>Puoi riattivare l'abbonamento in qualsiasi momento</li>
            </ul>
        </div>
        
        <div class="message">
            Se hai cambiato idea o se c'è qualcosa che possiamo fare per migliorare la tua esperienza, non esitare a contattarci.
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt.com/dashboard/settings" class="cta-button">
                🔄 Riattiva il tuo Abbonamento
            </a>
        </div>
        
        <div class="message">
            Grazie per aver utilizzato HostGPT. Speriamo di rivederti presto!
        </div>
    """
    
    return get_base_email_template(content)

def create_chatbot_ready_email(user_name: str, property_name: str, chat_url: str) -> str:
    """Template email per chatbot pronto"""
    content = f"""
        <div class="greeting">🤖 Il tuo Chatbot è pronto!</div>
        
        <div class="message">
            Congratulazioni, <strong>{user_name}</strong>! Il tuo chatbot per <strong>{property_name}</strong> è stato creato con successo e sta già lavorando per migliorare l'esperienza dei tuoi ospiti.
        </div>
        
        <div class="highlight-box">
            <h3 style="color: {HOSTGPT_COLORS['success']}; margin-bottom: 15px;">🎯 Il tuo chatbot può:</h3>
            <ul class="feature-list">
                <li>Rispondere alle domande sui check-in/check-out</li>
                <li>Fornire informazioni su servizi e amenità</li>
                <li>Consigliare ristoranti e attrazioni locali</li>
                <li>Gestire richieste di assistenza 24/7</li>
                <li>Raccogliere feedback e recensioni</li>
            </ul>
        </div>
        
        <div style="background: {HOSTGPT_COLORS['light']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 10px;">🔗 Link del tuo chatbot:</h3>
            <a href="{chat_url}" style="color: {HOSTGPT_COLORS['primary']}; text-decoration: none; font-weight: 600;">
                {chat_url}
            </a>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt.com/dashboard" class="cta-button">
                📊 Vai alla Dashboard
            </a>
        </div>
        
        <div class="message">
            Il tuo chatbot è ora attivo e pronto ad aiutare i tuoi ospiti. Monitora le conversazioni dalla dashboard per vedere come sta andando!
        </div>
    """
    
    return get_base_email_template(content)

def create_guardian_alert_email(user_name: str, alert, conversation_summary: str) -> str:
    """Template email per alert Guardian"""
    
    # Determina il colore e l'emoji in base alla severità
    severity_colors = {
        'critical': HOSTGPT_COLORS['error'],
        'high': '#ff6b6b',
        'medium': '#f093fb',
        'low': '#4facfe'
    }
    
    severity_emojis = {
        'critical': '🚨',
        'high': '⚠️',
        'medium': '⚠️',
        'low': 'ℹ️'
    }
    
    severity_color = severity_colors.get(alert.severity, HOSTGPT_COLORS['warning'])
    severity_emoji = severity_emojis.get(alert.severity, '⚠️')
    
    content = f"""
        <div class="greeting">{severity_emoji} ALERT GUARDIAN: Ospite insoddisfatto rilevato</div>
        
        <div class="message">
            Ciao <strong>{user_name}</strong>, il sistema Guardian ha rilevato un ospite potenzialmente insoddisfatto che potrebbe lasciare una recensione negativa.
        </div>
        
        <div class="highlight-box" style="border-left-color: {severity_color};">
            <h3 style="color: {severity_color}; margin-bottom: 15px;">📊 Dettagli dell'Alert:</h3>
            <ul class="feature-list">
                <li><strong>Rischio recensione negativa:</strong> {alert.risk_score:.1%}</li>
                <li><strong>Severità:</strong> {alert.severity.upper()}</li>
                <li><strong>Conversazione:</strong> #{alert.conversation_id}</li>
                <li><strong>Data rilevamento:</strong> {alert.created_at.strftime('%d/%m/%Y alle %H:%M')}</li>
            </ul>
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['success']};">
            <h3 style="color: {HOSTGPT_COLORS['success']}; margin-bottom: 15px;">💡 Azione Suggerita:</h3>
            <p style="margin: 0; font-style: italic;">{alert.suggested_action}</p>
        </div>
        
        <div style="background: {HOSTGPT_COLORS['light']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 10px;">💬 Riassunto Conversazione:</h3>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-wrap; font-size: 12px; margin: 0;">{conversation_summary}</pre>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt.com/dashboard/guardian" class="cta-button">
                🛡️ Gestisci Alert nella Dashboard Guardian
            </a>
        </div>
        
        <div class="message">
            <strong>Agisci rapidamente!</strong> Contattare l'ospite entro le prossime ore può fare la differenza tra una recensione negativa e un'esperienza positiva risolta.
        </div>
        
        <div style="background: {HOSTGPT_COLORS['light']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 10px;">🎯 Suggerimenti per la risoluzione:</h3>
            <ul class="feature-list">
                <li>Contatta l'ospite personalmente</li>
                <li>Offri una soluzione immediata al problema</li>
                <li>Considera un'offerta di compensazione (sconto, upgrade, ecc.)</li>
                <li>Segui l'ospite per assicurarti che sia soddisfatto</li>
                <li>Una volta risolto, marca l'alert come "Risolto" nella dashboard</li>
            </ul>
        </div>
        
        <div class="message">
            Grazie per aver scelto HostGPT Guardian per proteggere la soddisfazione dei tuoi ospiti! 🛡️
        </div>
    """
    
    return get_base_email_template(content)

def create_free_trial_welcome_email(user_name: str) -> str:
    """Template email di benvenuto per il free trial"""
    
    content = f"""
        <div class="greeting">🎉 Benvenuto nel tuo periodo di prova gratuito!</div>
        
        <div class="message">
            Ciao <strong>{user_name}</strong>, benvenuto in HostGPT! Hai appena iniziato il tuo periodo di prova gratuito di <strong>14 giorni</strong>.
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['success']};">
            <h3 style="color: {HOSTGPT_COLORS['success']}; margin-bottom: 15px;">🎁 Cosa include il tuo periodo di prova:</h3>
            <ul class="feature-list">
                <li><strong>14 giorni di accesso completo</strong> a tutte le funzionalità</li>
                <li><strong>20 messaggi gratuiti</strong> per testare il tuo chatbot</li>
                <li><strong>1 chatbot personalizzato</strong> con il tuo brand</li>
                <li><strong>Dashboard completa</strong> per monitorare le conversazioni</li>
                <li><strong>QR code e link</strong> da condividere con i tuoi ospiti</li>
                <li><strong>Assistenza tecnica</strong> durante tutto il periodo di prova</li>
            </ul>
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['primary']};">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 15px;">🚀 Inizia subito:</h3>
            <ol class="feature-list">
                <li>Accedi alla <strong>dashboard</strong> e crea il tuo primo chatbot</li>
                <li>Personalizza il <strong>messaggio di benvenuto</strong> e le risposte</li>
                <li>Scarica il <strong>QR code</strong> e condividi il link</li>
                <li>Monitora le <strong>conversazioni</strong> in tempo reale</li>
            </ol>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt.com/dashboard" class="cta-button">
                🎯 Inizia a Creare il tuo Chatbot
            </a>
        </div>
        
        <div class="message">
            <strong>Importante:</strong> Il tuo periodo di prova scadrà automaticamente tra 14 giorni. 
            Se decidi di continuare, potrai sottoscrivere l'abbonamento completo a soli <strong>29€/mese</strong> 
            con 1000 messaggi mensili e tutte le funzionalità avanzate.
        </div>
        
        <div style="background: {HOSTGPT_COLORS['light']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 10px;">💡 Suggerimenti per massimizzare la tua prova:</h3>
            <ul class="feature-list">
                <li>Testa il chatbot con amici e familiari</li>
                <li>Personalizza le risposte in base alle domande più frequenti</li>
                <li>Monitora le statistiche per vedere l'engagement</li>
                <li>Preparati a scalare con l'abbonamento completo</li>
            </ul>
        </div>
        
        <div class="message">
            Se hai domande durante il periodo di prova, non esitare a contattarci. 
            Siamo qui per aiutarti a creare la migliore esperienza per i tuoi ospiti! 🏠✨
        </div>
    """
    
    return get_base_email_template(content)

def create_free_trial_ending_email(user_name: str, days_remaining: int, messages_used: int, total_messages: int) -> str:
    """Template email per notificare la fine del free trial"""
    
    # Calcola le statistiche
    usage_percentage = (messages_used / total_messages) * 100 if total_messages > 0 else 0
    
    # Personalizza il messaggio in base all'utilizzo
    if messages_used == 0:
        engagement_message = """
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #856404; margin-bottom: 10px;">💡 Non hai ancora utilizzato il tuo chatbot?</h3>
                <p style="margin: 0; color: #856404;">Non è troppo tardi! Crea il tuo chatbot ora e inizia a migliorare l'esperienza dei tuoi ospiti. Molti host hanno visto un aumento significativo della soddisfazione degli ospiti già dal primo giorno.</p>
            </div>
        """
    elif usage_percentage < 30:
        engagement_message = """
            <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #0c5460; margin-bottom: 10px;">🚀 Hai appena iniziato a scoprire il potenziale!</h3>
                <p style="margin: 0; color: #0c5460;">Con l'abbonamento completo avrai 1000 messaggi mensili per sfruttare al massimo il tuo chatbot e migliorare l'esperienza di tutti i tuoi ospiti.</p>
            </div>
        """
    elif usage_percentage < 70:
        engagement_message = """
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #155724; margin-bottom: 10px;">🎯 Ottimo utilizzo del tuo chatbot!</h3>
                <p style="margin: 0; color: #155724;">Stai già vedendo i benefici. Con l'abbonamento completo potrai continuare a migliorare l'esperienza dei tuoi ospiti senza limiti.</p>
            </div>
        """
    else:
        engagement_message = """
            <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #0c5460; margin-bottom: 10px;">🔥 Utilizzo eccellente!</h3>
                <p style="margin: 0; color: #0c5460;">Hai sfruttato al massimo il periodo di prova. È chiaro che HostGPT sta già migliorando l'esperienza dei tuoi ospiti. Continua con l'abbonamento completo!</p>
            </div>
        """
    
    content = f"""
        <div class="greeting">⏰ Il tuo periodo di prova sta per scadere</div>
        
        <div class="message">
            Ciao <strong>{user_name}</strong>, il tuo periodo di prova gratuito scadrà tra <strong>{days_remaining} giorni</strong>.
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['warning']};">
            <h3 style="color: {HOSTGPT_COLORS['warning']}; margin-bottom: 15px;">📊 Le tue statistiche del periodo di prova:</h3>
            <ul class="feature-list">
                <li><strong>Messaggi utilizzati:</strong> {messages_used}/{total_messages} ({usage_percentage:.0f}%)</li>
                <li><strong>Giorni rimanenti:</strong> {days_remaining} giorni</li>
                <li><strong>Chatbot creati:</strong> 1 chatbot personalizzato</li>
            </ul>
        </div>
        
        {engagement_message}
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['success']};">
            <h3 style="color: {HOSTGPT_COLORS['success']}; margin-bottom: 15px;">🎁 Cosa succede con l'abbonamento completo:</h3>
            <ul class="feature-list">
                <li><strong>1000 messaggi mensili</strong> invece di 20</li>
                <li><strong>Accesso illimitato</strong> a tutte le funzionalità</li>
                <li><strong>Statistiche avanzate</strong> e analisi dettagliate</li>
                <li><strong>Supporto prioritario</strong> per qualsiasi domanda</li>
                <li><strong>Solo 29€/mese</strong> - meno di 1€ al giorno</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt.com/checkout" class="cta-button">
                💳 Attiva l'Abbonamento Completo - 29€/mese
            </a>
        </div>
        
        <div class="message">
            <strong>Non perdere i benefici!</strong> Dopo la scadenza del periodo di prova, il tuo chatbot non sarà più accessibile 
            e perderai tutte le conversazioni e le statistiche raccolte. Attiva l'abbonamento ora per continuare 
            a migliorare l'esperienza dei tuoi ospiti senza interruzioni.
        </div>
        
        <div style="background: {HOSTGPT_COLORS['light']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 10px;">💡 Perché continuare con HostGPT:</h3>
            <ul class="feature-list">
                <li>Migliora la soddisfazione degli ospiti del 40% in media</li>
                <li>Riduce il carico di lavoro per le domande ricorrenti</li>
                <li>Aumenta le recensioni positive</li>
                <li>Offre assistenza 24/7 ai tuoi ospiti</li>
                <li>Ti permette di concentrarti su ciò che conta davvero</li>
            </ul>
        </div>
        
        <div class="message">
            Grazie per aver provato HostGPT! Speriamo di continuare a supportarti nel migliorare l'esperienza dei tuoi ospiti. 🏠✨
        </div>
    """
    
    return get_base_email_template(content)

def create_free_trial_expired_email(user_name: str, messages_used: int, total_messages: int) -> str:
    """Template email per notificare la scadenza del free trial"""
    
    usage_percentage = (messages_used / total_messages) * 100 if total_messages > 0 else 0
    
    content = f"""
        <div class="greeting">⏰ Il tuo periodo di prova è scaduto</div>
        
        <div class="message">
            Ciao <strong>{user_name}</strong>, il tuo periodo di prova gratuito di HostGPT è scaduto. 
            Il tuo chatbot è temporaneamente non disponibile.
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['error']};">
            <h3 style="color: {HOSTGPT_COLORS['error']}; margin-bottom: 15px;">📊 Il tuo utilizzo durante la prova:</h3>
            <ul class="feature-list">
                <li><strong>Messaggi utilizzati:</strong> {messages_used}/{total_messages} ({usage_percentage:.0f}%)</li>
                <li><strong>Chatbot creati:</strong> 1 chatbot personalizzato</li>
                <li><strong>Periodo di prova:</strong> 14 giorni completati</li>
            </ul>
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['success']};">
            <h3 style="color: {HOSTGPT_COLORS['success']}; margin-bottom: 15px;">🎁 Attiva l'abbonamento completo per continuare:</h3>
            <ul class="feature-list">
                <li><strong>Ripristina immediatamente</strong> l'accesso al tuo chatbot</li>
                <li><strong>1000 messaggi mensili</strong> invece di 20</li>
                <li><strong>Accesso illimitato</strong> a tutte le funzionalità</li>
                <li><strong>Statistiche avanzate</strong> e analisi dettagliate</li>
                <li><strong>Solo 29€/mese</strong> - meno di 1€ al giorno</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt.com/checkout" class="cta-button">
                🔓 Riattiva il tuo Chatbot - 29€/mese
            </a>
        </div>
        
        <div class="message">
            <strong>Non perdere i tuoi dati!</strong> Tutte le tue configurazioni e statistiche sono ancora disponibili 
            e verranno ripristinate immediatamente dopo l'attivazione dell'abbonamento.
        </div>
        
        <div style="background: {HOSTGPT_COLORS['light']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 10px;">💡 Cosa succede ora:</h3>
            <ul class="feature-list">
                <li>Il tuo chatbot non è più accessibile agli ospiti</li>
                <li>Non puoi più creare nuovi messaggi</li>
                <li>Le tue configurazioni sono salvate e sicure</li>
                <li>Attivando l'abbonamento, tutto tornerà attivo immediatamente</li>
            </ul>
        </div>
        
        <div class="message">
            Grazie per aver provato HostGPT! Speriamo di rivederti presto per continuare a migliorare l'esperienza dei tuoi ospiti. 🏠✨
        </div>
    """
    
    return get_base_email_template(content)

def create_subscription_confirmation_email(user_name: str) -> str:
    """Template email per confermare l'attivazione dell'abbonamento"""
    
    content = f"""
        <div class="greeting">🎉 Abbonamento attivato con successo!</div>
        
        <div class="message">
            Ciao <strong>{user_name}</strong>, il tuo abbonamento HostGPT è stato attivato con successo! 
            Ora hai accesso completo a tutte le funzionalità della piattaforma.
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['success']};">
            <h3 style="color: {HOSTGPT_COLORS['success']}; margin-bottom: 15px;">✅ Il tuo abbonamento include:</h3>
            <ul class="feature-list">
                <li><strong>1000 messaggi mensili</strong> per i tuoi chatbot</li>
                <li><strong>Chatbot illimitati</strong> per tutte le tue proprietà</li>
                <li><strong>Risposte istantanee</strong> 24/7 ai tuoi ospiti</li>
                <li><strong>Statistiche avanzate</strong> e analisi dettagliate</li>
                <li><strong>Supporto prioritario</strong> per qualsiasi domanda</li>
                <li><strong>29€/mese</strong> - fatturazione automatica</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt.com/dashboard" class="cta-button">
                🚀 Crea il tuo Chatbot
            </a>
        </div>
        
        <div class="message">
            <strong>Prossimi passi:</strong>
        </div>
        
        <div style="background: {HOSTGPT_COLORS['light']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 10px;">💡 Cosa puoi fare ora:</h3>
            <ul class="feature-list">
                <li>Configura il tuo primo chatbot per la tua proprietà</li>
                <li>Personalizza le risposte in base alle tue esigenze</li>
                <li>Monitora le conversazioni e le statistiche</li>
                <li>Migliora l'esperienza dei tuoi ospiti</li>
                <li>Aumenta le recensioni positive</li>
            </ul>
        </div>
        
        <div class="message">
            <strong>Fatturazione:</strong> Il tuo abbonamento si rinnoverà automaticamente ogni mese. 
            Puoi gestire le impostazioni di fatturazione dalla tua dashboard in qualsiasi momento.
        </div>
        
        <div class="message">
            Grazie per aver scelto HostGPT! Siamo qui per aiutarti a creare un'esperienza straordinaria per i tuoi ospiti. 🏠✨
        </div>
    """
    
    return get_base_email_template(content)
