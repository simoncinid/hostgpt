#!/usr/bin/env python3
"""
Script per aggiungere le colonne Free Trial al database
"""

import logging
from sqlalchemy import text
from database import engine

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_free_trial_columns():
    """Aggiunge le colonne Free Trial alla tabella users"""
    
    try:
        with engine.connect() as conn:
            # Verifica se le colonne esistono già
            result = conn.execute(text("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'users'
                AND COLUMN_NAME IN ('wants_free_trial', 'free_trial_start_date', 'free_trial_end_date', 'free_trial_messages_limit', 'free_trial_messages_used', 'free_trial_converted')
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Aggiungi colonne se non esistono
            if 'wants_free_trial' not in existing_columns:
                logger.info("Aggiunta colonna wants_free_trial...")
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN wants_free_trial BOOLEAN DEFAULT FALSE
                """))
                logger.info("✓ Colonna wants_free_trial aggiunta")
            else:
                logger.info("- Colonna wants_free_trial già esistente")
            
            if 'free_trial_start_date' not in existing_columns:
                logger.info("Aggiunta colonna free_trial_start_date...")
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN free_trial_start_date DATETIME
                """))
                logger.info("✓ Colonna free_trial_start_date aggiunta")
            else:
                logger.info("- Colonna free_trial_start_date già esistente")
            
            if 'free_trial_end_date' not in existing_columns:
                logger.info("Aggiunta colonna free_trial_end_date...")
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN free_trial_end_date DATETIME
                """))
                logger.info("✓ Colonna free_trial_end_date aggiunta")
            else:
                logger.info("- Colonna free_trial_end_date già esistente")
            
            if 'free_trial_messages_limit' not in existing_columns:
                logger.info("Aggiunta colonna free_trial_messages_limit...")
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN free_trial_messages_limit INT DEFAULT 20
                """))
                logger.info("✓ Colonna free_trial_messages_limit aggiunta")
            else:
                logger.info("- Colonna free_trial_messages_limit già esistente")
            
            if 'free_trial_messages_used' not in existing_columns:
                logger.info("Aggiunta colonna free_trial_messages_used...")
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN free_trial_messages_used INT DEFAULT 0
                """))
                logger.info("✓ Colonna free_trial_messages_used aggiunta")
            else:
                logger.info("- Colonna free_trial_messages_used già esistente")
            
            if 'free_trial_converted' not in existing_columns:
                logger.info("Aggiunta colonna free_trial_converted...")
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN free_trial_converted BOOLEAN DEFAULT FALSE
                """))
                logger.info("✓ Colonna free_trial_converted aggiunta")
            else:
                logger.info("- Colonna free_trial_converted già esistente")
            
            logger.info("✅ Tutte le colonne Free Trial sono state aggiunte con successo!")
            
    except Exception as e:
        logger.error(f"Errore durante l'aggiunta delle colonne Free Trial: {e}")
        raise

if __name__ == "__main__":
    add_free_trial_columns()
