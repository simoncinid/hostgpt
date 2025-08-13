#!/usr/bin/env python3
"""
Script di test per verificare la configurazione di HostGPT.
Controlla che tutte le API keys e servizi siano configurati correttamente.
"""

import os
import sys
from colorama import init, Fore, Style
import openai
import stripe
import aiosmtplib
import asyncio
from sqlalchemy import text
from database import engine
from config import settings

# Inizializza colorama per output colorato
init()

def print_header(text):
    print(f"\n{Fore.CYAN}{'='*50}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{text}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*50}{Style.RESET_ALL}")

def print_success(text):
    print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")

def print_error(text):
    print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")

def print_warning(text):
    print(f"{Fore.YELLOW}⚠️  {text}{Style.RESET_ALL}")

def print_info(text):
    print(f"{Fore.BLUE}ℹ️  {text}{Style.RESET_ALL}")

def test_environment():
    """Verifica variabili d'ambiente"""
    print_header("CONTROLLO VARIABILI D'AMBIENTE")
    
    has_env = os.path.exists('.env')
    if has_env:
        print_success("File .env trovato")
    else:
        print_warning("File .env non trovato - usando valori di default")
    
    return True

def test_database():
    """Test connessione database"""
    print_header("TEST CONNESSIONE DATABASE")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT VERSION()"))
            version = result.scalar()
            print_success(f"Connessione MySQL riuscita - Versione: {version}")
            
            # Controlla se le tabelle esistono
            result = conn.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result]
            
            if tables:
                print_success(f"Trovate {len(tables)} tabelle: {', '.join(tables)}")
            else:
                print_warning("Nessuna tabella trovata - esegui: python init_db.py")
            
        return True
    except Exception as e:
        print_error(f"Errore connessione database: {e}")
        print_info("Verifica DATABASE_URL nel file .env")
        return False

def test_openai():
    """Test API OpenAI"""
    print_header("TEST OPENAI API")
    
    if settings.OPENAI_API_KEY.startswith("sk-"):
        print_info("API Key OpenAI configurata")
        
        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY, default_headers={"OpenAI-Beta": "assistants=v2"})
            # Test con una semplice richiesta
            response = client.models.list()
            models = [m.id for m in response.data if 'gpt' in m.id]
            print_success(f"Connessione OpenAI riuscita")
            print_info(f"Modelli disponibili: {', '.join(models[:5])}...")
            return True
        except Exception as e:
            print_error(f"Errore OpenAI API: {e}")
            print_info("Verifica che l'API key sia valida e abbia crediti")
            return False
    else:
        print_warning("OpenAI API Key non configurata")
        print_info("Ottieni una key da: https://platform.openai.com/api-keys")
        return False

def test_stripe():
    """Test API Stripe"""
    print_header("TEST STRIPE API")
    
    if settings.STRIPE_SECRET_KEY.startswith("sk_"):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            # Test listing products
            products = stripe.Product.list(limit=1)
            print_success("Connessione Stripe riuscita")
            
            if settings.STRIPE_PRICE_ID.startswith("price_"):
                print_success("Price ID configurato")
            else:
                print_warning("STRIPE_PRICE_ID non configurato - crea un prodotto su Stripe")
            
            return True
        except Exception as e:
            print_error(f"Errore Stripe API: {e}")
            print_info("Verifica STRIPE_SECRET_KEY nel file .env")
            return False
    else:
        print_warning("Stripe API Key non configurata")
        print_info("Ottieni le keys da: https://dashboard.stripe.com/test/apikeys")
        return False

async def test_email_async():
    """Test configurazione email (async)"""
    try:
        print_info(f"Test connessione a {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        
        async with aiosmtplib.SMTP(
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            use_tls=True
        ) as smtp:
            await smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            print_success("Connessione SMTP riuscita")
            print_info(f"Email configurata: {settings.FROM_EMAIL}")
            return True
            
    except Exception as e:
        print_error(f"Errore configurazione email: {e}")
        print_info("Per Gmail: usa una App Password, non la password normale")
        return False

def test_email():
    """Wrapper sincrono per test email"""
    print_header("TEST CONFIGURAZIONE EMAIL")
    
    if settings.SMTP_USERNAME == "your-email@gmail.com":
        print_warning("Email SMTP non configurata")
        print_info("Configura SMTP_USERNAME e SMTP_PASSWORD nel file .env")
        return False
    
    return asyncio.run(test_email_async())

def test_urls():
    """Verifica configurazione URLs"""
    print_header("CONFIGURAZIONE URLs")
    
    print_info(f"Frontend URL: {settings.FRONTEND_URL}")
    print_info(f"Backend URL: {settings.BACKEND_URL}")
    
    if "localhost" in settings.FRONTEND_URL:
        print_warning("Usando URLs localhost - ricorda di aggiornarli per produzione")
    else:
        print_success("URLs di produzione configurati")
    
    return True

def run_all_tests():
    """Esegue tutti i test"""
    print(f"\n{Fore.MAGENTA}🚀 TEST CONFIGURAZIONE HOSTGPT{Style.RESET_ALL}")
    print(f"{Fore.MAGENTA}{'='*50}{Style.RESET_ALL}")
    
    results = {
        "Environment": test_environment(),
        "Database": test_database(),
        "OpenAI": test_openai(),
        "Stripe": test_stripe(),
        "Email": test_email(),
        "URLs": test_urls()
    }
    
    # Riepilogo
    print_header("RIEPILOGO TEST")
    
    all_passed = True
    for service, passed in results.items():
        if passed:
            print_success(f"{service}: OK")
        else:
            print_error(f"{service}: FALLITO")
            all_passed = False
    
    print(f"\n{Fore.MAGENTA}{'='*50}{Style.RESET_ALL}")
    
    if all_passed:
        print(f"{Fore.GREEN}✨ TUTTI I TEST PASSATI! Il sistema è pronto.{Style.RESET_ALL}")
        print(f"{Fore.GREEN}Puoi avviare il server con: python main.py{Style.RESET_ALL}")
        return 0
    else:
        print(f"{Fore.YELLOW}⚠️  Alcuni test sono falliti. Controlla la configurazione.{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Consulta il README.md per istruzioni dettagliate.{Style.RESET_ALL}")
        return 1

if __name__ == "__main__":
    # Installa colorama se non presente
    try:
        from colorama import init, Fore, Style
    except ImportError:
        print("Installazione colorama per output colorato...")
        os.system("pip install colorama")
        from colorama import init, Fore, Style
    
    exit_code = run_all_tests()
    sys.exit(exit_code)
