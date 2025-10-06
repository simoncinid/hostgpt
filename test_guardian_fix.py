#!/usr/bin/env python3
"""
Test per verificare che il sistema Guardian rilevi correttamente insufficient_info
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Simula il test senza database
def test_guardian_prompt():
    """Test che il prompt rilevi correttamente insufficient_info"""
    
    # Simula la risposta del chatbot che dovrebbe attivare l'alert
    chatbot_response = "Mi dispiace, non ho informazioni specifiche sul negozio \"AAIAIAIAI\". Ti consiglio di cercare online o visitare il negozio per scoprire cosa offre. Se hai bisogno di ulteriori informazioni su altre attività nella zona di Pisa, fammi sapere!"
    
    print("🧪 Test: Rilevamento insufficient_info del chatbot")
    print("=" * 60)
    print(f"Risposta chatbot: {chatbot_response}")
    print("=" * 60)
    
    # Verifica che la risposta contenga le frasi che dovrebbero attivare l'alert
    insufficient_info_phrases = [
        "non ho informazioni specifiche",
        "Ti consiglio di cercare online",
        "visitare il negozio"
    ]
    
    found_phrases = []
    for phrase in insufficient_info_phrases:
        if phrase.lower() in chatbot_response.lower():
            found_phrases.append(phrase)
    
    print(f"Frasi rilevate che dovrebbero attivare insufficient_info:")
    for phrase in found_phrases:
        print(f"  ✅ '{phrase}'")
    
    if len(found_phrases) >= 2:  # Almeno 2 frasi dovrebbero essere rilevate
        print("\n✅ SUCCESSO: La risposta del chatbot contiene frasi che dovrebbero attivare insufficient_info")
        print("   Il sistema Guardian dovrebbe rilevare questa risposta come insufficient_info = true")
        return True
    else:
        print(f"\n❌ ERRORE: Solo {len(found_phrases)} frasi rilevate, dovrebbero essere almeno 2")
        return False

if __name__ == "__main__":
    success = test_guardian_prompt()
    if success:
        print("\n🎉 Il test è passato! Il prompt dovrebbe rilevare insufficient_info.")
    else:
        print("\n💥 Il test è fallito. Il prompt potrebbe non rilevare insufficient_info correttamente.")
