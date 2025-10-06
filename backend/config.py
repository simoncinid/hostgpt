import os
from typing import Optional
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://username:password@localhost:3306/hostgpt?charset=utf8mb4")
    # Path al certificato CA per MySQL (DigitalOcean richiede SSL). Se esiste, verrà usato automaticamente
    MYSQL_SSL_CA: str = os.getenv(
        "MYSQL_SSL_CA",
        str((Path(__file__).parent / "ca-certificate.crt").resolve())
    )
    # Contenuto PEM del certificato CA passato via env (multi-line). Se presente ha priorità sul path
    CA_CERTIFICATE: Optional[str] = os.getenv("CA_CERTIFICATE")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 giorni
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "sk-your-openai-api-key-here")
    
    # Stripe - Configurazione per i diversi piani di abbonamento
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_your-stripe-secret-key")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_your-stripe-publishable-key")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_your-webhook-secret")
    STRIPE_PRINT_ORDERS_WEBHOOK_SECRET: str = os.getenv("STRIPE_PRINT_ORDERS_WEBHOOK_SECRET", "whsec_your-print-orders-webhook-secret")
    # Stripe Price IDs per i diversi piani
    STRIPE_PRICE_ID: str = os.getenv("STRIPE_PRICE_ID", "price_your-monthly-19eur-price-id")  # Standard: 19€/mese (legacy)
    STRIPE_STANDARD_PRICE_ID: str = os.getenv("STRIPE_STANDARD_PRICE_ID", "price_your-monthly-19eur-price-id")  # Standard: 19€/mese
    STRIPE_PREMIUM_PRICE_ID: str = os.getenv("STRIPE_PREMIUM_PRICE_ID", "price_your-monthly-39eur-price-id")  # Premium: 39€/mese
    STRIPE_PRO_PRICE_ID: str = os.getenv("STRIPE_PRO_PRICE_ID", "price_your-monthly-79eur-price-id")  # Pro: 79€/mese
    STRIPE_ENTERPRISE_PRICE_ID: str = os.getenv("STRIPE_ENTERPRISE_PRICE_ID", "price_your-monthly-199eur-price-id")  # Enterprise: 199€/mese
    
    # Stripe Annual Price IDs
    STRIPE_ANNUAL_STANDARD_PRICE_ID: str = os.getenv("STRIPE_ANNUAL_STANDARD_PRICE_ID", "price_your-annual-190eur-price-id")  # Standard: 190€/anno
    STRIPE_ANNUAL_PREMIUM_PRICE_ID: str = os.getenv("STRIPE_ANNUAL_PREMIUM_PRICE_ID", "price_your-annual-390eur-price-id")  # Premium: 390€/anno
    STRIPE_ANNUAL_PRO_PRICE_ID: str = os.getenv("STRIPE_ANNUAL_PRO_PRICE_ID", "price_your-annual-790eur-price-id")  # Pro: 790€/anno
    STRIPE_ANNUAL_ENTERPRISE_PRICE_ID: str = os.getenv("STRIPE_ANNUAL_ENTERPRISE_PRICE_ID", "price_your-annual-1990eur-price-id")  # Enterprise: 1990€/anno
    
    # Guardian Price ID
    STRIPE_GUARDIAN_PRICE_ID: str = os.getenv("STRIPE_GUARDIAN_PRICE_ID", "price_1S7fDjCez9NYe6irthMTRaXg")  # Guardian: 9€/mese
    
    # Printful - Servizio di stampa on-demand
    PRINTFUL_API_KEY: str = os.getenv("PRINTFUL_API_KEY", "your-printful-api-key")
    PRINTFUL_STORE_ID: str = os.getenv("PRINTFUL_STORE_ID", "your-store-id")
    
    # Gofile - Servizio di hosting file
    GOFILE_FOLDER_ID: str = os.getenv("GOFILE_FOLDER_ID", "d63dd9a9-70b1-4cf0-a25f-3e69b13aaa37")
    GOFILE_ACCOUNT_ID: str = os.getenv("GOFILE_ACCOUNT_ID", "e50405d7-23a2-46cb-99e6-30882d9c2c71")
    GOFILE_TOKEN: str = os.getenv("GOFILE_TOKEN", "2qfGnU1Mo0VQdWuYpPAUvEw6noiSPfoX")
    
    # Google Places API - Per autocompletamento indirizzi globali
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", "your-google-places-api-key")
    
    # Email
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "your-email@gmail.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "your-app-password")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@ospiterai.it")
    
    # URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "https://hostgpt-docker.onrender.com")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    class Config:
        env_file = ".env"

settings = Settings()

# Placeholder note per l'utente
PLACEHOLDER_KEYS = """
IMPORTANTE: Devi fornire le seguenti chiavi API:

1. OPENAI_API_KEY: Ottieni da https://platform.openai.com/api-keys
2. STRIPE_SECRET_KEY e STRIPE_PUBLISHABLE_KEY: Ottieni da https://dashboard.stripe.com/test/apikeys
3. STRIPE_PRICE_ID: Crea prodotti su Stripe per tutti i piani (Standard, Premium, Pro, Enterprise) sia mensili che annuali
4. DATABASE_URL: Configura con i tuoi dati DigitalOcean MySQL
5. SMTP credentials: Per l'invio email (puoi usare Gmail con App Password)
6. SECRET_KEY: Genera una chiave sicura per JWT

Crea un file .env nella cartella backend con questi valori.
"""
