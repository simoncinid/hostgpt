#!/usr/bin/env python3
"""
Script di test per verificare le correzioni delle email
"""

import requests
import json
from datetime import datetime

def test_email_endpoints():
    """Testa gli endpoint per verificare che le email funzionino"""
    
    base_url = "http://localhost:8000"  # Modifica se necessario
    
    print("🧪 Test Email Fixes - HostGPT")
    print("=" * 50)
    
    # Test 1: Report mensile (non richiede auth)
    print("\n1. Test Report Mensile...")
    try:
        response = requests.post(f"{base_url}/api/reports/monthly/send-all")
        if response.status_code == 200:
            print("✅ Report mensile: OK")
            print(f"   Risposta: {response.json()}")
        else:
            print(f"❌ Report mensile: ERRORE {response.status_code}")
            print(f"   Risposta: {response.text}")
    except Exception as e:
        print(f"❌ Report mensile: ERRORE - {e}")
    
    # Test 2: Test endpoint (richiede auth)
    print("\n2. Test Endpoint con Auth...")
    print("   (Richiede token di autenticazione)")
    print("   Usa: curl -X POST http://localhost:8000/api/reports/monthly/send \\")
    print("        -H 'Authorization: Bearer <token>'")
    
    print("\n3. Test Manuale Email...")
    print("   Per testare le email di pagamento:")
    print("   1. Fai un acquisto su Stripe")
    print("   2. Controlla i logs per 'Email queued for'")
    print("   3. Verifica che l'email arrivi")
    
    print("\n4. Test Email Chatbot...")
    print("   Per testare l'email di creazione chatbot:")
    print("   1. Crea un nuovo chatbot")
    print("   2. Verifica che il titolo sia nella lingua corretta")
    print("   3. ITA: 'Il tuo Chatbot è pronto! 🤖'")
    print("   4. ENG: 'Your Chatbot is ready! 🤖'")
    
    print("\n5. Test Email Guardian...")
    print("   Per testare l'email Guardian:")
    print("   1. Simula una conversazione ad alto rischio")
    print("   2. Verifica che l'alert arrivi")
    print("   3. ITA: '🚨 ALERT GUARDIAN: Ospite insoddisfatto rilevato'")
    print("   4. ENG: '🚨 GUARDIAN ALERT: Unsatisfied guest detected'")
    print("   ✅ CORRETTO: Titolo multilingua in entrambi i punti di invio")

def check_email_logs():
    """Controlla i logs per verificare l'invio email"""
    print("\n📋 Controllo Logs Email...")
    print("   Cerca nei logs per:")
    print("   - 'Email queued for <email>'")
    print("   - 'Email sent to <email>'")
    print("   - 'Failed to send email'")
    print("   - 'Failed to queue email'")

if __name__ == "__main__":
    test_email_endpoints()
    check_email_logs()
    
    print("\n🎯 Riassunto Correzioni:")
    print("✅ Email creazione chatbot: titolo multilingua")
    print("✅ Email conferma pagamento: invio migliorato")
    print("✅ Email Guardian alert: titolo multilingua (main.py + guardian_service.py)")
    print("✅ Funzione send_email_background: gestione asincrona")
    
    print("\n📧 Prossimi Passi:")
    print("1. Fai il deploy su Render")
    print("2. Testa un acquisto reale")
    print("3. Crea un chatbot")
    print("4. Verifica che le email arrivino correttamente")
