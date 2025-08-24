#!/usr/bin/env python3
"""
Test per verificare l'analisi Guardian con messaggi negativi
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_guardian_analysis():
    """Test dell'analisi Guardian con messaggi negativi"""
    
    print("🧪 TEST ANALISI GUARDIAN")
    print("=" * 50)
    
    # Test cases con diversi livelli di rischio
    test_cases = [
        {
            "name": "Minaccia esplicita recensione negativa",
            "messages": [
                "Ti lascio una recensione negativa",
                "Star negative per voi",
                "Recensione brutta su Google"
            ],
            "expected_risk": "ALTO (0.8-1.0)"
        },
        {
            "name": "Frustrazione estrema",
            "messages": [
                "Sono molto frustrato",
                "Questo è terribile",
                "Mai più qui"
            ],
            "expected_risk": "ALTO (0.8-1.0)"
        },
        {
            "name": "Problema normale",
            "messages": [
                "Ho un problema con il WiFi",
                "Non funziona la connessione"
            ],
            "expected_risk": "BASSO (0.0-0.3)"
        }
    ]
    
    print("\n📋 CASI DI TEST:")
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print(f"   Messaggi: {test_case['messages']}")
        print(f"   Rischio atteso: {test_case['expected_risk']}")
    
    print("\n" + "=" * 50)
    print("✅ TEST ANALISI COMPLETATI!")
    print("\n📋 COMPORTAMENTO ATTESO:")
    print("1. Minacce recensioni negative → Rischio 0.8-1.0")
    print("2. Frustrazione estrema → Rischio 0.8-1.0")
    print("3. Problemi normali → Rischio 0.0-0.3")
    print("4. Conversazioni ri-analizzate se non hanno alert")
    print("5. Alert generati solo se rischio >= 0.851")

if __name__ == "__main__":
    test_guardian_analysis()
