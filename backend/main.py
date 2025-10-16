from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request, File, UploadFile, Form
from typing import List
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, text
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
import time
import uuid
import stripe
import openai
from jose import JWTError, jwt
from passlib.context import CryptContext
import json
import qrcode
import io
import base64
import wifi_qrcode_generator.generator
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from pydantic import BaseModel, EmailStr
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import secrets
import logging
import asyncio
import requests
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import PyPDF2
import docx
from odf import text as odf_text, teletype
from odf.opendocument import load as odf_load
import hashlib
from cryptography.fernet import Fernet

from database import get_db, engine
from models import Base, User, Chatbot, Conversation, Message, KnowledgeBase, Analytics, GuardianAlert, GuardianAnalysis, ReferralCode, PrintOrder, PrintOrderItem, Guest, ChatbotGuest, HostawayMapping, HostawayApiKey, ChatbotCollaboratorInvite, ChatbotCollaborator
from config import settings
from sms_service import sms_service
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
    create_guardian_subscription_confirmation_email_simple,
    create_purchase_confirmation_email_simple,
    create_guardian_subscription_cancellation_email_simple,
    create_subscription_reactivation_email_simple,
    create_guardian_subscription_reactivation_email_simple,
    create_monthly_report_email_simple,
    create_print_order_confirmation_email_simple,
    create_conversations_limit_warning_email_simple,
    create_plan_upgrade_confirmation_email_simple,
    create_collaborator_invite_email_simple
)
from email_templates import create_checkin_notification_email

def get_conversations_limit_by_price_id(price_id: str) -> int:
    """Mappa i price_id ai limiti delle conversazioni"""
    # Mappa dei limiti per i nuovi tier (nomi dei price_id)
    price_limits = {
        "STANDARD_PRICE_ID": 20,      # Standard
        "PREMIUM_PRICE_ID": 50,       # Premium  
        "PRO_PRICE_ID": 150,          # Pro
        "ENTERPRISE_PRICE_ID": 500,   # Enterprise
        # Supporto per price_id annuali
        "ANNUAL_STANDARD_PRICE_ID": 20,
        "ANNUAL_PREMIUM_PRICE_ID": 50,
        "ANNUAL_PRO_PRICE_ID": 150,
        "ANNUAL_ENTERPRISE_PRICE_ID": 500,
    }
    
    # Mappa dei veri price_id di Stripe ai limiti
    stripe_price_limits = {
        settings.STRIPE_STANDARD_PRICE_ID: 20,
        settings.STRIPE_PREMIUM_PRICE_ID: 50,
        settings.STRIPE_PRO_PRICE_ID: 150,
        settings.STRIPE_ENTERPRISE_PRICE_ID: 500,
        settings.STRIPE_ANNUAL_STANDARD_PRICE_ID: 20,
        settings.STRIPE_ANNUAL_PREMIUM_PRICE_ID: 50,
        settings.STRIPE_ANNUAL_PRO_PRICE_ID: 150,
        settings.STRIPE_ANNUAL_ENTERPRISE_PRICE_ID: 500,
    }
    
    # Prima controlla i nomi dei price_id, poi i veri price_id di Stripe
    if price_id in price_limits:
        return price_limits[price_id]
    elif price_id in stripe_price_limits:
        return stripe_price_limits[price_id]
    else:
        # Se non trovato, usa il limite di default (Standard)
        logger.warning(f"Unknown price_id: {price_id}, using default limit of 20")
        return 20

def get_plan_name_by_price_id(price_id: str) -> str:
    """Mappa i price_id ai nomi dei piani"""
    # Mappa dei nomi per i nuovi tier (nomi dei price_id)
    price_names = {
        "STANDARD_PRICE_ID": "Standard",
        "PREMIUM_PRICE_ID": "Premium",  
        "PRO_PRICE_ID": "Pro",
        "ENTERPRISE_PRICE_ID": "Enterprise",
        # Supporto per price_id annuali
        "ANNUAL_STANDARD_PRICE_ID": "Standard",
        "ANNUAL_PREMIUM_PRICE_ID": "Premium",
        "ANNUAL_PRO_PRICE_ID": "Pro",
        "ANNUAL_ENTERPRISE_PRICE_ID": "Enterprise",
    }
    
    # Mappa dei veri price_id di Stripe ai nomi
    stripe_price_names = {
        settings.STRIPE_STANDARD_PRICE_ID: "Standard",
        settings.STRIPE_PREMIUM_PRICE_ID: "Premium",
        settings.STRIPE_PRO_PRICE_ID: "Pro",
        settings.STRIPE_ENTERPRISE_PRICE_ID: "Enterprise",
        settings.STRIPE_ANNUAL_STANDARD_PRICE_ID: "Standard",
        settings.STRIPE_ANNUAL_PREMIUM_PRICE_ID: "Premium",
        settings.STRIPE_ANNUAL_PRO_PRICE_ID: "Pro",
        settings.STRIPE_ANNUAL_ENTERPRISE_PRICE_ID: "Enterprise",
    }
    
    # Prima controlla i nomi dei price_id, poi i veri price_id di Stripe
    if price_id in price_names:
        return price_names[price_id]
    elif price_id in stripe_price_names:
        return stripe_price_names[price_id]
    else:
        # Se non trovato, usa il nome di default (Standard)
        return "Standard"

def get_plan_name_by_limit(limit: int) -> str:
    """Mappa i limiti ai nomi dei piani"""
    limit_names = {
        20: "Standard",
        50: "Premium",
        150: "Pro",
        500: "Enterprise"
    }
    return limit_names.get(limit, "Standard")

def reset_conversations_counter_if_needed(user: User, db: Session) -> bool:
    """
    Resetta il contatore delle conversazioni solo se necessario:
    - Se è il primo abbonamento (conversations_reset_date è None)
    - Se è passato almeno un mese dall'ultimo reset
    - Se è un cambio di piano significativo
    """
    now = datetime.utcnow()
    
    # Reset se è il primo abbonamento
    if not user.conversations_reset_date:
        user.conversations_used = 0
        user.conversations_reset_date = now
        logger.info(f"🔄 [DEBUG] Reset conversations_used per primo abbonamento: {user.conversations_used}")
        return True
    
    # Reset se è passato almeno un mese
    if (now - user.conversations_reset_date).days >= 30:
        user.conversations_used = 0
        user.conversations_reset_date = now
        logger.info(f"🔄 [DEBUG] Reset conversations_used per rinnovo mensile: {user.conversations_used}")
        return True
    
    # Non resettare in altri casi
    logger.info(f"🔄 [DEBUG] Mantenuto conversations_used esistente: {user.conversations_used}")
    return False

async def extract_property_content(url: str) -> str:
    """
    Estrae il contenuto di una pagina di proprietà usando Playwright async con fallback a requests.
    Ottimizzato per velocità e compatibilità con Render.
    """
    logger.info(f"🔍 Estrazione contenuto da: {url}")
    
    # Prima prova con Playwright async (se disponibile)
    try:
        logger.info("🔄 Tentativo con Playwright async...")
        from playwright.async_api import async_playwright
        
        async with async_playwright() as p:
            # Configurazione per Render
            browser_args = ['--no-sandbox', '--disable-dev-shm-usage']
            if os.getenv('RENDER'):
                browser_args.extend(['--disable-gpu', '--disable-web-security'])
            
            browser = await p.chromium.launch(
                headless=True,
                args=browser_args
            )
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()
            
            try:
                # Carica la pagina con timeout ridotto
                await page.goto(url, wait_until='domcontentloaded', timeout=15000)
                await page.wait_for_timeout(3000)
                
                # Scroll veloce per caricare contenuto lazy-loaded
                try:
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(1000)
                    await page.evaluate("window.scrollTo(0, 0)")
                    await page.wait_for_timeout(1000)
                except:
                    pass
                
                # Cerca e clicca su "Mostra di più" (veloce)
                try:
                    show_more_buttons = await page.query_selector_all("button")
                    for button in show_more_buttons[:10]:  # Solo primi 10 per velocità
                        try:
                            text = (await button.inner_text()).lower()
                            if 'mostra' in text or 'show' in text or 'più' in text or 'more' in text:
                                if await button.is_visible():
                                    await button.click()
                                    await page.wait_for_timeout(300)  # Attesa ridotta
                        except:
                            continue
                except:
                    pass
                
                # Estrai tutto il testo visibile
                all_text = await page.evaluate("""
                    () => {
                        const scripts = document.querySelectorAll('script, style, noscript');
                        scripts.forEach(el => el.remove());
                        return document.body.innerText || document.body.textContent || '';
                    }
                """)
                
                await browser.close()
                logger.info(f"✅ Playwright estratto: {len(all_text)} caratteri")
                return all_text
                
            except Exception as e:
                await browser.close()
                raise e
                
    except Exception as e:
        error_msg = str(e)
        if "Executable doesn't exist" in error_msg or "BrowserType.launch" in error_msg:
            logger.warning(f"⚠️ Browser Playwright non trovato: {error_msg}")
            logger.info("💡 Suggerimento: Esegui 'playwright install' per installare i browser")
        else:
            logger.warning(f"⚠️ Playwright fallito: {error_msg}")
        logger.info("🔄 Passo al fallback con requests...")
        
        # Fallback a requests (sincrono)
        try:
            from bs4 import BeautifulSoup
            import gzip
            
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            })
            
            response = session.get(url, timeout=30)
            
            # Gestisci compressione
            if response.headers.get('content-encoding') == 'gzip':
                try:
                    html_content = gzip.decompress(response.content).decode('utf-8')
                except:
                    html_content = response.text
            else:
                html_content = response.text
            
            # Parsing con BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            all_text = soup.get_text()
            
            logger.info(f"✅ Requests estratto: {len(all_text)} caratteri")
            return all_text
            
        except Exception as e:
            logger.error(f"❌ Entrambi i metodi falliti: {e}")
            raise HTTPException(status_code=500, detail=f"Impossibile estrarre contenuto: {str(e)}")

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crea le tabelle
Base.metadata.create_all(bind=engine)

# Inizializza app FastAPI
app = FastAPI(title="HostGPT API", version="1.0.0")

# Inizializza scheduler
scheduler = AsyncIOScheduler()

async def send_monthly_reports_job():
    """Job per inviare i report mensili"""
    try:
        logger.info("Starting monthly reports job...")
        
        # Crea una sessione database
        from database import SessionLocal
        db = SessionLocal()
        
        try:
            # Ottieni tutti gli utenti con abbonamento attivo
            active_users = db.query(User).filter(
                User.subscription_status.in_(['active', 'cancelling'])
            ).all()
            
            reports_sent = 0
            
            for user in active_users:
                try:
                    # Genera i dati del report
                    report_data = generate_monthly_report_data(user.id, db)
                    
                    # Crea l'email
                    email_body = create_monthly_report_email_simple(
                        user_name=user.full_name or user.email,
                        report_data=report_data,
                        language=user.language or "it"
                    )
                    
                    email_subject = "Your Monthly OspiterAI Report 📊" if (user.language or "it") == "en" else "Il tuo Report Mensile OspiterAI 📊"
                    
                    # Invia l'email
                    await send_email(
                        to_email=user.email,
                        subject=email_subject,
                        body=email_body
                    )
                    
                    reports_sent += 1
                    logger.info(f"Monthly report sent to user {user.id}")
                    
                except Exception as e:
                    logger.error(f"Error sending report to user {user.id}: {e}")
                    continue
            
            logger.info(f"Monthly reports job completed: {reports_sent} reports sent")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error in monthly reports job: {e}")

# Configura il job mensile
scheduler.add_job(
    send_monthly_reports_job,
    trigger=CronTrigger(day=1, hour=9, minute=0),  # Ogni primo del mese alle 9:00
    id='monthly_reports',
    name='Send Monthly Reports',
    replace_existing=True
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL, 
        "http://localhost:3000",
        "https://*.vercel.app",  # Permette richieste da Vercel
        "https://hostgpt-docker.onrender.com",  # Dominio specifico Render
        "https://hostgpt.vercel.app",  # Dominio specifico Vercel
        "https://ospiterai.it",  # Dominio di produzione
        "https://www.ospiterai.it"  # Dominio di produzione con www
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware personalizzato per debug CORS
@app.middleware("http")
async def cors_debug_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    
    # Debug CORS solo in modalità sviluppo e per richieste non comuni
    if settings.DEBUG:
        common_endpoints = [
            "/api/guardian/alerts",
            "/api/guardian/statistics", 
            "/api/guardian/status",
            "/api/auth/me"
        ]
        
        should_debug = (
            request.method != "OPTIONS" and 
            not any(request.url.path.startswith(endpoint) for endpoint in common_endpoints)
        )
        
        if should_debug:
            print(f"🌐 CORS Debug - Origin: {origin}")
            print(f"🌐 CORS Debug - Method: {request.method}")
            print(f"🌐 CORS Debug - Path: {request.url.path}")
    
    # Gestisci richieste OPTIONS (preflight) senza debug spam
    if request.method == "OPTIONS":
        return JSONResponse(
            content={"message": "CORS preflight successful"},
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin or "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
                "Access-Control-Allow-Credentials": "true"
            }
        )
    
    response = await call_next(request)
    
    # Aggiungi header CORS personalizzati se necessario
    if origin and origin in [
        "https://ospiterai.it",
        "https://www.ospiterai.it", 
        "https://ospiterai.vercel.app",
        "https://hostgpt.ospiterai.it"
    ]:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    
    return response

# Eventi di startup e shutdown
@app.on_event("startup")
async def startup_event():
    """Avvia il scheduler all'avvio dell'app"""
    scheduler.start()
    logger.info("Scheduler started - Monthly reports will be sent on the 1st of each month at 9:00 AM")

@app.on_event("shutdown")
async def shutdown_event():
    """Ferma il scheduler allo shutdown dell'app"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")

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

# ============= Funzioni per gestione ospiti =============

def validate_phone_number(phone: str) -> bool:
    """Valida il formato del numero di telefono con prefisso internazionale"""
    import re
    # Formato: +[prefisso internazionale][numero] (prefisso 1-4 cifre + numero 6-15 cifre)
    # Supporta tutti i prefissi internazionali del mondo
    pattern = r'^\+\d{1,4}\d{6,15}$'
    return bool(re.match(pattern, phone))

def validate_email_format(email: str) -> bool:
    """Valida il formato dell'email"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def find_or_create_guest(phone: Optional[str], email: Optional[str], 
                        chatbot_id: int, first_name: Optional[str] = None, last_name: Optional[str] = None, 
                        db: Session = None) -> Guest:
    """Trova un ospite esistente o ne crea uno nuovo"""
    
    # Validazione input base
    if not phone and not email:
        raise ValueError("Almeno uno tra telefono ed email deve essere fornito")
    
    if phone and not validate_phone_number(phone):
        raise ValueError("Formato numero di telefono non valido. Usa il formato +[prefisso internazionale][numero] (es. +39XXXXXXXXX, +1XXXXXXXXXX)")
    
    if email and not validate_email_format(email):
        raise ValueError("Formato email non valido")
    
    # PRIMA controlla se l'ospite esiste già per questo chatbot specifico
    chatbot_guest = None
    if phone:
        chatbot_guest = db.query(ChatbotGuest).join(Guest).filter(
            ChatbotGuest.chatbot_id == chatbot_id,
            Guest.phone == phone
        ).first()
    
    if not chatbot_guest and email:
        chatbot_guest = db.query(ChatbotGuest).join(Guest).filter(
            ChatbotGuest.chatbot_id == chatbot_id,
            Guest.email == email
        ).first()
    
    # Se l'ospite ESISTE per questo chatbot, aggiorna e restituisci
    if chatbot_guest:
        guest = chatbot_guest.guest
        # Aggiorna informazioni se fornite
        if phone and not guest.phone:
            guest.phone = phone
        if email and not guest.email:
            guest.email = email
        if first_name:
            guest.first_name = first_name
        if last_name:
            guest.last_name = last_name
        
        db.commit()
        db.refresh(guest)
        return guest
    
    # Se l'ospite NON ESISTE per questo chatbot, controlla se esiste globalmente
    existing_guest = None
    if phone:
        existing_guest = db.query(Guest).filter(Guest.phone == phone).first()
    
    if not existing_guest and email:
        existing_guest = db.query(Guest).filter(Guest.email == email).first()
    
    # Se l'ospite esiste globalmente ma non per questo chatbot
    if existing_guest:
        # Aggiorna informazioni se fornite
        if phone and not existing_guest.phone:
            existing_guest.phone = phone
        if email and not existing_guest.email:
            existing_guest.email = email
        if first_name:
            existing_guest.first_name = first_name
        if last_name:
            existing_guest.last_name = last_name
        
        db.commit()
        db.refresh(existing_guest)
        
        # Crea solo l'associazione chatbot-guest
        chatbot_guest = ChatbotGuest(
            chatbot_id=chatbot_id,
            guest_id=existing_guest.id
        )
        
        db.add(chatbot_guest)
        db.commit()
        
        return existing_guest
    
    # Se l'ospite NON ESISTE globalmente, richiedi ENTRAMBI i campi
    if not phone or not email:
        raise ValueError("Per i nuovi ospiti sono richiesti sia il numero di telefono che l'email")
    
    # Crea nuovo ospite
    guest = Guest(
        phone=phone,
        email=email,
        first_name=first_name,
        last_name=last_name
    )
    
    db.add(guest)
    db.commit()
    db.refresh(guest)
    
    # Crea associazione chatbot-guest
    chatbot_guest = ChatbotGuest(
        chatbot_id=chatbot_id,
        guest_id=guest.id
    )
    
    db.add(chatbot_guest)
    db.commit()
    
    return guest

def get_latest_guest_conversation(chatbot_id: int, guest_id: int, db: Session) -> Optional[Conversation]:
    """Ottiene l'ultima conversazione di un ospite per un chatbot specifico"""
    # Cerca per chatbot_id + guest_id (campo corretto nel database)
    conversation = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot_id,
        Conversation.guest_id == guest_id
    ).order_by(Conversation.started_at.desc()).first()
    
    if settings.DEBUG:
        logger.debug(f"🔍 [DEBUG] get_latest_guest_conversation per chatbot {chatbot_id} e guest_id {guest_id}: {conversation.id if conversation else 'None'}")
    return conversation

def is_guest_first_time(guest: Guest, chatbot_id: int, db: Session) -> bool:
    """Verifica se è la prima volta che l'ospite interagisce con questo chatbot"""
    # Controlla se esiste l'associazione chatbot-guest
    chatbot_guest = db.query(ChatbotGuest).filter(
        ChatbotGuest.chatbot_id == chatbot_id,
        ChatbotGuest.guest_id == guest.id
    ).first()
    
    # Se non c'è associazione, è sicuramente la prima volta
    if chatbot_guest is None:
        return True
    
    # Se c'è associazione, controlla se ha conversazioni
    # Se ha conversazioni, non è la prima volta
    existing_conversation = get_latest_guest_conversation(chatbot_id, guest.id, db)
    return existing_conversation is None




# OAuth2 bearer per estrarre il token dall'header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ============= Pydantic Models =============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str  # Now required
    wants_free_trial: Optional[bool] = False
    language: Optional[str] = "it"  # 'it' or 'en'
    desired_plan: Optional[str] = None  # STANDARD_PRICE_ID, PREMIUM_PRICE_ID, etc.

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatbotCreate(BaseModel):
    property_name: str
    property_type: str
    property_address: str
    property_street_number: str
    property_city: str
    property_state: Optional[str] = None
    property_postal_code: str
    property_country: str
    property_description: str
    check_in_time: str
    check_out_time: str
    house_rules: str
    amenities: List[str]
    neighborhood_description: str
    nearby_attractions: List[dict]
    transportation_info: Optional[str] = None
    restaurants_bars: List[dict]
    shopping_info: str
    emergency_contacts: List[dict]
    wifi_info: dict
    parking_info: str
    special_instructions: str
    faq: List[dict]
    welcome_message: str
    reviews_link: Optional[str] = None
    wifi_qr_code_data: Optional[bytes] = None
    wifi_qr_code_filename: Optional[str] = None
    wifi_qr_code_content_type: Optional[str] = None
    has_wifi_qr_code: Optional[bool] = None

class ChatbotUpdate(BaseModel):
    property_name: Optional[str] = None
    property_type: Optional[str] = None
    property_address: Optional[str] = None
    property_street_number: Optional[str] = None
    property_city: Optional[str] = None
    property_state: Optional[str] = None
    property_postal_code: Optional[str] = None
    property_country: Optional[str] = None
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
    reviews_link: Optional[str] = None
    wifi_qr_code_data: Optional[bytes] = None
    wifi_qr_code_filename: Optional[str] = None
    wifi_qr_code_content_type: Optional[str] = None
    has_wifi_qr_code: Optional[bool] = None

class ChatbotResponse(BaseModel):
    id: int
    user_id: int
    assistant_id: str
    uuid: str
    name: str
    property_name: str
    property_type: Optional[str]
    property_address: Optional[str]
    property_street_number: Optional[str]
    property_city: Optional[str]
    property_state: Optional[str]
    property_postal_code: Optional[str]
    property_country: Optional[str]
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
    reviews_link: Optional[str]
    wifi_qr_code_data: Optional[bytes]
    wifi_qr_code_filename: Optional[str]
    wifi_qr_code_content_type: Optional[str]
    has_wifi_qr_code: Optional[bool]
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
    guest_name: Optional[str] = None  # Mantenuto per compatibilità
    # Nuovi campi per identificazione ospite
    guest_id: Optional[int] = None  # ID del guest se già identificato
    phone: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    force_new_conversation: Optional[bool] = False  # True se l'ospite vuole una nuova conversazione

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

# Modelli per l'integrazione Hostaway
class HostawayApiKeyRequest(BaseModel):
    account_id: str
    api_key: str

class HostawayApartment(BaseModel):
    id: str
    name: str
    address: str

class HostawayMappingRequest(BaseModel):
    mappings: List[dict]  # Lista di {apartment_id: chatbot_id} o {apartment_id: None}

# OTP System Models
class ForgotPasswordRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp_code: str

class ResetPasswordRequest(BaseModel):
    phone: str
    otp_code: str
    new_password: str

# ============= Utility Functions =============

def verify_password(plain_password, hashed_password):
    # Tronca la password se è troppo lunga per bcrypt (72 byte max)
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Tronca la password se è troppo lunga per bcrypt (72 byte max)
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Funzioni per la crittografia delle API key
def get_encryption_key():
    """Genera o recupera la chiave di crittografia"""
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        # Genera una nuova chiave se non esiste
        key = Fernet.generate_key().decode()
        # In produzione, salva questa chiave in modo sicuro
        print(f"Generated new encryption key: {key}")
    return key.encode() if isinstance(key, str) else key

def encrypt_api_key(api_key: str) -> str:
    """Cripta l'API key"""
    f = Fernet(get_encryption_key())
    return f.encrypt(api_key.encode()).decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """Decripta l'API key"""
    f = Fernet(get_encryption_key())
    return f.decrypt(encrypted_key.encode()).decode()

# Funzioni per l'API Hostaway
async def get_hostaway_access_token(account_id: str, api_key: str) -> str:
    """Ottiene un access token da Hostaway usando Account ID e API Key"""
    try:
        url = "https://api.hostaway.com/v1/accessTokens"
        
        payload = {
            "accountId": account_id,
            "apiKey": api_key
        }
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        if 'result' in data and 'accessToken' in data['result']:
            return data['result']['accessToken']
        else:
            raise Exception("Access token non trovato nella risposta")
            
    except requests.RequestException as e:
        logger.error(f"Error getting Hostaway access token: {e}")
        raise HTTPException(status_code=400, detail="Errore nell'autenticazione con Hostaway. Verifica Account ID e API Key.")
    except Exception as e:
        logger.error(f"Unexpected error getting access token: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")

async def fetch_hostaway_apartments(access_token: str) -> List[dict]:
    """Recupera gli appartamenti da Hostaway usando l'access token"""
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # URL dell'API Hostaway per recuperare le proprietà
        url = "https://api.hostaway.com/v1/listings"
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        apartments = []
        
        # Estrai le informazioni degli appartamenti
        if 'result' in data:
            for listing in data['result']:
                apartments.append({
                    'id': str(listing.get('id', '')),
                    'name': listing.get('name', ''),
                    'address': listing.get('address', {}).get('full', '')
                })
        
        return apartments
        
    except requests.RequestException as e:
        logger.error(f"Error fetching Hostaway apartments: {e}")
        raise HTTPException(status_code=400, detail="Errore nel recuperare gli appartamenti da Hostaway")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")

async def get_valid_hostaway_token(user_id: int, db: Session) -> str:
    """Ottiene un token Hostaway valido dalla tabella users"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.hostaway_account_id or not user.hostaway_api_key:
        raise HTTPException(status_code=400, detail="Credenziali Hostaway non configurate")
    
    # Se abbiamo già un token, usalo (i token Hostaway durano 24 mesi)
    if user.hostaway_access_token:
        return decrypt_api_key(user.hostaway_access_token)
    
    # Altrimenti genera un nuovo token
    account_id = user.hostaway_account_id
    api_key = decrypt_api_key(user.hostaway_api_key)
    
    new_access_token = await get_hostaway_access_token(account_id, api_key)
    
    # Salva il nuovo token (criptato) nella tabella users
    encrypted_token = encrypt_api_key(new_access_token)
    user.hostaway_access_token = encrypted_token
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return new_access_token

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Debug solo in modalità sviluppo e solo per errori
    if settings.DEBUG:
        logger.debug(f"🔍 BACKEND: get_current_user chiamato")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            logger.error(f"❌ BACKEND: Email non trovata nel token")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"❌ BACKEND: Errore JWT: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        logger.error(f"❌ BACKEND: Utente non trovato per email: {email}")
        raise credentials_exception
    
    # Debug solo in modalità sviluppo
    if settings.DEBUG:
        logger.debug(f"🔍 BACKEND: Utente autenticato: {user.id} - {user.email}")
    
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

def send_email_background(to_email: str, subject: str, body: str, attachments: Optional[list[tuple[str, bytes, str]]] = None):
    """Funzione helper per inviare email in background senza background_tasks"""
    import asyncio
    try:
        # Crea un nuovo event loop se necessario
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Esegui l'invio email
        if loop.is_running():
            # Se il loop è già in esecuzione, crea un task
            asyncio.create_task(send_email(to_email, subject, body, attachments))
        else:
            # Se il loop non è in esecuzione, esegui direttamente
            loop.run_until_complete(send_email(to_email, subject, body, attachments))
            
        logger.info(f"Email queued for {to_email}")
    except Exception as e:
        logger.error(f"Failed to queue email for {to_email}: {e}")

def check_and_send_conversations_limit_warning(user: User, db: Session):
    """Controlla se rimangono meno del 10% delle conversazioni e invia avviso se necessario"""
    try:
        # Determina i limiti e l'utilizzo in base al tipo di abbonamento
        if user.subscription_status == 'free_trial':
            conversations_limit = user.free_trial_conversations_limit
            conversations_used = user.free_trial_conversations_used
        else:
            conversations_limit = user.conversations_limit
            conversations_used = user.conversations_used
        
        # Calcola le conversazioni rimanenti
        conversations_remaining = conversations_limit - conversations_used
        
        # Calcola la percentuale rimanente
        percentage_remaining = (conversations_remaining / conversations_limit) * 100 if conversations_limit > 0 else 0
        
        # Se rimangono meno del 10% delle conversazioni, invia l'avviso
        if percentage_remaining <= 10 and conversations_remaining > 0:
            logger.info(f"⚠️ Inviando avviso limite conversazioni per utente {user.id}: {conversations_remaining}/{conversations_limit} rimanenti ({percentage_remaining:.1f}%)")
            
            # Crea il contenuto dell'email
            email_body = create_conversations_limit_warning_email_simple(
                user_name=user.full_name,
                conversations_remaining=conversations_remaining,
                conversations_limit=conversations_limit,
                language=user.language or "it"
            )
            
            # Invia l'email
            email_subject = "⚠️ Conversations limit warning" if (user.language or "it") == "en" else "⚠️ Avviso limite conversazioni"
            send_email_background(
                to_email=user.email,
                subject=email_subject,
                body=email_body
            )
            
            logger.info(f"Email di avviso limite conversazioni inviata a {user.email}")
            return True
        else:
            logger.debug(f"Utente {user.id}: {conversations_remaining}/{conversations_limit} conversazioni rimanenti ({percentage_remaining:.1f}%) - nessun avviso necessario")
            return False
            
    except Exception as e:
        logger.error(f"Errore nel controllo limite conversazioni per utente {user.id}: {e}")
        return False

# ============= Monthly Report Service =============

def generate_monthly_report_data(user_id: int, db: Session, start_date: datetime = None, end_date: datetime = None) -> dict:
    """Genera i dati per il report mensile di un utente"""
    try:
        # Se non specificate, usa l'ultimo mese
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Ottieni tutti i chatbot dell'utente
        chatbots = db.query(Chatbot).filter(Chatbot.user_id == user_id).all()
        
        chatbot_data = []
        total_conversations = 0
        total_messages = 0
        
        for chatbot in chatbots:
            # Statistiche del chatbot per il periodo
            conversations_count = db.query(func.count(Conversation.id)).filter(
                Conversation.chatbot_id == chatbot.id,
                Conversation.started_at >= start_date,
                Conversation.started_at <= end_date
            ).scalar() or 0
            
            messages_count = db.query(func.count(Message.id)).join(Conversation).filter(
                Conversation.chatbot_id == chatbot.id,
                Message.timestamp >= start_date,
                Message.timestamp <= end_date,
                Message.role == "user"
            ).scalar() or 0
            
            avg_messages = messages_count / max(conversations_count, 1)
            
            chatbot_data.append({
                'name': chatbot.name,
                'conversations': conversations_count,
                'messages': messages_count,
                'avg_messages': avg_messages
            })
            
            total_conversations += conversations_count
            total_messages += messages_count
        
        # Statistiche Guardian (se l'utente ha Guardian attivo)
        guardian_stats = None
        user = db.query(User).filter(User.id == user_id).first()
        if user and is_guardian_active(user.guardian_subscription_status):
            guardian_stats = guardian_service.get_guardian_statistics(user_id, db)
        
        # Periodo del report
        period = f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}"
        
        return {
            'period': period,
            'chatbots': chatbot_data,
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'active_chatbots': len([c for c in chatbot_data if c['conversations'] > 0]),
            'guardian_stats': guardian_stats
        }
        
    except Exception as e:
        logger.error(f"Error generating monthly report data for user {user_id}: {e}")
        return {
            'period': 'Errore nel recupero dati',
            'chatbots': [],
            'total_conversations': 0,
            'total_messages': 0,
            'active_chatbots': 0,
            'guardian_stats': None
        }

# ============= Guardian Service =============

class GuardianService:
    """Servizio per l'analisi Guardian delle conversazioni"""
    
    def __init__(self):
        self.risk_threshold = 0.851  # Soglia di rischio per generare alert
        
    def analyze_conversation(self, conversation: Conversation, db: Session) -> dict:
        """
        Analizza una conversazione per determinare il rischio di recensione negativa
        Analizza SOLO l'ultimo messaggio dell'utente e l'ultima risposta del chatbot
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
            
            # Log del risultato dell'analisi (la creazione degli alert è gestita da analyze_conversation_with_guardian)
            if analysis_result['risk_score'] >= self.risk_threshold or insufficient_info:
                alert_reason = "insufficient_info" if insufficient_info else "high_risk"
                logger.warning(f"⚠️ INSUFFICIENT INFO DETECTED: Conversazione {conversation.id} - Chatbot ha risposto con mancanza di informazioni")
                logger.warning(f"🚨 ALERT GUARDIAN: Conversazione {conversation.id} - {alert_reason} - Rischio: {analysis_result['risk_score']:.3f}")
            else:
                logger.info(f"✅ Rischio basso per conversazione {conversation.id}: {analysis_result['risk_score']:.3f}")
            
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
    
    def _analyze_with_openai(self, conversation_text: str) -> dict:
        """Analizza il testo della conversazione con OpenAI"""
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
- Dice "Mi dispiace, non ho informazioni specifiche" per domande normali
- Dice "non ho informazioni specifiche su" per attività/negozi nella zona
- Suggerisce di "cercare online" o "visitare il negozio" per informazioni di base
- Suggerisce di "contattare Tommaso" o altri host per informazioni di base
- Dice "Ti consiglio di cercare online" per informazioni che dovrebbe avere

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

            response = openai.chat.completions.create(
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
    
    def _create_alert_message(self, conversation: Conversation, analysis_result: dict, language: str = "it") -> str:
        """Crea il messaggio dell'alert"""
        risk_score = analysis_result['risk_score']
        sentiment_score = analysis_result['sentiment_score']
        insufficient_info = analysis_result.get('insufficient_info', False)
        
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
            
            if insufficient_info:
                return f"{emoji} ALERT {urgency}: Chatbot insufficient information in conversation #{conversation.id}. Risk: {risk_score:.1%}. The chatbot responded with lack of information."
            else:
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
            
            if insufficient_info:
                return f"{emoji} ALERT {urgency}: Chatbot senza informazioni sufficienti nella conversazione #{conversation.id}. Rischio: {risk_score:.1%}. Il chatbot ha risposto con mancanza di informazioni."
            else:
                return f"{emoji} ALERT {urgency}: Ospite insoddisfatto rilevato nella conversazione #{conversation.id}. Rischio recensione negativa: {risk_score:.1%}. Sentiment: {sentiment_score:.2f}"
    
    def _create_suggested_action(self, analysis_result: dict, language: str = "it") -> str:
        """Crea l'azione suggerita basata sull'analisi"""
        key_issues = analysis_result.get('analysis_details', {}).get('key_issues', [])
        insufficient_info = analysis_result.get('insufficient_info', False)
        
        # Se è stato rilevato che il chatbot non ha abbastanza informazioni
        if insufficient_info:
            if language == "en":
                return "URGENT: The chatbot doesn't have enough information to respond. Immediately update the chatbot's information with missing details and contact the guest to provide direct assistance."
            else:
                return "URGENTE: Il chatbot non ha abbastanza informazioni per rispondere. Aggiorna immediatamente le informazioni del chatbot con i dettagli mancanti e contatta l'ospite per fornire assistenza diretta."
        
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
            is_insufficient_info = alert.alert_type == 'insufficient_info'
            if (user.language or "it") == "en":
                email_subject = "⚠️ GUARDIAN ALERT: Chatbot lacks sufficient information" if is_insufficient_info else "🚨 GUARDIAN ALERT: Unsatisfied guest detected"
            else:
                email_subject = "⚠️ ALERT GUARDIAN: Chatbot senza informazioni sufficienti" if is_insufficient_info else "🚨 ALERT GUARDIAN: Ospite insoddisfatto rilevato"
            send_email_background(
                to_email=user.email,
                subject=email_subject,
                body=email_body
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
            
            # Conta tutti gli alert creati per l'utente (conversazioni a rischio)
            total_alerts = db.query(GuardianAlert).filter(
                GuardianAlert.user_id == user_id
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
                'high_risk_guests': total_alerts,
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
            logger.info(f"📧 [DEBUG] Inizio invio email di risoluzione per conversazione {conversation.id}")
            
            # Recupera il guest
            guest = db.query(Guest).filter(Guest.id == conversation.guest_id).first()
            if not guest:
                logger.error(f"📧 [ERROR] Guest non trovato per conversazione {conversation.id}")
                return False
            if not guest.email:
                logger.error(f"📧 [ERROR] Guest {guest.id} non ha email per conversazione {conversation.id}")
                return False
            
            logger.info(f"📧 [DEBUG] Guest trovato: {guest.id}, email: {guest.email}")
            
            # Recupera tutti i messaggi della conversazione
            messages = db.query(Message).filter(
                Message.conversation_id == conversation.id
            ).order_by(Message.timestamp).all()
            
            # Recupera il chatbot per ottenere il link
            chatbot = db.query(Chatbot).filter(Chatbot.id == conversation.chatbot_id).first()
            if not chatbot:
                logger.error(f"📧 [ERROR] Chatbot non trovato per conversazione {conversation.id}")
                return False
            
            logger.info(f"📧 [DEBUG] Chatbot trovato: {chatbot.id}, UUID: {chatbot.uuid}")
            
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
            language = "it"
            
            # Costruisci il nome completo del guest
            guest_name = f"{guest.first_name or ''} {guest.last_name or ''}".strip() or 'Guest'
            
            if language == "en":
                subject = "Your conversation has been updated - HostGPT"
                content = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50;">Your conversation has been updated</h2>
    <p>Hello {guest_name},</p>
    <p>Your host has responded to your conversation. Here's the complete conversation:</p>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">{conversation_text}</pre>
    </div>
    
    <p>You can continue the conversation by clicking the link below:</p>
    <a href="{chat_link}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Continue Conversation</a>
    
    <p>Best regards,<br>The HostGPT Team</p>
</div>
"""
            else:  # Italiano
                subject = "La tua conversazione è stata aggiornata - HostGPT"
                content = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50;">La tua conversazione è stata aggiornata</h2>
    <p>Ciao {guest_name},</p>
    <p>Il tuo host ha risposto alla tua conversazione. Ecco la conversazione completa:</p>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">{conversation_text}</pre>
    </div>
    
    <p>Puoi continuare la conversazione cliccando il link qui sotto:</p>
    <a href="{chat_link}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Continua Conversazione</a>
    
    <p>Cordiali saluti,<br>Il Team HostGPT</p>
</div>
"""
            
            # Invia l'email
            logger.info(f"📧 [DEBUG] Invio email a {guest.email} con subject: {subject}")
            logger.info(f"📧 [DEBUG] Contenuto email (primi 200 caratteri): {content[:200]}...")
            
            success = send_email_background(
                to_email=guest.email,
                subject=subject,
                body=content
            )
            
            if success:
                logger.info(f"Email di risoluzione inviata al guest {guest.email} per conversazione {conversation.id}")
            else:
                logger.error(f"Errore nell'invio dell'email di risoluzione al guest {guest.email} per conversazione {conversation.id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Errore nell'invio dell'email di risoluzione per conversazione {conversation.id}: {e}")
            return False

# Istanza globale del servizio Guardian
guardian_service = GuardianService()

# Cache in memoria per ridurre le query al database
guardian_cache = {}
CACHE_DURATION = 30  # 30 secondi di cache

def get_cached_data(cache_key: str):
    """Recupera dati dalla cache se validi"""
    if cache_key in guardian_cache:
        data, timestamp = guardian_cache[cache_key]
        if time.time() - timestamp < CACHE_DURATION:
            return data
        else:
            # Cache scaduta, rimuovi
            del guardian_cache[cache_key]
    return None

def set_cached_data(cache_key: str, data):
    """Salva dati nella cache"""
    guardian_cache[cache_key] = (data, time.time())

def invalidate_user_cache(user_id: int):
    """Invalida la cache per un utente specifico"""
    cache_keys_to_remove = []
    for key in guardian_cache.keys():
        if f"_{user_id}" in key:
            cache_keys_to_remove.append(key)
    
    for key in cache_keys_to_remove:
        del guardian_cache[key]
        logger.info(f"Cache invalidata per utente {user_id}: {key}")

def generate_qr_code(url: str, icon_data: bytes = None) -> str:
    """Genera QR code e ritorna come base64"""
    import io  # Importa io all'inizio della funzione
    import os
    
    qr = qrcode.QRCode(version=1, box_size=15, border=5)  # Aumentato box_size per QR code più grande
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Sempre aggiungi l'icona HostGPT al centro del QR code
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Carica l'icona HostGPT
        hostgpt_icon_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons', 'logoospiterai.png')
        
        if os.path.exists(hostgpt_icon_path):
            # Carica l'icona HostGPT così com'è
            icon_img = Image.open(hostgpt_icon_path)
            
            # Ridimensiona l'icona (raddoppiata)
            qr_size = img.size[0]
            icon_size = qr_size // 3  # Raddoppiata: da 1/6 a 1/3
            
            # Solo se il QR code è abbastanza grande (almeno 200px)
            if qr_size >= 200:
                # Ridimensiona semplicemente l'icona
                icon_img = icon_img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
                
                # Converti il QR code in RGBA per supportare la trasparenza
                qr_with_icon = img.convert('RGBA')
                
                # Posiziona l'icona al centro del QR code
                x = (qr_size - icon_size) // 2
                y = (qr_size - icon_size) // 2
                qr_with_icon.paste(icon_img, (x, y), icon_img)
                
                # Converti di nuovo in RGB per il salvataggio
                img = qr_with_icon.convert('RGB')
            else:
                print(f"QR code troppo piccolo ({qr_size}px) per aggiungere icona senza compromettere la scansione")
        else:
            print(f"Icona OspiterAI non trovata in: {hostgpt_icon_path}")
    except Exception as e:
        print(f"Errore nell'aggiunta dell'icona OspiterAI al QR code: {e}")
        # Se c'è un errore, usa il QR code normale
    
    # Aggiungi l'immagine text.png sotto il QR code
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Carica l'immagine text.png
        text_image_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons', 'text.png')
        
        if os.path.exists(text_image_path):
            # Carica l'immagine text.png
            text_img = Image.open(text_image_path)
            
            # Calcola le dimensioni per l'immagine del testo (30% più piccola)
            qr_width = img.size[0]
            text_width = int(qr_width * 0.7)  # 30% più piccola (0.7 = 70% della dimensione originale)
            text_height = text_img.size[1] * (text_width // text_img.size[0])  # Mantieni proporzioni
            
            # Ridimensiona l'immagine del testo
            text_img = text_img.resize((text_width, text_height), Image.Resampling.LANCZOS)
            
            # Crea l'immagine finale
            final_width = qr_width
            final_height = img.size[1] + text_height
            
            final_img = Image.new('RGB', (final_width, final_height), 'white')
            
            # Incolla il QR code nella parte superiore
            final_img.paste(img, (0, 0))
            
            # Incolla l'immagine del testo sotto il QR code (centrata)
            text_x = (final_width - text_width) // 2  # Centra orizzontalmente
            final_img.paste(text_img, (text_x, img.size[1]), text_img)
            
            img = final_img
        else:
            print(f"Immagine text.png non trovata in: {text_image_path}")
        
    except Exception as e:
        print(f"Errore nell'aggiunta dell'immagine text.png: {e}")
        # Se c'è un errore, usa l'immagine senza testo
    
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
        
        LINK RECENSIONI:
        {f"- Link recensioni: {chatbot_data['reviews_link']}" if chatbot_data.get('reviews_link') else "- Nessun link recensioni fornito"}
        
        IMPORTANTE: Se è presente un link recensioni, quando prevedi di usarlo usa SEMPRE quel link specifico nelle tue risposte, non usare mai link generici.
        
        IMPORTANTE: Rispondi sempre nella stessa lingua in cui l'utente ti scrive. Se l'utente scrive in italiano, rispondi in italiano. Se scrive in inglese, rispondi in inglese. Se scrive in spagnolo, rispondi in spagnolo, e così via per qualsiasi lingua.
        Sii cordiale, utile e fornisci informazioni accurate basate sui dati forniti.
        Se non hai informazioni su qualcosa o non sei sicuro della risposta, devi dire di contattare l'host. Se nei contatti di emergenza c'è un numero dell'host, includilo nel messaggio.
        
        ISTRUZIONI SPECIALI PER LE RECENSIONI:
        Se è stato fornito un link alle recensioni, OGNI TANTO durante la conversazione mostra questo URL per lasciare una recensione. 
        REGOLE OBBLIGATORIE E FONDAMENTALI:
        1. NON mettere NESSUN carattere accanto all'URL (niente parentesi "(", ")", quadre "[", "]", apici, doppi apici, punti, virgole, due punti, trattini, ecc.)
        2. Il link deve essere DISTACCATO da ogni altro carattere
        3. Deve avere a SINISTRA uno spazio " " e a DESTRA un altro spazio " "
        4. Esempio CORRETTO: " Se hai apprezzato il soggiorno, lascia una recensione qui https://ospiterai.it grazie!"
        5. Esempio SBAGLIATO: "Lascia una recensione qui:(https://ospiterai.it) grazie!"
        6. Esempio SBAGLIATO: "Lascia una recensione qui: https://ospiterai.it, grazie!"
        7. Esempio SBAGLIATO: "Lascia una recensione qui:https://ospiterai.it grazie!"
        QUESTO È FONDAMENTALE E OBBLIGATORIO. RISPETTA SEMPRE QUESTE REGOLE.
        """
        
        # Crea l'assistant (Assistants v2)
        assistant = client.beta.assistants.create(
            name=f"Assistente {chatbot_data['property_name']}",
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

        LINK RECENSIONI:
        {f"- Link recensioni: {chatbot.reviews_link}" if chatbot.reviews_link else "- Nessun link recensioni fornito"}
        
        IMPORTANTE: Se è presente un link recensioni, usa SEMPRE quel link specifico nelle tue risposte, non usare mai link generici.

        IMPORTANTE: Rispondi sempre nella stessa lingua in cui l'utente ti scrive. Se l'utente scrive in italiano, rispondi in italiano. Se scrive in inglese, rispondi in inglese. Se scrive in spagnolo, rispondi in spagnolo, e così via per qualsiasi lingua.
        Sii cordiale, utile e fornisci informazioni accurate basate sui dati forniti.
        Se non hai informazioni su qualcosa o non sei sicuro della risposta, devi dire di contattare l'host. Se nei contatti di emergenza c'è un numero dell'host, includilo nel messaggio.
        
        ISTRUZIONI SPECIALI PER LE RECENSIONI:
        Se è stato fornito un link alle recensioni, OGNI TANTO durante la conversazione mostra questo URL per lasciare una recensione. 
        REGOLE OBBLIGATORIE E FONDAMENTALI:
        1. NON mettere NESSUN carattere accanto all'URL (niente parentesi "(", ")", quadre "[", "]", apici, doppi apici, punti, virgole, due punti, trattini, ecc.)
        2. Il link deve essere DISTACCATO da ogni altro carattere
        3. Deve avere a SINISTRA uno spazio " " e a DESTRA un altro spazio " "
        4. Esempio CORRETTO: " Se hai apprezzato il soggiorno, lascia una recensione qui https://ospiterai.it grazie!"
        5. Esempio SBAGLIATO: "Lascia una recensione qui:(https://ospiterai.it) grazie!"
        6. Esempio SBAGLIATO: "Lascia una recensione qui: https://ospiterai.it, grazie!"
        7. Esempio SBAGLIATO: "Lascia una recensione qui:https://ospiterai.it grazie!"
        QUESTO È FONDAMENTALE E OBBLIGATORIO. RISPETTA SEMPRE QUESTE REGOLE.
        """
    except Exception as e:
        logger.error(f"Error building instructions: {e}")
        return ""

# ============= API Endpoints =============

@app.get("/")
async def root():
    return {"message": "OspiterAI API v1.0", "status": "active"}

# --- Authentication ---

@app.post("/api/auth/register")
async def register(user: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Registrazione nuovo utente"""
    # Verifica se l'email esiste già
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    # Verifica se il numero di telefono esiste già
    phone_user = db.query(User).filter(User.phone == user.phone).first()
    if phone_user:
        raise HTTPException(status_code=400, detail="Numero di telefono già registrato")
    
    # Valida il numero di telefono
    import re
    if not re.match(r'^\+[1-9]\d{1,14}$', user.phone.replace(' ', '').replace('-', '')):
        raise HTTPException(status_code=400, detail="Numero di telefono non valido. Inserisci un numero con prefisso internazionale (es. +39 123 456 7890)")
    
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
        language=user.language or "it",  # Salva la lingua preferita dell'utente
        desired_plan=user.desired_plan  # Salva il piano desiderato
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Invia email di verifica
    verification_link = f"{settings.BACKEND_URL}/api/auth/verify-email?token={verification_token}"
    
    
    # Scegli il template in base al tipo di registrazione e lingua
    user_language = user.language or "it"
    if user.wants_free_trial:
        email_body = create_free_trial_welcome_email_simple(user.full_name, verification_link, user_language)
        email_subject = "Welcome to your free trial - OspiterAI" if user_language == "en" else "Benvenuto nel tuo periodo di prova gratuito - OspiterAI"
    else:
        email_body = create_welcome_email_simple(user.full_name, verification_link, user_language)
        email_subject = "Confirm your email - OspiterAI" if user_language == "en" else "Conferma la tua email - OspiterAI"
    
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
        user.free_trial_conversations_used = 0
        user.free_trial_converted = False
        user.messages_used = 0
        user.messages_reset_date = now
        user.conversations_used = 0
        user.conversations_reset_date = now
        
        # Imposta il limite di chatbot a 1 per il free trial
        user.max_chatbots = 1
        
        db.commit()
        
        # Reindirizza al login (l'email di benvenuto è già stata inviata durante la registrazione)
        login_url = f"{settings.FRONTEND_URL}/login?verified=true&free_trial_started=true"
        return RedirectResponse(url=login_url)
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

@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Invia OTP per il reset della password"""
    # Cerca l'utente per numero di telefono
    db_user = db.query(User).filter(User.phone == request.phone).first()
    
    if not db_user:
        # Per sicurezza, non rivelare se il numero esiste o meno
        return {"message": "Se il numero di telefono è registrato, riceverai un SMS con il codice di verifica."}
    
    # Genera OTP
    otp_code = sms_service.generate_otp()
    otp_expires = datetime.utcnow() + timedelta(minutes=10)
    
    # Salva OTP nel database
    db_user.otp_code = otp_code
    db_user.otp_expires_at = otp_expires
    db_user.otp_attempts = 0
    db.commit()
    
    # Invia SMS
    success = sms_service.send_otp_sms(
        phone_number=request.phone,
        otp_code=otp_code,
        language=db_user.language or 'it'
    )
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Errore nell'invio del SMS. Riprova più tardi."
        )
    
    return {"message": "SMS inviato con successo. Controlla il tuo telefono."}

@app.post("/api/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verifica il codice OTP"""
    db_user = db.query(User).filter(User.phone == request.phone).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    # Controlla se l'OTP è scaduto
    if not db_user.otp_expires_at or datetime.utcnow() > db_user.otp_expires_at:
        raise HTTPException(status_code=400, detail="Codice OTP scaduto")
    
    # Controlla tentativi massimi
    if db_user.otp_attempts >= 3:
        raise HTTPException(status_code=400, detail="Troppi tentativi falliti. Richiedi un nuovo codice.")
    
    # Verifica il codice
    if db_user.otp_code != request.otp_code:
        db_user.otp_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Codice OTP non valido")
    
    return {"message": "Codice OTP verificato con successo"}

@app.post("/api/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset della password con OTP"""
    db_user = db.query(User).filter(User.phone == request.phone).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    # Controlla se l'OTP è scaduto
    if not db_user.otp_expires_at or datetime.utcnow() > db_user.otp_expires_at:
        raise HTTPException(status_code=400, detail="Codice OTP scaduto")
    
    # Controlla tentativi massimi
    if db_user.otp_attempts >= 3:
        raise HTTPException(status_code=400, detail="Troppi tentativi falliti. Richiedi un nuovo codice.")
    
    # Verifica il codice
    if db_user.otp_code != request.otp_code:
        db_user.otp_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Codice OTP non valido")
    
    # Valida la nuova password
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="La password deve essere almeno 8 caratteri")
    
    # Aggiorna la password
    db_user.hashed_password = get_password_hash(request.new_password)
    db_user.otp_code = None
    db_user.otp_expires_at = None
    db_user.otp_attempts = 0
    db.commit()
    
    return {"message": "Password aggiornata con successo"}

@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Ottieni informazioni utente corrente"""
    db = next(get_db())
    
    # Controlla se deve essere resettato il conteggio mensile dei messaggi
    if current_user.messages_reset_date:
        if datetime.utcnow() > current_user.messages_reset_date + timedelta(days=30):
            current_user.messages_used = 0
            current_user.messages_reset_date = datetime.utcnow()
            db.commit()
    
    # Controlla se deve essere resettato il conteggio mensile delle conversazioni
    if current_user.conversations_reset_date:
        if datetime.utcnow() > current_user.conversations_reset_date + timedelta(days=30):
            current_user.conversations_used = 0
            current_user.conversations_reset_date = datetime.utcnow()
            db.commit()
    
    # Calcola messaggi rimanenti in base al tipo di abbonamento
    if current_user.subscription_status == 'free_trial':
        messages_remaining = get_free_trial_messages_remaining(current_user)
        messages_limit = current_user.free_trial_messages_limit
        messages_used = current_user.free_trial_messages_used
        conversations_limit = current_user.free_trial_conversations_limit
        conversations_used = current_user.free_trial_conversations_used
    else:
        messages_remaining = current_user.messages_limit - current_user.messages_used
        messages_limit = current_user.messages_limit
        messages_used = current_user.messages_used
        conversations_limit = current_user.conversations_limit
        conversations_used = current_user.conversations_used
    
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
        "conversations_limit": conversations_limit,
        "conversations_used": conversations_used,
        "is_verified": current_user.is_verified,
        "guardian_subscription_status": current_user.guardian_subscription_status,
        "guardian_subscription_end_date": current_user.guardian_subscription_end_date,
        # Free trial info
        "free_trial_start_date": current_user.free_trial_start_date.isoformat() if current_user.free_trial_start_date else None,
        "free_trial_end_date": current_user.free_trial_end_date.isoformat() if current_user.free_trial_end_date else None,
        "free_trial_messages_limit": current_user.free_trial_messages_limit,
        "free_trial_messages_used": current_user.free_trial_messages_used,
        "free_trial_conversations_limit": current_user.free_trial_conversations_limit,
        "free_trial_conversations_used": current_user.free_trial_conversations_used,
        "free_trial_converted": current_user.free_trial_converted,
        "is_free_trial_active": is_free_trial_active(current_user),
        # Referral code info
        "referral_code_used": current_user.referral_code.code if current_user.referral_code else None,
        "referral_code_used_at": current_user.referral_code_used_at.isoformat() if current_user.referral_code_used_at else None,
        # Language preference
        "language": current_user.language or "it",
        # Desired plan for checkout
        "desired_plan": current_user.desired_plan
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

# --- Webhook Stripe ---

@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Gestisce i webhook di Stripe per eventi di abbonamento"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # Verifica la firma del webhook
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            logger.error("Invalid payload")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Gestisci l'evento
        logger.info(f"🔍 [DEBUG] Processing event type: {event['type']}")
        if event['type'] == 'checkout.session.completed':
            logger.info(f"🔍 [DEBUG] Calling handle_checkout_session_completed")
            await handle_checkout_session_completed(event, db)
            logger.info(f"✅ [DEBUG] handle_checkout_session_completed completed")
        elif event['type'] == 'invoice.payment_succeeded':
            await handle_invoice_payment_succeeded(event, db)
        elif event['type'] == 'customer.subscription.updated':
            await handle_subscription_updated(event, db)
        elif event['type'] == 'customer.subscription.deleted':
            await handle_subscription_deleted(event, db)
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

async def handle_checkout_session_completed(event, db: Session):
    """Gestisce il completamento di una sessione di checkout"""
    try:
        logger.info("🔍 [DEBUG] Starting handle_checkout_session_completed")
        
        session = event['data']['object']
        customer_id = session['customer']
        subscription_type = session.get('metadata', {}).get('subscription_type', 'hostgpt')
        
        logger.info(f"🔍 [DEBUG] Processing checkout.session.completed for customer {customer_id}, type: {subscription_type}")
        logger.info(f"🔍 [DEBUG] Session data: {session}")
        
        # Trova l'utente
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if not user:
            logger.error(f"❌ [DEBUG] User not found for customer {customer_id}")
            return
        
        logger.info(f"✅ [DEBUG] Found user {user.id} for customer {customer_id}")
        logger.info(f"🔍 [DEBUG] User current state - conversations_limit: {user.conversations_limit}, subscription_status: {user.subscription_status}")
        
        # Recupera la sottoscrizione direttamente dalla sessione
        subscription_id = session.get('subscription')
        if not subscription_id:
            logger.error(f"❌ [DEBUG] No subscription ID found in session for customer {customer_id}")
            return
            
        logger.info(f"🔍 [DEBUG] Retrieving subscription {subscription_id}")
        subscription = stripe.Subscription.retrieve(subscription_id)
        logger.info(f"✅ [DEBUG] Retrieved subscription {subscription.id} for user {user.id}")
        
        # DEBUG: Analizza la subscription per capire il piano
        logger.info(f"🔍 [DEBUG] Subscription details:")
        logger.info(f"🔍 [DEBUG] - ID: {subscription.id}")
        logger.info(f"🔍 [DEBUG] - Status: {subscription.status}")
        logger.info(f"🔍 [DEBUG] - Current period end: {subscription.current_period_end}")
        
        # Aggiorna l'utente in base al tipo di sottoscrizione
        logger.info(f"🔍 [DEBUG] Updating user {user.id} for subscription type: {subscription_type}")
        
        if subscription_type == 'guardian':
            # Aggiorna solo i campi Guardian
            user.guardian_stripe_subscription_id = subscription.id
            user.guardian_subscription_status = 'active'
            user.guardian_subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)
            logger.info(f"🔍 [DEBUG] Guardian subscription activated for user {user.id}: {subscription.id}")
        else:
            # Aggiorna i campi HostGPT (comportamento esistente)
            user.stripe_subscription_id = subscription.id
            user.subscription_status = 'active'
            user.subscription_end_date = datetime.utcfromtimestamp(subscription.current_period_end)
            user.free_trial_converted = True
            logger.info(f"🔍 [DEBUG] OspiterAI subscription activated for user {user.id}: {subscription.id}")
        
        # DEBUG: Determina il piano in base all'amount dalla sessione (solo per HostGPT)
        if subscription_type != 'guardian':
            # Usa l'amount dalla sessione che è più affidabile
            try:
                amount = session.get('amount_total', 0)  # Amount in centesimi dalla sessione
                logger.info(f"🔍 [DEBUG] Found amount from session: {amount} cents")
                
                # Determina il piano in base all'amount (in centesimi)
                if amount == 1:  # 1 centesimo per test
                    user.conversations_limit = 20
                    logger.info(f"🔍 [DEBUG] Test amount (1 cent), using STANDARD plan - conversations_limit: 20")
                elif amount in [1900, 19000]:  # 19€ o 190€
                    user.conversations_limit = 20
                    logger.info(f"🔍 [DEBUG] Amount {amount} (19€/190€), using STANDARD plan - conversations_limit: 20")
                elif amount in [3900, 39000]:  # 39€ o 390€
                    user.conversations_limit = 50
                    logger.info(f"🔍 [DEBUG] Amount {amount} (39€/390€), using PREMIUM plan - conversations_limit: 50")
                elif amount in [7900, 79000]:  # 79€ o 790€
                    user.conversations_limit = 150
                    logger.info(f"🔍 [DEBUG] Amount {amount} (79€/790€), using PRO plan - conversations_limit: 150")
                elif amount in [19900, 199000]:  # 199€ o 1990€
                    user.conversations_limit = 500
                    logger.info(f"🔍 [DEBUG] Amount {amount} (199€/1990€), using ENTERPRISE plan - conversations_limit: 500")
                else:
                    user.conversations_limit = 20
                    logger.warning(f"⚠️ [DEBUG] Unknown amount {amount}, using default STANDARD plan - conversations_limit: 20")
            except Exception as e:
                logger.error(f"❌ [DEBUG] Error determining plan from session amount: {e}")
                user.conversations_limit = 20  # Fallback
                logger.info(f"🔍 [DEBUG] Using fallback STANDARD plan - conversations_limit: 20")
            
            # Reset solo se necessario (primo abbonamento o rinnovo mensile)
            reset_conversations_counter_if_needed(user, db)
            user.max_chatbots = 100
        
        logger.info(f"🔍 [DEBUG] Final user state before commit:")
        logger.info(f"🔍 [DEBUG] - conversations_limit: {user.conversations_limit}")
        logger.info(f"🔍 [DEBUG] - conversations_used: {user.conversations_used}")
        logger.info(f"🔍 [DEBUG] - max_chatbots: {user.max_chatbots}")
        logger.info(f"🔍 [DEBUG] - subscription_status: {user.subscription_status}")
        
        db.commit()
        logger.info(f"✅ [DEBUG] Database committed successfully")
        
        logger.info(f"✅ [DEBUG] User {user.id} subscription activated: {subscription.id}, conversations_limit: {user.conversations_limit}")
            
    except Exception as e:
        logger.error(f"Error processing checkout.session.completed: {e}")

async def handle_invoice_payment_succeeded(event, db: Session):
    """Gestisce il pagamento di una fattura (rinnovo mensile)"""
    try:
        invoice = event['data']['object']
        subscription_id = invoice.get('subscription')
        
        # Se non c'è subscription diretto, controlla nel parent
        if not subscription_id and 'parent' in invoice:
            parent = invoice['parent']
            if parent and parent.get('type') == 'subscription_details':
                subscription_id = parent.get('subscription_details', {}).get('subscription')
        
        logger.info(f"Subscription ID from invoice: {subscription_id}")
        
        if not subscription_id:
            logger.warning("No subscription ID found in invoice - this might be a one-time payment")
            return
        
        # Trova l'utente
        user = db.query(User).filter(User.stripe_subscription_id == subscription_id).first()
        if not user:
            logger.error(f"User not found for subscription {subscription_id}")
            return
        
        # NON resettare conversations_used automaticamente - preserva il conteggio
        # Solo resetta i messaggi se necessario
        if not user.messages_reset_date or (datetime.utcnow() - user.messages_reset_date).days >= 30:
            user.messages_used = 0
            user.messages_reset_date = datetime.utcnow()
        
        # Assicura che il limite di chatbot sia sempre 100 per abbonamenti attivi
        user.max_chatbots = 100
        
        db.commit()
        logger.info(f"Reset conversations for user {user.id} on invoice payment")
        
    except Exception as e:
        logger.error(f"Error handling invoice payment: {e}")

async def handle_subscription_updated(event, db: Session):
    """Gestisce l'aggiornamento di un abbonamento (cambio piano)"""
    try:
        subscription = event['data']['object']
        subscription_id = subscription['id']
        
        # Trova l'utente
        user = db.query(User).filter(User.stripe_subscription_id == subscription_id).first()
        if not user:
            logger.error(f"User not found for subscription {subscription_id}")
            return
        
        # Aggiorna i limiti in base al nuovo piano
        if subscription['items']['data']:
            price_id = subscription['items']['data'][0]['price']['id']
            new_limit = get_conversations_limit_by_price_id(price_id)
            old_limit = user.conversations_limit
            
            # Aggiorna solo il limite, NON resettare il conteggio
            user.conversations_limit = new_limit
            
            # Assicura che il limite di chatbot sia sempre 100 per abbonamenti attivi
            user.max_chatbots = 100
            
            db.commit()
            logger.info(f"Updated limits for user {user.id}: {old_limit} -> {new_limit} conversations")
            
            # Invia email di conferma upgrade solo se il limite è cambiato
            if old_limit != new_limit:
                try:
                    old_plan = get_plan_name_by_limit(old_limit)
                    new_plan = get_plan_name_by_limit(new_limit)
                    
                    email_body = create_plan_upgrade_confirmation_email_simple(
                        user_name=user.full_name or user.email,
                        old_plan=old_plan,
                        new_plan=new_plan,
                        new_limit=new_limit,
                        language=user.language or "it"
                    )
                    
                    email_subject = f"Plan upgraded to {new_plan} - OspiterAI" if (user.language or "it") == "en" else f"Piano aggiornato a {new_plan} - OspiterAI"
                    
                    # Invia email in background
                    send_email_background(
                        to_email=user.email,
                        subject=email_subject,
                        body=email_body
                    )
                    
                    logger.info(f"Plan upgrade confirmation email sent to {user.email}: {old_plan} -> {new_plan}")
                    
                except Exception as e:
                    logger.error(f"Failed to send plan upgrade confirmation email: {e}")
        
    except Exception as e:
        logger.error(f"Error handling subscription update: {e}")

async def handle_subscription_deleted(event, db: Session):
    """Gestisce la cancellazione di un abbonamento"""
    try:
        subscription = event['data']['object']
        subscription_id = subscription['id']
        
        # Trova l'utente
        user = db.query(User).filter(User.stripe_subscription_id == subscription_id).first()
        if not user:
            logger.error(f"User not found for subscription {subscription_id}")
            return
        
        # Aggiorna lo stato
        user.subscription_status = 'cancelled'
        user.subscription_end_date = datetime.utcnow()
        
        db.commit()
        logger.info(f"Cancelled subscription for user {user.id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription deletion: {e}")

# --- Subscription/Payment ---

@app.post("/api/subscription/create-checkout")
async def create_checkout_session(
    request: Optional[dict] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Crea sessione di checkout Stripe con piano personalizzato"""
    try:
        logger.info(f"Starting checkout process for user {current_user.id} (email: {current_user.email})")
        logger.info(f"User subscription status: {current_user.subscription_status}")
        logger.info(f"User is verified: {current_user.is_verified}")
        
        # Determina il price_id da usare
        price_id_to_use = settings.STRIPE_PRICE_ID  # Default
        
        # Mappa i price_id del frontend ai veri price_id di Stripe
        # Crea sempre una mappatura completa, indipendentemente dalla configurazione
        price_id_mapping = {
            'STANDARD_PRICE_ID': settings.STRIPE_STANDARD_PRICE_ID,  # 19€/mese
            'PREMIUM_PRICE_ID': settings.STRIPE_PREMIUM_PRICE_ID,  # 39€/mese
            'PRO_PRICE_ID': settings.STRIPE_PRO_PRICE_ID,  # 79€/mese
            'ENTERPRISE_PRICE_ID': settings.STRIPE_ENTERPRISE_PRICE_ID,  # 199€/mese
            'ANNUAL_STANDARD_PRICE_ID': settings.STRIPE_ANNUAL_STANDARD_PRICE_ID,  # 190€/anno
            'ANNUAL_PREMIUM_PRICE_ID': settings.STRIPE_ANNUAL_PREMIUM_PRICE_ID,  # 390€/anno
            'ANNUAL_PRO_PRICE_ID': settings.STRIPE_ANNUAL_PRO_PRICE_ID,  # 790€/anno
            'ANNUAL_ENTERPRISE_PRICE_ID': settings.STRIPE_ANNUAL_ENTERPRISE_PRICE_ID,  # 1990€/anno
        }
        
        # Log per debug - mostra i price_id configurati
        logger.info(f"Configured price_ids: STANDARD_PRICE_ID={settings.STRIPE_STANDARD_PRICE_ID}, PREMIUM_PRICE_ID={settings.STRIPE_PREMIUM_PRICE_ID}, ANNUAL_PREMIUM_PRICE_ID={settings.STRIPE_ANNUAL_PREMIUM_PRICE_ID}")
        logger.info(f"All Stripe price_ids: {settings.STRIPE_STANDARD_PRICE_ID}, {settings.STRIPE_PREMIUM_PRICE_ID}, {settings.STRIPE_PRO_PRICE_ID}, {settings.STRIPE_ENTERPRISE_PRICE_ID}")
        logger.info(f"All Annual price_ids: {settings.STRIPE_ANNUAL_STANDARD_PRICE_ID}, {settings.STRIPE_ANNUAL_PREMIUM_PRICE_ID}, {settings.STRIPE_ANNUAL_PRO_PRICE_ID}, {settings.STRIPE_ANNUAL_ENTERPRISE_PRICE_ID}")
        
        # Debug delle variabili d'ambiente
        import os
        logger.info(f"Environment variables check:")
        logger.info(f"STRIPE_PREMIUM_PRICE_ID from os.getenv: {os.getenv('STRIPE_PREMIUM_PRICE_ID')}")
        logger.info(f"STRIPE_ANNUAL_PREMIUM_PRICE_ID from os.getenv: {os.getenv('STRIPE_ANNUAL_PREMIUM_PRICE_ID')}")
        logger.info(f"All env vars starting with STRIPE: {[k for k in os.environ.keys() if k.startswith('STRIPE')]}")
        
        if request and 'price_id' in request:
            # Caso 1: Arrivo da selezione servizi con parametri URL
            requested_price_id = request['price_id']
            billing_param = request.get('billing', 'monthly')
            
            # Determina il price_id corretto basandosi sui parametri
            logger.info(f"DEBUG: Original requested_price_id: {requested_price_id}, billing_param: {billing_param}")
            
            if billing_param == 'annual' and not requested_price_id.startswith('ANNUAL_'):
                # Se è annuale ma il price_id non ha il prefisso ANNUAL_, aggiungilo
                requested_price_id = f"ANNUAL_{requested_price_id}"
                logger.info(f"DEBUG: Added ANNUAL_ prefix: {requested_price_id}")
            elif billing_param == 'monthly' and requested_price_id.startswith('ANNUAL_'):
                # Se è mensile ma il price_id ha il prefisso ANNUAL_, rimuovilo
                requested_price_id = requested_price_id.replace('ANNUAL_', '')
                logger.info(f"DEBUG: Removed ANNUAL_ prefix: {requested_price_id}")
            
            logger.info(f"DEBUG: Final requested_price_id: {requested_price_id}")
            logger.info(f"DEBUG: Available price_id_mapping keys: {list(price_id_mapping.keys())}")
            
            if requested_price_id in price_id_mapping:
                price_id_to_use = price_id_mapping[requested_price_id]
                logger.info(f"Using URL price_id: {requested_price_id} -> {price_id_to_use} (billing: {billing_param})")
            else:
                logger.warning(f"Unknown price_id requested: {requested_price_id}, using default")
                
        elif current_user.desired_plan:
            # Caso 2: Arrivo da email di verifica, usa il desired_plan dell'utente
            desired_plan = current_user.desired_plan
            
            # Se il desired_plan è già un price_id valido, usalo direttamente
            if desired_plan in price_id_mapping:
                price_id_to_use = price_id_mapping[desired_plan]
                logger.info(f"Using desired_plan directly: {desired_plan} -> {price_id_to_use}")
            else:
                # Se non è un price_id valido, prova a costruirlo
                # Esempio: se desired_plan è "ENTERPRISE_PRICE_ID" e billing è "annual", diventa "ANNUAL_ENTERPRISE_PRICE_ID"
                logger.warning(f"desired_plan {desired_plan} not found in mapping, using default")
        
        # Validazione configurazione price_id
        if not price_id_to_use or not price_id_to_use.startswith("price_") or "your-monthly" in price_id_to_use:
            logger.error("Invalid price_id configuration")
            raise HTTPException(
                status_code=400,
                detail=(
                    "Configurazione Stripe mancante o non valida: price_id. "
                    "Imposta un Price ID ricorrente valido nelle variabili d'ambiente del backend."
                ),
            )

        # Verifica che l'utente abbia verificato l'email
        if not current_user.is_verified:
            logger.error(f"User {current_user.id} is not verified")
            raise HTTPException(status_code=400, detail="Devi verificare la tua email prima di sottoscrivere un abbonamento")
        
        # Se ha già un abbonamento attivo, gestisci l'upgrade invece di creare un nuovo checkout
        if current_user.subscription_status == 'active':
            logger.info(f"User {current_user.id} has active subscription, handling upgrade")
            
            # Verifica che abbia un subscription_id valido
            if not current_user.stripe_subscription_id:
                logger.error(f"User {current_user.id} has active status but no subscription_id")
                raise HTTPException(status_code=400, detail="Errore: abbonamento non valido")
            
            # Recupera la sottoscrizione da Stripe
            try:
                subscription = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
                logger.info(f"Retrieved subscription {subscription.id} for user {current_user.id}")
            except Exception as e:
                logger.error(f"Error retrieving subscription {current_user.stripe_subscription_id}: {e}")
                raise HTTPException(status_code=400, detail="Errore nel recupero dell'abbonamento")
            
            # Aggiorna la sottoscrizione con il nuovo price_id
            try:
                # Recupera l'item della sottoscrizione
                subscription_item = subscription['items']['data'][0]
                
                # Aggiorna la sottoscrizione con il nuovo price
                updated_subscription = stripe.Subscription.modify(
                    current_user.stripe_subscription_id,
                    items=[{
                        'id': subscription_item.id,
                        'price': price_id_to_use,
                    }],
                    proration_behavior='create_prorations'
                )
                
                logger.info(f"Successfully updated subscription {current_user.stripe_subscription_id} to price {price_id_to_use}")
                
                # Aggiorna i limiti nel database
                new_limit = get_conversations_limit_by_price_id(price_id_to_use)
                old_limit = current_user.conversations_limit
                current_user.conversations_limit = new_limit
                current_user.max_chatbots = 100
                db.commit()
                
                logger.info(f"Updated user {current_user.id} limits: {old_limit} -> {new_limit} conversations")
                
                return {
                    "status": "upgraded",
                    "message": "Abbonamento aggiornato con successo",
                    "new_limit": new_limit,
                    "old_limit": old_limit
                }
                
            except Exception as e:
                logger.error(f"Error updating subscription: {e}")
                raise HTTPException(status_code=400, detail=f"Errore nell'aggiornamento dell'abbonamento: {str(e)}")
        
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
        
        # Usa il price_id determinato sopra
        price_id = price_id_to_use
        logger.info(f"Using price_id: {price_id} for user {current_user.id}")
        
        # Crea Checkout Session per subscription con price_id
        logger.info(f"Creating checkout session for user {current_user.id} with price_id: {price_id}")
        
        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/checkout",
            metadata={
                'user_id': str(current_user.id),
                'subscription_type': 'hostgpt',
            },
        )
        
        logger.info(f"Checkout session created successfully: {checkout_session.id}")
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
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
        
        # Imposta i limiti in base al piano scelto
        conversations_limit = get_conversations_limit_by_price_id(price_id)
        current_user.conversations_limit = conversations_limit
        # Reset solo se necessario (primo abbonamento o rinnovo mensile)
        reset_conversations_counter_if_needed(current_user, db)
        
        # Imposta il limite di chatbot a 100 per tutti gli abbonamenti
        current_user.max_chatbots = 100
        
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
    "🎉 OspiterAI Subscription activated successfully!" if (current_user.language or "it") == "en" else "🎉 Abbonamento OspiterAI attivato con successo!", 
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
        
        logger.info(f"OspiterAI price ID: {hostgpt_price_id}")
        logger.info(f"Guardian price ID: {guardian_price_id}")
        
        if not hostgpt_price_id or not guardian_price_id:
            raise HTTPException(status_code=400, detail="Price IDs non trovati nel Payment Intent")
        
        # Crea sottoscrizione HostGPT
        logger.info("Creating OspiterAI subscription...")
        hostgpt_subscription = stripe.Subscription.create(
            customer=current_user.stripe_customer_id,
            items=[{'price': hostgpt_price_id}],
            payment_settings={'save_default_payment_method': 'on_subscription'},
            expand=['latest_invoice.payment_intent'],
        )
        logger.info(f"OspiterAI subscription created: {hostgpt_subscription.id}")
        
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
    """Crea checkout per il pacchetto combinato OspiterAI + Guardian"""
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
                        if sub.items.data and len(sub.items.data) > 0:
                            price_id = sub.items.data[0].price.id
                            # Controlla se è un abbonamento OspiterAI
                            if (price_id == settings.STRIPE_PRICE_ID or 
                                price_id == settings.STRIPE_ANNUAL_PRICE_ID or
                                price_id == settings.STRIPE_STANDARD_PRICE_ID or
                                price_id == settings.STRIPE_PREMIUM_PRICE_ID or
                                price_id == settings.STRIPE_PRO_PRICE_ID or
                                price_id == settings.STRIPE_ENTERPRISE_PRICE_ID or
                                price_id == settings.STRIPE_ANNUAL_STANDARD_PRICE_ID or
                                price_id == settings.STRIPE_ANNUAL_PREMIUM_PRICE_ID or
                                price_id == settings.STRIPE_ANNUAL_PRO_PRICE_ID or
                                price_id == settings.STRIPE_ANNUAL_ENTERPRISE_PRICE_ID):
                                hostgpt_subscription = sub
                            # Controlla se è un abbonamento Guardian
                            elif (price_id == settings.STRIPE_GUARDIAN_PRICE_ID or  # Legacy
                                  price_id == settings.STRIPE_STANDARD_GUARDIAN_PRICE_ID or
                                  price_id == settings.STRIPE_PREMIUM_GUARDIAN_PRICE_ID or
                                  price_id == settings.STRIPE_PRO_GUARDIAN_PRICE_ID or
                                  price_id == settings.STRIPE_ENTERPRISE_GUARDIAN_PRICE_ID):
                                guardian_subscription = sub
                    
                    # Aggiorna HostGPT subscription
                    if hostgpt_subscription:
                        user.stripe_subscription_id = hostgpt_subscription.id
                        user.subscription_status = 'active'
                        user.subscription_end_date = datetime.utcfromtimestamp(hostgpt_subscription.current_period_end)
                        user.free_trial_converted = True
                        logger.info(f"User {user.id} OspiterAI subscription activated: {hostgpt_subscription.id}")
                    
                    # Aggiorna Guardian subscription
                    if guardian_subscription:
                        user.guardian_stripe_subscription_id = guardian_subscription.id
                        user.guardian_subscription_status = 'active'
                        user.guardian_subscription_end_date = datetime.utcfromtimestamp(guardian_subscription.current_period_end)
                        logger.info(f"User {user.id} Guardian subscription activated: {guardian_subscription.id}")
                    
                    db.commit()
                    logger.info(f"User {user.id} combined subscription completed successfully")
                    
                    # Invia email di conferma acquisto
                    email_body = create_purchase_confirmation_email_simple(
                        user_name=user.full_name or user.email,
                        subscription_type="combined",
                        amount="38€",
                        language=user.language or "it"
                    )
                    email_subject = "Purchase completed successfully - OspiterAI" if (user.language or "it") == "en" else "Acquisto completato con successo - OspiterAI"
                    
                    send_email_background(
                        to_email=user.email,
                        subject=email_subject,
                        body=email_body
                    )
                    
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
                        
                        # Determina il prezzo Guardian basato sul price ID
                        guardian_price = "9€"  # Default
                        if subscription.items.data and len(subscription.items.data) > 0:
                            price_id = subscription.items.data[0].price.id
                            if price_id == settings.STRIPE_ENTERPRISE_GUARDIAN_PRICE_ID:
                                guardian_price = "89€"
                            elif price_id == settings.STRIPE_PRO_GUARDIAN_PRICE_ID:
                                guardian_price = "36€"
                            elif price_id == settings.STRIPE_PREMIUM_GUARDIAN_PRICE_ID:
                                guardian_price = "18€"
                            elif price_id == settings.STRIPE_STANDARD_GUARDIAN_PRICE_ID or price_id == settings.STRIPE_GUARDIAN_PRICE_ID:
                                guardian_price = "9€"
                        
                        # Invia email di conferma acquisto Guardian
                        email_body = create_purchase_confirmation_email_simple(
                            user_name=user.full_name or user.email,
                            subscription_type="guardian",
                            amount=guardian_price,
                            language=user.language or "it"
                        )
                        email_subject = "Purchase completed successfully - OspiterAI" if (user.language or "it") == "en" else "Acquisto completato con successo - OspiterAI"
                        
                        send_email_background(
                            to_email=user.email,
                            subject=email_subject,
                            body=email_body
                        )
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
                        
                        logger.info(f"User {user.id} OspiterAI subscription updated with new subscription_id: {session['subscription']}")
                        
                        # Invia email di conferma acquisto HostGPT
                        email_body = create_purchase_confirmation_email_simple(
                            user_name=user.full_name or user.email,
                            subscription_type="hostgpt",
                            amount="19€",
                            language=user.language or "it"
                        )
                        email_subject = "Purchase completed successfully - OspiterAI" if (user.language or "it") == "en" else "Acquisto completato con successo - OspiterAI"
                        
                        send_email_background(
                            to_email=user.email,
                            subject=email_subject,
                            body=email_body
                        )
                    
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
                logger.info(f"User {user_hostgpt.id} OspiterAI subscription completely cancelled")
        
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
                logger.info(f"WEBHOOK OspiterAI: User {user_hostgpt.id} OspiterAI subscription updated - status: {subscription['status']}, cancel_at_period_end: {subscription.get('cancel_at_period_end', False)}")
                
                # Gestisci upgrade del piano se ci sono items nella subscription
                if subscription['status'] == 'active' and 'items' in subscription and subscription['items']['data']:
                    price_id = subscription['items']['data'][0]['price']['id']
                    new_limit = get_conversations_limit_by_price_id(price_id)
                    old_limit = user_hostgpt.conversations_limit
                    
                    # Aggiorna il limite se è cambiato
                    if old_limit != new_limit:
                        user_hostgpt.conversations_limit = new_limit
                        user_hostgpt.max_chatbots = 100  # Assicura che il limite di chatbot sia sempre 100
                        
                        logger.info(f"WEBHOOK OspiterAI: User {user_hostgpt.id} plan upgraded: {old_limit} -> {new_limit} conversations")
                        
                        # Invia email di conferma upgrade
                        try:
                            old_plan = get_plan_name_by_limit(old_limit)
                            new_plan = get_plan_name_by_limit(new_limit)
                            
                            email_body = create_plan_upgrade_confirmation_email_simple(
                                user_name=user_hostgpt.full_name or user_hostgpt.email,
                                old_plan=old_plan,
                                new_plan=new_plan,
                                new_limit=new_limit,
                                language=user_hostgpt.language or "it"
                            )
                            
                            email_subject = f"Plan upgraded to {new_plan} - OspiterAI" if (user_hostgpt.language or "it") == "en" else f"Piano aggiornato a {new_plan} - OspiterAI"
                            
                            send_email_background(
                                to_email=user_hostgpt.email,
                                subject=email_subject,
                                body=email_body
                            )
                            
                            logger.info(f"WEBHOOK OspiterAI: Plan upgrade confirmation email sent to {user_hostgpt.email}: {old_plan} -> {new_plan}")
                            
                        except Exception as e:
                            logger.error(f"WEBHOOK OspiterAI: Failed to send plan upgrade confirmation email: {e}")
                
                # Aggiorna lo stato dell'abbonamento HostGPT nel database
                if subscription['status'] == 'active':
                    # Se l'abbonamento è attivo ma ha cancel_at_period_end=True, è in fase di cancellazione
                    if subscription.get('cancel_at_period_end', False):
                        user_hostgpt.subscription_status = 'cancelling'
                        logger.info(f"WEBHOOK OspiterAI: User {user_hostgpt.id} OspiterAI subscription marked as cancelling (cancel_at_period_end=True)")
                    else:
                        user_hostgpt.subscription_status = 'active'
                        logger.info(f"WEBHOOK OspiterAI: User {user_hostgpt.id} OspiterAI subscription reactivated (cancel_at_period_end=False)")
                    
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
                    logger.info(f"WEBHOOK OspiterAI: User {user_hostgpt.id} OspiterAI subscription completely cancelled")
                
                db.commit()
                logger.info(f"WEBHOOK OspiterAI: User {user_hostgpt.id} OspiterAI subscription status updated to: {subscription['status']}")
    
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
        logger.info(f"🔍 [DEBUG] Starting subscription confirm for user {current_user.id}")
        session_id = payload.session_id
        logger.info(f"🔍 [DEBUG] Session ID: {session_id}")
        
        # Se viene passato un session_id, recupera i dettagli della sessione
        if session_id:
            logger.info(f"🔍 [DEBUG] Retrieving session {session_id}")
            session = stripe.checkout.Session.retrieve(session_id)
            logger.info(f"🔍 [DEBUG] Session retrieved: {session}")
            
            if session and session.get('customer') == current_user.stripe_customer_id and session.get('subscription'):
                logger.info(f"🔍 [DEBUG] Session valid, updating user {current_user.id}")
                current_user.stripe_subscription_id = session['subscription']
                current_user.subscription_status = 'active'
                current_user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
                current_user.messages_used = 0
                current_user.messages_reset_date = datetime.utcnow()
                
                # DEBUG: Determina il piano in base all'amount dalla sessione
                try:
                    amount = session.get('amount_total', 0)  # Amount in centesimi dalla sessione
                    logger.info(f"🔍 [DEBUG] Found amount from session: {amount} cents")
                    
                    # Determina il piano in base all'amount (in centesimi)
                    if amount == 1:  # 1 centesimo per test
                        current_user.conversations_limit = 20
                        logger.info(f"🔍 [DEBUG] Test amount (1 cent), using STANDARD plan - conversations_limit: 20")
                    elif amount in [1900, 19000]:  # 19€ o 190€
                        current_user.conversations_limit = 20
                        logger.info(f"🔍 [DEBUG] Amount {amount} (19€/190€), using STANDARD plan - conversations_limit: 20")
                    elif amount in [3900, 39000]:  # 39€ o 390€
                        current_user.conversations_limit = 50
                        logger.info(f"🔍 [DEBUG] Amount {amount} (39€/390€), using PREMIUM plan - conversations_limit: 50")
                    elif amount in [7900, 79000]:  # 79€ o 790€
                        current_user.conversations_limit = 150
                        logger.info(f"🔍 [DEBUG] Amount {amount} (79€/790€), using PRO plan - conversations_limit: 150")
                    elif amount in [19900, 199000]:  # 199€ o 1990€
                        current_user.conversations_limit = 500
                        logger.info(f"🔍 [DEBUG] Amount {amount} (199€/1990€), using ENTERPRISE plan - conversations_limit: 500")
                    else:
                        current_user.conversations_limit = 20
                        logger.warning(f"⚠️ [DEBUG] Unknown amount {amount}, using default STANDARD plan - conversations_limit: 20")
                except Exception as e:
                    logger.error(f"❌ [DEBUG] Error determining plan from session amount: {e}")
                    current_user.conversations_limit = 20  # Fallback
                    logger.info(f"🔍 [DEBUG] Using fallback STANDARD plan - conversations_limit: 20")
                
                # Reset solo se necessario (primo abbonamento o rinnovo mensile)
                reset_conversations_counter_if_needed(current_user, db)
                current_user.max_chatbots = 100
                
                logger.info(f"🔍 [DEBUG] Final user state before commit:")
                logger.info(f"🔍 [DEBUG] - conversations_limit: {current_user.conversations_limit}")
                logger.info(f"🔍 [DEBUG] - conversations_used: {current_user.conversations_used}")
                logger.info(f"🔍 [DEBUG] - max_chatbots: {current_user.max_chatbots}")
                
                db.commit()
                logger.info(f"✅ [DEBUG] Database committed successfully")
                
                # Invia email di attivazione abbonamento
                email_body = create_subscription_activation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
                background_tasks.add_task(
                    send_email, 
                    current_user.email, 
"🎉 OspiterAI Subscription Activated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento OspiterAI Attivato!", 
                    email_body
                )
                
                return {
                    "success": True,
                    "status": "active",
                    "user": {
                        "id": current_user.id,
                        "email": current_user.email,
                        "full_name": current_user.full_name,
                        "subscription_status": current_user.subscription_status,
                        "conversations_limit": current_user.conversations_limit,
                        "conversations_used": current_user.conversations_used,
                        "max_chatbots": current_user.max_chatbots
                    }
                }

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
        "🎉 OspiterAI Subscription Activated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento OspiterAI Attivato!", 
                            email_body
                        )
                    
                    return {
                        "success": True,
                        "status": "active",
                        "user": {
                            "id": current_user.id,
                            "email": current_user.email,
                            "full_name": current_user.full_name,
                            "subscription_status": current_user.subscription_status,
                            "conversations_limit": current_user.conversations_limit,
                            "conversations_used": current_user.conversations_used,
                            "max_chatbots": current_user.max_chatbots
                        }
                    }
                elif sub.status in ['active', 'trialing'] and sub.cancel_at_period_end:
                    # L'abbonamento è attivo ma in fase di cancellazione
                    logger.info(f"User {current_user.id} has subscription in cancellation phase")
                    return {
                        "success": True,
                        "status": "cancelling",
                        "user": {
                            "id": current_user.id,
                            "email": current_user.email,
                            "full_name": current_user.full_name,
                            "subscription_status": current_user.subscription_status,
                            "conversations_limit": current_user.conversations_limit,
                            "conversations_used": current_user.conversations_used,
                            "max_chatbots": current_user.max_chatbots
                        }
                    }

        return {
            "success": True,
            "status": current_user.subscription_status or 'inactive',
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "full_name": current_user.full_name,
                "subscription_status": current_user.subscription_status,
                "conversations_limit": current_user.conversations_limit,
                "conversations_used": current_user.conversations_used,
                "max_chatbots": current_user.max_chatbots
            }
        }
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
            email_body = create_subscription_reactivation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
            background_tasks.add_task(
                send_email, 
                current_user.email, 
"🎉 OspiterAI Subscription Reactivated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento OspiterAI Riattivato!", 
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
"😔 OspiterAI Subscription Cancelled" if (current_user.language or "it") == "en" else "😔 Abbonamento OspiterAI Annullato", 
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

def generate_wifi_qr_code(wifi_info: dict) -> Optional[bytes]:
    """Genera un QR code WiFi basato sulle informazioni WiFi fornite"""
    try:
        # Estrai le informazioni WiFi
        ssid = wifi_info.get('network', '').strip()
        password = wifi_info.get('password', '').strip()
        
        # Se non ci sono informazioni WiFi valide, non generare il QR code
        if not ssid or not password:
            logger.info("No valid WiFi information provided, skipping QR code generation")
            return None
        
        # Genera il QR code WiFi
        qr_code = wifi_qrcode_generator.generator.wifi_qrcode(
            ssid=ssid,
            hidden=False,  # Assumiamo che la rete non sia nascosta
            authentication_type='WPA',  # Assumiamo WPA/WPA2
            password=password
        )
        
        # Converti in bytes
        img_buffer = io.BytesIO()
        qr_code.make_image().save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        logger.info(f"WiFi QR code generated successfully for network: {ssid}")
        return img_buffer.getvalue()
        
    except Exception as e:
        logger.error(f"Error generating WiFi QR code: {str(e)}")
        return None

@app.post("/api/chatbots/create")
async def create_chatbot(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    # Form data - campi obbligatori
    property_name: str = Form(...),
    property_type: str = Form(...),
    property_address: str = Form(...),
    property_street_number: str = Form(...),
    property_city: str = Form(...),
    property_postal_code: str = Form(...),
    property_country: str = Form(...),
    property_description: str = Form(...),
    check_in_time: str = Form(...),
    check_out_time: str = Form(...),
    house_rules: str = Form(...),
    neighborhood_description: str = Form(...),
    welcome_message: str = Form(...),
    # Form data - campi opzionali con valori di default
    property_state: str = Form(default=""),
    transportation_info: str = Form(default=""),
    amenities: str = Form(default="[]"),
    nearby_attractions: str = Form(default="[]"),
    restaurants_bars: str = Form(default="[]"),
    shopping_info: str = Form(default=""),
    emergency_contacts: str = Form(default="[]"),
    wifi_info: str = Form(default="{}"),
    parking_info: str = Form(default=""),
    special_instructions: str = Form(default=""),
    faq: str = Form(default="[]"),
    property_url: str = Form(default=""),
    reviews_link: str = Form(default=""),
    # File upload
    icon: Optional[UploadFile] = File(None)
):
    """Crea un nuovo chatbot"""
    # Genera automaticamente il nome del chatbot
    name = f"Assistente {property_name}"
    
    # Validazione lunghezza reviews_link
    if reviews_link and len(reviews_link) > 1000:
        raise HTTPException(
            status_code=400, 
            detail="Il link delle recensioni è troppo lungo. Massimo 1000 caratteri consentiti."
        )
    
    # Debug: stampa i dati ricevuti
    print(f"🚀 Backend: Ricevuti dati per creazione chatbot:")
    print(f"  name: {name} (generato automaticamente)")
    print(f"  property_name: {property_name}")
    print(f"  property_type: {property_type}")
    print(f"  property_address: {property_address}")
    print(f"  property_street_number: {property_street_number}")
    print(f"  property_city: {property_city}")
    print(f"  property_state: {property_state}")
    print(f"  property_postal_code: {property_postal_code}")
    print(f"  property_country: {property_country}")
    print(f"  property_description: {property_description}")
    print(f"  check_in_time: {check_in_time}")
    print(f"  check_out_time: {check_out_time}")
    print(f"  house_rules: {house_rules}")
    print(f"  neighborhood_description: {neighborhood_description}")
    print(f"  transportation_info: {transportation_info}")
    print(f"  welcome_message: {welcome_message}")
    print(f"  amenities: {amenities}")
    print(f"  nearby_attractions: {nearby_attractions}")
    print(f"  restaurants_bars: {restaurants_bars}")
    print(f"  shopping_info: {shopping_info}")
    print(f"  emergency_contacts: {emergency_contacts}")
    print(f"  wifi_info: {wifi_info}")
    print(f"  parking_info: {parking_info}")
    print(f"  special_instructions: {special_instructions}")
    print(f"  faq: {faq}")
    print(f"  property_url: {property_url}")
    print(f"  reviews_link: {reviews_link}")
    print(f"  icon: {icon}")
    
    # Verifica abbonamento attivo
    if not is_subscription_active(current_user.subscription_status):
        raise HTTPException(
            status_code=403, 
            detail="Devi attivare un abbonamento per creare un chatbot. Abbonamento mensile: 19€/mese"
        )
    
    # Controlla il limite di chatbot per l'utente
    existing_count = db.query(Chatbot).filter(Chatbot.user_id == current_user.id).count()
    max_allowed = current_user.max_chatbots or 1  # Default 1 se il campo è null
    
    if existing_count >= max_allowed:
        raise HTTPException(
            status_code=403, 
            detail=f"Limite chatbot raggiunto. Puoi creare massimo {max_allowed} chatbot con il tuo piano."
        )
    
    # Validazione dati specifici
    # Verifica che ci sia almeno un contatto di emergenza valido
    try:
        emergency_contacts_list = json.loads(emergency_contacts) if emergency_contacts else []
        valid_contacts = [c for c in emergency_contacts_list if c.get('name', '').strip() and c.get('number', '').strip()]
        if not valid_contacts:
            raise HTTPException(
                status_code=400, 
                detail="È richiesto almeno un contatto di emergenza (nome e numero). Aggiungi il tuo numero di telefono come host."
            )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400, 
            detail="Formato contatti di emergenza non valido"
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
        "property_street_number": property_street_number,
        "property_city": property_city,
        "property_state": property_state,
        "property_postal_code": property_postal_code,
        "property_country": property_country,
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
        "welcome_message": welcome_message,
        "reviews_link": reviews_link if reviews_link else ""
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
        property_street_number=property_street_number,
        property_city=property_city,
        property_state=property_state,
        property_postal_code=property_postal_code,
        property_country=property_country,
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
        reviews_link=reviews_link if reviews_link else None,
        icon_data=icon_data,
        icon_filename=icon_filename,
        icon_content_type=icon_content_type,
        has_icon=icon_data is not None
    )
    db.add(db_chatbot)
    db.commit()
    db.refresh(db_chatbot)
    
    # Genera QR code WiFi se le informazioni WiFi sono disponibili
    try:
        if wifi_info_dict and wifi_info_dict.get('network') and wifi_info_dict.get('password'):
            logger.info(f"Generating WiFi QR code for chatbot: {db_chatbot.property_name}")
            wifi_qr_code_data = generate_wifi_qr_code(wifi_info_dict)
            if wifi_qr_code_data:
                db_chatbot.wifi_qr_code_data = wifi_qr_code_data
                db_chatbot.wifi_qr_code_filename = f"wifi_qr_{db_chatbot.uuid}.png"
                db_chatbot.wifi_qr_code_content_type = "image/png"
                db_chatbot.has_wifi_qr_code = True
                db.commit()
                logger.info(f"WiFi QR code generated and saved for chatbot: {db_chatbot.property_name}")
            else:
                logger.info(f"No WiFi QR code generated for chatbot: {db_chatbot.property_name}")
        else:
            logger.info(f"No WiFi information provided for chatbot: {db_chatbot.property_name}")
    except Exception as e:
        logger.error(f"Failed to generate WiFi QR code for chatbot {db_chatbot.id}: {str(e)}")
        # Non bloccare la creazione del chatbot se il QR code WiFi fallisce
    
    # Genera PDF delle regole della casa e salvalo nel database
    try:
        logger.info(f"Generating house rules PDF for chatbot: {db_chatbot.property_name}")
        pdf_bytes = generate_house_rules_pdf(db_chatbot, "IT")  # Genera sempre in italiano di default
        db_chatbot.house_rules_pdf_data = pdf_bytes
        db.commit()
        logger.info(f"House rules PDF generated and saved for chatbot: {db_chatbot.property_name}")
    except Exception as e:
        logger.error(f"Failed to generate house rules PDF for chatbot {db_chatbot.id}: {str(e)}")
        # Non bloccare la creazione del chatbot se il PDF fallisce
    
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
    
    # Titolo email multilingua
    email_subject = "Your Chatbot is ready! 🤖" if (current_user.language or "it") == "en" else "Il tuo Chatbot è pronto! 🤖"
    background_tasks.add_task(send_email, current_user.email, email_subject, email_body, attachments)
    
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
        "monthly_price": "19€"
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
            detail="Abbonamento non attivo. Sottoscrivi un abbonamento mensile a 19€ per accedere alle funzionalità."
        )
    
    # Ottieni chatbot di proprietà dell'utente
    owned_chatbots = db.query(Chatbot).filter(Chatbot.user_id == current_user.id).all()
    
    # Ottieni chatbot dove l'utente è collaboratore
    collaborated_chatbots = db.query(Chatbot).join(
        ChatbotCollaborator, Chatbot.id == ChatbotCollaborator.chatbot_id
    ).filter(
        ChatbotCollaborator.user_id == current_user.id
    ).all()
    
    # Combina i chatbot (rimuovi duplicati se ce ne sono)
    all_chatbot_ids = set()
    chatbots = []
    
    for bot in owned_chatbots:
        if bot.id not in all_chatbot_ids:
            chatbots.append(bot)
            all_chatbot_ids.add(bot.id)
    
    for bot in collaborated_chatbots:
        if bot.id not in all_chatbot_ids:
            chatbots.append(bot)
            all_chatbot_ids.add(bot.id)
    
    # Calcola informazioni sui limiti
    current_count = len(chatbots)
    max_allowed = current_user.max_chatbots or 1
    can_create_new = current_count < max_allowed
    
    result = []
    for bot in chatbots:
        chat_url = f"{settings.FRONTEND_URL}/chat/{bot.uuid}"
        
        # Calcola statistiche reali dal database
        total_conversations = db.query(func.count(Conversation.id)).filter(
            Conversation.chatbot_id == bot.id
        ).scalar()
        
        total_messages = db.query(func.count(Message.id)).join(Conversation).filter(
            Conversation.chatbot_id == bot.id,
            Message.role == "user"
        ).scalar()
        
        # Determina se l'utente è proprietario o collaboratore
        is_owner = bot.user_id == current_user.id
        user_role = "owner" if is_owner else "collaborator"
        
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
            "has_icon": bot.has_icon,
            "user_role": user_role,
            "is_owner": is_owner
        })
    
    return {
        "chatbots": result,
        "limits": {
            "current_count": current_count,
            "max_allowed": max_allowed,
            "can_create_new": can_create_new
        }
    }

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

@app.get("/api/chatbots/{chatbot_id}/wifi-qr")
async def get_chatbot_wifi_qr(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni il QR code WiFi del chatbot"""
    print(f"DEBUG: Cercando QR code WiFi per chatbot ID: {chatbot_id} per user: {current_user.id}")
    
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        print(f"DEBUG: Chatbot non trovato per ID: {chatbot_id}")
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    print(f"DEBUG: Chatbot trovato: {chatbot.name}, has_wifi_qr_code: {chatbot.has_wifi_qr_code}")
    
    if not chatbot.has_wifi_qr_code or not chatbot.wifi_qr_code_data:
        print(f"DEBUG: QR code WiFi non trovato per chatbot: {chatbot.name}")
        raise HTTPException(status_code=404, detail="QR code WiFi non trovato")
    
    print(f"DEBUG: QR code WiFi trovato per chatbot: {chatbot.name}, content_type: {chatbot.wifi_qr_code_content_type}")
    
    from fastapi.responses import Response
    return Response(
        content=chatbot.wifi_qr_code_data,
        media_type=chatbot.wifi_qr_code_content_type or "image/png"
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

@app.get("/api/chat/{uuid}/wifi-qr-code")
async def get_chatbot_wifi_qr_public(
    uuid: str,
    db: Session = Depends(get_db)
):
    """Ottieni il QR code WiFi del chatbot per la chat pubblica"""
    print(f"DEBUG: Cercando QR code WiFi per chatbot UUID: {uuid}")
    
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    
    if not chatbot:
        print(f"DEBUG: Chatbot non trovato per UUID: {uuid}")
        # Debug: mostra tutti gli UUID esistenti
        all_chatbots = db.query(Chatbot).all()
        print(f"DEBUG: UUID esistenti nel database: {[bot.uuid for bot in all_chatbots]}")
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    print(f"DEBUG: Chatbot trovato: {chatbot.name}, is_active: {chatbot.is_active}")
    print(f"DEBUG: Chatbot has_wifi_qr_code: {chatbot.has_wifi_qr_code}")
    
    if not chatbot.is_active:
        print(f"DEBUG: Chatbot non attivo: {chatbot.name}")
        raise HTTPException(status_code=404, detail="Chatbot non attivo")
    
    if not chatbot.has_wifi_qr_code or not chatbot.wifi_qr_code_data:
        print(f"DEBUG: QR code WiFi non trovato per chatbot: {chatbot.name}")
        raise HTTPException(status_code=404, detail="QR code WiFi non trovato")
    
    print(f"DEBUG: QR code WiFi trovato per chatbot: {chatbot.name}, content_type: {chatbot.wifi_qr_code_content_type}")
    
    from fastapi.responses import Response
    return Response(
        content=chatbot.wifi_qr_code_data,
        media_type=chatbot.wifi_qr_code_content_type or "image/png"
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
            detail="Abbonamento non attivo. Sottoscrivi un abbonamento mensile a 19€ per accedere alle funzionalità."
        )
    
    # Verifica se l'utente è proprietario o collaboratore del chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Controlla se l'utente è proprietario
    is_owner = chatbot.user_id == current_user.id
    
    # Se non è proprietario, controlla se è collaboratore
    if not is_owner:
        collaborator = db.query(ChatbotCollaborator).filter(
            ChatbotCollaborator.chatbot_id == chatbot_id,
            ChatbotCollaborator.user_id == current_user.id
        ).first()
        
        if not collaborator:
            raise HTTPException(status_code=403, detail="Non hai i permessi per accedere a questo chatbot")
    
    # Calcola statistiche reali dal database
    total_conversations = db.query(func.count(Conversation.id)).filter(
        Conversation.chatbot_id == chatbot.id
    ).scalar()
    
    total_messages = db.query(func.count(Message.id)).join(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Message.role == "user"
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
        "reviews_link": chatbot.reviews_link,
        "wifi_qr_code_filename": chatbot.wifi_qr_code_filename,
        "wifi_qr_code_content_type": chatbot.wifi_qr_code_content_type,
        "has_wifi_qr_code": chatbot.has_wifi_qr_code,
        "icon_filename": chatbot.icon_filename,
        "icon_content_type": chatbot.icon_content_type,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "is_active": chatbot.is_active,
        "created_at": chatbot.created_at,
        "updated_at": chatbot.updated_at,
        "has_icon": chatbot.has_icon,
        "is_owner": is_owner
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
    # Debug: stampa i dati ricevuti
    logger.info(f"Update chatbot {chatbot_id} - Data received: {update_data.dict(exclude_unset=True)}")
    
    # Blocca accesso senza abbonamento attivo
    if not is_subscription_active(current_user.subscription_status):
        raise HTTPException(
            status_code=403,
            detail="Abbonamento non attivo. Sottoscrivi un abbonamento mensile a 19€ per accedere alle funzionalità."
        )
    
    # Verifica se l'utente è proprietario o collaboratore del chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Controlla se l'utente è proprietario
    is_owner = chatbot.user_id == current_user.id
    
    # Se non è proprietario, controlla se è collaboratore
    if not is_owner:
        collaborator = db.query(ChatbotCollaborator).filter(
            ChatbotCollaborator.chatbot_id == chatbot_id,
            ChatbotCollaborator.user_id == current_user.id
        ).first()
        
        if not collaborator:
            raise HTTPException(status_code=403, detail="Non hai i permessi per modificare questo chatbot")
    
    # Aggiorna campi
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(chatbot, field, value)
    
    # Se è stato modificato il nome della proprietà, aggiorna automaticamente il nome del chatbot
    if 'property_name' in update_data.dict(exclude_unset=True):
        chatbot.name = f"Assistente {chatbot.property_name}"
    
    # Se sono state aggiornate le informazioni WiFi, rigenera il QR code WiFi
    if 'wifi_info' in update_data.dict(exclude_unset=True):
        try:
            wifi_info_dict = update_data.wifi_info
            logger.info(f"WiFi info updated for chatbot {chatbot.id}: {wifi_info_dict}")
            if wifi_info_dict and wifi_info_dict.get('network') and wifi_info_dict.get('password'):
                logger.info(f"Regenerating WiFi QR code for chatbot: {chatbot.property_name}")
                wifi_qr_code_data = generate_wifi_qr_code(wifi_info_dict)
                if wifi_qr_code_data:
                    chatbot.wifi_qr_code_data = wifi_qr_code_data
                    chatbot.wifi_qr_code_filename = f"wifi_qr_{chatbot.uuid}.png"
                    chatbot.wifi_qr_code_content_type = "image/png"
                    chatbot.has_wifi_qr_code = True
                    logger.info(f"WiFi QR code regenerated for chatbot: {chatbot.property_name}")
                else:
                    chatbot.wifi_qr_code_data = None
                    chatbot.wifi_qr_code_filename = None
                    chatbot.wifi_qr_code_content_type = None
                    chatbot.has_wifi_qr_code = False
                    logger.info(f"WiFi QR code removed for chatbot: {chatbot.property_name}")
            else:
                # Rimuovi il QR code WiFi se le informazioni non sono valide
                chatbot.wifi_qr_code_data = None
                chatbot.wifi_qr_code_filename = None
                chatbot.wifi_qr_code_content_type = None
                chatbot.has_wifi_qr_code = False
                logger.info(f"WiFi QR code removed for chatbot: {chatbot.property_name}")
        except Exception as e:
            logger.error(f"Failed to regenerate WiFi QR code for chatbot {chatbot.id}: {str(e)}")
            # Non bloccare l'aggiornamento se il QR code WiFi fallisce
    
    db.commit()
    
    # Aggiorna anche l'assistant OpenAI
    try:
        client = get_openai_client()
        # Ricostruisci le istruzioni con i dati aggiornati del chatbot
        new_instructions = build_assistant_instructions_from_model(chatbot)
        client.beta.assistants.update(
            chatbot.assistant_id,
            name=chatbot.name,
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
    
    # Prima elimina tutti gli ordini di stampa correlati
    deleted_orders = 0
    try:
        # Conta prima quanti ordini ci sono
        count_result = db.execute(text("SELECT COUNT(*) as count FROM print_orders WHERE chatbot_id = :chatbot_id"), 
                                {"chatbot_id": chatbot_id})
        deleted_orders = count_result.fetchone()[0]
        
        if deleted_orders > 0:
            logger.info(f"Trovati {deleted_orders} ordini di stampa da eliminare per il chatbot {chatbot_id}")
            
            # Prova prima a disabilitare temporaneamente i controlli di foreign key
            try:
                db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
                delete_result = db.execute(text("DELETE FROM print_orders WHERE chatbot_id = :chatbot_id"), 
                                          {"chatbot_id": chatbot_id})
                db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                db.commit()
                logger.info(f"Eliminati {deleted_orders} ordini di stampa per il chatbot {chatbot_id}")
            except Exception as fk_error:
                logger.error(f"Errore con disabilitazione foreign key: {fk_error}")
                # Riprova con il metodo normale
                db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                db.rollback()
                delete_result = db.execute(text("DELETE FROM print_orders WHERE chatbot_id = :chatbot_id"), 
                                          {"chatbot_id": chatbot_id})
                db.commit()
                logger.info(f"Eliminati {deleted_orders} ordini di stampa per il chatbot {chatbot_id} (metodo normale)")
        else:
            logger.info(f"Nessun ordine di stampa da eliminare per il chatbot {chatbot_id}")
    except Exception as e:
        logger.error(f"Errore nell'eliminazione degli ordini di stampa: {e}")
        # Rollback e riprova senza eliminare gli ordini
        db.rollback()
        # Continua comunque con l'eliminazione del chatbot
    
    # Elimina assistant OpenAI
    try:
        client = get_openai_client()
        client.beta.assistants.delete(chatbot.assistant_id, extra_headers={"OpenAI-Beta": "assistants=v2"})
    except Exception as e:
        logger.error(f"Error deleting OpenAI assistant: {e}")
    
    # Prova a eliminare il chatbot con gestione degli errori di foreign key
    try:
        db.delete(chatbot)
        db.commit()
        logger.info(f"Chatbot {chatbot_id} eliminato con successo")
    except Exception as delete_error:
        logger.error(f"Errore nell'eliminazione del chatbot: {delete_error}")
        
        # Se c'è ancora un errore di foreign key, prova con un approccio più drastico
        if "foreign key constraint fails" in str(delete_error).lower():
            logger.warning("Tentativo di eliminazione forzata del chatbot")
            try:
                # Disabilita i controlli di foreign key e elimina tutto
                db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
                db.execute(text("DELETE FROM chatbots WHERE id = :chatbot_id"), {"chatbot_id": chatbot_id})
                db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                db.commit()
                logger.info(f"Chatbot {chatbot_id} eliminato con eliminazione forzata")
            except Exception as force_error:
                logger.error(f"Errore anche con eliminazione forzata: {force_error}")
                db.rollback()
                raise HTTPException(status_code=500, detail="Impossibile eliminare il chatbot a causa di vincoli di database")
        else:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Errore nell'eliminazione del chatbot: {str(delete_error)}")
    
    message = "Chatbot eliminato con successo"
    if deleted_orders > 0:
        message += f" (eliminati anche {deleted_orders} ordini di stampa associati)"
    
    return {"message": message}

@app.get("/api/chatbots/{chatbot_id}/can-delete")
async def can_delete_chatbot(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verifica se un chatbot può essere eliminato"""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Controlla se ci sono ordini di stampa correlati
    try:
        result = db.execute(text("SELECT COUNT(*) as count FROM print_orders WHERE chatbot_id = :chatbot_id"), 
                          {"chatbot_id": chatbot_id})
        order_count = result.fetchone()[0]
        
        return {
            "can_delete": True,
            "has_print_orders": order_count > 0,
            "print_orders_count": order_count,
            "message": f"Il chatbot ha {order_count} ordini di stampa associati che verranno eliminati insieme al chatbot" if order_count > 0 else "Il chatbot può essere eliminato senza problemi"
        }
    except Exception as e:
        logger.error(f"Errore nel controllo degli ordini di stampa: {e}")
        return {
            "can_delete": True,
            "has_print_orders": False,
            "print_orders_count": 0,
            "message": "Impossibile verificare gli ordini di stampa, ma il chatbot può essere eliminato"
        }

# --- Collaborator Endpoints ---

class CollaboratorInviteRequest(BaseModel):
    chatbot_id: int
    emails: List[str]

class CollaboratorInviteResponse(BaseModel):
    invited_count: int
    message: str

class AcceptInviteRequest(BaseModel):
    invite_token: str

@app.post("/api/chatbots/collaborators/invite", response_model=CollaboratorInviteResponse)
async def invite_collaborators(
    request: CollaboratorInviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invita collaboratori a un chatbot"""
    # Verifica che l'utente sia il proprietario del chatbot
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == request.chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Valida le email
    valid_emails = []
    for email in request.emails:
        if email and email.strip() and "@" in email:
            valid_emails.append(email.strip().lower())
    
    if not valid_emails:
        raise HTTPException(status_code=400, detail="Nessuna email valida fornita")
    
    if len(valid_emails) > 3:
        raise HTTPException(status_code=400, detail="Massimo 3 collaboratori per invito")
    
    invited_count = 0
    
    for email in valid_emails:
        # Verifica se l'utente è già collaboratore
        existing_collaborator = db.query(ChatbotCollaborator).filter(
            ChatbotCollaborator.chatbot_id == request.chatbot_id,
            ChatbotCollaborator.user_id == User.id,
            User.email == email
        ).join(User, ChatbotCollaborator.user_id == User.id).first()
        
        if existing_collaborator:
            # Restituisce errore per email già collaboratore
            raise HTTPException(
                status_code=400, 
                detail=f"L'email {email} è già collaboratore di questo chatbot"
            )
        
        # Verifica se c'è già un invito pendente
        existing_invite = db.query(ChatbotCollaboratorInvite).filter(
            ChatbotCollaboratorInvite.chatbot_id == request.chatbot_id,
            ChatbotCollaboratorInvite.invited_email == email,
            ChatbotCollaboratorInvite.status == "pending"
        ).first()
        
        if existing_invite:
            continue
        
        # Crea l'invito
        invite_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=7)  # Invito valido per 7 giorni
        
        invite = ChatbotCollaboratorInvite(
            chatbot_id=request.chatbot_id,
            inviter_user_id=current_user.id,
            invited_email=email,
            invite_token=invite_token,
            expires_at=expires_at
        )
        
        db.add(invite)
        db.commit()
        
        # Invia email di invito
        try:
            invite_url = f"{settings.FRONTEND_URL}/login?invite_token={invite_token}"
            email_body = create_collaborator_invite_email_simple(
                inviter_name=current_user.full_name or current_user.email,
                chatbot_name=chatbot.property_name,
                invite_url=invite_url,
                language=current_user.language or "it"
            )
            
            email_subject = f"Invito a collaborare su {chatbot.property_name}" if (current_user.language or "it") == "it" else f"Invitation to collaborate on {chatbot.property_name}"
            
            send_email_background(
                to_email=email,
                subject=email_subject,
                body=email_body
            )
            
            invited_count += 1
            logger.info(f"Collaborator invite sent to {email} for chatbot {request.chatbot_id}")
            
        except Exception as e:
            logger.error(f"Error sending invite email to {email}: {e}")
            # Rimuovi l'invito se l'email non è stata inviata
            db.delete(invite)
            db.commit()
    
    return CollaboratorInviteResponse(
        invited_count=invited_count,
        message=f"Inviti inviati a {invited_count} collaboratori"
    )

@app.get("/api/chatbots/collaborators/{chatbot_id}")
async def get_collaborators(
    chatbot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni la lista dei collaboratori di un chatbot"""
    # Verifica che l'utente sia il proprietario del chatbot
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Ottieni i collaboratori
    collaborators = db.query(ChatbotCollaborator, User).join(
        User, ChatbotCollaborator.user_id == User.id
    ).filter(
        ChatbotCollaborator.chatbot_id == chatbot_id
    ).all()
    
    # Ottieni gli inviti pending
    pending_invites = db.query(ChatbotCollaboratorInvite).filter(
        ChatbotCollaboratorInvite.chatbot_id == chatbot_id,
        ChatbotCollaboratorInvite.status == "pending"
    ).all()
    
    result = []
    for collaborator, user in collaborators:
        result.append({
            "id": collaborator.id,
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": collaborator.role,
            "joined_at": collaborator.joined_at.isoformat(),
            "status": "accepted"
        })
    
    for invite in pending_invites:
        result.append({
            "id": f"invite_{invite.id}",
            "user_id": None,
            "email": invite.invited_email,
            "full_name": None,
            "role": "collaborator",
            "joined_at": invite.invited_at.isoformat(),
            "status": "pending"
        })
    
    return {"collaborators": result}

@app.delete("/api/chatbots/collaborators/{collaborator_id}")
async def remove_collaborator(
    collaborator_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rimuovi un collaboratore da un chatbot"""
    # Verifica che l'utente sia il proprietario del chatbot
    collaborator = db.query(ChatbotCollaborator).join(
        Chatbot, ChatbotCollaborator.chatbot_id == Chatbot.id
    ).filter(
        ChatbotCollaborator.id == collaborator_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not collaborator:
        raise HTTPException(status_code=404, detail="Collaboratore non trovato")
    
    db.delete(collaborator)
    db.commit()
    
    return {"message": "Collaboratore rimosso con successo"}

@app.delete("/api/chatbots/collaborators/invite/{invite_id}")
async def remove_collaborator_invite(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rimuovi un invito collaboratore"""
    # Trova l'invito
    invite = db.query(ChatbotCollaboratorInvite).filter(
        ChatbotCollaboratorInvite.id == invite_id,
        ChatbotCollaboratorInvite.status == "pending"
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invito non trovato")
    
    # Verifica che l'utente sia il proprietario del chatbot
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == invite.chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Rimuovi l'invito
    db.delete(invite)
    db.commit()
    
    return {"message": "Invito rimosso con successo"}

@app.post("/api/collaborators/accept-invite")
async def accept_collaborator_invite(
    request: AcceptInviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accetta un invito a collaborare"""
    # Trova l'invito
    invite = db.query(ChatbotCollaboratorInvite).filter(
        ChatbotCollaboratorInvite.invite_token == request.invite_token,
        ChatbotCollaboratorInvite.status == "pending"
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invito non trovato o già scaduto")
    
    # Verifica che l'email corrisponda
    if invite.invited_email.lower() != current_user.email.lower():
        raise HTTPException(status_code=400, detail="Questo invito non è per il tuo account")
    
    # Verifica che non sia scaduto
    if datetime.utcnow() > invite.expires_at:
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Invito scaduto")
    
    # Verifica che non sia già collaboratore
    existing_collaborator = db.query(ChatbotCollaborator).filter(
        ChatbotCollaborator.chatbot_id == invite.chatbot_id,
        ChatbotCollaborator.user_id == current_user.id
    ).first()
    
    if existing_collaborator:
        invite.status = "accepted"
        invite.accepted_at = datetime.utcnow()
        db.commit()
        return {"message": "Sei già collaboratore di questo chatbot"}
    
    # Aggiungi come collaboratore
    collaborator = ChatbotCollaborator(
        chatbot_id=invite.chatbot_id,
        user_id=current_user.id,
        invited_by_user_id=invite.inviter_user_id
    )
    
    db.add(collaborator)
    
    # Aggiorna l'invito
    invite.status = "accepted"
    invite.accepted_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Invito accettato con successo"}

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
        demo_assistant_id = "asst_IF4YbsqCuO2RNbqMd8nReyBU"
        
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
        "has_wifi_qr_code": chatbot.has_wifi_qr_code,
        "wifi_info": chatbot.wifi_info,
        "id": chatbot.id,
        "house_rules": chatbot.house_rules,
        "reviews_link": chatbot.reviews_link
    }

def improve_text_with_openai(text: str, context: str = "") -> str:
    """Migliora un testo usando OpenAI"""
    try:
        if not text or text.strip() == "":
            return "Nessuna informazione disponibile"
        
        # Se il testo contiene oggetti JSON vuoti o malformati, restituisci messaggio di default
        if any(pattern in text for pattern in ["{'name': '',", "{'name': '',", "• {'", "• {"]):
            return "Nessuna informazione disponibile"
        
        # Usa un modello leggero e poco costoso
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Modello leggero e poco costoso
            messages=[
                {
                    "role": "system", 
                    "content": f"""Sei un assistente che traduce e migliora testi per documenti di proprietà. 
                    IMPORTANTE: Rispondi SOLO con il testo tradotto e migliorato, senza spiegazioni o prefissi.
                    
                    Regole:
                    - Traduci in italiano
                    - Rendi il testo più discorsivo e naturale
                    - Evita formati JSON o liste tecniche
                    - Scrivi in modo elegante e professionale
                    - Se il testo è vuoto, rispondi SOLO con "Nessuna informazione disponibile"
                    - NON aggiungere prefissi come "Traduzione:" o "Rendendo il testo più discorsivo:"
                    - Rispondi SOLO con il risultato finale"""
                },
                {
                    "role": "user", 
                    "content": f"Contesto: {context}\n\nTesto da migliorare: {text}"
                }
            ],
            temperature=0.3,
            max_tokens=200
        )
        
        improved_text = response.choices[0].message.content.strip()
        
        # Rimuovi eventuali prefissi indesiderati
        prefixes_to_remove = [
            "Traduzione:", "Tradotto:", "Migliorato:", "Risultato:", 
            "Testo migliorato:", "Versione migliorata:", "Ecco il testo:",
            "Il testo migliorato è:", "Rendendo il testo più discorsivo:"
        ]
        
        for prefix in prefixes_to_remove:
            if improved_text.startswith(prefix):
                improved_text = improved_text[len(prefix):].strip()
        
        return improved_text if improved_text else text
        
    except Exception as e:
        logger.warning(f"Error improving text with OpenAI: {e}")
        return text  # Restituisce il testo originale in caso di errore

def generate_house_rules_pdf(chatbot: Chatbot, lang: str = "IT") -> bytes:
    """Genera PDF con tutte le informazioni della proprietà e restituisce i bytes"""
    logger.info(f"Generating PDF for chatbot: {chatbot.property_name}, language: {lang}")
    
    try:
        # Crea buffer in memoria per il PDF
        buffer = io.BytesIO()
        logger.info("Created PDF buffer")
        
        # Configura il documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        logger.info("Created PDF document template")
        
        # Aggiungi il logo come watermark
        def add_watermark(canvas, doc):
            try:
                # Path del logo (relativo alla directory del backend)
                import os
                # Prova diversi path possibili
                possible_paths = [
                    "/app/public/icons/logoospiterai.png",  # Docker path
                    "/app/backend/../public/icons/logoospiterai.png",  # Docker path alternativo
                    "public/icons/logoospiterai.png",       # Se eseguito dalla root
                    "../public/icons/logoospiterai.png",     # Se eseguito da backend/
                    os.path.join(os.path.dirname(__file__), "..", "public", "icons", "logoospiterai.png"),  # Path assoluto
                ]
                
                logo_path = None
                for path in possible_paths:
                    if os.path.exists(path):
                        logo_path = path
                        break
                
                if logo_path:
                    # Carica e ridimensiona il logo
                    from PIL import Image
                    img = Image.open(logo_path)
                    
                    # Ridimensiona mantenendo le proporzioni
                    max_width = 100
                    max_height = 50
                    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                    
                    # Salva in un buffer temporaneo
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, format='PNG')
                    img_buffer.seek(0)
                    
                    # Posiziona il watermark in alto a destra
                    page_width, page_height = A4
                    x = page_width - img.width - 50
                    y = page_height - img.height - 50
                    
                    # Disegna l'immagine con trasparenza
                    canvas.saveState()
                    canvas.setFillAlpha(0.3)  # Trasparenza al 30%
                    canvas.drawInlineImage(img_buffer, x, y, width=img.width, height=img.height)
                    canvas.restoreState()
                    
                    logger.info(f"Watermark added successfully from: {logo_path}")
                else:
                    logger.warning("Logo not found, continuing without watermark")
                    
            except Exception as e:
                logger.warning(f"Could not add watermark: {e}")
        
        # Stili per il documento
        styles = getSampleStyleSheet()
        
        # Stile personalizzato per il titolo
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1,  # Centrato
            textColor=colors.HexColor('#2563eb')
        )
        
        # Stile per le sezioni
        section_style = ParagraphStyle(
            'CustomSection',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.HexColor('#1f2937')
        )
        
        # Stile per il contenuto
        content_style = ParagraphStyle(
            'CustomContent',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            leading=14,
            textColor=colors.HexColor('#374151')
        )
        
        # Stile per il footer
        footer_style = ParagraphStyle(
            'CustomFooter',
            parent=styles['Normal'],
            fontSize=10,
            alignment=1,  # Centrato
            textColor=colors.HexColor('#6b7280')
        )
        
        # Contenuto del documento
        story = []
        
        # Titolo principale
        title_text = f"Informazioni Proprietà - {chatbot.property_name}" if lang == "IT" else f"Property Information - {chatbot.property_name}"
        story.append(Paragraph(title_text, title_style))
        story.append(Spacer(1, 20))
        
        # Informazioni generali
        section_title = "Informazioni Generali" if lang == "IT" else "General Information"
        story.append(Paragraph(section_title, section_style))
        
        # Nome proprietà
        if chatbot.property_name:
            label = "Nome Proprietà:" if lang == "IT" else "Property Name:"
            story.append(Paragraph(f"<b>{label}</b> {chatbot.property_name}", content_style))
        
        # Tipo proprietà
        if chatbot.property_type:
            label = "Tipo:" if lang == "IT" else "Type:"
            story.append(Paragraph(f"<b>{label}</b> {chatbot.property_type}", content_style))
        
        # Indirizzo completo
        if chatbot.property_address:
            address_parts = [chatbot.property_address]
            if chatbot.property_street_number:
                address_parts[0] = f"{chatbot.property_address} {chatbot.property_street_number}"
            if chatbot.property_city:
                address_parts.append(chatbot.property_city)
            if chatbot.property_state:
                address_parts.append(chatbot.property_state)
            if chatbot.property_postal_code:
                address_parts.append(chatbot.property_postal_code)
            if chatbot.property_country:
                address_parts.append(chatbot.property_country)
            
            full_address = ", ".join(address_parts)
            label = "Indirizzo:" if lang == "IT" else "Address:"
            story.append(Paragraph(f"<b>{label}</b> {full_address}", content_style))
        
        # Descrizione proprietà
        if chatbot.property_description and chatbot.property_description.strip():
            label = "Descrizione:" if lang == "IT" else "Description:"
            story.append(Paragraph(f"<b>{label}</b>", content_style))
            improved_description = improve_text_with_openai(chatbot.property_description, "Descrizione della proprietà per gli ospiti")
            story.append(Paragraph(improved_description, content_style))
        
        story.append(Spacer(1, 10))
        
        # Check-in/Check-out
        section_title = "Check-in e Check-out" if lang == "IT" else "Check-in and Check-out"
        story.append(Paragraph(section_title, section_style))
        
        if chatbot.check_in_time:
            label = "Check-in:" if lang == "IT" else "Check-in:"
            story.append(Paragraph(f"<b>{label}</b> {chatbot.check_in_time}", content_style))
        
        if chatbot.check_out_time:
            label = "Check-out:" if lang == "IT" else "Check-out:"
            story.append(Paragraph(f"<b>{label}</b> {chatbot.check_out_time}", content_style))
        
        story.append(Spacer(1, 10))
        
        # Servizi e comfort
        if chatbot.amenities and isinstance(chatbot.amenities, list) and chatbot.amenities:
            section_title = "Servizi e Comfort" if lang == "IT" else "Amenities and Services"
            story.append(Paragraph(section_title, section_style))
            amenities_text = ", ".join([str(amenity) for amenity in chatbot.amenities if str(amenity).strip()])
            if amenities_text:
                improved_amenities = improve_text_with_openai(amenities_text, "Lista dei servizi disponibili nella proprietà")
                story.append(Paragraph(improved_amenities, content_style))
            story.append(Spacer(1, 10))
        
        # Informazioni WiFi
        if chatbot.wifi_info and isinstance(chatbot.wifi_info, dict):
            wifi_name = chatbot.wifi_info.get('name', '')
            wifi_password = chatbot.wifi_info.get('password', '')
            
            if wifi_name or wifi_password:
                section_title = "Informazioni WiFi" if lang == "IT" else "WiFi Information"
                story.append(Paragraph(section_title, section_style))
                
                if wifi_name:
                    label = "Nome Rete:" if lang == "IT" else "Network Name:"
                    story.append(Paragraph(f"<b>{label}</b> {wifi_name}", content_style))
                
                if wifi_password:
                    label = "Password:" if lang == "IT" else "Password:"
                    story.append(Paragraph(f"<b>{label}</b> {wifi_password}", content_style))
                
                story.append(Spacer(1, 10))
        
        # Informazioni parcheggio
        if chatbot.parking_info and chatbot.parking_info.strip():
            section_title = "Informazioni Parcheggio" if lang == "IT" else "Parking Information"
            story.append(Paragraph(section_title, section_style))
            improved_parking = improve_text_with_openai(chatbot.parking_info, "Informazioni sul parcheggio per gli ospiti")
            story.append(Paragraph(improved_parking, content_style))
            story.append(Spacer(1, 10))
        
        # Descrizione del quartiere
        if chatbot.neighborhood_description and chatbot.neighborhood_description.strip():
            section_title = "Il Quartiere" if lang == "IT" else "The Neighborhood"
            story.append(Paragraph(section_title, section_style))
            improved_neighborhood = improve_text_with_openai(chatbot.neighborhood_description, "Descrizione del quartiere per i turisti")
            story.append(Paragraph(improved_neighborhood, content_style))
            story.append(Spacer(1, 10))
        
        # Attrazioni nelle vicinanze
        if chatbot.nearby_attractions and isinstance(chatbot.nearby_attractions, list) and chatbot.nearby_attractions:
            valid_attractions = [str(attr) for attr in chatbot.nearby_attractions if str(attr).strip()]
            if valid_attractions:
                section_title = "Attrazioni nelle Vicinanze" if lang == "IT" else "Nearby Attractions"
                story.append(Paragraph(section_title, section_style))
                attractions_text = ", ".join(valid_attractions)
                improved_attractions = improve_text_with_openai(attractions_text, "Lista delle attrazioni turistiche nelle vicinanze")
                story.append(Paragraph(improved_attractions, content_style))
                story.append(Spacer(1, 10))
        
        # Informazioni sui trasporti
        if chatbot.transportation_info and chatbot.transportation_info.strip():
            section_title = "Trasporti" if lang == "IT" else "Transportation"
            story.append(Paragraph(section_title, section_style))
            improved_transport = improve_text_with_openai(chatbot.transportation_info, "Informazioni sui trasporti pubblici e privati")
            story.append(Paragraph(improved_transport, content_style))
            story.append(Spacer(1, 10))
        
        # Ristoranti e bar
        if chatbot.restaurants_bars and isinstance(chatbot.restaurants_bars, list) and chatbot.restaurants_bars:
            valid_restaurants = [str(rest) for rest in chatbot.restaurants_bars if str(rest).strip()]
            if valid_restaurants:
                section_title = "Ristoranti e Bar" if lang == "IT" else "Restaurants and Bars"
                story.append(Paragraph(section_title, section_style))
                restaurants_text = ", ".join(valid_restaurants)
                improved_restaurants = improve_text_with_openai(restaurants_text, "Lista di ristoranti e bar consigliati")
                story.append(Paragraph(improved_restaurants, content_style))
                story.append(Spacer(1, 10))
        
        # Informazioni shopping
        if chatbot.shopping_info and chatbot.shopping_info.strip():
            section_title = "Shopping" if lang == "IT" else "Shopping"
            story.append(Paragraph(section_title, section_style))
            improved_shopping = improve_text_with_openai(chatbot.shopping_info, "Informazioni sui negozi e centri commerciali")
            story.append(Paragraph(improved_shopping, content_style))
            story.append(Spacer(1, 10))
        
        # Contatti di emergenza
        if chatbot.emergency_contacts and isinstance(chatbot.emergency_contacts, list) and chatbot.emergency_contacts:
            valid_contacts = [str(contact) for contact in chatbot.emergency_contacts if str(contact).strip()]
            if valid_contacts:
                section_title = "Contatti di Emergenza" if lang == "IT" else "Emergency Contacts"
                story.append(Paragraph(section_title, section_style))
                for contact in valid_contacts:
                    story.append(Paragraph(f"• {contact}", content_style))
                story.append(Spacer(1, 10))
        
        # Istruzioni speciali
        if chatbot.special_instructions and chatbot.special_instructions.strip():
            section_title = "Istruzioni Speciali" if lang == "IT" else "Special Instructions"
            story.append(Paragraph(section_title, section_style))
            improved_instructions = improve_text_with_openai(chatbot.special_instructions, "Istruzioni speciali per gli ospiti")
            story.append(Paragraph(improved_instructions, content_style))
            story.append(Spacer(1, 10))
        
        # FAQ
        if chatbot.faq:
            section_title = "Domande Frequenti" if lang == "IT" else "Frequently Asked Questions"
            story.append(Paragraph(section_title, section_style))
            if isinstance(chatbot.faq, list) and chatbot.faq:
                # Filtra FAQ valide
                valid_faqs = [f for f in chatbot.faq if isinstance(f, dict) and f.get('question') and f.get('answer') and str(f.get('question')).strip() and str(f.get('answer')).strip()]
                if valid_faqs:
                    for faq_item in valid_faqs:
                        question = faq_item['question']
                        answer = faq_item['answer']
                        improved_question = improve_text_with_openai(question, "Domanda frequente")
                        improved_answer = improve_text_with_openai(answer, "Risposta alla domanda")
                        story.append(Paragraph(f"Q: {improved_question}", content_style))
                        story.append(Paragraph(f"A: {improved_answer}", content_style))
                        story.append(Spacer(1, 8))
                else:
                    no_info_text = "Nessuna informazione disponibile" if lang == "IT" else "No information available"
                    story.append(Paragraph(no_info_text, content_style))
            story.append(Spacer(1, 10))
        
        # Regole della casa (se presenti)
        if chatbot.house_rules and chatbot.house_rules.strip():
            section_title = "Regole della Casa" if lang == "IT" else "House Rules"
            story.append(Paragraph(section_title, section_style))
            improved_rules = improve_text_with_openai(chatbot.house_rules, "Regole della casa per gli ospiti")
            story.append(Paragraph(improved_rules, content_style))
            story.append(Spacer(1, 10))
        
        story.append(Spacer(1, 40))
        
        # Footer
        footer_text = "Generato da OspiterAI" if lang == "IT" else "Generated by OspiterAI"
        story.append(Paragraph(footer_text, footer_style))
        
        logger.info("Built PDF story with all property information")
        
        # Genera PDF con watermark
        doc.build(story, onFirstPage=add_watermark, onLaterPages=add_watermark)
        buffer.seek(0)
        logger.info("Property info PDF generated successfully with watermark")
        
        # Restituisce i bytes del PDF
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
        
    except Exception as e:
        logger.error(f"Error generating property info PDF for chatbot {chatbot.id}: {str(e)}", exc_info=True)
        raise Exception(f"Errore nella generazione del PDF: {str(e)}")

@app.get("/api/chat/{uuid}/house-rules-pdf")
async def download_house_rules_pdf(uuid: str, lang: str = "IT", db: Session = Depends(get_db)):
    """Scarica PDF pre-generato con tutte le informazioni della proprietà"""
    logger.info(f"Property info PDF download requested for chatbot UUID: {uuid}, language: {lang}")
    
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    
    if not chatbot or not chatbot.is_active:
        logger.warning(f"Chatbot not found or inactive for UUID: {uuid}")
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    logger.info(f"Chatbot found: {chatbot.property_name}")
    
    # Controlla se esiste il PDF pre-generato
    if chatbot.house_rules_pdf_data:
        logger.info("Using pre-generated PDF from database")
        try:
            # Nome file
            filename = f"INFO_{chatbot.property_name.replace(' ', '_').upper()}.pdf" if lang == "IT" else f"{chatbot.property_name.replace(' ', '_').upper()}_INFO.pdf"
            logger.info(f"Serving pre-generated PDF: {filename}")
            
            return StreamingResponse(
                io.BytesIO(chatbot.house_rules_pdf_data),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        except Exception as e:
            logger.error(f"Error serving pre-generated PDF for UUID {uuid}: {str(e)}")
            # Fallback alla generazione al volo se il PDF pre-generato è corrotto
    
    # Fallback: genera PDF al volo se non esiste quello pre-generato
    logger.info("Pre-generated PDF not found, generating on-the-fly")
    try:
        # Usa la funzione di generazione PDF
        pdf_bytes = generate_house_rules_pdf(chatbot, lang)
        
        # Nome file
        filename = f"INFO_{chatbot.property_name.replace(' ', '_').upper()}.pdf" if lang == "IT" else f"{chatbot.property_name.replace(' ', '_').upper()}_INFO.pdf"
        logger.info(f"Generated filename: {filename}")
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error generating property info PDF for UUID {uuid}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Errore nella generazione del PDF")

@app.get("/api/demo/info")
async def get_demo_info(db: Session = Depends(get_db)):
    """Ottieni informazioni del chatbot demo per la landing page"""
    # UUID fisso del chatbot demo
    demo_uuid = "9713e4f9-dd6c-4f03-a3ba-12f7c53fa200"
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
        # Restituisci un'icona di default se non trovata
        raise HTTPException(status_code=404, detail="Icona demo non trovata")
    
    return StreamingResponse(
        io.BytesIO(chatbot.icon_data),
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
        
        # ============= GESTIONE OSPITI - IDENTIFICAZIONE OBBLIGATORIA =============
        
        # L'identificazione è sempre obbligatoria
        guest = None
        
        # Prima controlla se è già stato fornito guest_id
        if message.guest_id:
            guest = db.query(Guest).filter(Guest.id == message.guest_id).first()
            if not guest:
                raise HTTPException(status_code=400, detail="Guest ID non valido")
            logger.info(f"🔍 [DEBUG] Guest identificato tramite guest_id: {guest.id}")
        
        # Se non c'è guest_id, prova con phone/email
        elif message.phone or message.email:
            try:
                guest = find_or_create_guest(
                    phone=message.phone,
                    email=message.email,
                    chatbot_id=chatbot.id,
                    first_name=message.first_name,
                    last_name=message.last_name,
                    db=db
                )
                logger.info(f"🔍 [DEBUG] Guest identificato tramite phone/email: {guest.id}")
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
        else:
            # Non sono permessi messaggi anonimi
            raise HTTPException(
                status_code=400, 
                detail="Identificazione richiesta: fornire guest_id, email o numero di telefono"
            )
        
        # ============= LOGICA SEMPLIFICATA - GUEST SEMPRE PRESENTE =============
        
        logger.info(f"🔍 [DEBUG] Guest: {guest.id}, force_new_conversation: {message.force_new_conversation}")
        
        # STEP 1: Determina se usare conversazione esistente o crearne una nuova
        conversation = None
        
        if not message.force_new_conversation:
            # Cerca conversazione esistente per questo guest
            existing_conversation = get_latest_guest_conversation(chatbot.id, guest.id, db)
            if existing_conversation:
                # Verifica che la conversazione esistente sia valida
                if existing_conversation.id and existing_conversation.chatbot_id == chatbot.id:
                    # CARICA conversazione esistente
                    conversation = carica_conversazione_esistente(existing_conversation, message, chatbot, owner, client, db, request)
                else:
                    logger.warning(f"⚠️ Conversazione esistente {existing_conversation.id} non valida, creando nuova conversazione")
                    conversation = crea_nuova_conversazione(guest, message, chatbot, owner, client, db, request)
            else:
                # CREA nuova conversazione (prima conversazione per questo guest-chatbot)
                conversation = crea_nuova_conversazione(guest, message, chatbot, owner, client, db, request)
        else:
            # CREA sempre nuova conversazione quando force_new_conversation=True
            conversation = crea_nuova_conversazione(guest, message, chatbot, owner, client, db, request)
        
        # Verifica che la conversazione abbia un thread_id valido
        if not conversation.thread_id:
            logger.error(f"❌ Conversazione {conversation.id} non ha thread_id valido")
            raise HTTPException(status_code=500, detail="Errore interno: thread_id mancante")
        
        # Verifica se la conversazione è sospesa per alert Guardian
        if conversation.guardian_suspended and not conversation.guardian_resolved:
            logger.info(f"🚫 Conversazione {conversation.id} sospesa per alert Guardian")
            raise HTTPException(
                status_code=423, 
                detail="La conversazione è temporaneamente sospesa in attesa che l'host risponda di persona. Ti arriverà una mail quando lo farà. Nel frattempo puoi cliccare il pulsante refresh in alto per iniziare una nuova conversazione."
            )
        
        # Esegui assistant
        run = client.beta.threads.runs.create(
            thread_id=conversation.thread_id,
            assistant_id=chatbot.assistant_id,
            extra_headers={"OpenAI-Beta": "assistants=v2"}
        )
        
        # Attendi risposta
        import time
        max_wait_time = 30  # Massimo 30 secondi di attesa
        wait_time = 0
        
        while run.status in ["queued", "in_progress"] and wait_time < max_wait_time:
            time.sleep(1)
            wait_time += 1
            run = client.beta.threads.runs.retrieve(
                thread_id=conversation.thread_id,
                run_id=run.id,
                extra_headers={"OpenAI-Beta": "assistants=v2"}
            )
        
        # Verifica se il run è completato con successo
        if run.status != "completed":
            logger.error(f"❌ Run OpenAI fallito con status: {run.status}")
            if hasattr(run, 'last_error') and run.last_error:
                logger.error(f"❌ Errore OpenAI: {run.last_error}")
            raise HTTPException(status_code=500, detail="Errore nel processare la richiesta con OpenAI")
        
        # Ottieni risposta
        messages = client.beta.threads.messages.list(thread_id=conversation.thread_id, extra_headers={"OpenAI-Beta": "assistants=v2"})
        
        if not messages.data or not messages.data[0].content:
            logger.error("❌ Nessun messaggio ricevuto da OpenAI")
            raise HTTPException(status_code=500, detail="Nessuna risposta ricevuta dal chatbot")
        
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
        
        # Se è una conversazione esistente, includi tutti i messaggi esistenti
        response = {
            "thread_id": conversation.thread_id,
            "message": assistant_message,
            "messages_remaining": messages_remaining,
            "id": assistant_msg.id,
            "role": "assistant",
            "content": assistant_message,
            "timestamp": assistant_msg.timestamp.isoformat() if assistant_msg.timestamp else datetime.now().isoformat()
        }
        
        # IMPORTANTE: Se è una conversazione esistente, includi i messaggi esistenti
        if getattr(conversation, 'is_existing_conversation', False):
            existing_messages = db.query(Message).filter(
                Message.conversation_id == conversation.id
            ).order_by(Message.timestamp.asc()).all()
            
            response["existing_messages"] = [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                }
                for msg in existing_messages[:-2]  # Esclude gli ultimi 2 messaggi (appena aggiunti)
            ]
            response["is_existing_conversation"] = True
            logger.info(f"🔄 Inclusi {len(response['existing_messages'])} messaggi esistenti nella risposta")
        
        return response
        
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        # Assicurati che il database venga rollback in caso di errore
        try:
            db.rollback()
        except Exception as rollback_error:
            logger.error(f"Errore durante rollback: {rollback_error}")
        
        # Log dell'errore completo per debug
        import traceback
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        
        raise HTTPException(status_code=500, detail="Errore nel processare il messaggio")

@app.post("/api/chat/{uuid}/voice-message")
async def send_voice_message(
    uuid: str,
    audio_file: UploadFile = File(...),
    thread_id: Optional[str] = Form(None),
    guest_name: Optional[str] = Form(None),  # Mantenuto per compatibilità
    # Nuovi parametri per identificazione ospite
    guest_id: Optional[int] = Form(None),  # ID del guest se già identificato
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    force_new_conversation: Optional[bool] = Form(False),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Endpoint per inviare messaggi vocali.
    Converte l'audio in testo usando OpenAI Whisper e processa come messaggio normale.
    """
    logger.info(f"🎤 Messaggio vocale ricevuto per chatbot {uuid}")
    logger.info(f"🎤 Content type: {audio_file.content_type}")
    logger.info(f"🎤 File name: {audio_file.filename}")
    logger.info(f"🎤 Thread ID: {thread_id}")
    logger.info(f"🎤 Guest name: {guest_name}")
    
    # Verifica che il file sia audio
    if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
        logger.error(f"🎤 Tipo file non supportato: {audio_file.content_type}")
        raise HTTPException(status_code=400, detail="Il file deve essere un file audio")
    
    # Verifica chatbot
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
    
    try:
        logger.info("🎤 Inizio elaborazione messaggio vocale...")
        client = get_openai_client()
        
        # Leggi il file audio
        logger.info("🎤 Lettura file audio...")
        audio_content = await audio_file.read()
        logger.info(f"🎤 Dimensione file audio: {len(audio_content)} bytes")
        
        # Converte l'audio in testo usando OpenAI Whisper
        logger.info("🎤 Trascrizione audio in corso...")
        logger.info(f"🎤 Tipo file ricevuto: {audio_file.content_type}")
        logger.info(f"🎤 Nome file: {audio_file.filename}")
        
        # Crea un file temporaneo con l'estensione corretta
        import tempfile
        import os
        
        # Determina l'estensione basata sul content type
        if audio_file.content_type == 'audio/webm':
            extension = 'webm'
        elif audio_file.content_type == 'audio/mp4':
            extension = 'mp4'
        elif audio_file.content_type == 'audio/wav':
            extension = 'wav'
        else:
            extension = 'webm'  # Default
        
        # Crea file temporaneo
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{extension}') as temp_file:
            temp_file.write(audio_content)
            temp_file_path = temp_file.name
        
        try:
            # Apri il file temporaneo
            with open(temp_file_path, 'rb') as audio_file_obj:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file_obj
                    # Rimosso language="it" per rilevamento automatico della lingua
                )
        finally:
            # Pulisci il file temporaneo
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
        transcribed_text = transcript.text
        logger.info(f"🎤 Testo trascritto: {transcribed_text[:100]}...")
        
        # Processa il testo come un messaggio normale
        # ============= NUOVA LOGICA GESTIONE OSPITI (VOICE) =============
        
        # Identifica o crea l'ospite
        guest = None
        
        # CORREZIONE: Prima controlla se è già stato fornito guest_id
        if guest_id:
            guest = db.query(Guest).filter(Guest.id == guest_id).first()
            if not guest:
                raise HTTPException(status_code=400, detail="Guest ID non valido")
            logger.info(f"🎤🔍 [DEBUG] Guest identificato tramite guest_id: {guest.id}")
        
        # Se non c'è guest_id, prova con phone/email
        elif phone or email:
            try:
                guest = find_or_create_guest(
                    phone=phone,
                    email=email,
                    chatbot_id=chatbot.id,
                    first_name=first_name,
                    last_name=last_name,
                    db=db
                )
                logger.info(f"🎤🔍 [DEBUG] Guest identificato tramite phone/email: {guest.id}")
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
        else:
            # Non sono permessi messaggi vocali anonimi
            raise HTTPException(
                status_code=400, 
                detail="Identificazione richiesta: fornire guest_id, email o numero di telefono"
            )
        
        # Determina se creare una nuova conversazione o riprendere una esistente
        conversation = None
        is_new_conversation = False
        
        # Cerca conversazioni esistenti dell'ospite (guest sempre presente)
        if not force_new_conversation:
            existing_conversation = get_latest_guest_conversation(chatbot.id, guest.id, db)
            if existing_conversation:
                conversation = existing_conversation
                thread_id = existing_conversation.thread_id
                is_new_conversation = False
                logger.info(f"🎤🔄 Riprendendo conversazione esistente per ospite {guest.id}")
        
        if not conversation:
            # Verifica limiti conversazioni prima di crearne una nuova (per messaggi vocali)
            if owner.subscription_status == 'free_trial':
                # Verifica limite conversazioni free trial
                if owner.free_trial_conversations_used >= owner.free_trial_conversations_limit:
                    raise HTTPException(
                        status_code=429,
                        detail=f"{'You have reached the limit of 5 conversations for the free trial period. Subscribe to a plan to continue. For assistance contact: ' if (owner.language or 'it') == 'en' else 'Hai raggiunto il limite di 5 conversazioni del periodo di prova gratuito. Sottoscrivi un abbonamento per continuare. Per assistenza contatta il numero: '}{owner.phone}"
                    )
            else:
                # Verifica limite conversazioni (i reset sono gestiti dai webhook Stripe)
                if owner.conversations_used >= owner.conversations_limit:
                    # Messaggio di errore multilingue con numero host
                    if (owner.language or 'it') == 'en':
                        error_message = f"Monthly limit of {owner.conversations_limit} conversations reached. The limit resets automatically on subscription renewal. For assistance contact: {owner.phone}"
                    else:
                        error_message = f"Limite mensile di {owner.conversations_limit} conversazioni raggiunto. Il limite si resetta automaticamente al rinnovo dell'abbonamento. Per assistenza contatta il numero: {owner.phone}"
                    raise HTTPException(
                        status_code=429, 
                        detail=error_message
                    )
            
            # Guest è sempre richiesto per creare conversazioni
            if not guest:
                raise HTTPException(status_code=400, detail="Identificazione guest richiesta per inviare messaggi vocali")
            
            # Crea nuova conversazione
            thread = client.beta.threads.create(extra_headers={"OpenAI-Beta": "assistants=v2"})
            thread_id = thread.id
            
            # Crea nuova conversazione nel DB usando sempre guest_id
            conversation = Conversation(
                chatbot_id=chatbot.id,
                guest_id=guest.id,  # Sempre il guest_id vero
                thread_id=thread_id,
                guest_name=f"{guest.first_name} {guest.last_name}".strip() if (guest.first_name or guest.last_name) else None,
                guest_identifier=None,  # Non usiamo più questo campo per guest identificati
                is_forced_new=force_new_conversation
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            is_new_conversation = True
            logger.info(f"🎤🆕 Creata nuova conversazione per ospite {guest.id}")
            
            # Incrementa il contatore delle conversazioni
            if owner.subscription_status == 'free_trial':
                owner.free_trial_conversations_used += 1
                logger.info(f"🔄 [DEBUG] Incrementato free_trial_conversations_used: {owner.free_trial_conversations_used}")
            else:
                owner.conversations_used += 1
                logger.info(f"🔄 [DEBUG] Incrementato conversations_used: {owner.conversations_used}")
            db.commit()
            logger.info(f"🔄 [DEBUG] Dopo commit - conversations_used: {owner.conversations_used}, free_trial_conversations_used: {owner.free_trial_conversations_used}")
            
            # Controlla e invia avviso se rimangono meno del 10% delle conversazioni
            check_and_send_conversations_limit_warning(owner, db)
        
        # ============= FINE NUOVA LOGICA =============
        
        # Se la conversazione non ha ancora un thread_id, crealo ora
        if not conversation.thread_id:
            thread = client.beta.threads.create(extra_headers={"OpenAI-Beta": "assistants=v2"})
            thread_id = thread.id
            conversation.thread_id = thread_id
            db.commit()
            logger.info(f"🎤🆕 Creato thread OpenAI per conversazione esistente: {thread_id}")
        
        # Invia messaggio trascritto a OpenAI
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=transcribed_text,
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
            content=transcribed_text
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
        
        if is_new_conversation:
            chatbot.total_conversations += 1
        
        # Incrementa il contatore messaggi dell'utente
        if owner.subscription_status == 'free_trial':
            owner.free_trial_messages_used += 1
        else:
            owner.messages_used += 1
        
        db.commit()
        
        # Analizza la conversazione con Guardian (in background)
        import asyncio
        asyncio.create_task(analyze_conversation_with_guardian(conversation.id, db))
        
        # Calcola messaggi rimanenti
        if owner.subscription_status == 'free_trial':
            messages_remaining = owner.free_trial_messages_limit - owner.free_trial_messages_used
        else:
            messages_remaining = owner.messages_limit - owner.messages_used
        
        logger.info("🎤 Messaggio vocale processato con successo!")
        logger.info(f"🎤 Thread ID: {thread_id}")
        logger.info(f"🎤 Testo trascritto: {transcribed_text[:50]}...")
        logger.info(f"🎤 Risposta assistente: {assistant_message[:50]}...")
        
        return {
            "thread_id": thread_id,
            "transcribed_text": transcribed_text,
            "message": assistant_message,
            "messages_remaining": messages_remaining
        }
        
    except Exception as e:
        logger.error(f"Error in voice message: {e}")
        raise HTTPException(status_code=500, detail="Errore nel processare il messaggio vocale")


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
            detail="Abbonamento non attivo. Sottoscrivi un abbonamento mensile a 19€ per accedere alle funzionalità."
        )
    
    # Verifica se l'utente è proprietario o collaboratore del chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Controlla se l'utente è proprietario
    is_owner = chatbot.user_id == current_user.id
    
    # Se non è proprietario, controlla se è collaboratore
    if not is_owner:
        collaborator = db.query(ChatbotCollaborator).filter(
            ChatbotCollaborator.chatbot_id == chatbot_id,
            ChatbotCollaborator.user_id == current_user.id
        ).first()
        
        if not collaborator:
            raise HTTPException(status_code=403, detail="Non hai i permessi per accedere alle conversazioni di questo chatbot")
    
    conversations = db.query(Conversation).options(
        joinedload(Conversation.guest)
    ).filter(
        Conversation.chatbot_id == chatbot_id
    ).order_by(Conversation.started_at.desc()).all()
    
    result = []
    for conv in conversations:
        # Determina il nome da mostrare: numero di telefono se disponibile, altrimenti guest_name o "Ospite"
        display_name = "Ospite"
        if conv.guest and conv.guest.phone:
            display_name = conv.guest.phone
        elif conv.guest_name:
            display_name = conv.guest_name
        
        result.append({
            "id": conv.id,
            "guest_name": display_name,
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
    # Verifica se l'utente è proprietario o collaboratore del chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Controlla se l'utente è proprietario
    is_owner = chatbot.user_id == current_user.id
    
    # Se non è proprietario, controlla se è collaboratore
    if not is_owner:
        collaborator = db.query(ChatbotCollaborator).filter(
            ChatbotCollaborator.chatbot_id == chatbot_id,
            ChatbotCollaborator.user_id == current_user.id
        ).first()
        
        if not collaborator:
            raise HTTPException(status_code=403, detail="Non hai i permessi per accedere alle analitiche di questo chatbot")
    
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
        Message.timestamp >= thirty_days_ago,
        Message.role == "user"
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

def get_guardian_price_id_for_user(user: User) -> str:
    """Ottiene il price ID Guardian corretto basato sull'abbonamento dell'utente"""
    # Usa conversations_limit se disponibile, altrimenti conversation_limit
    limit = user.conversations_limit or user.conversation_limit or 20
    
    if limit >= 500:  # Enterprise
        return settings.STRIPE_ENTERPRISE_GUARDIAN_PRICE_ID
    elif limit >= 150:  # Pro
        return settings.STRIPE_PRO_GUARDIAN_PRICE_ID
    elif limit >= 50:  # Premium
        return settings.STRIPE_PREMIUM_GUARDIAN_PRICE_ID
    else:  # Standard (default)
        return settings.STRIPE_STANDARD_GUARDIAN_PRICE_ID

def get_guardian_price_for_user(user: User) -> int:
    """Ottiene il prezzo Guardian in euro basato sull'abbonamento dell'utente"""
    # Usa conversations_limit se disponibile, altrimenti conversation_limit
    limit = user.conversations_limit or user.conversation_limit or 20
    
    if limit >= 500:  # Enterprise
        return 89
    elif limit >= 150:  # Pro
        return 36
    elif limit >= 50:  # Premium
        return 18
    else:  # Standard (default)
        return 9

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
                detail="Devi avere un abbonamento OspiterAI attivo per sottoscrivere Guardian"
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
        
        # Crea Checkout Session per Guardian con prezzo basato sull'abbonamento
        logger.info(f"Creating Guardian checkout session for user {current_user.id}")
        
        # Price ID per Guardian basato sull'abbonamento dell'utente
        guardian_price_id = get_guardian_price_id_for_user(current_user)
        guardian_price = get_guardian_price_for_user(current_user)
        
        logger.info(f"User {current_user.id} will pay {guardian_price}€/mese for Guardian (limit: {current_user.conversations_limit or current_user.conversation_limit or 20})")
        
        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': guardian_price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/dashboard/guardian?subscription=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/dashboard/guardian?subscription=cancelled",
            metadata={
                'user_id': str(current_user.id),
                'subscription_type': 'guardian',
            }
        )
        
        logger.info(f"Guardian checkout session created successfully: {checkout_session.id}")
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
        
    except Exception as e:
        logger.error(f"Guardian Stripe checkout error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def create_combined_checkout_session(current_user: User, db: Session):
    """Reindirizza utenti in free trial alla pagina di selezione combinata OspiterAI + Guardian"""
    try:
        logger.info(f"Free trial user {current_user.id} requesting Guardian - redirecting to combined selection page")
        
        # Reindirizza alla pagina di selezione combinata
        return {
            "redirect_url": f"{settings.FRONTEND_URL}/select-service-ospiteraiandguardian",
            "is_combined": True
        }
        
    except Exception as e:
        logger.error(f"Combined checkout redirect error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/subscription/create-combined-checkout")
async def create_combined_subscription_checkout(
    plan_price_id: str,
    guardian_price_id: str,
    billing: str = "monthly",
    guardian_billing: str = "monthly",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea checkout combinato per OspiterAI + Guardian"""
    try:
        logger.info(f"Creating combined checkout for user {current_user.id}: plan={plan_price_id}, guardian={guardian_price_id}, billing={billing}")
        
        # Verifica che l'utente sia in free trial
        if current_user.subscription_status != 'free_trial':
            raise HTTPException(
                status_code=400,
                detail="Questa funzionalità è disponibile solo per utenti in free trial"
            )
        
        # Crea o recupera customer Stripe
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name
            )
            current_user.stripe_customer_id = customer.id
            db.commit()
        
        # Ottieni i price ID reali dalle impostazioni
        plan_price_id_mapping = {
            'STANDARD_PRICE_ID': settings.STRIPE_STANDARD_PRICE_ID,
            'PREMIUM_PRICE_ID': settings.STRIPE_PREMIUM_PRICE_ID,
            'PRO_PRICE_ID': settings.STRIPE_PRO_PRICE_ID,
            'ENTERPRISE_PRICE_ID': settings.STRIPE_ENTERPRISE_PRICE_ID,
            'ANNUAL_STANDARD_PRICE_ID': settings.STRIPE_ANNUAL_STANDARD_PRICE_ID,
            'ANNUAL_PREMIUM_PRICE_ID': settings.STRIPE_ANNUAL_PREMIUM_PRICE_ID,
            'ANNUAL_PRO_PRICE_ID': settings.STRIPE_ANNUAL_PRO_PRICE_ID,
            'ANNUAL_ENTERPRISE_PRICE_ID': settings.STRIPE_ANNUAL_ENTERPRISE_PRICE_ID,
        }
        
        guardian_price_id_mapping = {
            'STANDARD_GUARDIAN_PRICE_ID': settings.STRIPE_STANDARD_GUARDIAN_PRICE_ID,
            'PREMIUM_GUARDIAN_PRICE_ID': settings.STRIPE_PREMIUM_GUARDIAN_PRICE_ID,
            'PRO_GUARDIAN_PRICE_ID': settings.STRIPE_PRO_GUARDIAN_PRICE_ID,
            'ENTERPRISE_GUARDIAN_PRICE_ID': settings.STRIPE_ENTERPRISE_GUARDIAN_PRICE_ID,
        }
        
        # Determina il price ID corretto per OspiterAI basato sul billing
        if billing == 'annual':
            # Se è annuale, usa il price ID annuale
            annual_plan_price_id = f"ANNUAL_{plan_price_id}"
            real_plan_price_id = plan_price_id_mapping.get(annual_plan_price_id, settings.STRIPE_ANNUAL_STANDARD_PRICE_ID)
        else:
            # Se è mensile, usa il price ID mensile
            real_plan_price_id = plan_price_id_mapping.get(plan_price_id, settings.STRIPE_STANDARD_PRICE_ID)
        
        # Guardian è sempre mensile
        real_guardian_price_id = guardian_price_id_mapping.get(guardian_price_id, settings.STRIPE_STANDARD_GUARDIAN_PRICE_ID)
        
        # Crea sessione checkout con entrambi i prodotti
        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[
                {
                    'price': real_plan_price_id,
                    'quantity': 1,
                },
                {
                    'price': real_guardian_price_id,
                    'quantity': 1,
                }
            ],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/dashboard/guardian?subscription=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/select-service-ospiteraiandguardian?subscription=cancelled",
            metadata={
                'user_id': str(current_user.id),
                'subscription_type': 'combined',
                'free_trial_conversion': 'true',
                'plan_price_id': real_plan_price_id,
                'guardian_price_id': real_guardian_price_id
            }
        )
        
        logger.info(f"Combined checkout session created successfully: {checkout_session.id}")
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
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
                    if sub.items.data and len(sub.items.data) > 0:
                        price_id = sub.items.data[0].price.id
                        if price_id == settings.STRIPE_PRICE_ID or price_id == settings.STRIPE_ANNUAL_PRICE_ID:
                            hostgpt_subscription = sub
                        elif (price_id == settings.STRIPE_GUARDIAN_PRICE_ID or  # Legacy
                              price_id == settings.STRIPE_STANDARD_GUARDIAN_PRICE_ID or
                              price_id == settings.STRIPE_PREMIUM_GUARDIAN_PRICE_ID or
                              price_id == settings.STRIPE_PRO_GUARDIAN_PRICE_ID or
                              price_id == settings.STRIPE_ENTERPRISE_GUARDIAN_PRICE_ID):
                            guardian_subscription = sub
                
                # Aggiorna HostGPT subscription
                if hostgpt_subscription:
                    user.stripe_subscription_id = hostgpt_subscription.id
                    user.subscription_status = 'active'
                    user.subscription_end_date = datetime.utcfromtimestamp(hostgpt_subscription.current_period_end)
                    user.free_trial_converted = True
                    logger.info(f"User {user.id} OspiterAI subscription activated: {hostgpt_subscription.id}")
                
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
"🎉 OspiterAI Subscription Activated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento OspiterAI Attivato!", 
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
        "🎉 OspiterAI Subscription Activated!" if (current_user.language or "it") == "en" else "🎉 Abbonamento OspiterAI Attivato!", 
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
            email_body = create_guardian_subscription_reactivation_email_simple(current_user.full_name or current_user.email, current_user.language or "it")
            background_tasks.add_task(
                send_email, 
                current_user.email, 
"🛡️ Guardian Subscription Reactivated!" if (current_user.language or "it") == "en" else "🛡️ Abbonamento Guardian Riattivato!", 
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
        email_body = create_guardian_subscription_cancellation_email_simple(
            current_user.full_name or current_user.email,
            end_date,
            current_user.language or "it"
        )
        email_subject = "😔 Guardian Subscription Cancelled" if (current_user.language or "it") == "en" else "😔 Abbonamento Guardian Annullato"
        background_tasks.add_task(
            send_email, 
            current_user.email, 
            email_subject, 
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
            <p>Il tuo abbonamento OspiterAI Guardian è stato riattivato con successo!</p>
            <p>Ora puoi continuare a utilizzare tutte le funzionalità Guardian per proteggere la soddisfazione dei tuoi ospiti.</p>
            <p>Grazie per aver scelto OspiterAI Guardian!</p>
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

# ============= Monthly Report APIs =============

@app.get("/api/reports/monthly")
async def get_monthly_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni il report mensile per l'utente corrente"""
    try:
        # Genera i dati del report
        report_data = generate_monthly_report_data(current_user.id, db)
        
        return report_data
        
    except Exception as e:
        logger.error(f"Error getting monthly report for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recupero del report mensile")

@app.post("/api/reports/monthly/send")
async def send_monthly_report(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invia il report mensile via email all'utente corrente"""
    try:
        # Genera i dati del report
        report_data = generate_monthly_report_data(current_user.id, db)
        
        # Crea l'email
        email_body = create_monthly_report_email_simple(
            user_name=current_user.full_name or current_user.email,
            report_data=report_data,
            language=current_user.language or "it"
        )
        
        email_subject = "Your Monthly OspiterAI Report 📊" if (current_user.language or "it") == "en" else "Il tuo Report Mensile OspiterAI 📊"
        
        # Invia l'email
        background_tasks.add_task(
            send_email,
            current_user.email,
            email_subject,
            email_body
        )
        
        logger.info(f"Monthly report email sent to user {current_user.id}")
        
        return {"status": "sent", "message": "Report mensile inviato con successo"}
        
    except Exception as e:
        logger.error(f"Error sending monthly report for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Errore nell'invio del report mensile")

@app.post("/api/reports/monthly/send-all")
async def send_monthly_reports_to_all_users(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Invia il report mensile a tutti gli utenti attivi (da chiamare via cron job)"""
    try:
        # Ottieni tutti gli utenti con abbonamento attivo
        active_users = db.query(User).filter(
            User.subscription_status.in_(['active', 'cancelling'])
        ).all()
        
        reports_sent = 0
        
        for user in active_users:
            try:
                # Genera i dati del report
                report_data = generate_monthly_report_data(user.id, db)
                
                # Crea l'email
                email_body = create_monthly_report_email_simple(
                    user_name=user.full_name or user.email,
                    report_data=report_data,
                    language=user.language or "it"
                )
                
                email_subject = "Your Monthly OspiterAI Report 📊" if (user.language or "it") == "en" else "Il tuo Report Mensile OspiterAI 📊"
                
                # Invia l'email
                background_tasks.add_task(
                    send_email,
                    user.email,
                    email_subject,
                    email_body
                )
                
                reports_sent += 1
                logger.info(f"Monthly report queued for user {user.id}")
                
            except Exception as e:
                logger.error(f"Error processing monthly report for user {user.id}: {e}")
                continue
        
        logger.info(f"Monthly reports sent to {reports_sent} users")
        
        return {
            "status": "completed",
            "reports_sent": reports_sent,
            "total_users": len(active_users)
        }
        
    except Exception as e:
        logger.error(f"Error sending monthly reports to all users: {e}")
        raise HTTPException(status_code=500, detail="Errore nell'invio dei report mensili")

@app.get("/api/reports/monthly/test/{user_id}")
async def test_monthly_report(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Endpoint di test per verificare il report mensile di un utente specifico"""
    try:
        # Genera i dati del report
        report_data = generate_monthly_report_data(user_id, db)
        
        return {
            "user_id": user_id,
            "report_data": report_data,
            "test_mode": True
        }
        
    except Exception as e:
        logger.error(f"Error testing monthly report for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Errore nel test del report mensile")

# ============= Guardian Analytics APIs =============

@app.get("/api/chat/{uuid}/status")
async def get_chat_status(
    uuid: str,
    thread_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Ottieni lo stato della chat (se è sospesa per alert Guardian)"""
    try:
        chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
        
        if not chatbot or not chatbot.is_active:
            raise HTTPException(status_code=404, detail="Chatbot non trovato")
        
        # Se non c'è thread_id, la chat non è sospesa
        if not thread_id:
            return {"suspended": False, "message": None}
        
        # Cerca la conversazione per questo thread_id o conversation_id
        conversation = None
        if thread_id.startswith('conv_'):
            # Se è un conversation_id, estrai l'ID
            conversation_id = int(thread_id.replace('conv_', ''))
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.chatbot_id == chatbot.id
            ).first()
        else:
            # Se è un thread_id normale
            conversation = db.query(Conversation).filter(
                Conversation.thread_id == thread_id,
                Conversation.chatbot_id == chatbot.id
            ).first()
        
        if not conversation:
            return {"suspended": False, "message": None}
        
        # Verifica se è sospesa
        if conversation.guardian_suspended:
            return {
                "suspended": True,
                "message": "La conversazione è temporaneamente sospesa in attesa che l'host risponda di persona. Ti arriverà una mail quando lo farà. Nel frattempo puoi cliccare il pulsante refresh in alto per iniziare una nuova conversazione."
            }
        
        return {"suspended": False, "message": None}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero dello stato della chat: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")

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
        
        # Controlla la cache prima di fare query al database
        cache_key = f"guardian_stats_{current_user.id}"
        cached_stats = get_cached_data(cache_key)
        
        if cached_stats is not None:
            logger.info(f"Cache hit per statistiche Guardian utente {current_user.id}")
            return cached_stats
        
        # Ottieni le statistiche dal database
        stats = guardian_service.get_guardian_statistics(current_user.id, db)
        
        # Salva nella cache
        set_cached_data(cache_key, stats)
        logger.info(f"Statistiche Guardian salvate in cache per utente {current_user.id}")
        
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
        
        # Controlla la cache prima di fare query al database
        cache_key = f"guardian_alerts_{current_user.id}"
        cached_alerts = get_cached_data(cache_key)
        
        if cached_alerts is not None:
            logger.info(f"Cache hit per alert Guardian utente {current_user.id}")
            return cached_alerts
        
        # Ottieni gli alert non risolti
        alerts = db.query(GuardianAlert).filter(
            GuardianAlert.user_id == current_user.id,
            GuardianAlert.is_resolved == False
        ).order_by(GuardianAlert.created_at.desc()).all()
        
        logger.info(f"User {current_user.id}: trovati {len(alerts)} alert attivi (non risolti)")
        
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
            
            # Recupera il numero di telefono del guest
            conversation = db.query(Conversation).filter(Conversation.id == alert.conversation_id).first()
            guest_phone = "N/A"
            if conversation:
                guest = db.query(Guest).filter(Guest.id == conversation.guest_id).first()
                if guest and guest.phone:
                    guest_phone = guest.phone
            
            # Accorcia il messaggio dell'alert
            short_message = alert.message
            if "insufficient_info" in alert.alert_type:
                short_message = "Mancanza di informazioni."
            elif "negative_review_risk" in alert.alert_type:
                short_message = "Rischio recensione negativa."
            
            formatted_alerts.append({
                'id': alert.id,
                'guest_id': guest_phone,
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'message': short_message,
                'suggested_action': alert.suggested_action,
                'created_at': alert.created_at.isoformat(),
                'conversation': conversation_data
            })
        
        # Salva nella cache
        set_cached_data(cache_key, formatted_alerts)
        logger.info(f"Alert Guardian salvati in cache per utente {current_user.id}")
        
        return formatted_alerts
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Guardian alerts: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recupero degli alert Guardian")

@app.post("/api/guardian/alerts/{alert_id}/resolve")
async def resolve_guardian_alert(
    alert_id: int,
    response_data: dict,
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
        
        # Estrai la risposta dell'host
        host_response = response_data.get('host_response', '').strip()
        if not host_response:
            raise HTTPException(
                status_code=400,
                detail="Risposta dell'host richiesta"
            )
        
        # Recupera la conversazione associata all'alert
        conversation = db.query(Conversation).filter(
            Conversation.id == alert.conversation_id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversazione non trovata"
            )
        
        # Salva la risposta dell'host come messaggio chatbot
        host_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=host_response
        )
        db.add(host_message)
        
        # Aggiorna il contatore messaggi
        conversation.message_count += 1
        
        # Risolve l'alert
        success = guardian_service.resolve_alert(alert_id, current_user.email, db)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Errore nella risoluzione dell'alert"
            )
        
        # Sblocca la conversazione e resetta i flag Guardian
        conversation.guardian_resolved = True
        conversation.guardian_suspended = False
        conversation.guardian_alert_triggered = False  # Reset per permettere nuove analisi
        conversation.guardian_analyzed = False  # Reset per permettere nuove analisi
        db.commit()
        
        # Invia email al guest con la conversazione completa
        logger.info(f"📧 Invio email di risoluzione al guest per conversazione {conversation.id}")
        email_success = guardian_service.send_guest_resolution_email(conversation, host_response, db)
        if email_success:
            logger.info(f"📧 Email di risoluzione inviata con successo per conversazione {conversation.id}")
        else:
            logger.error(f"📧 Errore nell'invio dell'email di risoluzione per conversazione {conversation.id}")
        
        # Invalida la cache per questo utente
        invalidate_user_cache(current_user.id)
        
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
        
        # Analizza SEMPRE ogni nuovo messaggio, anche se c'è già un alert attivo
        # Questo permette di rilevare:
        # 1. Nuova insoddisfazione dell'ospite (nuovo messaggio dell'ospite)
        # 2. Mancanza di informazioni del chatbot (nuova risposta del chatbot)
        logger.info(f"Analizzando conversazione {conversation_id} - ogni messaggio viene analizzato individualmente")
        
        # Analizza la conversazione
        analysis_result = guardian_service.analyze_conversation(conversation, db)
        
        # Se il rischio è alto O se il chatbot non ha abbastanza informazioni, gestisci l'alert
        insufficient_info = analysis_result.get('insufficient_info', False)
        if analysis_result['risk_score'] >= guardian_service.risk_threshold or insufficient_info:
            # Se non c'è già un alert attivo, creane uno nuovo
            if not conversation.guardian_alert_triggered:
                # Crea l'alert
                alert = guardian_service.create_alert(conversation, analysis_result, db)
                
                # Sospendi la conversazione
                conversation.guardian_suspended = True
                conversation.guardian_alert_triggered = True
                db.commit()
                
                # Invia email di notifica all'host
                guardian_service.send_alert_email(alert, db)
                
                alert_type = "insufficient_info" if insufficient_info else "high_risk"
                logger.warning(f"🚨 NUOVO ALERT GUARDIAN: Conversazione {conversation_id} - {alert_type} - Rischio: {analysis_result['risk_score']:.3f}")
            else:
                # C'è già un alert attivo, logga solo il problema senza creare un nuovo alert
                alert_type = "insufficient_info" if insufficient_info else "high_risk"
                logger.warning(f"⚠️ PROBLEMA RILEVATO (alert già attivo): Conversazione {conversation_id} - {alert_type} - Rischio: {analysis_result['risk_score']:.3f}")
        
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
        current_user.free_trial_conversations_used = 0
        current_user.free_trial_converted = False
        current_user.messages_used = 0
        current_user.messages_reset_date = now
        current_user.conversations_used = 0
        current_user.conversations_reset_date = now
        
        # Imposta il limite di chatbot a 1 per il free trial
        current_user.max_chatbots = 1
        
        db.commit()
        
        # Invia email di benvenuto free trial
        # Per utenti che avviano il free trial manualmente, usiamo un link diretto alla dashboard
        dashboard_link = f"{settings.FRONTEND_URL}/dashboard"
        email_body = create_free_trial_welcome_email_simple(current_user.full_name or current_user.email, dashboard_link, current_user.language or "it")
        background_tasks.add_task(
            send_email, 
            current_user.email, 
"🎉 Welcome to your OspiterAI free trial!" if (current_user.language or "it") == "en" else "🎉 Benvenuto nel tuo periodo di prova gratuito OspiterAI!", 
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
                    "⏰ Il tuo periodo di prova OspiterAI scade tra 3 giorni",
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
                    "🚨 Il tuo periodo di prova OspiterAI scade domani!",
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
    "⏰ Your OspiterAI free trial has expired" if (user.language or "it") == "en" else "⏰ Il tuo periodo di prova OspiterAI è scaduto",
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

# RIMOSSO: La gestione della scadenza free trial è ora gestita dal database
# tramite stored procedure e event scheduler MySQL per migliori performance

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
                        logger.info(f"Deleted OspiterAI subscription {current_user.stripe_subscription_id}")
                except stripe.error.StripeError as e:
                    logger.error(f"Error deleting OspiterAI subscription: {e}")
            
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

# ============= Hostaway Integration Endpoints =============

@app.post("/api/hostaway/save-api-key")
async def save_hostaway_api_key(
    request: HostawayApiKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Salva le credenziali Hostaway nella tabella users"""
    try:
        # Testa le credenziali ottenendo un access token
        access_token = await get_hostaway_access_token(request.account_id, request.api_key)
        
        # Cripta le credenziali
        encrypted_api_key = encrypt_api_key(request.api_key)
        encrypted_access_token = encrypt_api_key(access_token)
        
        # Salva direttamente nella tabella users
        current_user.hostaway_account_id = request.account_id
        current_user.hostaway_api_key = encrypted_api_key
        current_user.hostaway_access_token = encrypted_access_token
        current_user.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "status": "success",
            "message": "Credenziali Hostaway salvate con successo"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving Hostaway credentials for user {current_user.id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Errore nel salvare le credenziali")

@app.get("/api/hostaway/apartments")
async def get_hostaway_apartments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recupera gli appartamenti da Hostaway"""
    try:
        # Ottieni un token valido (rinnova automaticamente se necessario)
        access_token = await get_valid_hostaway_token(current_user.id, db)
        
        # Recupera gli appartamenti da Hostaway
        apartments = await fetch_hostaway_apartments(access_token)
        
        # Recupera i mapping esistenti per questo utente
        existing_mappings = db.query(HostawayMapping).filter(HostawayMapping.user_id == current_user.id).all()
        mapping_dict = {mapping.hostaway_apartment_id: mapping for mapping in existing_mappings}
        
        # Recupera i chatbot dell'utente
        user_chatbots = db.query(Chatbot).filter(Chatbot.user_id == current_user.id).all()
        
        # Aggiungi informazioni sui mapping agli appartamenti
        for apartment in apartments:
            mapping = mapping_dict.get(apartment['id'])
            apartment['is_mapped'] = mapping.is_mapped if mapping else False
            apartment['chatbot_id'] = mapping.chatbot_id if mapping and mapping.is_mapped else None
        
        return {
            "status": "success",
            "apartments": apartments,
            "chatbots": [{"id": cb.id, "name": cb.name} for cb in user_chatbots]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Hostaway apartments for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recuperare gli appartamenti")

@app.post("/api/hostaway/save-mapping")
async def save_hostaway_mapping(
    request: HostawayMappingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Salva il mapping tra appartamenti Hostaway e chatbot"""
    try:
        # Ottieni un token valido per recuperare i dettagli degli appartamenti
        access_token = await get_valid_hostaway_token(current_user.id, db)
        apartments = await fetch_hostaway_apartments(access_token)
        apartment_dict = {apt['id']: apt for apt in apartments}
        
        # Processa ogni mapping
        for mapping_data in request.mappings:
            apartment_id = mapping_data.get('apartment_id')
            chatbot_id = mapping_data.get('chatbot_id')
            
            if not apartment_id:
                continue
                
            apartment_info = apartment_dict.get(apartment_id)
            if not apartment_info:
                continue
            
            # Verifica se esiste già un mapping per questo appartamento
            existing_mapping = db.query(HostawayMapping).filter(
                HostawayMapping.user_id == current_user.id,
                HostawayMapping.hostaway_apartment_id == apartment_id
            ).first()
            
            if existing_mapping:
                # Aggiorna il mapping esistente
                existing_mapping.chatbot_id = chatbot_id
                existing_mapping.is_mapped = chatbot_id is not None
                existing_mapping.updated_at = datetime.utcnow()
            else:
                # Crea un nuovo mapping
                new_mapping = HostawayMapping(
                    user_id=current_user.id,
                    chatbot_id=chatbot_id,
                    hostaway_apartment_id=apartment_id,
                    hostaway_apartment_name=apartment_info['name'],
                    hostaway_apartment_address=apartment_info['address'],
                    is_mapped=chatbot_id is not None
                )
                db.add(new_mapping)
        
        db.commit()
        
        return {
            "status": "success",
            "message": "Mapping salvato con successo"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving Hostaway mapping for user {current_user.id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Errore nel salvare il mapping")

@app.get("/api/hostaway/mappings")
async def get_hostaway_mappings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recupera tutti i mapping Hostaway dell'utente"""
    try:
        mappings = db.query(HostawayMapping).filter(HostawayMapping.user_id == current_user.id).all()
        
        result = []
        for mapping in mappings:
            chatbot_name = None
            if mapping.chatbot_id:
                chatbot = db.query(Chatbot).filter(Chatbot.id == mapping.chatbot_id).first()
                chatbot_name = chatbot.name if chatbot else None
            
            result.append({
                "id": mapping.id,
                "apartment_id": mapping.hostaway_apartment_id,
                "apartment_name": mapping.hostaway_apartment_name,
                "apartment_address": mapping.hostaway_apartment_address,
                "chatbot_id": mapping.chatbot_id,
                "chatbot_name": chatbot_name,
                "is_mapped": mapping.is_mapped,
                "created_at": mapping.created_at.isoformat() if mapping.created_at else None,
                "updated_at": mapping.updated_at.isoformat() if mapping.updated_at else None
            })
        
        return {
            "status": "success",
            "mappings": result
        }
        
    except Exception as e:
        logger.error(f"Error fetching Hostaway mappings for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recuperare i mapping")

# ============= Property Analysis Endpoint =============

class PropertyAnalysisRequest(BaseModel):
    url: str

# Endpoint di test senza autenticazione
@app.post("/api/analyze-property-test")
async def analyze_property_test(
    request: PropertyAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Analizza una pagina di proprietà senza autenticazione per test"""
    try:
        logger.info(f"🔍 BACKEND TEST: Ricevuta richiesta di analisi proprietà (senza auth)")
        logger.info(f"🔍 BACKEND TEST: URL da analizzare: {request.url}")
        
        # Crea un utente fittizio per il test
        class MockUser:
            id = "test_user"
            email = "test@example.com"
            subscription_status = "free_trial"
            free_trial_messages_used = 0
            free_trial_messages_limit = 100
            free_trial_end_date = datetime.utcnow() + timedelta(days=30)
        
        current_user = MockUser()
        
        # Usa la stessa logica dell'endpoint principale
        return await analyze_property_logic(request, current_user, db)
        
    except Exception as e:
        logger.error(f"❌ BACKEND TEST: Error: {e}")
        raise HTTPException(status_code=500, detail=f"Errore nel test: {str(e)}")

async def analyze_property_logic(request: PropertyAnalysisRequest, current_user, db: Session):
    """Logica principale per l'analisi della proprietà"""
    try:
        logger.info(f"🔍 BACKEND: Ricevuta richiesta di analisi proprietà")
        logger.info(f"🔍 BACKEND: User ID: {current_user.id}")
        logger.info(f"🔍 BACKEND: User email: {current_user.email}")
        logger.info(f"🔍 BACKEND: Subscription status: {current_user.subscription_status}")
        logger.info(f"🔍 BACKEND: URL da analizzare: {request.url}")
        logger.info(f"Analyzing property for user {current_user.id}: {request.url}")
        
        # Verifica che l'utente abbia un abbonamento attivo
        logger.info(f"🔍 BACKEND: Verificando abbonamento...")
        logger.info(f"🔍 BACKEND: is_subscription_active: {is_subscription_active(current_user.subscription_status)}")
        logger.info(f"🔍 BACKEND: is_free_trial_active: {is_free_trial_active(current_user)}")
        
        if not is_subscription_active(current_user.subscription_status) and not is_free_trial_active(current_user):
            logger.error(f"❌ BACKEND: Abbonamento non attivo per user {current_user.id}")
            raise HTTPException(
                status_code=403, 
                detail="Abbonamento richiesto per utilizzare l'analisi proprietà"
            )
        
        # Verifica i limiti del free trial
        if current_user.subscription_status == 'free_trial':
            remaining_messages = get_free_trial_messages_remaining(current_user)
            if remaining_messages <= 0:
                raise HTTPException(
                    status_code=403,
                    detail="Limite messaggi free trial raggiunto"
                )
        
        # Valida l'URL
        try:
            from urllib.parse import urlparse
            parsed_url = urlparse(request.url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise ValueError("URL non valido")
        except Exception:
            raise HTTPException(status_code=400, detail="URL non valido")
        
        # Estrazione contenuto con Playwright (fallback a requests)
        logger.info(f"🔍 Iniziando estrazione contenuto della pagina: {request.url}")
        
        page_content = await extract_property_content(request.url)
        
        if not page_content:
            raise HTTPException(
                status_code=400, 
                detail="Impossibile estrarre contenuto dalla pagina"
            )
        
        # Usa OpenAI per analizzare il contenuto
        client = get_openai_client()
        
        prompt = f"""
Analizza il contenuto di questa pagina di una proprietà di affitto vacanze e estrai tutte le informazioni disponibili.

URL: {request.url}

Contenuto della pagina:
{page_content}

⚠️ IMPORTANTE - ISTRUZIONI CRITICHE:
- IGNORA COMPLETAMENTE qualsiasi recensione negativa, commento negativo o feedback negativo
- NON includere nelle informazioni estratti contenuti che potrebbero danneggiare la reputazione della proprietà
- Se trovi recensioni negative, commenti negativi o feedback negativi, NON usarli per generare il JSON
- Concentrati SOLO sulle informazioni positive e neutre della proprietà
- Estrai solo informazioni utili per ospiti futuri (descrizioni, servizi, regole, etc.)

⚠️ IMPORTANTE: NON includere informazioni sull'indirizzo nel JSON. L'indirizzo sarà inserito separatamente dall'host tramite validazione Google API.

Estrai le informazioni e restituisci SOLO un JSON valido con questa struttura esatta:

{{
  "property_name": "Nome della proprietà",
  "property_type": "appartamento|villa|casa|stanza|loft|monolocale|bed_breakfast",
  "property_description": "Descrizione dettagliata della proprietà",
  "check_in_time": "Orario check-in (es. 15:00 - 20:00)",
  "check_out_time": "Orario check-out (es. 10:00)",
  "house_rules": "Regole della casa",
  "amenities": ["wifi", "aria_condizionata", "riscaldamento", "tv", "netflix", "cucina", "lavastoviglie", "lavatrice", "asciugatrice", "ferro", "parcheggio", "piscina", "palestra", "balcone", "giardino", "ascensore", "cassaforte", "allarme", "animali_ammessi", "fumatori_ammessi"],
  "neighborhood_description": "Descrizione del quartiere",
  "transportation_info": "Informazioni sui trasporti (campo opzionale)",
  "shopping_info": "Informazioni sui negozi e shopping",
  "parking_info": "Informazioni sul parcheggio",
  "special_instructions": "Istruzioni speciali",
  "welcome_message": "Messaggio di benvenuto",
  "nearby_attractions": [
    {{
      "name": "Nome attrazione",
      "note": "Note o descrizione breve (opzionale)"
    }}
  ],
  "restaurants_bars": [
    {{
      "name": "Nome locale",
      "note": "Note o tipo di locale (opzionale)"
    }}
  ],
  "emergency_contacts": [
    {{
      "name": "Nome contatto (es. Host, Mario Rossi)",
      "number": "Numero di telefono",
      "type": "Tipo (es. Host, Emergenza, Polizia)"
    }}
  ],
  "faq": [
    {{
      "question": "Domanda frequente",
      "answer": "Risposta"
    }}
  ],
  "wifi_info": {{
    "network": "Nome rete WiFi",
    "password": "Password WiFi"
  }}
}}

IMPORTANTE:
- Restituisci SOLO il JSON, senza testo aggiuntivo
- Se un'informazione non è disponibile, usa una stringa vuota ""
- Per gli array, se non ci sono elementi, restituisci un array vuoto []
- Per gli amenities, usa solo i valori esatti dalla lista fornita
- Per property_type, usa solo uno dei valori esatti dalla lista
- Se non trovi informazioni specifiche, lascia il campo vuoto
"""
        
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Sei un assistente esperto nell'analisi di pagine web di proprietà di affitto vacanze. Estrai le informazioni in modo preciso e restituisci solo JSON valido."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=3000,
            )
            
            response_text = completion.choices[0].message.content.strip()
            
            if not response_text:
                raise HTTPException(
                    status_code=500, 
                    detail="Nessuna risposta da gpt-4o"
                )
            
            # Prova a parsare il JSON
            try:
                analysis_result = json.loads(response_text)
            except json.JSONDecodeError:
                # Prova a estrarre il JSON dal testo se è circondato da altro testo
                import re
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    try:
                        analysis_result = json.loads(json_match.group())
                    except json.JSONDecodeError:
                        raise HTTPException(
                            status_code=500, 
                            detail="Impossibile parsare la risposta JSON da gpt-4o"
                        )
                else:
                    raise HTTPException(
                        status_code=500, 
                        detail="Nessun JSON valido trovato nella risposta"
                    )
            
            # Aggiorna il contatore dei messaggi per il free trial
            if current_user.subscription_status == 'free_trial':
                current_user.free_trial_messages_used += 1
                db.commit()
            
            logger.info(f"Successfully analyzed property for user {current_user.id}")
            
            return {
                "status": "success",
                "data": analysis_result
            }
            
        except Exception as e:
            logger.error(f"OpenAI API error for user {current_user.id}: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Errore nell'analisi con gpt-4o: {str(e)}"
            )
        
    except HTTPException:
        raise        
    except Exception as e:
        logger.error(f"Error analyzing property for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Errore nell'analisi della proprietà: {str(e)}"
        )

# ============= Document Extraction Endpoint =============

def extract_text_from_pdf(file_content: bytes) -> str:
    """Estrae testo da file PDF"""
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        raise HTTPException(status_code=400, detail="Errore nell'estrazione del testo dal PDF")

def extract_text_from_docx(file_content: bytes) -> str:
    """Estrae testo da file DOCX"""
    try:
        docx_file = io.BytesIO(file_content)
        doc = docx.Document(docx_file)
        text = ""
        
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting DOCX text: {e}")
        raise HTTPException(status_code=400, detail="Errore nell'estrazione del testo dal DOCX")

def extract_text_from_odt(file_content: bytes) -> str:
    """Estrae testo da file ODT"""
    try:
        odt_file = io.BytesIO(file_content)
        doc = odf_load(odt_file)
        text = ""
        
        for paragraph in doc.text.getElementsByType(odf_text.P):
            text += teletype.extractText(paragraph) + "\n"
        
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting ODT text: {e}")
        raise HTTPException(status_code=400, detail="Errore nell'estrazione del testo dal ODT")

def extract_text_from_txt(file_content: bytes) -> str:
    """Estrae testo da file TXT"""
    try:
        # Prova diverse codifiche
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                text = file_content.decode(encoding)
                return text.strip()
            except UnicodeDecodeError:
                continue
        
        # Se nessuna codifica funziona, usa utf-8 con errori ignorati
        text = file_content.decode('utf-8', errors='ignore')
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting TXT text: {e}")
        raise HTTPException(status_code=400, detail="Errore nell'estrazione del testo dal TXT")

def clean_and_format_text(text: str) -> str:
    """Pulisce e formatta il testo estratto"""
    if not text:
        return ""
    
    # Rimuove righe vuote multiple
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if line:  # Se la riga non è vuota
            cleaned_lines.append(line)
    
    # Unisce le righe con un singolo \n
    cleaned_text = '\n'.join(cleaned_lines)
    
    # Limita la lunghezza (max 5000 caratteri per sicurezza DB)
    if len(cleaned_text) > 5000:
        cleaned_text = cleaned_text[:5000] + "..."
        logger.warning("Text truncated to 5000 characters")
    
    return cleaned_text

@app.post("/api/extract-document")
async def extract_document(file: UploadFile = File(...)):
    """Estrae il contenuto testuale da un documento"""
    try:
        logger.info(f"📄 Estrazione documento: {file.filename}")
        logger.info(f"📄 Tipo file: {file.content_type}")
        logger.info(f"📄 Dimensione: {file.size} bytes")
        
        # Verifica tipo file
        allowed_types = {
            'application/pdf': extract_text_from_pdf,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extract_text_from_docx,
            'application/vnd.oasis.opendocument.text': extract_text_from_odt,
            'text/plain': extract_text_from_txt
        }
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Formato file non supportato. Usa PDF, DOCX, ODT o TXT"
            )
        
        # Verifica dimensione (max 10MB)
        if file.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400, 
                detail="Il file non può superare i 10MB"
            )
        
        # Legge il contenuto del file
        file_content = await file.read()
        
        # Estrae il testo usando la funzione appropriata
        extractor = allowed_types[file.content_type]
        raw_text = extractor(file_content)
        
        # Pulisce e formatta il testo
        cleaned_text = clean_and_format_text(raw_text)
        
        if not cleaned_text:
            raise HTTPException(
                status_code=400, 
                detail="Nessun testo trovato nel documento"
            )
        
        logger.info(f"✅ Testo estratto: {len(cleaned_text)} caratteri")
        
        return {
            "status": "success",
            "content": cleaned_text,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "characters_extracted": len(cleaned_text)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting document: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Errore nell'elaborazione del documento: {str(e)}"
        )

@app.post("/api/analyze-property")
async def analyze_property(request: PropertyAnalysisRequest):
    """Analizza una pagina di proprietà - SEMPLICE, senza autenticazione"""
    try:
        logger.info(f"🔍 BACKEND: Analizzando proprietà: {request.url}")
        
        # Valida l'URL
        try:
            from urllib.parse import urlparse
            parsed_url = urlparse(request.url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise ValueError("URL non valido")
            
            # Controlla che sia una pagina di proprietà specifica
            #if "airbnb.it" in parsed_url.netloc:
                #if "ghost" not in request.url:
                    #raise HTTPException(
                        #status_code=400, 
                        #detail="URL non valido: deve essere una pagina specifica di una proprietà Airbnb (deve contenere /rooms/)"
                    #)
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="URL non valido")
        
        # Estrazione contenuto con Playwright (fallback a requests)
        logger.info(f"🔍 Iniziando estrazione contenuto della pagina: {request.url}")
        
        page_content = await extract_property_content(request.url)
        
        if not page_content:
            raise HTTPException(
                status_code=400, 
                detail="Impossibile estrarre contenuto dalla pagina"
            )
        
        # Usa OpenAI per analizzare il contenuto
        client = get_openai_client()
        
        logger.info(f"✅ OpenAI client configurato correttamente")
        logger.info(f"🔍 API Key presente: {client.api_key[:10]}...")
        
        # Verifica che l'API key sia valida
        try:
            import os
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                logger.error("❌ OPENAI_API_KEY non trovata nelle variabili d'ambiente!")
                raise HTTPException(
                    status_code=500, 
                    detail="OPENAI_API_KEY non trovata nelle variabili d'ambiente"
                )
            logger.info(f"✅ OPENAI_API_KEY trovata nelle variabili d'ambiente")
        except Exception as e:
            logger.error(f"❌ Errore nella verifica dell'API key: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Errore nella verifica dell'API key: {str(e)}"
            )
        
        prompt = f"""
Analizza il contenuto di questa pagina di una proprietà di affitto vacanze e estrai tutte le informazioni disponibili.

Contenuto della pagina:
{page_content}

⚠️ IMPORTANTE - ISTRUZIONI CRITICHE:
- IGNORA COMPLETAMENTE qualsiasi recensione negativa, commento negativo o feedback negativo
- NON includere nelle informazioni estratti contenuti che potrebbero danneggiare la reputazione della proprietà
- Se trovi recensioni negative, commenti negativi o feedback negativi, NON usarli per generare il JSON
- Concentrati SOLO sulle informazioni positive e neutre della proprietà
- Estrai solo informazioni utili per ospiti futuri (descrizioni, servizi, regole, etc.)

Estrai le informazioni dal testo sopra e includi:
- Nome della proprietà
- Tipo di proprietà  
- Descrizione dettagliata
- Orari di check-in e check-out
- Regole della casa
- Tutti i servizi e amenità disponibili
- Descrizione del quartiere
- Informazioni sui trasporti (ora opzionali)
- Informazioni sui negozi e shopping
- Informazioni sul parcheggio
- Istruzioni speciali
- Messaggio di benvenuto
- Attrazioni nelle vicinanze (solo nome e note)
- Ristoranti e bar nelle vicinanze (solo nome e note)
- Contatti di emergenza (almeno uno dell'host)
- FAQ
- Informazioni WiFi (nome rete e password)

⚠️ IMPORTANTE: NON includere informazioni sull'indirizzo nel JSON. L'indirizzo sarà inserito separatamente dall'host tramite validazione Google API.

Estrai le informazioni e restituisci SOLO un JSON valido con questa struttura esatta:

{{
  "property_name": "Nome della proprietà",
  "property_type": "appartamento|villa|casa|stanza|loft|monolocale|bed_breakfast",
  "property_description": "Descrizione dettagliata della proprietà",
  "check_in_time": "Orario check-in (es. 15:00 - 20:00)",
  "check_out_time": "Orario check-out (es. 10:00)",
  "house_rules": "Regole della casa",
  "amenities": ["wifi", "aria_condizionata", "riscaldamento", "tv", "netflix", "cucina", "lavastoviglie", "lavatrice", "asciugatrice", "ferro", "parcheggio", "piscina", "palestra", "balcone", "giardino", "ascensore", "cassaforte", "allarme", "animali_ammessi", "fumatori_ammessi"],
  "neighborhood_description": "Descrizione del quartiere",
  "transportation_info": "Informazioni sui trasporti (campo opzionale)",
  "shopping_info": "Informazioni sui negozi e shopping",
  "parking_info": "Informazioni sul parcheggio",
  "special_instructions": "Istruzioni speciali",
  "welcome_message": "Messaggio di benvenuto",
  "nearby_attractions": [
    {{
      "name": "Nome attrazione",
      "note": "Note o descrizione breve (opzionale)"
    }}
  ],
  "restaurants_bars": [
    {{
      "name": "Nome locale",
      "note": "Note o tipo di locale (opzionale)"
    }}
  ],
  "emergency_contacts": [
    {{
      "name": "Nome contatto (es. Host, Mario Rossi)",
      "number": "Numero di telefono",
      "type": "Tipo (es. Host, Emergenza, Polizia)"
    }}
  ],
  "faq": [
    {{
      "question": "Domanda frequente",
      "answer": "Risposta"
    }}
  ],
  "wifi_info": {{
    "network": "Nome rete WiFi",
    "password": "Password WiFi"
  }}
}}

IMPORTANTE:
- Restituisci SOLO il JSON, senza testo aggiuntivo
- Se un'informazione non è disponibile, usa una stringa vuota ""
- Per gli array, se non ci sono elementi, restituisci un array vuoto []
- Per gli amenities, usa solo i valori esatti dalla lista fornita
- Per property_type, usa solo uno dei valori esatti dalla lista
- Se non trovi informazioni specifiche, lascia il campo vuoto
"""
        
        try:
            logger.info(f"🔍 Invio prompt a gpt-4o-mini...")
            logger.info(f"🔍 Prompt: {prompt[:2000]}...")
            logger.info(f"🔍 Model: gpt-4o-mini")
            logger.info(f"🔍 Analizzando testo estratto")
            
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Sei un assistente esperto nell'analisi di pagine web di proprietà di affitto vacanze. Estrai tutte le informazioni disponibili e restituisci solo un JSON valido."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=4000
            )
            
            logger.info(f"✅ Risposta ricevuta da gpt-4o-mini")
            response_text = completion.choices[0].message.content.strip()
            logger.info(f"🔍 Risposta completa: {response_text[:500]}...")
            logger.info(f"🔍 Lunghezza risposta: {len(response_text)} caratteri")
            
            if not response_text:
                raise HTTPException(
                    status_code=500, 
                    detail="Nessuna risposta da gpt-4o"
                )
            
            # Prova a parsare il JSON
            try:
                analysis_result = json.loads(response_text)
            except json.JSONDecodeError:
                # Prova a estrarre il JSON dal testo se è circondato da altro testo
                import re
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    try:
                        analysis_result = json.loads(json_match.group())
                    except json.JSONDecodeError:
                        raise HTTPException(
                            status_code=500, 
                            detail="Impossibile parsare la risposta JSON da gpt-4o"
                        )
                else:
                    raise HTTPException(
                        status_code=500, 
                        detail="Nessun JSON valido trovato nella risposta"
                    )
            
            logger.info(f"✅ Analisi completata con successo!")
            
            return {
                "status": "success",
                "data": analysis_result
            }
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error details: {str(e)}")
            logger.error(f"Error repr: {repr(e)}")
            if hasattr(e, 'response'):
                logger.error(f"Response: {e.response}")
            if hasattr(e, 'status_code'):
                logger.error(f"Status code: {e.status_code}")
            if hasattr(e, 'message'):
                logger.error(f"Message: {e.message}")
            if hasattr(e, 'error'):
                logger.error(f"Error object: {e.error}")
            if hasattr(e, 'body'):
                logger.error(f"Body: {e.body}")
            raise HTTPException(
                status_code=500, 
                detail=f"Errore nell'analisi con gpt-4o: {str(e)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing property: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Errore nell'analisi della proprietà: {str(e)}"
        )

# --- Print Orders API ---

class PrintOrderCreate(BaseModel):
    chatbot_id: int
    products: List[dict]
    shipping_address: dict
    total_amount: float

class PrintOrderResponse(BaseModel):
    id: int
    order_number: str
    status: str
    total_amount: float
    created_at: datetime

@app.post("/api/print-orders/create", response_model=PrintOrderResponse)
async def create_print_order(
    order_data: PrintOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea un nuovo ordine di stampa"""
    
    try:
        print(f"[DEBUG] Ricevuto ordine da utente {current_user.id}")
        print(f"[DEBUG] Dati ordine: {order_data}")
        print(f"[DEBUG] Chatbot ID: {order_data.chatbot_id}")
        print(f"[DEBUG] Prodotti: {order_data.products}")
        print(f"[DEBUG] Indirizzo: {order_data.shipping_address}")
        print(f"[DEBUG] Totale: {order_data.total_amount}")
        
        # Verifica che il chatbot appartenga all'utente
        chatbot = db.query(Chatbot).filter(
            Chatbot.id == order_data.chatbot_id,
            Chatbot.user_id == current_user.id
        ).first()
        
        if not chatbot:
            print(f"[ERROR] Chatbot {order_data.chatbot_id} non trovato per utente {current_user.id}")
            raise HTTPException(status_code=404, detail="Chatbot non trovato")
        
        print(f"[DEBUG] Chatbot trovato: {chatbot.id}")
    
        # Genera numero ordine unico
        order_number = f"PRINT-{datetime.now().strftime('%Y%m%d')}-{secrets.token_hex(4).upper()}"
        print(f"[DEBUG] Numero ordine generato: {order_number}")
        
        # Crea l'ordine
        print_order = PrintOrder(
            user_id=current_user.id,
            chatbot_id=order_data.chatbot_id,
            order_number=order_number,
            total_amount=order_data.total_amount,
            shipping_address=order_data.shipping_address,
            status="pending",
            payment_status="pending"
        )
        
        print(f"[DEBUG] Creando ordine nel database...")
        db.add(print_order)
        db.commit()
        db.refresh(print_order)
        print(f"[DEBUG] Ordine creato con ID: {print_order.id}")
        
        # Aggiungi gli item dell'ordine
        print(f"[DEBUG] Aggiungendo {len(order_data.products)} prodotti...")
        for i, product in enumerate(order_data.products):
            print(f"[DEBUG] Prodotto {i}: {product}")
            if product["quantity"] > 0:
                # Genera il QR code dinamicamente come nella dashboard
                chat_url = f"{settings.FRONTEND_URL}/chat/{chatbot.uuid}"
                print(f"[DEBUG] Generando QR code per URL: {chat_url}")
                qr_code_data = generate_qr_code(chat_url, None)  # Non serve l'icona del chatbot
                print(f"[DEBUG] QR code generato: {qr_code_data is not None}")
                if qr_code_data:
                    print(f"[DEBUG] QR code length: {len(qr_code_data)}")
                else:
                    print(f"[ERROR] QR code è None!")
                
                # Ottieni la dimensione selezionata e il prezzo corretto
                selected_size = product.get("selectedSize", {}).get("id", "size_5x8")
                unit_price = product.get("selectedSize", {}).get("price", product["price"])
                
                # Crea un nome prodotto più descrittivo con la dimensione
                product_name = product["name"]
                if product["type"] == "sticker" and "selectedSize" in product:
                    size_info = product["selectedSize"]
                    product_name = f"{product['name']} ({size_info.get('dimensions', '')})"
                
                order_item = PrintOrderItem(
                    order_id=print_order.id,
                    product_type=product["type"],
                    product_name=product_name,
                    selected_size=selected_size,
                    quantity=product["quantity"],
                    unit_price=unit_price,
                    total_price=unit_price * product["quantity"],
                    qr_code_data=qr_code_data
                )
                print(f"[DEBUG] Aggiungendo item: {order_item.product_name} - Dimensione: {selected_size} - Quantità: {product['quantity']}")
                db.add(order_item)
        
        print(f"[DEBUG] Commit finale...")
        db.commit()
        print(f"[DEBUG] Ordine completato con successo!")
        
        return PrintOrderResponse(
            id=print_order.id,
            order_number=print_order.order_number,
            status=print_order.status,
            total_amount=print_order.total_amount,
            created_at=print_order.created_at
        )
        
    except Exception as e:
        print(f"[ERROR] Errore nella creazione ordine: {str(e)}")
        print(f"[ERROR] Tipo errore: {type(e)}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Errore interno del server: {str(e)}")

@app.post("/api/print-orders/create-payment")
async def create_payment_session(
    order_id: int,
    amount: int,
    currency: str = "eur",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea una sessione di pagamento Stripe per l'ordine"""
    
    # Verifica che l'ordine appartenga all'utente
    order = db.query(PrintOrder).filter(
        PrintOrder.id == order_id,
        PrintOrder.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Ordine non trovato")
    
    try:
        # Crea la sessione di pagamento Stripe
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': currency,
                    'product_data': {
                        'name': f'QR-Code Stampa - {order.order_number}',
                        'description': 'Adesivi e placche personalizzate con QR-Code'
                    },
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{settings.FRONTEND_URL}/stampe/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/stampe/cancel",
            metadata={
                'order_id': str(order_id),
                'order_number': order.order_number
            }
        )
        
        # Salva l'ID della sessione nell'ordine
        order.stripe_session_id = session.id
        db.commit()
        
        return {
            "checkout_url": session.url,
            "session_id": session.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Errore nel pagamento: {str(e)}")

class PaymentIntentRequest(BaseModel):
    order_id: int
    amount: int
    currency: str = "eur"

@app.post("/api/print-orders/create-payment-intent")
async def create_payment_intent(
    request: PaymentIntentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea un Payment Intent Stripe per il pagamento integrato"""
    
    # Verifica che l'ordine appartenga all'utente
    order = db.query(PrintOrder).filter(
        PrintOrder.id == request.order_id,
        PrintOrder.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Ordine non trovato")
    
    try:
        # Crea il Payment Intent
        intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            metadata={
                'order_id': str(request.order_id),
                'order_number': order.order_number,
                'user_id': str(current_user.id)
            },
            description=f'QR-Code Stampa - {order.order_number}'
        )
        
        # Salva l'ID del Payment Intent nell'ordine
        order.stripe_payment_intent_id = intent.id
        db.commit()
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Errore nel pagamento: {str(e)}")

@app.post("/api/print-orders/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook per gestire i pagamenti completati"""
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_PRINT_ORDERS_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        order_id = session['metadata']['order_id']
        
        # Aggiorna lo stato dell'ordine
        order = db.query(PrintOrder).filter(PrintOrder.id == order_id).first()
        if order:
            order.payment_status = "paid"
            order.status = "processing"
            order.stripe_payment_intent_id = session['payment_intent']
            db.commit()
            
            # Invia l'ordine a Printful per la produzione
            from printful_service import send_order_to_printful
            await send_order_to_printful(order, db)
            
            # Invia email di conferma ordine
            try:
                # Prepara i dati per l'email
                order_items = []
                for item in order.items:
                    product_name = "Adesivo QR-Code" if item.product_type == "sticker" else "Placca da Scrivania"
                    order_items.append({
                        'product_name': product_name,
                        'quantity': item.quantity,
                        'price': item.total_price
                    })
                
                email_body = create_print_order_confirmation_email_simple(
                    user_name=order.user.full_name or order.user.email,
                    order_number=order.order_number,
                    order_items=order_items,
                    total_amount=order.total_amount,
                    language=order.user.language or "it"
                )
                
                subject = "🎉 Ordine confermato!" if (order.user.language or "it") == "it" else "🎉 Order confirmed!"
                await send_email(order.user.email, subject, email_body)
                logger.info(f"Print order confirmation email sent to {order.user.email}")
            except Exception as e:
                logger.error(f"Failed to send print order confirmation email: {e}")
    
    elif event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        order_id = payment_intent['metadata']['order_id']
        
        # Aggiorna lo stato dell'ordine
        order = db.query(PrintOrder).filter(PrintOrder.id == order_id).first()
        if order:
            order.payment_status = "paid"
            order.status = "processing"
            order.stripe_payment_intent_id = payment_intent['id']
            db.commit()
            
            # Invia l'ordine a Printful per la produzione
            from printful_service import send_order_to_printful
            await send_order_to_printful(order, db)
            
            # Invia email di conferma ordine
            try:
                # Prepara i dati per l'email
                order_items = []
                for item in order.items:
                    product_name = "Adesivo QR-Code" if item.product_type == "sticker" else "Placca da Scrivania"
                    order_items.append({
                        'product_name': product_name,
                        'quantity': item.quantity,
                        'price': item.total_price
                    })
                
                email_body = create_print_order_confirmation_email_simple(
                    user_name=order.user.full_name or order.user.email,
                    order_number=order.order_number,
                    order_items=order_items,
                    total_amount=order.total_amount,
                    language=order.user.language or "it"
                )
                
                subject = "🎉 Ordine confermato!" if (order.user.language or "it") == "it" else "🎉 Order confirmed!"
                await send_email(order.user.email, subject, email_body)
                logger.info(f"Print order confirmation email sent to {order.user.email}")
            except Exception as e:
                logger.error(f"Failed to send print order confirmation email: {e}")
    
    return {"status": "success"}

@app.get("/api/print-orders")
async def get_print_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni tutti gli ordini di stampa dell'utente"""
    
    orders = db.query(PrintOrder).filter(
        PrintOrder.user_id == current_user.id
    ).order_by(PrintOrder.created_at.desc()).all()
    
    result = []
    for order in orders:
        chatbot = db.query(Chatbot).filter(Chatbot.id == order.chatbot_id).first()
        result.append({
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "payment_status": order.payment_status,
            "total_amount": order.total_amount,
            "created_at": order.created_at,
            "shipped_at": order.shipped_at,
            "tracking_number": order.tracking_number,
            "chatbot_name": chatbot.property_name if chatbot else "N/A"
        })
    
    return result

# Modelli per la richiesta semplificata di stampe
class SimplifiedPrintRequest(BaseModel):
    chatbot_id: int
    plastic_supports: int = 0
    stickers: dict[str, int]  # {"size_5x8": 2, "size_3x3": 1, etc.}

@app.post("/api/print-orders/request")
async def send_print_request(
    request: SimplifiedPrintRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invia richiesta semplificata di stampe via email"""
    try:
        logger.info(f"📧 Print request received from user {current_user.email}")
        logger.info(f"📧 Request data: chatbot_id={request.chatbot_id}, plastic_supports={request.plastic_supports}, stickers={request.stickers}")
        # Verifica che il chatbot appartenga all'utente
        chatbot = db.query(Chatbot).filter(
            Chatbot.id == request.chatbot_id,
            Chatbot.user_id == current_user.id
        ).first()
        
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot non trovato")
        
        # Prepara i dettagli dell'ordine
        order_details = []
        
        # Aggiungi supporti di plastica se richiesti
        if request.plastic_supports > 0:
            order_details.append(f"Supporti di Plastica: {request.plastic_supports}")
        
        # Aggiungi adesivi per ogni dimensione
        sticker_sizes_map = {
            "size_5x8": "5.83″×8.27″ (14.8×21 cm)",
            "size_3x3": "3″×3″ (7.6×7.6 cm)", 
            "size_4x4": "4″×4″ (10.2×10.2 cm)",
            "size_5x5": "5.5″×5.5″ (14×14 cm)"
        }
        
        for size_id, quantity in request.stickers.items():
            if quantity > 0:
                size_name = sticker_sizes_map.get(size_id, size_id)
                order_details.append(f"Adesivi {size_name}: {quantity}")
        
        if not order_details:
            raise HTTPException(status_code=400, detail="Nessun prodotto selezionato")
        
        # Crea il contenuto dell'email
        email_subject = "🖨️ Nuova Richiesta Stampe QR-Code - OspiterAI"
        
        email_body = f"""
        <h2>Nuova Richiesta Stampe QR-Code</h2>
        
        <h3>Dettagli Cliente:</h3>
        <ul>
            <li><strong>Nome:</strong> {current_user.full_name or 'Non specificato'}</li>
            <li><strong>Email:</strong> {current_user.email}</li>
            <li><strong>Telefono:</strong> {current_user.phone or 'Non specificato'}</li>
        </ul>
        
        <h3>Dettagli Chatbot:</h3>
        <ul>
            <li><strong>Nome Proprietà:</strong> {chatbot.property_name}</li>
            <li><strong>Città:</strong> {chatbot.property_city or 'Non specificata'}</li>
            <li><strong>ID Chatbot:</strong> {chatbot.id}</li>
        </ul>
        
        <h3>Prodotti Richiesti:</h3>
        <ul>
        """ + "".join([f"<li>{detail}</li>" for detail in order_details]) + """
        </ul>
        
        <h3>QR-Code:</h3>
        <p>Il QR-Code da stampare è allegato al chatbot con ID {chatbot.id}</p>
        
        <p><em>Richiesta inviata automaticamente dal sistema OspiterAI</em></p>
        """
        
        # Invia l'email
        await send_email(
            to_email="ospiterai@gmail.com",
            subject=email_subject,
            body=email_body
        )
        
        logger.info(f"Print request sent for user {current_user.email}, chatbot {chatbot.id}")
        
        return {
            "success": True,
            "message": "Richiesta inviata correttamente"
        }
        
    except Exception as e:
        logger.error(f"Error sending print request: {e}")
        raise HTTPException(status_code=500, detail=f"Errore nell'invio della richiesta: {str(e)}")

@app.get("/api/print-orders/{order_id}")
async def get_print_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni i dettagli di un ordine specifico"""
    
    order = db.query(PrintOrder).filter(
        PrintOrder.id == order_id,
        PrintOrder.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Ordine non trovato")
    
    chatbot = db.query(Chatbot).filter(Chatbot.id == order.chatbot_id).first()
    items = db.query(PrintOrderItem).filter(PrintOrderItem.order_id == order.id).all()
    
    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "payment_status": order.payment_status,
        "total_amount": order.total_amount,
        "shipping_address": order.shipping_address,
        "tracking_number": order.tracking_number,
        "tracking_url": order.tracking_url,
        "created_at": order.created_at,
        "shipped_at": order.shipped_at,
        "chatbot": {
            "id": chatbot.id,
            "name": chatbot.property_name,
            "city": chatbot.property_city
        } if chatbot else None,
        "items": [
            {
                "id": item.id,
                "product_type": item.product_type,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price
            }
            for item in items
        ]
    }

# Endpoint per autocompletamento indirizzi
@app.get("/api/address/autocomplete")
async def autocomplete_address(
    query: str,
    country: Optional[str] = None
):
    """Autocompletamento indirizzi usando Google Places API"""
    try:
        if not query or len(query) < 3:
            return {"predictions": []}
        
        # Google Places Autocomplete API
        url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
        
        params = {
            "input": query,
            "key": settings.GOOGLE_PLACES_API_KEY,
            "types": "address",
            "language": "it"  # Italiano di default
        }
        
        # Aggiungi filtro per paese se specificato
        if country:
            params["components"] = f"country:{country}"
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "OK":
                predictions = []
                for prediction in data.get("predictions", []):
                    predictions.append({
                        "description": prediction.get("description"),
                        "place_id": prediction.get("place_id"),
                        "main_text": prediction.get("structured_formatting", {}).get("main_text"),
                        "secondary_text": prediction.get("structured_formatting", {}).get("secondary_text")
                    })
                return {"predictions": predictions}
            else:
                logger.error(f"Google Places API error: {data.get('status')}")
                return {"predictions": []}
        else:
            logger.error(f"Google Places API HTTP error: {response.status_code}")
            return {"predictions": []}
            
    except Exception as e:
        logger.error(f"Error in address autocomplete: {e}")
        return {"predictions": []}

@app.get("/api/address/details/{place_id}")
async def get_address_details(place_id: str):
    """Ottieni dettagli completi di un indirizzo usando place_id"""
    try:
        # Google Places Details API
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        
        params = {
            "place_id": place_id,
            "key": settings.GOOGLE_PLACES_API_KEY,
            "fields": "address_components,formatted_address,geometry"
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "OK":
                result = data.get("result", {})
                address_components = result.get("address_components", [])
                
                # Estrai componenti dell'indirizzo
                address_data = {
                    "formatted_address": result.get("formatted_address"),
                    "street_number": "",
                    "route": "",
                    "locality": "",
                    "administrative_area_level_1": "",
                    "postal_code": "",
                    "country": ""
                }
                
                for component in address_components:
                    types = component.get("types", [])
                    if "street_number" in types:
                        address_data["street_number"] = component.get("long_name")
                    elif "route" in types:
                        address_data["route"] = component.get("long_name")
                    elif "locality" in types:
                        address_data["locality"] = component.get("long_name")
                    elif "administrative_area_level_1" in types:
                        address_data["administrative_area_level_1"] = component.get("short_name")
                    elif "postal_code" in types:
                        address_data["postal_code"] = component.get("long_name")
                    elif "country" in types:
                        address_data["country"] = component.get("short_name")
                
                # Costruisci indirizzo completo
                full_address = f"{address_data['street_number']} {address_data['route']}".strip()
                
                return {
                    "address": full_address,
                    "street_number": address_data["street_number"],
                    "route": address_data["route"],
                    "city": address_data["locality"],
                    "state": address_data["administrative_area_level_1"],
                    "postal_code": address_data["postal_code"],
                    "country": address_data["country"],
                    "formatted_address": address_data["formatted_address"]
                }
            else:
                logger.error(f"Google Places Details API error: {data.get('status')}")
                return {"error": "Address not found"}
        else:
            logger.error(f"Google Places Details API HTTP error: {response.status_code}")
            return {"error": "API error"}
            
    except Exception as e:
        logger.error(f"Error getting address details: {e}")
        return {"error": "Internal error"}

# ============= ENDPOINT PER PREFISSI INTERNAZIONALI =============

@app.get("/api/country-codes")
async def get_country_codes():
    """Ottiene la lista completa dei prefissi internazionali con bandiere"""
    return {
        "country_codes": [
            {"code": "+1", "country": "United States", "flag": "🇺🇸", "name": "United States"},
            {"code": "+1", "country": "Canada", "flag": "🇨🇦", "name": "Canada"},
            {"code": "+7", "country": "Russia", "flag": "🇷🇺", "name": "Russia"},
            {"code": "+7", "country": "Kazakhstan", "flag": "🇰🇿", "name": "Kazakhstan"},
            {"code": "+20", "country": "Egypt", "flag": "🇪🇬", "name": "Egypt"},
            {"code": "+27", "country": "South Africa", "flag": "🇿🇦", "name": "South Africa"},
            {"code": "+30", "country": "Greece", "flag": "🇬🇷", "name": "Greece"},
            {"code": "+31", "country": "Netherlands", "flag": "🇳🇱", "name": "Netherlands"},
            {"code": "+32", "country": "Belgium", "flag": "🇧🇪", "name": "Belgium"},
            {"code": "+33", "country": "France", "flag": "🇫🇷", "name": "France"},
            {"code": "+34", "country": "Spain", "flag": "🇪🇸", "name": "Spain"},
            {"code": "+36", "country": "Hungary", "flag": "🇭🇺", "name": "Hungary"},
            {"code": "+39", "country": "Italy", "flag": "🇮🇹", "name": "Italy"},
            {"code": "+40", "country": "Romania", "flag": "🇷🇴", "name": "Romania"},
            {"code": "+41", "country": "Switzerland", "flag": "🇨🇭", "name": "Switzerland"},
            {"code": "+43", "country": "Austria", "flag": "🇦🇹", "name": "Austria"},
            {"code": "+44", "country": "United Kingdom", "flag": "🇬🇧", "name": "United Kingdom"},
            {"code": "+45", "country": "Denmark", "flag": "🇩🇰", "name": "Denmark"},
            {"code": "+46", "country": "Sweden", "flag": "🇸🇪", "name": "Sweden"},
            {"code": "+47", "country": "Norway", "flag": "🇳🇴", "name": "Norway"},
            {"code": "+48", "country": "Poland", "flag": "🇵🇱", "name": "Poland"},
            {"code": "+49", "country": "Germany", "flag": "🇩🇪", "name": "Germany"},
            {"code": "+51", "country": "Peru", "flag": "🇵🇪", "name": "Peru"},
            {"code": "+52", "country": "Mexico", "flag": "🇲🇽", "name": "Mexico"},
            {"code": "+53", "country": "Cuba", "flag": "🇨🇺", "name": "Cuba"},
            {"code": "+54", "country": "Argentina", "flag": "🇦🇷", "name": "Argentina"},
            {"code": "+55", "country": "Brazil", "flag": "🇧🇷", "name": "Brazil"},
            {"code": "+56", "country": "Chile", "flag": "🇨🇱", "name": "Chile"},
            {"code": "+57", "country": "Colombia", "flag": "🇨🇴", "name": "Colombia"},
            {"code": "+58", "country": "Venezuela", "flag": "🇻🇪", "name": "Venezuela"},
            {"code": "+60", "country": "Malaysia", "flag": "🇲🇾", "name": "Malaysia"},
            {"code": "+61", "country": "Australia", "flag": "🇦🇺", "name": "Australia"},
            {"code": "+62", "country": "Indonesia", "flag": "🇮🇩", "name": "Indonesia"},
            {"code": "+63", "country": "Philippines", "flag": "🇵🇭", "name": "Philippines"},
            {"code": "+64", "country": "New Zealand", "flag": "🇳🇿", "name": "New Zealand"},
            {"code": "+65", "country": "Singapore", "flag": "🇸🇬", "name": "Singapore"},
            {"code": "+66", "country": "Thailand", "flag": "🇹🇭", "name": "Thailand"},
            {"code": "+81", "country": "Japan", "flag": "🇯🇵", "name": "Japan"},
            {"code": "+82", "country": "South Korea", "flag": "🇰🇷", "name": "South Korea"},
            {"code": "+84", "country": "Vietnam", "flag": "🇻🇳", "name": "Vietnam"},
            {"code": "+86", "country": "China", "flag": "🇨🇳", "name": "China"},
            {"code": "+90", "country": "Turkey", "flag": "🇹🇷", "name": "Turkey"},
            {"code": "+91", "country": "India", "flag": "🇮🇳", "name": "India"},
            {"code": "+92", "country": "Pakistan", "flag": "🇵🇰", "name": "Pakistan"},
            {"code": "+93", "country": "Afghanistan", "flag": "🇦🇫", "name": "Afghanistan"},
            {"code": "+94", "country": "Sri Lanka", "flag": "🇱🇰", "name": "Sri Lanka"},
            {"code": "+95", "country": "Myanmar", "flag": "🇲🇲", "name": "Myanmar"},
            {"code": "+98", "country": "Iran", "flag": "🇮🇷", "name": "Iran"},
            {"code": "+212", "country": "Morocco", "flag": "🇲🇦", "name": "Morocco"},
            {"code": "+213", "country": "Algeria", "flag": "🇩🇿", "name": "Algeria"},
            {"code": "+216", "country": "Tunisia", "flag": "🇹🇳", "name": "Tunisia"},
            {"code": "+218", "country": "Libya", "flag": "🇱🇾", "name": "Libya"},
            {"code": "+220", "country": "Gambia", "flag": "🇬🇲", "name": "Gambia"},
            {"code": "+221", "country": "Senegal", "flag": "🇸🇳", "name": "Senegal"},
            {"code": "+222", "country": "Mauritania", "flag": "🇲🇷", "name": "Mauritania"},
            {"code": "+223", "country": "Mali", "flag": "🇲🇱", "name": "Mali"},
            {"code": "+224", "country": "Guinea", "flag": "🇬🇳", "name": "Guinea"},
            {"code": "+225", "country": "Ivory Coast", "flag": "🇨🇮", "name": "Ivory Coast"},
            {"code": "+226", "country": "Burkina Faso", "flag": "🇧🇫", "name": "Burkina Faso"},
            {"code": "+227", "country": "Niger", "flag": "🇳🇪", "name": "Niger"},
            {"code": "+228", "country": "Togo", "flag": "🇹🇬", "name": "Togo"},
            {"code": "+229", "country": "Benin", "flag": "🇧🇯", "name": "Benin"},
            {"code": "+230", "country": "Mauritius", "flag": "🇲🇺", "name": "Mauritius"},
            {"code": "+231", "country": "Liberia", "flag": "🇱🇷", "name": "Liberia"},
            {"code": "+232", "country": "Sierra Leone", "flag": "🇸🇱", "name": "Sierra Leone"},
            {"code": "+233", "country": "Ghana", "flag": "🇬🇭", "name": "Ghana"},
            {"code": "+234", "country": "Nigeria", "flag": "🇳🇬", "name": "Nigeria"},
            {"code": "+235", "country": "Chad", "flag": "🇹🇩", "name": "Chad"},
            {"code": "+236", "country": "Central African Republic", "flag": "🇨🇫", "name": "Central African Republic"},
            {"code": "+237", "country": "Cameroon", "flag": "🇨🇲", "name": "Cameroon"},
            {"code": "+238", "country": "Cape Verde", "flag": "🇨🇻", "name": "Cape Verde"},
            {"code": "+239", "country": "São Tomé and Príncipe", "flag": "🇸🇹", "name": "São Tomé and Príncipe"},
            {"code": "+240", "country": "Equatorial Guinea", "flag": "🇬🇶", "name": "Equatorial Guinea"},
            {"code": "+241", "country": "Gabon", "flag": "🇬🇦", "name": "Gabon"},
            {"code": "+242", "country": "Republic of the Congo", "flag": "🇨🇬", "name": "Republic of the Congo"},
            {"code": "+243", "country": "Democratic Republic of the Congo", "flag": "🇨🇩", "name": "Democratic Republic of the Congo"},
            {"code": "+244", "country": "Angola", "flag": "🇦🇴", "name": "Angola"},
            {"code": "+245", "country": "Guinea-Bissau", "flag": "🇬🇼", "name": "Guinea-Bissau"},
            {"code": "+246", "country": "British Indian Ocean Territory", "flag": "🇮🇴", "name": "British Indian Ocean Territory"},
            {"code": "+248", "country": "Seychelles", "flag": "🇸🇨", "name": "Seychelles"},
            {"code": "+249", "country": "Sudan", "flag": "🇸🇩", "name": "Sudan"},
            {"code": "+250", "country": "Rwanda", "flag": "🇷🇼", "name": "Rwanda"},
            {"code": "+251", "country": "Ethiopia", "flag": "🇪🇹", "name": "Ethiopia"},
            {"code": "+252", "country": "Somalia", "flag": "🇸🇴", "name": "Somalia"},
            {"code": "+253", "country": "Djibouti", "flag": "🇩🇯", "name": "Djibouti"},
            {"code": "+254", "country": "Kenya", "flag": "🇰🇪", "name": "Kenya"},
            {"code": "+255", "country": "Tanzania", "flag": "🇹🇿", "name": "Tanzania"},
            {"code": "+256", "country": "Uganda", "flag": "🇺🇬", "name": "Uganda"},
            {"code": "+257", "country": "Burundi", "flag": "🇧🇮", "name": "Burundi"},
            {"code": "+258", "country": "Mozambique", "flag": "🇲🇿", "name": "Mozambique"},
            {"code": "+260", "country": "Zambia", "flag": "🇿🇲", "name": "Zambia"},
            {"code": "+261", "country": "Madagascar", "flag": "🇲🇬", "name": "Madagascar"},
            {"code": "+262", "country": "Réunion", "flag": "🇷🇪", "name": "Réunion"},
            {"code": "+263", "country": "Zimbabwe", "flag": "🇿🇼", "name": "Zimbabwe"},
            {"code": "+264", "country": "Namibia", "flag": "🇳🇦", "name": "Namibia"},
            {"code": "+265", "country": "Malawi", "flag": "🇲🇼", "name": "Malawi"},
            {"code": "+266", "country": "Lesotho", "flag": "🇱🇸", "name": "Lesotho"},
            {"code": "+267", "country": "Botswana", "flag": "🇧🇼", "name": "Botswana"},
            {"code": "+268", "country": "Swaziland", "flag": "🇸🇿", "name": "Swaziland"},
            {"code": "+269", "country": "Comoros", "flag": "🇰🇲", "name": "Comoros"},
            {"code": "+290", "country": "Saint Helena", "flag": "🇸🇭", "name": "Saint Helena"},
            {"code": "+291", "country": "Eritrea", "flag": "🇪🇷", "name": "Eritrea"},
            {"code": "+297", "country": "Aruba", "flag": "🇦🇼", "name": "Aruba"},
            {"code": "+298", "country": "Faroe Islands", "flag": "🇫🇴", "name": "Faroe Islands"},
            {"code": "+299", "country": "Greenland", "flag": "🇬🇱", "name": "Greenland"},
            {"code": "+350", "country": "Gibraltar", "flag": "🇬🇮", "name": "Gibraltar"},
            {"code": "+351", "country": "Portugal", "flag": "🇵🇹", "name": "Portugal"},
            {"code": "+352", "country": "Luxembourg", "flag": "🇱🇺", "name": "Luxembourg"},
            {"code": "+353", "country": "Ireland", "flag": "🇮🇪", "name": "Ireland"},
            {"code": "+354", "country": "Iceland", "flag": "🇮🇸", "name": "Iceland"},
            {"code": "+355", "country": "Albania", "flag": "🇦🇱", "name": "Albania"},
            {"code": "+356", "country": "Malta", "flag": "🇲🇹", "name": "Malta"},
            {"code": "+357", "country": "Cyprus", "flag": "🇨🇾", "name": "Cyprus"},
            {"code": "+358", "country": "Finland", "flag": "🇫🇮", "name": "Finland"},
            {"code": "+359", "country": "Bulgaria", "flag": "🇧🇬", "name": "Bulgaria"},
            {"code": "+370", "country": "Lithuania", "flag": "🇱🇹", "name": "Lithuania"},
            {"code": "+371", "country": "Latvia", "flag": "🇱🇻", "name": "Latvia"},
            {"code": "+372", "country": "Estonia", "flag": "🇪🇪", "name": "Estonia"},
            {"code": "+373", "country": "Moldova", "flag": "🇲🇩", "name": "Moldova"},
            {"code": "+374", "country": "Armenia", "flag": "🇦🇲", "name": "Armenia"},
            {"code": "+375", "country": "Belarus", "flag": "🇧🇾", "name": "Belarus"},
            {"code": "+376", "country": "Andorra", "flag": "🇦🇩", "name": "Andorra"},
            {"code": "+377", "country": "Monaco", "flag": "🇲🇨", "name": "Monaco"},
            {"code": "+378", "country": "San Marino", "flag": "🇸🇲", "name": "San Marino"},
            {"code": "+380", "country": "Ukraine", "flag": "🇺🇦", "name": "Ukraine"},
            {"code": "+381", "country": "Serbia", "flag": "🇷🇸", "name": "Serbia"},
            {"code": "+382", "country": "Montenegro", "flag": "🇲🇪", "name": "Montenegro"},
            {"code": "+383", "country": "Kosovo", "flag": "🇽🇰", "name": "Kosovo"},
            {"code": "+385", "country": "Croatia", "flag": "🇭🇷", "name": "Croatia"},
            {"code": "+386", "country": "Slovenia", "flag": "🇸🇮", "name": "Slovenia"},
            {"code": "+387", "country": "Bosnia and Herzegovina", "flag": "🇧🇦", "name": "Bosnia and Herzegovina"},
            {"code": "+389", "country": "North Macedonia", "flag": "🇲🇰", "name": "North Macedonia"},
            {"code": "+420", "country": "Czech Republic", "flag": "🇨🇿", "name": "Czech Republic"},
            {"code": "+421", "country": "Slovakia", "flag": "🇸🇰", "name": "Slovakia"},
            {"code": "+423", "country": "Liechtenstein", "flag": "🇱🇮", "name": "Liechtenstein"},
            {"code": "+500", "country": "Falkland Islands", "flag": "🇫🇰", "name": "Falkland Islands"},
            {"code": "+501", "country": "Belize", "flag": "🇧🇿", "name": "Belize"},
            {"code": "+502", "country": "Guatemala", "flag": "🇬🇹", "name": "Guatemala"},
            {"code": "+503", "country": "El Salvador", "flag": "🇸🇻", "name": "El Salvador"},
            {"code": "+504", "country": "Honduras", "flag": "🇭🇳", "name": "Honduras"},
            {"code": "+505", "country": "Nicaragua", "flag": "🇳🇮", "name": "Nicaragua"},
            {"code": "+506", "country": "Costa Rica", "flag": "🇨🇷", "name": "Costa Rica"},
            {"code": "+507", "country": "Panama", "flag": "🇵🇦", "name": "Panama"},
            {"code": "+508", "country": "Saint Pierre and Miquelon", "flag": "🇵🇲", "name": "Saint Pierre and Miquelon"},
            {"code": "+509", "country": "Haiti", "flag": "🇭🇹", "name": "Haiti"},
            {"code": "+590", "country": "Guadeloupe", "flag": "🇬🇵", "name": "Guadeloupe"},
            {"code": "+591", "country": "Bolivia", "flag": "🇧🇴", "name": "Bolivia"},
            {"code": "+592", "country": "Guyana", "flag": "🇬🇾", "name": "Guyana"},
            {"code": "+593", "country": "Ecuador", "flag": "🇪🇨", "name": "Ecuador"},
            {"code": "+594", "country": "French Guiana", "flag": "🇬🇫", "name": "French Guiana"},
            {"code": "+595", "country": "Paraguay", "flag": "🇵🇾", "name": "Paraguay"},
            {"code": "+596", "country": "Martinique", "flag": "🇲🇶", "name": "Martinique"},
            {"code": "+597", "country": "Suriname", "flag": "🇸🇷", "name": "Suriname"},
            {"code": "+598", "country": "Uruguay", "flag": "🇺🇾", "name": "Uruguay"},
            {"code": "+599", "country": "Netherlands Antilles", "flag": "🇧🇶", "name": "Netherlands Antilles"},
            {"code": "+670", "country": "East Timor", "flag": "🇹🇱", "name": "East Timor"},
            {"code": "+672", "country": "Australian External Territories", "flag": "🇦🇶", "name": "Australian External Territories"},
            {"code": "+673", "country": "Brunei", "flag": "🇧🇳", "name": "Brunei"},
            {"code": "+674", "country": "Nauru", "flag": "🇳🇷", "name": "Nauru"},
            {"code": "+675", "country": "Papua New Guinea", "flag": "🇵🇬", "name": "Papua New Guinea"},
            {"code": "+676", "country": "Tonga", "flag": "🇹🇴", "name": "Tonga"},
            {"code": "+677", "country": "Solomon Islands", "flag": "🇸🇧", "name": "Solomon Islands"},
            {"code": "+678", "country": "Vanuatu", "flag": "🇻🇺", "name": "Vanuatu"},
            {"code": "+679", "country": "Fiji", "flag": "🇫🇯", "name": "Fiji"},
            {"code": "+680", "country": "Palau", "flag": "🇵🇼", "name": "Palau"},
            {"code": "+681", "country": "Wallis and Futuna", "flag": "🇼🇫", "name": "Wallis and Futuna"},
            {"code": "+682", "country": "Cook Islands", "flag": "🇨🇰", "name": "Cook Islands"},
            {"code": "+683", "country": "Niue", "flag": "🇳🇺", "name": "Niue"},
            {"code": "+684", "country": "American Samoa", "flag": "🇦🇸", "name": "American Samoa"},
            {"code": "+685", "country": "Samoa", "flag": "🇼🇸", "name": "Samoa"},
            {"code": "+686", "country": "Kiribati", "flag": "🇰🇮", "name": "Kiribati"},
            {"code": "+687", "country": "New Caledonia", "flag": "🇳🇨", "name": "New Caledonia"},
            {"code": "+688", "country": "Tuvalu", "flag": "🇹🇻", "name": "Tuvalu"},
            {"code": "+689", "country": "French Polynesia", "flag": "🇵🇫", "name": "French Polynesia"},
            {"code": "+690", "country": "Tokelau", "flag": "🇹🇰", "name": "Tokelau"},
            {"code": "+691", "country": "Micronesia", "flag": "🇫🇲", "name": "Micronesia"},
            {"code": "+692", "country": "Marshall Islands", "flag": "🇲🇭", "name": "Marshall Islands"},
            {"code": "+850", "country": "North Korea", "flag": "🇰🇵", "name": "North Korea"},
            {"code": "+852", "country": "Hong Kong", "flag": "🇭🇰", "name": "Hong Kong"},
            {"code": "+853", "country": "Macau", "flag": "🇲🇴", "name": "Macau"},
            {"code": "+855", "country": "Cambodia", "flag": "🇰🇭", "name": "Cambodia"},
            {"code": "+856", "country": "Laos", "flag": "🇱🇦", "name": "Laos"},
            {"code": "+880", "country": "Bangladesh", "flag": "🇧🇩", "name": "Bangladesh"},
            {"code": "+886", "country": "Taiwan", "flag": "🇹🇼", "name": "Taiwan"},
            {"code": "+960", "country": "Maldives", "flag": "🇲🇻", "name": "Maldives"},
            {"code": "+961", "country": "Lebanon", "flag": "🇱🇧", "name": "Lebanon"},
            {"code": "+962", "country": "Jordan", "flag": "🇯🇴", "name": "Jordan"},
            {"code": "+963", "country": "Syria", "flag": "🇸🇾", "name": "Syria"},
            {"code": "+964", "country": "Iraq", "flag": "🇮🇶", "name": "Iraq"},
            {"code": "+965", "country": "Kuwait", "flag": "🇰🇼", "name": "Kuwait"},
            {"code": "+966", "country": "Saudi Arabia", "flag": "🇸🇦", "name": "Saudi Arabia"},
            {"code": "+967", "country": "Yemen", "flag": "🇾🇪", "name": "Yemen"},
            {"code": "+968", "country": "Oman", "flag": "🇴🇲", "name": "Oman"},
            {"code": "+970", "country": "Palestine", "flag": "🇵🇸", "name": "Palestine"},
            {"code": "+971", "country": "United Arab Emirates", "flag": "🇦🇪", "name": "United Arab Emirates"},
            {"code": "+972", "country": "Israel", "flag": "🇮🇱", "name": "Israel"},
            {"code": "+973", "country": "Bahrain", "flag": "🇧🇭", "name": "Bahrain"},
            {"code": "+974", "country": "Qatar", "flag": "🇶🇦", "name": "Qatar"},
            {"code": "+975", "country": "Bhutan", "flag": "🇧🇹", "name": "Bhutan"},
            {"code": "+976", "country": "Mongolia", "flag": "🇲🇳", "name": "Mongolia"},
            {"code": "+977", "country": "Nepal", "flag": "🇳🇵", "name": "Nepal"},
            {"code": "+992", "country": "Tajikistan", "flag": "🇹🇯", "name": "Tajikistan"},
            {"code": "+993", "country": "Turkmenistan", "flag": "🇹🇲", "name": "Turkmenistan"},
            {"code": "+994", "country": "Azerbaijan", "flag": "🇦🇿", "name": "Azerbaijan"},
            {"code": "+995", "country": "Georgia", "flag": "🇬🇪", "name": "Georgia"},
            {"code": "+996", "country": "Kyrgyzstan", "flag": "🇰🇬", "name": "Kyrgyzstan"},
            {"code": "+998", "country": "Uzbekistan", "flag": "🇺🇿", "name": "Uzbekistan"}
        ]
    }

@app.post("/api/validate-phone")
async def validate_phone(phone: str):
    """Valida un numero di telefono e restituisce informazioni sul paese"""
    
    if not validate_phone_number(phone):
        return {
            "valid": False,
            "error": "Formato numero di telefono non valido. Usa il formato +[prefisso internazionale][numero]"
        }
    
    # Estrai il prefisso dal numero
    prefix = phone[1:]  # Rimuovi il +
    
    # Trova il paese corrispondente
    country_codes = [
        {"code": "+1", "country": "United States", "flag": "🇺🇸", "name": "United States"},
        {"code": "+1", "country": "Canada", "flag": "🇨🇦", "name": "Canada"},
        {"code": "+7", "country": "Russia", "flag": "🇷🇺", "name": "Russia"},
        {"code": "+7", "country": "Kazakhstan", "flag": "🇰🇿", "name": "Kazakhstan"},
        {"code": "+20", "country": "Egypt", "flag": "🇪🇬", "name": "Egypt"},
        {"code": "+27", "country": "South Africa", "flag": "🇿🇦", "name": "South Africa"},
        {"code": "+30", "country": "Greece", "flag": "🇬🇷", "name": "Greece"},
        {"code": "+31", "country": "Netherlands", "flag": "🇳🇱", "name": "Netherlands"},
        {"code": "+32", "country": "Belgium", "flag": "🇧🇪", "name": "Belgium"},
        {"code": "+33", "country": "France", "flag": "🇫🇷", "name": "France"},
        {"code": "+34", "country": "Spain", "flag": "🇪🇸", "name": "Spain"},
        {"code": "+36", "country": "Hungary", "flag": "🇭🇺", "name": "Hungary"},
        {"code": "+39", "country": "Italy", "flag": "🇮🇹", "name": "Italy"},
        {"code": "+40", "country": "Romania", "flag": "🇷🇴", "name": "Romania"},
        {"code": "+41", "country": "Switzerland", "flag": "🇨🇭", "name": "Switzerland"},
        {"code": "+43", "country": "Austria", "flag": "🇦🇹", "name": "Austria"},
        {"code": "+44", "country": "United Kingdom", "flag": "🇬🇧", "name": "United Kingdom"},
        {"code": "+45", "country": "Denmark", "flag": "🇩🇰", "name": "Denmark"},
        {"code": "+46", "country": "Sweden", "flag": "🇸🇪", "name": "Sweden"},
        {"code": "+47", "country": "Norway", "flag": "🇳🇴", "name": "Norway"},
        {"code": "+48", "country": "Poland", "flag": "🇵🇱", "name": "Poland"},
        {"code": "+49", "country": "Germany", "flag": "🇩🇪", "name": "Germany"},
        {"code": "+51", "country": "Peru", "flag": "🇵🇪", "name": "Peru"},
        {"code": "+52", "country": "Mexico", "flag": "🇲🇽", "name": "Mexico"},
        {"code": "+53", "country": "Cuba", "flag": "🇨🇺", "name": "Cuba"},
        {"code": "+54", "country": "Argentina", "flag": "🇦🇷", "name": "Argentina"},
        {"code": "+55", "country": "Brazil", "flag": "🇧🇷", "name": "Brazil"},
        {"code": "+56", "country": "Chile", "flag": "🇨🇱", "name": "Chile"},
        {"code": "+57", "country": "Colombia", "flag": "🇨🇴", "name": "Colombia"},
        {"code": "+58", "country": "Venezuela", "flag": "🇻🇪", "name": "Venezuela"},
        {"code": "+60", "country": "Malaysia", "flag": "🇲🇾", "name": "Malaysia"},
        {"code": "+61", "country": "Australia", "flag": "🇦🇺", "name": "Australia"},
        {"code": "+62", "country": "Indonesia", "flag": "🇮🇩", "name": "Indonesia"},
        {"code": "+63", "country": "Philippines", "flag": "🇵🇭", "name": "Philippines"},
        {"code": "+64", "country": "New Zealand", "flag": "🇳🇿", "name": "New Zealand"},
        {"code": "+65", "country": "Singapore", "flag": "🇸🇬", "name": "Singapore"},
        {"code": "+66", "country": "Thailand", "flag": "🇹🇭", "name": "Thailand"},
        {"code": "+81", "country": "Japan", "flag": "🇯🇵", "name": "Japan"},
        {"code": "+82", "country": "South Korea", "flag": "🇰🇷", "name": "South Korea"},
        {"code": "+84", "country": "Vietnam", "flag": "🇻🇳", "name": "Vietnam"},
        {"code": "+86", "country": "China", "flag": "🇨🇳", "name": "China"},
        {"code": "+90", "country": "Turkey", "flag": "🇹🇷", "name": "Turkey"},
        {"code": "+91", "country": "India", "flag": "🇮🇳", "name": "India"},
        {"code": "+92", "country": "Pakistan", "flag": "🇵🇰", "name": "Pakistan"},
        {"code": "+93", "country": "Afghanistan", "flag": "🇦🇫", "name": "Afghanistan"},
        {"code": "+94", "country": "Sri Lanka", "flag": "🇱🇰", "name": "Sri Lanka"},
        {"code": "+95", "country": "Myanmar", "flag": "🇲🇲", "name": "Myanmar"},
        {"code": "+98", "country": "Iran", "flag": "🇮🇷", "name": "Iran"}
    ]
    
    # Trova il paese corrispondente (controlla prefissi più lunghi prima)
    matched_country = None
    for country in sorted(country_codes, key=lambda x: len(x["code"]), reverse=True):
        if phone.startswith(country["code"]):
            matched_country = country
            break
    
    return {
        "valid": True,
        "phone": phone,
        "country": matched_country,
        "message": f"Numero valido per {matched_country['name']} {matched_country['flag']}" if matched_country else "Numero valido ma paese non identificato"
    }

# ============= FUNZIONI HELPER PER CONVERSAZIONI =============

def carica_conversazione_esistente(conversation: Conversation, message: MessageCreate, chatbot: Chatbot, owner: User, client, db: Session, request):
    """Carica e continua una conversazione esistente - SOLO caricamento messaggi"""
    logger.info(f"✅ CARICANDO conversazione esistente {conversation.id} per guest {conversation.guest_id}")
    
    # Se la conversazione non ha thread_id, crealo
    if not conversation.thread_id:
        try:
            thread = client.beta.threads.create(extra_headers={"OpenAI-Beta": "assistants=v2"})
            conversation.thread_id = thread.id
            db.commit()
            logger.info(f"🆕 Creato thread OpenAI per conversazione esistente: {conversation.thread_id}")
        except Exception as e:
            logger.error(f"❌ Errore nella creazione del thread OpenAI: {e}")
            raise HTTPException(status_code=500, detail="Errore nella creazione del thread OpenAI")
    
    # Invia il messaggio a OpenAI
    try:
        client.beta.threads.messages.create(
            thread_id=conversation.thread_id,
            role="user",
            content=message.content,
            extra_headers={"OpenAI-Beta": "assistants=v2"}
        )
    except Exception as e:
        logger.error(f"❌ Errore nell'invio del messaggio a OpenAI: {e}")
        raise HTTPException(status_code=500, detail="Errore nell'invio del messaggio a OpenAI")
    
    # IMPORTANTE: Marca che questa è una conversazione esistente usando un attributo dinamico
    setattr(conversation, 'is_existing_conversation', True)
    
    return conversation

def crea_nuova_conversazione(guest: Guest, message: MessageCreate, chatbot: Chatbot, owner: User, client, db: Session, request):
    """Crea una nuova conversazione per un guest - SOLO creazione"""
    # Guest è sempre richiesto poiché l'identificazione è obbligatoria
    if not guest:
        raise HTTPException(status_code=400, detail="Identificazione guest richiesta per creare una conversazione")
    
    logger.info(f"🆕 CREANDO nuova conversazione per guest {guest.id}")
    
    # Verifica limiti conversazioni prima di crearne una nuova
    if owner.subscription_status == 'free_trial':
        if owner.free_trial_conversations_used >= owner.free_trial_conversations_limit:
            raise HTTPException(
                status_code=429,
                detail=f"{'You have reached the limit of 5 conversations for the free trial period. Subscribe to a plan to continue. For assistance contact: ' if (owner.language or 'it') == 'en' else 'Hai raggiunto il limite di 5 conversazioni del periodo di prova gratuito. Sottoscrivi un abbonamento per continuare. Per assistenza contatta il numero: '}{owner.phone}"
            )
    else:
        if owner.conversations_used >= owner.conversations_limit:
            if (owner.language or 'it') == 'en':
                error_message = f"Monthly limit of {owner.conversations_limit} conversations reached. The limit resets automatically on subscription renewal. For assistance contact: {owner.phone}"
            else:
                error_message = f"Limite mensile di {owner.conversations_limit} conversazioni raggiunto. Il limite si resetta automaticamente al rinnovo dell'abbonamento. Per assistenza contatta il numero: {owner.phone}"
            raise HTTPException(status_code=429, detail=error_message)
    
    # Crea nuovo thread OpenAI
    thread = client.beta.threads.create(extra_headers={"OpenAI-Beta": "assistants=v2"})
    
    # Crea nuova conversazione nel DB usando sempre guest_id
    conversation = Conversation(
        chatbot_id=chatbot.id,
        guest_id=guest.id,  # Sempre il guest_id vero
        thread_id=thread.id,
        guest_name=f"{guest.first_name} {guest.last_name}".strip() if (guest.first_name or guest.last_name) else None,
        guest_identifier=None,  # Non usiamo più questo campo per guest identificati
        is_forced_new=message.force_new_conversation
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    # Incrementa contatore conversazioni
    if owner.subscription_status == 'free_trial':
        owner.free_trial_conversations_used += 1
    else:
        owner.conversations_used += 1
    db.commit()
    
    # Controlla e invia avviso se rimangono meno del 10% delle conversazioni
    check_and_send_conversations_limit_warning(owner, db)
    
    # Invia messaggio a OpenAI
    client.beta.threads.messages.create(
        thread_id=conversation.thread_id,
        role="user",
        content=message.content,
        extra_headers={"OpenAI-Beta": "assistants=v2"}
    )
    
    # Se è una nuova conversazione per un guest identificato, salva messaggio di benvenuto
    if guest:
        welcome_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=chatbot.welcome_message or "Ciao! Sono qui per aiutarti con qualsiasi domanda sulla casa e sulla zona. Come posso esserti utile?",
            timestamp=func.now()
        )
        db.add(welcome_message)
        db.commit()
    
    return conversation

# ============= NUOVI ENDPOINT PER GESTIONE OSPITI =============

class GuestIdentificationRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class GuestIdentificationResponse(BaseModel):
    guest_id: int
    phone: Optional[str]
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    is_first_time: bool
    is_first_time_guest: bool  # Nuovo campo per identificare se è la prima volta per questo chatbot
    has_existing_conversation: bool
    existing_conversation_id: Optional[int]
    existing_thread_id: Optional[str]

@app.post("/api/chat/{uuid}/identify-guest")
async def identify_guest(
    uuid: str,
    request: GuestIdentificationRequest,
    db: Session = Depends(get_db)
):
    """Identifica un ospite e restituisce le informazioni sulla conversazione"""
    
    # Verifica chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    if not chatbot or not chatbot.is_active:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Validazione input
    if not request.phone and not request.email:
        raise HTTPException(status_code=400, detail="Almeno uno tra telefono ed email deve essere fornito")
    
    try:
        # LOGICA SEMPLICE E CHIARA:
        # 1. Cerca se l'ospite esiste GLOBALMENTE (per telefono o email)
        # 2. Se esiste, controlla se è già associato a questo chatbot
        # 3. Se non è associato, crea l'associazione
        # 4. Se non esiste globalmente, crea nuovo ospite (solo se ha entrambi i campi)
        
        guest = None
        
        # Cerca ospite esistente per telefono
        guest_by_phone = None
        guest_by_email = None
        
        if request.phone:
            guest_by_phone = db.query(Guest).filter(Guest.phone == request.phone).first()
        
        if request.email:
            guest_by_email = db.query(Guest).filter(Guest.email == request.email).first()
        
        # Controlla se ci sono conflitti
        if guest_by_phone and guest_by_email and guest_by_phone.id != guest_by_email.id:
            raise HTTPException(
                status_code=400, 
                detail="Il numero di telefono e l'email sono associati a ospiti diversi. Verifica i dati inseriti."
            )
        
        # Se non ci sono conflitti, usa il guest trovato
        guest = guest_by_phone or guest_by_email
        
        # Flag per identificare se è la prima volta per questo chatbot
        is_first_time_guest = False
        
        # Se l'ospite ESISTE globalmente
        if guest:
            # Controlla se è già associato a questo chatbot
            chatbot_guest = db.query(ChatbotGuest).filter(
                ChatbotGuest.chatbot_id == chatbot.id,
                ChatbotGuest.guest_id == guest.id
            ).first()
            
            # Se non è associato, crea l'associazione (PRIMA VOLTA per questo chatbot)
            if not chatbot_guest:
                is_first_time_guest = True
                chatbot_guest = ChatbotGuest(
                    chatbot_id=chatbot.id,
                    guest_id=guest.id
                )
                db.add(chatbot_guest)
                db.commit()
            
            # Aggiorna informazioni se fornite
            if request.phone and not guest.phone:
                guest.phone = request.phone
            if request.email and not guest.email:
                guest.email = request.email
            if request.first_name:
                guest.first_name = request.first_name
            if request.last_name:
                guest.last_name = request.last_name
            
            db.commit()
            db.refresh(guest)
        
        # Se l'ospite NON ESISTE globalmente
        else:
            # Nuovo guest = sempre prima volta per questo chatbot
            is_first_time_guest = True
            
            # Per nuovi ospiti, richiedi entrambi i campi
            if not request.phone or not request.email:
                raise HTTPException(
                    status_code=400, 
                    detail="Per i nuovi ospiti sono richiesti sia il numero di telefono che l'email"
                )
            
            # Crea nuovo ospite
            guest = Guest(
                phone=request.phone,
                email=request.email,
                first_name=request.first_name,
                last_name=request.last_name
            )
            
            db.add(guest)
            db.commit()
            db.refresh(guest)
            
            # Crea associazione chatbot-guest
            chatbot_guest = ChatbotGuest(
                chatbot_id=chatbot.id,
                guest_id=guest.id
            )
            
            db.add(chatbot_guest)
            db.commit()
        
        
        # Per guest esistenti, cerca l'ultima conversazione
        has_existing_conversation = False
        existing_conversation_id = None
        existing_thread_id = None
        
        # CORREZIONE: Cerca sempre l'ultima conversazione, anche se è la prima volta per questo chatbot
        # perché il guest potrebbe essere già stato identificato in precedenza
        latest_conversation = get_latest_guest_conversation(chatbot.id, guest.id, db)
        logger.info(f"🔍 [DEBUG] identify_guest - latest_conversation: {latest_conversation.id if latest_conversation else 'None'}")
        
        if latest_conversation:
            has_existing_conversation = True
            existing_conversation_id = latest_conversation.id
            existing_thread_id = latest_conversation.thread_id
            logger.info(f"🔍 [DEBUG] identify_guest - Trovata conversazione esistente {existing_conversation_id} con thread_id {existing_thread_id}")
        else:
            logger.info(f"🔍 [DEBUG] identify_guest - Nessuna conversazione esistente per guest {guest.id} e chatbot {chatbot.id}")
        
        return GuestIdentificationResponse(
            guest_id=guest.id,
            phone=guest.phone,
            email=guest.email,
            first_name=guest.first_name,
            last_name=guest.last_name,
            is_first_time=is_first_time_guest,  # Per ora usiamo la stessa logica
            is_first_time_guest=is_first_time_guest,
            has_existing_conversation=has_existing_conversation,
            existing_conversation_id=existing_conversation_id,
            existing_thread_id=existing_thread_id
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/chat/{uuid}/guest/{guest_id}/conversations")
async def get_guest_conversations(
    uuid: str,
    guest_id: int,
    db: Session = Depends(get_db)
):
    """Ottiene tutte le conversazioni di un ospite per un chatbot specifico"""
    
    # Verifica chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    if not chatbot or not chatbot.is_active:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Verifica ospite
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Ospite non trovato")
    
    # Ottieni conversazioni
    conversations = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Conversation.guest_id == guest_id
    ).order_by(Conversation.started_at.desc()).all()
    
    return {
        "guest": {
            "id": guest.id,
            "phone": guest.phone,
            "email": guest.email,
            "first_name": guest.first_name,
            "last_name": guest.last_name
        },
        "conversations": [
            {
                "id": conv.id,
                "thread_id": conv.thread_id,
                "started_at": conv.started_at,
                "ended_at": conv.ended_at,
                "message_count": conv.message_count,
                "is_forced_new": conv.is_forced_new
            }
            for conv in conversations
        ]
    }

@app.post("/api/chat/{uuid}/guest/{guest_id}/new-conversation")
async def create_new_conversation(
    uuid: str,
    guest_id: int,
    db: Session = Depends(get_db)
):
    """Crea una nuova conversazione per un ospite esistente"""
    
    # Verifica chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    if not chatbot or not chatbot.is_active:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Verifica ospite
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Ospite non trovato")
    
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
        
        # Verifica limite conversazioni free trial
        if owner.free_trial_conversations_used >= owner.free_trial_conversations_limit:
            if (owner.language or 'it') == 'en':
                error_detail = f"You have reached the limit of 5 conversations for the free trial period. Subscribe to a plan to continue. For assistance contact: {owner.phone}"
            else:
                error_detail = f"Hai raggiunto il limite di 5 conversazioni del periodo di prova gratuito. Sottoscrivi un abbonamento per continuare. Per assistenza contatta il numero: {owner.phone}"
            raise HTTPException(
                status_code=429,
                detail=error_detail
            )
    else:
        # Verifica limite conversazioni (i reset sono gestiti dai webhook Stripe)
        if owner.conversations_used >= owner.conversations_limit:
            # Messaggio di errore multilingue con numero host
            if (owner.language or 'it') == 'en':
                error_message = f"Monthly limit of {owner.conversations_limit} conversations reached. The limit resets automatically on subscription renewal. For assistance contact: {owner.phone}"
            else:
                error_message = f"Limite mensile di {owner.conversations_limit} conversazioni raggiunto. Il limite si resetta automaticamente al rinnovo dell'abbonamento. Per assistenza contatta il numero: {owner.phone}"
            raise HTTPException(
                status_code=429, 
                detail=error_message
            )
    
    try:
        client = get_openai_client()
        
        # Crea nuovo thread
        thread = client.beta.threads.create(extra_headers={"OpenAI-Beta": "assistants=v2"})
        thread_id = thread.id
        
        # Crea nuova conversazione nel DB usando sempre guest_id
        conversation = Conversation(
            chatbot_id=chatbot.id,
            guest_id=guest.id,  # Sempre il guest_id vero
            thread_id=thread_id,
            guest_name=f"{guest.first_name} {guest.last_name}".strip() if guest.first_name or guest.last_name else None,
            guest_identifier=None,  # Non usiamo più questo campo per guest identificati
            is_forced_new=True  # Marca come nuova conversazione forzata
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        # Incrementa il contatore delle conversazioni
        if owner.subscription_status == 'free_trial':
            owner.free_trial_conversations_used += 1
            logger.info(f"🔄 [DEBUG] Incrementato free_trial_conversations_used: {owner.free_trial_conversations_used}")
        else:
            owner.conversations_used += 1
            logger.info(f"🔄 [DEBUG] Incrementato conversations_used: {owner.conversations_used}")
        db.commit()
        logger.info(f"🔄 [DEBUG] Dopo commit - conversations_used: {owner.conversations_used}, free_trial_conversations_used: {owner.free_trial_conversations_used}")
        
        # Controlla e invia avviso se rimangono meno del 10% delle conversazioni
        check_and_send_conversations_limit_warning(owner, db)
        
        return {
            "conversation_id": conversation.id,
            "thread_id": thread_id,
            "message": "Nuova conversazione creata con successo"
        }
        
    except Exception as e:
        logger.error(f"Error creating new conversation: {e}")
        raise HTTPException(status_code=500, detail="Errore nella creazione della conversazione")

@app.post("/api/admin/reset-conversations-counter")
async def reset_conversations_counter_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Endpoint di amministrazione per resettare manualmente il contatore delle conversazioni"""
    try:
        # Reset forzato del contatore
        current_user.conversations_used = 0
        current_user.conversations_reset_date = datetime.utcnow()
        db.commit()
        
        logger.info(f"🔄 [ADMIN] Reset manuale conversations_used per utente {current_user.id}")
        
        return {
            "message": "Contatore delle conversazioni resettato con successo",
            "conversations_used": current_user.conversations_used,
            "conversations_limit": current_user.conversations_limit
        }
    except Exception as e:
        logger.error(f"Error resetting conversations counter: {e}")
        raise HTTPException(status_code=500, detail="Errore nel reset del contatore")

@app.post("/api/chat/{uuid}/create-fresh-conversation")
async def create_fresh_conversation(
    uuid: str,
    request: Request,
    guest_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Crea SEMPRE una nuova conversazione - per refresh della pagina.
    Non controlla conversazioni esistenti, crea sempre una nuova.
    """
    
    # Se guest_id non è fornito, blocca con errore chiaro
    if not guest_id:
        raise HTTPException(
            status_code=400, 
            detail="guest_id OBBLIGATORIO - Il frontend deve passare il guest_id dopo l'identificazione"
        )
    
    # Verifica chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    if not chatbot or not chatbot.is_active:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Guest_id è SEMPRE richiesto - verifica che l'ospite esista
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Ospite non trovato - identificazione richiesta")
    
    # Ottieni il proprietario del chatbot per verificare i limiti
    owner = db.query(User).filter(User.id == chatbot.user_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Proprietario del chatbot non trovato")
    
    # Verifica abbonamento attivo
    if not is_subscription_active(owner.subscription_status):
        raise HTTPException(
            status_code=403, 
            detail="Il proprietario di questo chatbot non ha un abbonamento attivo. Il servizio è temporaneamente non disponibile."
        )
    
    # IMPORTANTE: Verifica limiti conversazioni PRIMA di creare la nuova conversazione
    if owner.subscription_status == 'free_trial':
        # Verifica se il free trial è ancora attivo
        if not is_free_trial_active(owner):
            raise HTTPException(
                status_code=403,
                detail="Il periodo di prova gratuito è scaduto. Sottoscrivi un abbonamento per continuare a utilizzare il servizio."
            )
        
        # Verifica limite conversazioni free trial
        if owner.free_trial_conversations_used >= owner.free_trial_conversations_limit:
            if (owner.language or 'it') == 'en':
                error_detail = f"You have reached the limit of 5 conversations for the free trial period. Subscribe to a plan to continue. For assistance contact: {owner.phone}"
            else:
                error_detail = f"Hai raggiunto il limite di 5 conversazioni del periodo di prova gratuito. Sottoscrivi un abbonamento per continuare. Per assistenza contatta il numero: {owner.phone}"
            raise HTTPException(
                status_code=429,
                detail=error_detail
            )
    else:
        # Verifica limite conversazioni (i reset sono gestiti dai webhook Stripe)
        if owner.conversations_used >= owner.conversations_limit:
            # Messaggio di errore multilingue con numero host
            if (owner.language or 'it') == 'en':
                error_message = f"Monthly limit of {owner.conversations_limit} conversations reached. The limit resets automatically on subscription renewal. For assistance contact: {owner.phone}"
            else:
                error_message = f"Limite mensile di {owner.conversations_limit} conversazioni raggiunto. Il limite si resetta automaticamente al rinnovo dell'abbonamento. Per assistenza contatta il numero: {owner.phone}"
            raise HTTPException(
                status_code=429, 
                detail=error_message
            )
    
    try:
        # SEMPRE crea una nuova conversazione - NON controllare conversazioni esistenti
        logger.info(f"🆕 [DEBUG] Creando NUOVA conversazione per guest {guest_id} - REFRESH")
        
        # Crea nuova conversazione nel DB - SEMPRE con guest_id vero
        conversation = Conversation(
            chatbot_id=chatbot.id,
            guest_id=guest.id,  # SEMPRE il guest_id vero (guest è sempre presente)
            thread_id=None,  # Nessun thread OpenAI ancora
            guest_name=f"{guest.first_name} {guest.last_name}".strip() if (guest.first_name or guest.last_name) else None,
            guest_identifier=None,  # NON usiamo più questo campo per guest identificati
            is_forced_new=True  # È una conversazione forzata dal refresh
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        logger.info(f"🆕 [DEBUG] Nuova conversazione creata con ID: {conversation.id}")
        
        # Incrementa il contatore delle conversazioni
        if owner.subscription_status == 'free_trial':
            owner.free_trial_conversations_used += 1
            logger.info(f"🔄 [DEBUG] Incrementato free_trial_conversations_used: {owner.free_trial_conversations_used}")
        else:
            owner.conversations_used += 1
            logger.info(f"🔄 [DEBUG] Incrementato conversations_used: {owner.conversations_used}")
        db.commit()
        logger.info(f"🔄 [DEBUG] Dopo commit - conversations_used: {owner.conversations_used}, free_trial_conversations_used: {owner.free_trial_conversations_used}")
        
        # Controlla e invia avviso se rimangono meno del 10% delle conversazioni
        check_and_send_conversations_limit_warning(owner, db)
        
        # Salva il messaggio di benvenuto nel DB come messaggio dell'assistente
        welcome_message = Message(
            conversation_id=conversation.id,
            role="assistant",  # IMPORTANTE: è un messaggio dell'assistente
            content=chatbot.welcome_message or "Ciao! Sono qui per aiutarti con qualsiasi domanda sulla casa e sulla zona. Come posso esserti utile?",
            timestamp=func.now()
        )
        db.add(welcome_message)
        db.commit()
        db.refresh(welcome_message)
        
        logger.info(f"🆕 [DEBUG] Messaggio di benvenuto creato con ID: {welcome_message.id}")
        
        # Controlla e invia avviso se rimangono meno del 10% delle conversazioni
        check_and_send_conversations_limit_warning(owner, db)
        
        return {
            "conversation_id": conversation.id,
            "thread_id": None,  # Nessun thread OpenAI ancora
            "guest_id": guest_id,  # Guest specifico se fornito
            "welcome_message": {
                "id": welcome_message.id,
                "content": welcome_message.content,
                "timestamp": welcome_message.timestamp.isoformat()
            },
            "message": "NUOVA conversazione creata con successo per refresh"
        }
        
    except Exception as e:
        logger.error(f"Error creating fresh conversation: {e}")
        raise HTTPException(status_code=500, detail="Errore nella creazione della nuova conversazione")


@app.post("/api/chat/{uuid}/create-welcome-conversation")
async def create_welcome_conversation(
    uuid: str,
    request: Request,
    guest_id: Optional[int] = None,  # Temporaneamente Optional per debug
    db: Session = Depends(get_db)
):
    """Crea una nuova conversazione con messaggio di benvenuto - RICHIEDE SEMPRE IDENTIFICAZIONE"""
    
    # Se guest_id non è fornito, blocca con errore chiaro
    if not guest_id:
        raise HTTPException(
            status_code=400, 
            detail="guest_id OBBLIGATORIO - Il frontend deve passare il guest_id dopo l'identificazione"
        )
    
    # Verifica chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
    if not chatbot or not chatbot.is_active:
        raise HTTPException(status_code=404, detail="Chatbot non trovato")
    
    # Guest_id è SEMPRE richiesto - verifica che l'ospite esista
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Ospite non trovato - identificazione richiesta")
    
    # Ottieni il proprietario del chatbot per verificare i limiti
    owner = db.query(User).filter(User.id == chatbot.user_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Proprietario del chatbot non trovato")
    
    # Verifica abbonamento attivo
    if not is_subscription_active(owner.subscription_status):
        raise HTTPException(
            status_code=403, 
            detail="Il proprietario di questo chatbot non ha un abbonamento attivo. Il servizio è temporaneamente non disponibile."
        )
    
    # Verifica limiti conversazioni prima di crearne una nuova
    if owner.subscription_status == 'free_trial':
        # Verifica se il free trial è ancora attivo
        if not is_free_trial_active(owner):
            raise HTTPException(
                status_code=403,
                detail="Il periodo di prova gratuito è scaduto. Sottoscrivi un abbonamento per continuare a utilizzare il servizio."
            )
        
        # Verifica limite conversazioni free trial
        if owner.free_trial_conversations_used >= owner.free_trial_conversations_limit:
            if (owner.language or 'it') == 'en':
                error_detail = f"You have reached the limit of 5 conversations for the free trial period. Subscribe to a plan to continue. For assistance contact: {owner.phone}"
            else:
                error_detail = f"Hai raggiunto il limite di 5 conversazioni del periodo di prova gratuito. Sottoscrivi un abbonamento per continuare. Per assistenza contatta il numero: {owner.phone}"
            raise HTTPException(
                status_code=429,
                detail=error_detail
            )
    else:
        # Verifica limite conversazioni (i reset sono gestiti dai webhook Stripe)
        if owner.conversations_used >= owner.conversations_limit:
            # Messaggio di errore multilingue con numero host
            if (owner.language or 'it') == 'en':
                error_message = f"Monthly limit of {owner.conversations_limit} conversations reached. The limit resets automatically on subscription renewal. For assistance contact: {owner.phone}"
            else:
                error_message = f"Limite mensile di {owner.conversations_limit} conversazioni raggiunto. Il limite si resetta automaticamente al rinnovo dell'abbonamento. Per assistenza contatta il numero: {owner.phone}"
            raise HTTPException(
                status_code=429, 
                detail=error_message
            )
    
    try:
        # CORREZIONE IMPORTANTE: Se il guest è identificato, controlla se ha già una conversazione
        if guest:
            existing_conversation = get_latest_guest_conversation(chatbot.id, guest.id, db)
            if existing_conversation:
                logger.info(f"🔄 [CORREZIONE] Guest {guest.id} ha già una conversazione {existing_conversation.id}, la restituisco invece di crearne una nuova")
                
                # Restituisci la conversazione esistente
                # Cerca il messaggio di benvenuto esistente
                welcome_message = db.query(Message).filter(
                    Message.conversation_id == existing_conversation.id,
                    Message.role == "assistant"
                ).order_by(Message.timestamp.asc()).first()
                
                return {
                    "conversation_id": existing_conversation.id,
                    "thread_id": existing_conversation.thread_id,
                    "guest_id": guest.id,
                    "welcome_message": {
                        "id": welcome_message.id if welcome_message else None,
                        "content": welcome_message.content if welcome_message else chatbot.welcome_message,
                        "timestamp": welcome_message.timestamp.isoformat() if welcome_message else None
                    },
                    "message": "Conversazione esistente caricata con successo"
                }
        
        # NON creiamo un thread OpenAI per il messaggio di benvenuto
        # Il thread verrà creato solo quando l'utente invierà il primo messaggio
        
        # Crea nuova conversazione nel DB - SEMPRE con guest_id vero
        conversation = Conversation(
            chatbot_id=chatbot.id,
            guest_id=guest.id,  # SEMPRE il guest_id vero (guest è sempre presente)
            thread_id=None,  # Nessun thread OpenAI ancora
            guest_name=f"{guest.first_name} {guest.last_name}".strip() if (guest.first_name or guest.last_name) else None,
            guest_identifier=None,  # NON usiamo più questo campo per guest identificati
            is_forced_new=False  # Non è una conversazione forzata, è un refresh
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        # Incrementa il contatore delle conversazioni
        if owner.subscription_status == 'free_trial':
            owner.free_trial_conversations_used += 1
            logger.info(f"🔄 [DEBUG] Incrementato free_trial_conversations_used: {owner.free_trial_conversations_used}")
        else:
            owner.conversations_used += 1
            logger.info(f"🔄 [DEBUG] Incrementato conversations_used: {owner.conversations_used}")
        db.commit()
        logger.info(f"🔄 [DEBUG] Dopo commit - conversations_used: {owner.conversations_used}, free_trial_conversations_used: {owner.free_trial_conversations_used}")
        
        # Salva il messaggio di benvenuto nel DB come messaggio dell'assistente
        # NON chiamiamo OpenAI, è un messaggio diretto dell'assistente
        welcome_message = Message(
            conversation_id=conversation.id,
            role="assistant",  # IMPORTANTE: è un messaggio dell'assistente
            content=chatbot.welcome_message or "Ciao! Sono qui per aiutarti con qualsiasi domanda sulla casa e sulla zona. Come posso esserti utile?",
            timestamp=func.now()
        )
        db.add(welcome_message)
        db.commit()
        db.refresh(welcome_message)
        
        return {
            "conversation_id": conversation.id,
            "thread_id": None,  # Nessun thread OpenAI ancora
            "guest_id": guest_id,  # Guest specifico se fornito
            "welcome_message": {
                "id": welcome_message.id,
                "content": welcome_message.content,
                "timestamp": welcome_message.timestamp.isoformat()
            },
            "message": "Conversazione di benvenuto creata con successo"
        }
        
    except Exception as e:
        logger.error(f"Error creating welcome conversation: {e}")
        raise HTTPException(status_code=500, detail="Errore nella creazione della conversazione di benvenuto")

@app.get("/api/chat/{uuid}/guest/{guest_id}/messages")
async def get_guest_messages(
    uuid: str,
    guest_id: int,
    db: Session = Depends(get_db)
):
    """Ottieni tutti i messaggi di un ospite per un chatbot specifico"""
    try:
        # Trova il chatbot
        chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot non trovato")
        
        # Trova l'ospite
        guest = db.query(Guest).filter(Guest.id == guest_id).first()
        if not guest:
            raise HTTPException(status_code=404, detail="Ospite non trovato")
        
        # Trova la conversazione più recente dell'ospite per questo chatbot
        conversation = db.query(Conversation).filter(
            Conversation.chatbot_id == chatbot.id,
            Conversation.guest_id == guest_id
        ).order_by(Conversation.started_at.desc()).first()
        
        if not conversation:
            return {"messages": []}
        
        # Ottieni tutti i messaggi della conversazione
        messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.timestamp).all()
        
        # Converti i messaggi nel formato giusto
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else datetime.now().isoformat(),
                "conversation_id": msg.conversation_id
            })
        
        return {"messages": formatted_messages}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting guest messages: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recupero dei messaggi")

@app.get("/api/chat/{uuid}/conversation/{conversation_id}/messages")
async def get_conversation_messages(
    uuid: str,
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Ottieni tutti i messaggi di una conversazione specifica"""
    try:
        # Trova il chatbot
        chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot non trovato")
        
        # Trova la conversazione
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.chatbot_id == chatbot.id
        ).first()
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversazione non trovata")
        
        # Ottieni tutti i messaggi della conversazione
        messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.timestamp).all()
        
        # Converti i messaggi nel formato giusto
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else datetime.now().isoformat(),
                "conversation_id": msg.conversation_id
            })
        
        return {"messages": formatted_messages}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation messages: {e}")
        raise HTTPException(status_code=500, detail="Errore nel recupero dei messaggi")

@app.post("/api/chat/{uuid}/checkin")
async def submit_checkin_documents(
    uuid: str,
    request: Request,
    guest_id: int = Form(...),
    guest_email: str = Form(...),
    guest_phone: str = Form(...),
    guest_first_name: Optional[str] = Form(None),
    guest_last_name: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Endpoint per l'invio dei documenti di check-in automatico"""
    try:
        # Verifica chatbot
        chatbot = db.query(Chatbot).filter(Chatbot.uuid == uuid).first()
        if not chatbot or not chatbot.is_active:
            raise HTTPException(status_code=404, detail="Chatbot non trovato")
        
        # Verifica guest
        guest = db.query(Guest).filter(Guest.id == guest_id).first()
        if not guest:
            raise HTTPException(status_code=404, detail="Guest non trovato")
        
        # Verifica che sia un guest che interagisce per la prima volta con questo chatbot
        chatbot_guest = db.query(ChatbotGuest).filter(
            ChatbotGuest.chatbot_id == chatbot.id,
            ChatbotGuest.guest_id == guest.id
        ).first()
        
        if not chatbot_guest:
            raise HTTPException(status_code=403, detail="Accesso negato: guest non associato a questo chatbot")
        
        # Limita il numero di file
        if len(files) > 10:
            raise HTTPException(status_code=400, detail="Massimo 10 file consentiti")
        
        # Controlla che tutti i file siano JPEG o PNG
        allowed_types = ['image/jpeg', 'image/png']
        for file in files:
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Tipo file non supportato: {file.content_type}. Solo JPEG e PNG sono consentiti."
                )
        
        # Ottieni il proprietario del chatbot per l'email
        owner = db.query(User).filter(User.id == chatbot.user_id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Proprietario chatbot non trovato")
        
        # Prepara gli allegati email
        attachments = []
        for file in files:
            # Leggi il contenuto del file
            content = await file.read()
            
            # Aggiungi all'elenco allegati
            attachments.append({
                'filename': file.filename,
                'content': content,
                'content_type': file.content_type
            })
        
        # Crea il template email
        email_body = create_checkin_notification_email(
            guest_email=guest_email,
            guest_phone=guest_phone,
            guest_first_name=guest_first_name,
            guest_last_name=guest_last_name,
            property_name=chatbot.property_name,
            file_count=len(files),
            language="it"  # Default italiano, può essere personalizzato in base all'utente
        )
        
        # Invia email con allegati
        try:
            # Converte gli allegati nel formato richiesto dalla funzione send_email
            email_attachments = []
            for attachment in attachments:
                email_attachments.append((
                    attachment['filename'],
                    attachment['content'],
                    attachment['content_type']
                ))
            
            await send_email(
                to_email=owner.email,
                subject=f"Check-in Automatico - {chatbot.property_name or 'Proprietà'}",
                body=email_body,
                attachments=email_attachments
            )
        except Exception as e:
            logger.error(f"Error sending checkin email: {e}")
            raise HTTPException(status_code=500, detail="Errore nell'invio dell'email")
        
        return {
            "success": True,
            "message": "Documenti inviati con successo",
            "files_count": len(files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in checkin submission: {e}")
        raise HTTPException(status_code=500, detail="Errore nell'invio dei documenti")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
