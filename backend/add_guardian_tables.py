#!/usr/bin/env python3
"""
Script per aggiungere le tabelle Guardian al database
"""

import logging
from sqlalchemy import text
from database import engine

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_guardian_tables():
    """Aggiunge le tabelle Guardian al database"""
    
    try:
        with engine.connect() as conn:
            # Verifica se le tabelle esistono già
            result = conn.execute(text("""
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME IN ('guardian_alerts', 'guardian_analyses')
            """))
            
            existing_tables = [row[0] for row in result.fetchall()]
            
            # Aggiungi colonne Guardian alla tabella conversations se non esistono
            logger.info("Verifica colonne Guardian in conversations...")
            result = conn.execute(text("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'conversations'
                AND COLUMN_NAME IN ('guardian_analyzed', 'guardian_risk_score', 'guardian_alert_triggered')
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            if 'guardian_analyzed' not in existing_columns:
                logger.info("Aggiunta colonna guardian_analyzed...")
                conn.execute(text("""
                    ALTER TABLE conversations
                    ADD COLUMN guardian_analyzed BOOLEAN DEFAULT FALSE
                """))
                logger.info("✓ Colonna guardian_analyzed aggiunta")
            else:
                logger.info("- Colonna guardian_analyzed già esistente")
            
            if 'guardian_risk_score' not in existing_columns:
                logger.info("Aggiunta colonna guardian_risk_score...")
                conn.execute(text("""
                    ALTER TABLE conversations
                    ADD COLUMN guardian_risk_score FLOAT DEFAULT 0.0
                """))
                logger.info("✓ Colonna guardian_risk_score aggiunta")
            else:
                logger.info("- Colonna guardian_risk_score già esistente")
            
            if 'guardian_alert_triggered' not in existing_columns:
                logger.info("Aggiunta colonna guardian_alert_triggered...")
                conn.execute(text("""
                    ALTER TABLE conversations
                    ADD COLUMN guardian_alert_triggered BOOLEAN DEFAULT FALSE
                """))
                logger.info("✓ Colonna guardian_alert_triggered aggiunta")
            else:
                logger.info("- Colonna guardian_alert_triggered già esistente")
            
            # Crea tabella guardian_alerts se non esiste
            if 'guardian_alerts' not in existing_tables:
                logger.info("Creazione tabella guardian_alerts...")
                conn.execute(text("""
                    CREATE TABLE guardian_alerts (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        conversation_id INT NOT NULL,
                        alert_type VARCHAR(50) DEFAULT 'negative_review_risk',
                        severity VARCHAR(20) DEFAULT 'high',
                        risk_score FLOAT NOT NULL,
                        message TEXT NOT NULL,
                        suggested_action TEXT,
                        conversation_summary TEXT,
                        is_resolved BOOLEAN DEFAULT FALSE,
                        resolved_at DATETIME,
                        resolved_by VARCHAR(255),
                        email_sent BOOLEAN DEFAULT FALSE,
                        email_sent_at DATETIME,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                    )
                """))
                logger.info("✓ Tabella guardian_alerts creata")
            else:
                logger.info("- Tabella guardian_alerts già esistente")
            
            # Crea tabella guardian_analyses se non esiste
            if 'guardian_analyses' not in existing_tables:
                logger.info("Creazione tabella guardian_analyses...")
                conn.execute(text("""
                    CREATE TABLE guardian_analyses (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        conversation_id INT NOT NULL,
                        risk_score FLOAT NOT NULL,
                        sentiment_score FLOAT DEFAULT 0.0,
                        confidence_score FLOAT DEFAULT 0.0,
                        analysis_details JSON,
                        user_messages_analyzed INT DEFAULT 0,
                        conversation_length INT DEFAULT 0,
                        analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                    )
                """))
                logger.info("✓ Tabella guardian_analyses creata")
            else:
                logger.info("- Tabella guardian_analyses già esistente")
            
            conn.commit()
            logger.info("✅ Tutte le tabelle e colonne Guardian sono state aggiunte con successo!")
            
    except Exception as e:
        logger.error(f"Errore durante l'aggiunta delle tabelle Guardian: {e}")
        raise

if __name__ == "__main__":
    print("=" * 50)
    print("AGGIUNTA TABELLE GUARDIAN AL DATABASE")
    print("=" * 50)
    
    add_guardian_tables()
    
    print("\n✅ TABELLE GUARDIAN AGGIUNTE CON SUCCESSO!")
    print("Ora puoi utilizzare il sistema Guardian completo nella piattaforma.")
