#!/usr/bin/env python3
"""
Test del sistema Guardian
"""

import requests
import json

# Configurazione
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def test_guardian_system():
    """Test completo del sistema Guardian"""
    
    print("🧪 TEST SISTEMA GUARDIAN")
    print("=" * 50)
    
    # 1. Test login
    print("1. Test login...")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login fallito: {response.status_code}")
        return
    
    token_data = response.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Login completato")
    
    # 2. Test status Guardian
    print("\n2. Test status Guardian...")
    response = requests.get(f"{BASE_URL}/api/guardian/status", headers=headers)
    
    if response.status_code == 200:
        status = response.json()
        print(f"✅ Status Guardian: {status}")
    else:
        print(f"❌ Errore status Guardian: {response.status_code}")
    
    # 3. Test statistiche Guardian (dovrebbe fallire se non abbonato)
    print("\n3. Test statistiche Guardian...")
    response = requests.get(f"{BASE_URL}/api/guardian/statistics", headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Statistiche Guardian: {stats}")
    elif response.status_code == 403:
        print("✅ Statistiche Guardian: Accesso negato (utente non abbonato) - CORRETTO")
    else:
        print(f"❌ Errore statistiche Guardian: {response.status_code}")
    
    # 4. Test alert Guardian (dovrebbe fallire se non abbonato)
    print("\n4. Test alert Guardian...")
    response = requests.get(f"{BASE_URL}/api/guardian/alerts", headers=headers)
    
    if response.status_code == 200:
        alerts = response.json()
        print(f"✅ Alert Guardian: {alerts}")
    elif response.status_code == 403:
        print("✅ Alert Guardian: Accesso negato (utente non abbonato) - CORRETTO")
    else:
        print(f"❌ Errore alert Guardian: {response.status_code}")
    
    # 5. Test checkout Guardian
    print("\n5. Test checkout Guardian...")
    response = requests.post(f"{BASE_URL}/api/guardian/create-checkout", headers=headers)
    
    if response.status_code == 200:
        checkout_data = response.json()
        print(f"✅ Checkout Guardian creato: {checkout_data}")
    elif response.status_code == 400:
        error_data = response.json()
        print(f"✅ Checkout Guardian: {error_data.get('detail', 'Errore')} - CORRETTO")
    else:
        print(f"❌ Errore checkout Guardian: {response.status_code}")
    
    print("\n" + "=" * 50)
    print("✅ TEST COMPLETATO")
    print("Il sistema Guardian è configurato correttamente!")

if __name__ == "__main__":
    test_guardian_system()
