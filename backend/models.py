from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey, Float, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)  # Now required
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), unique=True)
    
    # OTP system for password reset
    otp_code = Column(String(6))  # 6-digit OTP code
    otp_expires_at = Column(DateTime)  # When OTP expires
    otp_attempts = Column(Integer, default=0)  # Number of failed OTP attempts
    phone_verified = Column(Boolean, default=False)  # If phone number is verified
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    subscription_status = Column(String(50), default="inactive")  # inactive, active, cancelled, past_due, free_trial
    subscription_end_date = Column(DateTime)
    messages_limit = Column(Integer, default=1000)  # Limite mensile di messaggi
    messages_used = Column(Integer, default=0)  # Messaggi utilizzati nel mese corrente
    messages_reset_date = Column(DateTime)  # Data ultimo reset dei messaggi
    
    # Free trial fields
    wants_free_trial = Column(Boolean, default=False)  # Se l'utente ha scelto il free trial
    free_trial_start_date = Column(DateTime)  # Data inizio free trial
    free_trial_end_date = Column(DateTime)  # Data fine free trial (14 giorni dopo)
    free_trial_messages_limit = Column(Integer, default=20)  # Limite messaggi free trial
    free_trial_messages_used = Column(Integer, default=0)  # Messaggi usati durante free trial
    free_trial_converted = Column(Boolean, default=False)  # Se è stato convertito ad abbonamento
    
    # Nuovo servizio Guardian
    guardian_subscription_status = Column(String(50), default="inactive")  # inactive, active, cancelled
    guardian_subscription_end_date = Column(DateTime)
    guardian_stripe_subscription_id = Column(String(255))
    
    # Referral code fields
    referral_code_id = Column(Integer, ForeignKey("referral_codes.id"))
    referral_code_used_at = Column(DateTime)  # Quando è stato utilizzato il referral code
    
    # Language preference for emails and notifications
    language = Column(String(10), default="it", nullable=False)  # 'it' or 'en'
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    chatbots = relationship("Chatbot", back_populates="owner", cascade="all, delete-orphan")
    guest_satisfaction = relationship("GuestSatisfaction", back_populates="user", cascade="all, delete-orphan")
    guardian_alerts = relationship("GuardianAlert", back_populates="user", cascade="all, delete-orphan")
    referral_code = relationship("ReferralCode", back_populates="users")

class Chatbot(Base):
    __tablename__ = "chatbots"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assistant_id = Column(String(255), unique=True)  # OpenAI Assistant ID
    uuid = Column(String(100), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    name = Column(String(255), nullable=False)
    
    # Informazioni sulla proprietà
    property_name = Column(String(255), nullable=False)
    property_type = Column(String(100))  # appartamento, villa, stanza, etc.
    property_address = Column(String(500))
    property_city = Column(String(255))
    property_description = Column(Text)
    check_in_time = Column(String(50))
    check_out_time = Column(String(50))
    house_rules = Column(Text)
    amenities = Column(JSON)  # Lista di servizi
    
    # Informazioni sulla zona
    neighborhood_description = Column(Text)
    nearby_attractions = Column(JSON)  # Lista di attrazioni vicine
    transportation_info = Column(Text)
    restaurants_bars = Column(JSON)  # Lista di ristoranti e bar
    shopping_info = Column(Text)
    emergency_contacts = Column(JSON)
    
    # Informazioni aggiuntive
    wifi_info = Column(JSON)  # password, nome rete
    parking_info = Column(Text)
    special_instructions = Column(Text)
    faq = Column(JSON)  # Lista di FAQ personalizzate
    
    # Configurazione chatbot
    welcome_message = Column(Text)
    icon_data = Column(LargeBinary)  # Dati dell'icona come BLOB
    icon_filename = Column(String(255))  # Nome file originale
    icon_content_type = Column(String(100))  # MIME type (image/png, image/jpeg)
    has_icon = Column(Boolean, default=False)  # Flag per indicare se ha un'icona
    
    # Statistiche
    total_conversations = Column(Integer, default=0)
    total_messages = Column(Integer, default=0)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="chatbots")
    conversations = relationship("Conversation", back_populates="chatbot", cascade="all, delete-orphan")
    
class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    thread_id = Column(String(255))  # OpenAI Thread ID
    guest_name = Column(String(255))
    guest_identifier = Column(String(255))  # IP o session ID
    started_at = Column(DateTime, server_default=func.now())
    ended_at = Column(DateTime)
    message_count = Column(Integer, default=0)
    
    # Guardian fields
    guardian_analyzed = Column(Boolean, default=False)  # Se la conversazione è già stata analizzata
    guardian_risk_score = Column(Float, default=0.0)  # Punteggio di rischio (0.0 - 1.0)
    guardian_alert_triggered = Column(Boolean, default=False)  # Se è stato generato un alert
    
    # Relationships
    chatbot = relationship("Chatbot", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    guardian_alerts = relationship("GuardianAlert", back_populates="conversation", cascade="all, delete-orphan")
    
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(50), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    
class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    
    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    category = Column(String(100))  # property, area, services, faq, etc.
    question = Column(Text)
    answer = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    conversations_count = Column(Integer, default=0)
    messages_count = Column(Integer, default=0)
    unique_users = Column(Integer, default=0)
    avg_messages_per_conversation = Column(Float, default=0)
    most_asked_topics = Column(JSON)  # Lista dei topic più richiesti

class GuestSatisfaction(Base):
    __tablename__ = "guest_satisfaction"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    guest_identifier = Column(String(255))
    
    # Metriche di soddisfazione
    satisfaction_score = Column(Float, default=5.0)  # 1-5
    sentiment_score = Column(Float, default=0.0)  # -1 to +1
    risk_level = Column(String(20), default="low")  # low, medium, high, critical
    
    # Problemi rilevati
    detected_issues = Column(JSON)  # lista problemi identificati
    resolution_status = Column(String(20), default="pending")  # pending, resolved, escalated
    
    # Interventi
    interventions_made = Column(JSON)  # interventi dell'host
    recovery_offers = Column(JSON)  # offerte di compensazione
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="guest_satisfaction")
    chatbot = relationship("Chatbot")
    alerts = relationship("SatisfactionAlert", back_populates="satisfaction", cascade="all, delete-orphan")

class SatisfactionAlert(Base):
    __tablename__ = "satisfaction_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    satisfaction_id = Column(Integer, ForeignKey("guest_satisfaction.id"), nullable=False)
    
    alert_type = Column(String(50))  # negative_sentiment, complaint, technical_issue
    severity = Column(String(20))  # low, medium, high, critical
    message = Column(Text)
    suggested_action = Column(Text)
    
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    satisfaction = relationship("GuestSatisfaction", back_populates="alerts")

# Nuovi modelli per il sistema Guardian
class GuardianAlert(Base):
    __tablename__ = "guardian_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    
    # Dettagli dell'alert
    alert_type = Column(String(50), default="negative_review_risk")  # negative_review_risk, complaint, frustration
    severity = Column(String(20), default="high")  # low, medium, high, critical
    risk_score = Column(Float, nullable=False)  # Punteggio di rischio (0.0 - 1.0)
    
    # Contenuto dell'alert
    message = Column(Text, nullable=False)
    suggested_action = Column(Text)
    conversation_summary = Column(Text)  # Riassunto della conversazione problematica
    
    # Stato dell'alert
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    resolved_by = Column(String(255))  # Chi ha risolto l'alert
    
    # Email inviata
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="guardian_alerts")
    conversation = relationship("Conversation", back_populates="guardian_alerts")

class GuardianAnalysis(Base):
    __tablename__ = "guardian_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    
    # Risultati dell'analisi
    risk_score = Column(Float, nullable=False)  # Punteggio di rischio (0.0 - 1.0)
    sentiment_score = Column(Float, default=0.0)  # -1 to +1
    confidence_score = Column(Float, default=0.0)  # 0.0 to 1.0
    
    # Dettagli dell'analisi
    analysis_details = Column(JSON)  # Dettagli dell'analisi OpenAI
    user_messages_analyzed = Column(Integer, default=0)  # Numero di messaggi utente analizzati
    conversation_length = Column(Integer, default=0)  # Lunghezza totale della conversazione
    
    # Timestamp
    analyzed_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    conversation = relationship("Conversation")

class ReferralCode(Base):
    __tablename__ = "referral_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255))
    bonus_messages = Column(Integer, default=100)  # Messaggi bonus da aggiungere al limite
    is_active = Column(Boolean, default=True)
    max_uses = Column(Integer)  # Numero massimo di utilizzi (None = illimitato)
    current_uses = Column(Integer, default=0)  # Numero di utilizzi attuali
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime)  # Data di scadenza (None = mai)
    
    # Relationships
    users = relationship("User", back_populates="referral_code")

# Nuovi modelli per il sistema di stampa QR-Code
class PrintOrder(Base):
    __tablename__ = "print_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    
    # Dettagli ordine
    order_number = Column(String(100), unique=True, nullable=False, index=True)
    total_amount = Column(Float, nullable=False)  # Importo totale in euro
    currency = Column(String(3), default="EUR")
    
    # Stato ordine
    status = Column(String(50), default="pending")  # pending, paid, processing, shipped, delivered, cancelled
    payment_status = Column(String(50), default="pending")  # pending, paid, failed, refunded
    
    # Informazioni pagamento
    stripe_payment_intent_id = Column(String(255))
    stripe_session_id = Column(String(255))
    
    # Informazioni spedizione
    shipping_address = Column(JSON)  # Indirizzo completo per la spedizione
    tracking_number = Column(String(255))
    tracking_url = Column(String(500))
    
    # Informazioni Printful
    printful_order_id = Column(String(255))
    printful_status = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    shipped_at = Column(DateTime)
    delivered_at = Column(DateTime)
    
    # Relationships
    user = relationship("User")
    chatbot = relationship("Chatbot")
    items = relationship("PrintOrderItem", back_populates="order", cascade="all, delete-orphan")

class PrintOrderItem(Base):
    __tablename__ = "print_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("print_orders.id"), nullable=False)
    
    # Dettagli prodotto
    product_type = Column(String(50), nullable=False)  # sticker
    product_name = Column(String(255), nullable=False)
    selected_size = Column(String(50), default='size_5x8')  # Dimensione selezionata
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    # Dettagli stampa
    qr_code_data = Column(Text)  # Base64 del QR code
    design_data = Column(JSON)  # Dati del design per Printful
    
    # Informazioni Printful
    printful_variant_id = Column(String(255))
    printful_product_id = Column(String(255))
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    order = relationship("PrintOrder", back_populates="items")