import os
from typing import Optional
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://username:password@localhost:3306/hostgpt?charset=utf8mb4")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 giorni
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "sk-your-openai-api-key-here")
    
    # Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_your-stripe-secret-key")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_your-stripe-publishable-key")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_your-webhook-secret")
    STRIPE_PRICE_ID: str = os.getenv("STRIPE_PRICE_ID", "price_your-monthly-price-id")
    
    # Email
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "your-email@gmail.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "your-app-password")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@hostgpt.com")
    
    # URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    class Config:
        env_file = ".env"

settings = Settings()

# Placeholder note per l'utente
PLACEHOLDER_KEYS = """
IMPORTANTE: Devi fornire le seguenti chiavi API:

1. OPENAI_API_KEY: Ottieni da https://platform.openai.com/api-keys
2. STRIPE_SECRET_KEY e STRIPE_PUBLISHABLE_KEY: Ottieni da https://dashboard.stripe.com/test/apikeys
3. STRIPE_PRICE_ID: Crea un prodotto su Stripe con prezzo mensile
4. DATABASE_URL: Configura con i tuoi dati DigitalOcean MySQL
5. SMTP credentials: Per l'invio email (puoi usare Gmail con App Password)
6. SECRET_KEY: Genera una chiave sicura per JWT

Crea un file .env nella cartella backend con questi valori.
"""
