#!/usr/bin/env python
"""
Script per applicare le migrazioni del database
Esegue le modifiche necessarie per il nuovo sistema di abbonamento
"""

import sys
import os
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from config import settings
from database import engine
import logging

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    """Applica le migrazioni al database"""
    
    try:
        with engine.connect() as conn:
            # Inizia transazione
            trans = conn.begin()
            
            try:
                logger.info("Inizio applicazione migrazioni...")
                
                # 1. Aggiungi colonna verification_token se non esiste
                logger.info("Aggiunta colonna verification_token...")
                try:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN verification_token VARCHAR(255) UNIQUE
                    """))
                    logger.info("✓ Colonna verification_token aggiunta")
                except SQLAlchemyError as e:
                    if "Duplicate column name" in str(e) or "already exists" in str(e):
                        logger.info("- Colonna verification_token già esistente")
                    else:
                        raise
                
                # 2. Aggiungi colonna messages_limit se non esiste
                logger.info("Aggiunta colonna messages_limit...")
                try:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN messages_limit INT DEFAULT 1000
                    """))
                    logger.info("✓ Colonna messages_limit aggiunta")
                except SQLAlchemyError as e:
                    if "Duplicate column name" in str(e) or "already exists" in str(e):
                        logger.info("- Colonna messages_limit già esistente")
                    else:
                        raise
                
                # 3. Aggiungi colonna messages_used se non esiste
                logger.info("Aggiunta colonna messages_used...")
                try:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN messages_used INT DEFAULT 0
                    """))
                    logger.info("✓ Colonna messages_used aggiunta")
                except SQLAlchemyError as e:
                    if "Duplicate column name" in str(e) or "already exists" in str(e):
                        logger.info("- Colonna messages_used già esistente")
                    else:
                        raise
                
                # 4. Aggiungi colonna messages_reset_date se non esiste
                logger.info("Aggiunta colonna messages_reset_date...")
                try:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN messages_reset_date DATETIME
                    """))
                    logger.info("✓ Colonna messages_reset_date aggiunta")
                except SQLAlchemyError as e:
                    if "Duplicate column name" in str(e) or "already exists" in str(e):
                        logger.info("- Colonna messages_reset_date già esistente")
                    else:
                        raise
                
                # 5. Aggiorna utenti esistenti
                logger.info("Aggiornamento utenti esistenti...")
                
                # Imposta is_verified a TRUE per utenti esistenti
                conn.execute(text("""
                    UPDATE users 
                    SET is_verified = TRUE 
                    WHERE is_verified IS NULL OR is_verified = FALSE
                """))
                logger.info("✓ Utenti esistenti marcati come verificati")
                
                # Imposta messages_reset_date per utenti con abbonamento attivo
                conn.execute(text("""
                    UPDATE users 
                    SET messages_reset_date = NOW(),
                        messages_used = 0
                    WHERE subscription_status = 'active' 
                    AND messages_reset_date IS NULL
                """))
                logger.info("✓ Reset date impostata per utenti con abbonamento attivo")
                
                # 6. Crea indice per verification_token se non esiste
                logger.info("Creazione indice per verification_token...")
                try:
                    conn.execute(text("""
                        CREATE UNIQUE INDEX ix_users_verification_token 
                        ON users(verification_token)
                    """))
                    logger.info("✓ Indice verification_token creato")
                except SQLAlchemyError as e:
                    if "Duplicate key name" in str(e) or "already exists" in str(e):
                        logger.info("- Indice verification_token già esistente")
                    else:
                        raise
                
                # Commit transazione
                trans.commit()
                logger.info("\n✅ MIGRAZIONI COMPLETATE CON SUCCESSO!")
                
                # Mostra statistiche
                result = conn.execute(text("""
                    SELECT 
                        COUNT(*) as total_users,
                        SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) as active_subscriptions,
                        SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified_users
                    FROM users
                """)).fetchone()
                
                logger.info("\n📊 STATISTICHE DATABASE:")
                logger.info(f"   - Utenti totali: {result[0]}")
                logger.info(f"   - Abbonamenti attivi: {result[1]}")
                logger.info(f"   - Utenti verificati: {result[2]}")
                
            except Exception as e:
                trans.rollback()
                logger.error(f"❌ Errore durante le migrazioni: {e}")
                raise
                
    except Exception as e:
        logger.error(f"❌ Impossibile connettersi al database: {e}")
        sys.exit(1)

def verify_migration():
    """Verifica che le migrazioni siano state applicate correttamente"""
    
    try:
        with engine.connect() as conn:
            # Verifica esistenza colonne
            result = conn.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'users' 
                AND COLUMN_NAME IN ('verification_token', 'messages_limit', 'messages_used', 'messages_reset_date')
            """)).fetchall()
            
            columns = [row[0] for row in result]
            
            logger.info("\n🔍 VERIFICA MIGRAZIONI:")
            required_columns = ['verification_token', 'messages_limit', 'messages_used', 'messages_reset_date']
            
            all_present = True
            for col in required_columns:
                if col in columns:
                    logger.info(f"   ✓ Colonna {col}: presente")
                else:
                    logger.error(f"   ✗ Colonna {col}: MANCANTE")
                    all_present = False
            
            if all_present:
                logger.info("\n✅ Tutte le migrazioni sono state applicate correttamente!")
            else:
                logger.error("\n❌ Alcune migrazioni non sono state applicate. Esegui di nuovo lo script.")
                
    except Exception as e:
        logger.error(f"❌ Errore durante la verifica: {e}")

if __name__ == "__main__":
    print("\n" + "="*50)
    print("MIGRAZIONE DATABASE HOSTGPT")
    print("Nuovo sistema abbonamento: 29€/mese, 1000 messaggi")
    print("="*50 + "\n")
    
    # Chiedi conferma
    response = input("Vuoi procedere con le migrazioni? (s/n): ")
    if response.lower() != 's':
        print("Migrazioni annullate.")
        sys.exit(0)
    
    # Esegui migrazioni
    run_migrations()
    
    # Verifica
    verify_migration()
    
    print("\n" + "="*50)
    print("MIGRAZIONE COMPLETATA")
    print("Ricorda di:")
    print("1. Configurare Stripe con prezzo 29€/mese")
    print("2. Aggiornare STRIPE_PRICE_ID nel file .env")
    print("3. Riavviare il server backend")
    print("="*50 + "\n")
