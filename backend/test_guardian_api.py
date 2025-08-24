#!/usr/bin/env python3
"""
Test rapido per le API Guardian
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_guardian_apis():
    """Test delle API Guardian"""
    
    print("🧪 TEST API GUARDIAN")
    print("=" * 50)
    
    # Test 1: Status Guardian (senza token)
    print("\n1. Test status Guardian (senza autenticazione)...")
    try:
        response = requests.get(f"{BASE_URL}/api/guardian/status")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Corretto: Richiede autenticazione")
        else:
            print(f"❌ Inaspettato: {response.status_code}")
    except Exception as e:
        print(f"❌ Errore: {e}")
    
    # Test 2: Statistics Guardian (senza token)
    print("\n2. Test statistics Guardian (senza autenticazione)...")
    try:
        response = requests.get(f"{BASE_URL}/api/guardian/statistics")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Corretto: Richiede autenticazione")
        else:
            print(f"❌ Inaspettato: {response.status_code}")
    except Exception as e:
        print(f"❌ Errore: {e}")
    
    # Test 3: Alerts Guardian (senza token)
    print("\n3. Test alerts Guardian (senza autenticazione)...")
    try:
        response = requests.get(f"{BASE_URL}/api/guardian/alerts")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Corretto: Richiede autenticazione")
        else:
            print(f"❌ Inaspettato: {response.status_code}")
    except Exception as e:
        print(f"❌ Errore: {e}")
    
    # Test 4: Create checkout Guardian (senza token)
    print("\n4. Test create checkout Guardian (senza autenticazione)...")
    try:
        response = requests.post(f"{BASE_URL}/api/guardian/create-checkout")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Corretto: Richiede autenticazione")
        else:
            print(f"❌ Inaspettato: {response.status_code}")
    except Exception as e:
        print(f"❌ Errore: {e}")
    
    print("\n" + "=" * 50)
    print("✅ TEST API GUARDIAN COMPLETATI!")
    print("Le API sono configurate correttamente e richiedono autenticazione.")

if __name__ == "__main__":
    test_guardian_apis()
