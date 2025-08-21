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

def get_base_email_template():
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
    
    return get_base_email_template().format(content=content)

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
    
    return get_base_email_template().format(content=content)

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
    
    return get_base_email_template().format(content=content)

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
    
    return get_base_email_template().format(content=content)
