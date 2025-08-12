#!/usr/bin/env python3
"""
Script per inizializzare il database.
Crea tutte le tabelle necessarie per HostGPT.
"""

import sys
from sqlalchemy import text
from database import engine, Base
from models import *  # Import all models to register them
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Inizializza il database creando tutte le tabelle"""
    try:
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Connessione al database riuscita")
        
        # Create all tables
        logger.info("📦 Creazione tabelle...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Tutte le tabelle sono state create con successo!")
        
        # List created tables
        with engine.connect() as conn:
            result = conn.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result]
            logger.info(f"📋 Tabelle create: {', '.join(tables)}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Errore durante l'inizializzazione del database: {e}")
        return False

if __name__ == "__main__":
    logger.info("🚀 Inizializzazione database HostGPT...")
    logger.info("-" * 50)
    
    success = init_database()
    
    if success:
        logger.info("-" * 50)
        logger.info("✨ Database inizializzato con successo!")
        logger.info("Puoi ora avviare il server con: python main.py")
        sys.exit(0)
    else:
        logger.error("Inizializzazione fallita. Controlla la configurazione del database.")
        sys.exit(1)
