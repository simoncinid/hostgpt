"""
Template Email HTML semplificati per HostGPT
Design bianco/rosa con solo le informazioni essenziali
"""

# Palette colori semplificata - bianco e rosa Airbnb
HOSTGPT_SIMPLE_COLORS = {
    'primary': '#FF5A5F',  # Rosa Airbnb
    'secondary': '#FFB4B8',  # Rosa chiaro
    'accent': '#FF8A8F',  # Rosa medio
    'white': '#FFFFFF',
    'light_gray': '#F7F7F7',
    'dark_gray': '#484848',
    'text_gray': '#767676'
}

def get_simple_email_template(content: str, language: str = "it"):
    """Template base semplificato per tutte le email"""
    
    # Testi in base alla lingua
    if language == "en":
        title = "HostGPT"
        subtitle = "Your virtual assistant for hospitality"
        footer_text = "© 2024 HostGPT. All rights reserved."
    else:  # it
        title = "HostGPT"
        subtitle = "Il tuo assistente virtuale per ospitalità"
        footer_text = "© 2024 HostGPT. Tutti i diritti riservati."
    
    return f"""
    <!DOCTYPE html>
    <html lang="{language}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: {HOSTGPT_SIMPLE_COLORS['dark_gray']};
                background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']};
                margin: 0;
                padding: 20px;
            }}
            
            .email-container {{
                max-width: 500px;
                margin: 0 auto;
                background-color: {HOSTGPT_SIMPLE_COLORS['white']};
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }}
            
            .header {{
                background-color: {HOSTGPT_SIMPLE_COLORS['primary']};
                padding: 30px 20px;
                text-align: center;
            }}
            
            .logo {{
                font-size: 24px;
                font-weight: 700;
                color: {HOSTGPT_SIMPLE_COLORS['white']};
                margin-bottom: 5px;
            }}
            
            .header-subtitle {{
                color: {HOSTGPT_SIMPLE_COLORS['white']};
                font-size: 14px;
                opacity: 0.9;
            }}
            
            .content {{
                padding: 30px 20px;
            }}
            
            .greeting {{
                font-size: 20px;
                font-weight: 600;
                color: {HOSTGPT_SIMPLE_COLORS['dark_gray']};
                margin-bottom: 20px;
            }}
            
            .message {{
                font-size: 16px;
                line-height: 1.6;
                color: {HOSTGPT_SIMPLE_COLORS['text_gray']};
                margin-bottom: 20px;
            }}
            
            .cta-button {{
                display: inline-block;
                background-color: {HOSTGPT_SIMPLE_COLORS['primary']};
                color: {HOSTGPT_SIMPLE_COLORS['white']};
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                transition: background-color 0.2s ease;
            }}
            
            .cta-button:hover {{
                background-color: {HOSTGPT_SIMPLE_COLORS['accent']};
            }}
            
            .footer {{
                background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']};
                padding: 20px;
                text-align: center;
            }}
            
            .footer-text {{
                font-size: 12px;
                color: {HOSTGPT_SIMPLE_COLORS['text_gray']};
            }}
            
            @media only screen and (max-width: 600px) {{
                body {{
                    padding: 10px;
                }}
                
                .email-container {{
                    border-radius: 8px;
                }}
                
                .header, .content, .footer {{
                    padding: 20px 15px;
                }}
                
                .cta-button {{
                    display: block;
                    width: 100%;
                    text-align: center;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🏠 {title}</div>
                <div class="header-subtitle">{subtitle}</div>
            </div>
            
            <div class="content">
                {content}
            </div>
            
            <div class="footer">
                <div class="footer-text">
                    {footer_text}
                </div>
            </div>
        </div>
    </body>
    </html>
    """

def create_welcome_email_simple(user_name: str, verification_link: str, language: str = "it") -> str:
    """Template email di benvenuto semplificato"""
    
    if language == "en":
        greeting = f"Welcome to HostGPT, {user_name}! 🎉"
        message = "Thank you for choosing HostGPT! We're excited to have you in our community of innovative hosts."
        cta_text = "Verify Email & Activate Subscription"
        important_note = "Important: After verification, you'll be redirected to the payment page to activate your subscription."
    else:  # it
        greeting = f"Benvenuto su HostGPT, {user_name}! 🎉"
        message = "Grazie per aver scelto HostGPT! Siamo entusiasti di averti nella nostra community di host innovativi."
        cta_text = "Verifica Email e Attiva Abbonamento"
        important_note = "Importante: Dopo la verifica, verrai reindirizzato alla pagina di pagamento per attivare il tuo abbonamento."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="text-align: center;">
            <a href="{verification_link}" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message" style="font-size: 14px; color: {HOSTGPT_SIMPLE_COLORS['text_gray']};">
            <strong>{important_note}</strong>
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_subscription_activation_email_simple(user_name: str, language: str = "it") -> str:
    """Template email per attivazione abbonamento semplificato"""
    
    if language == "en":
        greeting = "Subscription Activated! 🎉"
        message = f"Congratulations, <strong>{user_name}</strong>! Your HostGPT subscription has been successfully activated and you're now ready to revolutionize your property management."
        cta_text = "Go to Dashboard"
        next_steps = "You now have unlimited access to all HostGPT features. Start creating your chatbots and improve your guests' experience!"
    else:  # it
        greeting = "Abbonamento Attivato! 🎉"
        message = f"Congratulazioni, <strong>{user_name}</strong>! Il tuo abbonamento HostGPT è stato attivato con successo e sei ora pronto a rivoluzionare la gestione delle tue proprietà."
        cta_text = "Vai alla Dashboard"
        next_steps = "Ora hai accesso illimitato a tutte le funzionalità HostGPT. Inizia a creare i tuoi chatbot e migliora l'esperienza dei tuoi ospiti!"
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            {next_steps}
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_guardian_alert_email_simple(user_name: str, alert, conversation_summary: str, language: str = "it") -> str:
    """Template email per alert Guardian semplificato"""
    
    if language == "en":
        greeting = "🚨 GUARDIAN ALERT: Unsatisfied guest detected"
        message = f"Hi <strong>{user_name}</strong>, the Guardian system has detected a potentially unsatisfied guest who might leave a negative review."
        cta_text = "Manage Alert in Guardian Dashboard"
        action_text = "Act quickly! Contacting the guest within the next few hours can make the difference between a negative review and a positive resolved experience."
        risk_score_text = "Risk Score:"
        severity_text = "Severity:"
        conversation_text = "Conversation:"
        detected_text = "Detected:"
        suggested_action_text = "Suggested Action:"
    else:  # it
        greeting = "🚨 ALERT GUARDIAN: Ospite insoddisfatto rilevato"
        message = f"Ciao <strong>{user_name}</strong>, il sistema Guardian ha rilevato un ospite potenzialmente insoddisfatto che potrebbe lasciare una recensione negativa."
        cta_text = "Gestisci Alert nella Dashboard Guardian"
        action_text = "Agisci rapidamente! Contattare l'ospite entro le prossime ore può fare la differenza tra una recensione negativa e un'esperienza positiva risolta."
        risk_score_text = "Punteggio di Rischio:"
        severity_text = "Severità:"
        conversation_text = "Conversazione:"
        detected_text = "Rilevato:"
        suggested_action_text = "Azione Suggerita:"
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>{risk_score_text}</strong> {alert.risk_score:.1%}<br>
            <strong>{severity_text}</strong> {alert.severity.upper()}<br>
            <strong>{conversation_text}</strong> #{alert.conversation_id}<br>
            <strong>{detected_text}</strong> {alert.created_at.strftime('%d/%m/%Y at %H:%M')}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['secondary']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>{suggested_action_text}</strong><br>
            {alert.suggested_action}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard/guardian" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            <strong>{action_text}</strong>
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_free_trial_welcome_email_simple(user_name: str, verification_link: str, language: str = "it") -> str:
    """Template email di benvenuto per il free trial semplificato"""
    
    if language == "en":
        greeting = "Welcome to your free trial! 🎉"
        message = f"Hi <strong>{user_name}</strong>, welcome to HostGPT! You've just started your <strong>14-day free trial</strong>."
        cta_text = "Start Creating Your Chatbot"
        trial_info = "Your free trial includes: 14 days of full access, 20 free messages, 1 personalized chatbot, complete dashboard, QR code and link to share with guests."
        important_note = "Important: Your free trial will automatically expire in 14 days. If you decide to continue, you can subscribe to the complete plan with all advanced features."
    else:  # it
        greeting = "Benvenuto nel tuo periodo di prova gratuito! 🎉"
        message = f"Ciao <strong>{user_name}</strong>, benvenuto in HostGPT! Hai appena iniziato il tuo periodo di prova gratuito di <strong>14 giorni</strong>."
        cta_text = "Inizia a Creare il tuo Chatbot"
        trial_info = "Il tuo periodo di prova include: 14 giorni di accesso completo, 20 messaggi gratuiti, 1 chatbot personalizzato, dashboard completa, QR code e link da condividere con i tuoi ospiti."
        important_note = "Importante: Il tuo periodo di prova scadrà automaticamente tra 14 giorni. Se decidi di continuare, potrai sottoscrivere l'abbonamento completo con tutte le funzionalità avanzate."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {trial_info}
        </div>
        
        <div style="text-align: center;">
            <a href="{verification_link}" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message" style="font-size: 14px;">
            <strong>{important_note}</strong>
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_free_trial_ending_email_simple(user_name: str, days_remaining: int, messages_used: int, total_messages: int, language: str = "it") -> str:
    """Template email per notificare la fine del free trial semplificato"""
    
    usage_percentage = (messages_used / total_messages) * 100 if total_messages > 0 else 0
    
    if language == "en":
        greeting = "Your free trial is ending soon ⏰"
        message = f"Hi <strong>{user_name}</strong>, your free trial will expire in <strong>{days_remaining} days</strong>."
        cta_text = "Activate Complete Subscription - €29/month"
        stats_text = f"Your trial statistics: {messages_used}/{total_messages} messages used ({usage_percentage:.0f}%), {days_remaining} days remaining"
        important_note = "Don't lose the benefits! After the trial expires, your chatbot will no longer be accessible and you'll lose all conversations and collected statistics. Activate the subscription now to continue improving your guests' experience without interruptions."
    else:  # it
        greeting = "Il tuo periodo di prova sta per scadere ⏰"
        message = f"Ciao <strong>{user_name}</strong>, il tuo periodo di prova gratuito scadrà tra <strong>{days_remaining} giorni</strong>."
        cta_text = "Attiva l'Abbonamento Completo"
        stats_text = f"Le tue statistiche del periodo di prova: {messages_used}/{total_messages} messaggi utilizzati ({usage_percentage:.0f}%), {days_remaining} giorni rimanenti"
        important_note = "Non perdere i benefici! Dopo la scadenza del periodo di prova, il tuo chatbot non sarà più accessibile e perderai tutte le conversazioni e le statistiche raccolte. Attiva l'abbonamento ora per continuare a migliorare l'esperienza dei tuoi ospiti senza interruzioni."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {stats_text}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/checkout" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            <strong>{important_note}</strong>
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_subscription_confirmation_email_simple(user_name: str, language: str = "it") -> str:
    """Template email per confermare l'attivazione dell'abbonamento semplificato"""
    
    if language == "en":
        greeting = "Subscription activated successfully! 🎉"
        message = f"Hi <strong>{user_name}</strong>, your HostGPT subscription has been successfully activated! You now have full access to all platform features."
        cta_text = "Create Your Chatbot"
        next_steps = "Your subscription includes: 1000 monthly messages for your chatbots, unlimited chatbots for all your properties, instant responses 24/7 to your guests, advanced statistics and detailed analytics, priority support for any questions, €29/month - automatic billing."
    else:  # it
        greeting = "Abbonamento attivato con successo! 🎉"
        message = f"Ciao <strong>{user_name}</strong>, il tuo abbonamento HostGPT è stato attivato con successo! Ora hai accesso completo a tutte le funzionalità della piattaforma."
        cta_text = "Crea il tuo Chatbot"
        next_steps = "Il tuo abbonamento include: conversazioni mensili per i tuoi chatbot, chatbot illimitati per tutte le tue proprietà, risposte istantanee 24/7 ai tuoi ospiti, statistiche avanzate e analisi dettagliate, supporto prioritario per qualsiasi domanda, fatturazione automatica."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {next_steps}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
                {cta_text}
            </a>
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_subscription_cancellation_email_simple(user_name: str, end_date: str, language: str = "it") -> str:
    """Template email per annullamento abbonamento semplificato"""
    
    if language == "en":
        greeting = f"We'll miss you, {user_name}! 😔"
        message = f"We've received your request to cancel your HostGPT subscription. We're sorry to see you go."
        cta_text = "Reactivate Your Subscription"
        important_note = f"Your subscription will remain active until: {end_date}. You can continue to use all services until that date. Your data and chatbots will not be deleted. You can reactivate your subscription at any time."
    else:  # it
        greeting = f"Ci mancherai, {user_name}! 😔"
        message = f"Abbiamo ricevuto la tua richiesta di annullamento dell'abbonamento HostGPT. Siamo dispiaciuti di vederti andare via."
        cta_text = "Riattiva il tuo Abbonamento"
        important_note = f"Il tuo abbonamento rimarrà attivo fino al: {end_date}. Potrai continuare ad utilizzare tutti i servizi fino a quella data. I tuoi dati e chatbot non verranno cancellati. Puoi riattivare l'abbonamento in qualsiasi momento."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>{important_note}</strong>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard/settings" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            Thank you for using HostGPT. We hope to see you again soon!
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_chatbot_ready_email_simple(user_name: str, property_name: str, chat_url: str, language: str = "it") -> str:
    """Template email per chatbot pronto semplificato"""
    
    if language == "en":
        greeting = "Your Chatbot is ready! 🤖"
        message = f"Congratulations, <strong>{user_name}</strong>! Your chatbot for <strong>{property_name}</strong> has been successfully created and is already working to improve your guests' experience."
        cta_text = "Go to Dashboard"
        chatbot_info = f"Your chatbot can: Answer questions about check-in/check-out, provide information about services and amenities, recommend restaurants and local attractions, handle assistance requests 24/7, collect feedback and reviews."
        link_text = "Your chatbot link:"
    else:  # it
        greeting = "Il tuo Chatbot è pronto! 🤖"
        message = f"Congratulazioni, <strong>{user_name}</strong>! Il tuo chatbot per <strong>{property_name}</strong> è stato creato con successo e sta già lavorando per migliorare l'esperienza dei tuoi ospiti."
        cta_text = "Vai alla Dashboard"
        chatbot_info = f"Il tuo chatbot può: Rispondere alle domande sui check-in/check-out, fornire informazioni su servizi e amenità, consigliare ristoranti e attrazioni locali, gestire richieste di assistenza 24/7, raccogliere feedback e recensioni."
        link_text = "Link del tuo chatbot:"
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {chatbot_info}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['secondary']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>{link_text}</strong><br>
            <a href="{chat_url}" style="color: {HOSTGPT_SIMPLE_COLORS['primary']}; text-decoration: none; font-weight: 600;">
                {chat_url}
            </a>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            Your chatbot is now active and ready to help your guests. Monitor conversations from the dashboard to see how it's going!
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_free_trial_expired_email_simple(user_name: str, messages_used: int, total_messages: int, language: str = "it") -> str:
    """Template email per notificare la scadenza del free trial semplificato"""
    
    usage_percentage = (messages_used / total_messages) * 100 if total_messages > 0 else 0
    
    if language == "en":
        greeting = "Your free trial has expired ⏰"
        message = f"Hi <strong>{user_name}</strong>, your HostGPT free trial has expired. Your chatbot is temporarily unavailable."
        cta_text = "Reactivate Your Chatbot - €29/month"
        stats_text = f"Your trial usage: {messages_used}/{total_messages} messages used ({usage_percentage:.0f}%), 1 personalized chatbot created, 14-day trial completed"
        important_note = "Don't lose your data! All your configurations and statistics are still available and will be restored immediately after subscription activation."
    else:  # it
        greeting = "Il tuo periodo di prova è scaduto ⏰"
        message = f"Ciao <strong>{user_name}</strong>, il tuo periodo di prova gratuito di HostGPT è scaduto. Il tuo chatbot è temporaneamente non disponibile."
        cta_text = "Riattiva il tuo Chatbot"
        stats_text = f"Il tuo utilizzo durante la prova: {messages_used}/{total_messages} messaggi utilizzati ({usage_percentage:.0f}%), 1 chatbot personalizzato creato, periodo di prova di 14 giorni completato"
        important_note = "Non perdere i tuoi dati! Tutte le tue configurazioni e statistiche sono ancora disponibili e verranno ripristinate immediatamente dopo l'attivazione dell'abbonamento."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {stats_text}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/checkout" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            <strong>{important_note}</strong>
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_combined_subscription_confirmation_email_simple(user_name: str, language: str = "it") -> str:
    """Template email per confermare l'attivazione del pacchetto completo HostGPT + Guardian semplificato"""
    
    if language == "en":
        greeting = "Complete Package Activated! 🎉"
        message = f"Hi <strong>{user_name}</strong>, your complete HostGPT Pro + Guardian package is now active!"
        cta_text = "Go to Dashboard"
        package_info = "Your complete package includes: HostGPT Pro (1000 monthly messages, unlimited chatbots, instant responses 24/7) + Guardian (automatic monitoring, unsatisfied guest alerts, real-time detection)."
    else:  # it
        greeting = "Pacchetto Completo Attivato! 🎉"
        message = f"Ciao <strong>{user_name}</strong>, il tuo pacchetto completo HostGPT Pro + Guardian è ora attivo!"
        cta_text = "Vai alla Dashboard"
        package_info = "Il tuo pacchetto completo include: HostGPT Pro (1000 messaggi mensili, chatbot illimitati, risposte istantanee 24/7) + Guardian (monitoraggio automatico, alert ospiti insoddisfatti, rilevamento in tempo reale)."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {package_info}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
                {cta_text}
            </a>
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_guardian_subscription_confirmation_email_simple(user_name: str, language: str = "it") -> str:
    """Template email per confermare l'attivazione dell'abbonamento Guardian semplificato"""
    
    if language == "en":
        greeting = "Guardian activated successfully! 🛡️"
        message = f"Hi <strong>{user_name}</strong>, your HostGPT Guardian subscription has been successfully activated! You now have access to the advanced protection system to monitor your guests' satisfaction."
        cta_text = "Go to Guardian Dashboard"
        guardian_info = "Your Guardian includes: Automatic monitoring of all conversations, real-time detection of unsatisfied guests, immediate alerts for negative reviews, personalized action suggestions, dedicated Guardian dashboard, €9/month - automatic billing."
    else:  # it
        greeting = "Guardian attivato con successo! 🛡️"
        message = f"Ciao <strong>{user_name}</strong>, il tuo abbonamento HostGPT Guardian è stato attivato con successo! Ora hai accesso al sistema di protezione avanzato per monitorare la soddisfazione dei tuoi ospiti."
        cta_text = "Vai alla Dashboard Guardian"
        guardian_info = "Il tuo Guardian include: Monitoraggio automatico di tutte le conversazioni, rilevamento in tempo reale di ospiti insoddisfatti, alert immediati per recensioni negative, suggerimenti di azione personalizzati, dashboard Guardian dedicata, 9€/mese - fatturazione automatica."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {guardian_info}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard/guardian" class="cta-button">
                {cta_text}
            </a>
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_subscription_reactivation_email_simple(user_name: str, language: str = "it") -> str:
    """Template email per riattivazione abbonamento HostGPT semplificato"""
    
    if language == "en":
        greeting = "Welcome back! 🎉"
        message = f"Hi <strong>{user_name}</strong>, your HostGPT subscription has been successfully reactivated! We're glad to have you back."
        cta_text = "Go to Dashboard"
        reactivation_info = "Your HostGPT Pro subscription is now active again. You have access to 1000 monthly messages, unlimited chatbots, and all premium features. Your data and chatbots have been restored."
    else:  # it
        greeting = "Bentornato! 🎉"
        message = f"Ciao <strong>{user_name}</strong>, il tuo abbonamento HostGPT è stato riattivato con successo! Siamo felici di averti di nuovo con noi."
        cta_text = "Vai alla Dashboard"
        reactivation_info = "Il tuo abbonamento HostGPT Pro è ora di nuovo attivo. Hai accesso a 1000 messaggi mensili, chatbot illimitati e tutte le funzionalità premium. I tuoi dati e chatbot sono stati ripristinati."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {reactivation_info}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            Grazie per essere tornato! Continua a migliorare l'esperienza dei tuoi ospiti con HostGPT.
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_monthly_report_email_simple(user_name: str, report_data: dict, language: str = "it") -> str:
    """Template email per report mensile semplificato"""
    
    if language == "en":
        greeting = f"Your Monthly HostGPT Report 📊"
        message = f"Hi <strong>{user_name}</strong>, here's your monthly report with all the activity from your chatbots and Guardian system."
        cta_text = "View Full Dashboard"
        
        # Dati chatbot
        chatbot_section = ""
        if report_data.get('chatbots'):
            chatbot_section = "<h3 style='color: #FF5A5F; margin: 20px 0 10px 0;'>🤖 Your Chatbots Activity</h3>"
            for chatbot in report_data['chatbots']:
                chatbot_section += f"""
                <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <strong>{chatbot['name']}</strong><br>
                    • Conversations: {chatbot['conversations']}<br>
                    • Messages: {chatbot['messages']}<br>
                    • Avg messages per conversation: {chatbot['avg_messages']:.1f}
                </div>
                """
        
        # Dati Guardian
        guardian_section = ""
        if report_data.get('guardian_stats'):
            guardian = report_data['guardian_stats']
            guardian_section = f"""
            <h3 style='color: #8b5cf6; margin: 20px 0 10px 0;'>🛡️ Guardian Protection</h3>
            <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 10px 0;">
                • Total guests monitored: {guardian['total_guests']}<br>
                • High-risk guests detected: {guardian['high_risk_guests']}<br>
                • Issues resolved: {guardian['resolved_issues']}<br>
                • Average satisfaction: {guardian['avg_satisfaction']}/5.0<br>
                • Negative reviews prevented: {guardian['negative_reviews_prevented']}
            </div>
            """
        
        # Riepilogo
        summary_text = f"""
        <h3 style='color: #FF5A5F; margin: 20px 0 10px 0;'>📈 Monthly Summary</h3>
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['secondary']}; padding: 15px; border-radius: 8px; margin: 10px 0;">
            • Total conversations: {report_data.get('total_conversations', 0)}<br>
            • Total messages: {report_data.get('total_messages', 0)}<br>
            • Active chatbots: {report_data.get('active_chatbots', 0)}<br>
            {f"• Guardian interventions: {guardian['resolved_issues']}" if report_data.get('guardian_stats') else ""}
        </div>
        """
        
    else:  # it
        greeting = f"Il tuo Report Mensile HostGPT 📊"
        message = f"Ciao <strong>{user_name}</strong>, ecco il tuo report mensile con tutta l'attività dei tuoi chatbot e del sistema Guardian."
        cta_text = "Vai alla Dashboard"
        
        # Dati chatbot
        chatbot_section = ""
        if report_data.get('chatbots'):
            chatbot_section = "<h3 style='color: #FF5A5F; margin: 20px 0 10px 0;'>🤖 Attività dei tuoi Chatbot</h3>"
            for chatbot in report_data['chatbots']:
                chatbot_section += f"""
                <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <strong>{chatbot['name']}</strong><br>
                    • Conversazioni: {chatbot['conversations']}<br>
                    • Messaggi: {chatbot['messages']}<br>
                    • Media messaggi per conversazione: {chatbot['avg_messages']:.1f}
                </div>
                """
        
        # Dati Guardian
        guardian_section = ""
        if report_data.get('guardian_stats'):
            guardian = report_data['guardian_stats']
            guardian_section = f"""
            <h3 style='color: #8b5cf6; margin: 20px 0 10px 0;'>🛡️ Protezione Guardian</h3>
            <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 10px 0;">
                • Ospiti monitorati: {guardian['total_guests']}<br>
                • Ospiti ad alto rischio rilevati: {guardian['high_risk_guests']}<br>
                • Problemi risolti: {guardian['resolved_issues']}<br>
                • Soddisfazione media: {guardian['avg_satisfaction']}/5.0<br>
                • Recensioni negative prevenute: {guardian['negative_reviews_prevented']}
            </div>
            """
        
        # Riepilogo
        summary_text = f"""
        <h3 style='color: #FF5A5F; margin: 20px 0 10px 0;'>📈 Riepilogo Mensile</h3>
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['secondary']}; padding: 15px; border-radius: 8px; margin: 10px 0;">
            • Conversazioni totali: {report_data.get('total_conversations', 0)}<br>
            • Messaggi totali: {report_data.get('total_messages', 0)}<br>
            • Chatbot attivi: {report_data.get('active_chatbots', 0)}<br>
            {f"• Interventi Guardian: {guardian['resolved_issues']}" if report_data.get('guardian_stats') else ""}
        </div>
        """
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        {summary_text}
        
        {chatbot_section}
        
        {guardian_section}
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message" style="font-size: 14px;">
            <strong>Periodo:</strong> {report_data.get('period', 'Ultimo mese')}
        </div>
        
        <div class="message">
            Continua a migliorare l'esperienza dei tuoi ospiti con HostGPT! 🏠✨
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_guardian_subscription_reactivation_email_simple(user_name: str, language: str = "it") -> str:
    """Template email per riattivazione abbonamento Guardian semplificato"""
    
    if language == "en":
        greeting = "Welcome back to Guardian! 🛡️"
        message = f"Hi <strong>{user_name}</strong>, your HostGPT Guardian subscription has been successfully reactivated! We're glad to have you back protecting your guests."
        cta_text = "Go to Guardian Dashboard"
        reactivation_info = "Your Guardian subscription is now active again. You have access to automatic guest monitoring, satisfaction alerts, and all Guardian features. Your monitoring history has been restored."
    else:  # it
        greeting = "Bentornato a Guardian! 🛡️"
        message = f"Ciao <strong>{user_name}</strong>, il tuo abbonamento HostGPT Guardian è stato riattivato con successo! Siamo felici di averti di nuovo a proteggere i tuoi ospiti."
        cta_text = "Vai alla Dashboard Guardian"
        reactivation_info = "Il tuo abbonamento Guardian è ora di nuovo attivo. Hai accesso al monitoraggio automatico degli ospiti, agli alert di soddisfazione e a tutte le funzionalità Guardian. La tua cronologia di monitoraggio è stata ripristinata."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {reactivation_info}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard/guardian" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            Grazie per essere tornato! Continua a proteggere la soddisfazione dei tuoi ospiti con Guardian.
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_guardian_subscription_cancellation_email_simple(user_name: str, end_date: str, language: str = "it") -> str:
    """Template email per annullamento abbonamento Guardian semplificato"""
    
    if language == "en":
        greeting = f"We'll miss you, {user_name}! 😔"
        message = f"We've received your request to cancel your HostGPT Guardian subscription. We're sorry to see you go."
        cta_text = "Reactivate Your Guardian Subscription"
        important_note = f"Your Guardian subscription will remain active until: {end_date}. You can continue to use all Guardian features until that date. Your data and monitoring history will not be deleted. You can reactivate your Guardian subscription at any time."
    else:  # it
        greeting = f"Ci mancherai, {user_name}! 😔"
        message = f"Abbiamo ricevuto la tua richiesta di annullamento dell'abbonamento HostGPT Guardian. Siamo dispiaciuti di vederti andare via."
        cta_text = "Riattiva il tuo Abbonamento Guardian"
        important_note = f"Il tuo abbonamento Guardian rimarrà attivo fino al: {end_date}. Potrai continuare ad utilizzare tutte le funzionalità Guardian fino a quella data. I tuoi dati e la cronologia di monitoraggio non verranno cancellati. Puoi riattivare l'abbonamento Guardian in qualsiasi momento."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>{important_note}</strong>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard/guardian" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            Grazie per aver utilizzato HostGPT Guardian. Speriamo di rivederti presto!
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_plan_upgrade_confirmation_email_simple(user_name: str, old_plan: str, new_plan: str, new_limit: int, language: str = "it") -> str:
    """Template email per confermare l'upgrade del piano"""
    
    if language == "en":
        greeting = "Plan upgraded successfully! 🚀"
        message = f"Hi <strong>{user_name}</strong>, your HostGPT plan has been successfully upgraded from {old_plan} to {new_plan}!"
        new_features = f"Your new plan includes: {new_limit} monthly conversations, unlimited chatbots, instant responses 24/7, advanced statistics, priority support."
        cta_text = "Go to Dashboard"
        next_steps = "You can now enjoy all the benefits of your upgraded plan. Create more chatbots and manage more conversations!"
    else:  # it
        greeting = "Piano aggiornato con successo! 🚀"
        message = f"Ciao <strong>{user_name}</strong>, il tuo piano HostGPT è stato aggiornato con successo da {old_plan} a {new_plan}!"
        new_features = f"Il tuo nuovo piano include: {new_limit} conversazioni mensili, chatbot illimitati, risposte istantanee 24/7, statistiche avanzate, supporto prioritario."
        cta_text = "Vai alla Dashboard"
        next_steps = "Ora puoi godere di tutti i benefici del tuo piano aggiornato. Crea più chatbot e gestisci più conversazioni!"
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: {HOSTGPT_SIMPLE_COLORS['primary']}; margin-bottom: 10px;">✨ Nuove funzionalità disponibili:</h3>
            <p style="margin: 0;">{new_features}</p>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message">
            <strong>Prossimi passi:</strong><br>
            {next_steps}
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_purchase_confirmation_email_simple(user_name: str, subscription_type: str, amount: str, language: str = "it") -> str:
    """Template email per confermare l'acquisto avvenuto semplificato"""
    
    if language == "en":
        greeting = "Purchase completed successfully! 🎉"
        message = f"Hi <strong>{user_name}</strong>, your purchase has been completed successfully! Thank you for choosing HostGPT."
        cta_text = "Go to Dashboard"
        
        if subscription_type == "hostgpt":
            purchase_info = f"Your HostGPT Pro subscription has been activated for {amount}/month. You now have access to 1000 monthly messages, unlimited chatbots, and all premium features."
        elif subscription_type == "guardian":
            purchase_info = f"Your Guardian subscription has been activated for {amount}/month. You now have access to automatic guest monitoring and satisfaction alerts."
        elif subscription_type == "combined":
            purchase_info = f"Your complete HostGPT Pro + Guardian package has been activated for {amount}/month. You now have access to all features and advanced guest protection."
        else:
            purchase_info = f"Your subscription has been activated for {amount}/month. You now have access to all premium features."
    else:  # it
        greeting = "Acquisto completato con successo! 🎉"
        message = f"Ciao <strong>{user_name}</strong>, il tuo acquisto è stato completato con successo! Grazie per aver scelto HostGPT."
        cta_text = "Vai alla Dashboard"
        
        if subscription_type == "hostgpt":
            purchase_info = f"Il tuo abbonamento HostGPT Pro è stato attivato per {amount}/mese. Ora hai accesso a 1000 messaggi mensili, chatbot illimitati e tutte le funzionalità premium."
        elif subscription_type == "guardian":
            purchase_info = f"Il tuo abbonamento Guardian è stato attivato per {amount}/mese. Ora hai accesso al monitoraggio automatico degli ospiti e agli alert di soddisfazione."
        elif subscription_type == "combined":
            purchase_info = f"Il tuo pacchetto completo HostGPT Pro + Guardian è stato attivato per {amount}/mese. Ora hai accesso a tutte le funzionalità e alla protezione avanzata degli ospiti."
        else:
            purchase_info = f"Il tuo abbonamento è stato attivato per {amount}/mese. Ora hai accesso a tutte le funzionalità premium."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {purchase_info}
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/dashboard" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message" style="font-size: 14px;">
            <strong>Fatturazione:</strong> Il tuo abbonamento si rinnoverà automaticamente ogni mese. Puoi gestire le impostazioni di fatturazione dalla tua dashboard in qualsiasi momento.
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_conversations_limit_warning_email_simple(user_name: str, conversations_remaining: int, conversations_limit: int, language: str = "it") -> str:
    """Template email per avviso limite conversazioni semplificato"""
    
    if language == "en":
        greeting = "⚠️ Conversations limit warning"
        message = f"Hi <strong>{user_name}</strong>, you have only <strong>{conversations_remaining} conversations</strong> remaining out of your monthly limit of {conversations_limit}."
        cta_text = "Upgrade Your Plan"
        warning_info = f"You have used {conversations_limit - conversations_remaining} out of {conversations_limit} monthly conversations. Upgrade your plan to continue without interruptions and get more conversations for your guests."
        important_note = "Don't wait until the last moment! Upgrade now to ensure your guests can always reach your chatbot."
    else:  # it
        greeting = "⚠️ Avviso limite conversazioni"
        message = f"Ciao <strong>{user_name}</strong>, ti rimangono solo <strong>{conversations_remaining} conversazioni</strong> del tuo limite mensile di {conversations_limit}."
        cta_text = "Aggiorna il tuo Piano"
        warning_info = f"Hai utilizzato {conversations_limit - conversations_remaining} conversazioni su {conversations_limit} mensili. Aggiorna il tuo piano per continuare senza interruzioni e ottenere più conversazioni per i tuoi ospiti."
        important_note = "Non aspettare l'ultimo momento! Aggiorna ora per assicurarti che i tuoi ospiti possano sempre raggiungere il tuo chatbot."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>⚠️ {warning_info}</strong>
        </div>
        
        <div style="text-align: center;">
            <a href="https://hostgpt-docker.onrender.com/settings" class="cta-button">
                {cta_text}
            </a>
        </div>
        
        <div class="message" style="font-size: 14px;">
            <strong>{important_note}</strong>
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_checkin_notification_email_simple(
    guest_email: str, 
    guest_phone: str, 
    guest_first_name: str = None, 
    guest_last_name: str = None,
    property_name: str = None,
    file_count: int = 0,
    language: str = "it"
) -> str:
    """Template email per notifica check-in automatico semplificato"""
    
    guest_name = f"{guest_first_name or ''} {guest_last_name or ''}".strip()
    if not guest_name:
        guest_name = "Ospite" if language == "it" else "Guest"
    
    property_text = f" per {property_name}" if property_name else ""
    if language == "en":
        property_text = f" for {property_name}" if property_name else ""
    
    if language == "en":
        greeting = "📋 Automatic Check-in Request"
        message = f"A guest has sent documents for automatic check-in{property_text}."
        details_text = "Guest Details:"
        name_text = "Name:"
        email_text = "Email:"
        phone_text = "Phone:"
        images_text = "Attached images:"
        privacy_text = "Privacy and Security"
        privacy_info = "Images have been sent directly via email and have not been saved on HostGPT servers, ensuring maximum privacy and security of guest data."
        footer_note = "This email was automatically generated by the HostGPT system following the guest's automatic check-in request."
    else:  # it
        greeting = "📋 Richiesta Check-in Automatico"
        message = f"Un ospite ha inviato i documenti per il check-in automatico{property_text}."
        details_text = "Dettagli Ospite:"
        name_text = "Nome:"
        email_text = "Email:"
        phone_text = "Telefono:"
        images_text = "Immagini allegate:"
        privacy_text = "Privacy e Sicurezza"
        privacy_info = "Le immagini sono state inviate direttamente via email e non sono state salvate sui server di HostGPT, garantendo la massima privacy e sicurezza dei dati dell'ospite."
        footer_note = "Questa email è stata generata automaticamente dal sistema HostGPT in seguito alla richiesta di check-in automatico dell'ospite."
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>{details_text}</strong><br>
            <strong>{name_text}</strong> {guest_name}<br>
            <strong>{email_text}</strong> {guest_email}<br>
            <strong>{phone_text}</strong> {guest_phone}<br>
            <strong>{images_text}</strong> {file_count} immagini (JPEG/PNG)
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['secondary']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>📎 {images_text}</strong><br>
            {f"Le immagini del check-in sono allegate a questa email. Puoi scaricarle e procedere con la verifica per completare il processo di check-in dell'ospite." if language == "it" else "Check-in images are attached to this email. You can download them and proceed with verification to complete the guest's check-in process."}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>🔒 {privacy_text}</strong><br>
            {privacy_info}
        </div>
        
        <div class="message" style="font-size: 12px; color: {HOSTGPT_SIMPLE_COLORS['text_gray']};">
            {footer_note}
        </div>
    """
    
    return get_simple_email_template(content, language)

def create_print_order_confirmation_email_simple(user_name: str, order_number: str, order_items: list, total_amount: float, language: str = "it") -> str:
    """Template email per confermare l'ordine di stampa adesivi semplificato"""
    
    if language == "en":
        greeting = "Order confirmed! 📦"
        message = f"Hi <strong>{user_name}</strong>, your sticker order has been confirmed and is being processed!"
        order_info = f"<strong>Order Number:</strong> {order_number}<br><strong>Total Amount:</strong> €{total_amount:.2f}"
        delivery_info = "Your order will be delivered in approximately 7 business days."
        
        # Crea la lista degli item
        items_text = "<strong>Order Summary:</strong><br>"
        for item in order_items:
            items_text += f"• {item['quantity']}x {item['product_name']} - €{item['price']:.2f}<br>"
        
    else:  # it
        greeting = "Ordine confermato! 📦"
        message = f"Ciao <strong>{user_name}</strong>, il tuo ordine di adesivi è stato confermato ed è in elaborazione!"
        order_info = f"<strong>Numero Ordine:</strong> {order_number}<br><strong>Importo Totale:</strong> €{total_amount:.2f}"
        delivery_info = "Il tuo ordine dovrebbe arrivare in circa 7 giorni lavorativi."
        
        # Crea la lista degli item
        items_text = "<strong>Riepilogo Ordine:</strong><br>"
        for item in order_items:
            items_text += f"• {item['quantity']}x {item['product_name']} - €{item['price']:.2f}<br>"
    
    content = f"""
        <div class="greeting">{greeting}</div>
        
        <div class="message">
            {message}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['light_gray']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {order_info}
        </div>
        
        <div style="background-color: {HOSTGPT_SIMPLE_COLORS['secondary']}; padding: 15px; border-radius: 8px; margin: 15px 0;">
            {items_text}
        </div>
        
        <div class="message">
            {delivery_info}
        </div>
    """
    
    return get_simple_email_template(content, language)