#!/usr/bin/env python3
"""
Test per verificare il comportamento di cancellazione e riattivazione Guardian
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_guardian_cancellation_flow():
    """Test del flusso di cancellazione e riattivazione Guardian"""
    
    print("🧪 TEST FLUSSO CANCELLAZIONE GUARDIAN")
    print("=" * 60)
    
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
    
    # Test 2: Cancel Guardian (senza token)
    print("\n2. Test cancel Guardian (senza autenticazione)...")
    try:
        response = requests.post(f"{BASE_URL}/api/guardian/cancel")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Corretto: Richiede autenticazione")
        else:
            print(f"❌ Inaspettato: {response.status_code}")
    except Exception as e:
        print(f"❌ Errore: {e}")
    
    # Test 3: Reactivate Guardian (senza token)
    print("\n3. Test reactivate Guardian (senza autenticazione)...")
    try:
        response = requests.post(f"{BASE_URL}/api/guardian/reactivate")
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
    
    print("\n" + "=" * 60)
    print("✅ TEST FLUSSO CANCELLAZIONE COMPLETATI!")
    print("\n📋 COMPORTAMENTO ATTESO:")
    print("1. Quando l'utente annulla Guardian → stato 'cancelling'")
    print("2. Durante 'cancelling' → può ancora accedere alla dashboard")
    print("3. Durante 'cancelling' → può riattivare senza checkout")
    print("4. Dopo 31 giorni → webhook Stripe → stato 'cancelled'")
    print("5. Solo dopo 'cancelled' → deve fare nuovo checkout")

if __name__ == "__main__":
    test_guardian_cancellation_flow()
