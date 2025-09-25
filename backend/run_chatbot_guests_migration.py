#!/usr/bin/env python3
"""
Script per eseguire la migrazione della tabella chatbot_guests
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from alembic.config import Config
from alembic import command
from database import engine
from sqlalchemy import text

def run_migration():
    """Esegue la migrazione per aggiungere la tabella chatbot_guests"""
    
    print("🔄 Avvio migrazione chatbot_guests...")
    
    try:
        # Configurazione Alembic
        alembic_cfg = Config("alembic.ini")
        
        # Esegui la migrazione
        command.upgrade(alembic_cfg, "add_chatbot_guests_table")
        
        print("✅ Migrazione chatbot_guests completata con successo!")
        
        # Verifica che la tabella sia stata creata
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM chatbot_guests"))
            count = result.scalar()
            print(f"📊 Tabella chatbot_guests creata con successo. Record attuali: {count}")
            
    except Exception as e:
        print(f"❌ Errore durante la migrazione: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
