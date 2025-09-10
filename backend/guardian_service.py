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
from models import Conversation, Message, GuardianAlert, GuardianAnalysis, User, Chatbot
from config import settings
from email_templates_simple import create_guardian_alert_email_simple

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurazione OpenAI
openai.api_key = settings.OPENAI_API_KEY

class GuardianService:
    """Servizio per l'analisi Guardian delle conversazioni"""
    
    def __init__(self):
        self.risk_threshold = 0.851  # Soglia di rischio per generare alert
        
    def analyze_conversation(self, conversation: Conversation, db: Session) -> Dict[str, Any]:
        """
        Analizza una conversazione per determinare il rischio di recensione negativa
        
        Args:
            conversation: Oggetto Conversation da analizzare
            db: Sessione del database
            
        Returns:
            Dict con i risultati dell'analisi
        """
        try:
            logger.info(f"Avvio analisi Guardian per conversazione {conversation.id}")
            
            # Recupera tutti i messaggi dell'utente nella conversazione
            user_messages = db.query(Message).filter(
                Message.conversation_id == conversation.id,
                Message.role == 'user'
            ).order_by(Message.timestamp).all()
            
            if not user_messages:
                logger.info(f"Nessun messaggio utente trovato per conversazione {conversation.id}")
                return {
                    'risk_score': 0.0,
                    'sentiment_score': 0.0,
                    'confidence_score': 0.0,
                    'analysis_details': {'reason': 'Nessun messaggio utente da analizzare'}
                }
            
            # Prepara il testo per l'analisi
            conversation_text = self._prepare_conversation_text(user_messages)
            
            # Analizza con OpenAI
            analysis_result = self._analyze_with_openai(conversation_text)
            
            # Salva l'analisi nel database
            guardian_analysis = GuardianAnalysis(
                conversation_id=conversation.id,
                risk_score=analysis_result['risk_score'],
                sentiment_score=analysis_result['sentiment_score'],
                confidence_score=analysis_result['confidence_score'],
                analysis_details=analysis_result['analysis_details'],
                user_messages_analyzed=len(user_messages),
                conversation_length=len(conversation_text)
            )
            
            db.add(guardian_analysis)
            
            # Aggiorna la conversazione
            conversation.guardian_analyzed = True
            conversation.guardian_risk_score = analysis_result['risk_score']
            
            # Controlla se generare un alert
            if analysis_result['risk_score'] >= self.risk_threshold:
                conversation.guardian_alert_triggered = True
                logger.warning(f"🚨 ALERT GUARDIAN: Conversazione {conversation.id} ha rischio {analysis_result['risk_score']:.3f}")
            
            db.commit()
            
            logger.info(f"Analisi Guardian completata per conversazione {conversation.id}: rischio {analysis_result['risk_score']:.3f}")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Errore durante l'analisi Guardian della conversazione {conversation.id}: {e}")
            db.rollback()
            raise
    
    def _prepare_conversation_text(self, user_messages: List[Message]) -> str:
        """
        Prepara il testo della conversazione per l'analisi
        
        Args:
            user_messages: Lista dei messaggi dell'utente
            
        Returns:
            Testo formattato per l'analisi
        """
        conversation_lines = []
        
        for i, message in enumerate(user_messages, 1):
            timestamp = message.timestamp.strftime("%H:%M")
            conversation_lines.append(f"Messaggio {i} ({timestamp}): {message.content}")
        
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
Analizza la seguente conversazione di un ospite con un chatbot di una struttura ricettiva e determina:

1. Il rischio che l'ospite lasci una recensione negativa (0.0 - 1.0)
2. Il sentiment generale dell'ospite (-1.0 a +1.0, dove -1 è molto negativo)
3. La confidenza dell'analisi (0.0 - 1.0)

⚠️ REGOLE CRITICHE - Sii ESTREMAMENTE sensibile ai segnali di insoddisfazione! ⚠️

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

RICORDA: È meglio sovrastimare il rischio che sottostimarlo. Se c'è anche solo un dubbio, assegna un punteggio più alto!

Conversazione:
{conversation_text}

Rispondi SOLO con un JSON valido nel seguente formato:
{{
    "risk_score": 0.123,
    "sentiment_score": -0.456,
    "confidence_score": 0.789,
    "analysis_details": {{
        "reasoning": "Spiegazione del punteggio di rischio",
        "key_issues": ["problema1", "problema2"],
        "sentiment_factors": ["fattore1", "fattore2"]
    }}
}}
"""

            response = openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Sei un esperto analista di rischio per il settore turistico. Il tuo compito è identificare ospiti che potrebbero lasciare recensioni negative. Sii ESTREMAMENTE sensibile ai segnali di insoddisfazione. Assegna IMMEDIATAMENTE punteggi di rischio elevati (0.95-1.0) quando rilevi minacce esplicite di recensioni negative, frustrazione estrema, rabbia, o problemi non risolti. È meglio sovrastimare il rischio che sottostimarlo. Se c'è anche solo un dubbio, assegna un punteggio più alto!"},
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
            
            # Crea l'alert
            alert = GuardianAlert(
                user_id=chatbot.user_id,
                conversation_id=conversation.id,
                alert_type='negative_review_risk',
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
        
        if risk_score >= 0.95:
            urgency = "CRITICO"
            emoji = "🚨"
        elif risk_score >= 0.90:
            urgency = "ALTO"
            emoji = "⚠️"
        else:
            urgency = "MEDIO"
            emoji = "⚠️"
        
        return f"{emoji} ALERT {urgency}: Ospite insoddisfatto rilevato nella conversazione #{conversation.id}. Rischio recensione negativa: {risk_score:.1%}. Sentiment: {sentiment_score:.2f}"
    
    def _create_suggested_action(self, analysis_result: Dict[str, Any]) -> str:
        """Crea l'azione suggerita basata sull'analisi"""
        key_issues = analysis_result.get('analysis_details', {}).get('key_issues', [])
        
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
        """Crea un riassunto della conversazione"""
        messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.timestamp).limit(10).all()  # Ultimi 10 messaggi
        
        if not messages:
            return "Nessun messaggio disponibile"
        
        summary_lines = []
        for msg in messages:
            role = "Ospite" if msg.role == 'user' else "Chatbot"
            time = msg.timestamp.strftime("%H:%M")
            content = msg.content[:100] + "..." if len(msg.content) > 100 else msg.content
            summary_lines.append(f"[{time}] {role}: {content}")
        
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
