from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey, Float
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
    phone = Column(String(50))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    subscription_status = Column(String(50), default="inactive")  # inactive, active, cancelled, past_due
    subscription_end_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    chatbots = relationship("Chatbot", back_populates="owner", cascade="all, delete-orphan")
    
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
    language = Column(String(10), default="it")
    
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
    
    # Relationships
    chatbot = relationship("Chatbot", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    
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
