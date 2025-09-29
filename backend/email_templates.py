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
                    <a href="https://hostgpt-docker.onrender.com">Home</a>
                    <a href="https://hostgpt-docker.onrender.com/dashboard">Dashboard</a>
                    <a href="https://hostgpt-docker.onrender.com/support">Supporto</a>
                    <a href="https://hostgpt-docker.onrender.com/privacy">Privacy</a>
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
        <div class="greeting">🎉 Benvenuto su OspiterAI, {user_name}!</div>
        
        <div class="message">
            Grazie per aver scelto OspiterAI! Siamo entusiasti di averti nella nostra community di host innovativi.
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
            Per iniziare la tua esperienza con OspiterAI, devi prima verificare il tuo indirizzo email e attivare il tuo abbonamento premium.
        </div>
        
        <div style="text-align: center;">
            <a href="{verification_link}" class="cta-button">
                ✅ Verifica Email e Attiva Abbonamento
            </a>
        </div>
        
        <div class="message" style="font-size: 14px; color: #718096;">
            <strong>Importante:</strong> Dopo la verifica, verrai reindirizzato alla pagina di pagamento per attivare il tuo abbonamento.
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
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
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
            <a href="https://hostgpt-docker.onrender.com/dashboard/settings" class="cta-button">
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
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
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
            <a href="https://hostgpt-docker.onrender.com/dashboard/guardian" class="cta-button">
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
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
                🎯 Inizia a Creare il tuo Chatbot
            </a>
        </div>
        
        <div class="message">
            <strong>Importante:</strong> Il tuo periodo di prova scadrà automaticamente tra 14 giorni. 
            Se decidi di continuare, potrai sottoscrivere l'abbonamento completo 
            con tutte le funzionalità avanzate.
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
                <p style="margin: 0; color: #0c5460;">Hai sfruttato al massimo il periodo di prova. È chiaro che OspiterAI sta già migliorando l'esperienza dei tuoi ospiti. Continua con l'abbonamento completo!</p>
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
                <li><strong>Prezzo competitivo</strong> - investimento che si ripaga</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/checkout" class="cta-button">
                💳 Attiva l'Abbonamento Completo
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
                <li><strong>Prezzo competitivo</strong> - investimento che si ripaga</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/checkout" class="cta-button">
                🔓 Riattiva il tuo Chatbot
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
                <li><strong>Fatturazione automatica</strong> - nessun rinnovo manuale</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
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

def create_combined_subscription_confirmation_email(user_name: str) -> str:
    """Template email per confermare l'attivazione del pacchetto completo HostGPT + Guardian"""
    content = f"""
    <div style="text-align: center; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Pacchetto Completo Attivato!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Ciao {user_name},</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Il tuo pacchetto OspiterAI Pro + Guardian è ora attivo!</h2>
            
            <div style="display: flex; justify-content: space-around; margin: 30px 0; flex-wrap: wrap;">
                <div style="text-align: center; margin: 10px; flex: 1; min-width: 200px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                        <span style="color: white; font-size: 24px;">🤖</span>
                    </div>
                    <h3 style="color: #333; margin: 10px 0;">OspiterAI Pro</h3>
                    <p style="color: #666; margin: 5px 0;">• 1000 messaggi/mese</p>
                    <p style="color: #666; margin: 5px 0;">• Chatbot illimitati</p>
                    <p style="color: #666; margin: 5px 0;">• Risposte istantanee</p>
                </div>
                
                <div style="text-align: center; margin: 10px; flex: 1; min-width: 200px;">
                    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                        <span style="color: white; font-size: 24px;">🛡️</span>
                    </div>
                    <h3 style="color: #333; margin: 10px 0;">Guardian</h3>
                    <p style="color: #666; margin: 5px 0;">• Monitoraggio automatico</p>
                    <p style="color: #666; margin: 5px 0;">• Alert ospiti insoddisfatti</p>
                    <p style="color: #666; margin: 5px 0;">• Rilevamento in tempo reale</p>
                </div>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
                Ora hai accesso completo a tutte le funzionalità di OspiterAI Pro e Guardian. 
                Inizia subito a creare chatbot intelligenti e monitora la soddisfazione dei tuoi ospiti!
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; margin: 10px;">
                🚀 Vai alla Dashboard
            </a>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <p style="color: #666; margin: 0; font-size: 14px;">
                Hai domande? Contattaci su <a href="mailto:support@ospiterai.it" style="color: #667eea;">support@ospiterai.it</a>
            </p>
        </div>
    </div>
    """
    return get_base_email_template(content)

def create_guardian_subscription_confirmation_email(user_name: str) -> str:
    """Template email per confermare l'attivazione dell'abbonamento Guardian"""
    
    content = f"""
        <div class="greeting">🛡️ Guardian attivato con successo!</div>
        
        <div class="message">
            Ciao <strong>{user_name}</strong>, il tuo abbonamento HostGPT Guardian è stato attivato con successo! 
            Ora hai accesso al sistema di protezione avanzato per monitorare la soddisfazione dei tuoi ospiti.
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['success']};">
            <h3 style="color: {HOSTGPT_COLORS['success']}; margin-bottom: 15px;">✅ Il tuo Guardian include:</h3>
            <ul class="feature-list">
                <li><strong>Monitoraggio automatico</strong> di tutte le conversazioni</li>
                <li><strong>Rilevamento ospiti insoddisfatti</strong> in tempo reale</li>
                <li><strong>Alert immediati</strong> per recensioni negative</li>
                <li><strong>Suggerimenti di azione</strong> personalizzati</li>
                <li><strong>Dashboard Guardian</strong> dedicata</li>
                <li><strong>9€/mese</strong> - fatturazione automatica</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard/guardian" class="cta-button">
                🛡️ Vai alla Dashboard Guardian
            </a>
        </div>
        
        <div class="message">
            <strong>Come funziona Guardian:</strong>
        </div>
        
        <div style="background: {HOSTGPT_COLORS['light']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 10px;">💡 Cosa fa Guardian per te:</h3>
            <ul class="feature-list">
                <li>Analizza automaticamente ogni conversazione con i tuoi ospiti</li>
                <li>Rileva segnali di insoddisfazione prima che diventino recensioni negative</li>
                <li>Ti invia alert immediati quando un ospite potrebbe essere insoddisfatto</li>
                <li>Ti suggerisce azioni specifiche per risolvere i problemi</li>
                <li>Ti aiuta a mantenere recensioni positive e soddisfazione alta</li>
            </ul>
        </div>
        
        <div class="message">
            <strong>Fatturazione:</strong> Il tuo abbonamento Guardian si rinnoverà automaticamente ogni mese. 
            Puoi gestire le impostazioni di fatturazione dalla tua dashboard in qualsiasi momento.
        </div>
        
        <div class="message">
            Grazie per aver scelto HostGPT Guardian! Ora sei protetto e puoi concentrarti su ciò che conta davvero: 
            offrire un'esperienza straordinaria ai tuoi ospiti. 🛡️✨
        </div>
    """
    
    return get_base_email_template(content)

def create_conversations_limit_warning_email(user_name: str, conversations_remaining: int, conversations_limit: int, language: str = "it") -> str:
    """Template email per avviso limite conversazioni"""
    
    if language == "en":
        greeting = "⚠️ Conversations limit warning"
        message = f"Hi <strong>{user_name}</strong>, you have only <strong>{conversations_remaining} conversations</strong> remaining out of your monthly limit of {conversations_limit}."
        cta_text = "Upgrade Your Plan"
        warning_title = "⚠️ Important: Conversations Running Low"
        warning_info = f"You have used {conversations_limit - conversations_remaining} out of {conversations_limit} monthly conversations. Upgrade your plan to continue without interruptions and get more conversations for your guests."
        important_note = "Don't wait until the last moment! Upgrade now to ensure your guests can always reach your chatbot."
    else:  # it
        greeting = "⚠️ Avviso limite conversazioni"
        message = f"Ciao <strong>{user_name}</strong>, ti rimangono solo <strong>{conversations_remaining} conversazioni</strong> del tuo limite mensile di {conversations_limit}."
        cta_text = "Aggiorna il tuo Piano"
        warning_title = "⚠️ Importante: Conversazioni in Esaurimento"
        warning_info = f"Hai utilizzato {conversations_limit - conversations_remaining} conversazioni su {conversations_limit} mensili. Aggiorna il tuo piano per continuare senza interruzioni e ottenere più conversazioni per i tuoi ospiti."
        important_note = "Non aspettare l'ultimo momento! Aggiorna ora per assicurarti che i tuoi ospiti possano sempre raggiungere il tuo chatbot."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div class="highlight-box" style="border-left-color: {HOSTGPT_COLORS['warning']};">
            <h3 style="color: {HOSTGPT_COLORS['warning']}; margin-bottom: 15px;">{warning_title}</h3>
            <p style="margin: 0; font-style: italic;">{warning_info}</p>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/settings" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message" style="font-size: 14px; color: #718096;">
            <strong>{important_note}</strong>
        </div>
    """
    
    return get_base_email_template(content)

def create_checkin_notification_email(
    guest_email: str, 
    guest_phone: str, 
    guest_first_name: str = None, 
    guest_last_name: str = None,
    property_name: str = None,
    file_count: int = 0,
    language: str = "it"
) -> str:
    """Template email per notifica check-in automatico"""
    
    guest_name = f"{guest_first_name or ''} {guest_last_name or ''}".strip()
    if not guest_name:
        guest_name = "Ospite" if language == "it" else "Guest"
    
    property_text = f" per {property_name}" if property_name else ""
    if language == "en":
        property_text = f" for {property_name}" if property_name else ""
    
    if language == "en":
        greeting = "📋 Automatic Check-in Request"
        message = f"A guest has sent documents for automatic check-in{property_text}."
        details_title = "📝 Guest Details:"
        name_text = "Name:"
        email_text = "Email:"
        phone_text = "Phone:"
        images_text = "Attached images:"
        images_info = "Check-in images are attached to this email. You can download them and proceed with verification to complete the guest's check-in process."
        privacy_title = "🔒 Privacy and Security"
        privacy_info = "Images have been sent directly via email and have not been saved on HostGPT servers, ensuring maximum privacy and security of guest data."
        footer_note = "This email was automatically generated by the HostGPT system following the guest's automatic check-in request."
    else:  # it
        greeting = "📋 Richiesta Check-in Automatico"
        message = f"Un ospite ha inviato i documenti per il check-in automatico{property_text}."
        details_title = "📝 Dettagli Ospite:"
        name_text = "Nome:"
        email_text = "Email:"
        phone_text = "Telefono:"
        images_text = "Immagini allegate:"
        images_info = "Le immagini del check-in sono allegate a questa email. Puoi scaricarle e procedere con la verifica per completare il processo di check-in dell'ospite."
        privacy_title = "🔒 Privacy e Sicurezza"
        privacy_info = "Le immagini sono state inviate direttamente via email e non sono state salvate sui server di HostGPT, garantendo la massima privacy e sicurezza dei dati dell'ospite."
        footer_note = "Questa email è stata generata automaticamente dal sistema HostGPT in seguito alla richiesta di check-in automatico dell'ospite."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div class="highlight-box">
            <h3 style="color: {HOSTGPT_COLORS['primary']}; margin-bottom: 15px;">{details_title}</h3>
            <ul class="feature-list">
                <li><strong>{name_text}</strong> {guest_name}</li>
                <li><strong>{email_text}</strong> {guest_email}</li>
                <li><strong>{phone_text}</strong> {guest_phone}</li>
                <li><strong>{images_text}</strong> {file_count} immagini (JPEG/PNG)</li>
            </ul>
        </div>
        
        <div class="highlight-box">
            <strong>📎 {images_text}</strong><br>
            {images_info}
        </div>
        
        <div class="highlight-box">
            <strong>{privacy_title}</strong><br>
            {privacy_info}
        </div>
        
        <div class="footer-note">
            {footer_note}
        </div>
    """
    
    return get_base_email_template(content)