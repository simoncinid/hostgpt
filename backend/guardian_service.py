#!/usr/bin/env python3
"""
Servizio Guardian per l'analisi delle conversazioni e la gestione degli alert
"""

import logging
import openai
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
from models import Conversation, Message, GuardianAlert, GuardianAnalysis, User, Chatbot, Guest
from config import settings
from email_templates_simple import create_guardian_alert_email_simple

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurazione OpenAI
def get_openai_client():
    """Restituisce un client OpenAI configurato"""
    return openai.OpenAI(
        api_key=settings.OPENAI_API_KEY
    )

class GuardianService:
    """Servizio per l'analisi Guardian delle conversazioni"""
    
    def __init__(self):
        self.risk_threshold = 0.851  # Soglia di rischio per generare alert
        
    def analyze_conversation(self, conversation: Conversation, db: Session) -> Dict[str, Any]:
        """
        Analizza una conversazione per determinare il rischio di recensione negativa
        Analizza SOLO l'ultimo messaggio dell'utente e l'ultima risposta del chatbot
        
        Args:
            conversation: Oggetto Conversation da analizzare
            db: Sessione del database
            
        Returns:
            Dict con i risultati dell'analisi
        """
        try:
            logger.info(f"Avvio analisi Guardian per conversazione {conversation.id}")
            
            # Recupera SOLO l'ultimo messaggio dell'utente
            last_user_message = db.query(Message).filter(
                Message.conversation_id == conversation.id,
                Message.role == 'user'
            ).order_by(Message.timestamp.desc()).first()
            
            # Recupera SOLO l'ultima risposta del chatbot
            last_assistant_message = db.query(Message).filter(
                Message.conversation_id == conversation.id,
                Message.role == 'assistant'
            ).order_by(Message.timestamp.desc()).first()
            
            if not last_user_message:
                logger.info(f"Nessun messaggio utente trovato per conversazione {conversation.id}")
                return {
                    'risk_score': 0.0,
                    'sentiment_score': 0.0,
                    'confidence_score': 0.0,
                    'analysis_details': {'reason': 'Nessun messaggio utente da analizzare'}
                }
            
            # Prepara il testo per l'analisi (solo ultimo messaggio utente e ultima risposta chatbot)
            conversation_text = self._prepare_single_message_text(last_user_message, last_assistant_message)
            
            # Analizza con OpenAI
            analysis_result = self._analyze_with_openai(conversation_text)
            
            # Gestisci insufficient_info
            insufficient_info = analysis_result.get('insufficient_info', False)
            if insufficient_info:
                analysis_result['analysis_details']['insufficient_info_detected'] = True
                if 'insufficient_info_reason' in analysis_result['analysis_details']:
                    analysis_result['analysis_details']['key_issues'].append(f"Chatbot senza informazioni: {analysis_result['analysis_details']['insufficient_info_reason']}")
                else:
                    analysis_result['analysis_details']['key_issues'].append("Chatbot non ha abbastanza informazioni per rispondere")
                logger.warning(f"⚠️ INSUFFICIENT INFO DETECTED: Conversazione {conversation.id} - Chatbot ha risposto con mancanza di informazioni")
            
            # Salva l'analisi nel database
            guardian_analysis = GuardianAnalysis(
                conversation_id=conversation.id,
                risk_score=analysis_result['risk_score'],
                sentiment_score=analysis_result['sentiment_score'],
                confidence_score=analysis_result['confidence_score'],
                analysis_details=analysis_result['analysis_details'],
                user_messages_analyzed=1,  # Analizziamo solo l'ultimo messaggio
                conversation_length=len(conversation_text)
            )
            
            db.add(guardian_analysis)
            
            # Aggiorna la conversazione
            conversation.guardian_analyzed = True
            conversation.guardian_risk_score = analysis_result['risk_score']
            
            # Controlla se generare un alert (sia per rischio alto che per insufficient_info)
            if analysis_result['risk_score'] >= self.risk_threshold or insufficient_info:
                conversation.guardian_alert_triggered = True
                alert_reason = "insufficient_info" if insufficient_info else "high_risk"
                logger.warning(f"🚨 ALERT GUARDIAN: Conversazione {conversation.id} - {alert_reason} - Rischio: {analysis_result['risk_score']:.3f}")
            
            db.commit()
            
            logger.info(f"Analisi Guardian completata per conversazione {conversation.id}: rischio {analysis_result['risk_score']:.3f}")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Errore durante l'analisi Guardian della conversazione {conversation.id}: {e}")
            db.rollback()
            raise
    
    def _prepare_single_message_text(self, user_message: Message, assistant_message: Message = None) -> str:
        """
        Prepara il testo per l'analisi di un singolo scambio di messaggi
        
        Args:
            user_message: Ultimo messaggio dell'utente
            assistant_message: Ultima risposta del chatbot (opzionale)
            
        Returns:
            Testo formattato per l'analisi
        """
        conversation_lines = []
        
        # Aggiungi il messaggio dell'utente
        timestamp = user_message.timestamp.strftime("%H:%M")
        conversation_lines.append(f"Ospite ({timestamp}): {user_message.content}")
        
        # Aggiungi la risposta del chatbot se disponibile
        if assistant_message:
            timestamp = assistant_message.timestamp.strftime("%H:%M")
            conversation_lines.append(f"Chatbot ({timestamp}): {assistant_message.content}")
        
        return "\n\n".join(conversation_lines)
    
    def _analyze_with_openai(self, conversation_text: str) -> Dict[str, Any]:
        """
        Analizza il testo della conversazione con OpenAI
        
        Args:
            conversation_text: Testo della conversazione
            
        Returns:
            Risultati dell'analisi
        """
        try:
            prompt = f"""
Analizza l'ultimo scambio di messaggi tra un ospite e un chatbot di una struttura ricettiva e determina:

1. Il rischio che l'ospite lasci una recensione negativa (0.0 - 1.0)
2. Il sentiment generale dell'ospite (-1.0 a +1.0, dove -1 è molto negativo)
3. La confidenza dell'analisi (0.0 - 1.0)
4. Se il chatbot ha risposto con mancanza di informazioni (true/false)

⚠️ REGOLE CRITICHE - Sii ESTREMAMENTE sensibile ai segnali di insoddisfazione! ⚠️
⚠️ IMPORTANTE: Analizza SOLO l'ultimo scambio di messaggi, non l'intera conversazione! ⚠️

ASSEGNA IMMEDIATAMENTE RISK_SCORE 0.95-1.0 per:
- QUALSIASI menzione di "recensione negativa", "recensione brutta", "star negative", "1 stella"
- Minacce esplicite o implicite di recensioni negative
- Frustrazione estrema, rabbia, o linguaggio offensivo
- Espressioni come "mai più", "terribile", "orribile", "peggiore", "vergognoso"
- Problemi non risolti che causano disagio significativo
- Linguaggio molto negativo o aggressivo
- Ospiti che si sentono "truffati" o "delusi"

ASSEGNA RISK_SCORE 0.8-0.95 per:
- Frustrazione moderata ma persistente
- Problemi minori non risolti
- Insoddisfazione espressa chiaramente
- Ospiti che sembrano "delusi" o "insoddisfatti"

ASSEGNA RISK_SCORE 0.6-0.8 per:
- Frustrazione generale
- Problemi risolti ma con insoddisfazione
- Linguaggio leggermente negativo

ASSEGNA RISK_SCORE 0.0-0.5 SOLO per:
- Problemi risolti positivamente
- Linguaggio neutro o positivo
- Richieste normali di assistenza

🚨 NUOVO: RILEVAMENTO MANCANZA DI INFORMAZIONI DEL CHATBOT 🚨

IMPORTANTE: Analizza anche le risposte del chatbot per rilevare se ha risposto con mancanza di informazioni.

ASSEGNA insufficient_info = true se il chatbot:
- Dice di "contattare l'host" per informazioni che dovrebbe avere
- Risponde con "non ho informazioni", "non so rispondere", "non posso aiutare"
- Dice "non sono sicuro", "non ho i dati", "informazioni insufficienti"
- Suggerisce di "rivolgersi all'host" per domande normali
- Non fornisce risposte specifiche e dettagliate
- Risponde in modo generico senza informazioni concrete
- Dice di "chiedere all'host" per cose che dovrebbe sapere

Se insufficient_info = true, assegna ALMENO risk_score 0.85 (anche se l'ospite sembra soddisfatto)

RICORDA: È meglio sovrastimare il rischio che sottostimarlo. Se c'è anche solo un dubbio, assegna un punteggio più alto!

Ultimo scambio di messaggi:
{conversation_text}

Rispondi SOLO con un JSON valido nel seguente formato:
{{
    "risk_score": 0.123,
    "sentiment_score": -0.456,
    "confidence_score": 0.789,
    "insufficient_info": true/false,
    "analysis_details": {{
        "reasoning": "Spiegazione del punteggio di rischio",
        "key_issues": ["problema1", "problema2"],
        "sentiment_factors": ["fattore1", "fattore2"],
        "insufficient_info_reason": "Motivo per cui il chatbot non ha abbastanza informazioni (se applicabile)"
    }}
}}
"""

            client = get_openai_client()
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Sei un esperto analista di rischio per il settore turistico. Il tuo compito è identificare ospiti che potrebbero lasciare recensioni negative E rilevare quando il chatbot non ha abbastanza informazioni per rispondere. Analizza SOLO l'ultimo scambio di messaggi, non l'intera conversazione. Sii ESTREMAMENTE sensibile ai segnali di insoddisfazione. Assegna IMMEDIATAMENTE punteggi di rischio elevati (0.95-1.0) quando rilevi minacce esplicite di recensioni negative, frustrazione estrema, rabbia, o problemi non risolti. Inoltre, rileva quando il chatbot risponde con mancanza di informazioni e assegna ALMENO 0.85 di rischio in questi casi. È meglio sovrastimare il rischio che sottostimarlo. Se c'è anche solo un dubbio, assegna un punteggio più alto!"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            # Estrai la risposta JSON
            response_text = response.choices[0].message.content.strip()
            
            # Pulisci la risposta se contiene markdown
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            analysis_result = json.loads(response_text)
            
            # Valida i punteggi
            analysis_result['risk_score'] = max(0.0, min(1.0, float(analysis_result['risk_score'])))
            analysis_result['sentiment_score'] = max(-1.0, min(1.0, float(analysis_result['sentiment_score'])))
            analysis_result['confidence_score'] = max(0.0, min(1.0, float(analysis_result['confidence_score'])))
            
            # Gestisci il campo insufficient_info
            insufficient_info = analysis_result.get('insufficient_info', False)
            if insufficient_info and analysis_result['risk_score'] < 0.85:
                analysis_result['risk_score'] = 0.85  # Forza almeno 0.85 se insufficient_info è true
                logger.info(f"Rischio aumentato a 0.85 per insufficient_info rilevato")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Errore nell'analisi OpenAI: {e}")
            # Fallback con valori di default
            return {
                'risk_score': 0.5,
                'sentiment_score': 0.0,
                'confidence_score': 0.5,
                'analysis_details': {
                    'reasoning': 'Errore nell\'analisi automatica',
                    'key_issues': ['Errore tecnico'],
                    'sentiment_factors': ['Analisi non disponibile']
                }
            }
    
    def create_alert(self, conversation: Conversation, analysis_result: Dict[str, Any], db: Session) -> GuardianAlert:
        """
        Crea un alert Guardian per una conversazione problematica
        
        Args:
            conversation: Conversazione problematica
            analysis_result: Risultati dell'analisi
            db: Sessione del database
            
        Returns:
            Oggetto GuardianAlert creato
        """
        try:
            # Recupera il proprietario del chatbot
            chatbot = db.query(Chatbot).filter(Chatbot.id == conversation.chatbot_id).first()
            if not chatbot:
                raise ValueError(f"Chatbot non trovato per conversazione {conversation.id}")
            
            # Determina la severità basata sul punteggio di rischio
            risk_score = analysis_result['risk_score']
            if risk_score >= 0.95:
                severity = 'critical'
            elif risk_score >= 0.90:
                severity = 'high'
            elif risk_score >= 0.85:
                severity = 'medium'
            else:
                severity = 'low'
            
            # Crea il messaggio dell'alert
            message = self._create_alert_message(conversation, analysis_result)
            suggested_action = self._create_suggested_action(analysis_result)
            conversation_summary = self._create_conversation_summary(conversation, db)
            
            # Determina il tipo di alert
            insufficient_info = analysis_result.get('insufficient_info', False)
            alert_type = 'insufficient_info' if insufficient_info else 'negative_review_risk'
            
            # Crea l'alert
            alert = GuardianAlert(
                user_id=chatbot.user_id,
                conversation_id=conversation.id,
                alert_type=alert_type,
                severity=severity,
                risk_score=risk_score,
                message=message,
                suggested_action=suggested_action,
                conversation_summary=conversation_summary
            )
            
            db.add(alert)
            db.commit()
            
            logger.info(f"Alert Guardian creato: ID {alert.id} per conversazione {conversation.id}")
            
            return alert
            
        except Exception as e:
            logger.error(f"Errore nella creazione dell'alert Guardian: {e}")
            db.rollback()
            raise
    
    def _create_alert_message(self, conversation: Conversation, analysis_result: Dict[str, Any]) -> str:
        """Crea il messaggio dell'alert"""
        risk_score = analysis_result['risk_score']
        sentiment_score = analysis_result['sentiment_score']
        insufficient_info = analysis_result.get('insufficient_info', False)
        
        if risk_score >= 0.95:
            urgency = "CRITICO"
            emoji = "🚨"
        elif risk_score >= 0.90:
            urgency = "ALTO"
            emoji = "⚠️"
        else:
            urgency = "MEDIO"
            emoji = "⚠️"
        
        if insufficient_info:
            return f"{emoji} ALERT {urgency}: Chatbot senza informazioni sufficienti nella conversazione #{conversation.id}. Rischio: {risk_score:.1%}. Il chatbot ha risposto con mancanza di informazioni."
        else:
            return f"{emoji} ALERT {urgency}: Ospite insoddisfatto rilevato nella conversazione #{conversation.id}. Rischio recensione negativa: {risk_score:.1%}. Sentiment: {sentiment_score:.2f}"
    
    def _create_suggested_action(self, analysis_result: Dict[str, Any]) -> str:
        """Crea l'azione suggerita basata sull'analisi"""
        key_issues = analysis_result.get('analysis_details', {}).get('key_issues', [])
        insufficient_info = analysis_result.get('insufficient_info', False)
        
        # Se è stato rilevato che il chatbot non ha abbastanza informazioni
        if insufficient_info:
            return "URGENTE: Il chatbot non ha abbastanza informazioni per rispondere. Aggiorna immediatamente le informazioni del chatbot con i dettagli mancanti e contatta l'ospite per fornire assistenza diretta."
        
        if not key_issues:
            return "Contatta immediatamente l'ospite per verificare la soddisfazione e offrire assistenza."
        
        if 'wifi' in ' '.join(key_issues).lower():
            return "Problema WiFi rilevato. Invia immediatamente le credenziali corrette o contatta il tecnico."
        elif 'pulizia' in ' '.join(key_issues).lower():
            return "Problema di pulizia rilevato. Organizza immediatamente una pulizia straordinaria."
        elif 'rumore' in ' '.join(key_issues).lower():
            return "Problema di rumore rilevato. Contatta i vicini o offre un cambio stanza."
        else:
            return "Contatta immediatamente l'ospite per risolvere il problema e offrire una compensazione."
    
    def _create_conversation_summary(self, conversation: Conversation, db: Session) -> str:
        """Crea un riassunto dell'ultimo scambio di messaggi"""
        # Recupera solo l'ultimo messaggio dell'utente e l'ultima risposta del chatbot
        last_user_message = db.query(Message).filter(
            Message.conversation_id == conversation.id,
            Message.role == 'user'
        ).order_by(Message.timestamp.desc()).first()
        
        last_assistant_message = db.query(Message).filter(
            Message.conversation_id == conversation.id,
            Message.role == 'assistant'
        ).order_by(Message.timestamp.desc()).first()
        
        if not last_user_message:
            return "Nessun messaggio disponibile"
        
        summary_lines = []
        
        # Aggiungi l'ultimo messaggio dell'utente
        time = last_user_message.timestamp.strftime("%H:%M")
        content = last_user_message.content[:200] + "..." if len(last_user_message.content) > 200 else last_user_message.content
        summary_lines.append(f"[{time}] Ospite: {content}")
        
        # Aggiungi l'ultima risposta del chatbot se disponibile
        if last_assistant_message:
            time = last_assistant_message.timestamp.strftime("%H:%M")
            content = last_assistant_message.content[:200] + "..." if len(last_assistant_message.content) > 200 else last_assistant_message.content
            summary_lines.append(f"[{time}] Chatbot: {content}")
        
        return "\n".join(summary_lines)
    
    def send_alert_email(self, alert: GuardianAlert, db: Session) -> bool:
        """
        Invia email di alert al proprietario del chatbot
        
        Args:
            alert: Alert da inviare
            db: Sessione del database
            
        Returns:
            True se l'email è stata inviata con successo
        """
        try:
            from main import send_email  # Import locale per evitare dipendenze circolari
            
            # Recupera l'utente proprietario
            user = db.query(User).filter(User.id == alert.user_id).first()
            if not user:
                logger.error(f"Utente non trovato per alert {alert.id}")
                return False
            
            # Crea il contenuto dell'email
            email_body = create_guardian_alert_email_simple(
                user_name=user.full_name,
                alert=alert,
                conversation_summary=alert.conversation_summary,
                language=user.language or "it"
            )
            
            # Invia l'email
            email_subject = "🚨 GUARDIAN ALERT: Unsatisfied guest detected" if (user.language or "it") == "en" else "🚨 ALERT GUARDIAN: Ospite insoddisfatto rilevato"
            send_email(
                to_email=user.email,
                subject=email_subject,
                html_content=email_body
            )
            
            # Marca l'email come inviata
            alert.email_sent = True
            alert.email_sent_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Email di alert inviata a {user.email} per alert {alert.id}")
            return True
            
        except Exception as e:
            logger.error(f"Errore nell'invio dell'email di alert: {e}")
            return False
    
    def resolve_alert(self, alert_id: int, resolved_by: str, db: Session) -> bool:
        """
        Risolve un alert Guardian
        
        Args:
            alert_id: ID dell'alert da risolvere
            resolved_by: Chi ha risolto l'alert
            db: Sessione del database
            
        Returns:
            True se l'alert è stato risolto con successo
        """
        try:
            alert = db.query(GuardianAlert).filter(GuardianAlert.id == alert_id).first()
            if not alert:
                logger.error(f"Alert {alert_id} non trovato")
                return False
            
            logger.info(f"Risolvendo alert {alert_id}: is_resolved={alert.is_resolved} -> True")
            
            alert.is_resolved = True
            alert.resolved_at = datetime.utcnow()
            alert.resolved_by = resolved_by
            
            db.commit()
            
            # Verifica che l'aggiornamento sia stato salvato
            db.refresh(alert)
            logger.info(f"Alert {alert_id} risolto da {resolved_by}, is_resolved confermato: {alert.is_resolved}")
            return True
            
        except Exception as e:
            logger.error(f"Errore nella risoluzione dell'alert {alert_id}: {e}")
            db.rollback()
            return False
    
    def send_guest_resolution_email(self, conversation: Conversation, host_response: str, db: Session) -> bool:
        """
        Invia email al guest con la conversazione completa e la risposta dell'host
        
        Args:
            conversation: Conversazione risolta
            host_response: Risposta dell'host
            db: Sessione del database
            
        Returns:
            True se l'email è stata inviata con successo
        """
        try:
            # Recupera il guest
            guest = db.query(Guest).filter(Guest.id == conversation.guest_id).first()
            if not guest or not guest.email:
                logger.warning(f"Guest non trovato o senza email per conversazione {conversation.id}")
                return False
            
            # Recupera tutti i messaggi della conversazione
            messages = db.query(Message).filter(
                Message.conversation_id == conversation.id
            ).order_by(Message.timestamp).all()
            
            # Recupera il chatbot per ottenere il link
            chatbot = db.query(Chatbot).filter(Chatbot.id == conversation.chatbot_id).first()
            if not chatbot:
                logger.error(f"Chatbot non trovato per conversazione {conversation.id}")
                return False
            
            # Crea il contenuto della conversazione
            conversation_text = ""
            for msg in messages:
                role_label = "Ospite" if msg.role == "user" else "Assistente"
                conversation_text += f"{role_label}: {msg.content}\n\n"
            
            # Aggiungi la risposta dell'host
            conversation_text += f"Host: {host_response}\n\n"
            
            # Crea il link alla chat
            chat_link = f"https://hostgpt.it/chat/{chatbot.uuid}?thread_id={conversation.thread_id}"
            
            # Determina la lingua dell'ospite (per ora usiamo italiano come default)
            # TODO: Aggiungere supporto per la lingua dell'ospite
            language = "it"
            
            if language == "en":
                subject = "Your conversation has been updated - HostGPT"
                content = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">🏠 HostGPT</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Your AI-powered host assistant</p>
    </div>
    
    <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 30px;">
        <h2 style="color: #1e40af; margin: 0 0 10px 0;">✅ Your conversation has been updated</h2>
        <p style="color: #374151; margin: 0;">The host has responded to your conversation and the chat is now unlocked.</p>
    </div>
    
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #374151; margin: 0 0 15px 0;">💬 Complete conversation:</h3>
        <div style="background: white; border-radius: 6px; padding: 15px; font-family: monospace; font-size: 14px; line-height: 1.5; white-space: pre-wrap; color: #374151;">{conversation_text}</div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
        <a href="{chat_link}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; transition: background-color 0.2s;">Continue Conversation</a>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 14px;">
        <p>Thank you for using HostGPT!</p>
        <p>The HostGPT Team</p>
    </div>
</div>
                """
            else:  # it
                subject = "La tua conversazione è stata aggiornata - HostGPT"
                content = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">🏠 HostGPT</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Il tuo assistente host potenziato dall'AI</p>
    </div>
    
    <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 30px;">
        <h2 style="color: #1e40af; margin: 0 0 10px 0;">✅ La tua conversazione è stata aggiornata</h2>
        <p style="color: #374151; margin: 0;">L'host ha risposto alla tua conversazione e la chat è ora sbloccata.</p>
    </div>
    
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #374151; margin: 0 0 15px 0;">💬 Conversazione completa:</h3>
        <div style="background: white; border-radius: 6px; padding: 15px; font-family: monospace; font-size: 14px; line-height: 1.5; white-space: pre-wrap; color: #374151;">{conversation_text}</div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
        <a href="{chat_link}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; transition: background-color 0.2s;">Continua la Conversazione</a>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 14px;">
        <p>Grazie per aver utilizzato HostGPT!</p>
        <p>Il team di HostGPT</p>
    </div>
</div>
                """
            
            # Invia l'email
            from main import send_email
            success = send_email(
                to_email=guest.email,
                subject=subject,
                html_content=content
            )
            
            if success:
                logger.info(f"Email di risoluzione inviata a {guest.email} per conversazione {conversation.id}")
            else:
                logger.error(f"Errore nell'invio dell'email di risoluzione a {guest.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Errore nell'invio dell'email di risoluzione: {e}")
            return False
    
    def get_guardian_statistics(self, user_id: int, db: Session) -> Dict[str, Any]:
        """
        Ottiene le statistiche Guardian per un utente
        
        Args:
            user_id: ID dell'utente
            db: Sessione del database
            
        Returns:
            Statistiche Guardian
        """
        try:
            # Conta le conversazioni totali
            total_conversations = db.query(Conversation).join(Chatbot).filter(
                Chatbot.user_id == user_id
            ).count()
            
            # Conta le conversazioni ad alto rischio
            high_risk_conversations = db.query(Conversation).join(Chatbot).filter(
                Chatbot.user_id == user_id,
                Conversation.guardian_risk_score >= self.risk_threshold
            ).count()
            
            # Conta gli alert risolti
            resolved_alerts = db.query(GuardianAlert).filter(
                GuardianAlert.user_id == user_id,
                GuardianAlert.is_resolved == True
            ).count()
            
            # Calcola la soddisfazione media (inversa del rischio)
            avg_risk = db.query(Conversation.guardian_risk_score).join(Chatbot).filter(
                Chatbot.user_id == user_id,
                Conversation.guardian_analyzed == True
            ).all()
            
            if avg_risk:
                avg_satisfaction = 5.0 - (sum([r[0] for r in avg_risk]) / len(avg_risk)) * 4.0
                avg_satisfaction = max(1.0, min(5.0, avg_satisfaction))
            else:
                avg_satisfaction = 5.0
            
            # Conta le recensioni negative prevenute (alert risolti)
            negative_reviews_prevented = resolved_alerts
            
            return {
                'total_guests': total_conversations,
                'high_risk_guests': high_risk_conversations,
                'resolved_issues': resolved_alerts,
                'avg_satisfaction': round(avg_satisfaction, 1),
                'negative_reviews_prevented': negative_reviews_prevented
            }
            
        except Exception as e:
            logger.error(f"Errore nel calcolo delle statistiche Guardian per utente {user_id}: {e}")
            return {
                'total_guests': 0,
                'high_risk_guests': 0,
                'resolved_issues': 0,
                'avg_satisfaction': 5.0,
                'negative_reviews_prevented': 0
            }

# Istanza globale del servizio
guardian_service = GuardianService()
