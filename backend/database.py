from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
import os
from pathlib import Path
import time
import socket
import logging

logger = logging.getLogger(__name__)

connect_args = {}

# Se usiamo PyMySQL verso DigitalOcean, forza SSL sempre; se disponibile usa il CA
if settings.DATABASE_URL.startswith("mysql+pymysql://"):
    ssl_opts = {}
    # Priorità 1: contenuto CA da env (CA_CERTIFICATE)
    if settings.CA_CERTIFICATE:
        # Scrivi il contenuto su file temporaneo all'avvio
        ca_tmp_path = str((Path(__file__).parent / "_render_ca_tmp.crt").resolve())
        try:
            with open(ca_tmp_path, "w", encoding="utf-8") as f:
                f.write(settings.CA_CERTIFICATE)
            ssl_opts["ca"] = ca_tmp_path
        except Exception as e:
            logger.error(f"Failed writing CA_CERTIFICATE to file: {e}")
    else:
        # Priorità 2: path statico
        ca_path = settings.MYSQL_SSL_CA
        if ca_path and os.path.exists(ca_path):
            ssl_opts["ca"] = ca_path
    # abilita TLS; se non abbiamo CA, tenterà comunque handshake TLS
    connect_args["ssl"] = ssl_opts if ssl_opts else {"ssl": {}}

def _build_engine(db_url: str):
    """Crea un engine SQLAlchemy con SSL se possibile."""
    connect_args_local = dict(connect_args)
    return create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=settings.ENVIRONMENT == "development",
        connect_args=connect_args_local
    )

def _try_connect(engine_candidate) -> bool:
    try:
        with engine_candidate.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as exc:
        logger.error(f"DB connection test failed: {exc}")
        return False

def _alternate_host(url: str) -> str:
    """Prova a scambiare il segmento host DigitalOcean tra '0.b.db' e '0.1.db'."""
    if "-0.b.db." in url:
        return url.replace("-0.b.db.", "-0.1.db.")
    if "-0.1.db." in url:
        return url.replace("-0.1.db.", "-0.b.db.")
    return url

# Costruisci engine con fallback automatici su DNS/host
candidate_urls = [settings.DATABASE_URL]

# Se definito un fallback esplicito via env, provalo dopo
fallback_env = os.getenv("DATABASE_URL_FALLBACK")
if fallback_env:
    candidate_urls.append(fallback_env)

# Aggiungi variante host DO alternata
candidate_urls.append(_alternate_host(settings.DATABASE_URL))

engine = None
for idx, url in enumerate(candidate_urls):
    try:
        eng = _build_engine(url)
        if _try_connect(eng):
            engine = eng
            if url != settings.DATABASE_URL:
                logger.warning(f"Using fallback DATABASE_URL variant: {url}")
            break
    except Exception as e:
        logger.error(f"Engine build failed for url {url}: {e}")

if engine is None:
    # Ultimo tentativo con piccoli retry (es. DNS propagation)
    eng = _build_engine(settings.DATABASE_URL)
    for attempt in range(1, 4):
        logger.warning(f"Retry DB connection attempt {attempt}/3 ...")
        if _try_connect(eng):
            engine = eng
            break
        time.sleep(2 * attempt)

if engine is None:
    raise RuntimeError("Impossibile connettersi al database: verifica DATABASE_URL e DNS (DigitalOcean host)")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
