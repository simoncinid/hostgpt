#!/usr/bin/env python3
"""
Script per aggiungere le colonne Guardian al database
"""

import logging
from sqlalchemy import text
from database import engine

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_guardian_columns():
    """Aggiunge le colonne Guardian alla tabella users"""
    
    try:
        with engine.connect() as conn:
            # Verifica se le colonne esistono già
            result = conn.execute(text("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'users'
                AND COLUMN_NAME IN ('guardian_subscription_status', 'guardian_subscription_end_date', 'guardian_stripe_subscription_id')
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Aggiungi colonne se non esistono
            if 'guardian_subscription_status' not in existing_columns:
                logger.info("Aggiunta colonna guardian_subscription_status...")
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN guardian_subscription_status VARCHAR(50) DEFAULT 'inactive'
                """))
                logger.info("✓ Colonna guardian_subscription_status aggiunta")
            else:
                logger.info("- Colonna guardian_subscription_status già esistente")
            
            if 'guardian_subscription_end_date' not in existing_columns:
                logger.info("Aggiunta colonna guardian_subscription_end_date...")
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN guardian_subscription_end_date DATETIME
                """))
                logger.info("✓ Colonna guardian_subscription_end_date aggiunta")
            else:
                logger.info("- Colonna guardian_subscription_end_date già esistente")
            
            if 'guardian_stripe_subscription_id' not in existing_columns:
                logger.info("Aggiunta colonna guardian_stripe_subscription_id...")
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN guardian_stripe_subscription_id VARCHAR(255)
                """))
                logger.info("✓ Colonna guardian_stripe_subscription_id aggiunta")
            else:
                logger.info("- Colonna guardian_stripe_subscription_id già esistente")
            
            # Crea tabelle Guardian se non esistono
            logger.info("Creazione tabella guest_satisfaction...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS guest_satisfaction (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    chatbot_id INT NOT NULL,
                    guest_identifier VARCHAR(255),
                    satisfaction_score FLOAT DEFAULT 5.0,
                    sentiment_score FLOAT DEFAULT 0.0,
                    risk_level VARCHAR(20) DEFAULT 'low',
                    detected_issues JSON,
                    resolution_status VARCHAR(20) DEFAULT 'pending',
                    interventions_made JSON,
                    recovery_offers JSON,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (chatbot_id) REFERENCES chatbots(id)
                )
            """))
            logger.info("✓ Tabella guest_satisfaction creata")
            
            logger.info("Creazione tabella satisfaction_alerts...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS satisfaction_alerts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    satisfaction_id INT NOT NULL,
                    alert_type VARCHAR(50),
                    severity VARCHAR(20),
                    message TEXT,
                    suggested_action TEXT,
                    is_resolved BOOLEAN DEFAULT FALSE,
                    resolved_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (satisfaction_id) REFERENCES guest_satisfaction(id)
                )
            """))
            logger.info("✓ Tabella satisfaction_alerts creata")
            
            conn.commit()
            logger.info("✅ Tutte le colonne e tabelle Guardian sono state aggiunte con successo!")
            
    except Exception as e:
        logger.error(f"Errore durante l'aggiunta delle colonne Guardian: {e}")
        raise

if __name__ == "__main__":
    print("=" * 50)
    print("AGGIUNTA COLONNE GUARDIAN AL DATABASE")
    print("=" * 50)
    
    add_guardian_columns()
    
    print("\n✅ COLONNE GUARDIAN AGGIUNTE CON SUCCESSO!")
    print("Ora puoi utilizzare il servizio Guardian nella piattaforma.")
