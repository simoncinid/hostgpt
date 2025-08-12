from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
import os
from pathlib import Path

connect_args = {}

# Se usiamo PyMySQL verso DigitalOcean, forza SSL sempre; se disponibile usa il CA
if settings.DATABASE_URL.startswith("mysql+pymysql://"):
    ssl_opts = {}
    ca_path = settings.MYSQL_SSL_CA
    if ca_path and os.path.exists(ca_path):
        ssl_opts["ca"] = ca_path
    # anche senza CA, abilita TLS (senza verifica certificato)
    connect_args["ssl"] = ssl_opts if ssl_opts else {"ssl": {}}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.ENVIRONMENT == "development",
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
