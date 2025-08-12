from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
import os
from pathlib import Path

connect_args = {}

# Usa SOLO DATABASE_URL fornitaaaa; opzionalmente abilita SSL con CA
if settings.DATABASE_URL.startswith("mysql+pymysql://"):
    ssl_opts = {}
    # Priorità 1: contenuto CA da env (CA_CERTIFICATE)
    if getattr(settings, "CA_CERTIFICATE", None):
        ca_tmp_path = (Path(__file__).parent / "_render_ca_tmp.crt").resolve()
        with open(ca_tmp_path, "w", encoding="utf-8") as f:
            f.write(settings.CA_CERTIFICATE)
        ssl_opts["ca"] = str(ca_tmp_path)
    # Priorità 2: path statico
    elif settings.MYSQL_SSL_CA and os.path.exists(settings.MYSQL_SSL_CA):
        ssl_opts["ca"] = settings.MYSQL_SSL_CA
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
