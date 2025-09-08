from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
import stripe
import openai
from jose import JWTError, jwt
from passlib.context import CryptContext
import json
import qrcode
import io
import base64
from pydantic import BaseModel, EmailStr
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import secrets
import logging

from database import get_db, engine
from models import Base, User, Chatbot, Conversation, Message, KnowledgeBase, Analytics, GuardianAlert, GuardianAnalysis, ReferralCode
from config import settings
from email_templates_simple import (
    create_welcome_email_simple,
    create_subscription_activation_email_simple,
    create_guardian_alert_email_simple,
    create_free_trial_welcome_email_simple,
    create_free_trial_ending_email_simple,
    create_subscription_confirmation_email_simple,
    create_subscription_cancellation_email_simple,
    create_chatbot_ready_email_simple,
    create_free_trial_expired_email_simple,
    create_combined_subscription_confirmation_email_simple,
    create_guardian_subscription_confirmation_email_simple
)

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crea le tabelle
Base.metadata.create_all(bind=engine)

# Inizializza app FastAPI
app = FastAPI(title="HostGPT API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurazione
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
stripe.api_key = settings.STRIPE_SECRET_KEY
openai.api_key = settings.OPENAI_API_KEY

def is_subscription_active(subscription_status: str) -> bool:
    """Verifica se l'abbonamento è attivo (considerando anche 'cancelling' e 'free_trial')"""
    return subscription_status in ['active', 'cancelling', 'free_trial']

def is_free_trial_active(user: User) -> bool:
    """Verifica se il free trial è attivo e non scaduto"""
    if user.subscription_status != 'free_trial':
        return False
    
    if not user.free_trial_end_date:
        return False
    
    return datetime.utcnow() < user.free_trial_end_date

def get_free_trial_messages_remaining(user: User) -> int:
    """Calcola i messaggi rimanenti nel free trial"""
    if not is_free_trial_active(user):
        return 0
    
    return max(0, user.free_trial_messages_limit - user.free_trial_messages_used)

def get_openai_client():
    """Restituisce un client OpenAI configurato per Assistants v2."""
    return openai.OpenAI(
        api_key=settings.OPENAI_API_KEY,
        default_headers={"OpenAI-Beta": "assistants=v2"}
    )

# OAuth2 bearer per estrarre il token dall'header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ============= Pydantic Models =============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    wants_free_trial: Optional[bool] = False
    language: Optional[str] = "it"  # 'it' or 'en'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatbotCreate(BaseModel):
    name: str
    property_name: str
    property_type: str
    property_address: str
    property_city: str
    property_description: str
    check_in_time: str
    check_out_time: str
    house_rules: str
    amenities: List[str]
    neighborhood_description: str
    nearby_attractions: List[dict]
    transportation_info: str
    restaurants_bars: List[dict]
    shopping_info: str
    emergency_contacts: List[dict]
    wifi_info: dict
    parking_info: str
    special_instructions: str
    faq: List[dict]
    welcome_message: str

class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    property_name: Optional[str] = None
    property_type: Optional[str] = None
    property_address: Optional[str] = None
    property_city: Optional[str] = None
    property_description: Optional[str] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    house_rules: Optional[str] = None
    amenities: Optional[List[str]] = None
    neighborhood_description: Optional[str] = None
    nearby_attractions: Optional[List[dict]] = None
    transportation_info: Optional[str] = None
    restaurants_bars: Optional[List[dict]] = None
    shopping_info: Optional[str] = None
    emergency_contacts: Optional[List[dict]] = None
    wifi_info: Optional[dict] = None
    parking_info: Optional[str] = None
    special_instructions: Optional[str] = None
    faq: Optional[List[dict]] = None
    welcome_message: Optional[str] = None

class ChatbotResponse(BaseModel):
    id: int
    user_id: int
    assistant_id: str
    uuid: str
    name: str
    property_name: str
    property_type: Optional[str]
    property_address: Optional[str]
    property_city: Optional[str]
    property_description: Optional[str]
    check_in_time: Optional[str]
    check_out_time: Optional[str]
    house_rules: Optional[str]
    amenities: Optional[dict]
    neighborhood_description: Optional[str]
    nearby_attractions: Optional[dict]
    transportation_info: Optional[str]
    restaurants_bars: Optional[dict]
    shopping_info: Optional[str]
    emergency_contacts: Optional[dict]
    wifi_info: Optional[dict]
    parking_info: Optional[str]
    special_instructions: Optional[str]
    faq: Optional[dict]
    welcome_message: Optional[str]
    icon_filename: Optional[str]
    icon_content_type: Optional[str]
    total_conversations: int
    total_messages: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str
    thread_id: Optional[str] = None
    guest_name: Optional[str] = None

class SubscriptionCreate(BaseModel):
    payment_method_id: str

class SubscriptionConfirm(BaseModel):
    session_id: Optional[str] = None

class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str
    referral_code: Optional[str] = None

class ReferralCodeRequest(BaseModel):
    code: str

class ReferralCodeResponse(BaseModel):
    valid: bool
    bonus_messages: int
    message: str

# ============= Utility Functions =============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def send_email(to_email: str, subject: str, body: str, attachments: Optional[list[tuple[str, bytes, str]]] = None):
    """Invia email async con eventuali allegati.
    attachments: lista di tuple (filename, content_bytes, content_type), es. ("qrcode.png", b"...", "image/png")
    """
    try:
        message = MIMEMultipart()
        message["From"] = settings.FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        
        message.attach(MIMEText(body, "html"))

        # Allegati opzionali
        if attachments:
            for filename, content_bytes, content_type in attachments:
                if content_type.startswith("image/"):
                    subtype = content_type.split("/")[1]
                    img = MIMEImage(content_bytes, _subtype=subtype)
                    img.add_header('Content-Disposition', 'attachment', filename=filename)
                    message.attach(img)
                else:
                    # Per altri tipi si potrebbe usare MIMEBase (non richiesto ora)
                    pass
        
        async with aiosmtplib.SMTP(
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            use_tls=True
        ) as smtp:
            await smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            await smtp.send_message(message)
            
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")

# ============= Guardian Service =============

class GuardianService:
    """Servizio per l'analisi Guardian delle conversazioni"""
    
    def __init__(self):
        self.risk_threshold = 0.851  # Soglia di rischio per generare alert
        
    def analyze_conversation(self, conversation: Conversation, db: Session) -> dict:
        """
        Analizza una conversazione per determinare il rischio di recensione negativa
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
            else:
                # Se il rischio è basso, rimuovi il flag di alert (nel caso di ri-analisi)
                conversation.guardian_alert_triggered = False
                logger.info(f"✅ Rischio basso per conversazione {conversation.id}: {analysis_result['risk_score']:.3f}")
            
            db.commit()
            
            logger.info(f"Analisi Guardian completata per conversazione {conversation.id}: rischio {analysis_result['risk_score']:.3f}")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Errore durante l'analisi Guardian della conversazione {conversation.id}: {e}")
            db.rollback()
            raise
    
    def _prepare_conversation_text(self, user_messages: list) -> str:
        """Prepara il testo della conversazione per l'analisi"""
        conversation_lines = []
        
        for i, message in enumerate(user_messages, 1):
            timestamp = message.timestamp.strftime("%H:%M")
            conversation_lines.append(f"Messaggio {i} ({timestamp}): {message.content}")
        
        return "\n\n".join(conversation_lines)
    
    def _analyze_with_openai(self, conversation_text: str) -> dict:
        """Analizza il testo della conversazione con OpenAI"""
        try:
            prompt = f"""
Analizza la seguente conversazione di un ospite con un chatbot di una struttura ricettiva e determina il rischio di recensione negativa.

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

Rispondi SOLO con un JSON valido:
{{
    "risk_score": 0.123,
    "sentiment_score": -0.456,
    "confidence_score": 0.789,
    "analysis_details": {{
        "reasoning": "Spiegazione dettagliata del punteggio di rischio",
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
    
    def create_alert(self, conversation: Conversation, analysis_result: dict, db: Session) -> GuardianAlert:
        """Crea un alert Guardian per una conversazione problematica"""
        try:
            # Recupera il proprietario del chatbot
            chatbot = db.query(Chatbot).filter(Chatbot.id == conversation.chatbot_id).first()
            if not chatbot:
                raise ValueError(f"Chatbot non trovato per conversazione {conversation.id}")
            
            # Recupera l'utente per ottenere la lingua
            user = db.query(User).filter(User.id == chatbot.user_id).first()
            user_language = user.language if user else "it"
            
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
            message = self._create_alert_message(conversation, analysis_result, user_language)
            suggested_action = self._create_suggested_action(analysis_result, user_language)
            conversation_summary = self._create_conversation_summary(conversation, db, user_language)
            
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
    
    def _create_alert_message(self, conversation: Conversation, analysis_result: dict, language: str = "it") -> str:
        """Crea il messaggio dell'alert"""
        risk_score = analysis_result['risk_score']
        sentiment_score = analysis_result['sentiment_score']
        
        if language == "en":
            if risk_score >= 0.95:
                urgency = "CRITICAL"
                emoji = "🚨"
            elif risk_score >= 0.90:
                urgency = "HIGH"
                emoji = "⚠️"
            else:
                urgency = "MEDIUM"
                emoji = "⚠️"
            
            return f"{emoji} ALERT {urgency}: Unsatisfied guest detected in conversation #{conversation.id}. Negative review risk: {risk_score:.1%}. Sentiment: {sentiment_score:.2f}"
        else:  # it
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
    
    def _create_suggested_action(self, analysis_result: dict, language: str = "it") -> str:
        """Crea l'azione suggerita basata sull'analisi"""
        key_issues = analysis_result.get('analysis_details', {}).get('key_issues', [])
        
        if language == "en":
            if not key_issues:
                return "Contact the guest immediately to verify satisfaction and offer assistance."
            
            if 'wifi' in ' '.join(key_issues).lower():
                return "WiFi issue detected. Send correct credentials immediately or contact technician."
            elif 'pulizia' in ' '.join(key_issues).lower() or 'cleaning' in ' '.join(key_issues).lower():
                return "Cleaning issue detected. Organize immediate extra cleaning."
            elif 'rumore' in ' '.join(key_issues).lower() or 'noise' in ' '.join(key_issues).lower():
                return "Noise issue detected. Contact neighbors or offer room change."
            else:
                return "Contact the guest immediately to resolve the issue and offer compensation."
        else:  # it
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
    
    def _create_conversation_summary(self, conversation: Conversation, db: Session, language: str = "it") -> str:
        """Crea un riassunto della conversazione"""
        messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.timestamp).limit(10).all()  # Ultimi 10 messaggi
        
        if not messages:
            return "No messages available" if language == "en" else "Nessun messaggio disponibile"
        
        summary_lines = []
        for msg in messages:
            if language == "en":
                role = "Guest" if msg.role == 'user' else "Chatbot"
            else:
                role = "Ospite" if msg.role == 'user' else "Chatbot"
            time = msg.timestamp.strftime("%H:%M")
            content = msg.content[:100] + "..." if len(msg.content) > 100 else msg.content
            summary_lines.append(f"[{time}] {role}: {content}")
        
        return "\n".join(summary_lines)
    
    def send_alert_email(self, alert: GuardianAlert, db: Session) -> bool:
        """Invia email di alert al proprietario del chatbot"""
        try:
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
            import asyncio
            asyncio.create_task(send_email(
                to_email=user.email,
                subject=f"🚨 ALERT GUARDIAN: Ospite insoddisfatto rilevato",
                body=email_body
            ))
            
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
        """Risolve un alert Guardian"""
        try:
            alert = db.query(GuardianAlert).filter(GuardianAlert.id == alert_id).first()
            if not alert:
                logger.error(f"Alert {alert_id} non trovato")
                return False
            
            alert.is_resolved = True
            alert.resolved_at = datetime.utcnow()
            alert.resolved_by = resolved_by
            
            db.commit()
            
            logger.info(f"Alert {alert_id} risolto da {resolved_by}")
            return True
            
        except Exception as e:
            logger.error(f"Errore nella risoluzione dell'alert {alert_id}: {e}")
            db.rollback()
            return False
    
    def get_guardian_statistics(self, user_id: int, db: Session) -> dict:
        """Ottiene le statistiche Guardian per un utente"""
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

# Istanza globale del servizio Guardian
guardian_service = GuardianService()

def generate_qr_code(url: str, icon_data: bytes = None) -> str:
    """Genera QR code e ritorna come base64"""
    import io  # Importa io all'inizio della funzione
    
    qr = qrcode.QRCode(version=1, box_size=15, border=5)  # Aumentato box_size per QR code più grande
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Se c'è un'icona, aggiungila al centro del QR code (solo se il QR code è abbastanza grande)
    if icon_data:
        try:
            from PIL import Image, ImageDraw
            
            # Carica l'icona
            icon_img = Image.open(io.BytesIO(icon_data))
            
            # Ridimensiona l'icona in modo più conservativo (1/6 del QR code invece di 1/4)
            qr_size = img.size[0]
            icon_size = qr_size // 6  # Più piccolo per non interferire con la scansione
            
            # Solo se il QR code è abbastanza grande (almeno 200px)
            if qr_size >= 200:
                icon_img = icon_img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
                
                # Crea un'icona circolare con bordo bianco per separarla dal QR code
                mask = Image.new('L', (icon_size, icon_size), 0)
                mask_draw = ImageDraw.Draw(mask)
                mask_draw.ellipse((0, 0, icon_size, icon_size), fill=255)
                
                # Applica la maschera circolare
                icon_img.putalpha(mask)
                
                # Crea un bordo bianco intorno all'icona per separarla dal QR code
                border_size = 4
                icon_with_border = Image.new('RGBA', (icon_size + border_size * 2, icon_size + border_size * 2), (255, 255, 255, 255))
                icon_with_border.paste(icon_img, (border_size, border_size), icon_img)
                
                # Posiziona l'icona al centro del QR code
                qr_with_icon = img.copy()
                x = (qr_size - icon_size - border_size * 2) // 2
                y = (qr_size - icon_size - border_size * 2) // 2
                qr_with_icon.paste(icon_with_border, (x, y), icon_with_border)
                
                img = qr_with_icon
            else:
                print(f"QR code troppo piccolo ({qr_size}px) per aggiungere icona senza compromettere la scansione")
        except Exception as e:
            print(f"Errore nell'aggiunta dell'icona al QR code: {e}")
            # Se c'è un errore, usa il QR code normale
    
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    
    return base64.b64encode(buf.getvalue()).decode()

async def create_openai_assistant(chatbot_data: dict) -> str:
    """Crea un OpenAI Assistant con le informazioni fornite"""
    try:
        client = get_openai_client()
        
        # Prepara le istruzioni per l'assistant
        instructions = f"""
        Sei l'assistente virtuale per {chatbot_data['property_name']}.
        
        INFORMAZIONI SULLA PROPRIETÀ:
        - Nome: {chatbot_data['property_name']}
        - Tipo: {chatbot_data['property_type']}
        - Indirizzo: {chatbot_data['property_address']}, {chatbot_data['property_city']}
        - Descrizione: {chatbot_data['property_description']}
        - Check-in: {chatbot_data['check_in_time']}
        - Check-out: {chatbot_data['check_out_time']}
        - Regole della casa: {chatbot_data['house_rules']}
        - Servizi: {', '.join(chatbot_data['amenities'])}
        
        INFORMAZIONI SULLA ZONA:
        - Descrizione quartiere: {chatbot_data['neighborhood_description']}
        - Trasporti: {chatbot_data['transportation_info']}
        - Shopping: {chatbot_data['shopping_info']}
        - Parcheggio: {chatbot_data['parking_info']}
        
        INFORMAZIONI PRATICHE:
        - WiFi: {json.dumps(chatbot_data['wifi_info'])}
        - Istruzioni speciali: {chatbot_data['special_instructions']}
        - Contatti emergenza: {json.dumps(chatbot_data['emergency_contacts'])}
        
        ATTRAZIONI VICINE:
        {json.dumps(chatbot_data['nearby_attractions'])}
        
        RISTORANTI E BAR:
        {json.dumps(chatbot_data['restaurants_bars'])}
        
        FAQ:
        {json.dumps(chatbot_data['faq'])}
        
        Messaggio di benvenuto: {chatbot_data['welcome_message']}
        
        IMPORTANTE: Rispondi sempre nella stessa lingua in cui l'utente ti scrive. Se l'utente scrive in italiano, rispondi in italiano. Se scrive in inglese, rispondi in inglese. Se scrive in spagnolo, rispondi in spagnolo, e così via per qualsiasi lingua.
        Sii cordiale, utile e fornisci informazioni accurate basate sui dati forniti.
        Se non hai informazioni su qualcosa, suggerisci di contattare direttamente l'host.
        """
        
        # Crea l'assistant (Assistants v2)
        assistant = client.beta.assistants.create(
            name=f"HostGPT - {chatbot_data['property_name']}",
            instructions=instructions,
            model="gpt-4o-mini",
            tools=[],
            extra_headers={"OpenAI-Beta": "assistants=v2"}
        )
        
        return assistant.id
        
    except Exception as e:
        logger.error(f"Error creating OpenAI assistant: {e}")
        raise HTTPException(status_code=500, detail="Failed to create assistant")

def build_assistant_instructions_from_model(chatbot: Chatbot) -> str:
    """Costruisce le system instructions complete a partire dal modello Chatbot (SQLAlchemy)."""
    try:
        amenities = chatbot.amenities or []
        wifi_info = chatbot.wifi_info or {}
        emergency_contacts = chatbot.emergency_contacts or []
        nearby_attractions = chatbot.nearby_attractions or []
        restaurants_bars = chatbot.restaurants_bars or []
        faq = chatbot.faq or []
        return f"""
        Sei l'assistente virtuale per {chatbot.property_name}.

        INFORMAZIONI SULLA PROPRIETÀ:
        - Nome: {chatbot.property_name}
        - Tipo: {chatbot.property_type}
        - Indirizzo: {chatbot.property_address}, {chatbot.property_city}
        - Descrizione: {chatbot.property_description}
        - Check-in: {chatbot.check_in_time}
        - Check-out: {chatbot.check_out_time}
        - Regole della casa: {chatbot.house_rules}
        - Servizi: {', '.join(amenities)}

        INFORMAZIONI SULLA ZONA:
        - Descrizione quartiere: {chatbot.neighborhood_description}
        - Trasporti: {chatbot.transportation_info}
        - Shopping: {chatbot.shopping_info}
        - Parcheggio: {chatbot.parking_info}

        INFORMAZIONI PRATICHE:
        - WiFi: {json.dumps(wifi_info, ensure_ascii=False)}
        - Istruzioni speciali: {chatbot.special_instructions}
        - Contatti emergenza: {json.dumps(emergency_contacts, ensure_ascii=False)}

        ATTRAZIONI VICINE:
        {json.dumps(nearby_attractions, ensure_ascii=False)}

        RISTORANTI E BAR:
        {json.dumps(restaurants_bars, ensure_ascii=False)}

        FAQ:
        {json.dumps(faq, ensure_ascii=False)}

        Messaggio di benvenuto: {chatbot.welcome_message}

        IMPORTANTE: Rispondi sempre nella stessa lingua in cui l'utente ti scrive. Se l'utente scrive in italiano, rispondi in italiano. Se scrive in inglese, rispondi in inglese. Se scrive in spagnolo, rispondi in spagnolo, e così via per qualsiasi lingua.
        Sii cordiale, utile e fornisci informazioni accurate basate sui dati forniti.
        Se non hai informazioni su qualcosa, suggerisci di contattare direttamente l'host.
        """
    except Exception as e:
        logger.error(f"Error building instructions: {e}")
        return ""

# ============= API Endpoints =============

@app.get("/")
async def root():
    return {"message": "HostGPT API v1.0", "status": "active"}

# --- Authentication ---

@app.post("/api/auth/register")
async def register(user: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Registrazione nuovo utente"""
    # Verifica se l'email esiste già
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    # Crea nuovo utente
    hashed_password = get_password_hash(user.password)
    verification_token = secrets.token_urlsafe(32)
    
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        is_verified=False,
        verification_token=verification_token,  # Aggiungeremo questo campo al modello
        wants_free_trial=user.wants_free_trial,  # Traccia se vuole il free trial
        language=user.language or "it"  # Salva la lingua preferita dell'utente
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Invia email di verifica
    verification_link = f"{settings.BACKEND_URL}/api/auth/verify-email?token={verification_token}"
    
    
    # Scegli il template in base al tipo di registrazione e lingua
    user_language = user.language or "it"
    if user.wants_free_trial:
        email_body = create_free_trial_welcome_email_simple(user.full_name, user_language)
        email_subject = "Welcome to your free trial - HostGPT" if user_language == "en" else "Benvenuto nel tuo periodo di prova gratuito - HostGPT"
    else:
        email_body = create_welcome_email_simple(user.full_name, verification_link, user_language)
        email_subject = "Confirm your email - HostGPT" if user_language == "en" else "Conferma la tua email - HostGPT"
    
    background_tasks.add_task(send_email, user.email, email_subject, email_body)
    
    return {"message": "Registrazione completata. Controlla la tua email per verificare l'account e attivare l'abbonamento."}

@app.get("/api/auth/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verifica email e gestisce free trial o checkout in base alla scelta dell'utente"""
    from fastapi.responses import RedirectResponse
    
    # Normalizza il token (rimuove spazi accidentali da email client)
    token = (token or "").strip()

    # Trova utente con questo token
    user = db.query(User).filter(User.verification_token == token).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Token di verifica non valido")
    
    # Verifica l'email
    user.is_verified = True
    user.verification_token = None
    
    # Crea token di accesso per l'utente
    access_token = create_access_token(data={"sub": user.email})
    
    if user.wants_free_trial:
        # Avvia automaticamente il free trial
        now = datetime.utcnow()
        free_trial_end = now + timedelta(days=14)
        
        user.subscription_status = 'free_trial'
        user.free_trial_start_date = now
        user.free_trial_end_date = free_trial_end
        user.free_trial_messages_used = 0
        user.free_trial_converted = False
        user.messages_used = 0
        user.messages_reset_date = now
        
        db.commit()
        
        # Invia email di benvenuto free trial
        email_body = create_free_trial_welcome_email_simple(user.full_name or user.email, user.language or "it")
        background_tasks = BackgroundTasks()
        background_tasks.add_task(
            send_email, 
            user.email, 
"🎉 Welcome to your HostGPT free trial!" if (user.language or "it") == "en" else "🎉 Benvenuto nel tuo periodo di prova gratuito HostGPT!", 
            email_body
        )
        
        # Reindirizza alla dashboard
        dashboard_url = f"{settings.FRONTEND_URL}/login?token={access_token}&free_trial_started=true"
        return RedirectResponse(url=dashboard_url)
    else:
        # Marca come se il free trial fosse finito (utente vuole pagare subito)
        user.subscription_status = 'inactive'
        user.free_trial_converted = False  # Non ha mai fatto free trial
        db.commit()
        
        # Reindirizza al checkout
        checkout_url = f"{settings.FRONTEND_URL}/checkout?token={access_token}"
        return RedirectResponse(url=checkout_url)

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """Login utente"""
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non corretti",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not db_user.is_active:
        raise HTTPException(status_code=400, detail="Account non attivo")
    
    if not db_user.is_verified:
        raise HTTPException(status_code=400, detail="Email non verificata. Controlla la tua email per il link di verifica.")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Ottieni informazioni utente corrente"""
    # Controlla se deve essere resettato il conteggio mensile
    if current_user.messages_reset_date:
        if datetime.utcnow() > current_user.messages_reset_date + timedelta(days=30):
            current_user.messages_used = 0
            current_user.messages_reset_date = datetime.utcnow()
            # Salva nel DB
            db = next(get_db())
            db.commit()
    
    # Calcola messaggi rimanenti in base al tipo di abbonamento
    if current_user.subscription_status == 'free_trial':
        messages_remaining = get_free_trial_messages_remaining(current_user)
        messages_limit = current_user.free_trial_messages_limit
        messages_used = current_user.free_trial_messages_used
    else:
        messages_remaining = current_user.messages_limit - current_user.messages_used
        messages_limit = current_user.messages_limit
        messages_used = current_user.messages_used
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "subscription_status": current_user.subscription_status,
        "subscription_end_date": current_user.subscription_end_date,
        "wants_free_trial": current_user.wants_free_trial,
        "messages_limit": messages_limit,
        "messages_used": messages_used,
        "messages_remaining": messages_remaining,
        "is_verified": current_user.is_verified,
        "guardian_subscription_status": current_user.guardian_subscription_status,
        "guardian_subscription_end_date": current_user.guardian_subscription_end_date,
        # Free trial info
        "free_trial_start_date": current_user.free_trial_start_date.isoformat() if current_user.free_trial_start_date else None,
        "free_trial_end_date": current_user.free_trial_end_date.isoformat() if current_user.free_trial_end_date else None,
        "free_trial_messages_limit": current_user.free_trial_messages_limit,
        "free_trial_messages_used": current_user.free_trial_messages_used,
        "free_trial_converted": current_user.free_trial_converted,
        "is_free_trial_active": is_free_trial_active(current_user),
        # Referral code info
        "referral_code_used": current_user.referral_code.code if current_user.referral_code else None,
        "referral_code_used_at": current_user.referral_code_used_at.isoformat() if current_user.referral_code_used_at else None
    }

# ============= Referral Code Management =============

def validate_referral_code(code: str, db: Session) -> Tuple[bool, Optional[ReferralCode], str]:
    """
    Valida un referral code e restituisce (is_valid, referral_code_object, message)
    """
    try:
        # Cerca il referral code nel database
        referral_code = db.query(ReferralCode).filter(
            ReferralCode.code == code.upper(),
            ReferralCode.is_active == True
        ).first()
        
        if not referral_code:
            return False, None, "Codice referral non valido o non attivo"
        
        # Verifica se il codice è scaduto
        if referral_code.expires_at and referral_code.expires_at < datetime.utcnow():
            return False, None, "Codice referral scaduto"
        
        # Verifica se il codice ha raggiunto il limite massimo di utilizzi
        if referral_code.max_uses and referral_code.current_uses >= referral_code.max_uses:
            return False, None, "Codice referral esaurito"
        
        return True, referral_code, "Codice referral valido"
        
    except Exception as e:
        logger.error(f"Errore nella validazione del referral code: {e}")
        return False, None, "Errore nella validazione del codice"

@app.post("/api/referral/validate", response_model=ReferralCodeResponse)
async def validate_referral_code_endpoint(
    request: ReferralCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Valida un referral code e restituisce i dettagli"""
    try:
        is_valid, referral_code, message = validate_referral_code(request.code, db)
        
        if is_valid:
            return ReferralCodeResponse(
                valid=True,
                bonus_messages=referral_code.bonus_messages,
                message=f"Codice valido! Riceverai {referral_code.bonus_messages} messaggi bonus al mese"
            )
        else:
            return ReferralCodeResponse(
                valid=False,
                bonus_messages=0,
                message=message
            )
            
    except Exception as e:
        logger.error(f"Errore nella validazione del referral code: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")

@app.get("/api/referral/stats")
async def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni statistiche sui referral codes (solo per admin)"""
    try:
        # Per ora, permettiamo a tutti gli utenti di vedere le statistiche
        # In futuro potresti aggiungere un campo is_admin al modello User
        
        # Conta tutti i referral codes
        total_codes = db.query(ReferralCode).count()
        active_codes = db.query(ReferralCode).filter(ReferralCode.is_active == True).count()
        
        # Conta utenti che hanno usato referral codes
        users_with_referral = db.query(User).filter(User.referral_code_id.isnot(None)).count()
        
        # Top referral codes per utilizzo
        top_codes = db.query(ReferralCode).order_by(ReferralCode.current_uses.desc()).limit(5).all()
        
        return {
            "total_codes": total_codes,
            "active_codes": active_codes,
            "users_with_referral": users_with_referral,
            "top_codes": [
                {
                    "code": code.code,
                    "description": code.description,
                    "bonus_messages": code.bonus_messages,
                    "current_uses": code.current_uses,
                    "max_uses": code.max_uses,
                    "is_active": code.is_active
                }
                for code in top_codes
            ]
        }
        
    except Exception as e:
        logger.error(f"Errore nel recupero delle statistiche referral: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")

# --- Subscription/Payment ---

@app.post("/api/subscription/create-checkout")
async def create_checkout_session(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Crea sessione di checkout Stripe - Solo abbonamento mensile a 29€"""
    try:
        logger.info(f"Starting checkout process for user {current_user.id} (email: {current_user.email})")
        logger.info(f"User subscription status: {current_user.subscription_status}")
        logger.info(f"User is verified: {current_user.is_verified}")
        
        # Validazione configurazione STRIPE_PRICE_ID
        if not settings.STRIPE_PRICE_ID or not settings.STRIPE_PRICE_ID.startswith("price_") or "your-monthly" in settings.STRIPE_PRICE_ID:
            logger.error("Invalid STRIPE_PRICE_ID configuration")
            raise HTTPException(
                status_code=400,
                detail=(
                    "Configurazione Stripe mancante o non valida: STRIPE_PRICE_ID. "
                    "Imposta un Price ID ricorrente (mensile 29€) nelle variabili d'ambiente del backend."
                ),
            )

        # Verifica che l'utente abbia verificato l'email
        if not current_user.is_verified:
            logger.error(f"User {current_user.id} is not verified")
            raise HTTPException(status_code=400, detail="Devi verificare la tua email prima di sottoscrivere un abbonamento")
        
        # Se ha già un abbonamento attivo (non in fase di cancellazione), non permettere un nuovo checkout
        if current_user.subscription_status == 'active':
            logger.error(f"User {current_user.id} already has active subscription")
            raise HTTPException(status_code=400, detail="Hai già un abbonamento attivo")
        
        # Se è in free trial, marca come convertito
        if current_user.subscription_status == 'free_trial':
            current_user.free_trial_converted = True
            db.commit()
            logger.info(f"User {current_user.id} converting from free trial to paid subscription")
        
        # Se l'abbonamento è completamente cancellato, assicurati che tutti i campi dell'abbonamento siano resettati
        if current_user.subscription_status == 'cancelled' and current_user.stripe_subscription_id:
            logger.info(f"User {current_user.id} has cancelled status but still has subscription fields, resetting them")
            current_user.stripe_subscription_id = None
            current_user.subscription_end_date = None
            current_user.messages_used = 0
            current_user.messages_reset_date = None
            db.commit()
        
        # Se l'abbonamento è in fase di cancellazione, riattivalo automaticamente
        if current_user.subscription_status == 'cancelling':
            logger.info(f"User {current_user.id} has cancelling subscription, reactivating automatically")
            try:
                # Verifica che ci sia un subscription_id su Stripe
                if not current_user.stripe_subscription_id:
                    raise HTTPException(status_code=400, detail="Non è possibile riattivare l'abbonamento")
                
                # Riattiva l'abbonamento su Stripe
                stripe_subscription = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
                if not stripe_subscription.cancel_at_period_end:
                    raise HTTPException(status_code=400, detail="L'abbonamento non è in fase di cancellazione")
                
                reactivated_sub = stripe.Subscription.modify(
                    current_user.stripe_subscription_id,
                    cancel_at_period_end=False
                )
                
                # Aggiorna il database
                current_user.subscription_status = 'active'
                current_user.subscription_end_date = datetime.utcfromtimestamp(reactivated_sub.current_period_end)
                db.commit()
                
                logger.info(f"User {current_user.id} subscription reactivated successfully")
                return {"status": "reactivated", "message": "Abbonamento riattivato con successo"}
                
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error reactivating subscription: {e}")
                raise HTTPException(status_code=500, detail="Errore nella riattivazione dell'abbonamento")
            except Exception as e:
                logger.error(f"Error reactivating subscription: {e}")
                raise HTTPException(status_code=500, detail="Errore nella riattivazione dell'abbonamento")
        
        # Crea o recupera customer Stripe
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name
            )
            current_user.stripe_customer_id = customer.id
            db.commit()

        # Controlla se ci sono sottoscrizioni attive o in corso
        if current_user.stripe_customer_id:
            logger.info(f"Checking Stripe subscriptions for customer {current_user.stripe_customer_id}")
            subs = stripe.Subscription.list(customer=current_user.stripe_customer_id, status='all', limit=1)
            if subs.data:
                sub = subs.data[0]
                logger.info(f"Found subscription: {sub.id}, status: {sub.status}")
                # Controlla se la sottoscrizione è in fase di annullamento (cancel_at_period_end=True)
                is_canceling = sub.cancel_at_period_end if hasattr(sub, 'cancel_at_period_end') else False
                logger.info(f"Subscription is canceling: {is_canceling}")
                
                # Se la sottoscrizione è attiva ma in fase di annullamento, non permettere nuovo checkout
                if sub.status == 'active' and is_canceling:
                    logger.info(f"User {current_user.id} has subscription canceling at period end, cannot create new subscription")
                    raise HTTPException(
                        status_code=400,
                        detail="Hai un abbonamento in fase di annullamento. Devi attendere la fine del periodo corrente prima di creare un nuovo abbonamento."
                    )
                
                # Se la sottoscrizione è attiva e non in fase di cancellazione, non permettere nuovo checkout
                elif sub.status in ['active', 'trialing'] and not is_canceling:
                    logger.error(f"User {current_user.id} has active subscription that is not canceling")
                    raise HTTPException(
                        status_code=400,
                        detail="Hai già un abbonamento attivo. Non è necessario crearne un altro."
                    )
                
                # Se la sottoscrizione è in altri stati problematici, non permettere nuovo checkout
                elif sub.status in ['incomplete', 'incomplete_expired', 'past_due', 'unpaid']:
                    logger.error(f"User {current_user.id} has subscription with payment issues: {sub.status}")
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Hai una sottoscrizione con problemi di pagamento. "
                            "Risolvi il problema di pagamento prima di creare un nuovo abbonamento."
                        ),
                    )
                
                # Se la sottoscrizione è completamente cancellata, permette la creazione di uno nuovo
                elif sub.status == 'canceled':
                    logger.info(f"User {current_user.id} has canceled subscription, allowing new subscription creation")
                    # Resetta tutti i campi dell'abbonamento per permettere la creazione di un nuovo abbonamento
                    if current_user.stripe_subscription_id:
                        current_user.stripe_subscription_id = None
                        current_user.subscription_status = 'cancelled'
                        current_user.subscription_end_date = None
                        current_user.messages_used = 0
                        current_user.messages_reset_date = None
                        db.commit()
                        logger.info(f"User {current_user.id} all subscription fields reset for new subscription")
            else:
                logger.info(f"No subscriptions found for customer {current_user.stripe_customer_id}")
        
        # Crea Payment Intent per checkout personalizzato
        logger.info(f"Creating payment intent for user {current_user.id}")
        
        payment_intent = stripe.PaymentIntent.create(
            amount=2900,  # 29€ in centesimi
            currency='eur',
            customer=current_user.stripe_customer_id,
            metadata={
                'user_id': str(current_user.id),
                'subscription_type': 'hostgpt',
                'price_id': settings.STRIPE_PRICE_ID
            },
            automatic_payment_methods={
                'enabled': True,
            },
        )
        
        logger.info(f"Payment intent created successfully: {payment_intent.id}")
        return {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id
        }
        
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/subscription/confirm-payment")
async def confirm_payment(
    request: ConfirmPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment_intent_id = request.payment_intent_id
    """Conferma il pagamento e crea la sottoscrizione"""
    try:
        logger.info(f"Confirming payment for user {current_user.id}, payment_intent_id: {payment_intent_id}")
        
        # Recupera il Payment Intent
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if payment_intent.status != 'succeeded':
            raise HTTPException(status_code=400, detail="Il pagamento non è stato completato con successo")
        
        # Verifica che il Payment Intent appartenga all'utente
        if payment_intent.customer != current_user.stripe_customer_id:
            raise HTTPException(status_code=400, detail="Payment Intent non valido")
        
        # Crea la sottoscrizione usando il price_id dal metadata
        price_id = payment_intent.metadata.get('price_id')
        if not price_id:
            raise HTTPException(status_code=400, detail="Price ID non trovato nel Payment Intent")
        
        subscription = stripe.Subscription.create(
            customer=current_user.stripe_customer_id,
            items=[{'price': price_id}],
            payment_behavior='default_incomplete',
            payment_settings={'save_default_payment_method': 'on_subscription'},
            expand=['latest_invoice.payment_intent'],
        )
        
        # Gestione referral code
        bonus_messages = 0
        if request.referral_code:
            is_valid, referral_code_obj, message = validate_referral_code(request.referral_code, db)
            if is_valid and not current_user.referral_code_id:  # Solo se non ha già usato un referral code
                # Applica il bonus
                bonus_messages = referral_code_obj.bonus_messages
                current_user.referral_code_id = referral_code_obj.id
                current_user.referral_code_used_at = datetime.utcnow()
                
                # Incrementa il contatore di utilizzi del referral code
                referral_code_obj.current_uses += 1
                
                logger.info(f"Referral code {request.referral_code} applied to user {current_user.id}, bonus: {bonus_messages} messages")
            else:
                logger.warning(f"Invalid referral code {request.referral_code} for user {current_user.id}: {message}")
        
        # Aggiorna il database
        current_user.stripe_subscription_id = subscription.id
        current_user.subscription_status = 'active'
        current_user.subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)
        current_user.messages_used = 0
        current_user.messages_reset_date = datetime.utcnow()
        
        # Applica il bonus dei messaggi se presente
        if bonus_messages > 0:
            current_user.messages_limit += bonus_messages
            logger.info(f"Applied {bonus_messages} bonus messages to user {current_user.id}. New limit: {current_user.messages_limit}")
        
        db.commit()
        
        logger.info(f"Subscription created successfully for user {current_user.id}: {subscription.id}")
        
        # Invia email di conferma abbonamento
        try:
            email_body = create_subscription_confirmation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
            background_tasks = BackgroundTasks()
            background_tasks.add_task(
                send_email, 
                current_user.email, 
    "🎉 HostGPT Subscription activated successfully!" if (current_user.language or "it") == "en" else "🎉 Abbonamento HostGPT attivato con successo!", 
                email_body
            )
            logger.info(f"Subscription confirmation email sent to {current_user.email}")
        except Exception as e:
            logger.error(f"Failed to send subscription confirmation email: {e}")
        
        response_message = "Abbonamento attivato con successo"
        if bonus_messages > 0:
            response_message += f" + {bonus_messages} messaggi bonus!"
        
        return {
            "status": "success",
            "subscription_id": subscription.id,
            "message": response_message,
            "bonus_messages": bonus_messages
        }
        
    except Exception as e:
        logger.error(f"Error confirming payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/guardian/confirm-payment")
async def confirm_guardian_payment(
    request: ConfirmPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment_intent_id = request.payment_intent_id
    """Conferma il pagamento Guardian e crea la sottoscrizione"""
    try:
        logger.info(f"Confirming Guardian payment for user {current_user.id}, payment_intent_id: {payment_intent_id}")
        
        # Recupera il Payment Intent
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if payment_intent.status != 'succeeded':
            raise HTTPException(status_code=400, detail="Il pagamento non è stato completato con successo")
        
        # Verifica che il Payment Intent appartenga all'utente
        if payment_intent.customer != current_user.stripe_customer_id:
            raise HTTPException(status_code=400, detail="Payment Intent non valido")
        
        # Crea la sottoscrizione usando il price_id dal metadata
        price_id = payment_intent.metadata.get('price_id')
        if not price_id:
            raise HTTPException(status_code=400, detail="Price ID non trovato nel Payment Intent")
        
        subscription = stripe.Subscription.create(
            customer=current_user.stripe_customer_id,
            items=[{'price': price_id}],
            payment_behavior='default_incomplete',
            payment_settings={'save_default_payment_method': 'on_subscription'},
            expand=['latest_invoice.payment_intent'],
        )
        
        # Aggiorna il database
        current_user.guardian_stripe_subscription_id = subscription.id
        current_user.guardian_subscription_status = 'active'
        current_user.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)
        db.commit()
        
        logger.info(f"Guardian subscription created successfully for user {current_user.id}: {subscription.id}")
        
        # Invia email di conferma abbonamento Guardian
        try:
            email_body = create_guardian_subscription_confirmation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
            background_tasks = BackgroundTasks()
            background_tasks.add_task(
                send_email, 
                current_user.email, 
    "🛡️ Guardian Subscription activated successfully!" if (current_user.language or "it") == "en" else "🛡️ Abbonamento Guardian attivato con successo!", 
                email_body
            )
            logger.info(f"Guardian subscription confirmation email sent to {current_user.email}")
        except Exception as e:
            logger.error(f"Failed to send Guardian subscription confirmation email: {e}")
        
        return {
            "status": "success",
            "subscription_id": subscription.id,
            "message": "Abbonamento Guardian attivato con successo"
        }
        
    except Exception as e:
        logger.error(f"Error confirming Guardian payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/subscription/confirm-combined-payment")
async def confirm_combined_payment(
    request: ConfirmPaymentRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment_intent_id = request.payment_intent_id
    """Conferma il pagamento combinato e crea entrambe le sottoscrizioni"""
    try:
        logger.info(f"Confirming combined payment for user {current_user.id}, payment_intent_id: {payment_intent_id}")
        
        # Recupera il Payment Intent
        logger.info("Retrieving payment intent...")
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        logger.info(f"Payment intent status: {payment_intent.status}")
        
        if payment_intent.status != 'succeeded':
            raise HTTPException(status_code=400, detail="Il pagamento non è stato completato con successo")
        
        # Verifica che il Payment Intent appartenga all'utente
        logger.info(f"Payment intent customer: {payment_intent.customer}, user customer: {current_user.stripe_customer_id}")
        if payment_intent.customer != current_user.stripe_customer_id:
            raise HTTPException(status_code=400, detail="Payment Intent non valido")
        
        # Crea entrambe le sottoscrizioni
        logger.info(f"Payment intent metadata: {payment_intent.metadata}")
        hostgpt_price_id = payment_intent.metadata.get('hostgpt_price_id')
        guardian_price_id = payment_intent.metadata.get('guardian_price_id')
        
        logger.info(f"HostGPT price ID: {hostgpt_price_id}")
        logger.info(f"Guardian price ID: {guardian_price_id}")
        
        if not hostgpt_price_id or not guardian_price_id:
            raise HTTPException(status_code=400, detail="Price IDs non trovati nel Payment Intent")
        
        # Crea sottoscrizione HostGPT
        logger.info("Creating HostGPT subscription...")
        hostgpt_subscription = stripe.Subscription.create(
            customer=current_user.stripe_customer_id,
            items=[{'price': hostgpt_price_id}],
            payment_settings={'save_default_payment_method': 'on_subscription'},
            expand=['latest_invoice.payment_intent'],
        )
        logger.info(f"HostGPT subscription created: {hostgpt_subscription.id}")
        
        # Crea sottoscrizione Guardian
        logger.info("Creating Guardian subscription...")
        guardian_subscription = stripe.Subscription.create(
            customer=current_user.stripe_customer_id,
            items=[{'price': guardian_price_id}],
            payment_settings={'save_default_payment_method': 'on_subscription'},
            expand=['latest_invoice.payment_intent'],
        )
        logger.info(f"Guardian subscription created: {guardian_subscription.id}")
        
        # Gestione referral code
        bonus_messages = 0
        if request.referral_code:
            is_valid, referral_code_obj, message = validate_referral_code(request.referral_code, db)
            if is_valid and not current_user.referral_code_id:  # Solo se non ha già usato un referral code
                # Applica il bonus
                bonus_messages = referral_code_obj.bonus_messages
                current_user.referral_code_id = referral_code_obj.id
                current_user.referral_code_used_at = datetime.utcnow()
                
                # Incrementa il contatore di utilizzi del referral code
                referral_code_obj.current_uses += 1
                
                logger.info(f"Referral code {request.referral_code} applied to user {current_user.id}, bonus: {bonus_messages} messages")
            else:
                logger.warning(f"Invalid referral code {request.referral_code} for user {current_user.id}: {message}")
        
        # Aggiorna il database
        logger.info("Updating database...")
        current_user.stripe_subscription_id = hostgpt_subscription.id
        current_user.subscription_status = 'active'
        current_user.subscription_end_date = datetime.utcfromtimestamp(hostgpt_subscription.current_period_end)
        
        current_user.guardian_stripe_subscription_id = guardian_subscription.id
        current_user.guardian_subscription_status = 'active'
        current_user.guardian_subscription_end_date = datetime.utcfromtimestamp(guardian_subscription.current_period_end)
        
        # Applica il bonus dei messaggi se presente
        if bonus_messages > 0:
            current_user.messages_limit += bonus_messages
            logger.info(f"Applied {bonus_messages} bonus messages to user {current_user.id}. New limit: {current_user.messages_limit}")
        
        logger.info("Committing to database...")
        db.commit()
        logger.info("Database updated successfully")
        
        logger.info(f"Combined subscriptions created successfully for user {current_user.id}")
        
        # Invia email di conferma per il pacchetto completo
        try:
            email_body = create_combined_subscription_confirmation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
            background_tasks.add_task(
                send_email, 
                current_user.email, 
    "🎉 Complete Package activated successfully!" if (current_user.language or "it") == "en" else "🎉 Pacchetto Completo attivato con successo!", 
                email_body
            )
            logger.info(f"Combined subscription confirmation email sent to {current_user.email}")
        except Exception as e:
            logger.error(f"Failed to send combined subscription confirmation email: {e}")
        
        response_message = "Pacchetto completo attivato con successo"
        if bonus_messages > 0:
            response_message += f" + {bonus_messages} messaggi bonus!"
        
        return {
            "status": "success",
            "hostgpt_subscription_id": hostgpt_subscription.id,
            "guardian_subscription_id": guardian_subscription.id,
            "message": response_message,
            "bonus_messages": bonus_messages
        }
        
    except Exception as e:
        logger.error(f"Error confirming combined payment: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/subscription/create-combined-checkout")
async def create_combined_checkout_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea checkout per il pacchetto combinato HostGPT + Guardian"""
    try:
        logger.info(f"Creating combined checkout for user {current_user.id}")
        
        # Verifica se l'utente è in free trial
        if current_user.subscription_status == 'free_trial':
            return await create_combined_checkout_session(current_user, db)
        else:
            raise HTTPException(status_code=400, detail="Checkout combinato disponibile solo per utenti in free trial")
            
    except Exception as e:
        logger.error(f"Error creating combined checkout: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/subscription/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook per eventi Stripe"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Errore nella verifica del webhook: {e}")
        raise HTTPException(status_code=400, detail="Webhook verification failed")
    
    # Gestisci eventi
    try:
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            
            # Aggiorna utente
            user = db.query(User).filter(
                User.stripe_customer_id == session['customer']
            ).first()
        
            if user:
                # Verifica se è un checkout combinato (HostGPT + Guardian)
                subscription_type = session.get('metadata', {}).get('subscription_type', 'hostgpt')
                
                if subscription_type == 'combined':
                    # Gestisci checkout combinato
                    logger.info(f"Processing combined checkout for user {user.id}")
                    
                    # Recupera le sottoscrizioni create
                    subscriptions = stripe.Subscription.list(
                        customer=session['customer'],
                        limit=2,
                        created={'gte': int((datetime.utcnow() - timedelta(minutes=5)).timestamp())}
                    )
                    
                    # Trova le sottoscrizioni per HostGPT e Guardian
                    hostgpt_subscription = None
                    guardian_subscription = None
                    
                    for sub in subscriptions.data:
                        if sub.items.data[0].price.id == settings.STRIPE_PRICE_ID:
                            hostgpt_subscription = sub
                        elif sub.items.data[0].price.id == "price_1RzYheClR9LCJ8qE7OMhCmlH":
                            guardian_subscription = sub
                    
                    # Aggiorna HostGPT subscription
                    if hostgpt_subscription:
                        user.stripe_subscription_id = hostgpt_subscription.id
                        user.subscription_status = 'active'
                        user.subscription_end_date = datetime.utcfromtimestamp(hostgpt_subscription.current_period_end)
                        user.free_trial_converted = True
                        logger.info(f"User {user.id} HostGPT subscription activated: {hostgpt_subscription.id}")
                    
                    # Aggiorna Guardian subscription
                    if guardian_subscription:
                        user.guardian_stripe_subscription_id = guardian_subscription.id
                        user.guardian_subscription_status = 'active'
                        user.guardian_subscription_end_date = datetime.utcfromtimestamp(guardian_subscription.current_period_end)
                        logger.info(f"User {user.id} Guardian subscription activated: {guardian_subscription.id}")
                    
                    db.commit()
                    logger.info(f"User {user.id} combined subscription completed successfully")
                    
                else:
                    # Gestisci checkout singolo (comportamento esistente)
                    subscription = stripe.Subscription.retrieve(session['subscription'])
                    
                    if subscription_type == 'guardian':
                        # Gestisci abbonamento Guardian
                        user.guardian_stripe_subscription_id = session['subscription']
                        user.guardian_subscription_status = 'active'
                        # Controlla se current_period_end esiste prima di usarlo
                        if hasattr(subscription, 'current_period_end'):
                            user.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)
                        else:
                            logger.warning(f"current_period_end non trovato per subscription {session['subscription']}")
                        logger.info(f"User {user.id} Guardian subscription updated with new subscription_id: {session['subscription']}")
                    else:
                        # Gestisci abbonamento HostGPT (default)
                        user.stripe_subscription_id = session['subscription']
                        user.subscription_status = 'active'
                        # Controlla se current_period_end esiste prima di usarlo
                        if hasattr(subscription, 'current_period_end'):
                            user.subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)
                        else:
                            logger.warning(f"current_period_end non trovato per subscription {session['subscription']}")
                        
                        # Reset messaggi solo se è una nuova sottoscrizione (non riattivazione)
                        if not subscription.cancel_at_period_end:
                            user.messages_used = 0
                            user.messages_reset_date = datetime.utcnow()
                        
                        logger.info(f"User {user.id} HostGPT subscription updated with new subscription_id: {session['subscription']}")
                    
                    db.commit()
        
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            
            # Controlla se è un abbonamento Guardian o HostGPT
            user_guardian = db.query(User).filter(
                User.guardian_stripe_subscription_id == subscription['id']
            ).first()
            
            user_hostgpt = db.query(User).filter(
                User.stripe_subscription_id == subscription['id']
            ).first()
            
            if user_guardian:
                # Gestisci l'evento Guardian deletion qui (webhook unificato)
                logger.info(f"WEBHOOK UNIFICATO: User {user_guardian.id} Guardian subscription deleted")
                user_guardian.guardian_subscription_status = 'cancelled'
                user_guardian.guardian_stripe_subscription_id = None
                user_guardian.guardian_subscription_end_date = None
                db.commit()
                logger.info(f"WEBHOOK UNIFICATO: User {user_guardian.id} Guardian subscription completely cancelled")
            
            if user_hostgpt:
                user_hostgpt.subscription_status = 'cancelled'
                user_hostgpt.stripe_subscription_id = None
                user_hostgpt.subscription_end_date = None
                user_hostgpt.messages_used = 0
                user_hostgpt.messages_reset_date = None
                db.commit()
                logger.info(f"User {user_hostgpt.id} HostGPT subscription completely cancelled")
        
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            
            # Controlla se è un abbonamento Guardian o HostGPT
            user_guardian = db.query(User).filter(
                User.guardian_stripe_subscription_id == subscription['id']
            ).first()
            
            user_hostgpt = db.query(User).filter(
                User.stripe_subscription_id == subscription['id']
            ).first()
            
            if user_guardian:
                # Gestisci l'evento Guardian qui (webhook unificato)
                logger.info(f"WEBHOOK UNIFICATO: User {user_guardian.id} Guardian subscription updated - status: {subscription['status']}, cancel_at_period_end: {subscription.get('cancel_at_period_end', False)}")
                
                # Aggiorna lo stato dell'abbonamento Guardian nel database
                if subscription['status'] == 'active':
                    # Se l'abbonamento è attivo ma ha cancel_at_period_end=True, è in fase di cancellazione
                    if subscription.get('cancel_at_period_end', False):
                        user_guardian.guardian_subscription_status = 'cancelling'
                        logger.info(f"WEBHOOK UNIFICATO: User {user_guardian.id} Guardian subscription marked as cancelling (cancel_at_period_end=True)")
                    else:
                        user_guardian.guardian_subscription_status = 'active'
                        logger.info(f"WEBHOOK UNIFICATO: User {user_guardian.id} Guardian subscription reactivated (cancel_at_period_end=False)")
                    
                    # Controlla se current_period_end esiste prima di usarlo
                    if 'current_period_end' in subscription:
                        user_guardian.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription['current_period_end'])
                    else:
                        logger.warning(f"current_period_end non trovato per subscription {subscription['id']}")
                elif subscription['status'] == 'canceled':
                    user_guardian.guardian_subscription_status = 'cancelled'
                    user_guardian.guardian_stripe_subscription_id = None
                    user_guardian.guardian_subscription_end_date = None
                    logger.info(f"WEBHOOK UNIFICATO: User {user_guardian.id} Guardian subscription completely cancelled")
                
                db.commit()
                logger.info(f"WEBHOOK UNIFICATO: User {user_guardian.id} Guardian subscription status updated to: {subscription['status']}")
            
            if user_hostgpt:
                logger.info(f"WEBHOOK HOSTGPT: User {user_hostgpt.id} HostGPT subscription updated - status: {subscription['status']}, cancel_at_period_end: {subscription.get('cancel_at_period_end', False)}")
                # Aggiorna lo stato dell'abbonamento HostGPT nel database
                if subscription['status'] == 'active':
                    # Se l'abbonamento è attivo ma ha cancel_at_period_end=True, è in fase di cancellazione
                    if subscription.get('cancel_at_period_end', False):
                        user_hostgpt.subscription_status = 'cancelling'
                        logger.info(f"WEBHOOK HOSTGPT: User {user_hostgpt.id} HostGPT subscription marked as cancelling (cancel_at_period_end=True)")
                    else:
                        user_hostgpt.subscription_status = 'active'
                        logger.info(f"WEBHOOK HOSTGPT: User {user_hostgpt.id} HostGPT subscription reactivated (cancel_at_period_end=False)")
                    
                    # Controlla se current_period_end esiste prima di usarlo
                    if 'current_period_end' in subscription:
                        user_hostgpt.subscription_end_date = datetime.utcfromtimestamp(subscription['current_period_end'])
                    else:
                        logger.warning(f"current_period_end non trovato per subscription {subscription['id']}")
                elif subscription['status'] == 'canceled':
                    user_hostgpt.subscription_status = 'cancelled'
                    user_hostgpt.stripe_subscription_id = None
                    user_hostgpt.subscription_end_date = None
                    user_hostgpt.messages_used = 0
                    user_hostgpt.messages_reset_date = None
                    logger.info(f"WEBHOOK HOSTGPT: User {user_hostgpt.id} HostGPT subscription completely cancelled")
                
                db.commit()
                logger.info(f"WEBHOOK HOSTGPT: User {user_hostgpt.id} HostGPT subscription status updated to: {subscription['status']}")
    
    except Exception as e:
        logger.error(f"Errore nell'elaborazione del webhook Stripe: {e}")
        logger.error(f"Event type: {event.get('type', 'unknown')}")
        logger.error(f"Event data: {event.get('data', {})}")
        raise HTTPException(status_code=500, detail="Errore nell'elaborazione del webhook")
    
    return {"status": "success"}

@app.post("/api/subscription/confirm")
async def confirm_subscription(
    payload: SubscriptionConfirm, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Conferma lato backend lo stato dell'abbonamento dopo il redirect di successo da Stripe."""
    try:
        session_id = payload.session_id
        # Se viene passato un session_id, recupera i dettagli della sessione
        if session_id:
            session = stripe.checkout.Session.retrieve(session_id)
            if session and session.get('customer') == current_user.stripe_customer_id and session.get('subscription'):
                current_user.stripe_subscription_id = session['subscription']
                current_user.subscription_status = 'active'
                current_user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
                current_user.messages_used = 0
                current_user.messages_reset_date = datetime.utcnow()
                db.commit()
                
                # Invia email di attivazione abbonamento
                email_body = create_subscription_activation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
                background_tasks.add_task(
                    send_email, 
                    current_user.email, 
"🎉 HostGPT Subscription Activated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento HostGPT Attivato!", 
                    email_body
                )
                
                return {"status": "active"}

        # Fallback: controlla lo stato su Stripe dal customer
        if current_user.stripe_customer_id:
            subs = stripe.Subscription.list(customer=current_user.stripe_customer_id, status='all', limit=1)
            if subs.data:
                sub = subs.data[0]
                # Verifica che l'abbonamento sia attivo e non in fase di cancellazione
                if sub.status in ['active', 'trialing'] and not sub.cancel_at_period_end:
                    current_user.stripe_subscription_id = sub.id
                    current_user.subscription_status = 'active'
                    current_user.subscription_end_date = datetime.utcfromtimestamp(sub.current_period_end)
                    current_user.messages_used = 0
                    current_user.messages_reset_date = datetime.utcnow()
                    db.commit()
                    
                    # Invia email di attivazione abbonamento (solo se non già inviata)
                    if not is_subscription_active(current_user.subscription_status):
                        email_body = create_subscription_activation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
                        background_tasks.add_task(
                            send_email, 
                            current_user.email, 
        "🎉 HostGPT Subscription Activated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento HostGPT Attivato!", 
                            email_body
                        )
                    
                    return {"status": "active"}
                elif sub.status in ['active', 'trialing'] and sub.cancel_at_period_end:
                    # L'abbonamento è attivo ma in fase di cancellazione
                    logger.info(f"User {current_user.id} has subscription in cancellation phase")
                    return {"status": "cancelling"}

        return {"status": current_user.subscription_status or 'inactive'}
    except Exception as e:
        logger.error(f"Subscription confirm error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/subscription/reactivate")
async def reactivate_subscription(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Riattiva l'abbonamento dell'utente se è in fase di cancellazione"""
    try:
        # Verifica che l'utente abbia un abbonamento in fase di cancellazione
        if not current_user.stripe_subscription_id:
            raise HTTPException(
                status_code=400,
                detail="Non hai un abbonamento da riattivare"
            )
        
        # Verifica lo stato dell'abbonamento su Stripe
        try:
            stripe_subscription = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
            
            # Verifica se l'abbonamento è in fase di cancellazione
            if not stripe_subscription.cancel_at_period_end:
                raise HTTPException(
                    status_code=400,
                    detail="Il tuo abbonamento non è in fase di cancellazione"
                )
            
            # Riattiva l'abbonamento
            reactivated_sub = stripe.Subscription.modify(
                current_user.stripe_subscription_id,
                cancel_at_period_end=False
            )
            
            # Aggiorna il database
            current_user.subscription_status = 'active'
            current_user.subscription_end_date = datetime.utcfromtimestamp(reactivated_sub.current_period_end)
            db.commit()
            
            # Invia email di conferma riattivazione
            email_body = create_subscription_activation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
            background_tasks.add_task(
                send_email, 
                current_user.email, 
"🎉 HostGPT Subscription Reactivated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento HostGPT Riattivato!", 
                email_body
            )
            
            logger.info(f"User {current_user.id} subscription reactivated successfully")
            return {"status": "reactivated", "message": "Abbonamento riattivato con successo"}
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error reactivating subscription: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Errore nella riattivazione dell'abbonamento: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Subscription reactivate error: {e}")
        raise HTTPException(status_code=500, detail="Errore durante la riattivazione dell'abbonamento")

@app.get("/api/subscription/status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni lo stato dettagliato dell'abbonamento dell'utente"""
    try:
        subscription_info = {
            "status": current_user.subscription_status,
            "end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
            "is_canceling": False,
            "can_reactivate": False
        }
        
        # Se c'è un subscription_id su Stripe, verifica lo stato dettagliato
        if current_user.stripe_subscription_id:
            try:
                stripe_subscription = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
                subscription_info["is_canceling"] = stripe_subscription.cancel_at_period_end
                subscription_info["can_reactivate"] = (
                    stripe_subscription.status == 'active' and 
                    stripe_subscription.cancel_at_period_end
                )
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error retrieving subscription status: {e}")
                # Se non riusciamo a recuperare da Stripe, usiamo i dati del database
                pass
        
        return subscription_info
        
    except Exception as e:
        logger.error(f"Error getting subscription status: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recupero dello stato dell'abbonamento")

@app.post("/api/subscription/cancel")
async def cancel_subscription(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Annulla l'abbonamento dell'utente"""
    logger.info(f"=== CANCELLATION REQUEST STARTED ===")
    logger.info(f"User {current_user.id} ({current_user.email}) requesting subscription cancellation")
    logger.info(f"Current subscription status: {current_user.subscription_status}")
    logger.info(f"Current stripe_subscription_id: {current_user.stripe_subscription_id}")
    logger.info(f"Current stripe_customer_id: {current_user.stripe_customer_id}")
    
    try:
        # Verifica che l'utente abbia un abbonamento attivo
        if not is_subscription_active(current_user.subscription_status):
            raise HTTPException(
                status_code=400,
                detail="Non hai un abbonamento attivo da annullare"
            )
        
        # Se c'è un subscription_id su Stripe, cancella anche lì PRIMA di aggiornare il DB
        logger.info(f"User {current_user.id} stripe_subscription_id: {current_user.stripe_subscription_id}")
        
        # Se non c'è stripe_subscription_id nel database, prova a cercarlo su Stripe
        stripe_subscription_id = current_user.stripe_subscription_id
        if not stripe_subscription_id and current_user.stripe_customer_id:
            try:
                logger.info(f"User {current_user.id} has no stripe_subscription_id in DB, searching on Stripe...")
                # Cerca tutte le sottoscrizioni (non solo quelle 'active') per trovare anche quelle in fase di cancellazione
                subs = stripe.Subscription.list(customer=current_user.stripe_customer_id, status='all', limit=10)
                if subs.data:
                    # Trova la sottoscrizione più recente che non sia in fase di cancellazione
                    active_sub = None
                    for sub in subs.data:
                        if sub.status == 'active' and not sub.cancel_at_period_end:
                            active_sub = sub
                            break
                    
                    if active_sub:
                        stripe_subscription_id = active_sub.id
                        logger.info(f"Found active subscription on Stripe: {stripe_subscription_id}")
                        # Aggiorna il database con l'ID trovato
                        current_user.stripe_subscription_id = stripe_subscription_id
                        db.commit()
                    else:
                        logger.info(f"No active (non-canceling) subscription found on Stripe for user {current_user.id}")
            except Exception as e:
                logger.error(f"Error searching for subscription on Stripe: {e}")
        
        if stripe_subscription_id:
            try:
                # Prima recupera l'abbonamento per verificare lo stato attuale
                current_stripe_sub = stripe.Subscription.retrieve(stripe_subscription_id)
                logger.info(f"Current Stripe subscription status: {current_stripe_sub.status}, cancel_at_period_end: {current_stripe_sub.cancel_at_period_end}")
                
                # Verifica se l'abbonamento è già in fase di cancellazione
                if current_stripe_sub.cancel_at_period_end:
                    logger.info(f"Subscription {stripe_subscription_id} is already being canceled")
                    # Aggiorna il database per riflettere lo stato corretto
                    current_user.subscription_status = 'cancelling'  # Stato per abbonamento in fase di annullamento
                    current_user.subscription_end_date = datetime.utcfromtimestamp(current_stripe_sub.current_period_end)
                    db.commit()
                    logger.info(f"User {current_user.id} subscription already cancelling, database updated")
                    return {
                        "status": "already_cancelling", 
                        "message": "Il tuo abbonamento è già in fase di annullamento."
                    }
                
                # Chiama Stripe per annullare l'abbonamento
                stripe_subscription = stripe.Subscription.modify(
                    stripe_subscription_id,
                    cancel_at_period_end=True  # Cancella alla fine del periodo corrente
                )
                logger.info(f"Stripe subscription {stripe_subscription_id} marked for cancellation")
                logger.info(f"Updated Stripe subscription status: {stripe_subscription.status}, cancel_at_period_end: {stripe_subscription.cancel_at_period_end}")
                
                # Verifica che la cancellazione sia stata accettata da Stripe
                if stripe_subscription.status not in ['active', 'canceled']:
                    raise HTTPException(
                        status_code=500,
                        detail="Errore nella cancellazione dell'abbonamento su Stripe"
                    )
                    
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error cancelling subscription: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Errore nella cancellazione dell'abbonamento: {str(e)}"
                )
            except Exception as e:
                logger.error(f"Unexpected error cancelling Stripe subscription: {e}")
                raise HTTPException(
                    status_code=500,
                    detail="Errore imprevisto nella cancellazione dell'abbonamento"
                )
        else:
            logger.warning(f"User {current_user.id} has no stripe_subscription_id and no active subscription found on Stripe")
            # Se non c'è abbonamento su Stripe, aggiorna solo il database
            current_user.subscription_status = 'cancelled'
            db.commit()
            return {
                "status": "cancelled", 
                "message": "Abbonamento annullato con successo."
            }
        
        # SOLO DOPO aver ricevuto conferma da Stripe, aggiorna il database
        # Imposta lo stato come 'cancelling' per indicare che è in fase di annullamento
        current_user.subscription_status = 'cancelling'  # Stato per abbonamento in fase di annullamento
        current_user.subscription_end_date = datetime.utcfromtimestamp(stripe_subscription.current_period_end)
        # I dati rimangono nel database come richiesto
        db.commit()
        
        # Invia email di annullamento abbonamento
        end_date = current_user.subscription_end_date.strftime("%d/%m/%Y") if current_user.subscription_end_date else "fine del periodo corrente"
        email_body = create_subscription_cancellation_email_simple(
            current_user.full_name or current_user.email,
            end_date,
            current_user.language or "it"
        )
        background_tasks.add_task(
            send_email, 
            current_user.email, 
"😔 HostGPT Subscription Cancelled" if (current_user.language or "it") == "en" else "😔 Abbonamento HostGPT Annullato", 
            email_body
        )
        
        logger.info(f"User {current_user.id} subscription cancelled successfully")
        logger.info(f"=== CANCELLATION REQUEST COMPLETED ===")
        return {
            "status": "cancelling", 
            "message": "Abbonamento annullato con successo. Il tuo abbonamento rimarrà attivo fino alla fine del periodo corrente."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Subscription cancel error: {e}")
        raise HTTPException(status_code=500, detail="Errore durante l'annullamento dell'abbonamento")

# --- Chatbot Management ---

@app.post("/api/chatbots/create")
async def create_chatbot(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    # Form data
    name: str = Form(...),
    property_name: str = Form(...),
    property_type: str = Form(...),
    property_address: str = Form(...),
    property_city: str = Form(...),
    property_description: str = Form(...),
    check_in_time: str = Form(...),
    check_out_time: str = Form(...),
    house_rules: str = Form(...),
    amenities: str = Form(...),  # JSON string
    neighborhood_description: str = Form(...),
    nearby_attractions: str = Form(...),  # JSON string
    transportation_info: str = Form(...),
    restaurants_bars: str = Form(...),  # JSON string
    shopping_info: str = Form(...),
    emergency_contacts: str = Form(...),  # JSON string
    wifi_info: str = Form(...),  # JSON string
    parking_info: str = Form(...),
    special_instructions: str = Form(...),
    faq: str = Form(...),  # JSON string
    welcome_message: str = Form(...),
    # File upload
    icon: Optional[UploadFile] = File(None)
):
    """Crea un nuovo chatbot"""
    # Verifica abbonamento attivo
    if not is_subscription_active(current_user.subscription_status):
        raise HTTPException(
            status_code=403, 
            detail="Devi attivare un abbonamento per creare un chatbot. Abbonamento mensile: 29€/mese"
        )
    # Impone limite di 1 chatbot per utente
    existing_count = db.query(Chatbot).filter(Chatbot.user_id == current_user.id).count()
    if existing_count >= 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "Ogni account può avere un solo chatbot. Se ti servono più chatbot perché gestisci più strutture, "
                "contattami su WhatsApp al 3391797616."
            )
        )
    
    # Valida e processa l'icona se fornita
    icon_data = None
    icon_filename = None
    icon_content_type = None
    
    if icon:
        # Verifica che sia un'immagine
        if not icon.content_type or not icon.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Il file deve essere un'immagine (PNG o JPG)")
        
        # Verifica dimensione (max 5MB)
        content = await icon.read()
        if len(content) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="L'immagine non può superare i 5MB")
        
        icon_data = content
        icon_filename = icon.filename
        icon_content_type = icon.content_type
    
    # Parsing dei dati JSON
    try:
        amenities_list = json.loads(amenities) if amenities else []
        nearby_attractions_list = json.loads(nearby_attractions) if nearby_attractions else []
        restaurants_bars_list = json.loads(restaurants_bars) if restaurants_bars else []
        emergency_contacts_list = json.loads(emergency_contacts) if emergency_contacts else []
        wifi_info_dict = json.loads(wifi_info) if wifi_info else {}
        faq_list = json.loads(faq) if faq else []
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Errore nel parsing dei dati JSON: {str(e)}")
    
    # Crea oggetto chatbot per OpenAI
    chatbot_data = {
        "name": name,
        "property_name": property_name,
        "property_type": property_type,
        "property_address": property_address,
        "property_city": property_city,
        "property_description": property_description,
        "check_in_time": check_in_time,
        "check_out_time": check_out_time,
        "house_rules": house_rules,
        "amenities": amenities_list,
        "neighborhood_description": neighborhood_description,
        "nearby_attractions": nearby_attractions_list,
        "transportation_info": transportation_info,
        "restaurants_bars": restaurants_bars_list,
        "shopping_info": shopping_info,
        "emergency_contacts": emergency_contacts_list,
        "wifi_info": wifi_info_dict,
        "parking_info": parking_info,
        "special_instructions": special_instructions,
        "faq": faq_list,
        "welcome_message": welcome_message
    }
    
    # Crea assistant OpenAI
    assistant_id = await create_openai_assistant(chatbot_data)
    
    # Salva chatbot nel database
    db_chatbot = Chatbot(
        user_id=current_user.id,
        assistant_id=assistant_id,
        name=name,
        property_name=property_name,
        property_type=property_type,
        property_address=property_address,
        property_city=property_city,
        property_description=property_description,
        check_in_time=check_in_time,
        check_out_time=check_out_time,
        house_rules=house_rules,
        amenities=amenities_list,
        neighborhood_description=neighborhood_description,
        nearby_attractions=nearby_attractions_list,
        transportation_info=transportation_info,
        restaurants_bars=restaurants_bars_list,
        shopping_info=shopping_info,
        emergency_contacts=emergency_contacts_list,
        wifi_info=wifi_info_dict,
        parking_info=parking_info,
        special_instructions=special_instructions,
        faq=faq_list,
        welcome_message=welcome_message,
        icon_data=icon_data,
        icon_filename=icon_filename,
        icon_content_type=icon_content_type,
        has_icon=icon_data is not None
    )
    db.add(db_chatbot)
    db.commit()
    db.refresh(db_chatbot)
    
    # Genera QR code
    chat_url = f"{settings.FRONTEND_URL}/chat/{db_chatbot.uuid}"
    qr_code = generate_qr_code(chat_url, icon_data)
    
    # Invia email di conferma
    email_body = create_chatbot_ready_email_simple(current_user.full_name or current_user.email, property_name, chat_url, current_user.language or "it")
    
    # Prepara allegato QR code
    try:
        qr_bytes = base64.b64decode(qr_code)
    except Exception:
        qr_bytes = None
    attachments = [("qrcode.png", qr_bytes, "image/png")] if qr_bytes else None
    
    background_tasks.add_task(send_email, current_user.email, "Il tuo Chatbot è pronto!", email_body, attachments)
    
    return {
        "id": db_chatbot.id,
        "uuid": db_chatbot.uuid,
        "name": db_chatbot.name,
        "chat_url": chat_url,
        "qr_code": qr_code,
        "assistant_id": assistant_id
    }

@app.get("/api/subscription/status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni lo stato dell'abbonamento dell'utente"""
    # Controlla se deve essere resettato il conteggio mensile
    if current_user.messages_reset_date:
        if datetime.utcnow() > current_user.messages_reset_date + timedelta(days=30):
            current_user.messages_used = 0
            current_user.messages_reset_date = datetime.utcnow()
            db.commit()
    
    return {
        "subscription_status": current_user.subscription_status,
        "subscription_end_date": current_user.subscription_end_date,
        "messages_limit": current_user.messages_limit,
        "messages_used": current_user.messages_used,
        "messages_remaining": current_user.messages_limit - current_user.messages_used,
        "messages_reset_date": current_user.messages_reset_date,
        "next_reset_date": current_user.messages_reset_date + timedelta(days=30) if current_user.messages_reset_date else None,
        "is_blocked": not is_subscription_active(current_user.subscription_status),
        "monthly_price": "29€"
    }

@app.get("/api/chatbots")
async def get_chatbots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni tutti i chatbot dell'utente"""
    # Blocca accesso senza abbonamento attivo
    if not is_subscription_active(current_user.subscription_status):
        raise HTTPException(
            status_code=403,
            detail="Abbonamento non attivo. Sottoscrivi un abbonamento mensile a 29€ per accedere alle funzionalità."
        )
    chatbots = db.query(Chatbot).filter(Chatbot.user_id == current_user.id).all()
    
    result = []
    for bot in chatbots:
        chat_url = f"{settings.FRONTEND_URL}/chat/{bot.uuid}"
        
        # Calcola statistiche reali dal database
        total_conversations = db.query(func.count(Conversation.id)).filter(
            Conversation.chatbot_id == bot.id
        ).scalar()
        
        total_messages = db.query(func.count(Message.id)).join(Conversation).filter(
            Conversation.chatbot_id == bot.id
        ).scalar()
        
        result.append({
            "id": bot.id,
            "uuid": bot.uuid,
            "name": bot.name,
            "property_name": bot.property_name,
            "property_city": bot.property_city,
            "chat_url": chat_url,
            "qr_code": generate_qr_code(chat_url, bot.icon_data),
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "is_active": bot.is_active,
            "created_at": bot.created_at,
            "has_icon": bot.has_icon
        })
    
    return result

@app.get("/api/chatbots/{chatbot_id}/icon")
async def get_chatbot_icon(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni l'icona del chatbot"""
    print(f"DEBUG: Cercando chatbot con ID: {chatbot_id} per user: {current_user.id}")
    
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        print(f"DEBUG: Chatbot non trovato per ID: {chatbot_id}")
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    print(f"DEBUG: Chatbot trovato: {chatbot.name}, has_icon_data: {chatbot.icon_data is not None}")
    
    if not chatbot.icon_data:
        print(f"DEBUG: Icona non trovata per chatbot: {chatbot.name}")
        raise HTTPException(status_code=404, detail="Icona non trovata")
    
    print(f"DEBUG: Icona trovata per chatbot: {chatbot.name}, content_type: {chatbot.icon_content_type}")
    
    from fastapi.responses import Response
    return Response(
        content=chatbot.icon_data,
        media_type=chatbot.icon_content_type or "image/png"
    )

@app.put("/api/chatbots/{chatbot_id}/icon")
async def update_chatbot_icon(
    chatbot_id: int,
    icon: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggiorna l'icona del chatbot"""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Valida il file
    if not icon.content_type or not icon.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Il file deve essere un'immagine (PNG o JPG)")
    
    # Verifica dimensione (max 5MB)
    content = await icon.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="L'immagine non può superare i 5MB")
    
    # Aggiorna l'icona
    chatbot.icon_data = content
    chatbot.icon_filename = icon.filename
    chatbot.icon_content_type = icon.content_type
    chatbot.has_icon = True
    
    db.commit()
    
    # Rigenera il QR code con la nuova icona
    chat_url = f"{settings.FRONTEND_URL}/chat/{chatbot.uuid}"
    new_qr_code = generate_qr_code(chat_url, content)
    
    return {
        "message": "Icona aggiornata con successo",
        "qr_code": new_qr_code
    }

@app.get("/api/chat/{uuid}/debug")
async def debug_chatbot_info(
    uuid: str,
    db: Session = Depends(get_db)
):
    """Debug endpoint per verificare le informazioni del chatbot"""
    print(f"DEBUG: Cercando chatbot con UUID: {uuid}")
    
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    
    if not chatbot:
        # Debug: mostra tutti gli UUID esistenti
        all_chatbots = db.query(Chatbot).all()
        return {
            "found": False,
            "uuid_requested": uuid,
            "existing_uuids": [bot.uuid for bot in all_chatbots],
            "total_chatbots": len(all_chatbots)
        }
    
    return {
        "found": True,
        "id": chatbot.id,
        "name": chatbot.name,
        "uuid": chatbot.uuid,
        "is_active": chatbot.is_active,
        "has_icon_data": chatbot.icon_data is not None,
        "has_icon_field": getattr(chatbot, 'has_icon', 'Campo non trovato'),
        "icon_filename": chatbot.icon_filename,
        "icon_content_type": chatbot.icon_content_type
    }

@app.get("/api/chat/{uuid}/icon")
async def get_chatbot_icon_public(
    uuid: str,
    db: Session = Depends(get_db)
):
    """Ottieni l'icona del chatbot per la chat pubblica"""
    print(f"DEBUG: Cercando chatbot con UUID: {uuid}")
    
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    
    if not chatbot:
        print(f"DEBUG: Chatbot non trovato per UUID: {uuid}")
        # Debug: mostra tutti gli UUID esistenti
        all_chatbots = db.query(Chatbot).all()
        print(f"DEBUG: UUID esistenti nel database: {[bot.uuid for bot in all_chatbots]}")
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    print(f"DEBUG: Chatbot trovato: {chatbot.name}, is_active: {chatbot.is_active}")
    print(f"DEBUG: Chatbot icon_data presente: {chatbot.icon_data is not None}")
    print(f"DEBUG: Chatbot has_icon: {getattr(chatbot, 'has_icon', 'Campo non trovato')}")
    
    if not chatbot.is_active:
        print(f"DEBUG: Chatbot non attivo: {chatbot.name}")
        raise HTTPException(status_code=404, detail="Chatbot non attivo")
    
    if not chatbot.icon_data:
        print(f"DEBUG: Icona non trovata per chatbot: {chatbot.name}")
        raise HTTPException(status_code=404, detail="Icona non trovata")
    
    print(f"DEBUG: Icona trovata per chatbot: {chatbot.name}, content_type: {chatbot.icon_content_type}")
    
    from fastapi.responses import Response
    return Response(
        content=chatbot.icon_data,
        media_type=chatbot.icon_content_type or "image/png"
    )

@app.get("/api/chatbots/{chatbot_id}")
async def get_chatbot(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni dettagli di un chatbot"""
    # Blocca accesso senza abbonamento attivo
    if not is_subscription_active(current_user.subscription_status):
        raise HTTPException(
            status_code=403,
            detail="Abbonamento non attivo. Sottoscrivi un abbonamento mensile a 29€ per accedere alle funzionalità."
        )
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Calcola statistiche reali dal database
    total_conversations = db.query(func.count(Conversation.id)).filter(
        Conversation.chatbot_id == chatbot.id
    ).scalar()
    
    total_messages = db.query(func.count(Message.id)).join(Conversation).filter(
        Conversation.chatbot_id == chatbot.id
    ).scalar()
    
    # Crea risposta senza dati binari
    response_data = {
        "id": chatbot.id,
        "user_id": chatbot.user_id,
        "assistant_id": chatbot.assistant_id,
        "uuid": chatbot.uuid,
        "name": chatbot.name,
        "property_name": chatbot.property_name,
        "property_type": chatbot.property_type,
        "property_address": chatbot.property_address,
        "property_city": chatbot.property_city,
        "property_description": chatbot.property_description,
        "check_in_time": chatbot.check_in_time,
        "check_out_time": chatbot.check_out_time,
        "house_rules": chatbot.house_rules,
        "amenities": chatbot.amenities,
        "neighborhood_description": chatbot.neighborhood_description,
        "nearby_attractions": chatbot.nearby_attractions,
        "transportation_info": chatbot.transportation_info,
        "restaurants_bars": chatbot.restaurants_bars,
        "shopping_info": chatbot.shopping_info,
        "emergency_contacts": chatbot.emergency_contacts,
        "wifi_info": chatbot.wifi_info,
        "parking_info": chatbot.parking_info,
        "special_instructions": chatbot.special_instructions,
        "faq": chatbot.faq,
        "welcome_message": chatbot.welcome_message,
        "icon_filename": chatbot.icon_filename,
        "icon_content_type": chatbot.icon_content_type,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "is_active": chatbot.is_active,
        "created_at": chatbot.created_at,
        "updated_at": chatbot.updated_at,
        "has_icon": chatbot.has_icon
    }
    
    return response_data

@app.put("/api/chatbots/{chatbot_id}")
async def update_chatbot(
    chatbot_id: int,
    update_data: ChatbotUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggiorna un chatbot"""
    # Blocca accesso senza abbonamento attivo
    if not is_subscription_active(current_user.subscription_status):
        raise HTTPException(
            status_code=403,
            detail="Abbonamento non attivo. Sottoscrivi un abbonamento mensile a 29€ per accedere alle funzionalità."
        )
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Aggiorna campi
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(chatbot, field, value)
    
    db.commit()
    
    # Aggiorna anche l'assistant OpenAI
    try:
        client = get_openai_client()
        # Ricostruisci le istruzioni con i dati aggiornati del chatbot
        new_instructions = build_assistant_instructions_from_model(chatbot)
        client.beta.assistants.update(
            chatbot.assistant_id,
            instructions=new_instructions,
            extra_headers={"OpenAI-Beta": "assistants=v2"}
        )
    except Exception as e:
        logger.error(f"Error updating OpenAI assistant: {e}")
    
    return {"message": "Chatbot aggiornato con successo"}

@app.delete("/api/chatbots/{chatbot_id}")
async def delete_chatbot(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elimina un chatbot"""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Elimina assistant OpenAI
    try:
        client = get_openai_client()
        client.beta.assistants.delete(chatbot.assistant_id, extra_headers={"OpenAI-Beta": "assistants=v2"})
    except Exception as e:
        logger.error(f"Error deleting OpenAI assistant: {e}")
    
    db.delete(chatbot)
    db.commit()
    
    return {"message": "Chatbot eliminato con successo"}

# --- Chat Endpoints (per il widget pubblico) ---

@app.get("/api/demochat/test")
async def demo_chat_test():
    """Test endpoint per verificare che demochat sia raggiungibile"""
    return {"status": "ok", "message": "Demo chat endpoint is working"}

class DemoMessageCreate(BaseModel):
    content: str
    thread_id: Optional[str] = None

@app.post("/api/demochat")
async def demo_chat(message: DemoMessageCreate):
    """
    Endpoint per la demo chat della landing page.
    Non richiede autenticazione e non salva messaggi nel database.
    """
    logger.info(f"🎯 Demo chat richiesta ricevuta: {message.content[:50]}...")
    try:
        client = get_openai_client()
        
        # Usa l'assistant ID fisso per la demo
        demo_assistant_id = "asst_L285y7tLbfulOmLXNh6mlUEE"
        
        # Crea o usa thread esistente
        if not message.thread_id:
            thread = client.beta.threads.create(extra_headers={"OpenAI-Beta": "assistants=v2"})
            thread_id = thread.id
        else:
            thread_id = message.thread_id
        
        # Invia messaggio a OpenAI
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=message.content,
            extra_headers={"OpenAI-Beta": "assistants=v2"}
        )
        
        # Esegui assistant
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=demo_assistant_id,
            extra_headers={"OpenAI-Beta": "assistants=v2"}
        )
        
        # Attendi risposta
        import time
        while run.status in ["queued", "in_progress"]:
            time.sleep(1)
            run = client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id,
                extra_headers={"OpenAI-Beta": "assistants=v2"}
            )
        
        # Gestisci eventuali errori nel run
        if run.status == "failed":
            logger.error(f"Demo chat run failed: {run.last_error}")
            raise HTTPException(status_code=500, detail="Errore nell'elaborazione della risposta")
        
        # Ottieni risposta
        messages = client.beta.threads.messages.list(thread_id=thread_id, extra_headers={"OpenAI-Beta": "assistants=v2"})
        assistant_message = messages.data[0].content[0].text.value
        
        return {
            "message": assistant_message,
            "thread_id": thread_id
        }
        
    except Exception as e:
        logger.error(f"Error in demo chat: {e}")
        raise HTTPException(status_code=500, detail="Errore nel processare il messaggio demo")

@app.get("/api/chat/{uuid}/info")
async def get_chat_info(uuid: str, db: Session = Depends(get_db)):
    """Ottieni informazioni base del chatbot per il widget"""
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    
    if not chatbot or not chatbot.is_active:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    return {
        "name": chatbot.name,
        "property_name": chatbot.property_name,
        "welcome_message": chatbot.welcome_message,
        "has_icon": chatbot.has_icon,
        "id": chatbot.id
    }

@app.get("/api/demo/info")
async def get_demo_info(db: Session = Depends(get_db)):
    """Ottieni informazioni del chatbot demo per la landing page"""
    # UUID fisso del chatbot demo
    demo_uuid = "5e2665c8-e243-4df3-a9fd-8e0d1e4fedcc"
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == demo_uuid).first()
    
    if not chatbot:
        # Se il chatbot demo non esiste, restituisci info di default
        return {
            "name": "Assistente Demo",
            "property_name": "Casa Bella Vista",
            "welcome_message": "Ciao! Sono il tuo assistente virtuale per Casa Bella Vista. Come posso aiutarti?",
            "has_icon": False,
            "id": None
        }
    
    return {
        "name": chatbot.name,
        "property_name": chatbot.property_name,
        "welcome_message": chatbot.welcome_message,
        "has_icon": chatbot.has_icon,
        "id": chatbot.id
    }

@app.get("/api/demo/icon")
async def get_demo_icon(db: Session = Depends(get_db)):
    """Ottieni l'icona del chatbot demo per la landing page"""
    # UUID fisso del chatbot demo
    demo_uuid = "5e2665c8-e243-4df3-a9fd-8e0d1e4fedcc"
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == demo_uuid).first()
    
    if not chatbot or not chatbot.icon_data:
        raise HTTPException(status_code=404, detail="Icona demo non trovata")
    
    from fastapi.responses import Response
    return Response(
        content=chatbot.icon_data,
        media_type=chatbot.icon_content_type or "image/png"
    )

@app.post("/api/chat/{uuid}/message")
async def send_message(
    uuid: str,
    message: MessageCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Invia messaggio al chatbot"""
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    
    if not chatbot or not chatbot.is_active:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Ottieni il proprietario del chatbot
    owner = db.query(User).filter(User.id == chatbot.user_id).first()
    
    if not owner:
        raise HTTPException(status_code=404, detail="Proprietario del chatbot non trovato")
    
    # Verifica abbonamento attivo
    if not is_subscription_active(owner.subscription_status):
        raise HTTPException(
            status_code=403, 
            detail="Il proprietario di questo chatbot non ha un abbonamento attivo. Il servizio è temporaneamente non disponibile."
        )
    
    # Gestione free trial
    if owner.subscription_status == 'free_trial':
        # Verifica se il free trial è ancora attivo
        if not is_free_trial_active(owner):
            raise HTTPException(
                status_code=403,
                detail="Il periodo di prova gratuito è scaduto. Sottoscrivi un abbonamento per continuare a utilizzare il servizio."
            )
        
        # Verifica limite messaggi free trial
        if owner.free_trial_messages_used >= owner.free_trial_messages_limit:
            raise HTTPException(
                status_code=429,
                detail="Hai raggiunto il limite di 20 messaggi del periodo di prova gratuito. Sottoscrivi un abbonamento per continuare."
            )
    else:
        # Gestione abbonamento normale
        # Controlla se deve essere resettato il conteggio mensile
        if owner.messages_reset_date:
            if datetime.utcnow() > owner.messages_reset_date + timedelta(days=30):
                owner.messages_used = 0
                owner.messages_reset_date = datetime.utcnow()
                db.commit()
        
        # Verifica limite messaggi
        if owner.messages_used >= owner.messages_limit:
            raise HTTPException(
                status_code=429, 
                detail=f"Limite mensile di {owner.messages_limit} messaggi raggiunto. Il limite si resetta il {(owner.messages_reset_date + timedelta(days=30)).strftime('%d/%m/%Y')} se la data è definita."
            )
    
    try:
        client = get_openai_client()
        
        # Crea o recupera thread
        if not message.thread_id:
            thread = client.beta.threads.create(extra_headers={"OpenAI-Beta": "assistants=v2"})
            thread_id = thread.id
            
            # Crea nuova conversazione nel DB
            guest_identifier = request.client.host
            conversation = Conversation(
                chatbot_id=chatbot.id,
                thread_id=thread_id,
                guest_name=message.guest_name,
                guest_identifier=guest_identifier
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            is_new_conversation = True
        else:
            thread_id = message.thread_id
            conversation = db.query(Conversation).filter(
                Conversation.thread_id == thread_id
            ).first()
            is_new_conversation = False
        
        # Invia messaggio a OpenAI
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=message.content,
            extra_headers={"OpenAI-Beta": "assistants=v2"}
        )
        
        # Esegui assistant
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=chatbot.assistant_id,
            extra_headers={"OpenAI-Beta": "assistants=v2"}
        )
        
        # Attendi risposta
        import time
        while run.status in ["queued", "in_progress"]:
            time.sleep(1)
            run = client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id,
                extra_headers={"OpenAI-Beta": "assistants=v2"}
            )
        
        # Ottieni risposta
        messages = client.beta.threads.messages.list(thread_id=thread_id, extra_headers={"OpenAI-Beta": "assistants=v2"})
        assistant_message = messages.data[0].content[0].text.value
        
        # Salva messaggi nel DB
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=message.content
        )
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=assistant_message
        )
        db.add(user_msg)
        db.add(assistant_msg)
        
        # Aggiorna statistiche
        conversation.message_count += 2
        chatbot.total_messages += 2
        
        # Incrementa il contatore conversazioni se è una nuova conversazione
        if is_new_conversation:
            chatbot.total_conversations += 1
        
        # Incrementa il contatore messaggi dell'utente
        if owner.subscription_status == 'free_trial':
            owner.free_trial_messages_used += 1
        else:
            owner.messages_used += 1  # Contiamo solo i messaggi inviati dagli ospiti
        
        db.commit()
        
        # Analizza la conversazione con Guardian (in background)
        import asyncio
        asyncio.create_task(analyze_conversation_with_guardian(conversation.id, db))
        
        # Calcola messaggi rimanenti
        if owner.subscription_status == 'free_trial':
            messages_remaining = owner.free_trial_messages_limit - owner.free_trial_messages_used
        else:
            messages_remaining = owner.messages_limit - owner.messages_used
        
        return {
            "thread_id": thread_id,
            "message": assistant_message,
            "messages_remaining": messages_remaining
        }
        
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail="Errore nel processare il messaggio")



# --- Conversations & Analytics ---

@app.get("/api/chatbots/{chatbot_id}/conversations")
async def get_conversations(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni tutte le conversazioni di un chatbot"""
    # Blocca accesso senza abbonamento attivo
    if not is_subscription_active(current_user.subscription_status):
        raise HTTPException(
            status_code=403,
            detail="Abbonamento non attivo. Sottoscrivi un abbonamento mensile a 29€ per accedere alle funzionalità."
        )
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    conversations = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot_id
    ).order_by(Conversation.started_at.desc()).all()
    
    result = []
    for conv in conversations:
        result.append({
            "id": conv.id,
            "guest_name": conv.guest_name or "Ospite",
            "started_at": conv.started_at,
            "message_count": conv.message_count,
            "last_message": db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(Message.timestamp.desc()).first()
        })
    
    return result

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni tutti i messaggi di una conversazione"""
    # Verifica che la conversazione appartenga all'utente
    conversation = db.query(Conversation).join(Chatbot).filter(
        Conversation.id == conversation_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversazione non trovata")
    
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.timestamp).all()
    
    return messages

@app.get("/api/chatbots/{chatbot_id}/analytics")
async def get_analytics(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni statistiche del chatbot"""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Calcola statistiche
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # Ultime 30 giorni
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    conversations_30d = db.query(func.count(Conversation.id)).filter(
        Conversation.chatbot_id == chatbot_id,
        Conversation.started_at >= thirty_days_ago
    ).scalar()
    
    messages_30d = db.query(func.count(Message.id)).join(Conversation).filter(
        Conversation.chatbot_id == chatbot_id,
        Message.timestamp >= thirty_days_ago
    ).scalar()
    
    # Statistiche per giorno
    daily_stats = db.query(
        func.date(Conversation.started_at).label('date'),
        func.count(Conversation.id).label('conversations')
    ).filter(
        Conversation.chatbot_id == chatbot_id,
        Conversation.started_at >= thirty_days_ago
    ).group_by(func.date(Conversation.started_at)).all()
    
    return {
        "total_conversations": chatbot.total_conversations,
        "total_messages": chatbot.total_messages,
        "conversations_30d": conversations_30d,
        "messages_30d": messages_30d,
        "daily_stats": [{"date": str(d.date), "conversations": d.conversations} for d in daily_stats],
        "avg_messages_per_conversation": chatbot.total_messages / max(chatbot.total_conversations, 1)
    }

# --- Knowledge Base ---

@app.get("/api/chatbots/{chatbot_id}/knowledge")
async def get_knowledge_base(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni knowledge base del chatbot"""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    knowledge = db.query(KnowledgeBase).filter(
        KnowledgeBase.chatbot_id == chatbot_id,
        KnowledgeBase.is_active == True
    ).all()
    
    return knowledge

# --- Guardian System ---

def is_guardian_active(guardian_status: str) -> bool:
    """Verifica se l'abbonamento Guardian è attivo"""
    return guardian_status in ['active', 'cancelling']

@app.get("/api/guardian/status")
async def get_guardian_status(current_user: User = Depends(get_current_user)):
    """Ottieni lo stato dell'abbonamento Guardian"""
    return {
        "guardian_subscription_status": current_user.guardian_subscription_status,
        "guardian_subscription_end_date": current_user.guardian_subscription_end_date,
        "is_active": is_guardian_active(current_user.guardian_subscription_status)
    }

@app.post("/api/guardian/subscribe")
async def subscribe_guardian(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sottoscrivi l'abbonamento Guardian (placeholder per ora)"""
    # Per ora non fa nulla come richiesto
    return {"message": "Funzionalità in sviluppo"}

@app.post("/api/guardian/create-checkout")
async def create_guardian_checkout_session(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Crea sessione di checkout Stripe per Guardian - 9€/mese"""
    try:
        logger.info(f"Starting Guardian checkout process for user {current_user.id} (email: {current_user.email})")
        logger.info(f"User Guardian subscription status: {current_user.guardian_subscription_status}")
        
        # Se l'utente è in free trial, reindirizza al checkout combinato
        if current_user.subscription_status == 'free_trial':
            return await create_combined_checkout_session(current_user, db)
        
        if not is_subscription_active(current_user.subscription_status):
            raise HTTPException(
                status_code=400,
                detail="Devi avere un abbonamento HostGPT attivo per sottoscrivere Guardian"
            )
        
        # Se ha già un abbonamento Guardian attivo, non permettere un nuovo checkout
        if current_user.guardian_subscription_status == 'active':
            logger.error(f"User {current_user.id} already has active Guardian subscription")
            raise HTTPException(status_code=400, detail="Hai già un abbonamento Guardian attivo")
        
        # Se l'abbonamento è completamente cancellato, assicurati che tutti i campi dell'abbonamento siano resettati
        if current_user.guardian_subscription_status == 'cancelled' and current_user.guardian_stripe_subscription_id:
            logger.info(f"User {current_user.id} has cancelled Guardian status but still has subscription fields, resetting them")
            current_user.guardian_stripe_subscription_id = None
            current_user.guardian_subscription_end_date = None
            db.commit()
        
        # Se l'abbonamento è in fase di cancellazione, riattivalo automaticamente
        if current_user.guardian_subscription_status == 'cancelling':
            logger.info(f"User {current_user.id} has cancelling Guardian subscription, reactivating automatically")
            try:
                # Verifica che ci sia un subscription_id su Stripe
                if not current_user.guardian_stripe_subscription_id:
                    raise HTTPException(status_code=400, detail="Non è possibile riattivare l'abbonamento Guardian")
                
                # Riattiva l'abbonamento su Stripe
                stripe_subscription = stripe.Subscription.retrieve(current_user.guardian_stripe_subscription_id)
                if not stripe_subscription.cancel_at_period_end:
                    raise HTTPException(status_code=400, detail="L'abbonamento Guardian non è in fase di cancellazione")
                
                reactivated_sub = stripe.Subscription.modify(
                    current_user.guardian_stripe_subscription_id,
                    cancel_at_period_end=False
                )
                
                # Aggiorna il database
                current_user.guardian_subscription_status = 'active'
                current_user.guardian_subscription_end_date = datetime.utcfromtimestamp(reactivated_sub.current_period_end)
                db.commit()
                
                logger.info(f"User {current_user.id} Guardian subscription reactivated successfully")
                return {"status": "reactivated", "message": "Abbonamento Guardian riattivato con successo"}
                
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error reactivating Guardian subscription: {e}")
                raise HTTPException(status_code=500, detail="Errore nella riattivazione dell'abbonamento Guardian")
            except Exception as e:
                logger.error(f"Error reactivating Guardian subscription: {e}")
                raise HTTPException(status_code=500, detail="Errore nella riattivazione dell'abbonamento Guardian")
        
        # Crea o recupera customer Stripe
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name
            )
            current_user.stripe_customer_id = customer.id
            db.commit()
        
        # Crea Payment Intent per checkout personalizzato Guardian
        logger.info(f"Creating Guardian payment intent for user {current_user.id}")
        
        # Price ID per Guardian - 9€/mese
        guardian_price_id = "price_1RzYheClR9LCJ8qE7OMhCmlH"
        
        payment_intent = stripe.PaymentIntent.create(
            amount=900,  # 9€ in centesimi
            currency='eur',
            customer=current_user.stripe_customer_id,
            metadata={
                'user_id': str(current_user.id),
                'subscription_type': 'guardian',
                'price_id': guardian_price_id
            },
            automatic_payment_methods={
                'enabled': True,
            },
        )
        
        logger.info(f"Guardian payment intent created successfully: {payment_intent.id}")
        return {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id
        }
        
    except Exception as e:
        logger.error(f"Guardian Stripe checkout error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def create_combined_checkout_session(current_user: User, db: Session):
    """Crea sessione di checkout Stripe combinata per HostGPT + Guardian per utenti in free trial"""
    try:
        logger.info(f"Creating combined checkout session for free trial user {current_user.id}")
        
        # Crea o recupera customer Stripe
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name
            )
            current_user.stripe_customer_id = customer.id
            db.commit()
        
        # Price IDs per HostGPT e Guardian
        hostgpt_price_id = settings.STRIPE_PRICE_ID  # 29€/mese
        guardian_price_id = "price_1RzYheClR9LCJ8qE7OMhCmlH"  # 9€/mese
        
        # Crea sessione checkout con entrambi i prodotti
        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[
                {
                    'price': hostgpt_price_id,
                    'quantity': 1,
                },
                {
                    'price': guardian_price_id,
                    'quantity': 1,
                }
            ],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/dashboard/guardian?subscription=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/dashboard/guardian?subscription=cancelled",
            metadata={
                'user_id': str(current_user.id),
                'subscription_type': 'combined',
                'free_trial_conversion': 'true'
            }
        )
        
        logger.info(f"Combined checkout session created successfully: {checkout_session.id}")
        # Per il checkout combinato, creiamo un Payment Intent personalizzato
        payment_intent = stripe.PaymentIntent.create(
            amount=3800,  # 38€ in centesimi
            currency='eur',
            customer=current_user.stripe_customer_id,
            metadata={
                'user_id': str(current_user.id),
                'subscription_type': 'combined',
                'free_trial_conversion': 'true',
                'hostgpt_price_id': settings.STRIPE_PRICE_ID,
                'guardian_price_id': guardian_price_id
            },
            automatic_payment_methods={
                'enabled': True,
            },
        )
        
        logger.info(f"Combined payment intent created successfully: {payment_intent.id}")
        return {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id,
            "is_combined": True
        }
        
    except Exception as e:
        logger.error(f"Combined checkout error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/guardian/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook per eventi Stripe per Guardian"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Gestisci eventi
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Aggiorna utente
        user = db.query(User).filter(
            User.stripe_customer_id == session['customer']
        ).first()
        
        if user:
            # Verifica se è un checkout combinato (HostGPT + Guardian)
            subscription_type = session.get('metadata', {}).get('subscription_type', 'guardian')
            
            if subscription_type == 'combined':
                # Gestisci checkout combinato
                logger.info(f"Processing combined checkout for user {user.id}")
                
                # Recupera le sottoscrizioni create
                subscriptions = stripe.Subscription.list(
                    customer=session['customer'],
                    limit=2,
                    created={'gte': int((datetime.utcnow() - timedelta(minutes=5)).timestamp())}
                )
                
                # Trova le sottoscrizioni per HostGPT e Guardian
                hostgpt_subscription = None
                guardian_subscription = None
                
                for sub in subscriptions.data:
                    if sub.items.data[0].price.id == settings.STRIPE_PRICE_ID:
                        hostgpt_subscription = sub
                    elif sub.items.data[0].price.id == "price_1RzYheClR9LCJ8qE7OMhCmlH":
                        guardian_subscription = sub
                
                # Aggiorna HostGPT subscription
                if hostgpt_subscription:
                    user.stripe_subscription_id = hostgpt_subscription.id
                    user.subscription_status = 'active'
                    user.subscription_end_date = datetime.utcfromtimestamp(hostgpt_subscription.current_period_end)
                    user.free_trial_converted = True
                    logger.info(f"User {user.id} HostGPT subscription activated: {hostgpt_subscription.id}")
                
                # Aggiorna Guardian subscription
                if guardian_subscription:
                    user.guardian_stripe_subscription_id = guardian_subscription.id
                    user.guardian_subscription_status = 'active'
                    user.guardian_subscription_end_date = datetime.utcfromtimestamp(guardian_subscription.current_period_end)
                    logger.info(f"User {user.id} Guardian subscription activated: {guardian_subscription.id}")
                
                db.commit()
                logger.info(f"User {user.id} combined subscription completed successfully")
                
            else:
                # Gestisci checkout solo Guardian (comportamento esistente)
                subscription = stripe.Subscription.retrieve(session['subscription'])
                
                # Aggiorna sempre il subscription_id con quello nuovo
                user.guardian_stripe_subscription_id = session['subscription']
                user.guardian_subscription_status = 'active'
                user.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)
                
                # Reset messaggi solo se è una nuova sottoscrizione (non riattivazione)
                # Nota: guardian_messages_used e guardian_messages_reset_date non esistono nel modello
                
                db.commit()
                logger.info(f"User {user.id} Guardian subscription updated with new subscription_id: {session['subscription']}")
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        
        user = db.query(User).filter(
            User.guardian_stripe_subscription_id == subscription['id']
        ).first()
        
        if user:
            user.guardian_subscription_status = 'cancelled'
            # Reset completo dei campi dell'abbonamento per permettere la creazione di un nuovo abbonamento
            user.guardian_stripe_subscription_id = None
            user.guardian_subscription_end_date = None
            db.commit()
            logger.info(f"User {user.id} Guardian subscription completely cancelled, all subscription fields reset")
    
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        
        user = db.query(User).filter(
            User.guardian_stripe_subscription_id == subscription['id']
        ).first()
        
        if user:
            logger.info(f"WEBHOOK: User {user.id} Guardian subscription updated - status: {subscription['status']}, cancel_at_period_end: {subscription.get('cancel_at_period_end', False)}")
            
            # Aggiorna lo stato dell'abbonamento nel database
            if subscription['status'] == 'active':
                # Se l'abbonamento è attivo ma ha cancel_at_period_end=True, è in fase di cancellazione
                if subscription.get('cancel_at_period_end', False):
                    user.guardian_subscription_status = 'cancelling'
                    user.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription['current_period_end'])
                    logger.info(f"WEBHOOK: User {user.id} Guardian subscription marked as cancelling (cancel_at_period_end=True)")
                else:
                    user.guardian_subscription_status = 'active'
                    user.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription['current_period_end'])
                    logger.info(f"WEBHOOK: User {user.id} Guardian subscription reactivated (cancel_at_period_end=False)")
            elif subscription['status'] == 'canceled':
                user.guardian_subscription_status = 'cancelled'
                user.guardian_stripe_subscription_id = None
                user.guardian_subscription_end_date = None
                logger.info(f"WEBHOOK: User {user.id} Guardian subscription completely cancelled")
            
            db.commit()
            logger.info(f"WEBHOOK: User {user.id} Guardian subscription status updated to: {subscription['status']}")
    
    return {"status": "success"}

@app.post("/api/guardian/confirm")
async def confirm_guardian_subscription(
    payload: SubscriptionConfirm, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Conferma lato backend lo stato dell'abbonamento Guardian dopo il redirect di successo da Stripe."""
    try:
        session_id = payload.session_id
        # Se viene passato un session_id, recupera i dettagli della sessione
        if session_id:
            session = stripe.checkout.Session.retrieve(session_id)
            if session and session.get('customer') == current_user.stripe_customer_id and session.get('subscription'):
                current_user.guardian_stripe_subscription_id = session['subscription']
                current_user.guardian_subscription_status = 'active'
                current_user.guardian_subscription_end_date = datetime.utcnow() + timedelta(days=30)
                # Nota: guardian_messages_used e guardian_messages_reset_date non esistono nel modello
                db.commit()
                
                # Invia email di attivazione abbonamento
                email_body = create_subscription_activation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
                background_tasks.add_task(
                    send_email, 
                    current_user.email, 
"🎉 HostGPT Subscription Activated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento HostGPT Attivato!", 
                    email_body
                )
                
                return {"status": "active"}

        # Fallback: controlla lo stato su Stripe dal customer
        if current_user.stripe_customer_id:
            subs = stripe.Subscription.list(customer=current_user.stripe_customer_id, status='all', limit=1)
            if subs.data:
                sub = subs.data[0]
                # Verifica che l'abbonamento sia attivo e non in fase di cancellazione
                if sub.status in ['active', 'trialing'] and not sub.cancel_at_period_end:
                    current_user.guardian_stripe_subscription_id = sub.id
                    current_user.guardian_subscription_status = 'active'
                    current_user.guardian_subscription_end_date = datetime.utcfromtimestamp(sub.current_period_end)
                    # Nota: guardian_messages_used e guardian_messages_reset_date non esistono nel modello
                    db.commit()
                    
                    # Invia email di attivazione abbonamento (solo se non già inviata)
                    if not is_guardian_active(current_user.guardian_subscription_status):
                        email_body = create_subscription_activation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
                        background_tasks.add_task(
                            send_email, 
                            current_user.email, 
        "🎉 HostGPT Subscription Activated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento HostGPT Attivato!", 
                            email_body
                        )
                    
                    return {"status": "active"}
                elif sub.status in ['active', 'trialing'] and sub.cancel_at_period_end:
                    # L'abbonamento è attivo ma in fase di cancellazione
                    logger.info(f"User {current_user.id} has subscription in cancellation phase")
                    return {"status": "cancelling"}

        return {"status": current_user.guardian_subscription_status or 'inactive'}
    except Exception as e:
        logger.error(f"Guardian subscription confirm error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/guardian/reactivate")
async def reactivate_guardian_subscription(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Riattiva l'abbonamento Guardian dell'utente se è in fase di cancellazione"""
    try:
        # Verifica che l'utente abbia un abbonamento Guardian in fase di cancellazione
        if not current_user.guardian_stripe_subscription_id:
            raise HTTPException(
                status_code=400,
                detail="Non hai un abbonamento Guardian da riattivare"
            )
        
        # Verifica lo stato dell'abbonamento su Stripe
        try:
            stripe_subscription = stripe.Subscription.retrieve(current_user.guardian_stripe_subscription_id)
            
            # Verifica se l'abbonamento è in fase di cancellazione
            if not stripe_subscription.cancel_at_period_end:
                raise HTTPException(
                    status_code=400,
                    detail="Il tuo abbonamento Guardian non è in fase di cancellazione"
                )
            
            # Riattiva l'abbonamento
            reactivated_sub = stripe.Subscription.modify(
                current_user.guardian_stripe_subscription_id,
                cancel_at_period_end=False
            )
            
            # Aggiorna il database
            current_user.guardian_subscription_status = 'active'
            current_user.guardian_subscription_end_date = datetime.utcfromtimestamp(reactivated_sub.current_period_end)
            db.commit()
            
            # Invia email di conferma riattivazione
            email_body = create_subscription_activation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
            background_tasks.add_task(
                send_email, 
                current_user.email, 
"🎉 HostGPT Subscription Reactivated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento HostGPT Riattivato!", 
                email_body
            )
            
            logger.info(f"User {current_user.id} Guardian subscription reactivated successfully")
            return {"status": "reactivated", "message": "Abbonamento Guardian riattivato con successo"}
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error reactivating Guardian subscription: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Errore nella riattivazione dell'abbonamento Guardian: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Guardian subscription reactivate error: {e}")
        raise HTTPException(status_code=500, detail="Errore durante la riattivazione dell'abbonamento Guardian")

@app.get("/api/guardian/subscription-status")
async def get_guardian_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni lo stato dettagliato dell'abbonamento Guardian dell'utente"""
    try:
        subscription_info = {
            "status": current_user.guardian_subscription_status,
            "end_date": current_user.guardian_subscription_end_date.isoformat() if current_user.guardian_subscription_end_date else None,
            "is_canceling": False,
            "can_reactivate": False
        }
        
        # Se c'è un subscription_id su Stripe, verifica lo stato dettagliato
        if current_user.guardian_stripe_subscription_id:
            try:
                stripe_subscription = stripe.Subscription.retrieve(current_user.guardian_stripe_subscription_id)
                subscription_info["is_canceling"] = stripe_subscription.cancel_at_period_end
                subscription_info["can_reactivate"] = (
                    stripe_subscription.status == 'active' and 
                    stripe_subscription.cancel_at_period_end
                )
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error retrieving Guardian subscription status: {e}")
                # Se non riusciamo a recuperare da Stripe, usiamo i dati del database
                pass
        
        return subscription_info
        
    except Exception as e:
        logger.error(f"Error getting Guardian subscription status: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recupero dello stato dell'abbonamento Guardian")

@app.post("/api/guardian/cancel")
async def cancel_guardian_subscription(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Annulla l'abbonamento Guardian dell'utente"""
    logger.info(f"=== GUARDIAN CANCELLATION REQUEST STARTED ===")
    logger.info(f"User {current_user.id} ({current_user.email}) requesting Guardian subscription cancellation")
    logger.info(f"Current Guardian subscription status: {current_user.guardian_subscription_status}")
    logger.info(f"Current guardian_stripe_subscription_id: {current_user.guardian_stripe_subscription_id}")
    
    try:
        logger.info(f"STEP 1: Verificando se l'utente ha un abbonamento Guardian attivo")
        # Verifica che l'utente abbia un abbonamento Guardian attivo
        if not is_guardian_active(current_user.guardian_subscription_status):
            logger.info(f"STEP 1 FAILED: User {current_user.id} non ha un abbonamento Guardian attivo")
            raise HTTPException(
                status_code=400,
                detail="Non hai un abbonamento Guardian attivo da annullare"
            )
        logger.info(f"STEP 1 PASSED: User {current_user.id} ha un abbonamento Guardian attivo")
        
        logger.info(f"STEP 2: Controllando se c'è un guardian_stripe_subscription_id")
        # Se c'è un subscription_id su Stripe, cancella anche lì PRIMA di aggiornare il DB
        if current_user.guardian_stripe_subscription_id:
            logger.info(f"STEP 2 PASSED: User {current_user.id} ha guardian_stripe_subscription_id: {current_user.guardian_stripe_subscription_id}")
            try:
                logger.info(f"STEP 3: Recuperando l'abbonamento Stripe")
                # Prima recupera l'abbonamento per verificare lo stato attuale
                current_stripe_sub = stripe.Subscription.retrieve(current_user.guardian_stripe_subscription_id)
                logger.info(f"STEP 3 PASSED: Current Guardian Stripe subscription status: {current_stripe_sub.status}, cancel_at_period_end: {current_stripe_sub.cancel_at_period_end}")
                
                logger.info(f"STEP 4: Verificando se l'abbonamento è già in fase di cancellazione")
                # Verifica se l'abbonamento è già in fase di cancellazione
                if current_stripe_sub.cancel_at_period_end:
                    logger.info(f"STEP 4 PASSED: Guardian subscription {current_user.guardian_stripe_subscription_id} is already being canceled")
                    # Aggiorna il database per riflettere lo stato corretto
                    logger.info(f"STEP 4a: Aggiornando database per abbonamento già in cancellazione")
                    current_user.guardian_subscription_status = 'cancelling'
                    current_user.guardian_subscription_end_date = datetime.utcfromtimestamp(current_stripe_sub.current_period_end)
                    db.commit()
                    logger.info(f"STEP 4a PASSED: User {current_user.id} Guardian subscription already cancelling, database updated")
                    return {
                        "status": "already_cancelling", 
                        "message": "Il tuo abbonamento Guardian è già in fase di annullamento."
                    }
                logger.info(f"STEP 4 PASSED: Abbonamento non è già in fase di cancellazione, procedendo con la cancellazione")
                
                logger.info(f"STEP 5: Chiamando Stripe per annullare l'abbonamento")
                # Chiama Stripe per annullare l'abbonamento
                stripe_subscription = stripe.Subscription.modify(
                    current_user.guardian_stripe_subscription_id,
                    cancel_at_period_end=True  # Cancella alla fine del periodo corrente
                )
                logger.info(f"STEP 5 PASSED: Guardian Stripe subscription {current_user.guardian_stripe_subscription_id} marked for cancellation")
                logger.info(f"STEP 5a: Updated Stripe subscription status: {stripe_subscription.status}, cancel_at_period_end: {stripe_subscription.cancel_at_period_end}")
                
                logger.info(f"STEP 6: Verificando che la cancellazione sia stata accettata da Stripe")
                # Verifica che la cancellazione sia stata accettata da Stripe
                if stripe_subscription.status not in ['active', 'canceled']:
                    logger.info(f"STEP 6 FAILED: Stripe subscription status non valido: {stripe_subscription.status}")
                    raise HTTPException(
                        status_code=500,
                        detail="Errore nella cancellazione dell'abbonamento Guardian su Stripe"
                    )
                logger.info(f"STEP 6 PASSED: Stripe subscription status valido: {stripe_subscription.status}")
                
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error cancelling Guardian subscription: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Errore nella cancellazione dell'abbonamento Guardian: {str(e)}"
                )
            except Exception as e:
                logger.error(f"Unexpected error cancelling Guardian Stripe subscription: {e}")
                raise HTTPException(
                    status_code=500,
                    detail="Errore imprevisto nella cancellazione dell'abbonamento Guardian"
                )
        else:
            logger.info(f"STEP 2 FAILED: User {current_user.id} has no guardian_stripe_subscription_id")
            # Se non c'è abbonamento su Stripe, aggiorna solo il database
            logger.info(f"STEP 2a: Aggiornando database a 'cancelled' per utente senza subscription_id")
            current_user.guardian_subscription_status = 'cancelled'
            db.commit()
            logger.info(f"STEP 2a PASSED: User {current_user.id} Guardian subscription status updated to 'cancelled'")
            return {
                "status": "cancelled", 
                "message": "Abbonamento Guardian annullato con successo."
            }
        
        logger.info(f"STEP 7: Aggiornando il database a 'cancelling'")
        # SOLO DOPO aver ricevuto conferma da Stripe, aggiorna il database
        # Imposta lo stato come 'cancelling' per indicare che è in fase di annullamento
        logger.info(f"STEP 7a: BEFORE DB UPDATE - User {current_user.id} status = {current_user.guardian_subscription_status}")
        current_user.guardian_subscription_status = 'cancelling'  # Stato per abbonamento in fase di annullamento
        current_user.guardian_subscription_end_date = datetime.utcfromtimestamp(stripe_subscription.current_period_end)
        logger.info(f"STEP 7a: AFTER DB UPDATE - User {current_user.id} status = {current_user.guardian_subscription_status}")
        # I dati rimangono nel database come richiesto
        db.commit()
        logger.info(f"STEP 7 PASSED: Database commit completato")
        
        logger.info(f"STEP 8: Verificando che l'aggiornamento sia stato salvato")
        # Verifica che l'aggiornamento sia stato salvato
        db.refresh(current_user)
        logger.info(f"STEP 8 PASSED: AFTER REFRESH - User {current_user.id} status = {current_user.guardian_subscription_status}")
        
        logger.info(f"STEP 9: Inviando email di annullamento")
        # Invia email di annullamento abbonamento Guardian
        end_date = current_user.guardian_subscription_end_date.strftime("%d/%m/%Y") if current_user.guardian_subscription_end_date else "fine del periodo corrente"
        email_body = f"""
        <h2>Abbonamento Guardian Annullato</h2>
        <p>Ciao {current_user.full_name},</p>
        <p>Il tuo abbonamento HostGPT Guardian è stato annullato con successo.</p>
        <p>Il servizio rimarrà attivo fino al {end_date}.</p>
        <p>Grazie per aver utilizzato HostGPT Guardian!</p>
        """
        background_tasks.add_task(
            send_email, 
            current_user.email, 
            "😔 Abbonamento Guardian Annullato", 
            email_body
        )
        logger.info(f"STEP 9 PASSED: Email inviata in background")
        
        logger.info(f"STEP 10: Completando la cancellazione")
        logger.info(f"User {current_user.id} Guardian subscription cancelled successfully")
        logger.info(f"=== GUARDIAN CANCELLATION REQUEST COMPLETED ===")
        return {
            "status": "cancelling", 
            "message": "Abbonamento Guardian annullato con successo. Il tuo abbonamento rimarrà attivo fino alla fine del periodo corrente."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Guardian subscription cancel error: {e}")
        raise HTTPException(status_code=500, detail="Errore durante l'annullamento dell'abbonamento Guardian")

@app.post("/api/guardian/reactivate")
async def reactivate_guardian_subscription(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Riattiva l'abbonamento Guardian dell'utente se è in fase di cancellazione"""
    try:
        # Verifica che l'utente abbia un abbonamento Guardian in fase di cancellazione
        if not current_user.guardian_stripe_subscription_id:
            raise HTTPException(
                status_code=400,
                detail="Non hai un abbonamento Guardian da riattivare"
            )
        
        # Verifica lo stato dell'abbonamento su Stripe
        try:
            stripe_subscription = stripe.Subscription.retrieve(current_user.guardian_stripe_subscription_id)
            
            # Verifica se l'abbonamento è in fase di cancellazione
            if not stripe_subscription.cancel_at_period_end:
                raise HTTPException(
                    status_code=400,
                    detail="Il tuo abbonamento Guardian non è in fase di cancellazione"
                )
            
            # Riattiva l'abbonamento
            reactivated_sub = stripe.Subscription.modify(
                current_user.guardian_stripe_subscription_id,
                cancel_at_period_end=False
            )
            
            # Aggiorna il database
            current_user.guardian_subscription_status = 'active'
            current_user.guardian_subscription_end_date = datetime.utcfromtimestamp(reactivated_sub.current_period_end)
            db.commit()
            
            # Invia email di conferma riattivazione
            email_body = f"""
            <h2>Abbonamento Guardian Riattivato</h2>
            <p>Ciao {current_user.full_name},</p>
            <p>Il tuo abbonamento HostGPT Guardian è stato riattivato con successo!</p>
            <p>Ora puoi continuare a utilizzare tutte le funzionalità Guardian per proteggere la soddisfazione dei tuoi ospiti.</p>
            <p>Grazie per aver scelto HostGPT Guardian!</p>
            """
            background_tasks.add_task(
                send_email, 
                current_user.email, 
                "🎉 Abbonamento Guardian Riattivato!", 
                email_body
            )
            
            logger.info(f"User {current_user.id} Guardian subscription reactivated successfully")
            return {"status": "reactivated", "message": "Abbonamento Guardian riattivato con successo"}
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error reactivating Guardian subscription: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Errore nella riattivazione dell'abbonamento Guardian: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Guardian subscription reactivate error: {e}")
        raise HTTPException(status_code=500, detail="Errore durante la riattivazione dell'abbonamento Guardian")

# ============= Guardian Analytics APIs =============

@app.get("/api/guardian/statistics")
async def get_guardian_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni le statistiche Guardian per l'utente corrente"""
    try:
        # Verifica che l'utente abbia un abbonamento Guardian attivo
        if not is_guardian_active(current_user.guardian_subscription_status):
            raise HTTPException(
                status_code=403,
                detail="Abbonamento Guardian richiesto per accedere alle statistiche"
            )
        
        # Ottieni le statistiche
        stats = guardian_service.get_guardian_statistics(current_user.id, db)
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Guardian statistics: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recupero delle statistiche Guardian")

@app.get("/api/guardian/alerts")
async def get_guardian_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni gli alert Guardian attivi per l'utente corrente"""
    try:
        # Verifica che l'utente abbia un abbonamento Guardian attivo
        if not is_guardian_active(current_user.guardian_subscription_status):
            raise HTTPException(
                status_code=403,
                detail="Abbonamento Guardian richiesto per accedere agli alert"
            )
        
        # Ottieni gli alert non risolti
        alerts = db.query(GuardianAlert).filter(
            GuardianAlert.user_id == current_user.id,
            GuardianAlert.is_resolved == False
        ).order_by(GuardianAlert.created_at.desc()).all()
        
        logger.info(f"User {current_user.id}: trovati {len(alerts)} alert attivi (non risolti)")
        
        # Debug: mostra tutti gli alert dell'utente
        all_alerts = db.query(GuardianAlert).filter(
            GuardianAlert.user_id == current_user.id
        ).all()
        logger.info(f"User {current_user.id}: totale alert nel DB: {len(all_alerts)}")
        for alert in all_alerts:
            logger.info(f"Alert {alert.id}: is_resolved={alert.is_resolved}, created_at={alert.created_at}")
        
        # Debug aggiuntivo: verifica il tipo di dati di is_resolved
        for alert in all_alerts:
            logger.info(f"Alert {alert.id}: is_resolved type={type(alert.is_resolved)}, value={alert.is_resolved}, bool conversion={bool(alert.is_resolved)}")
        
        # Formatta gli alert per il frontend
        formatted_alerts = []
        for alert in alerts:
            # Recupera i messaggi della conversazione per il frontend
            messages = db.query(Message).filter(
                Message.conversation_id == alert.conversation_id
            ).order_by(Message.timestamp).all()
            
            conversation_data = []
            for msg in messages:
                conversation_data.append({
                    'role': msg.role,
                    'content': msg.content,
                    'timestamp': msg.timestamp.isoformat()
                })
            
            formatted_alerts.append({
                'id': alert.id,
                'guest_id': f"#{alert.conversation_id}",
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'message': alert.message,
                'suggested_action': alert.suggested_action,
                'created_at': alert.created_at.isoformat(),
                'conversation': conversation_data
            })
        
        return formatted_alerts
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Guardian alerts: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recupero degli alert Guardian")

@app.post("/api/guardian/alerts/{alert_id}/resolve")
async def resolve_guardian_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Risolve un alert Guardian"""
    try:
        # Verifica che l'utente abbia un abbonamento Guardian attivo
        if not is_guardian_active(current_user.guardian_subscription_status):
            raise HTTPException(
                status_code=403,
                detail="Abbonamento Guardian richiesto per gestire gli alert"
            )
        
        # Verifica che l'alert appartenga all'utente
        alert = db.query(GuardianAlert).filter(
            GuardianAlert.id == alert_id,
            GuardianAlert.user_id == current_user.id
        ).first()
        
        if not alert:
            raise HTTPException(
                status_code=404,
                detail="Alert non trovato"
            )
        
        # Risolve l'alert
        success = guardian_service.resolve_alert(alert_id, current_user.email, db)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Errore nella risoluzione dell'alert"
            )
        
        # Verifica che l'alert sia stato effettivamente risolto
        resolved_alert = db.query(GuardianAlert).filter(
            GuardianAlert.id == alert_id,
            GuardianAlert.user_id == current_user.id
        ).first()
        
        if resolved_alert and not resolved_alert.is_resolved:
            logger.error(f"Alert {alert_id} non è stato risolto correttamente")
            raise HTTPException(
                status_code=500,
                detail="Errore nella risoluzione dell'alert"
            )
        
        logger.info(f"Alert {alert_id} risolto con successo, is_resolved={resolved_alert.is_resolved if resolved_alert else 'N/A'}")
        return {"message": "Alert risolto con successo"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving Guardian alert: {e}")
        raise HTTPException(status_code=500, detail="Errore nella risoluzione dell'alert")

# ============= Guardian Analysis Integration =============

async def analyze_conversation_with_guardian(conversation_id: int, db: Session):
    """
    Funzione per analizzare una conversazione con Guardian
    Viene chiamata automaticamente quando viene aggiunto un nuovo messaggio
    """
    try:
        # Recupera la conversazione
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            logger.error(f"Conversazione {conversation_id} non trovata per analisi Guardian")
            return
        
        # Verifica che il proprietario del chatbot abbia Guardian attivo
        chatbot = db.query(Chatbot).filter(Chatbot.id == conversation.chatbot_id).first()
        if not chatbot:
            logger.error(f"Chatbot non trovato per conversazione {conversation_id}")
            return
        
        user = db.query(User).filter(User.id == chatbot.user_id).first()
        if not user or not is_guardian_active(user.guardian_subscription_status):
            logger.info(f"Utente {user.id if user else 'N/A'} non ha Guardian attivo, salto analisi")
            return
        
        # Verifica che la conversazione non sia già stata analizzata E non abbia un alert attivo
        if conversation.guardian_analyzed and conversation.guardian_alert_triggered:
            logger.info(f"Conversazione {conversation_id} già analizzata da Guardian e ha alert attivo, salto")
            return
        
        # Se è già stata analizzata ma non ha alert, ri-analizza (nuovi messaggi potrebbero aver cambiato la situazione)
        if conversation.guardian_analyzed and not conversation.guardian_alert_triggered:
            logger.info(f"Conversazione {conversation_id} già analizzata ma senza alert, ri-analizzo per nuovi messaggi")
        
        # Analizza la conversazione
        analysis_result = guardian_service.analyze_conversation(conversation, db)
        
        # Se il rischio è alto, crea un alert e invia email
        if analysis_result['risk_score'] >= guardian_service.risk_threshold:
            alert = guardian_service.create_alert(conversation, analysis_result, db)
            guardian_service.send_alert_email(alert, db)
            logger.warning(f"🚨 ALERT GUARDIAN CREATO: Conversazione {conversation_id}, rischio {analysis_result['risk_score']:.3f}")
        
    except Exception as e:
        logger.error(f"Errore nell'analisi Guardian della conversazione {conversation_id}: {e}")

# --- Free Trial Management ---

@app.post("/api/free-trial/start")
async def start_free_trial(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Avvia il periodo di prova gratuito di 14 giorni"""
    try:
        logger.info(f"Starting free trial for user {current_user.id} (email: {current_user.email})")
        
        # Verifica che l'utente abbia verificato l'email
        if not current_user.is_verified:
            raise HTTPException(status_code=400, detail="Devi verificare la tua email prima di iniziare il periodo di prova")
        
        # Verifica che non abbia già un abbonamento attivo o un free trial
        if current_user.subscription_status in ['active', 'cancelling', 'free_trial']:
            if current_user.subscription_status == 'free_trial' and is_free_trial_active(current_user):
                raise HTTPException(status_code=400, detail="Hai già un periodo di prova attivo")
            elif current_user.subscription_status in ['active', 'cancelling']:
                raise HTTPException(status_code=400, detail="Hai già un abbonamento attivo")
        
        # Calcola le date del free trial
        now = datetime.utcnow()
        free_trial_end = now + timedelta(days=14)
        
        # Aggiorna l'utente per il free trial
        current_user.subscription_status = 'free_trial'
        current_user.free_trial_start_date = now
        current_user.free_trial_end_date = free_trial_end
        current_user.free_trial_messages_used = 0
        current_user.free_trial_converted = False
        current_user.messages_used = 0
        current_user.messages_reset_date = now
        
        db.commit()
        
        # Invia email di benvenuto free trial
        email_body = create_free_trial_welcome_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
        background_tasks.add_task(
            send_email, 
            current_user.email, 
"🎉 Welcome to your HostGPT free trial!" if (user.language or "it") == "en" else "🎉 Benvenuto nel tuo periodo di prova gratuito HostGPT!", 
            email_body
        )
        
        logger.info(f"Free trial started successfully for user {current_user.id}")
        return {
            "status": "success",
            "message": "Periodo di prova gratuito avviato con successo!",
            "free_trial_end_date": free_trial_end.isoformat(),
            "messages_remaining": 20
        }
        
    except Exception as e:
        logger.error(f"Error starting free trial: {e}")
        raise HTTPException(status_code=500, detail="Errore nell'avvio del periodo di prova")

@app.get("/api/free-trial/status")
async def get_free_trial_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni lo stato del free trial dell'utente"""
    try:
        is_active = is_free_trial_active(current_user)
        messages_remaining = get_free_trial_messages_remaining(current_user)
        
        return {
            "is_active": is_active,
            "subscription_status": current_user.subscription_status,
            "free_trial_start_date": current_user.free_trial_start_date.isoformat() if current_user.free_trial_start_date else None,
            "free_trial_end_date": current_user.free_trial_end_date.isoformat() if current_user.free_trial_end_date else None,
            "messages_limit": current_user.free_trial_messages_limit,
            "messages_used": current_user.free_trial_messages_used,
            "messages_remaining": messages_remaining,
            "days_remaining": (current_user.free_trial_end_date - datetime.utcnow()).days if is_active else 0,
            "converted": current_user.free_trial_converted
        }
        
    except Exception as e:
        logger.error(f"Error getting free trial status: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recupero dello stato del free trial")

@app.post("/api/free-trial/send-notifications")
async def send_free_trial_notifications(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Invia notifiche email per i free trial in scadenza (da chiamare via cron job)"""
    try:
        now = datetime.utcnow()
        
        # Trova utenti in free trial
        free_trial_users = db.query(User).filter(
            User.subscription_status == 'free_trial',
            User.free_trial_end_date.isnot(None)
        ).all()
        
        notifications_sent = 0
        
        for user in free_trial_users:
            if not user.free_trial_end_date:
                continue
                
            days_remaining = (user.free_trial_end_date - now).days
            
            # Invia notifica 3 giorni prima della scadenza
            if days_remaining == 3:
                email_body = create_free_trial_ending_email_simple(
                    user.full_name or user.email,
                    days_remaining,
                    user.free_trial_messages_used,
                    user.free_trial_messages_limit,
                    user.language or "it"
                )
                background_tasks.add_task(
                    send_email,
                    user.email,
                    "⏰ Il tuo periodo di prova HostGPT scade tra 3 giorni",
                    email_body
                )
                notifications_sent += 1
                logger.info(f"Sent 3-day warning email to user {user.id}")
            
            # Invia notifica 1 giorno prima della scadenza
            elif days_remaining == 1:
                email_body = create_free_trial_ending_email_simple(
                    user.full_name or user.email,
                    days_remaining,
                    user.free_trial_messages_used,
                    user.free_trial_messages_limit,
                    user.language or "it"
                )
                background_tasks.add_task(
                    send_email,
                    user.email,
                    "🚨 Il tuo periodo di prova HostGPT scade domani!",
                    email_body
                )
                notifications_sent += 1
                logger.info(f"Sent 1-day warning email to user {user.id}")
            
            # Invia notifica il giorno della scadenza
            elif days_remaining == 0:
                email_body = create_free_trial_expired_email_simple(
                    user.full_name or user.email,
                    user.free_trial_messages_used,
                    user.free_trial_messages_limit,
                    user.language or "it"
                )
                background_tasks.add_task(
                    send_email,
                    user.email,
    "⏰ Your HostGPT free trial has expired" if (user.language or "it") == "en" else "⏰ Il tuo periodo di prova HostGPT è scaduto",
                    email_body
                )
                notifications_sent += 1
                logger.info(f"Sent expiration email to user {user.id}")
        
        return {
            "status": "success",
            "notifications_sent": notifications_sent,
            "message": f"Inviate {notifications_sent} notifiche email per free trial"
        }
        
    except Exception as e:
        logger.error(f"Error sending free trial notifications: {e}")
        raise HTTPException(status_code=500, detail="Errore nell'invio delle notifiche free trial")

@app.post("/api/free-trial/expire-trials")
async def expire_free_trials(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Scade i free trial scaduti (da chiamare via cron job)"""
    try:
        now = datetime.utcnow()
        
        # Trova utenti con free trial scaduto
        expired_users = db.query(User).filter(
            User.subscription_status == 'free_trial',
            User.free_trial_end_date < now
        ).all()
        
        expired_count = 0
        
        for user in expired_users:
            # Cambia status a inactive
            user.subscription_status = 'inactive'
            db.commit()
            
            # Invia email di scadenza se non già inviata
            email_body = create_free_trial_expired_email_simple(
                user.full_name or user.email,
                user.free_trial_messages_used,
                user.free_trial_messages_limit,
                user.language or "it"
            )
            background_tasks.add_task(
                send_email,
                user.email,
"⏰ Your HostGPT free trial has expired" if (user.language or "it") == "en" else "⏰ Il tuo periodo di prova HostGPT è scaduto",
                email_body
            )
            
            expired_count += 1
            logger.info(f"Expired free trial for user {user.id}")
        
        return {
            "status": "success",
            "expired_count": expired_count,
            "message": f"Scaduti {expired_count} free trial"
        }
        
    except Exception as e:
        logger.error(f"Error expiring free trials: {e}")
        raise HTTPException(status_code=500, detail="Errore nella gestione delle scadenze free trial")

@app.delete("/api/auth/delete-profile")
async def delete_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elimina completamente il profilo utente e tutti i dati associati"""
    try:
        logger.info(f"Starting profile deletion for user {current_user.id}")
        
        # 1. Cancella tutti gli abbonamenti Stripe
        try:
            # Cancella abbonamento HostGPT se esiste
            if current_user.stripe_subscription_id:
                try:
                    stripe_subscription = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
                    if stripe_subscription.status in ['active', 'trialing', 'past_due']:
                        stripe.Subscription.delete(current_user.stripe_subscription_id)
                        logger.info(f"Deleted HostGPT subscription {current_user.stripe_subscription_id}")
                except stripe.error.StripeError as e:
                    logger.error(f"Error deleting HostGPT subscription: {e}")
            
            # Cancella abbonamento Guardian se esiste
            if current_user.guardian_stripe_subscription_id:
                try:
                    guardian_subscription = stripe.Subscription.retrieve(current_user.guardian_stripe_subscription_id)
                    if guardian_subscription.status in ['active', 'trialing', 'past_due']:
                        stripe.Subscription.delete(current_user.guardian_stripe_subscription_id)
                        logger.info(f"Deleted Guardian subscription {current_user.guardian_stripe_subscription_id}")
                except stripe.error.StripeError as e:
                    logger.error(f"Error deleting Guardian subscription: {e}")
            
            # Cancella il customer Stripe se esiste
            if current_user.stripe_customer_id:
                try:
                    stripe.Customer.delete(current_user.stripe_customer_id)
                    logger.info(f"Deleted Stripe customer {current_user.stripe_customer_id}")
                except stripe.error.StripeError as e:
                    logger.error(f"Error deleting Stripe customer: {e}")
                    
        except Exception as e:
            logger.error(f"Error in Stripe cleanup: {e}")
            # Non bloccare l'eliminazione per errori Stripe
        
        # 2. Elimina tutti i chatbot dell'utente (cascade eliminerà conversazioni, messaggi, knowledge base)
        chatbots = db.query(Chatbot).filter(Chatbot.user_id == current_user.id).all()
        for chatbot in chatbots:
            # Elimina l'assistant da OpenAI se esiste
            if chatbot.assistant_id:
                try:
                    client = get_openai_client()
                    client.beta.assistants.delete(chatbot.assistant_id)
                    logger.info(f"Deleted OpenAI assistant {chatbot.assistant_id}")
                except Exception as e:
                    logger.error(f"Error deleting OpenAI assistant {chatbot.assistant_id}: {e}")
        
        # 3. I referral codes non sono legati direttamente all'utente, 
        # ma sono utilizzati da più utenti, quindi non li eliminiamo
        # L'utente verrà semplicemente rimosso dalla relazione quando viene eliminato
        
        # 4. Elimina tutti i Guardian alerts e analisi
        guardian_alerts = db.query(GuardianAlert).join(Conversation).join(Chatbot).filter(
            Chatbot.user_id == current_user.id
        ).all()
        for alert in guardian_alerts:
            db.delete(alert)
        
        guardian_analyses = db.query(GuardianAnalysis).join(Conversation).join(Chatbot).filter(
            Chatbot.user_id == current_user.id
        ).all()
        for analysis in guardian_analyses:
            db.delete(analysis)
        
        # 5. Elimina tutti i chatbot (cascade eliminerà tutto il resto)
        for chatbot in chatbots:
            db.delete(chatbot)
        
        # 6. Elimina l'utente
        db.delete(current_user)
        
        # 7. Commit tutte le modifiche
        db.commit()
        
        logger.info(f"Successfully deleted profile for user {current_user.id}")
        
        return {
            "status": "success",
            "message": "Profilo eliminato con successo"
        }
        
    except Exception as e:
        logger.error(f"Error deleting profile for user {current_user.id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Errore nell'eliminazione del profilo")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
