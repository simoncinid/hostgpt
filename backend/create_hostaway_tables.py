#!/usr/bin/env python3
"""
Script per creare le tabelle per l'integrazione Hostaway
"""

import sys
import os

# Aggiungi il percorso del backend al PYTHONPATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from models import Base, HostawayMapping, HostawayApiKey

def create_hostaway_tables():
    """Crea le tabelle per l'integrazione Hostaway"""
    try:
        print("Creazione tabelle per integrazione Hostaway...")
        
        # Crea solo le nuove tabelle
        HostawayMapping.__table__.create(engine, checkfirst=True)
        HostawayApiKey.__table__.create(engine, checkfirst=True)
        
        print("✅ Tabelle create con successo:")
        print("  - hostaway_mappings")
        print("  - hostaway_api_keys")
        
    except Exception as e:
        print(f"❌ Errore nella creazione delle tabelle: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = create_hostaway_tables()
    sys.exit(0 if success else 1)
