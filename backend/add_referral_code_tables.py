from sqlalchemy import create_engine, text
from config import settings
from models import ReferralCode
from datetime import datetime

def add_referral_code_tables():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Crea la tabella referral_codes
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS referral_codes (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                description VARCHAR(255),
                bonus_messages INTEGER DEFAULT 100,
                is_active BOOLEAN DEFAULT TRUE,
                max_uses INTEGER,
                current_uses INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP
            )
        """))
        
        # Aggiungi le colonne referral_code_id e referral_code_used_at alla tabella users
        # Verifica se le colonne esistono già prima di aggiungerle
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN referral_code_id INTEGER
            """))
            print("Colonna referral_code_id aggiunta")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Colonna referral_code_id già esistente")
            else:
                raise e
        
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN referral_code_used_at TIMESTAMP
            """))
            print("Colonna referral_code_used_at aggiunta")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Colonna referral_code_used_at già esistente")
            else:
                raise e
        
        # Crea indici per migliorare le performance
        try:
            conn.execute(text("""
                CREATE INDEX idx_referral_codes_code ON referral_codes(code)
            """))
            print("Indice idx_referral_codes_code creato")
        except Exception as e:
            if "Duplicate key name" in str(e):
                print("Indice idx_referral_codes_code già esistente")
            else:
                raise e
        
        try:
            conn.execute(text("""
                CREATE INDEX idx_users_referral_code_id ON users(referral_code_id)
            """))
            print("Indice idx_users_referral_code_id creato")
        except Exception as e:
            if "Duplicate key name" in str(e):
                print("Indice idx_users_referral_code_id già esistente")
            else:
                raise e
        
        # Inserisci il codice referral di default RUZZIPRIV
        try:
            conn.execute(text("""
                INSERT INTO referral_codes (code, description, bonus_messages, is_active, max_uses, current_uses)
                VALUES ('RUZZIPRIV', 'Codice referral speciale', 100, TRUE, NULL, 0)
            """))
            print("Codice referral 'RUZZIPRIV' creato con 100 messaggi bonus")
        except Exception as e:
            if "Duplicate entry" in str(e):
                print("Codice referral 'RUZZIPRIV' già esistente")
            else:
                raise e
        
        conn.commit()
        print("Tabelle e colonne per referral codes aggiunte con successo!")
        print("Codice referral 'RUZZIPRIV' creato con 100 messaggi bonus")

if __name__ == "__main__":
    add_referral_code_tables()
