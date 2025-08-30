#!/usr/bin/env python3
"""
Script di test per la funzionalità referral code
"""

import requests
import json
from datetime import datetime

# Configurazione
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def test_referral_validation():
    """Testa la validazione del referral code"""
    print("=== Test Validazione Referral Code ===")
    
    # Test con codice valido
    response = requests.post(f"{BASE_URL}/api/referral/validate", 
                           json={"code": "RUZZIPRIV"})
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Codice valido: {data}")
    else:
        print(f"❌ Errore validazione: {response.status_code} - {response.text}")
    
    # Test con codice non valido
    response = requests.post(f"{BASE_URL}/api/referral/validate", 
                           json={"code": "CODICEINVALIDO"})
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Codice non valido gestito correttamente: {data}")
    else:
        print(f"❌ Errore validazione codice non valido: {response.status_code} - {response.text}")

def test_referral_stats():
    """Testa le statistiche dei referral codes"""
    print("\n=== Test Statistiche Referral ===")
    
    response = requests.get(f"{BASE_URL}/api/referral/stats")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Statistiche recuperate: {json.dumps(data, indent=2)}")
    else:
        print(f"❌ Errore statistiche: {response.status_code} - {response.text}")

def test_database_connection():
    """Testa la connessione al database e verifica le tabelle"""
    print("\n=== Test Connessione Database ===")
    
    try:
        from database import get_db
        from models import ReferralCode, User
        
        db = next(get_db())
        
        # Conta referral codes
        codes_count = db.query(ReferralCode).count()
        print(f"✅ Referral codes nel database: {codes_count}")
        
        # Conta utenti con referral code
        users_with_referral = db.query(User).filter(User.referral_code_id.isnot(None)).count()
        print(f"✅ Utenti con referral code: {users_with_referral}")
        
        # Mostra il codice RUZZIPRIV
        ruzzipriv = db.query(ReferralCode).filter(ReferralCode.code == "RUZZIPRIV").first()
        if ruzzipriv:
            print(f"✅ Codice RUZZIPRIV trovato: {ruzzipriv.code} - Bonus: {ruzzipriv.bonus_messages} messaggi")
        else:
            print("❌ Codice RUZZIPRIV non trovato")
            
    except Exception as e:
        print(f"❌ Errore connessione database: {e}")

if __name__ == "__main__":
    print("🚀 Avvio test funzionalità referral code")
    print(f"📅 Data e ora: {datetime.now()}")
    
    # Test connessione database
    test_database_connection()
    
    # Test API (richiedono che il server sia in esecuzione)
    print("\n" + "="*50)
    print("⚠️  I seguenti test richiedono che il server sia in esecuzione")
    print("   Avvia il server con: python main.py")
    print("="*50)
    
    try:
        test_referral_validation()
        test_referral_stats()
    except requests.exceptions.ConnectionError:
        print("❌ Impossibile connettersi al server. Assicurati che sia in esecuzione su http://localhost:8000")
    except Exception as e:
        print(f"❌ Errore durante i test API: {e}")
    
    print("\n✅ Test completati!")
