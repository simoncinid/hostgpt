from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
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
from models import Base, User, Chatbot, Conversation, Message, KnowledgeBase, Analytics
from config import settings

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
    language: str = "it"

class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    property_description: Optional[str] = None
    neighborhood_description: Optional[str] = None
    house_rules: Optional[str] = None
    special_instructions: Optional[str] = None
    welcome_message: Optional[str] = None
    faq: Optional[List[dict]] = None

class MessageCreate(BaseModel):
    content: str
    thread_id: Optional[str] = None
    guest_name: Optional[str] = None

class SubscriptionCreate(BaseModel):
    payment_method_id: str

class SubscriptionConfirm(BaseModel):
    session_id: Optional[str] = None

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

def generate_qr_code(url: str) -> str:
    """Genera QR code e ritorna come base64"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
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
        
        Rispondi sempre in {chatbot_data['language']}.
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

        Rispondi sempre in {chatbot.language}.
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
        verification_token=verification_token  # Aggiungeremo questo campo al modello
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Invia email di verifica
    verification_link = f"{settings.BACKEND_URL}/api/auth/verify-email?token={verification_token}"
    email_body = f"""
    <h2>Benvenuto su HostGPT!</h2>
    <p>Caro {user.full_name},</p>
    <p>Grazie per esserti registrato! Per completare la registrazione e attivare il tuo abbonamento, clicca sul link qui sotto:</p>
    <p><a href="{verification_link}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">Verifica Email e Attiva Abbonamento</a></p>
    <p>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
    <p>{verification_link}</p>
    <p><strong>Importante:</strong> Dopo la verifica dell'email, verrai reindirizzato alla pagina di pagamento per attivare il tuo abbonamento mensile a 29€/mese.</p>
    <br>
    <p>Il team di HostGPT</p>
    """
    
    background_tasks.add_task(send_email, user.email, "Conferma la tua email - HostGPT", email_body)
    
    return {"message": "Registrazione completata. Controlla la tua email per verificare l'account e attivare l'abbonamento."}

@app.get("/api/auth/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verifica email e reindirizza al pagamento"""
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
    db.commit()
    
    # Crea token di accesso per l'utente
    access_token = create_access_token(data={"sub": user.email})
    
    # Reindirizza alla pagina di checkout con token
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
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "subscription_status": current_user.subscription_status,
        "subscription_end_date": current_user.subscription_end_date,
        "messages_limit": current_user.messages_limit,
        "messages_used": current_user.messages_used,
        "messages_remaining": current_user.messages_limit - current_user.messages_used,
        "is_verified": current_user.is_verified
    }

# --- Subscription/Payment ---

@app.post("/api/subscription/create-checkout")
async def create_checkout_session(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Crea sessione di checkout Stripe - Solo abbonamento mensile a 29€"""
    try:
        # Validazione configurazione STRIPE_PRICE_ID
        if not settings.STRIPE_PRICE_ID or not settings.STRIPE_PRICE_ID.startswith("price_") or "your-monthly" in settings.STRIPE_PRICE_ID:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Configurazione Stripe mancante o non valida: STRIPE_PRICE_ID. "
                    "Imposta un Price ID ricorrente (mensile 29€) nelle variabili d'ambiente del backend."
                ),
            )

        # Verifica che l'utente abbia verificato l'email
        if not current_user.is_verified:
            raise HTTPException(status_code=400, detail="Devi verificare la tua email prima di sottoscrivere un abbonamento")
        
        # Se ha già un abbonamento attivo, non permettere un nuovo checkout
        if current_user.subscription_status == 'active':
            raise HTTPException(status_code=400, detail="Hai già un abbonamento attivo")
        
        # Crea o recupera customer Stripe
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name
            )
            current_user.stripe_customer_id = customer.id
            db.commit()

        # Evita doppie sottoscrizioni creando una nuova sessione se c'è già una subscription in corso/attiva
        if current_user.stripe_customer_id:
            subs = stripe.Subscription.list(customer=current_user.stripe_customer_id, status='all', limit=1)
            if subs.data:
                sub = subs.data[0]
                if sub.status in ['active', 'trialing', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid']:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Hai già una sottoscrizione attiva o in corso. Completa o verifica il pagamento senza crearne un'altra."
                        ),
                    )
        
        # Crea sessione checkout per abbonamento mensile a 29€
        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': settings.STRIPE_PRICE_ID,  # Questo dovrà essere configurato per 29€/mese
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/login?subscription=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/dashboard?subscription=cancelled",
            metadata={
                'user_id': str(current_user.id)
            }
        )
        
        return {"checkout_url": checkout_session.url}
        
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

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
    
    # Gestisci eventi
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Aggiorna utente
        user = db.query(User).filter(
            User.stripe_customer_id == session['customer']
        ).first()
        
        if user:
            user.stripe_subscription_id = session['subscription']
            user.subscription_status = 'active'
            user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
            user.messages_used = 0
            user.messages_reset_date = datetime.utcnow()
            db.commit()
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        
        user = db.query(User).filter(
            User.stripe_subscription_id == subscription['id']
        ).first()
        
        if user:
            user.subscription_status = 'cancelled'
            db.commit()
    
    return {"status": "success"}

@app.post("/api/subscription/confirm")
async def confirm_subscription(payload: SubscriptionConfirm, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
                return {"status": "active"}

        # Fallback: controlla lo stato su Stripe dal customer
        if current_user.stripe_customer_id:
            subs = stripe.Subscription.list(customer=current_user.stripe_customer_id, status='all', limit=1)
            if subs.data:
                sub = subs.data[0]
                if sub.status in ['active', 'trialing']:
                    current_user.stripe_subscription_id = sub.id
                    current_user.subscription_status = 'active'
                    current_user.subscription_end_date = datetime.utcfromtimestamp(sub.current_period_end)
                    current_user.messages_used = 0
                    current_user.messages_reset_date = datetime.utcnow()
                    db.commit()
                    return {"status": "active"}

        return {"status": current_user.subscription_status or 'inactive'}
    except Exception as e:
        logger.error(f"Subscription confirm error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/subscription/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Annulla l'abbonamento dell'utente"""
    try:
        # Verifica che l'utente abbia un abbonamento attivo
        if current_user.subscription_status != 'active':
            raise HTTPException(
                status_code=400,
                detail="Non hai un abbonamento attivo da annullare"
            )
        
        # Se c'è un subscription_id su Stripe, cancella anche lì PRIMA di aggiornare il DB
        if current_user.stripe_subscription_id:
            try:
                # Chiama Stripe per annullare l'abbonamento
                stripe_subscription = stripe.Subscription.modify(
                    current_user.stripe_subscription_id,
                    cancel_at_period_end=True  # Cancella alla fine del periodo corrente
                )
                logger.info(f"Stripe subscription {current_user.stripe_subscription_id} marked for cancellation")
                
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
        
        # SOLO DOPO aver ricevuto conferma da Stripe, aggiorna il database
        current_user.subscription_status = 'cancelled'
        # I dati rimangono nel database come richiesto
        db.commit()
        
        logger.info(f"User {current_user.id} subscription cancelled successfully")
        return {"status": "cancelled", "message": "Abbonamento annullato con successo"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Subscription cancel error: {e}")
        raise HTTPException(status_code=500, detail="Errore durante l'annullamento dell'abbonamento")

# --- Chatbot Management ---

@app.post("/api/chatbots/create")
async def create_chatbot(
    chatbot: ChatbotCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea un nuovo chatbot"""
    # Verifica abbonamento attivo
    if current_user.subscription_status != 'active':
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
    
    # Crea assistant OpenAI
    assistant_id = await create_openai_assistant(chatbot.dict())
    
    # Salva chatbot nel database
    db_chatbot = Chatbot(
        user_id=current_user.id,
        assistant_id=assistant_id,
        **chatbot.dict()
    )
    db.add(db_chatbot)
    db.commit()
    db.refresh(db_chatbot)
    
    # Genera QR code
    chat_url = f"{settings.FRONTEND_URL}/chat/{db_chatbot.uuid}"
    qr_code = generate_qr_code(chat_url)
    
    # Invia email di conferma
    email_body = f"""
    <h2>Il tuo Chatbot è pronto!</h2>
    <p>Ciao {current_user.full_name},</p>
    <p>Il chatbot per <strong>{chatbot.property_name}</strong> è stato creato con successo!</p>
    <p>I tuoi ospiti possono ora chattare con il bot attraverso:</p>
    <ul>
        <li><strong>Link diretto:</strong> <a href="{chat_url}">{chat_url}</a></li>
        <li><strong>QR Code:</strong> Usa il QR code allegato</li>
    </ul>
    <p>Accedi alla dashboard per vedere le statistiche e gestire le conversazioni.</p>
    <br>
    <p>Il team di HostGPT</p>
    """
    
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
        "is_blocked": current_user.subscription_status != 'active',
        "monthly_price": "29€"
    }

@app.get("/api/chatbots")
async def get_chatbots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni tutti i chatbot dell'utente"""
    # Blocca accesso senza abbonamento attivo
    if current_user.subscription_status != 'active':
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
            "qr_code": generate_qr_code(chat_url),
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "is_active": bot.is_active,
            "created_at": bot.created_at
        })
    
    return result

@app.get("/api/chatbots/{chatbot_id}")
async def get_chatbot(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni dettagli di un chatbot"""
    # Blocca accesso senza abbonamento attivo
    if current_user.subscription_status != 'active':
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
    
    return chatbot

@app.put("/api/chatbots/{chatbot_id}")
async def update_chatbot(
    chatbot_id: int,
    update_data: ChatbotUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggiorna un chatbot"""
    # Blocca accesso senza abbonamento attivo
    if current_user.subscription_status != 'active':
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
        "property_name": chatbot.property_name,
        "welcome_message": chatbot.welcome_message,
        "language": chatbot.language
    }

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
    if owner.subscription_status != 'active':
        raise HTTPException(
            status_code=403, 
            detail="Il proprietario di questo chatbot non ha un abbonamento attivo. Il servizio è temporaneamente non disponibile."
        )
    
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
        owner.messages_used += 1  # Contiamo solo i messaggi inviati dagli ospiti
        
        db.commit()
        
        return {
            "thread_id": thread_id,
            "message": assistant_message,
            "messages_remaining": owner.messages_limit - owner.messages_used
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
    if current_user.subscription_status != 'active':
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

@app.post("/api/chatbots/{chatbot_id}/retrain")
async def retrain_chatbot(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Riallena il chatbot con i dati aggiornati"""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Ricostruisci e aggiorna l'assistant
    try:
        await create_openai_assistant(chatbot.__dict__)
        return {"message": "Chatbot riallenato con successo"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel riallenamento: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
